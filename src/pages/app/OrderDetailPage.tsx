import React, { useState, useEffect, useRef } from "react";
import {
  ArrowLeft,
  Clock,
  Copy,
  RefreshCw,
  ArrowLeftRight,
  CheckCircle2,
  XCircle,
  Building2,
  CreditCard,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { OrderItem } from "@/pages/app/types";
import { formatRupiah } from "@/data/templates";
import { formatOrderDate, getOrder, openSnap, syncOrder } from "@/lib/payments";

interface OrderDetailPageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  orders: OrderItem[];
  /** Menyimpan pesanan terbaru dari server ke state aplikasi. */
  onOrderUpdate?: (order: OrderItem) => void;
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

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  paid: { label: "Lunas", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending: { label: "Menunggu bayar", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  expired: { label: "Kedaluwarsa", cls: "bg-neutral-100 text-neutral-600 border-neutral-200" },
  cancelled: { label: "Dibatalkan", cls: "bg-neutral-100 text-neutral-600 border-neutral-200" },
  failed: { label: "Gagal", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  needs_review: { label: "Perlu ditinjau", cls: "bg-sky-50 text-sky-700 border-sky-200" },
};

const POLL_MS = 5000;

export const OrderDetailPage: React.FC<OrderDetailPageProps> = ({
  currentPath,
  onNavigate,
  orders,
  onOrderUpdate,
  showToast,
}) => {
  // Extract invoice from /app/order/:invoiceNo or /order/:invoiceNo
  const invoiceNo = currentPath.replace(/^(?:\/app)?\/order\/?/, "").split("?")[0].split("#")[0];

  const isStandalone = typeof window !== "undefined" && window.location.hostname.startsWith("app.");
  const prefix = isStandalone ? "" : "/app";

  // Sumber kebenaran = server. State lokal hanya cache tampilan.
  const [remote, setRemote] = useState<OrderItem | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [apiError, setApiError] = useState<{ status: number; message: string; path: string } | null>(null);
  const order = remote && remote.invoiceNo === invoiceNo ? remote : orders.find((o) => o.invoiceNo === invoiceNo) ?? null;

  const [timeLeft, setTimeLeft] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isOpening, setIsOpening] = useState(false);
  const busy = useRef(false);

  const applyOrder = (o: OrderItem) => {
    setRemote(o);
    if (onOrderUpdate) onOrderUpdate(o);
  };

  // Muat dari server + polling saat masih pending (membaca database kita, BUKAN memanggil Midtrans).
  const status = order?.status;
  useEffect(() => {
    if (!invoiceNo) return;
    let alive = true;
    const load = async () => {
      const path = `/api/orders/${invoiceNo}`;
      const res = await getOrder(invoiceNo);
      if (!alive) return;
      if (res.ok && res.data.order) {
        setNotFound(false);
        setApiError(null);
        applyOrder(res.data.order);
      } else if (res.status === 404) {
        setNotFound(true);
        setApiError({ status: 404, message: res.data.error || "Pesanan tidak ditemukan di database.", path });
      } else {
        setApiError({
          status: res.status,
          message: res.data.error || `HTTP ${res.status} — tidak ada pesan error dari server.`,
          path,
        });
      }
    };
    load();
    if (status && status !== "pending") return () => { alive = false; };
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    return () => {
      alive = false;
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoiceNo, status]);

  useEffect(() => {
    if (!order || order.status !== "pending") return;
    const due = new Date(order.dueDate).getTime();
    const update = () => setTimeLeft(Math.max(0, due - Date.now()));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [order?.dueDate, order?.status]);

  const handleCopy = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      if (showToast) showToast(label);
    } catch (_e) {}
  };

  // "Cek status" = server bertanya ke Midtrans. Browser TIDAK bisa menandai lunas.
  const handleVerify = async () => {
    if (!order || busy.current) return;
    busy.current = true;
    setIsVerifying(true);
    const res = await syncOrder(order.invoiceNo);
    busy.current = false;
    setIsVerifying(false);
    if (!res.ok || !res.data.order) {
      if (showToast) showToast(res.data.error || "Gagal memeriksa status. Coba lagi.");
      return;
    }
    applyOrder(res.data.order);
    if (!showToast) return;
    if (res.data.order.status === "paid") showToast("Pembayaran diterima. Terima kasih!");
    else if (res.data.throttled) showToast("Status baru saja diperiksa. Coba lagi beberapa detik lagi.");
    else showToast("Pembayaran belum kami terima.");
  };

  // Buka lagi popup Midtrans (menampilkan VA / QR yang sama).
  const handleContinuePay = async () => {
    if (!order?.snapToken || busy.current) return;
    busy.current = true;
    setIsOpening(true);
    try {
      await openSnap(order.snapToken, {
        onSuccess: () => handleVerifyQuiet(),
        onPending: () => handleVerifyQuiet(),
      });
    } catch (e) {
      if (showToast) showToast(e instanceof Error ? e.message : "Gagal membuka halaman pembayaran.");
    } finally {
      busy.current = false;
      setIsOpening(false);
    }
  };

  const handleVerifyQuiet = async () => {
    const res = await getOrder(invoiceNo);
    if (res.ok && res.data.order) applyOrder(res.data.order);
  };

  // Ganti metode: membuat pesanan baru; server otomatis membatalkan pesanan pending yang lama.
  const handleChangeMethod = () => {
    if (!order) return;
    onNavigate(`${prefix}/checkout/${order.slug}`);
  };

  if (!order && !notFound && !apiError) {
    return (
      <div className="min-h-screen bg-[#faf9ff] flex items-center justify-center p-6">
        <Loader2 className="w-6 h-6 text-[#7d6aee] animate-spin" aria-label="Memuat pesanan" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#faf9ff] flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="bg-rose-50 border border-rose-200 border-b-[3px] border-b-rose-300 rounded-2xl p-5 mb-4">
            <div className="flex items-start gap-3">
              <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-black text-rose-800">
                  {notFound ? "Pesanan tidak ditemukan" : "Gagal memuat pesanan"}
                </h2>
                <p className="text-xs text-rose-700 font-medium mt-1 leading-snug">
                  {apiError?.message || "Terjadi kesalahan saat memuat data pesanan."}
                </p>
              </div>
            </div>
          </div>

          {/* DEBUG PANEL — selalu tampil agar bisa diagnosa masalah */}
          <div className="bg-neutral-900 rounded-2xl p-4 mb-4 font-mono text-xs text-left overflow-auto">
            <p className="text-amber-400 font-bold mb-2">🔍 DEBUG INFO</p>
            <div className="space-y-1 text-neutral-300">
              <p><span className="text-neutral-500">invoice:</span> <span className="text-white">{invoiceNo || "(kosong!)"}</span></p>
              <p><span className="text-neutral-500">path:</span> <span className="text-white">{apiError?.path || "—"}</span></p>
              <p><span className="text-neutral-500">http_status:</span> <span className={`font-bold ${apiError && apiError.status >= 400 ? "text-rose-400" : "text-emerald-400"}`}>{apiError?.status ?? "—"}</span></p>
              <p><span className="text-neutral-500">error:</span> <span className="text-rose-300 break-all">{apiError?.message || "—"}</span></p>
              <p><span className="text-neutral-500">notFound:</span> <span className="text-white">{String(notFound)}</span></p>
              <p><span className="text-neutral-500">url:</span> <span className="text-neutral-400 break-all">{typeof window !== "undefined" ? window.location.href : "—"}</span></p>
              <p><span className="text-neutral-500">hostname:</span> <span className="text-neutral-400">{typeof window !== "undefined" ? window.location.hostname : "—"}</span></p>
              <p><span className="text-neutral-500">parsed_path:</span> <span className="text-neutral-400">{currentPath}</span></p>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => onNavigate(`${prefix}/pesanan`)}
              className="text-[#7d6aee] font-bold text-sm underline cursor-pointer"
            >
              Kembali ke Pesanan
            </button>
          </div>
        </div>
      </div>
    );
  }

  const methodLabel = order.paymentLabel || order.paymentMethod;
  const badge = STATUS_BADGE[order.status] ?? STATUS_BADGE.pending;
  const isVa = order.paymentMethod === "bni_va" || order.paymentMethod === "bri_va" || order.paymentMethod === "permata_va";
  const isBill = order.paymentMethod === "mandiri_bill";
  const safeHttps = (u?: string) => (u && /^https:\/\//.test(u) ? u : undefined);

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
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide border shrink-0 ${badge.cls}`}
          >
            {badge.label}
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

              {/* Instruksi pembayaran sesuai metode */}
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-black">Bayar dengan {methodLabel}</h3>
              </div>

              {isVa && order.vaNumber && (
                <div className="bg-white/30 rounded-xl p-4 mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-800/70 mb-1">
                    NOMOR VIRTUAL ACCOUNT{order.bank ? ` · ${order.bank.toUpperCase()}` : ""}
                  </p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xl sm:text-2xl font-black font-mono tracking-wide text-neutral-900 break-all">
                      {order.vaNumber}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(order.vaNumber!, "Nomor VA disalin!")}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-neutral-900/30 bg-white/40 font-bold text-xs shrink-0 cursor-pointer hover:bg-white/60 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Salin
                    </button>
                  </div>
                </div>
              )}

              {isBill && order.billKey && (
                <div className="bg-white/30 rounded-xl p-4 mb-3 space-y-3">
                  {order.billerCode && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-800/70 mb-1">KODE PERUSAHAAN</p>
                      <span className="text-lg font-black font-mono">{order.billerCode}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-800/70 mb-1">KODE PEMBAYARAN</p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xl font-black font-mono break-all">{order.billKey}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(order.billKey!, "Kode pembayaran disalin!")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-neutral-900/30 bg-white/40 font-bold text-xs shrink-0 cursor-pointer hover:bg-white/60 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        Salin
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {safeHttps(order.qrUrl) && (
                <div className="bg-white rounded-xl p-3 mb-3 flex justify-center">
                  <img src={safeHttps(order.qrUrl)} alt="Kode QR pembayaran" className="size-44 object-contain" />
                </div>
              )}

              {safeHttps(order.deeplinkUrl) && (
                <a
                  href={safeHttps(order.deeplinkUrl)}
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 mb-3 rounded-xl border-2 border-neutral-900/30 bg-white/40 font-bold text-sm hover:bg-white/60 transition-colors"
                >
                  Buka aplikasi {methodLabel}
                </a>
              )}

              {!order.vaNumber && !order.billKey && !safeHttps(order.qrUrl) && (
                <p className="text-xs font-semibold text-neutral-800/80 bg-white/30 rounded-xl p-3 mb-3 leading-relaxed">
                  Kode pembayaran akan muncul setelah kamu melanjutkan di halaman pembayaran Midtrans.
                </p>
              )}

              {order.snapToken && (
                <button
                  type="button"
                  onClick={handleContinuePay}
                  disabled={isOpening}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-3 rounded-xl bg-neutral-900 text-white font-extrabold text-sm cursor-pointer hover:bg-neutral-800 transition-colors disabled:opacity-60"
                >
                  {isOpening ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  {isOpening ? "Membuka..." : "Lanjutkan pembayaran"}
                </button>
              )}

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
                Nominal harus persis sama dengan total di atas. Status berubah otomatis setelah pembayaran kami terima.
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
                  {isVerifying ? "Memeriksa..." : "Cek status"}
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

          {/* Cancelled / Expired / Failed */}
          {(order.status === "cancelled" || order.status === "expired" || order.status === "failed") && (
            <div className="bg-rose-50 border border-rose-200 border-b-[3px] border-b-rose-300 rounded-2xl p-5 flex items-start gap-3">
              <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-black text-rose-800">
                  {order.status === "expired" ? "Pesanan Kedaluwarsa" : order.status === "failed" ? "Pembayaran Gagal" : "Pesanan Dibatalkan"}
                </h2>
                <p className="text-xs text-rose-700 font-medium mt-1 leading-snug">
                  Silakan buat pesanan baru jika masih ingin melanjutkan.
                </p>
                <button
                  type="button"
                  onClick={handleChangeMethod}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-700 text-xs font-bold cursor-pointer hover:bg-rose-100 transition-colors"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  Pesan lagi
                </button>
              </div>
            </div>
          )}

          {order.status === "needs_review" && (
            <div className="bg-sky-50 border border-sky-200 border-b-[3px] border-b-sky-300 rounded-2xl p-5 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-black text-sky-800">Sedang Ditinjau</h2>
                <p className="text-xs text-sky-700 font-medium mt-1 leading-snug">
                  Ada pembayaran yang perlu kami cek manual. Hubungi admin dengan menyebut kode {order.invoiceNo}.
                </p>
              </div>
            </div>
          )}

          {order.environment === "sandbox" && (
            <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-2.5 text-[11px] font-bold text-amber-800">
              Mode uji coba (Sandbox): tidak ada uang sungguhan yang berpindah.
            </div>
          )}

          {/* DEBUG PANEL untuk sandbox — tampil saat masih pending dan belum ada VA/QR */}
          {order.environment === "sandbox" && order.status === "pending" && !order.vaNumber && !order.billKey && !order.qrUrl && (
            <div className="bg-neutral-900 rounded-2xl p-4 font-mono text-xs overflow-auto">
              <p className="text-amber-400 font-bold mb-2">🔍 DEBUG — Payment Info</p>
              <div className="space-y-1 text-neutral-300">
                <p><span className="text-neutral-500">invoiceNo:</span> <span className="text-white">{order.invoiceNo}</span></p>
                <p><span className="text-neutral-500">status:</span> <span className="text-emerald-400">{order.status}</span></p>
                <p><span className="text-neutral-500">paymentMethod:</span> <span className="text-white">{order.paymentMethod}</span></p>
                <p><span className="text-neutral-500">snapToken:</span> <span className={order.snapToken ? "text-emerald-400" : "text-rose-400"}>{order.snapToken ? `${order.snapToken.slice(0, 12)}…` : "(null)"}</span></p>
                <p><span className="text-neutral-500">vaNumber:</span> <span className={order.vaNumber ? "text-emerald-400" : "text-rose-400"}>{order.vaNumber || "(null — belum ada dari Midtrans)"}</span></p>
                <p><span className="text-neutral-500">qrUrl:</span> <span className={order.qrUrl ? "text-emerald-400" : "text-rose-400"}>{order.qrUrl || "(null — belum ada dari Midtrans)"}</span></p>
                <p><span className="text-neutral-500">billKey:</span> <span className={order.billKey ? "text-emerald-400" : "text-rose-400"}>{order.billKey || "(null)"}</span></p>
                <p><span className="text-neutral-500">environment:</span> <span className="text-amber-400">{order.environment}</span></p>
                <p className="text-neutral-500 mt-2 leading-relaxed">Jika vaNumber/qrUrl null setelah bayar di Snap → cek "Cek status" atau webhook Midtrans belum terpasang.</p>
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
                { label: "Pembayaran", value: "Midtrans", badge: order.environment === "production" ? "PRODUCTION" : "SANDBOX" },
                { label: "Metode", value: methodLabel },
                { label: "Dibuat", value: formatOrderDate(order.date) },
                {
                  label: "Dibayar",
                  value: order.status === "paid" && order.paidAt ? formatOrderDate(order.paidAt) : "—",
                },
                { label: "Batas bayar", value: formatOrderDate(order.dueDate) },
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

        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
