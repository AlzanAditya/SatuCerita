import React, { useState, useEffect, useRef } from "react";
import {
  AlertTriangle,
  ArrowLeftRight,
  ChevronDown,
  Clock,
  Copy,
  FileText,
  Home,
  Loader2,
  QrCode,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { OrderItem } from "@/pages/studio/types";
import { formatRupiah as formatRupiahBase } from "@/data/templates";
import { useT, formatDateTimeWib } from "@/i18n";
import { getOrder, openSnap, orderEventsUrl, preloadSnap, syncOrder } from "@/lib/payments";
import { createOrderWatcher, type WatcherMode } from "@/lib/orderStream";
import { PAYMENT_INSTRUCTIONS } from "@/lib/paymentInstructions";
import { PaymentLogo } from "@/components/payments/PaymentLogo";
import { PayTopBar } from "@/components/payments/PayTopBar";
import { Collapse } from "@/components/payments/Collapse";

interface OrderDetailPageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  orders: OrderItem[];
  /** Menyimpan pesanan terbaru dari server ke state aplikasi. */
  onOrderUpdate?: (order: OrderItem) => void;
  showToast?: (msg: string) => void;
}

/** 14:52 untuk di bawah 1 jam, 23:59:59 untuk di atas 1 jam. */
function formatClock(ms: number): string {
  if (ms <= 0) return "00:00";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60).toString().padStart(2, "0");
  const sec = (totalSec % 60).toString().padStart(2, "0");
  return h > 0 ? `${h}:${m}:${sec}` : `${m}:${sec}`;
}

/** Animasi per-elemen: nama keyframe, jeda (ms), durasi (ms). Semuanya "both" supaya elemen tersembunyi sebelum gilirannya. */
const seq = (name: string, delay: number, dur = 560): React.CSSProperties => ({
  animation: `${name} ${dur}ms cubic-bezier(.2,.8,.2,1) ${delay}ms both`,
});

/** Angka naik dari 0 ke target (dilewati bila pengguna memilih mengurangi gerakan). */
function useCountUp(target: number, delay: number, duration: number): number {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (typeof window === "undefined" || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setV(target);
      return;
    }
    let raf = 0;
    let startTs = 0;
    const timer = window.setTimeout(() => {
      const step = (ts: number) => {
        if (!startTs) startTs = ts;
        const p = Math.min(1, (ts - startTs) / duration);
        setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    }, delay);
    return () => {
      window.clearTimeout(timer);
      cancelAnimationFrame(raf);
    };
  }, [target, delay, duration]);
  return v;
}

const CARD = "bg-white rounded-3xl border border-[#e9e4fb] shadow-[0_6px_24px_-12px_rgba(91,73,201,0.25)]";
const CONFETTI_COLORS = ["#7d6aee", "#f5a524", "#34c27a", "#ef5da8", "#38bdf8", "#f97316"];
const CONFETTI = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * Math.PI * 2 + (i % 2 ? 0.18 : 0);
  const r = 92 + (i % 3) * 20;
  return {
    dx: Math.round(Math.cos(angle) * r),
    dy: Math.round(Math.sin(angle) * r),
    rot: `${(i * 83) % 360}deg`,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    w: i % 3 === 0 ? 8 : 5,
    h: i % 3 === 0 ? 5 : 10,
    round: i % 4 === 0,
  };
});

/** Frame 4: pembayaran berhasil. Urutan: lingkaran -> centang tergambar -> konfeti -> judul -> teks -> kartu (baris satu per satu) -> tombol. */
const PaidView: React.FC<{
  order: OrderItem;
  methodLabel: string;
  paidDate: string;
  onHome: () => void;
  formatRupiah: (v: number) => string;
}> = ({ order, methodLabel, paidDate, onHome, formatRupiah }) => {
  const { t } = useT();
  const amount = useCountUp(order.total, 1800, 700);
  return (
    <div className="pay-seq relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-[#f6f4ff] to-[#ebe6ff] font-sans text-neutral-800 flex flex-col">
      <div className="relative z-10 flex-1 w-full max-w-md mx-auto px-5 pt-20 pb-6 flex flex-col">
        <div className="relative size-24 mx-auto" aria-hidden="true">
          <span className="absolute inset-0 rounded-full bg-emerald-400/40" style={seq("pay-ring", 250, 1000)} />
          <span className="absolute inset-0 rounded-full bg-emerald-400/25" style={seq("pay-ring", 480, 1000)} />
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              className="absolute left-1/2 top-1/2 -ml-1 -mt-1"
              style={
                {
                  width: c.w,
                  height: c.h,
                  backgroundColor: c.color,
                  borderRadius: c.round ? "9999px" : "2px",
                  "--dx": `${c.dx}px`,
                  "--dy": `${c.dy}px`,
                  "--rot": c.rot,
                  animation: `sc-confetti 1200ms cubic-bezier(.15,.7,.3,1) ${700 + (i % 5) * 40}ms both`,
                } as React.CSSProperties
              }
            />
          ))}
          <div
            className="relative z-10 size-24 rounded-full bg-gradient-to-b from-[#4fd18b] to-[#2fb872] shadow-[0_10px_28px_-8px_rgba(47,184,114,0.7)]"
            style={seq("pay-disc", 0, 620)}
          >
            <svg viewBox="0 0 64 64" className="size-full">
              <path
                d="M19 33l9 9 18-20"
                fill="none"
                stroke="#fff"
                strokeWidth="5.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="44"
                strokeDashoffset="44"
                style={{ animation: "pay-check 450ms ease-out 420ms forwards" }}
              />
            </svg>
          </div>
        </div>

        <h1
          role="status"
          className="mt-9 text-center text-[32px] leading-[1.1] font-black tracking-tight text-[#17112e]"
          style={seq("pay-up", 1000)}
        >
          {t("pay.done.title")}
        </h1>
        <p className="mt-3 text-center text-[15px] leading-relaxed text-[#6b6585]" style={seq("pay-up", 1150)}>
          {t("pay.done.desc")}
        </p>

        <section className={`${CARD} mt-7 p-4`} style={seq("pay-up", 1300)}>
          <div className="flex items-center gap-3 pb-3.5 border-b border-[#efeafc]">
            <span className="size-10 rounded-xl bg-[#efeaff] text-[#7d6aee] flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </span>
            <p className="text-sm font-extrabold text-[#17112e] break-all">{t("pay.invoiceNo", { no: order.invoiceNo })}</p>
          </div>
          <dl className="pt-3.5 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-4" style={seq("pay-up", 1450, 450)}>
              <dt className="text-neutral-500 font-medium">{t("pay.paidOn")}</dt>
              <dd className="font-bold text-neutral-800 text-right">{paidDate}</dd>
            </div>
            <div className="flex items-center justify-between gap-4" style={seq("pay-up", 1580, 450)}>
              <dt className="text-neutral-500 font-medium">{t("pay.method")}</dt>
              <dd className="flex items-center gap-2 font-bold text-neutral-800">
                <PaymentLogo method={order.paymentMethod} className="h-6 w-14 object-right" />
                <span className="sr-only">{methodLabel}</span>
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4" style={seq("pay-up", 1710, 450)}>
              <dt className="text-neutral-500 font-medium">{t("pay.totalPay")}</dt>
              <dd className="text-lg font-black text-[#5b49c9] tabular-nums">{formatRupiah(amount)}</dd>
            </div>
          </dl>
        </section>

        <div className="flex-1 min-h-8" />

        <div style={seq("pay-up", 2150)}>
          <Button variant="primary" size="lg" onClick={onHome} className="w-full !py-3.5 !text-base !font-extrabold">
            <Home className="w-4.5 h-4.5" />
            {t("pay.home")}
          </Button>
        </div>
      </div>

      <svg
        aria-hidden="true"
        viewBox="0 0 400 140"
        preserveAspectRatio="none"
        className="absolute bottom-0 inset-x-0 w-full h-36 text-[#7d6aee]/10 pointer-events-none"
        style={seq("pay-fade", 900, 1200)}
      >
        <path fill="currentColor" d="M0 70C60 30 120 30 200 62S340 100 400 50V140H0z" />
      </svg>
    </div>
  );
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
  const [mode, setMode] = useState<WatcherMode>("idle");
  const [showInvoice, setShowInvoice] = useState(false);
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
        // Halaman dibuka & masih pending -> minta server mengecek Midtrans SEKALI (jaring pengaman
        // untuk pesanan lama yang sudah dibayar; webhook tetap jalur utama, ini bukan polling).
        if (res.data.order.status === "pending") {
          void syncOrder(invoiceNo)
            .then((r) => { if (alive && r.ok && r.data.order) applyRef.current(r.data.order); })
            .catch(() => undefined);
        }
      } else if (res.status === 404) {
        setNotFound(true);
        setApiError({ status: 404, message: res.data.error || "Pesanan tidak ditemukan.", path });
      } else {
        setApiError({ status: res.status, message: res.data.error || "Gagal memuat pesanan.", path });
      }
    })();
    return () => { alive = false; };
  }, [invoiceNo]);

  // Pembaruan status otomatis tanpa polling: webhook Midtrans -> Worker -> Durable Object -> SSE -> browser.
  // Dihentikan saat status final / halaman ditutup.
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
    const onVis = () => {
      if (document.visibilityState !== "visible") { watcher.pause(); return; }
      watcher.resume();
      // Tab kembali aktif -> minta server mengecek Midtrans SEKALI (bukan polling). Server membatasi
      // sendiri: cooldown 8 detik per pesanan + rate limit RL_SYNC 20/menit.
      void syncOrder(invoiceNo).then((res) => {
        if (alive && res.ok && res.data.order) applyRef.current(res.data.order);
      }).catch(() => undefined);
    };
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
    // Setelah popup selesai / ditutup, minta server memeriksa status ke Midtrans SEKALI (webhook tetap jalur utama).
    const check = async () => {
      const res = await syncOrder(order.invoiceNo).catch(() => null);
      if (res?.ok && res.data.order) applyRef.current(res.data.order);
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

  // "Cek status" = server bertanya ke Midtrans sekali, atas permintaan user (dibatasi RL_SYNC + cooldown 8s).
  const [verifying, setVerifying] = useState(false);
  const handleVerify = async () => {
    if (!order || verifying || busy.current) return;
    setVerifying(true);
    const res = await syncOrder(order.invoiceNo).catch(() => null);
    setVerifying(false);
    if (!res?.ok || !res.data?.order) {
      if (showToast) showToast("Gagal memeriksa status. Coba lagi.");
      return;
    }
    applyRef.current(res.data.order);
    if (!showToast) return;
    if (res.data.order.status === "paid") showToast("Pembayaran diterima. Terima kasih!");
    else if ((res.data as { throttled?: boolean }).throttled) showToast("Status baru saja diperiksa. Coba lagi beberapa detik lagi.");
    else showToast("Pembayaran belum kami terima.");
  };

  const handleCopy = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      if (showToast) showToast(label);
    } catch (_e) {}
  };

  // Ganti metode: membuat pesanan baru; server otomatis membatalkan pesanan pending yang lama.
  const handleChangeMethod = () => {
    if (!order) return;
    onNavigate(`${prefix}/checkout/${order.slug}`);
  };

  if (!order && !notFound && !apiError) {
    return (
      <div className="min-h-screen bg-[#f6f4ff] flex items-center justify-center p-6">
        <Loader2 className="w-6 h-6 text-[#7d6aee] animate-spin" aria-label={t("od.loading")} />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-[#f6f4ff] flex items-center justify-center p-6">
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
  const isVa = order.paymentMethod === "bni_va" || order.paymentMethod === "bri_va" || order.paymentMethod === "permata_va";
  const isBill = order.paymentMethod === "mandiri_bill";
  const isQris = order.paymentMethod === "qris";
  const safeHttps = (u?: string) => (u && u.startsWith("https://") ? u : undefined);
  const qrSrc = safeHttps(order.qrUrl);
  const goBack = () => onNavigate(`${prefix}/pesanan`);

  // Frame 4: sudah dibayar.
  if (order.status === "paid") {
    return (
      <PaidView
        order={order}
        methodLabel={methodLabel}
        paidDate={order.paidAt ? formatOrderDate(order.paidAt) : "—"}
        onHome={() => onNavigate(`${prefix}/home`)}
        formatRupiah={formatRupiah}
      />
    );
  }

  const shell = "min-h-screen bg-[#f6f4ff] font-sans text-neutral-800";
  const copyBtn =
    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#d9d1fa] bg-white font-bold text-xs text-[#5b49c9] shrink-0 cursor-pointer hover:bg-[#f3f0ff] transition-colors";
  const outlineBtn =
    "w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl border-2 border-[#7d6aee] bg-white text-[#5b49c9] text-[15px] font-extrabold hover:bg-[#f3f0ff] active:scale-[0.99] transition-all cursor-pointer";

  const invoiceHeader = (
    <div className="flex items-center gap-3">
      <span className="size-11 rounded-xl bg-[#efeaff] text-[#7d6aee] flex items-center justify-center shrink-0">
        <FileText className="w-5 h-5" />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-extrabold text-[#17112e] break-all">{t("pay.invoiceNo", { no: order.invoiceNo })}</p>
        <p className="text-xs text-neutral-500 font-medium truncate">
          {order.templateName} · {order.templateCategory}
        </p>
      </div>
    </div>
  );

  const detailRows = [
    { label: t("od.row.code"), value: order.invoiceNo, mono: true },
    { label: t("od.row.template"), value: `${order.templateName} · ${order.templateCategory}` },
    { label: t("od.row.amount"), value: formatRupiah(order.total) },
    { label: t("od.row.payment"), value: "Midtrans", badge: order.environment === "production" ? "PRODUCTION" : "SANDBOX" },
    { label: t("od.row.method"), value: methodLabel },
    { label: t("od.row.created"), value: formatOrderDate(order.date) },
    { label: t("od.row.paid"), value: "—" },
    { label: t("od.row.due"), value: formatOrderDate(order.dueDate) },
  ];
  const detailList = (
    <div className="divide-y divide-[#f1edfd]">
      {detailRows.map((row, i) => (
        <div key={i} className="flex items-start justify-between gap-4 py-2.5">
          <span className="text-xs font-semibold text-neutral-500 shrink-0">{row.label}</span>
          <div className="flex items-center gap-2 text-right">
            <span className={`text-xs font-bold text-neutral-800 break-all ${row.mono ? "font-mono tracking-wide" : ""}`}>
              {row.value}
            </span>
            {row.badge && (
              <span className="inline-flex px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold tracking-wide shrink-0">
                {row.badge}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const liveHint = (
      <p
        className="text-[11px] text-neutral-500 font-semibold text-center flex items-center justify-center gap-1.5"
        role="status"
        aria-live="polite"
      >
        <span className={`inline-block size-2 rounded-full ${mode === "sse" ? "bg-emerald-500 animate-pulse" : "bg-neutral-300"}`} />
        {mode === "sse" ? t("od.live.sse") : t("od.live.connecting")}
      </p>
    );

  // Jaring pengaman: webhook tetap jalur utama, tapi user selalu bisa meminta satu pemeriksaan manual.
  const checkStatusButton = (
    <button
      type="button"
      onClick={handleVerify}
      disabled={verifying}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-[#e1d9fb] bg-white text-[#5b49c9] font-bold text-sm cursor-pointer hover:bg-[#f3f0ff] transition-colors disabled:opacity-60"
    >
      <RefreshCw className={`w-4 h-4 ${verifying ? "animate-spin" : ""}`} />
      {verifying ? t("od.checking") : t("od.checkStatus")}
    </button>
  );

  const sandboxNote =
    order.environment === "sandbox" ? (
      <div className="rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-2.5 text-[11px] font-bold text-amber-800">
        {t("od.sandbox")}
      </div>
    ) : null;

  const snapButton = hasSnapToken ? (
    <button
      type="button"
      onClick={handleOpenSnap}
      disabled={snapOpening}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#17112e] text-white font-extrabold text-sm cursor-pointer hover:bg-[#241b52] transition-colors disabled:opacity-60"
    >
      {snapOpening && <Loader2 className="w-4 h-4 animate-spin" />}
      {order.paymentReady ? t("od.reopen") : t("od.continue")}
    </button>
  ) : null;

  const howTo = (groups: { title: string; steps: string[] }[] | undefined) =>
    groups?.map((g) => (
      <div key={g.title}>
        {groups.length > 1 && <p className="text-sm font-extrabold text-[#17112e] mb-2">{tr(g.title)}</p>}
        <ol className="space-y-2.5">
          {g.steps.map((st, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="size-6 rounded-full bg-[#7d6aee] text-white text-xs font-extrabold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="text-[13px] leading-snug text-neutral-600 font-medium pt-0.5">{tr(st)}</span>
            </li>
          ))}
        </ol>
      </div>
    ));

  // Sama seperti tombol di checkout (Button lg, 3D), tetapi latar putih & teks ungu.
  const changeMethodButton = (
    <Button
      variant="outline"
      size="lg"
      onClick={handleChangeMethod}
      className="w-full !py-3.5 !text-base !font-extrabold !text-[#7d6aee]"
    >
      <ArrowLeftRight className="w-4.5 h-4.5" />
      {t("od.changeMethod")}
    </Button>
  );

  // Frame 2 & 3: menunggu pembayaran.
  if (order.status === "pending") {
    // ---------- Frame 2: QRIS ----------
    if (isQris) {
      return (
        <div className={shell}>
          <PayTopBar title={t("pay.title")} backLabel={t("pay.back")} onBack={goBack} />
          <div className="max-w-md mx-auto px-4 pt-3 pb-10 space-y-5">
            <section className="rounded-3xl bg-[#efeaff] border border-[#e1d9fb] p-4">
              <div className="flex items-start gap-3.5">
                <span className="size-12 rounded-2xl bg-white text-[#5b49c9] flex items-center justify-center shrink-0 shadow-xs">
                  <QrCode className="w-6 h-6" />
                </span>
                <div>
                  <h2 className="text-lg font-black text-[#17112e] leading-tight">{t("pay.qris.title")}</h2>
                  <p className="text-[13px] text-neutral-600 leading-snug mt-1">{t("pay.qris.desc")}</p>
                </div>
              </div>

              <div className="mt-4 bg-white rounded-2xl p-4 flex flex-col items-center">
                {qrSrc ? (
                  <img src={qrSrc} alt={t("od.qrAlt")} className="size-56 object-contain" />
                ) : (
                  <div className="size-56 flex flex-col items-center justify-center gap-3 text-[#7d6aee]" role="status">
                    <Loader2 className="w-7 h-7 animate-spin" />
                    <p className="text-xs font-semibold text-neutral-500 text-center px-6">{t("pay.qris.preparing")}</p>
                  </div>
                )}
                <p className="mt-3 text-xs text-neutral-500 font-medium break-all text-center">
                  {t("pay.invoiceNo", { no: order.invoiceNo })}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <p className="text-2xl font-black text-[#5b49c9]">{formatRupiah(order.total)}</p>
                  <button
                    type="button"
                    onClick={() => handleCopy(order.total.toString(), "Nominal disalin!")}
                    aria-label={t("od.copy")}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-[#5b49c9] hover:bg-[#f3f0ff] transition-colors cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-3 rounded-xl bg-[#e4dcff] px-3.5 py-3 flex items-center justify-between gap-3">
                <span className="flex items-center gap-2 text-[13px] font-semibold text-[#3b2f7a]">
                  <Clock className="w-4.5 h-4.5" />
                  {t("pay.qris.validFor")}
                </span>
                <span className="text-xl font-black text-[#5b49c9] tabular-nums" aria-label={formatClock(timeLeft)}>
                  {formatClock(timeLeft)}
                </span>
              </div>
            </section>

            {snapButton}

            <section className="px-1 space-y-3">
              <h3 className="text-sm font-extrabold text-[#17112e]">{t("pay.howTo")}</h3>
              {howTo(PAYMENT_INSTRUCTIONS.qris)}
            </section>

            {changeMethodButton}

            {liveHint}
            {checkStatusButton}
            {sandboxNote}
          </div>
        </div>
      );
    }

    // ---------- Frame 3: VA / Bill / GoPay / Snap ----------
    return (
      <div className={shell}>
        <PayTopBar title={t("pay.title")} backLabel={t("pay.back")} onBack={goBack} />
        <div className="max-w-md mx-auto px-4 pt-1 pb-10 space-y-5">
          <div className="text-center">
            <svg viewBox="0 0 220 170" className="w-48 mx-auto pay-float" aria-hidden="true">
              <ellipse cx="110" cy="128" rx="88" ry="36" fill="#ebe6ff" />
              <circle cx="110" cy="84" r="62" fill="#f1edff" />
              <g transform="rotate(12 110 85)">
                <rect x="76" y="22" width="68" height="118" rx="13" fill="#fff" stroke="#241b52" strokeWidth="4" />
                <rect x="100" y="29" width="20" height="4" rx="2" fill="#241b52" />
                <circle cx="110" cy="82" r="21" fill="#7d6aee" />
                <path d="M100.5 82l7 7 12.5-15" fill="none" stroke="#fff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
              </g>
              <circle cx="160" cy="96" r="17" fill="#fff" stroke="#3b2a9c" strokeWidth="3.5" />
              <path d="M160 86v10l7 4" fill="none" stroke="#3b2a9c" strokeWidth="3.5" strokeLinecap="round" />
              <path d="M58 82h11M62 71l8 5" stroke="#7d6aee" strokeWidth="3.5" strokeLinecap="round" />
            </svg>
            <h2 className="mt-1 text-2xl font-black text-[#17112e] tracking-tight">{t("pay.waiting.title")}</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-[#6b6585] px-2">{t("pay.waiting.desc")}</p>
          </div>

          {/* Instruksi bayar sesuai metode */}
          <section className={`${CARD} p-4 space-y-3.5`}>
            <div className="flex items-center gap-3">
              <PaymentLogo method={order.paymentMethod} className="h-8 w-16" />
              <h3 className="text-sm font-extrabold text-[#17112e]">{t("od.payWith", { method: methodLabel })}</h3>
            </div>

            {isVa && order.vaNumber && (
              <div className="rounded-2xl bg-[#f3f0ff] p-3.5">
                <p className="text-[11px] font-bold text-[#5b49c9]/80 mb-1">
                  {t("od.vaNumber")}
                  {order.bank ? ` · ${order.bank.toUpperCase()}` : ""}
                </p>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xl font-black font-mono tracking-wide text-[#17112e] break-all select-text">
                    {order.vaNumber}
                  </span>
                  <button type="button" onClick={() => handleCopy(order.vaNumber!, "Nomor VA disalin!")} className={copyBtn}>
                    <Copy className="w-3.5 h-3.5" />
                    {t("od.copy")}
                  </button>
                </div>
              </div>
            )}

            {isBill && order.billKey && (
              <div className="rounded-2xl bg-[#f3f0ff] p-3.5 space-y-3">
                {order.billerCode && (
                  <div>
                    <p className="text-[11px] font-bold text-[#5b49c9]/80 mb-1">{t("od.companyCode")}</p>
                    <span className="text-lg font-black font-mono select-text">{order.billerCode}</span>
                  </div>
                )}
                <div>
                  <p className="text-[11px] font-bold text-[#5b49c9]/80 mb-1">{t("od.paymentCode")}</p>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xl font-black font-mono break-all select-text">{order.billKey}</span>
                    <button type="button" onClick={() => handleCopy(order.billKey!, "Kode pembayaran disalin!")} className={copyBtn}>
                      <Copy className="w-3.5 h-3.5" />
                      {t("od.copy")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {qrSrc && (
              <div className="rounded-2xl bg-white border border-[#e9e4fb] p-3 flex justify-center">
                <img src={qrSrc} alt={t("od.qrAlt")} className="size-48 object-contain" />
              </div>
            )}

            {safeHttps(order.deeplinkUrl) && (
              <a
                href={safeHttps(order.deeplinkUrl)}
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-[#7d6aee] text-white font-extrabold text-sm hover:bg-[#6c59dc] transition-colors"
              >
                {t("od.openApp", { method: methodLabel })}
              </a>
            )}

            {snapButton}

            {!order.paymentReady && !hasSnapToken && (
              <div className="rounded-2xl bg-[#f3f0ff] p-3.5 flex items-center gap-3" role="status">
                <Loader2 className="w-5 h-5 animate-spin shrink-0 text-[#7d6aee]" />
                <p className="text-xs font-semibold text-neutral-600 leading-relaxed">
                  {t("od.preparing")} {t("od.preparingHint")}
                </p>
              </div>
            )}

            {order.paymentReady && (
              <div className="space-y-2">
                {PAYMENT_INSTRUCTIONS[order.paymentMethod]?.map((g) => (
                  <details key={g.title} className="group rounded-2xl border border-[#e9e4fb] px-4 py-2.5">
                    <summary className="cursor-pointer text-sm font-extrabold text-[#17112e] list-none flex items-center justify-between">
                      {tr(g.title)}
                      <ChevronDown className="w-4 h-4 text-neutral-400 group-open:rotate-180 transition-transform" />
                    </summary>
                    <ol className="list-decimal pl-5 mt-2 space-y-1 text-xs font-medium text-neutral-600 leading-relaxed">
                      {g.steps.map((st, i) => (
                        <li key={i}>{tr(st)}</li>
                      ))}
                    </ol>
                  </details>
                ))}
              </div>
            )}
          </section>

          {/* Invoice */}
          <section className={`${CARD} p-4`}>
            {invoiceHeader}
            <div className="mt-3.5 pt-3.5 border-t border-[#efeafc] text-center">
              <p className="text-xs text-neutral-500 font-medium">{t("pay.totalPay")}</p>
              <div className="flex items-center justify-center gap-1.5">
                <p className="text-[28px] leading-tight font-black text-[#5b49c9]">{formatRupiah(order.total)}</p>
                <button
                  type="button"
                  onClick={() => handleCopy(order.total.toString(), "Nominal disalin!")}
                  aria-label={t("od.copy")}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-[#5b49c9] hover:bg-[#f3f0ff] transition-colors cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-neutral-400 font-medium mt-1 leading-snug">{t("od.amountNote")}</p>
            </div>
          </section>

          {/* Batas waktu */}
          <section className="rounded-3xl bg-[#efeaff] border border-[#e1d9fb] px-4 py-4 text-center">
            <p className="flex items-center justify-center gap-2 text-sm font-bold text-[#3b2f7a]">
              <Clock className="w-4.5 h-4.5" />
              {t("pay.deadline")}
            </p>
            <p className="mt-1 text-[32px] leading-tight font-black text-[#5b49c9] tabular-nums" aria-label={formatClock(timeLeft)}>
              {formatClock(timeLeft)}
            </p>
            <p className="text-[11px] font-medium text-neutral-500 mt-0.5">{t("pay.deadlineNote")}</p>
          </section>

          <div className="space-y-1.5">
            <button
              type="button"
              aria-expanded={showInvoice}
              aria-controls="invoice-detail"
              onClick={() => setShowInvoice((v) => !v)}
              className={outlineBtn}
            >
              {showInvoice ? t("pay.hideInvoice") : t("pay.viewInvoice")}
            </button>
            <Collapse open={showInvoice} id="invoice-detail">
              <div className={`${CARD} mt-3 px-4 py-1.5`}>{detailList}</div>
            </Collapse>
            {changeMethodButton}
          </div>

          {liveHint}
          {checkStatusButton}
          {sandboxNote}
        </div>
      </div>
    );
  }

  // Status lain: kedaluwarsa / dibatalkan / gagal / ditinjau.
  return (
    <div className={shell}>
      <PayTopBar title={t("pay.title")} backLabel={t("pay.back")} onBack={goBack} />
      <div className="max-w-md mx-auto px-4 pt-3 pb-10 space-y-4">
        {(order.status === "cancelled" || order.status === "expired" || order.status === "failed") && (
          <div className="bg-rose-50 border border-rose-200 border-b-[3px] border-b-rose-300 rounded-2xl p-5 flex items-start gap-3">
            <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <h2 className="text-base font-black text-rose-800">
                {order.status === "expired" ? t("od.expiredTitle") : order.status === "failed" ? t("od.failedTitle") : t("od.cancelledTitle")}
              </h2>
              <p className="text-xs text-rose-700 font-medium mt-1 leading-snug">{t("od.endedDesc")}</p>
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

        {sandboxNote}

        <section className={`${CARD} p-4`}>
          {invoiceHeader}
          <h3 className="mt-4 text-sm font-extrabold text-[#17112e]">{t("od.details")}</h3>
          {detailList}
        </section>
      </div>
    </div>
  );
};

export default OrderDetailPage;
