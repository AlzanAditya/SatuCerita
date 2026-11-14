import React, { useState, useMemo } from "react";
import { ChevronRight, Info, ShoppingBag } from "lucide-react";
import { PATHS } from "@/routes";
import { SITE } from "@/config/site";
import { StudioPageHeader } from "@/components/studio/StudioPageHeader";
import { OrderItem } from "./types";

type Filter = "semua" | "aktif" | "selesai";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "semua", label: "Semua" },
  { id: "aktif", label: "Aktif" },
  { id: "selesai", label: "Selesai" },
];

// Aktif = masih berjalan (belum dibayar / sedang ditinjau). Selesai = sudah lunas atau sudah berakhir.
const isActive = (o: OrderItem) => o.status === "pending" || o.status === "needs_review";

const STATUS_BADGE: Record<string, { label: string; cls: string; dot: string }> = {
  pending: { label: "Menunggu bayar", cls: "bg-[#fff3d6] text-[#8a5a00]", dot: "bg-[#f0a500]" },
  needs_review: { label: "Ditinjau", cls: "bg-[#e0f1ff] text-[#0b5a8f]", dot: "bg-[#2b9be0]" },
  paid: { label: "Lunas", cls: "bg-[#ddf6e8] text-[#17794a]", dot: "bg-[#2fb36d]" },
  expired: { label: "Kedaluwarsa", cls: "bg-[#ece8fb] text-[#5a5476]", dot: "bg-[#a39cc4]" },
  cancelled: { label: "Dibatalkan", cls: "bg-[#ece8fb] text-[#5a5476]", dot: "bg-[#a39cc4]" },
  failed: { label: "Gagal", cls: "bg-[#ffe3e6] text-[#a3202f]", dot: "bg-[#e5484d]" },
};

const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const w = new Date(d.getTime() + 7 * 3600_000); // WIB
  return `${w.getUTCDate()} ${BULAN[w.getUTCMonth()]} ${w.getUTCFullYear()}`;
}

export interface PesananPageProps {
  orders: OrderItem[];
  selectedOrderId?: string | null;
  setSelectedOrderId?: (id: string | null) => void;
  onNavigate: (path: string) => void;
  showToast?: (msg: string) => void;
}

export const PesananPage: React.FC<PesananPageProps> = ({ orders, onNavigate }) => {
  const [filter, setFilter] = useState<Filter>("semua");

  const filtered = useMemo(() => {
    if (filter === "semua") return orders;
    return orders.filter((o) => (filter === "aktif" ? isActive(o) : !isActive(o)));
  }, [orders, filter]);

  const isStandalone =
    typeof window !== "undefined" &&
    (window.location.hostname.startsWith("studio.") || window.location.hostname.startsWith("app."));
  const prefix = isStandalone ? "" : "/studio";

  const helpHref = `https://wa.me/${SITE.contact.whatsapp}?text=${encodeURIComponent(
    "Halo Satu Cerita, saya butuh bantuan terkait pesanan saya."
  )}`;

  return (
    <div className="animate-fadeIn">
      <StudioPageHeader
        title="Pesanan"
        subtitle="Riwayat dan status pesanan undangan Anda."
        onLogoClick={() => onNavigate(PATHS.home)}
      />

      <div className="space-y-4">
        <div role="tablist" aria-label="Filter pesanan" className="grid grid-cols-3 gap-2">
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
                {f.label}
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
              {orders.length === 0 ? "Belum ada pesanan" : "Tidak ada pesanan di sini"}
            </h2>
            <p className="mt-1.5 text-sm text-[#5a5476] max-w-xs leading-relaxed">
              {orders.length === 0
                ? "Pesanan template dan add-on Anda akan tercatat di halaman ini."
                : "Coba pilih filter lain untuk melihat pesanan Anda."}
            </p>
            {orders.length === 0 && (
              <button
                type="button"
                onClick={() => onNavigate(PATHS.katalog)}
                className="mt-5 h-12 px-6 rounded-full bg-[#7d6aee] hover:bg-[#6b58e0] text-white font-bold text-[15px] cursor-pointer shadow-[0_6px_16px_rgba(125,106,238,0.35)]"
              >
                Jelajahi katalog
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
                        Dipesan pada {shortDate(o.date)}
                      </span>
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${b.cls}`}>
                      {b.label}
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
            <h3 className="text-[15px] font-extrabold text-[#17112e]">Butuh bantuan?</h3>
            <p className="text-xs text-[#5a5476] mt-0.5">Hubungi kami melalui pusat bantuan.</p>
            <a
              href={helpHref}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-sm font-bold text-[#6b58e0] hover:underline"
            >
              Hubungi <ChevronRight className="w-4 h-4" />
            </a>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default PesananPage;
