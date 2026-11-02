/**
 * Hub realtime status pembayaran: backend -> browser (Server-Sent Events) lewat Cloudflare Durable Object.
 *
 *   Midtrans --webhook--> Worker --(DB diperbarui)--> publishOrderEvent() --> PaymentHub[invoice] --SSE--> browser
 *
 * Tiga mekanisme TERPISAH (jangan dicampur):
 *  1. Webhook   : Midtrans -> Worker (server ke server).               Lihat webhook.ts
 *  2. Hub + SSE : Worker -> browser (mendorong perubahan status).       File ini + stream.ts
 *  3. Polling   : fallback browser -> Worker -> DATABASE (tidak ke Midtrans). Lihat src/lib/orderStream.ts
 *
 * Prinsip:
 *  - DATABASE tetap sumber kebenaran. Hub hanya "lonceng": event berisi status minimal, tanpa data sensitif.
 *  - Satu Durable Object per invoice (idFromName). Tidak ada layanan eksternal baru.
 *  - Publish bersifat best-effort: jika gagal, DB sudah benar; browser mengejar lewat snapshot saat reconnect.
 *  - Class ini sengaja TIDAK meng-extend `DurableObject` dari "cloudflare:workers" supaya bundle esbuild
 *    (platform neutral) & tes Node tetap sederhana; bentuk lama (constructor + fetch) didukung penuh oleh Workers.
 */
import type { Env } from "./types";
import { hasPaymentInfo, isFinalStatus } from "./state";

/** Event ke browser. SENGAJA tanpa nomor VA, nominal, nama, email, atau token apa pun. */
export interface OrderEvent {
  invoiceNo: string;
  status: string;
  paidAt: string | null;
  paymentReady: boolean;
  updatedAt: string;
}

interface OrderLike {
  invoice_no: string;
  status: string;
  paid_at: string | null;
  payment_info: Record<string, string> | null;
  updated_at?: string | null;
}

export function toOrderEvent(o: OrderLike): OrderEvent {
  return {
    invoiceNo: o.invoice_no,
    status: o.status,
    paidAt: o.paid_at ?? null,
    paymentReady: hasPaymentInfo(o.payment_info),
    updatedAt: o.updated_at || new Date().toISOString(),
  };
}

const enc = new TextEncoder();
export const SSE_RETRY_MS = 5000;

/** Satu frame SSE. `id` = waktu pembaruan (monoton), berguna untuk debugging; klien tidak bergantung padanya. */
export function sseFrame(e: OrderEvent): Uint8Array {
  const id = Date.parse(e.updatedAt) || Date.now();
  return enc.encode(`event: status\nid: ${id}\ndata: ${JSON.stringify(e)}\n\n`);
}
export const sseComment = (text: string): Uint8Array => enc.encode(`: ${text}\n\n`);
export const sseRetry = (): Uint8Array => enc.encode(`retry: ${SSE_RETRY_MS}\n\n`);

/** Batas koneksi bersamaan per pesanan (mis. banyak tab) supaya tidak bisa disalahgunakan. */
const MAX_SUBSCRIBERS = 8;

export class PaymentHub {
  private subs = new Set<ReadableStreamDefaultController<Uint8Array>>();

  // `state` & `env` diterima agar cocok dengan konstruktor Durable Object, tetapi tidak dipakai (tanpa penyimpanan).
  constructor(_state?: unknown, _env?: unknown) {
    void _state; void _env;
  }

  async fetch(req: Request): Promise<Response> {
    const { pathname } = new URL(req.url);
    if (req.method === "GET" && pathname === "/subscribe") return this.subscribe();
    if (req.method === "POST" && pathname === "/publish") {
      let ev: OrderEvent | null = null;
      try { ev = (await req.json()) as OrderEvent; } catch { /* diabaikan */ }
      if (!ev || typeof ev.invoiceNo !== "string" || typeof ev.status !== "string") {
        return new Response(JSON.stringify({ error: "bad event" }), { status: 400 });
      }
      return new Response(JSON.stringify({ delivered: this.publish(ev) }), { status: 200 });
    }
    return new Response("not found", { status: 404 });
  }

  /** Jumlah pelanggan saat ini (untuk tes / diagnosis). */
  get size(): number { return this.subs.size; }

  private subscribe(): Response {
    if (this.subs.size >= MAX_SUBSCRIBERS) return new Response("too many subscribers", { status: 429 });
    let ctl!: ReadableStreamDefaultController<Uint8Array>;
    const stream = new ReadableStream<Uint8Array>({
      start: (c) => {
        ctl = c;
        this.subs.add(c);
        c.enqueue(sseComment("connected"));
      },
      // Dipanggil saat pembaca (Worker) membatalkan: klien menutup halaman / koneksi putus.
      cancel: () => { this.subs.delete(ctl); },
    });
    return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
  }

  /** Kirim ke semua pelanggan. Status final -> koneksi ditutup (tidak ada koneksi tanpa batas). */
  private publish(ev: OrderEvent): number {
    const frame = sseFrame(ev);
    const final = isFinalStatus(ev.status);
    let delivered = 0;
    for (const c of [...this.subs]) {
      try {
        c.enqueue(frame);
        delivered++;
        if (final) { c.close(); this.subs.delete(c); }
      } catch {
        this.subs.delete(c); // controller sudah tertutup
      }
    }
    return delivered;
  }
}

// ------------------------------------------------------------------ pemanggil di Worker

const stubFor = (env: Env, invoice: string) => env.PAYMENT_HUB!.get(env.PAYMENT_HUB!.idFromName(invoice));

/** Beri tahu pelanggan SSE bahwa pesanan berubah. Tidak pernah melempar error (best-effort). */
export async function publishOrderEvent(env: Env, order: OrderLike): Promise<void> {
  if (!env.PAYMENT_HUB) return;
  try {
    const r = await stubFor(env, order.invoice_no).fetch("https://hub/publish", {
      method: "POST",
      body: JSON.stringify(toOrderEvent(order)),
      signal: AbortSignal.timeout(1500),
    });
    if (!r.ok) console.warn("hub.publish_rejected", { status: r.status });
  } catch (e) {
    // DB sudah benar; klien akan sinkron lewat snapshot saat reconnect (maks. satu masa hidup koneksi).
    console.warn("hub.publish_failed", { message: e instanceof Error ? e.message : String(e) });
  }
}

/** Buka aliran dari hub. null = hub tidak tersedia (belum ada binding) -> pemanggil memberi 503 agar klien fallback. */
export async function openHubStream(env: Env, invoice: string): Promise<Response | null> {
  if (!env.PAYMENT_HUB) return null;
  try {
    // JANGAN pakai AbortSignal.timeout di sini: signal yang kedaluwarsa ikut memutus BODY stream (SSE putus).
    // Batas waktu hanya untuk fase menunggu header respons.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, rej) => { timer = setTimeout(() => rej(new Error("hub subscribe timeout")), 3000); });
    try {
      return await Promise.race([stubFor(env, invoice).fetch("https://hub/subscribe"), timeout]);
    } finally {
      if (timer !== undefined) clearTimeout(timer);
    }
  } catch (e) {
    console.warn("hub.subscribe_failed", { message: e instanceof Error ? e.message : String(e) });
    return null;
  }
}
