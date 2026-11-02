import type { PaymentMethodId } from "@/pages/app/types";

/** Panduan bayar per metode (teks statis, tidak berasal dari input pengguna). */
export interface InstructionGroup { title: string; steps: string[] }

const vaSteps = (bank: string): InstructionGroup[] => [
  {
    title: "ATM",
    steps: [
      `Masukkan kartu ATM dan PIN, pilih menu Transfer / Pembayaran.`,
      `Pilih Virtual Account (atau transfer ke bank lain jika bukan ${bank}).`,
      "Masukkan nomor Virtual Account di atas, lalu pastikan nominal sama persis.",
      "Konfirmasi pembayaran dan simpan struk.",
    ],
  },
  {
    title: "Mobile banking / internet banking",
    steps: [
      "Login ke aplikasi, buka menu Transfer atau Virtual Account.",
      "Masukkan nomor Virtual Account di atas (salin dari halaman ini).",
      "Periksa nama merchant & nominal, lalu konfirmasi dengan PIN / OTP.",
    ],
  },
];

export const PAYMENT_INSTRUCTIONS: Record<PaymentMethodId, InstructionGroup[]> = {
  bni_va: vaSteps("BNI"),
  bri_va: vaSteps("BRI"),
  permata_va: vaSteps("Permata"),
  mandiri_bill: [
    {
      title: "Livin' by Mandiri / ATM Mandiri",
      steps: [
        "Buka menu Bayar (Multipayment) lalu pilih penyedia jasa Midtrans / kode perusahaan yang tertera.",
        "Masukkan Kode Pembayaran di atas.",
        "Periksa nominal, lalu konfirmasi dengan PIN.",
      ],
    },
  ],
  gopay: [
    {
      title: "Aplikasi GoPay / Gojek",
      steps: [
        "Di ponsel, tekan tombol Buka aplikasi GoPay. Di komputer, scan kode QR dengan aplikasi Gojek.",
        "Periksa nominal pembayaran, lalu konfirmasi dengan PIN GoPay.",
        "Tunggu sebentar; halaman ini berubah menjadi Lunas otomatis.",
      ],
    },
  ],
  qris: [
    {
      title: "Semua e-wallet & m-banking",
      steps: [
        "Buka aplikasi e-wallet / m-banking yang mendukung QRIS.",
        "Pilih Scan / Bayar, lalu arahkan kamera ke kode QR di atas.",
        "Periksa nominal, lalu konfirmasi pembayaran.",
        "Tunggu sebentar; halaman ini berubah menjadi Lunas otomatis.",
      ],
    },
  ],
};
