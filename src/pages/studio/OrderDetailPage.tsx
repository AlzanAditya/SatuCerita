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
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { OrderItem } from "@/pages/studio/types";
import { formatRupiah as formatRupiahBase } from "@/data/templates";
import { useT, formatDateTimeWib, type TKey } from "@/i18n";
import { getOrder, openSnap, orderEventsUrl, preloadSnap, syncOrder } from "@/lib/payments";
import { createOrderWatcher, type WatcherMode } from "@/lib/orderStream";
import { PAYMENT_INSTRUCTIONS } from "@/lib/paymentInstructions";

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

const STATUS_BADGE: Record<string, { key: TKey; cls: string }> = {
  paid: { key: "order.status.paid", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending: { key: "order.status.pending", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  expired: { key: "order.status.expired", cls: "bg-neutral-100 text-neutral-600 border-neutral-200" },
  cancelled: { key: "order.status.cancelled", cls: "bg-neutral-100 text-neutral-600 border-neutral-200" },
  failed: { key: "order.status.failed", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  needs_review: { key: "order.status.needsReviewLong", cls: "bg-sky-50 text-sky-700 border-sky-200" },
};

export const OrderDetailPage: React.FC<OrderDetailPageProps> = ({
  currentPath,
  onNavigate,
  orders,
  onOrderUpdate,
  showToast,
}) => {
  const { t, tr, lang } = useT();
  const formatRupiah = (v: number) => formatRupiahBase(v, lang);
  const formatOrderDate = (iso: string) => formatDateTimeWib(iso, lang);
  // Extract invoice from /studio/order/:invoiceNo or /order/:invoiceNo
  const invoiceNo = currentPath.replace(/^(?:\/(?:app|studio))?\/order\/?/, "").split("?")[0].split("#")[0];

  const isStandalone = typeof window !== "undefined" && window.location.hostname.startsWith("app.");
  const prefix = isStandalone ? "" : "/studio";

  // Sumber kebenaran = server. State lokal hanya cache tampilan.
  const [remote, setRemote] = useState<OrderItem | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [apiError, setApiError] = useState<{ status: number; message: string; path: string } | null>(null);
  const order = remote && remote.invoiceNo === invoiceNo ? remote : orders.find((o) => o.invoiceNo === invoiceNo) ?? null;

  const [timeLeft, setTimeLeft] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [mode, setMode] = useState<WatcherMode>("idle");
  const busy = useRef(false);

  const applyOrder = (o: OrderItem) => {
    setRemote(o);
    if (onOrderUpdate) onOrderUpdate(o);
  };
  // Ref agar efek di bawah tidak dibuat ulang setiap render (satu koneksi SSE per halaman).
  const applyRef = useRef(applyOrder);
  applyRef.current = applyOrder;
  const orderRef = useRef<OrderItem | null>(null);

  const status = order?.status;
  orderRef.current = order;

  // Satu pembacaan awal dari server (database kita).
  useEffect(() => {
    if (!invoiceNo) return;
    let alive = true;
    (async () => {
      const path = `/api/orders/${invoiceNo}`;
      const res = await getOrder(invoiceNo);
      if (!alive) return;
      if (res.ok && res.data.order) {
        setNotFound(false);
        setApiError(null);
        applyRef.current(res.data.order);
      } else if (res.status === 404) {
        setNotFound(true);
        setApiError({ status: 404, message: res.data.error || "Pesanan tidak ditemukan.", path });
      } else {
        setApiError({ status: res.status, message: res.data.error || "Gagal memuat pesanan.", path });
      }
    })();
    return () => { alive = false; };
  }, [invoiceNo]);

  // Pembaruan status otomatis tanpa refresh: SSE (backend -> browser). Fallback: polling database internal yang
  // berbatas waktu. TIDAK PERNAH memanggil Midtrans. Dihentikan saat status final / halaman ditutup.
  const isPending = status === "pending";
  useEffect(() => {
    if (!invoiceNo || !isPending) return;
    let alive = true;
    const refetch = async () => {
      const res = await getOrder(invoiceNo);
      if (!alive) return;
      if (res.ok && res.data.order) applyRef.current(res.data.order);
    };
    const watcher = createOrderWatcher(
      {
        createEventSource: (url) => new EventSource(url, { withCredentials: true }) as never,
        fetchOrder: refetch,
        setInterval: (fn, ms) => window.setInterval(fn, ms),
        clearInterval: (h) => window.clearInterval(h as number),
        now: () => Date.now(),
        isVisible: () => document.visibilityState === "visible",
      },
      {
        url: orderEventsUrl(invoiceNo),
        onModeChange: (m) => { if (alive) setMode(m); },
        // Event hanya memberi tahu "ada yang berubah"; data lengkap dibaca dari endpoint terautentikasi (satu kali).
        onEvent: (ev) => {
          const cur = orderRef.current;
          if (!cur || ev.status !== cur.status || (ev.paymentReady && !cur.paymentReady)) void refetch();
        },
      },
    );
    const onVis = () => (document.visibilityState === "visible" ? watcher.resume() : watcher.pause());
    document.addEventListener("visibilitychange", onVis);
    watcher.start();
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVis);
      watcher.stop(); // menutup SSE & timer saat unmount / status berubah final
    };
  }, [invoiceNo, isPending]);

  useEffect(() => {
    if (!order || order.status !== "pending") return;
    const due = new Date(order.dueDate).getTime();
    const update = () => setTimeLeft(Math.max(0, due - Date.now()));
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [order?.dueDate, order?.status]);

  // Mode Snap: buka (kembali) popup Midtrans dengan token dari server. Token hanya ada selama pesanan masih menunggu bayar.
  const [snapOpening, setSnapOpening] = useState(false);
  const hasSnapToken = !!order?.snapToken && order.status === "pending";
  useEffect(() => { if (hasSnapToken) preloadSnap(); }, [hasSnapToken]);
  const handleOpenSnap = async () => {
    if (!order?.snapToken || busy.current) return;
    busy.current = true;
    setSnapOpening(true);
    // Setelah popup selesai/ditutup, minta server memeriksa status ke Midtrans (webhook tetap jalur utama).
    const check = async () => {
      const res = await syncOrder(order.invoiceNo);
      if (res.ok && res.data.order) applyOrder(res.data.order);
    };
    try {
      await openSnap(order.snapToken, {
        onSuccess: () => void check(),
        onPending: () => void check(),
        onClose: () => void check(),
        onError: () => { if (showToast) showToast("Pembayaran gagal diproses. Coba lagi atau ganti metode."); },
      });
    } catch (e) {
      if (showToast) showToast(e instanceof Error && e.message ? e.message : "Gagal membuka pembayaran. Coba lagi.");
    } finally {
      busy.current = false;
      setSnapOpening(false);
    }
  };

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

  // Ganti metode: membuat pesanan baru; server otomatis membatalkan pesanan pending yang lama.
  const handleChangeMethod = () => {
    if (!order) return;
    onNavigate(`${prefix}/checkout/${order.slug}`);
  };

  if (!order && !notFound && !apiError) {
    return (
      <div className="min-h-screen bg-[#faf9ff] flex items-center justify-center p-6">
        <Loader2 className="w-6 h-6 text-[#7d6aee] animate-spin" aria-label={t("od.loading")} />
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
                  {notFound ? t("od.notFound") : t("od.loadFailed")}
                </h2>
                <p className="text-xs text-rose-700 font-medium mt-1 leading-snug">
                  {tr(apiError?.message || "Terjadi kesalahan saat memuat data pesanan.")}
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => onNavigate(`${prefix}/pesanan`)}
              className="text-[#7d6aee] font-bold text-sm underline cursor-pointer"
            >
              {t("od.backToOrders")}
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
          {t("od.backLower")}
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div>
            <p className="text-xs font-bold text-neutral-400 font-mono tracking-wider mb-0.5">
              {order.invoiceNo}
            </p>
            <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
              {t("od.title")}
            </h1>
          </div>
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wide border shrink-0 ${badge.cls}`}
          >
            {t(badge.key)}
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
                  <h2 className="text-base font-black text-neutral-900">{t("od.awaiting")}</h2>
                  <p className="text-xs font-medium text-neutral-800/80 leading-snug mt-0.5">
                    {t("od.awaitingDesc")}
                  </p>
                </div>
              </div>

              {/* Countdown */}
              <div className="bg-white/30 rounded-xl px-4 py-3 mb-4 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-800/70 mb-1">
                  {t("od.timeLeft")}
                </p>
                <p className="text-3xl font-black tracking-widest text-neutral-900 font-mono">
                  {formatCountdown(timeLeft)}
                </p>
              </div>

              {/* Instruksi pembayaran sesuai metode */}
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-5 h-5 shrink-0" />
                <h3 className="text-base font-black">{t("od.payWith", { method: methodLabel })}</h3>
              </div>

              {isVa && order.vaNumber && (
                <div className="bg-white/30 rounded-xl p-4 mb-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-800/70 mb-1">
                    {t("od.vaNumber")}{order.bank ? ` · ${order.bank.toUpperCase()}` : ""}
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
                      {t("od.copy")}
                    </button>
                  </div>
                </div>
              )}

              {isBill && order.billKey && (
                <div className="bg-white/30 rounded-xl p-4 mb-3 space-y-3">
                  {order.billerCode && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-800/70 mb-1">{t("od.companyCode")}</p>
                      <span className="text-lg font-black font-mono">{order.billerCode}</span>
                    </div>
                  )}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-800/70 mb-1">{t("od.paymentCode")}</p>
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xl font-black font-mono break-all">{order.billKey}</span>
                      <button
                        type="button"
                        onClick={() => handleCopy(order.billKey!, "Kode pembayaran disalin!")}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-neutral-900/30 bg-white/40 font-bold text-xs shrink-0 cursor-pointer hover:bg-white/60 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {t("od.copy")}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {safeHttps(order.qrUrl) && (
                <div className="bg-white rounded-xl p-3 mb-3 flex justify-center">
                  <img src={safeHttps(order.qrUrl)} alt={t("od.qrAlt")} className="size-44 object-contain" />
                </div>
              )}

              {safeHttps(order.deeplinkUrl) && (
                <a
                  href={safeHttps(order.deeplinkUrl)}
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-2.5 mb-3 rounded-xl border-2 border-neutral-900/30 bg-white/40 font-bold text-sm hover:bg-white/60 transition-colors"
                >
                  {t("od.openApp", { method: methodLabel })}
                </a>
              )}

              {hasSnapToken && (
                <button
                  type="button"
                  onClick={handleOpenSnap}
                  disabled={snapOpening}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 mb-3 rounded-xl bg-neutral-900 text-white font-extrabold text-sm cursor-pointer hover:bg-neutral-800 transition-colors disabled:opacity-60"
                >
                  {snapOpening && <Loader2 className="w-4 h-4 animate-spin" />}
                  {order.paymentReady ? t("od.reopen") : t("od.continue")}
                </button>
              )}

              {!order.paymentReady && !hasSnapToken && (
                <div className="bg-white/30 rounded-xl p-4 mb-3 flex items-center gap-3" role="status">
                  <Loader2 className="w-5 h-5 animate-spin shrink-0" />
                  <p className="text-xs font-semibold text-neutral-800/80 leading-relaxed">
                    {t("od.preparing")}
                    {t("od.preparingHint")}
                  </p>
                </div>
              )}

              {/* Instruksi pembayaran (statis, per metode) */}
              {order.paymentReady && (
                <div className="space-y-2 mb-3">
                  {PAYMENT_INSTRUCTIONS[order.paymentMethod]?.map((g) => (
                    <details key={g.title} className="group bg-white/30 rounded-xl px-4 py-2.5">
                      <summary className="cursor-pointer text-sm font-extrabold list-none flex items-center justify-between">
                        {tr(g.title)}
                        <span className="text-xs font-bold text-neutral-800/60 group-open:rotate-180 transition-transform">▾</span>
                      </summary>
                      <ol className="list-decimal pl-5 mt-2 space-y-1 text-xs font-medium text-neutral-800/90 leading-relaxed">
                        {g.steps.map((st, i) => <li key={i}>{tr(st)}</li>)}
                      </ol>
                    </details>
                  ))}
                </div>
              )}

              {/* Total */}
              <div className="bg-white/30 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
                <span className="text-sm font-bold">{t("checkout.total")}</span>
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
                {t("od.amountNote")}
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
                  {isVerifying ? t("od.checking") : t("od.checkStatus")}
                </button>
                <button
                  type="button"
                  onClick={handleChangeMethod}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border-2 border-neutral-900/30 bg-white/40 font-bold text-sm cursor-pointer hover:bg-white/60 transition-colors"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  {t("od.changeMethod")}
                </button>
              </div>
              <p className="text-[11px] text-neutral-800/70 font-semibold mt-3 text-center flex items-center justify-center gap-1.5" role="status" aria-live="polite">
                <span className={`inline-block size-2 rounded-full ${mode === "sse" ? "bg-emerald-600 animate-pulse" : "bg-neutral-800/40"}`} />
                {mode === "sse"
                  ? t("od.live.sse")
                  : mode === "poll"
                    ? t("od.live.poll")
                    : t("od.live.connecting")}
              </p>
            </div>
          )}

          {/* Paid Status Card */}
          {order.status === "paid" && (
            <div className="bg-emerald-50 border border-emerald-200 border-b-[3px] border-b-emerald-300 rounded-2xl p-5 flex items-start gap-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-black text-emerald-800">{t("od.paidTitle")}</h2>
                <p className="text-xs text-emerald-700 font-medium mt-1 leading-snug">
                  {t("od.paidDesc", {
                    amount: formatRupiah(order.total),
                    method: methodLabel,
                    when: order.paidAt ? t("od.receivedOn", { date: formatOrderDate(order.paidAt) }) : t("od.received"),
                  })}
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
                  {order.status === "expired" ? t("od.expiredTitle") : order.status === "failed" ? t("od.failedTitle") : t("od.cancelledTitle")}
                </h2>
                <p className="text-xs text-rose-700 font-medium mt-1 leading-snug">
                  {t("od.endedDesc")}
                </p>
                <button
                  type="button"
                  onClick={handleChangeMethod}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-200 text-rose-700 text-xs font-bold cursor-pointer hover:bg-rose-100 transition-colors"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  {t("od.orderAgain")}
                </button>
              </div>
            </div>
          )}

          {order.status === "needs_review" && (
            <div className="bg-sky-50 border border-sky-200 border-b-[3px] border-b-sky-300 rounded-2xl p-5 flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-base font-black text-sky-800">{t("od.reviewTitle")}</h2>
                <p className="text-xs text-sky-700 font-medium mt-1 leading-snug">
                  {t("od.reviewDesc", { invoice: order.invoiceNo })}
                </p>
              </div>
            </div>
          )}

          {order.environment === "sandbox" && (
            <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-2.5 text-[11px] font-bold text-amber-800">
              {t("od.sandbox")}
            </div>
          )}

          {/* Rincian Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-neutral-200 border-b-[3px] border-b-neutral-300 shadow-2xs p-5">
            <h3 className="text-base font-black text-neutral-900 mb-4">{t("od.details")}</h3>
            <div className="space-y-0 divide-y divide-neutral-100">
              {[
                { label: t("od.row.code"), value: order.invoiceNo, mono: true },
                { label: t("od.row.template"), value: `${order.templateName} · ${order.templateCategory}` },
                { label: t("od.row.amount"), value: formatRupiah(order.total) },
                { label: t("od.row.payment"), value: "Midtrans", badge: order.environment === "production" ? "PRODUCTION" : "SANDBOX" },
                { label: t("od.row.method"), value: methodLabel },
                { label: t("od.row.created"), value: formatOrderDate(order.date) },
                {
                  label: t("od.row.paid"),
                  value: order.status === "paid" && order.paidAt ? formatOrderDate(order.paidAt) : "—",
                },
                { label: t("od.row.due"), value: formatOrderDate(order.dueDate) },
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
