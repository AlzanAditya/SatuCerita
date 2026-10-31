/**
 * Harga & voucher dihitung DI SERVER. Nilai harga dari browser tidak pernah dipercaya.
 * Sumber harga = katalog yang sama dengan frontend (src/data/templates.ts) -> satu sumber kebenaran.
 */
import { TEMPLATES_DATA, normalizeSlug, type TemplateItemData } from "../../src/data/templates";

export type PaymentMethodId = "bni_va" | "bri_va" | "permata_va" | "mandiri_bill" | "qris" | "gopay";

/** Pemetaan metode UI -> payment type Midtrans (enabled_payments). Mandiri = echannel (Mandiri Bill Payment). */
export const PAYMENT_METHODS: Record<PaymentMethodId, { enabled: string[]; label: string }> = {
  bni_va: { enabled: ["bni_va"], label: "BNI Virtual Account" },
  bri_va: { enabled: ["bri_va"], label: "BRI Virtual Account" },
  permata_va: { enabled: ["permata_va"], label: "Permata Virtual Account" },
  mandiri_bill: { enabled: ["echannel"], label: "Mandiri Bill Payment" },
  qris: { enabled: ["other_qris"], label: "QRIS" },
  gopay: { enabled: ["gopay"], label: "GoPay" },
};

export const isPaymentMethod = (v: unknown): v is PaymentMethodId =>
  typeof v === "string" && Object.prototype.hasOwnProperty.call(PAYMENT_METHODS, v);

/** Voucher yang berlaku (server-side). Penggunaan dibatasi 1x per akun lewat unique index di database. */
const VOUCHERS: Record<string, { percent: number }> = {
  HEMAT10: { percent: 10 },
};

export function normalizeVoucher(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const s = v.trim().toUpperCase().slice(0, 32);
  return s ? s : null;
}

export function findTemplate(slug: unknown): TemplateItemData | null {
  if (typeof slug !== "string" || slug.length > 80) return null;
  const n = normalizeSlug(slug);
  return TEMPLATES_DATA.find((t) => t.slug === n) ?? null;
}

export interface Quote {
  template: TemplateItemData;
  basePrice: number;
  discountCode: string | null;
  discountAmount: number;
  total: number;
}

export type QuoteResult = { ok: true; quote: Quote } | { ok: false; error: string; status: number };

export function computeQuote(slug: unknown, voucher: unknown): QuoteResult {
  const template = findTemplate(slug);
  if (!template) return { ok: false, error: "Template tidak ditemukan.", status: 404 };
  const basePrice = template.discountPrice;
  if (!Number.isInteger(basePrice) || basePrice <= 0) return { ok: false, error: "Harga template tidak valid.", status: 500 };

  const code = normalizeVoucher(voucher);
  let discountAmount = 0;
  if (code) {
    const v = VOUCHERS[code];
    if (!v) return { ok: false, error: "Kode voucher tidak valid atau sudah kadaluarsa.", status: 400 };
    discountAmount = Math.round((basePrice * v.percent) / 100);
  }
  const total = basePrice - discountAmount;
  if (total <= 0) return { ok: false, error: "Total pembayaran tidak valid.", status: 400 };
  return { ok: true, quote: { template, basePrice, discountCode: code, discountAmount, total } };
}
