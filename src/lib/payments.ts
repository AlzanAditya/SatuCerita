/**
 * Client pembayaran (Midtrans Snap). Browser TIDAK pernah menentukan harga/status:
 * ia hanya meminta pesanan ke Worker, membuka popup Snap, lalu membaca status dari server.
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

// ------------------------------------------------------------------ Snap (popup Midtrans)
export interface SnapResultHandlers {
  onSuccess?: () => void;
  onPending?: () => void;
  onError?: () => void;
  onClose?: () => void;
}

interface SnapGlobal {
  pay: (token: string, cb?: { onSuccess?: (r: unknown) => void; onPending?: (r: unknown) => void; onError?: (r: unknown) => void; onClose?: () => void }) => void;
}
declare global {
  interface Window {
    snap?: SnapGlobal;
  }
}

let snapLoading: Promise<void> | null = null;

/** Muat snap.js sekali saja, dengan Client Key + URL (sandbox/production) yang diberikan server. */
export function loadSnap(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.snap) return Promise.resolve();
  if (snapLoading) return snapLoading;

  snapLoading = (async () => {
    const cfg = await api<{ clientKey: string; snapUrl: string }>("/api/payments/config");
    if (!cfg.ok || !cfg.data.clientKey || !cfg.data.snapUrl) throw new Error(cfg.data.error || "Pembayaran belum dikonfigurasi.");
    // Hanya izinkan skrip dari domain Midtrans, apa pun yang dibalas server.
    const u = new URL(cfg.data.snapUrl);
    if (u.protocol !== "https:" || !/^app(\.sandbox)?\.midtrans\.com$/.test(u.hostname)) throw new Error("URL Snap tidak valid.");

    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = u.href;
      s.async = true;
      s.setAttribute("data-client-key", cfg.data.clientKey);
      s.onload = () => resolve();
      s.onerror = () => reject(new Error("Gagal memuat halaman pembayaran Midtrans."));
      document.head.appendChild(s);
    });
    if (!window.snap) throw new Error("Snap tidak tersedia.");
  })().catch((e) => {
    snapLoading = null; // boleh dicoba lagi
    throw e;
  });
  return snapLoading;
}

export async function openSnap(token: string, h: SnapResultHandlers = {}): Promise<void> {
  await loadSnap();
  window.snap!.pay(token, {
    onSuccess: () => h.onSuccess?.(),
    onPending: () => h.onPending?.(),
    onError: () => h.onError?.(),
    onClose: () => h.onClose?.(),
  });
}

/** Tanggal ISO dari server -> teks WIB yang rapi. */
export function formatOrderDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const bulan = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
  const w = new Date(d.getTime() + 7 * 3600_000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${w.getUTCDate()} ${bulan[w.getUTCMonth()]} ${w.getUTCFullYear()}, ${p(w.getUTCHours())}.${p(w.getUTCMinutes())} WIB`;
}
