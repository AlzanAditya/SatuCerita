import React, { useState, useMemo } from "react";
import { ChevronRight, Info, ShoppingBag } from "lucide-react";
import { PATHS } from "@/routes";
import { SITE } from "@/config/site";
import { StudioPageHeader } from "@/components/studio/StudioPageHeader";
import { OrderItem } from "./types";
import { useT, formatShortDate, type TKey } from "@/i18n";

type Filter = "semua" | "aktif" | "selesai";

const FILTERS: { id: Filter; key: TKey }[] = [
  { id: "semua", key: "orders.filterAll" },
  { id: "aktif", key: "orders.filterActive" },
  { id: "selesai", key: "orders.filterDone" },
];

// Aktif = masih berjalan (belum dibayar / sedang ditinjau). Selesai = sudah lunas atau sudah berakhir.
const isActive = (o: OrderItem) => o.status === "pending" || o.status === "needs_review";

const STATUS_BADGE: Record<string, { key: TKey; cls: string; dot: string }> = {
  pending: { key: "order.status.pending", cls: "bg-[#fff3d6] text-[#8a5a00]", dot: "bg-[#f0a500]" },
  needs_review: { key: "order.status.needsReview", cls: "bg-[#e0f1ff] text-[#0b5a8f]", dot: "bg-[#2b9be0]" },
  paid: { key: "order.status.paid", cls: "bg-[#ddf6e8] text-[#17794a]", dot: "bg-[#2fb36d]" },
  expired: { key: "order.status.expired", cls: "bg-[#ece8fb] text-[#5a5476]", dot: "bg-[#a39cc4]" },
  cancelled: { key: "order.status.cancelled", cls: "bg-[#ece8fb] text-[#5a5476]", dot: "bg-[#a39cc4]" },
  failed: { key: "order.status.failed", cls: "bg-[#ffe3e6] text-[#a3202f]", dot: "bg-[#e5484d]" },
};

export interface PesananPageProps {
  orders: OrderItem[];
  selectedOrderId?: string | null;
  setSelectedOrderId?: (id: string | null) => void;
  onNavigate: (path: string) => void;
  showToast?: (msg: string) => void;
}

export const PesananPage: React.FC<PesananPageProps> = ({ orders, onNavigate }) => {
  const { t, lang } = useT();
  const [filter, setFilter] = useState<Filter>("semua");

  const filtered = useMemo(() => {
    if (filter === "semua") return orders;
    return orders.filter((o) => (filter === "aktif" ? isActive(o) : !isActive(o)));
  }, [orders, filter]);

  const isStandalone =
    typeof window !== "undefined" &&
    (window.location.hostname.startsWith("studio.") || window.location.hostname.startsWith("app."));
  const prefix = isStandalone ? "" : "/studio";

  const helpHref = `https://wa.me/${SITE.contact.whatsapp}?text=${encodeURIComponent(t("wa.orderSupport"))}`;

  return (
    <div className="animate-fadeIn">
      <StudioPageHeader
        title={t("studio.title.orders")}
        subtitle={t("orders.subtitle")}
        onLogoClick={() => onNavigate(PATHS.home)}
      />

      <div className="space-y-4">
        <div role="tablist" aria-label={t("orders.filterAria")} className="grid grid-cols-3 gap-2">
          {FILTERS.map((f) => {
            const on = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setFilter(f.id)}
                className={`h-10 rounded-full text-sm font-bold cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d6aee] ${
                  on ? "bg-[#7d6aee] text-white shadow-[0_4px_12px_rgba(125,106,238,0.3)]" : "bg-[#e9e4fb] text-[#5a5476] hover:bg-[#e0daf8]"
                }`}
              >
                {t(f.key)}
              </button>
            );
          })}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-[0_6px_24px_rgba(94,75,180,0.08)] flex flex-col items-center">
            <div className="size-16 rounded-2xl bg-[#f1edff] flex items-center justify-center">
              <ShoppingBag className="w-8 h-8 text-[#7d6aee]" />
            </div>
            <h2 className="mt-4 text-lg font-black text-[#17112e]">
              {orders.length === 0 ? t("orders.none") : t("orders.noneHere")}
            </h2>
            <p className="mt-1.5 text-sm text-[#5a5476] max-w-xs leading-relaxed">
              {orders.length === 0
                ? t("orders.noneDesc")
                : t("orders.tryFilter")}
            </p>
            {orders.length === 0 && (
              <button
                type="button"
                onClick={() => onNavigate(PATHS.katalog)}
                className="mt-5 h-12 px-6 rounded-full bg-[#7d6aee] hover:bg-[#6b58e0] text-white font-bold text-[15px] cursor-pointer shadow-[0_6px_16px_rgba(125,106,238,0.35)]"
              >
                {t("orders.browse")}
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((o) => {
              const b = STATUS_BADGE[o.status] ?? STATUS_BADGE.pending;
              return (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => onNavigate(`${prefix}/order/${o.invoiceNo}`)}
                    className="w-full text-left rounded-2xl bg-white px-4 py-3.5 shadow-[0_4px_18px_rgba(94,75,180,0.07)] flex items-center gap-3 cursor-pointer hover:shadow-[0_6px_22px_rgba(94,75,180,0.12)] transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d6aee]"
                  >
                    <span className={`size-2 rounded-full shrink-0 ${b.dot}`} aria-hidden />
                    <span className="flex-1 min-w-0">
                      <span className="block text-[15px] font-extrabold text-[#17112e] truncate">
                        #{o.invoiceNo}
                      </span>
                      <span className="block mt-0.5 text-xs text-[#5a5476] truncate">
                        {t("orders.orderedOn", { date: formatShortDate(o.date, lang) })}
                      </span>
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${b.cls}`}>
                      {t(b.key)}
                    </span>
                    <ChevronRight className="w-4 h-4 text-[#7a7494] shrink-0" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <aside className="rounded-2xl bg-[#e9e4fb] p-4 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#7a7494] mt-0.5 shrink-0" />
          <div className="min-w-0">
            <h3 className="text-[15px] font-extrabold text-[#17112e]">{t("orders.needHelp")}</h3>
            <p className="text-xs text-[#5a5476] mt-0.5">{t("orders.helpDesc")}</p>
            <a
              href={helpHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[#6b58e0] hover:underline"
            >
              {t("orders.contact")} <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PesananPage;
