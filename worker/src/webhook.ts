/**
 * POST /api/payments/midtrans/webhook  — dipanggil Midtrans (server-ke-server).
 * Lapisan keamanan:
 *  1. Signature SHA512 harus valid (membuktikan pengirim memegang Server Key).
 *  2. Status dikonfirmasi ulang lewat Status API (kita tidak percaya isi body notifikasi).
 *  3. Nominal harus sama dengan yang tersimpan; beda -> needs_review, TIDAK lunas.
 *  4. Idempoten: notifikasi dobel / telat / urutan terbalik tidak merusak status (lihat state.ts).
 * Kode respons: 200 = diterima/diabaikan secara sah, 401 = signature salah, 5xx = gagal sementara (Midtrans akan kirim ulang).
 */
import type { Env } from "./types";
import { json } from "./http";
import { DbError, dbInsertIgnore, dbSelect } from "./db";
import {
  MidtransError, assertMidtransConfig, getStatus, sha512Hex, verifyNotificationSignature, type MidtransNotification,
} from "./midtrans";
import { applyMidtransStatus, type OrderRow } from "./orders";

const MAX_BODY = 64_000;

export async function midtransWebhook(env: Env, req: Request): Promise<Response> {
  const problem = assertMidtransConfig(env);
  if (problem) {
    console.error("midtrans.config_error", { problem });
    return json({ error: "not configured" }, 503);
  }

  const text = await req.text();
  if (text.length > MAX_BODY) return json({ error: "too large" }, 413);

  let n: MidtransNotification;
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("bad");
    n = parsed as MidtransNotification;
  } catch {
    return json({ error: "invalid json" }, 400);
  }

  // 1) Signature. Yang gagal tidak dicatat ke database (cegah spam), cukup log ringkas tanpa payload.
  if (!(await verifyNotificationSignature(n, env.MIDTRANS_SERVER_KEY))) {
    console.warn("midtrans.webhook.bad_signature");
    return json({ error: "invalid signature" }, 401);
  }

  const orderId = String(n.order_id);
  try {
    const dedupeKey = await sha512Hex(
      [orderId, n.status_code, n.transaction_status, n.gross_amount, n.transaction_id, n.transaction_time].join("|"),
    );

    const rows = await dbSelect<OrderRow>(env, "orders", `invoice_no=eq.${encodeURIComponent(orderId)}&select=*&limit=1`);
    const order = rows[0];
    let result: string;

    if (!order) {
      // Signature valid tapi bukan pesanan kita (mis. tes dari dashboard Midtrans). Jawab 200 agar tidak di-retry.
      result = "unknown_order";
    } else {
      // 2) Konfirmasi ulang ke Status API. Gagal sementara -> 503 supaya Midtrans mengirim ulang.
      const st = await getStatus(env, orderId);
      if (st.status_code === "404") throw new MidtransError("Transaksi belum terlihat di Status API.", 503);
      const updated = await applyMidtransStatus(env, order, st, "webhook");
      result = updated.status;
    }

    await dbInsertIgnore(env, "payment_events", {
      dedupe_key: dedupeKey,
      invoice_no: orderId.slice(0, 50),
      transaction_status: String(n.transaction_status ?? "").slice(0, 30),
      status_code: String(n.status_code ?? "").slice(0, 10),
      gross_amount: String(n.gross_amount ?? "").slice(0, 20),
      payment_type: String(n.payment_type ?? "").slice(0, 30),
      result,
      payload: redact(n),
    }, "dedupe_key").catch((e) => console.error("payment_events.insert_failed", e instanceof Error ? e.message : String(e)));

    return json({ ok: true });
  } catch (e) {
    if (e instanceof MidtransError || e instanceof DbError) {
      console.error("midtrans.webhook.temporary_failure", { message: e.message });
      return json({ error: "temporary failure" }, 503);
    }
    console.error("midtrans.webhook.unexpected", { message: e instanceof Error ? e.message : String(e) });
    return json({ error: "internal error" }, 500);
  }
}

/** Simpan payload untuk audit, tapi tanpa signature_key dan data kartu/pelanggan. */
function redact(n: MidtransNotification): Record<string, unknown> {
  const { signature_key: _s, card_type: _c, masked_card: _m, ...rest } = n as Record<string, unknown>;
  void _s; void _c; void _m;
  return rest;
}
