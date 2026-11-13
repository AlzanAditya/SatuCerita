import React, { useState, useMemo } from "react";
import { ShoppingBag, CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PATHS } from "@/routes";
import { OrderItem } from "./types";
import { formatOrderDate } from "@/lib/payments";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  paid: { label: "Lunas", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  pending: { label: "Menunggu Bayar", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  expired: { label: "Kedaluwarsa", cls: "bg-neutral-100 text-neutral-600 border-neutral-200" },
  cancelled: { label: "Dibatalkan", cls: "bg-neutral-100 text-neutral-600 border-neutral-200" },
  failed: { label: "Gagal", cls: "bg-rose-50 text-rose-700 border-rose-200" },
  needs_review: { label: "Ditinjau", cls: "bg-sky-50 text-sky-700 border-sky-200" },
};

export interface PesananPageProps {
  orders: OrderItem[];
  selectedOrderId?: string | null;
  setSelectedOrderId?: (id: string | null) => void;
  onNavigate: (path: string) => void;
  showToast?: (msg: string) => void;
}

export const PesananPage: React.FC<PesananPageProps> = ({
  orders,
  onNavigate,
}) => {
  const [orderFilter, setOrderFilter] = useState<"semua" | "pending" | "paid">("semua");
  const filteredOrders = useMemo(() => {
    if (orderFilter === "semua") return orders;
    return orders.filter((o) => o.status === orderFilter);
  }, [orders, orderFilter]);

  // Detail pesanan ditampilkan oleh OrderDetailPage (data & status dari server), bukan di sini.
  const isStandalone = typeof window !== "undefined" && window.location.hostname.startsWith("app.");
  const prefix = isStandalone ? "" : "/app";

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
              onClick={() => onNavigate(`${prefix}/order/${ord.invoiceNo}`)}
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
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                    (STATUS_BADGE[ord.status] ?? STATUS_BADGE.pending).cls
                  }`}
                >
                  {(STATUS_BADGE[ord.status] ?? STATUS_BADGE.pending).label}
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
                <span className="text-neutral-400 font-medium">{formatOrderDate(ord.date)}</span>
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
