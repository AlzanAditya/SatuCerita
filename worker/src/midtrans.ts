/**
 * Klien Midtrans (Snap + Core API status/cancel) untuk Cloudflare Worker.
 * - Hanya Worker yang boleh memegang Server Key. Browser hanya menerima Client Key + Snap token.
 * - Signature notifikasi: SHA512(order_id + status_code + gross_amount + ServerKey).
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
  sandbox: { snap: "https://app.sandbox.midtrans.com", api: "https://api.sandbox.midtrans.com" },
  production: { snap: "https://app.midtrans.com", api: "https://api.midtrans.com" },
} as const;

export function midtransMode(env: Env): MidtransEnv {
  return env.MIDTRANS_ENV === "production" ? "production" : "sandbox";
}

/** Skrip snap.js sesuai mode (dipakai frontend). */
export const snapScriptUrl = (env: Env) => `${HOSTS[midtransMode(env)].snap}/snap/snap.js`;

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

async function mtFetch(env: Env, url: string, init: RequestInit = {}): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Accept", "application/json");
  headers.set("Authorization", authHeader(env));
  if (init.body) headers.set("Content-Type", "application/json");
  return fetch(url, { ...init, headers, signal: AbortSignal.timeout(12_000) });
}

// ---------------------------------------------------------------- Snap
export interface SnapParams {
  orderId: string;
  grossAmount: number;
  items: { id: string; price: number; quantity: number; name: string }[];
  customer: { first_name: string; email: string; phone?: string };
  enabledPayments: string[];
  expiryStartWib: string; // "YYYY-MM-DD HH:MM:SS +0700"
  expiryMinutes: number;
  finishUrl?: string;
}

export async function createSnapTransaction(env: Env, p: SnapParams): Promise<{ token: string; redirect_url?: string }> {
  const body: Record<string, unknown> = {
    transaction_details: { order_id: p.orderId, gross_amount: p.grossAmount },
    item_details: p.items,
    customer_details: p.customer,
    enabled_payments: p.enabledPayments,
    expiry: { start_time: p.expiryStartWib, unit: "minutes", duration: p.expiryMinutes },
  };
  if (p.finishUrl) body.callbacks = { finish: p.finishUrl };

  const r = await mtFetch(env, `${HOSTS[midtransMode(env)].snap}/snap/v1/transactions`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const data = (await r.json().catch(() => ({}))) as { token?: string; redirect_url?: string; error_messages?: string[] };
  if (!r.ok || !data.token) {
    // Jangan bocorkan detail ke user; cukup ke log server (tanpa data pribadi).
    console.error("midtrans.snap_failed", { status: r.status, errors: data.error_messages });
    throw new MidtransError("Gagal membuat transaksi di Midtrans.", r.status);
  }
  return { token: data.token, redirect_url: data.redirect_url };
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
  [k: string]: unknown;
}

export class MidtransError extends Error {
  constructor(message: string, public httpStatus = 502) {
    super(message);
  }
}

/** Status API = sumber kebenaran. Midtrans membalas HTTP 200 dengan status_code "404" jika transaksi belum ada. */
export async function getStatus(env: Env, orderId: string): Promise<MidtransStatus> {
  const r = await mtFetch(env, `${HOSTS[midtransMode(env)].api}/v2/${encodeURIComponent(orderId)}/status`);
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
