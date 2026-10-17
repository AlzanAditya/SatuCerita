import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Clock,
  Copy,
  RefreshCw,
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Building2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { OrderItem } from "@/pages/app/types";
import { formatRupiah } from "@/data/templates";

interface OrderDetailPageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  orders: OrderItem[];
  onUpdateOrderStatus?: (id: string, status: "pending" | "paid" | "cancelled") => void;
  showToast?: (msg: string) => void;
}

function formatCountdown(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600).toString().padStart(2, "0");
  const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, "0");
  const s = (totalSec % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  bni_va: "BNI Virtual Account",
  bri_va: "BRI Virtual Account",
  mandiri_va: "Mandiri Virtual Account",
  permata_va: "Permata Virtual Account",
  bca_va: "BCA Virtual Account",
  qris: "QRIS",
  gopay: "GoPay",
};

export const OrderDetailPage: React.FC<OrderDetailPageProps> = ({
  currentPath,
  onNavigate,
  orders,
  onUpdateOrderStatus,
  showToast,
}) => {
  // Extract invoice from /app/order/:invoiceNo or /order/:invoiceNo
  const invoiceNo = currentPath.replace(/^(?:\/app)?\/order\/?/, "").split("?")[0].split("#")[0];
  const order = orders.find((o) => o.id === invoiceNo || o.invoiceNo === invoiceNo);

  const isStandalone = typeof window !== "undefined" && window.location.hostname.startsWith("app.");
  const prefix = isStandalone ? "" : "/app";

  const [timeLeft, setTimeLeft] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    if (!order || order.status !== "pending") return;
    // 24 hours from creation
    const due = new Date(order.dueDate.replace(
      /(\d+) (Jan|Feb|Mar|Apr|Mei|Jun|Jul|Agu|Sep|Okt|Nov|Des) (\d{4}), (\d{2})\.(\d{2})/,
      (_, d, m, y, h, min) => {
        const months: Record<string, string> = { Jan:"01",Feb:"02",Mar:"03",Apr:"04",Mei:"05",Jun:"06",Jul:"07",Agu:"08",Sep:"09",Okt:"10",Nov:"11",Des:"12" };
        return `${y}-${months[m]}-${d.padStart(2,"0")}T${h}:${min}:00`;
      }
    )).getTime();

    const update = () => {
      const diff = due - Date.now();
      setTimeLeft(Math.max(0, diff));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [order]);

  const handleCopy = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      if (showToast) showToast(label);
    } catch (_e) {}
  };

  const handleVerify = () => {
    if (!order) return;
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      if (onUpdateOrderStatus) {
        onUpdateOrderStatus(order.id, "paid");
      }
      if (showToast) showToast("Selamat! Pembayaran berhasil diverifikasi.");
    }, 1500);
  };

  const handleChangeMethod = () => {
    if (!order) return;
    onNavigate(`${prefix}/checkout/${order.slug}`);
  };

  if (!order) {
    return (
      <div className="min-h-screen bg-[#faf9ff] flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-lg font-black text-neutral-800">Pesanan tidak ditemukan</h2>
          <button
            onClick={() => onNavigate(`${prefix}/pesanan`)}
            className="mt-3 text-[#7d6aee] font-bold text-sm underline cursor-pointer"
          >
            Kembali ke Pesanan
          </button>
        </div>
      </div>
    );
  }

  const methodLabel = PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod;

  return (
    <div className="min-h-screen bg-[#faf9ff] font-sans text-neutral-800">
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
        {/* Back */}
        <button
          type="button"
          onClick={() => onNavigate(`${prefix}/pesanan`)}
          className="inline-flex items-center gap-1.5 text-sm font-bold text-[#7d6aee] hover:text-[#6b58e0] transition-colors cursor-pointer mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke pesanan
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <p className="text-xs font-bold text-neutral-400 font-mono tracking-wider mb-0.5">
              {order.invoiceNo}
            </p>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
              Detail pesanan
            </h1>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide border shrink-0 ${
              order.status === "paid"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : order.status === "pending"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-neutral-100 text-neutral-600 border-neutral-200"
            }`}
          >
            {order.status === "paid" ? "Lunas" : order.status === "pending" ? "Menunggu bayar" : "Dibatalkan"}
          </span>
        </div>

        <div className="space-y-4">
          {/* Pending Payment Card */}
          {order.status === "pending" && (
            <div className="bg-amber-400 rounded-2xl sm:rounded-3xl p-5 text-neutral-900 shadow-sm">
              {/* Status Header */}
              <div className="flex items-start gap-3 mb-4">
                <div className="size-10 rounded-xl bg-amber-300/60 flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 text-neutral-900" />
                </div>
                <div>
                  <h2 className="text-base font-black text-neutral-900">Menunggu pembayaran</h2>
                  <p className="text-xs font-medium text-neutral-800/80 leading-snug mt-0.5">
                    Selesaikan pembayaran sebelum batas waktu. Status akan diperbarui otomatis setelah pembayaran diterima.
                  </p>
                </div>
              </div>

              {/* Countdown */}
              <div className="bg-white/30 rounded-xl px-4 py-3 mb-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-800/70 mb-1">
                  SISA WAKTU PEMBAYARAN
                </p>
                <p className="text-3xl font-black tracking-widest text-neutral-900 font-mono">
                  {formatCountdown(timeLeft)}
                </p>
              </div>

              {/* Bank Name */}
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-black">Transfer ke {methodLabel.replace(" Virtual Account", "")}</h3>
              </div>

              {/* VA Number */}
              <div className="bg-white/30 rounded-xl p-4 mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-800/70 mb-1">
                  NOMOR VIRTUAL ACCOUNT
                </p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xl sm:text-2xl font-black font-mono tracking-wide text-neutral-900 break-all">
                    {order.vaNumber || "1308300944491659"}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(order.vaNumber || "1308300944491659", "Nomor VA disalin!")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-neutral-900/30 bg-white/40 font-bold text-xs shrink-0 cursor-pointer hover:bg-white/60 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Salin
                  </button>
                </div>
              </div>

              {/* Total */}
              <div className="bg-white/30 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
                <span className="text-sm font-bold">Total bayar</span>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-black font-mono">{formatRupiah(order.total)}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(order.total.toString(), "Nominal disalin!")}
                    className="p-1 rounded-lg hover:bg-white/40 transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <p className="text-xs font-medium text-neutral-800/70 leading-relaxed mb-4">
                Bayar lewat m-banking, internet banking, atau ATM dengan menu Transfer ke Virtual Account. Nominal harus persis sama.
              </p>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={isVerifying}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-neutral-900/30 bg-white/40 font-bold text-sm cursor-pointer hover:bg-white/60 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isVerifying ? "animate-spin" : ""}`} />
                  Cek status
                </button>
                <button
                  type="button"
                  onClick={handleChangeMethod}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-neutral-900/30 bg-white/40 font-bold text-sm cursor-pointer hover:bg-white/60 transition-colors"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Ganti metode pembayaran
                </button>
              </div>
              <p className="text-[11px] text-neutral-800/60 font-medium mt-2 text-center">
                Memeriksa status pembayaran otomatis setiap 5 detik...
              </p>
            </div>
          )}

          {/* Paid Status Card */}
          {order.status === "paid" && (
            <div className="bg-emerald-50 border border-emerald-200 border-b-[3px] border-b-emerald-300 rounded-2xl p-5 flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-black text-emerald-800">Pembayaran Berhasil!</h2>
                <p className="text-xs text-emerald-700 font-medium mt-1 leading-snug">
                  Pesanan Anda telah dikonfirmasi. Tim kami akan segera memproses undangan Anda.
                </p>
              </div>
            </div>
          )}

          {/* Cancelled Status Card */}
          {order.status === "cancelled" && (
            <div className="bg-rose-50 border border-rose-200 border-b-[3px] border-b-rose-300 rounded-2xl p-5 flex items-start gap-3">
              <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-black text-rose-800">Pesanan Dibatalkan</h2>
                <p className="text-xs text-rose-700 font-medium mt-1 leading-snug">
                  Pesanan ini telah dibatalkan. Silakan buat pesanan baru jika masih ingin melanjutkan.
                </p>
              </div>
            </div>
          )}

          {/* Rincian Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200 border-b-[3px] border-b-neutral-300 shadow-2xs p-5">
            <h3 className="text-base font-black text-neutral-900 mb-4">Rincian</h3>
            <div className="space-y-0 divide-y divide-neutral-100">
              {[
                { label: "Kode", value: order.invoiceNo, mono: true },
                { label: "Template", value: `${order.templateName} · ${order.templateCategory}` },
                { label: "Jumlah", value: formatRupiah(order.total) },
                { label: "Pembayaran", value: "Duitku", badge: "PRODUCTION" },
                { label: "Metode", value: methodLabel },
                { label: "Dibuat", value: order.date },
                {
                  label: "Dibayar",
                  value: order.status === "paid" ? order.date : "—",
                },
                { label: "Batas bayar", value: order.dueDate },
              ].map((row, i) => (
                <div key={i} className="flex items-start justify-between gap-4 py-3">
                  <span className="text-xs font-semibold text-neutral-500 shrink-0">{row.label}</span>
                  <div className="flex items-center gap-2 text-right">
                    <span
                      className={`text-xs font-bold text-neutral-800 break-all ${row.mono ? "font-mono tracking-wide" : ""}`}
                    >
                      {row.value}
                    </span>
                    {row.badge && (
                      <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wide shrink-0">
                        {row.badge}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Demo: Change Status (for testing) */}
          {onUpdateOrderStatus && (
            <div className="bg-white rounded-2xl border border-dashed border-neutral-200 p-4">
              <p className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider mb-3">
                DEV: Ubah Status (Demo)
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdateOrderStatus(order.id, "pending")}
                  className="flex-1 py-2 text-xs font-bold rounded-xl border border-amber-200 bg-amber-50 text-amber-700 cursor-pointer hover:bg-amber-100 transition-colors"
                >
                  Pending
                </button>
                <button
                  onClick={() => onUpdateOrderStatus(order.id, "paid")}
                  className="flex-1 py-2 text-xs font-bold rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 cursor-pointer hover:bg-emerald-100 transition-colors"
                >
                  Lunas
                </button>
                <button
                  onClick={() => onUpdateOrderStatus(order.id, "cancelled")}
                  className="flex-1 py-2 text-xs font-bold rounded-xl border border-rose-200 bg-rose-50 text-rose-700 cursor-pointer hover:bg-rose-100 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
