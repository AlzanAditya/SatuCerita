/**
 * Harga dihitung DI SERVER. Nilai harga dari browser tidak pernah dipercaya.
 * Sumber harga = katalog yang sama dengan frontend (src/data/templates.ts) -> satu sumber kebenaran.
 * Diskon (kode redeem) diatur admin di database dan dihitung di redeem.ts.
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

/** Harga dasar template (tanpa diskon). Diskon ditambahkan oleh `quoteWithRedeem` (redeem.ts). */
export function computeQuote(slug: unknown): QuoteResult {
  const template = findTemplate(slug);
  if (!template) return { ok: false, error: "Template tidak ditemukan.", status: 404 };
  const basePrice = template.discountPrice;
  if (!Number.isInteger(basePrice) || basePrice <= 0) return { ok: false, error: "Harga template tidak valid.", status: 500 };
  return { ok: true, quote: { template, basePrice, discountCode: null, discountAmount: 0, total: basePrice } };
}
