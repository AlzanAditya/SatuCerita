import React, { useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  CheckCircle2,
  ExternalLink,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Tag,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PATHS } from "@/routes";
import { getTemplateBySlug, formatRupiah as formatRupiahBase } from "@/data/templates";
import { useT } from "@/i18n";
import { localizeTemplate } from "@/i18n/templates";
import { OrderItem, PaymentMethodId } from "@/pages/studio/types";
import { createOrder, newIdempotencyKey, quoteOrder, openSnap, preloadSnap } from "@/lib/payments";
import { PaymentLogo } from "@/components/payments/PaymentLogo";
import { PayTopBar } from "@/components/payments/PayTopBar";
import { Collapse } from "@/components/payments/Collapse";

interface CheckoutPageProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onCreateOrder?: (order: OrderItem) => void;
}

type PaymentMethod = PaymentMethodId;

const PAYMENT_METHODS: { id: PaymentMethod; label: string; description: string }[] = [
  { id: "bni_va", label: "Bank BNI", description: "Virtual Account" },
  { id: "bri_va", label: "Bank BRI", description: "Virtual Account" },
  { id: "permata_va", label: "Bank Permata", description: "Virtual Account" },
  { id: "mandiri_bill", label: "Bank Mandiri", description: "Mandiri Bill Payment" },
  { id: "gopay", label: "GoPay", description: "Bayar lewat aplikasi GoPay" },
  { id: "qris", label: "QRIS", description: "Scan dari semua e-wallet & m-banking" },
];

export const CheckoutPage: React.FC<CheckoutPageProps> = ({
  currentPath,
  onNavigate,
  onCreateOrder,
}) => {
  const { t, tr, lang } = useT();
  const formatRupiah = (v: number) => formatRupiahBase(v, lang);
  // Extract template slug from /studio/checkout/:slug or /checkout/:slug
  const rawSlug = currentPath.replace(/^(?:\/(?:app|studio))?\/checkout\/?/, "").split("?")[0].split("#")[0];
  const baseTemplate = getTemplateBySlug(rawSlug);
  // Hanya teks tampilan (badge, deskripsi) yang dilokalkan; harga & slug tetap dari data asli.
  const template = baseTemplate ? localizeTemplate(baseTemplate, lang) : undefined;

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherApplied, setVoucherApplied] = useState(false);
  const [voucherError, setVoucherError] = useState("");
  const [voucherChecking, setVoucherChecking] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; amount: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [payError, setPayError] = useState("");
  // Detail template default tertutup; bisa dibuka.
  const [detailOpen, setDetailOpen] = useState(false);
  // Anti klik ganda: satu permintaan dalam satu waktu + kunci idempoten per "niat bayar".
  // Mode Snap: muat snap.js lebih awal supaya popup langsung terbuka setelah tombol Bayar ditekan.
  useEffect(() => { preloadSnap(); }, []);

  const inFlight = useRef(false);
  const lastClickAt = useRef(0);
  const idem = useRef<{ sig: string; key: string } | null>(null);

  if (!template) {
    return (
      <div className="min-h-screen bg-[#faf9ff] flex items-center justify-center p-6">
        <div className="text-center">
          <h2 className="text-lg font-black text-neutral-800">{t("checkout.templateNotFound")}</h2>
          <button
            onClick={() => onNavigate(PATHS.katalog)}
            className="mt-3 text-[#7d6aee] font-bold text-sm underline cursor-pointer"
          >
            {t("checkout.backToCatalog")}
          </button>
        </div>
      </div>
    );
  }

  const originalPrice = template.originalPrice;
  const discountPrice = template.discountPrice;
  // Angka di layar hanya PERKIRAAN tampilan; total sebenarnya selalu dihitung ulang server.
  const discountAmount = voucherApplied && appliedDiscount ? appliedDiscount.amount : 0;
  const finalTotal = discountPrice - discountAmount;

  const handleApplyVoucher = async () => {
    const code = voucherCode.trim();
    if (!code || voucherChecking) return;
    setVoucherChecking(true);
    const res = await quoteOrder(template.slug, code);
    setVoucherChecking(false);
    if (res.ok && res.data.discountCode) {
      setVoucherApplied(true);
      setAppliedDiscount({ code: res.data.discountCode, amount: res.data.discountAmount });
      setVoucherError("");
    } else {
      setVoucherApplied(false);
      setAppliedDiscount(null);
      setVoucherError(res.data.error || "Kode redeem tidak valid.");
    }
  };

  const goToOrder = (invoiceNo: string) => {
    const isStandalone = typeof window !== "undefined" && window.location.hostname.startsWith("app.");
    const prefix = isStandalone ? "" : "/studio";
    onNavigate(`${prefix}/order/${invoiceNo}`);
  };

  const handleBayar = async () => {
    if (!selectedMethod || inFlight.current) return;
    // Debounce: abaikan klik beruntun yang terlalu cepat.
    if (Date.now() - lastClickAt.current < 1200) return;
    lastClickAt.current = Date.now();
    inFlight.current = true;
    setSubmitting(true);
    setPayError("");

    const code = voucherApplied && appliedDiscount ? appliedDiscount.code : undefined;
    const sig = `${template.slug}|${selectedMethod}|${code ?? ""}`;
    if (!idem.current || idem.current.sig !== sig) idem.current = { sig, key: newIdempotencyKey() };

    try {
      const res = await createOrder({ templateSlug: template.slug, method: selectedMethod, voucherCode: code, idempotencyKey: idem.current.key });
      const order = res.data.order;
      if (!res.ok || !order) {
        idem.current = null; // percobaan baru boleh memakai kunci baru
        if (res.status === 409 && order) {
          if (onCreateOrder) onCreateOrder(order);
          goToOrder(order.invoiceNo);
          return;
        }
        setPayError(res.status === 429 ? "Terlalu banyak percobaan. Tunggu sebentar lalu coba lagi." : res.data.error || "Gagal memulai pembayaran. Coba lagi.");
        return;
      }

      if (onCreateOrder) onCreateOrder(order);

      // Dual mode: Snap (popup) atau Core API (instruksi di halaman pesanan)
      if (order.snapToken) {
        // Snap mode: buka popup Midtrans
        let moved = false;
        const next = () => {
          if (moved) return;
          moved = true;
          goToOrder(order.invoiceNo);
        };
        await openSnap(order.snapToken, {
          onSuccess: next,
          onPending: next,
          onClose: next,
          onError: () => setPayError("Pembayaran gagal diproses. Silakan coba lagi atau pilih metode lain."),
        });
        return;
      }

      // Core API mode: transaksi sudah dibuat server. Customer tetap di website ini: instruksi bayar tampil di halaman pesanan.
      goToOrder(order.invoiceNo);
    } catch (e) {
      setPayError(e instanceof Error && e.message ? e.message : "Gagal memulai pembayaran. Coba lagi.");
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };

  const selected = PAYMENT_METHODS.find((m) => m.id === selectedMethod);
  const card = "bg-white rounded-3xl border border-[#e9e4fb] shadow-[0_6px_24px_-12px_rgba(91,73,201,0.25)]";

  return (
    <div className="min-h-screen bg-[#f6f4ff] font-sans text-neutral-800 pb-52">
      <PayTopBar
        title={t("pay.title")}
        backLabel={t("pay.back")}
        onBack={() => onNavigate(`/katalog/${template.slug}`)}
      />

      <div className="max-w-md mx-auto px-4 pt-3 space-y-5">
        {/* Kartu pratinjau undangan (detail tertutup secara default) */}
        <section className={`${card} overflow-hidden`}>
          <div className="p-3.5 pb-0">
            <div
              className="rounded-2xl flex items-center justify-center p-4"
              style={{ backgroundColor: template.frameBg }}
            >
              <img
                src={template.image}
                alt={template.title}
                className="w-full aspect-[16/10] rounded-xl object-cover shadow-md"
              />
            </div>
          </div>

          <div className="px-4 pt-3.5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex px-2.5 py-0.5 rounded-full bg-purple-50 border border-purple-200 text-[#7d6aee] text-[11px] font-bold">
                {template.category}
              </span>
              <span className="inline-flex px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-[11px] font-bold">
                {template.badge}
              </span>
            </div>
            <div className="flex items-end justify-between gap-3">
              <h2 className="text-xl font-black text-[#17112e] tracking-tight leading-tight">{template.title}</h2>
              <div className="text-right shrink-0">
                <p className="text-[11px] text-neutral-400 line-through font-medium leading-none">
                  {formatRupiah(originalPrice)}
                </p>
                <p className="text-base font-black text-[#5b49c9] leading-tight mt-0.5">{formatRupiah(discountPrice)}</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            aria-expanded={detailOpen}
            aria-controls="checkout-detail"
            onClick={() => setDetailOpen((v) => !v)}
            className="w-full flex items-center justify-between px-4 py-3 border-t border-[#efeafc] text-sm font-bold text-[#5b49c9] hover:bg-purple-50/50 transition-colors cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#7d6aee]"
          >
            {detailOpen ? t("pay.hideDetail") : t("pay.showDetail")}
            <ChevronDown
              className={`w-4.5 h-4.5 transition-transform duration-300 motion-reduce:transition-none ${detailOpen ? "rotate-180" : ""}`}
            />
          </button>

          <Collapse open={detailOpen} id="checkout-detail">
            <div className="px-4 pb-4 pt-1 space-y-4">
              <p className="text-sm text-neutral-600 leading-relaxed">{template.description}</p>
              <button
                type="button"
                onClick={() => onNavigate(`/katalog/${template.slug}`)}
                className="inline-flex items-center gap-1.5 text-sm font-bold text-[#7d6aee] hover:text-[#6b58e0] underline underline-offset-4 cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                {t("checkout.preview")}
              </button>
              <ul className="space-y-2 pt-3 border-t border-[#efeafc]">
                {[t("checkout.feat1"), t("checkout.feat2"), t("checkout.feat3")].map((feat, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#7d6aee] shrink-0 mt-0.5" />
                    <span className="text-xs text-neutral-700 font-medium leading-snug">{feat}</span>
                  </li>
                ))}
              </ul>
              <div className="pt-3 border-t border-[#efeafc] space-y-1.5 text-xs">
                <p className="font-extrabold text-neutral-800 text-[13px]">{t("pay.priceDetail")}</p>
                <div className="flex justify-between items-baseline gap-3 text-neutral-700 font-medium">
                  <span>{t("checkout.templateLine", { title: template.title })}</span>
                  <span className="text-right">
                    <span className="text-neutral-400 line-through mr-1.5">{formatRupiah(originalPrice)}</span>
                    <span className="font-bold text-neutral-900">{formatRupiah(discountPrice)}</span>
                  </span>
                </div>
                {voucherApplied && discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>{appliedDiscount?.code}</span>
                    <span>-{formatRupiah(discountAmount)}</span>
                  </div>
                )}
              </div>
            </div>
          </Collapse>
        </section>

        {/* Kode redeem */}
        <section className={`${card} p-4`}>
          <div className="flex items-center gap-1.5 mb-2.5">
            <Tag className="w-4 h-4 text-neutral-500" />
            <span className="text-sm font-bold text-neutral-700">{t("checkout.haveVoucher")}</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={voucherCode}
              onChange={(e) => {
                setVoucherCode(e.target.value);
                setVoucherError("");
                setVoucherApplied(false); // kode diubah -> harus divalidasi ulang
                setAppliedDiscount(null);
              }}
              placeholder={t("checkout.voucherPh")}
              className="flex-1 min-w-0 border border-[#e3ddf8] rounded-xl px-3 py-2.5 text-xs font-semibold placeholder:text-neutral-300 focus:outline-none focus:border-[#7d6aee] transition-colors select-text"
            />
            <button
              type="button"
              onClick={handleApplyVoucher}
              disabled={voucherChecking || submitting}
              className="px-4 py-2.5 rounded-xl bg-purple-50 border border-purple-200 text-xs font-bold text-[#5b49c9] hover:bg-purple-100 transition-colors cursor-pointer shrink-0 disabled:opacity-60"
            >
              {voucherChecking ? t("checkout.checking") : t("checkout.apply")}
            </button>
          </div>
          {voucherError && <p className="text-rose-500 text-xs font-medium mt-1.5">{tr(voucherError)}</p>}
          {voucherApplied && (
            <p className="text-emerald-600 text-xs font-bold mt-1.5">
              {t("checkout.voucherOk", { amount: formatRupiah(discountAmount) })}
            </p>
          )}
        </section>

        {/* Metode pembayaran */}
        <section>
          <h2 className="text-base font-extrabold text-[#17112e] mb-2.5 px-1">{t("pay.methods")}</h2>
          <div role="radiogroup" aria-label={t("pay.methods")} className={`${card} overflow-hidden divide-y divide-[#f1edfd]`}>
            {PAYMENT_METHODS.map((method) => {
              const active = selectedMethod === method.id;
              return (
                <button
                  key={method.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={submitting}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 text-left transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[#7d6aee] ${
                    active ? "bg-[#f3f0ff]" : "bg-white hover:bg-[#faf8ff]"
                  }`}
                >
                  <PaymentLogo method={method.id} className="h-8 w-16 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-neutral-900 leading-tight">{method.label}</p>
                    <p className="text-xs text-neutral-500 font-medium mt-0.5 truncate">{tr(method.description)}</p>
                  </div>
                  <span
                    className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      active ? "border-[#7d6aee]" : "border-neutral-300"
                    }`}
                  >
                    <span
                      className={`size-2.5 rounded-full bg-[#7d6aee] transition-transform duration-200 motion-reduce:transition-none ${
                        active ? "scale-100" : "scale-0"
                      }`}
                    />
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <div className="px-1 space-y-3">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
            <p className="text-xs text-neutral-600 font-medium leading-snug">{t("checkout.secure")}</p>
          </div>
          <button
            type="button"
            onClick={() =>
              window.open(`https://wa.me/6285187978443?text=${encodeURIComponent(t("wa.paymentHelp"))}`, "_blank")
            }
            className="inline-flex items-center gap-2 text-xs font-bold text-neutral-700 hover:text-[#7d6aee] transition-colors cursor-pointer underline underline-offset-4"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            {t("checkout.help")}
          </button>
        </div>
      </div>

      {/* Bar bawah: total + tombol lanjut */}
      <div className="fixed bottom-0 inset-x-0 z-30 bg-white/92 backdrop-blur-md border-t border-[#e9e4fb] pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-md mx-auto px-4 pt-3 pb-3.5">
          <div className="flex items-end justify-between mb-2.5">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-neutral-500">{t("pay.totalPay")}</p>
              <p className="text-[11px] font-semibold text-neutral-400 truncate">
                {selected ? `${selected.label} · ${tr(selected.description)}` : t("checkout.notChosen")}
              </p>
            </div>
            <p className="text-2xl font-black text-[#5b49c9] leading-none">{formatRupiah(finalTotal)}</p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={handleBayar}
            disabled={!selectedMethod || submitting}
            className={`w-full !py-3.5 !text-base !font-extrabold ${
              !selectedMethod || submitting ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {submitting ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : null}
            {submitting ? t("checkout.processing") : t("pay.continue")}
            {!submitting && <ArrowRight className="w-4.5 h-4.5" />}
          </Button>
          {payError && (
            <p role="alert" className="text-rose-500 text-xs font-semibold text-center mt-2 leading-relaxed">
              {tr(payError)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
