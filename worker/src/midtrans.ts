/**
 * Klien Midtrans Core API (charge / status / cancel) untuk Cloudflare Worker.
 * - UI pembayaran dibuat sendiri: TIDAK memakai Snap. Transaksi dibuat lewat POST /v2/charge.
 * - Hanya Worker yang boleh memegang Server Key. Browser tidak menerima kunci apa pun dari Midtrans.
 * - Signature notifikasi: SHA512(order_id + status_code + gross_amount + ServerKey).
 * Referensi: https://docs.midtrans.com/reference/charge-api , /reference/handle-notifications
 */
import type { Env } from "./types";

export type MidtransEnv = "sandbox" | "production";

export interface MidtransNotification {
  order_id?: string;
  status_code?: string;
  gross_amount?: string;
  signature_key?: string;
  transaction_status?: string;
  transaction_id?: string;
  payment_type?: string;
  fraud_status?: string;
  transaction_time?: string;
  [k: string]: unknown;
}

const HOSTS = {
  sandbox: { api: "https://api.sandbox.midtrans.com" },
  production: { api: "https://api.midtrans.com" },
} as const;

export function midtransMode(env: Env): MidtransEnv {
  return env.MIDTRANS_ENV === "production" ? "production" : "sandbox";
}

/**
 * Pengaman salah-environment: Server Key sandbox berawalan "SB-Mid-server-".
 * Mode sandbox WAJIB memakai key sandbox, mode production TIDAK BOLEH memakai key sandbox.
 */
export function assertMidtransConfig(env: Env): string | null {
  const key = (env.MIDTRANS_SERVER_KEY || "").trim();
  if (!key) return "MIDTRANS_SERVER_KEY belum di-set.";
  if (!(env.MIDTRANS_CLIENT_KEY || "").trim()) return "MIDTRANS_CLIENT_KEY belum di-set.";
  const isSandboxKey = key.startsWith("SB-");
  if (midtransMode(env) === "sandbox" && !isSandboxKey) return "MIDTRANS_ENV=sandbox tetapi Server Key bukan key Sandbox.";
  if (midtransMode(env) === "production" && isSandboxKey) return "MIDTRANS_ENV=production tetapi Server Key adalah key Sandbox.";
  return null;
}

const authHeader = (env: Env) => "Basic " + btoa(env.MIDTRANS_SERVER_KEY.trim() + ":");

async function mtFetch(env: Env, url: string, init: RequestInit = {}, timeoutMs = 12_000): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", authHeader(env));
  if (init.body) headers.set("Content-Type", "application/json");
  try {
    return await fetch(url, { ...init, headers, signal: AbortSignal.timeout(timeoutMs) });
  } catch (e) {
    // Timeout / jaringan putus: jadikan MidtransError agar pemanggil menanganinya sebagai gangguan sementara (bukan crash).
    throw new MidtransError(e instanceof Error && e.name === "TimeoutError" ? "Midtrans tidak merespons (timeout)." : "Tidak dapat menghubungi Midtrans.", 503);
  }
}

// ---------------------------------------------------------------- Core API charge
export type ChargeMethod = "bni_va" | "bri_va" | "permata_va" | "mandiri_bill" | "qris" | "gopay";

export interface ChargeParams {
  orderId: string;
  grossAmount: number;
  method: ChargeMethod;
  items: { id: string; price: number; quantity: number; name: string }[];
  customer: { first_name: string; email: string; phone?: string };
  /** Awal hitungan kedaluwarsa, format "YYYY-MM-DD HH:MM:SS +0700" (lihat formatWib). */
  expiryStartWib: string;
  expiryMinutes: number;
  /** Tujuan kembali dari aplikasi GoPay (hanya dipakai metode gopay). Harus https. */
  gopayCallbackUrl?: string;
  /** Teks pada tagihan Mandiri Bill (bill_info2, maks. 30 karakter). */
  billLabel?: string;
}

/**
 * Susun body /v2/charge per metode. Format mengikuti dokumentasi resmi:
 *  - VA BNI/BRI/Permata : payment_type=bank_transfer + bank_transfer.bank
 *  - Mandiri Bill       : payment_type=echannel + echannel.bill_info1/2
 *  - GoPay              : payment_type=gopay (+ gopay.enable_callback/callback_url)
 *  - QRIS               : payment_type=qris + qris.acquirer=gopay
 * custom_expiry: { order_time, expiry_duration, unit } -> masa berlaku ditentukan SERVER, bukan browser.
 */
export function buildChargeBody(p: ChargeParams): Record<string, unknown> {
  const body: Record<string, unknown> = {
    transaction_details: { order_id: p.orderId, gross_amount: p.grossAmount },
    item_details: p.items,
    customer_details: p.customer,
    custom_expiry: { order_time: p.expiryStartWib, expiry_duration: p.expiryMinutes, unit: "minute" },
  };
  switch (p.method) {
    case "bni_va":
    case "bri_va":
    case "permata_va":
      body.payment_type = "bank_transfer";
      body.bank_transfer = { bank: p.method.slice(0, -3) }; // bni_va -> bni
      break;
    case "mandiri_bill":
      body.payment_type = "echannel";
      body.echannel = { bill_info1: "Pembayaran", bill_info2: (p.billLabel || "Template undangan").slice(0, 30) };
      break;
    case "gopay":
      body.payment_type = "gopay";
      body.gopay = p.gopayCallbackUrl ? { enable_callback: true, callback_url: p.gopayCallbackUrl } : {};
      break;
    case "qris":
      body.payment_type = "qris";
      body.qris = { acquirer: "gopay" };
      break;
  }
  return body;
}

/**
 * Buat transaksi di Midtrans. Mengembalikan response charge apa adanya (VA / bill key / actions QR).
 * Midtrans membalas HTTP 200 dengan status_code di body: "201" = transaksi pending dibuat, "406" = order_id sudah dipakai.
 * Idempotency-Key (maks. 46 karakter, berlaku 5 menit, tidak didukung semua metode) HANYA lapisan tambahan:
 * perlindungan utama tetap klaim di database + order_id yang unik.
 */
export async function chargeTransaction(env: Env, p: ChargeParams): Promise<MidtransStatus> {
  const r = await mtFetch(env, `${HOSTS[midtransMode(env)].api}/v2/charge`, {
    method: "POST",
    headers: { "Idempotency-Key": `${p.orderId}-charge`.slice(0, 46) },
    body: JSON.stringify(buildChargeBody(p)),
  });
  if (r.status >= 500) throw new MidtransError("Midtrans sedang bermasalah.", 503);
  const data = (await r.json().catch(() => null)) as MidtransStatus | null;
  if (!data) throw new MidtransError("Respons Midtrans tidak valid.", 502);
  return data;
}

/** "2026-10-31 14:05:09" (WIB, GMT+7) -> Date. null jika format tidak dikenal. */
export function parseMidtransTime(v: unknown): Date | null {
  if (typeof v !== "string") return null;
  const m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/.exec(v.trim());
  if (!m) return null;
  const t = Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] - 7, +m[5], +m[6]);
  return Number.isFinite(t) ? new Date(t) : null;
}

// ---------------------------------------------------------------- Status & cancel
export interface MidtransStatus {
  status_code?: string;          // "200" ok, "201" pending, "404" tidak ada, dst.
  transaction_status?: string;
  order_id?: string;
  gross_amount?: string;
  fraud_status?: string;
  payment_type?: string;
  transaction_id?: string;
  va_numbers?: { bank: string; va_number: string }[];
  permata_va_number?: string;
  biller_code?: string;
  bill_key?: string;
  actions?: { name: string; method?: string; url: string }[];
  expiry_time?: string;          // "YYYY-MM-DD HH:MM:SS" WIB
  status_message?: string;
  [k: string]: unknown;
}

export class MidtransError extends Error {
  constructor(message: string, public httpStatus = 502) {
    super(message);
  }
}

/** Status API = sumber kebenaran. Midtrans membalas HTTP 200 dengan status_code "404" jika transaksi belum ada. */
export async function getStatus(env: Env, orderId: string, timeoutMs = 12_000): Promise<MidtransStatus> {
  const r = await mtFetch(env, `${HOSTS[midtransMode(env)].api}/v2/${encodeURIComponent(orderId)}/status`, {}, timeoutMs);
  if (r.status >= 500) throw new MidtransError("Midtrans sedang bermasalah.", 503);
  const data = (await r.json().catch(() => null)) as MidtransStatus | null;
  if (!data) throw new MidtransError("Respons Midtrans tidak valid.", 502);
  return data;
}

/** Batalkan transaksi pending. 404/412 (belum ada / sudah final) dianggap aman. */
export async function cancelTransaction(env: Env, orderId: string): Promise<MidtransStatus> {
  const r = await mtFetch(env, `${HOSTS[midtransMode(env)].api}/v2/${encodeURIComponent(orderId)}/cancel`, { method: "POST" });
  if (r.status >= 500) throw new MidtransError("Midtrans sedang bermasalah.", 503);
  return ((await r.json().catch(() => ({}))) as MidtransStatus) || {};
}

// ---------------------------------------------------------------- Signature
const toHex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");

export async function sha512Hex(input: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-512", new TextEncoder().encode(input)));
}

/** Perbandingan waktu-konstan (tidak bocor lewat timing). */
export function timingSafeEqualStr(a: string, b: string): boolean {
  const ea = new TextEncoder().encode(a);
  const eb = new TextEncoder().encode(b);
  if (ea.length !== eb.length) return false;
  let diff = 0;
  for (let i = 0; i < ea.length; i++) diff |= ea[i] ^ eb[i];
  return diff === 0;
}

export async function computeSignature(orderId: string, statusCode: string, grossAmount: string, serverKey: string): Promise<string> {
  return sha512Hex(orderId + statusCode + grossAmount + serverKey);
}

export async function verifyNotificationSignature(n: MidtransNotification, serverKey: string): Promise<boolean> {
  const { order_id, status_code, gross_amount, signature_key } = n;
  if (typeof order_id !== "string" || typeof status_code !== "string" || typeof gross_amount !== "string" || typeof signature_key !== "string") {
    return false;
  }
  const expected = await computeSignature(order_id, status_code, gross_amount, serverKey.trim());
  return timingSafeEqualStr(expected, signature_key.toLowerCase());
}

// ---------------------------------------------------------------- Util
/** "100000.00" -> 100000 (integer rupiah). Mengembalikan null jika bukan angka rupiah bulat yang valid. */
export function parseGrossAmount(v: unknown): number | null {
  if (typeof v !== "string" && typeof v !== "number") return null;
  const s = String(v).trim();
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(s)) return null;
  const n = Number(s);
  return Number.isInteger(n) ? n : null;
}

/** Format waktu WIB untuk expiry.start_time: "YYYY-MM-DD HH:MM:SS +0700". */
export function formatWib(d: Date): string {
  const w = new Date(d.getTime() + 7 * 3600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${w.getUTCFullYear()}-${p(w.getUTCMonth() + 1)}-${p(w.getUTCDate())} ${p(w.getUTCHours())}:${p(w.getUTCMinutes())}:${p(w.getUTCSeconds())} +0700`;
}
