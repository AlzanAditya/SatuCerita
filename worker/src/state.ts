/**
 * Mesin status pesanan (murni, mudah dites).
 * Aturan emas: uang yang sudah masuk tidak boleh "hilang" karena notifikasi telat / urutan terbalik.
 */
import type { MidtransStatus } from "./midtrans";

export type OrderStatus = "pending" | "paid" | "expired" | "cancelled" | "failed" | "needs_review";

/** Terjemahkan status Midtrans -> status internal. */
export function mapMidtransStatus(s: Pick<MidtransStatus, "transaction_status" | "fraud_status">): OrderStatus | null {
  switch (s.transaction_status) {
    case "settlement":
      return "paid";
    case "capture":
      return s.fraud_status === "accept" ? "paid" : "needs_review";
    case "pending":
      return "pending";
    case "deny":
    case "failure":
      return "failed";
    case "cancel":
      return "cancelled";
    case "expire":
      return "expired";
    case "refund":
    case "partial_refund":
    case "chargeback":
    case "partial_chargeback":
      return "needs_review";
    default:
      return null; // status tidak dikenal -> abaikan
  }
}

/** Status berikutnya (atau status sekarang jika tidak boleh berubah). */
export function nextStatus(current: OrderStatus, incoming: OrderStatus): OrderStatus {
  if (current === incoming) return current;
  switch (current) {
    case "pending":
      return incoming;
    case "paid":
      return incoming === "needs_review" ? "needs_review" : "paid"; // lunas tidak boleh mundur
    case "needs_review":
      return current; // diputuskan manusia
    case "cancelled":
    case "expired":
    case "failed":
      // Uang masuk setelah kita menutup pesanan -> JANGAN diam-diam jadi lunas; minta ditinjau.
      return incoming === "paid" ? "needs_review" : current;
  }
}

/** Ambil info bayar (VA / bill key / QR) dari respons Midtrans secara defensif. */
export function extractPaymentInfo(s: MidtransStatus): Record<string, string> {
  const info: Record<string, string> = {};
  if (s.va_numbers?.[0]?.va_number) {
    info.bank = String(s.va_numbers[0].bank || "");
    info.vaNumber = String(s.va_numbers[0].va_number);
  } else if (s.permata_va_number) {
    info.bank = "permata";
    info.vaNumber = String(s.permata_va_number);
  }
  if (s.biller_code) info.billerCode = String(s.biller_code);
  if (s.bill_key) info.billKey = String(s.bill_key);
  for (const a of s.actions || []) {
    if (a.name === "generate-qr-code" && /^https:\/\//.test(a.url)) info.qrUrl = a.url;
    if (a.name === "deeplink-redirect" && /^https:\/\//.test(a.url)) info.deeplinkUrl = a.url;
  }
  if (s.payment_type) info.paymentType = String(s.payment_type);
  return info;
}
