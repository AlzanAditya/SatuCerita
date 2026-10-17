import React, { useState } from "react";
import {
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  MessageCircle,
  Tag,
  CreditCard,
  CheckCircle2,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PATHS } from "@/routes";
import { getTemplateBySlug, formatRupiah } from "@/data/templates";
import { OrderItem } from "@/pages/app/types";

interface CheckoutPageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onCreateOrder?: (order: OrderItem) => void;
}

type PaymentMethod = "bni_va" | "bri_va" | "mandiri_va" | "permata_va";

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  description: string;
}[] = [
  { id: "bni_va", label: "BNI", description: "Virtual Account" },
  { id: "bri_va", label: "BRI", description: "Virtual Account" },
  { id: "mandiri_va", label: "Mandiri", description: "Virtual Account" },
  { id: "permata_va", label: "Permata", description: "Virtual Account" },
];

function generateInvoiceNo(): string {
  const now = new Date();
  const d = now.getDate().toString().padStart(2, "0");
  const m = (now.getMonth() + 1).toString().padStart(2, "0");
  const y = now.getFullYear().toString().slice(2);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 7);
  return `PS${d}${m}${y}${rand}`;
}

function generateVaNumber(): string {
  return "13" + Math.floor(Math.random() * 1e14).toString().padStart(14, "0");
}

function formatDate(d: Date): string {
  return `${d.getDate()} ${["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"][d.getMonth()]} ${d.getFullYear()}, ${d.getHours().toString().padStart(2,"0")}.${d.getMinutes().toString().padStart(2,"0")}`;
}

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  currentPath,
  onNavigate,
  onCreateOrder,
}) => {
  // Extract template slug from /app/checkout/:slug or /checkout/:slug
  const rawSlug = currentPath.replace(/^(?:\/app)?\/checkout\/?/, "").split("?")[0].split("#")[0];
  const template = getTemplateBySlug(rawSlug);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [voucherError, setVoucherError] = useState("");

  if (!template) {
    return (
      <div className="min-h-screen bg-[#faf9ff] flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-lg font-black text-neutral-800">Template tidak ditemukan</h2>
          <button
            onClick={() => onNavigate(PATHS.katalog)}
            className="mt-3 text-[#7d6aee] font-bold text-sm underline cursor-pointer"
          >
            Kembali ke Katalog
          </button>
        </div>
      </div>
    );
  }

  const originalPrice = template.originalPrice;
  const discountPrice = template.discountPrice;
  const discountAmount = voucherApplied ? Math.round(discountPrice * 0.1) : 0;
  const finalTotal = discountPrice - discountAmount;

  const handleApplyVoucher = () => {
    if (voucherCode.trim().toUpperCase() === "HEMAT10") {
      setVoucherApplied(true);
      setVoucherError("");
    } else {
      setVoucherApplied(false);
      setVoucherError("Kode voucher tidak valid atau sudah kadaluarsa.");
    }
  };

  const handleBayar = () => {
    if (!selectedMethod) return;

    const now = new Date();
    const dueDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const invoiceNo = generateInvoiceNo();

    const order: OrderItem = {
      id: invoiceNo,
      invoiceNo,
      date: formatDate(now),
      dueDate: formatDate(dueDate),
      status: "pending",
      templateName: template.title,
      templateCategory: template.category,
      templateCover: template.image,
      packageTier: template.badge,
      basePrice: discountPrice,
      addons: [],
      discountCode: voucherApplied ? voucherCode : undefined,
      discountAmount: voucherApplied ? discountAmount : 0,
      uniqueCode: Math.floor(Math.random() * 900) + 100,
      total: finalTotal,
      paymentMethod: "bca_va",
      vaNumber: generateVaNumber(),
      slug: template.slug,
      customerName: "",
      customerEmail: "",
      customerPhone: "",
    };

    if (onCreateOrder) {
      onCreateOrder(order);
    }

    const isStandalone = typeof window !== "undefined" && window.location.hostname.startsWith("app.");
    const prefix = isStandalone ? "" : "/app";
    onNavigate(`${prefix}/order/${invoiceNo}`);
  };

  return (
    <div className="min-h-screen bg-[#faf9ff] font-sans text-neutral-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {/* Back Link + Title */}
        <div className="mb-5 sm:mb-7">
          <button
            type="button"
            onClick={() => onNavigate(`/katalog/${template.slug}`)}
            className="inline-flex items-center gap-1.5 text-sm font-bold text-[#7d6aee] hover:text-[#6b58e0] transition-colors cursor-pointer mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Undangan Saya
          </button>
          <p className="text-xs font-bold text-neutral-400 uppercase tracking-widest mb-1">
            CHECKOUT
          </p>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
            Konfirmasi pesanan
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Periksa template pilihan Anda sebelum melanjutkan ke pembayaran.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-5 lg:gap-7 items-start">
          {/* LEFT COLUMN */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Template Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200 border-b-[3px] border-b-neutral-300 shadow-2xs overflow-hidden">
              <div className="flex flex-col sm:flex-row">
                {/* Template Image */}
                <div
                  className="sm:w-52 lg:w-60 shrink-0 relative flex items-center justify-center p-4 sm:p-6"
                  style={{ backgroundColor: template.frameBg }}
                >
                  <div className="relative h-[200px] sm:h-[220px] aspect-[9/16] max-w-[110px] bg-neutral-950 rounded-[20px] p-1 shadow-xl border border-neutral-800 overflow-hidden mx-auto">
                    <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-neutral-900 rounded-full z-20" />
                    <div className="w-full h-full rounded-[15px] overflow-hidden relative">
                      <img
                        src={template.image}
                        alt={template.title}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-2 text-white text-center">
                        <p className="text-[8px] uppercase tracking-widest font-serif opacity-80">Pawiwahan</p>
                        <p className="text-[11px] font-serif font-bold">John & Jane</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Template Info */}
                <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
                  <div>
                    {/* Badges */}
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="inline-flex px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-[#7d6aee] text-[11px] font-bold uppercase tracking-wide">
                        {template.category}
                      </span>
                      <span className="inline-flex px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold uppercase tracking-wide">
                        {template.badge}
                      </span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                      {template.title}
                    </h2>
                    <p className="text-sm text-neutral-600 leading-relaxed mt-2 font-normal">
                      {template.description}
                    </p>
                    <button
                      type="button"
                      onClick={() => onNavigate(`/katalog/${template.slug}`)}
                      className="inline-flex items-center gap-1.5 mt-3 text-sm font-bold text-[#7d6aee] hover:text-[#6b58e0] transition-colors cursor-pointer underline underline-offset-4"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Lihat pratinjau template
                    </button>
                  </div>

                  {/* Feature Highlights */}
                  <div className="mt-4 pt-4 border-t border-neutral-100 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {[
                      "Edit semua isi undangan kapan saja",
                      "Kelola tamu, RSVP, dan buku tamu digital",
                      "Scanner QR check-in untuk hari H",
                    ].map((feat, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#7d6aee] shrink-0 mt-0.5" />
                        <span className="text-xs text-neutral-700 font-medium leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Card */}
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200 border-b-[3px] border-b-neutral-300 shadow-2xs p-4 sm:p-5">
              <h3 className="text-base sm:text-lg font-black text-neutral-900 mb-4">
                Pilih metode pembayaran
              </h3>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-neutral-400 mb-3">
                TRANSFER VIRTUAL ACCOUNT
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setSelectedMethod(method.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all cursor-pointer text-left ${
                      selectedMethod === method.id
                        ? "border-[#7d6aee] bg-purple-50/50 shadow-xs"
                        : "border-neutral-200 hover:border-neutral-300 bg-white"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
                        <Building2 className="w-5 h-5 text-neutral-600" />
                      </div>
                      <div>
                        <p className="text-sm font-extrabold text-neutral-900">{method.label}</p>
                        <p className="text-xs text-neutral-500 font-medium">{method.description}</p>
                      </div>
                    </div>
                    <div
                      className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        selectedMethod === method.id
                          ? "border-[#7d6aee] bg-[#7d6aee]"
                          : "border-neutral-300"
                      }`}
                    >
                      {selectedMethod === method.id && (
                        <div className="size-2 rounded-full bg-white" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Order Summary */}
          <div className="w-full lg:w-80 xl:w-88 shrink-0 space-y-4">
            <div className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200 border-b-[3px] border-b-neutral-300 shadow-2xs p-5">
              <h3 className="text-base font-black text-neutral-900 mb-4">
                Ringkasan pembayaran
              </h3>

              {/* Price Row */}
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-neutral-100">
                <span className="text-sm text-neutral-600 font-medium">Template {template.title}</span>
                <div className="text-right">
                  <p className="text-xs text-neutral-400 line-through font-medium">
                    {formatRupiah(originalPrice)}
                  </p>
                  <p className="text-sm font-bold text-neutral-900">
                    {formatRupiah(discountPrice)}
                  </p>
                </div>
              </div>

              {/* Voucher */}
              <div className="mb-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Tag className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm font-semibold text-neutral-600">
                    Punya kode voucher?
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={voucherCode}
                    onChange={(e) => {
                      setVoucherCode(e.target.value);
                      setVoucherError("");
                    }}
                    placeholder="KODE VOUCHER"
                    className="flex-1 border border-neutral-200 rounded-xl px-3 py-2 text-xs font-semibold placeholder:text-neutral-300 focus:outline-none focus:border-[#7d6aee] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={handleApplyVoucher}
                    className="px-3 py-2 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer shrink-0"
                  >
                    Pakai
                  </button>
                </div>
                {voucherError && (
                  <p className="text-rose-500 text-xs font-medium mt-1">{voucherError}</p>
                )}
                {voucherApplied && (
                  <p className="text-emerald-600 text-xs font-bold mt-1">
                    ✓ Voucher berhasil! Hemat {formatRupiah(discountAmount)}
                  </p>
                )}
              </div>

              <div className="border-t border-dashed border-neutral-200 pt-4 mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-neutral-700">Total bayar</span>
                  <span className="text-2xl font-black text-neutral-900">
                    {formatRupiah(finalTotal)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400 font-medium">Metode</span>
                  <span className="text-xs font-bold text-neutral-600">
                    {selectedMethod
                      ? PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.label + " Virtual Account"
                      : "Belum dipilih"}
                  </span>
                </div>
              </div>

              {/* Pay Button */}
              <Button
                variant="primary"
                size="lg"
                onClick={handleBayar}
                disabled={!selectedMethod}
                className={`w-full !py-3.5 !text-base !font-extrabold flex items-center justify-center gap-2 ${
                  !selectedMethod ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <CreditCard className="w-4.5 h-4.5" />
                Bayar sekarang
              </Button>
              <p className="text-[11px] text-neutral-400 text-center mt-2.5 leading-relaxed">
                Kode pembayaran langsung tampil di halaman berikutnya. Status diperbarui otomatis setelah Anda membayar.
              </p>
            </div>

            {/* Trust badges */}
            <div className="bg-white rounded-2xl border border-dashed border-neutral-200 p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                <p className="text-xs text-neutral-600 font-medium leading-snug">
                  Pembayaran diproses aman lewat payment gateway resmi dan dikonfirmasi otomatis.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  window.open(
                    "https://wa.me/6285187978443?text=Halo%20Satu%20Cerita,%20saya%20butuh%20bantuan%20terkait%20pembayaran",
                    "_blank"
                  )
                }
                className="inline-flex items-center gap-2 text-xs font-bold text-neutral-700 hover:text-[#7d6aee] transition-colors cursor-pointer underline underline-offset-4"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                Butuh bantuan? Chat admin via WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
