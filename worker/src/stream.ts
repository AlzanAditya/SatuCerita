/**
 * GET /api/orders/:invoice/events  — Server-Sent Events (backend -> browser), BUKAN webhook dan BUKAN polling.
 *
 * Keamanan & batas:
 *  - Wajib login; hanya PEMILIK pesanan (filter user_id di query) -> pesanan orang lain = 404 (sama seperti GET order).
 *  - Event berisi status minimal saja (lihat OrderEvent di hub.ts): tanpa VA, nominal, nama, email, token.
 *  - Ditutup server ketika status final, atau setelah MAX_LIFETIME_MS (klien lalu reconnect & menerima snapshot baru).
 *  - Heartbeat berkala agar proxy tidak memutus koneksi diam.
 *  - Dibatasi per user (RL_STREAM) dan per pesanan (MAX_SUBSCRIBERS di hub).
 *  - Tidak memanggil Midtrans sama sekali. Hanya membaca database.
 */
import type { Env } from "./types";
import { json } from "./http";
import { allow } from "./ratelimit";
import { getOwnedOrder, requireUser } from "./orders";
import { isFinalStatus } from "./state";
import { openHubStream, sseComment, sseFrame, sseRetry, toOrderEvent } from "./hub";

export const STREAM_LIMITS = { maxLifetimeMs: 4 * 60_000, heartbeatMs: 20_000 };

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-store, no-transform",
  "X-Content-Type-Options": "nosniff",
  "X-Accel-Buffering": "no",
};

function sseResponse(body: ReadableStream<Uint8Array>, cookies: string[]): Response {
  const h = new Headers(SSE_HEADERS);
  cookies.forEach((c) => h.append("Set-Cookie", c));
  return new Response(body, { status: 200, headers: h });
}

export async function streamOrder(env: Env, req: Request, invoice: string): Promise<Response> {
  const a = await requireUser(env, req);
  if (a instanceof Response) return a;

  if (!(await allow(env.RL_STREAM, a.user.id))) {
    return json({ error: "Terlalu banyak koneksi. Coba lagi sebentar lagi." }, 429, a.cookies);
  }

  const first = await getOwnedOrder(env, a.user.id, invoice).catch(() => null);
  if (!first) return json({ error: "Pesanan tidak ditemukan." }, 404, a.cookies);

  // Sudah final: kirim satu snapshot lalu tutup. Tidak perlu hub / koneksi panjang.
  if (isFinalStatus(first.status)) {
    return sseResponse(oneShot(first), a.cookies);
  }

  // Tanpa Durable Object (belum di-deploy / binding tidak ada) -> beri tahu klien supaya memakai fallback polling DB.
  const hub = await openHubStream(env, first.invoice_no);
  if (!hub || !hub.body) {
    return json({ error: "Realtime belum tersedia." }, 503, a.cookies);
  }
  if (hub.status === 429) {
    hub.body.cancel().catch(() => undefined);
    return json({ error: "Terlalu banyak koneksi untuk pesanan ini." }, 429, a.cookies);
  }

  // URUTAN PENTING: subscribe ke hub DULU, baru baca snapshot dari DB. Perubahan yang terjadi di antaranya
  // sudah tertampung di aliran hub, sehingga tidak ada event yang terlewat.
  const snap = (await getOwnedOrder(env, a.user.id, invoice).catch(() => null)) ?? first;
  const reader = hub.body.getReader();

  let closed = false;
  let hb: ReturnType<typeof setInterval> | undefined;
  let life: ReturnType<typeof setTimeout> | undefined;
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | undefined;

  const cleanup = () => {
    if (closed) return;
    closed = true;
    if (hb !== undefined) clearInterval(hb);
    if (life !== undefined) clearTimeout(life);
    reader.cancel().catch(() => undefined); // melepas pelanggan di hub
    try { controllerRef?.close(); } catch { /* sudah tertutup */ }
  };

  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      controllerRef = controller;
      controller.enqueue(sseRetry());
      controller.enqueue(sseFrame(toOrderEvent(snap)));
      if (isFinalStatus(snap.status)) { cleanup(); return; }

      const safe = (chunk: Uint8Array) => { if (!closed) { try { controller.enqueue(chunk); } catch { cleanup(); } } };
      hb = setInterval(() => safe(sseComment("ping")), STREAM_LIMITS.heartbeatMs);
      life = setTimeout(cleanup, STREAM_LIMITS.maxLifetimeMs);
      (hb as unknown as { unref?: () => void }).unref?.();
      (life as unknown as { unref?: () => void }).unref?.();

      // Teruskan frame dari hub ke klien sampai hub menutup (status final) atau klien pergi.
      void (async () => {
        try {
          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            if (value) safe(value);
          }
        } catch { /* hub putus: klien akan reconnect */ }
        cleanup();
      })();
    },
    cancel() { cleanup(); },
  });
  return sseResponse(body, a.cookies);
}

function oneShot(order: Parameters<typeof toOrderEvent>[0]): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(c) {
      c.enqueue(sseRetry());
      c.enqueue(sseFrame(toOrderEvent(order)));
      c.close();
    },
  });
}
