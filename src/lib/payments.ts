/**
 * Client pembayaran. Browser TIDAK pernah menentukan harga/status/masa berlaku dan tidak memegang kunci Midtrans:
 * ia hanya meminta pesanan ke Worker, menampilkan instruksi bayar dari server, lalu menerima perubahan status
 * (SSE, fallback polling DB; lihat orderStream.ts).
 */
import type { OrderItem, PaymentMethodId } from "@/pages/app/types";

const BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) || "";

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data: T & { error?: string };
}

async function api<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  try {
    const res = await fetch(BASE + path, {
      credentials: "include",
      ...init,
      headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    });
    const data = (await res.json().catch(() => ({}))) as ApiResult<T>["data"];
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: { error: "Tidak dapat terhubung ke server." } as ApiResult<T>["data"] };
  }
}

export interface Quote {
  basePrice: number;
  discountCode: string | null;
  discountAmount: number;
  total: number;
}

export const quoteOrder = (templateSlug: string, voucherCode?: string) =>
  api<Quote>("/api/orders/quote", { method: "POST", body: JSON.stringify({ templateSlug, voucherCode }) });

export const createOrder = (p: { templateSlug: string; method: PaymentMethodId; voucherCode?: string; idempotencyKey: string }) =>
  api<{ order: OrderItem; reused?: boolean }>("/api/orders", { method: "POST", body: JSON.stringify(p) });

export const listOrders = () => api<{ orders: OrderItem[] }>("/api/orders");
export const getOrder = (invoice: string) => api<{ order: OrderItem }>(`/api/orders/${encodeURIComponent(invoice)}`);
export const syncOrder = (invoice: string) =>
  api<{ order: OrderItem; throttled?: boolean }>(`/api/orders/${encodeURIComponent(invoice)}/sync`, { method: "POST" });
export const cancelOrder = (invoice: string) =>
  api<{ order: OrderItem }>(`/api/orders/${encodeURIComponent(invoice)}/cancel`, { method: "POST" });

/** Kunci idempoten: sama untuk satu "niat bayar" (klik ganda aman), baru bila user mengubah pilihannya. */
export function newIdempotencyKey(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

/** URL aliran SSE status pesanan (same-origin, cookie sesi ikut terkirim). */
export const orderEventsUrl = (invoice: string) => `${BASE}/api/orders/${encodeURIComponent(invoice)}/events`;

/** Tanggal ISO dari server -> teks WIB yang rapi. */
export function formatOrderDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const w = new Date(d.getTime() + 7 * 3600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${w.getUTCDate()} ${bulan[w.getUTCMonth()]} ${w.getUTCFullYear()}, ${p(w.getUTCHours())}.${p(w.getUTCMinutes())} WIB`;
}
