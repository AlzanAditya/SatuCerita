/**
 * POST /api/payments/midtrans/webhook  — dipanggil Midtrans (server-ke-server). INILAH mekanisme utama sinkronisasi status.
 *
 * Lapisan keamanan:
 *  1. Signature SHA512(order_id + status_code + gross_amount + ServerKey) harus valid (waktu-konstan).
 *  2. order_id harus berformat invoice kita DAN ada di database; tidak pernah membuat pesanan baru.
 *  3. Nominal pada notifikasi harus sama dengan nominal tersimpan; beda -> needs_review, TIDAK pernah lunas.
 *  4. Status dikonfirmasi ulang lewat Status API (satu kali per notifikasi, bukan polling), karena Midtrans
 *     menyatakan notifikasi bisa datang tidak berurutan.
 *  5. Idempoten: notifikasi dobel / telat / terbalik urutan tidak merusak status dan tidak menulis ulang DB (lihat state.ts).
 *  6. UPDATE selalu per invoice_no dengan compare-and-swap (lihat applyMidtransStatus).
 *
 * Kode respons (tabel retry Midtrans: https://docs.midtrans.com/reference/handle-notifications):
 *   200 = diterima & diproses / diabaikan secara sah (tidak perlu dikirim ulang)
 *   401 = signature tidak valid   400 = body bukan JSON objek   413 = terlalu besar
 *   503 = gagal SEMENTARA (Midtrans/DB/konfigurasi) -> Midtrans mengirim ulang. Pembayaran TIDAK dianggap tersinkron.
 *   500 = bug tak terduga -> Midtrans mengirim ulang
 * Log aman: tanpa Server Key, tanpa signature, tanpa payload penuh, tanpa data pelanggan.
 */
import type { Env } from "./types";
import { json } from "./http";
import { DbError, dbInsertIgnore, dbSelect } from "./db";
import {
  MidtransError, assertMidtransConfig, getStatus, parseGrossAmount, sha512Hex, verifyNotificationSignature,
  type MidtransNotification, type MidtransStatus,
} from "./midtrans";
import { applyMidtransStatus, type OrderRow } from "./orders";

const MAX_BODY = 64_000;
const INVOICE_RE = /^SC[0-9]{6}-[0-9A-Z]{8}$/;
const STATUS_API_TIMEOUT_MS = 4_000; // Midtrans menyarankan merespons < 5 detik

function wlog(level: "info" | "warn" | "error", evt: string, data: Record<string, unknown> = {}) {
  const line = JSON.stringify({ evt, ...data });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export async function midtransWebhook(env: Env, req: Request): Promise<Response> {
  const ray = req.headers.get("cf-ray") ?? undefined; // cocokkan dengan Cloudflare > Security > Events
  const problem = assertMidtransConfig(env);
  if (problem) {
    wlog("error", "midtrans.webhook.config_error", { problem, ray });
    return json({ error: "not configured" }, 503);
  }

  const text = await req.text();
  if (text.length > MAX_BODY) {
    wlog("warn", "midtrans.webhook.too_large", { ray });
    return json({ error: "too large" }, 413);
  }

  let n: MidtransNotification;
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("bad");
    n = parsed as MidtransNotification;
  } catch {
    wlog("warn", "midtrans.webhook.invalid_json", { ray, contentType: req.headers.get("content-type") ?? undefined });
    return json({ error: "invalid json" }, 400);
  }

  // 1) Signature. Yang gagal tidak dicatat ke database (cegah spam); log ringkas tanpa payload/signature.
  if (!(await verifyNotificationSignature(n, env.MIDTRANS_SERVER_KEY))) {
    wlog("warn", "midtrans.webhook.bad_signature", {
      ray,
      hasOrderId: typeof n.order_id === "string",
      hasSignature: typeof n.signature_key === "string",
      statusCode: typeof n.status_code === "string" ? n.status_code : undefined,
    });
    return json({ error: "invalid signature" }, 401);
  }

  const orderId = String(n.order_id);
  const notified = String(n.transaction_status ?? "");
  wlog("info", "midtrans.webhook.received", { ray, order: orderId.slice(0, 20), status: notified, code: n.status_code });

  try {
    const dedupeKey = await sha512Hex(
      [orderId, n.status_code, n.transaction_status, n.gross_amount, n.transaction_id, n.transaction_time].join("|"),
    );

    let order: OrderRow | undefined;
    // 2) Hanya order_id berformat invoice kita yang dicari (tes dari dashboard Midtrans = bukan pesanan kita).
    if (INVOICE_RE.test(orderId)) {
      const rows = await dbSelect<OrderRow>(env, "orders", `invoice_no=eq.${encodeURIComponent(orderId)}&select=*&limit=1`);
      order = rows[0];
    }

    let result: string;
    if (!order) {
      result = "unknown_order"; // 200 agar tidak di-retry; TIDAK membuat apa pun
    } else if (parseGrossAmount(n.gross_amount) !== order.gross_amount) {
      // 3) Nominal notifikasi berbeda dari yang tersimpan: jangan percaya, jangan lunas.
      wlog("warn", "midtrans.webhook.amount_mismatch", { invoice: order.invoice_no, expected: order.gross_amount, got: n.gross_amount ?? null });
      const updated = await applyMidtransStatus(env, order, notificationAsStatus(n), "webhook");
      result = updated.status === order.status ? "amount_mismatch_ignored" : updated.status;
    } else {
      // 4) Konfirmasi ulang ke Status API. Gagal sementara -> 503 supaya Midtrans mengirim ulang.
      const st = await getStatus(env, orderId, STATUS_API_TIMEOUT_MS);
      if (st.status_code === "404") throw new MidtransError("Transaksi belum terlihat di Status API.", 503);
      const updated = await applyMidtransStatus(env, order, st, "webhook");
      result = updated.status;
    }

    await dbInsertIgnore(env, "payment_events", {
      dedupe_key: dedupeKey,
      invoice_no: orderId.slice(0, 50),
      transaction_status: notified.slice(0, 30),
      status_code: String(n.status_code ?? "").slice(0, 10),
      gross_amount: String(n.gross_amount ?? "").slice(0, 20),
      payment_type: String(n.payment_type ?? "").slice(0, 30),
      result,
      payload: redact(n),
    }, "dedupe_key").catch((e) => wlog("error", "payment_events.insert_failed", { message: e instanceof Error ? e.message : String(e) }));

    wlog("info", "midtrans.webhook.processed", { ray, order: orderId.slice(0, 20), result });
    return json({ ok: true, result });
  } catch (e) {
    if (e instanceof MidtransError || e instanceof DbError) {
      // DB/Midtrans gagal: JANGAN anggap tersinkron. 503 -> Midtrans mengirim ulang.
      wlog("error", "midtrans.webhook.temporary_failure", { ray, order: orderId.slice(0, 20), kind: e.constructor.name, message: e.message });
      return json({ error: "temporary failure" }, 503);
    }
    wlog("error", "midtrans.webhook.unexpected", { ray, order: orderId.slice(0, 20), message: e instanceof Error ? e.message : String(e) });
    return json({ error: "internal error" }, 500);
  }
}

/** Bentuk minimal dari notifikasi (hanya untuk kasus nominal tak cocok). transaction_id sengaja tidak diteruskan. */
function notificationAsStatus(n: MidtransNotification): MidtransStatus {
  return {
    order_id: n.order_id,
    transaction_status: n.transaction_status,
    fraud_status: n.fraud_status,
    gross_amount: n.gross_amount,
  };
}

/** Simpan payload untuk audit, tanpa signature_key dan data kartu/pelanggan. */
function redact(n: MidtransNotification): Record<string, unknown> {
  const { signature_key: _s, card_type: _c, masked_card: _m, ...rest } = n as Record<string, unknown>;
  void _s; void _c; void _m;
  return rest;
}
