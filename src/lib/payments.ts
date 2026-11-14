/**
 * Client pembayaran. Browser TIDAK pernah menentukan harga/status/masa berlaku dan tidak memegang kunci Midtrans:
 * ia hanya meminta pesanan ke Worker, menampilkan instruksi bayar dari server, lalu menerima perubahan status
 * (SSE, fallback polling DB; lihat orderStream.ts).
 *
 * Mendukung dua mode pembayaran (dipilih via env MIDTRANS_PAYMENT_MODE di Worker; klien membaca /api/payments/config):
 * - "snap": popup Midtrans Snap (token dari server, dibuka via snap.js; callback popup hanya UX, bukan bukti bayar)
 * - "core_api": UI pembayaran sendiri (instruksi VA/QR/Bill Key dari server)
 */
import type { OrderItem, PaymentMethodId } from "@/pages/studio/types";

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

// ------------------------------------------------------------------ Snap (popup Midtrans) — hanya dipakai bila mode Snap aktif
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

export interface PaymentConfig {
  mode: "snap" | "core_api";
  clientKey?: string;
  snapUrl?: string;
  environment: "sandbox" | "production";
}

let configPromise: Promise<PaymentConfig> | null = null;

/** Ambil konfigurasi pembayaran (mode, clientKey, snapUrl) dari server. Di-cache; gagal -> boleh dicoba lagi. */
export function getPaymentConfig(): Promise<PaymentConfig> {
  if (!configPromise) {
    configPromise = (async () => {
      const cfg = await api<Partial<PaymentConfig>>("/api/payments/config");
      if (!cfg.ok) throw new Error(cfg.data.error || "Gagal memuat konfigurasi pembayaran");
      const d = cfg.data;
      return {
        mode: d.mode === "snap" || (!d.mode && d.clientKey && d.snapUrl) ? "snap" : "core_api",
        clientKey: d.clientKey,
        snapUrl: d.snapUrl,
        environment: d.environment === "production" ? "production" : "sandbox",
      } as PaymentConfig;
    })().catch((e) => {
      configPromise = null;
      throw e;
    });
  }
  return configPromise;
}

let snapLoading: Promise<void> | null = null;

/** Muat snap.js sekali saja, dengan Client Key + URL (sandbox/production) yang diberikan server. */
export function loadSnap(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.snap) return Promise.resolve();
  if (snapLoading) return snapLoading;

  snapLoading = (async () => {
    const cfg = await getPaymentConfig();
    if (cfg.mode !== "snap" || !cfg.clientKey || !cfg.snapUrl) throw new Error("Pembayaran belum dikonfigurasi.");
    // Hanya izinkan skrip dari domain Midtrans, apa pun yang dibalas server.
    const u = new URL(cfg.snapUrl);
    if (u.protocol !== "https:" || !/^app(\.sandbox)?\.midtrans\.com$/.test(u.hostname)) throw new Error("URL Snap tidak valid.");

    await new Promise<void>((resolve, reject) => {
      const s = document.createElement("script");
      s.src = u.href;
      s.async = true;
      s.setAttribute("data-client-key", cfg.clientKey!);
      s.onload = () => resolve();
      s.onerror = () => {
        s.remove(); // supaya percobaan ulang tidak menumpuk tag skrip
        reject(new Error("Gagal memuat halaman pembayaran Midtrans."));
      };
      document.head.appendChild(s);
    });
    if (!window.snap) throw new Error("Snap tidak tersedia.");
  })().catch((e) => {
    snapLoading = null; // boleh dicoba lagi
    throw e;
  });
  return snapLoading;
}

/** Muat snap.js lebih awal (saat halaman checkout / pesanan dibuka) supaya popup langsung muncul. Diam jika bukan mode Snap. */
export function preloadSnap(): void {
  getPaymentConfig()
    .then((c) => (c.mode === "snap" ? loadSnap() : undefined))
    .catch(() => undefined);
}

export async function openSnap(token: string, h: SnapResultHandlers = {}): Promise<void> {
  await loadSnap();
  // Callback Snap hanya penanda UX (mengarahkan halaman). Status lunas SELALU datang dari server (webhook / Status API).
  window.snap!.pay(token, {
    onSuccess: () => h.onSuccess?.(),
    onPending: () => h.onPending?.(),
    onError: () => h.onError?.(),
    onClose: () => h.onClose?.(),
  });
}
