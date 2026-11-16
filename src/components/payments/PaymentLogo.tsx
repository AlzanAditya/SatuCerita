import React from "react";
import type { PaymentMethodId } from "@/pages/studio/types";

/**
 * Logo metode pembayaran. File ada di /public/logos/payments/*.svg:
 * untuk memakai berkas logo resmi dari brand guideline masing-masing bank/penyedia,
 * cukup timpa file dengan nama yang sama (rasio ±12:5 disarankan, latar transparan).
 */
export const PAYMENT_LOGO_SRC: Record<PaymentMethodId, string> = {
  bni_va: "/logos/payments/bni.svg",
  bri_va: "/logos/payments/bri.svg",
  permata_va: "/logos/payments/permata.svg",
  mandiri_bill: "/logos/payments/mandiri.svg",
  gopay: "/logos/payments/gopay.svg",
  qris: "/logos/payments/qris.svg",
};

export const PAYMENT_LOGO_NAME: Record<PaymentMethodId, string> = {
  bni_va: "BNI",
  bri_va: "BRI",
  permata_va: "PermataBank",
  mandiri_bill: "Mandiri",
  gopay: "GoPay",
  qris: "QRIS",
};

interface PaymentLogoProps {
  method: PaymentMethodId;
  className?: string;
}

export const PaymentLogo: React.FC<PaymentLogoProps> = ({ method, className = "h-8 w-14 object-left" }) => (
  <img
    src={PAYMENT_LOGO_SRC[method]}
    alt={PAYMENT_LOGO_NAME[method]}
    draggable={false}
    className={`object-contain select-none ${className}`}
  />
);

export default PaymentLogo;
