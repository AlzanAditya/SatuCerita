import React, { useState, useMemo } from "react";
import {
  ShoppingBag,
  Clock,
  CheckCircle2,
  ArrowLeft,
  ChevronRight,
  Sparkles,
  Receipt,
  Copy,
  CreditCard,
  ShieldCheck,
  Download,
  RefreshCw,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PATHS } from "@/routes";
import { OrderItem } from "./types";

export interface PesananPageProps {
  orders: OrderItem[];
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  onNavigate: (path: string) => void;
  onConfirmPaid?: (orderId: string) => void;
  showToast?: (msg: string) => void;
}

export const PesananPage: React.FC<PesananPageProps> = ({
  orders,
  selectedOrderId,
  setSelectedOrderId,
  onNavigate,
  onConfirmPaid,
  showToast,
}) => {
  const [orderFilter, setOrderFilter] = useState<"semua" | "pending" | "paid">("semua");
  const [detailPaymentMethod, setDetailPaymentMethod] = useState<"qris" | "bca_va" | "mandiri_va" | "gopay">("qris");
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopyFeedback(label);
      if (showToast) showToast(label);
      setTimeout(() => setCopyFeedback(null), 2500);
    } catch (_e) {}
  };

  const filteredOrders = useMemo(() => {
    if (orderFilter === "semua") return orders;
    return orders.filter((o) => o.status === orderFilter);
  }, [orders, orderFilter]);

  const activeOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return orders.find((o) => o.id === selectedOrderId) || null;
  }, [selectedOrderId, orders]);

  const handleVerify = () => {
    if (!activeOrder) return;
    setIsVerifyingPayment(true);
    setTimeout(() => {
      setIsVerifyingPayment(false);
      if (onConfirmPaid) {
        onConfirmPaid(activeOrder.id);
      }
      if (showToast) {
        showToast("Selamat! Pembayaran berhasil diverifikasi otomatis.");
      }
    }, 1200);
  };

  // -------------------------------------------------------------
  // VIEW: DETAIL PESANAN
  // -------------------------------------------------------------
  if (selectedOrderId && activeOrder) {
    return (
      <div className="space-y-4 sm:space-y-5 animate-fadeIn">
        {/* Header Kembali & Judul */}
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => setSelectedOrderId(null)}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#7d6aee] hover:text-[#6b58e0] transition-colors cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-purple-100 shadow-2xs hover:shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Pesanan</span>
          </button>

          <span
            className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase ${
              activeOrder.status === "paid"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : activeOrder.status === "pending"
                ? "bg-amber-50 text-amber-700 border border-amber-200"
                : "bg-neutral-100 text-neutral-600 border border-neutral-200"
            }`}
          >
            {activeOrder.status === "paid"
              ? "Lunas"
              : activeOrder.status === "pending"
              ? "Menunggu Pembayaran"
              : "Dibatalkan"}
          </span>
        </div>

        {/* Countdown / Status Banner */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            activeOrder.status === "paid"
              ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
              : "bg-amber-50/80 border-amber-200/90 text-amber-950"
          }`}
        >
          <div className="flex items-start gap-3">
            <div
              className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                activeOrder.status === "paid"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {activeOrder.status === "paid" ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5 animate-pulse" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm sm:text-base font-extrabold tracking-tight">
                {activeOrder.status === "paid"
                  ? "Pembayaran Terkonfirmasi"
                  : "Selesaikan Pembayaran Anda"}
              </h4>
              <p className="text-xs sm:text-sm mt-0.5 opacity-90 leading-relaxed">
                {activeOrder.status === "paid"
                  ? "Pesanan Anda telah aktif. Template undangan digital siap diedit dan disebarkan ke tamu."
                  : `Batas waktu pembayaran hingga ${activeOrder.dueDate}. Undangan otomatis aktif setelah dana diterima.`}
              </p>
            </div>
          </div>
        </div>

        {/* Ringkasan Invoice & Info Transaksi */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div>
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Nomor Pesanan / Invoice
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <strong className="text-sm sm:text-base font-black text-neutral-900 tracking-tight">
                  #{activeOrder.invoiceNo}
                </strong>
                <button
                  type="button"
                  onClick={() => handleCopy(activeOrder.invoiceNo, "Invoice disalin!")}
                  className="p-1 rounded-md text-neutral-400 hover:text-[#7d6aee] hover:bg-purple-50 transition-colors cursor-pointer"
                  title="Salin No Invoice"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                {copyFeedback === "Invoice disalin!" && (
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                    Disalin!
                  </span>
                )}
              </div>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                Waktu Pesan
              </span>
              <span className="text-xs sm:text-sm font-semibold text-neutral-700 block mt-0.5">
                {activeOrder.date}
              </span>
            </div>
          </div>

          {/* Card Template Yang Dipesan */}
          <div className="flex items-center gap-3.5 pt-1">
            <img
              src={activeOrder.templateCover}
              alt={activeOrder.templateName}
              className="size-18 sm:size-20 rounded-xl object-cover border border-purple-100 shadow-2xs shrink-0"
            />
            <div className="flex-1 min-w-0">
              <span className="inline-block px-2 py-0.5 rounded-md bg-purple-50 text-[#7d6aee] text-[10px] font-bold">
                {activeOrder.templateCategory}
              </span>
              <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 truncate mt-1">
                {activeOrder.templateName}
              </h3>
              <p className="text-xs text-neutral-500 font-medium truncate mt-0.5">
                {activeOrder.packageTier}
              </p>
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs font-bold text-[#7d6aee]">
                  Rp {activeOrder.basePrice.toLocaleString("id-ID")}
                </span>
                <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  Masa Aktif Selamanya
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Add-ons & Layanan Tambahan */}
        {activeOrder.addons && activeOrder.addons.length > 0 && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-2xs">
            <h4 className="text-xs sm:text-sm font-bold text-neutral-900 mb-2.5 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#7d6aee]" />
              <span>Fitur & Layanan Tambahan</span>
            </h4>
            <div className="space-y-2">
              {activeOrder.addons.map((add) => (
                <div
                  key={add.id}
                  className="flex items-center justify-between text-xs py-1.5 border-b border-neutral-50 last:border-b-0"
                >
                  <span className="font-semibold text-neutral-700">{add.name}</span>
                  <span className="font-bold text-neutral-900">
                    +Rp {add.price.toLocaleString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rincian Biaya (Breakdown) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-2xs space-y-2.5">
          <h4 className="text-xs sm:text-sm font-bold text-neutral-900 mb-1 flex items-center gap-1.5">
            <Receipt className="w-4 h-4 text-[#7d6aee]" />
            <span>Rincian Pembayaran</span>
          </h4>

          <div className="flex items-center justify-between text-xs text-neutral-600">
            <span>Harga Paket Template</span>
            <span className="font-semibold text-neutral-800">
              Rp {activeOrder.basePrice.toLocaleString("id-ID")}
            </span>
          </div>

          {activeOrder.addons?.map((addon) => (
            <div key={addon.id} className="flex items-center justify-between text-xs text-neutral-600">
              <span>{addon.name}</span>
              <span className="font-semibold text-neutral-800">
                Rp {addon.price.toLocaleString("id-ID")}
              </span>
            </div>
          ))}

          {activeOrder.discountAmount && activeOrder.discountAmount > 0 && (
            <div className="flex items-center justify-between text-xs text-emerald-600 font-semibold">
              <span>Diskon Promo ({activeOrder.discountCode})</span>
              <span>-Rp {activeOrder.discountAmount.toLocaleString("id-ID")}</span>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-neutral-600">
            <span>Kode Unik Verifikasi</span>
            <span className="font-semibold text-neutral-800">
              +Rp {activeOrder.uniqueCode.toLocaleString("id-ID")}
            </span>
          </div>

          <div className="pt-2.5 border-t border-neutral-100 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-neutral-900 block">Total Tagihan</span>
              <span className="text-[10px] text-neutral-400">Termasuk pajak & biaya admin</span>
            </div>
            <strong className="text-base sm:text-lg font-black text-[#7d6aee]">
              Rp {activeOrder.total.toLocaleString("id-ID")}
            </strong>
          </div>
        </div>

        {/* Metode Pembayaran & Interaktif QRIS / Virtual Account */}
        {activeOrder.status === "pending" && (
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-2xs space-y-3.5">
            <h4 className="text-xs sm:text-sm font-bold text-neutral-900 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-[#7d6aee]" />
              <span>Pilih Saluran Pembayaran</span>
            </h4>

            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDetailPaymentMethod("qris")}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  detailPaymentMethod === "qris"
                    ? "bg-[#7d6aee] text-white border-[#7d6aee] shadow-2xs"
                    : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                }`}
              >
                QRIS
              </button>
              <button
                type="button"
                onClick={() => setDetailPaymentMethod("bca_va")}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  detailPaymentMethod === "bca_va"
                    ? "bg-[#7d6aee] text-white border-[#7d6aee] shadow-2xs"
                    : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                }`}
              >
                BCA VA
              </button>
              <button
                type="button"
                onClick={() => setDetailPaymentMethod("mandiri_va")}
                className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  detailPaymentMethod === "mandiri_va"
                    ? "bg-[#7d6aee] text-white border-[#7d6aee] shadow-2xs"
                    : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                }`}
              >
                Mandiri VA
              </button>
            </div>

            {detailPaymentMethod === "qris" ? (
              <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 flex flex-col items-center text-center">
                <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                  Scan QRIS Menggunakan E-Wallet / Mobile Banking
                </span>

                <div className="bg-white p-3 rounded-2xl border-2 border-neutral-200 shadow-sm relative group">
                  <div className="size-44 sm:size-48 bg-white flex flex-col items-center justify-center p-2 relative">
                    <div className="w-full h-full bg-neutral-900 rounded-lg p-2.5 flex flex-col justify-between relative overflow-hidden">
                      <div className="flex justify-between">
                        <div className="size-8 bg-white rounded-xs p-1">
                          <div className="w-full h-full bg-neutral-900" />
                        </div>
                        <div className="size-8 bg-white rounded-xs p-1">
                          <div className="w-full h-full bg-neutral-900" />
                        </div>
                      </div>
                      <div className="flex items-center justify-center">
                        <div className="px-2 py-1 rounded bg-[#7d6aee] text-white font-extrabold text-[9px] shadow-sm">
                          SATU CERITA QRIS
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <div className="size-8 bg-white rounded-xs p-1">
                          <div className="w-full h-full bg-neutral-900" />
                        </div>
                        <div className="size-8 border-2 border-white rounded-xs flex items-center justify-center">
                          <div className="size-4 bg-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-[11px] text-neutral-500 mt-2 font-medium">
                  BCA Mobile • GoPay • OVO • DANA • ShopeePay • Livin' Mandiri
                </p>

                <button
                  type="button"
                  onClick={() => showToast && showToast("QR Code berhasil diunduh ke perangkat")}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-neutral-200 text-neutral-700 text-xs font-bold hover:bg-neutral-50 shadow-2xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#7d6aee]" />
                  <span>Unduh QR Code</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2.5">
                <span className="text-[11px] font-semibold text-neutral-500 block uppercase tracking-wider">
                  Nomor Virtual Account {detailPaymentMethod === "bca_va" ? "BCA" : "Mandiri"}
                </span>
                <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-neutral-200">
                  <strong className="text-base sm:text-lg font-black text-neutral-900 tracking-wider">
                    {activeOrder.vaNumber || "8801 2948 1029 381"}
                  </strong>
                  <button
                    type="button"
                    onClick={() => handleCopy(activeOrder.vaNumber || "8801 2948 1029 381", "Nomor VA disalin!")}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#7d6aee] text-white text-xs font-bold hover:bg-[#6b58e0] cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin</span>
                  </button>
                </div>
                {copyFeedback === "Nomor VA disalin!" && (
                  <span className="text-[11px] font-bold text-emerald-600 block">
                    Nomor Virtual Account berhasil disalin ke clipboard!
                  </span>
                )}
                <div className="text-xs text-neutral-500 font-medium">
                  Atas Nama: <strong className="text-neutral-800">PT SATU CERITA DIGITAL</strong>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Panduan Pembayaran */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-2xs space-y-3">
          <h4 className="text-xs sm:text-sm font-bold text-neutral-900 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#7d6aee]" />
            <span>Petunjuk Pembayaran Mudah</span>
          </h4>
          <div className="space-y-2 text-xs text-neutral-600 leading-relaxed">
            <div className="flex items-start gap-2.5">
              <span className="size-5 rounded-full bg-purple-100 text-[#7d6aee] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                1
              </span>
              <p>Buka aplikasi m-Banking atau e-Wallet kesayangan Anda.</p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="size-5 rounded-full bg-purple-100 text-[#7d6aee] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                2
              </span>
              <p>
                Pilih menu <strong>Bayar QRIS</strong> atau <strong>Transfer Virtual Account</strong>.
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="size-5 rounded-full bg-purple-100 text-[#7d6aee] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                3
              </span>
              <p>
                Pastikan jumlah transfer tepat hingga 3 digit terakhir (
                <strong className="text-[#7d6aee]">Rp {activeOrder.total.toLocaleString("id-ID")}</strong>).
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="size-5 rounded-full bg-purple-100 text-[#7d6aee] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                4
              </span>
              <p>Sistem memverifikasi secara otomatis dalam 1-3 menit tanpa perlu kirim bukti transfer manual.</p>
            </div>
          </div>
        </div>

        {/* Data Pemesan */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-2xs space-y-2">
          <h4 className="text-xs sm:text-sm font-bold text-neutral-900 mb-2">
            Data Pemesan & Tautan Undangan
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-neutral-400 block">Nama Pemesan</span>
              <strong className="text-neutral-800">{activeOrder.customerName}</strong>
            </div>
            <div>
              <span className="text-neutral-400 block">WhatsApp</span>
              <strong className="text-neutral-800">{activeOrder.customerPhone}</strong>
            </div>
            <div className="col-span-2 pt-1 border-t border-neutral-100">
              <span className="text-neutral-400 block">Tautan Undangan</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <strong className="text-[#7d6aee] font-bold">
                  satucerita.com/{activeOrder.slug}
                </strong>
                <button
                  type="button"
                  onClick={() => handleCopy(`https://satucerita.com/${activeOrder.slug}`, "Link disalin!")}
                  className="p-1 rounded text-neutral-400 hover:text-[#7d6aee] cursor-pointer"
                  title="Salin Link"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="space-y-2 pt-2">
          {activeOrder.status === "pending" ? (
            <>
              <button
                type="button"
                disabled={isVerifyingPayment}
                onClick={handleVerify}
                className="w-full py-3.5 px-4 rounded-xl bg-[#7d6aee] hover:bg-[#6b58e0] text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                {isVerifyingPayment ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Memeriksa Status Pembayaran...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Saya Sudah Membayar (Cek Verifikasi)</span>
                  </>
                )}
              </button>

              <a
                href="https://wa.me/6285187978443?text=Halo%20Satu%20Cerita,%20saya%20ingin%20konfirmasi%20pesanan"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-4 h-4 text-[#25D366]" />
                <span>Butuh Bantuan? Hubungi CS WhatsApp</span>
              </a>
            </>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedOrderId(null);
                  onNavigate("/app/home");
                }}
                className="flex-1 py-3 px-4 rounded-xl bg-[#7d6aee] hover:bg-[#6b58e0] text-white font-extrabold text-xs shadow-sm transition-all cursor-pointer"
              >
                Mulai Edit Undangan
              </button>
              <button
                type="button"
                onClick={() => showToast && showToast("Pratinjau undangan dibuka di tab baru")}
                className="px-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-700 font-bold text-xs hover:bg-neutral-50 cursor-pointer"
              >
                Lihat Demo
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW: LIST PESANAN
  // -------------------------------------------------------------
  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn">
      {/* Filter Status Pesanan */}
      <div className="flex items-center justify-start">
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-purple-100 border-b-[2px] border-b-purple-200/70 shadow-2xs select-none overflow-x-auto">
          <button
            type="button"
            onClick={() => setOrderFilter("semua")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
              orderFilter === "semua"
                ? "bg-[#7d6aee] text-white shadow-2xs"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setOrderFilter("pending")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
              orderFilter === "pending"
                ? "bg-[#7d6aee] text-white shadow-2xs"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Menunggu Bayar
          </button>
          <button
            type="button"
            onClick={() => setOrderFilter("paid")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
              orderFilter === "paid"
                ? "bg-[#7d6aee] text-white shadow-2xs"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Lunas
          </button>
        </div>
      </div>

      {/* KONDISI EMPTY STATE PESANAN */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-purple-100 shadow-2xs flex flex-col items-center text-center">
          <div className="size-20 sm:size-24 rounded-3xl bg-purple-50/80 border border-purple-200/70 flex items-center justify-center text-[#7d6aee] shadow-sm mb-4">
            <ShoppingBag className="w-9 h-9 sm:w-11 sm:h-11 text-[#7d6aee]" />
          </div>

          <h3 className="text-base sm:text-lg font-black tracking-tight text-neutral-900">
            Belum Ada Pesanan
          </h3>

          <p className="text-xs sm:text-sm text-neutral-500 font-medium max-w-sm mt-1.5 leading-relaxed">
            Kamu belum memiliki riwayat pesanan. Semua pesanan template dan add-on undangan digital akan tercatat rapi di halaman ini.
          </p>

          <Button
            variant="primary"
            size="lg"
            onClick={() => onNavigate(PATHS.katalog)}
            className="mt-5 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Jelajahi Katalog Template</span>
          </Button>
        </div>
      ) : (
        /* JIKA SUDAH ADA PESANAN */
        <div className="space-y-3.5">
          {filteredOrders.map((ord) => (
            <div
              key={ord.id}
              onClick={() => setSelectedOrderId(ord.id)}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 hover:border-purple-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div>
                  <span className="text-[11px] font-semibold text-neutral-400 block">
                    No. Pesanan
                  </span>
                  <strong className="text-xs sm:text-sm font-black text-neutral-900">
                    #{ord.invoiceNo}
                  </strong>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                    ord.status === "paid"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}
                >
                  {ord.status === "paid" ? "Lunas" : "Menunggu Bayar"}
                </span>
              </div>

              <div className="flex items-center gap-3.5 py-3">
                <img
                  src={ord.templateCover}
                  alt={ord.templateName}
                  className="size-14 sm:size-16 rounded-xl object-cover border border-purple-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-extrabold text-neutral-900 truncate">
                    {ord.templateName}
                  </h4>
                  <p className="text-[11px] text-neutral-500 font-medium truncate mt-0.5">
                    {ord.packageTier}
                  </p>
                  <div className="text-xs font-black text-[#7d6aee] mt-1">
                    Rp {ord.total.toLocaleString("id-ID")}
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-neutral-50 flex items-center justify-between text-xs">
                <span className="text-neutral-400 font-medium">{ord.date}</span>
                <span className="font-bold text-[#7d6aee] flex items-center gap-1 group-hover:underline">
                  Lihat Detail Pesanan
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}

          {/* Card di bawah item: Tidak ada pesanan lagi */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs flex items-center gap-3.5 text-left">
            <div className="size-10 rounded-xl bg-purple-50 text-[#7d6aee] flex items-center justify-center shrink-0 border border-purple-100">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h5 className="text-xs sm:text-sm font-extrabold text-neutral-900">
                Tidak ada pesanan lagi
              </h5>
              <p className="text-[11px] sm:text-xs text-neutral-500 font-medium mt-0.5">
                Semua riwayat pesanan undangan digital Anda telah ditampilkan.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PesananPage;
