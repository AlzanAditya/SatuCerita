import React, { useState, useMemo } from "react";
import { Plus, Heart, Calendar, Share2, LayoutGrid, ChevronRight, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PATHS } from "@/routes";
import { UserInvitation, OrderItem } from "./types";
import { formatRupiah } from "@/data/templates";

export interface UndanganPageProps {
  invitations: UserInvitation[];
  onNavigate: (path: string) => void;
  showToast?: (msg: string) => void;
  pendingOrders?: OrderItem[];
}

export const UndanganPage: React.FC<UndanganPageProps> = ({
  invitations,
  onNavigate,
  showToast,
  pendingOrders = [],
}) => {
  const [invitationFilter, setInvitationFilter] = useState<"semua" | "aktif" | "draft">("semua");

  const filteredInvitations = useMemo(() => {
    if (invitationFilter === "semua") return invitations;
    return invitations.filter((i) => i.status === invitationFilter);
  }, [invitations, invitationFilter]);

  const handleCopy = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      if (showToast) showToast(label);
    } catch (_e) {}
  };

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn">
      {/* Pending Payment Notification */}
      {pendingOrders.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 border-b-[3px] border-b-amber-300 rounded-2xl p-4 flex items-start gap-3 shadow-2xs">
          <div className="size-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Clock className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-extrabold text-amber-800">
              {pendingOrders.length > 1
                ? `${pendingOrders.length} pesanan belum dibayar`
                : "Ada pembayaran yang belum dibayar"}
            </h4>
            <p className="text-xs text-amber-700 font-medium mt-0.5 leading-snug">
              {pendingOrders[0].templateName} · {formatRupiah(pendingOrders[0].total)}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate(`/app/order/${pendingOrders[0].invoiceNo}`)}
            className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-neutral-900 font-bold text-xs cursor-pointer transition-colors shrink-0"
          >
            Bayar
          </button>
        </div>
      )}

      {/* Filter Status Undangan */}
      <div className="flex items-center justify-start">
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-purple-100 border-b-[2px] border-b-purple-200/70 shadow-2xs select-none">
          <button
            type="button"
            onClick={() => setInvitationFilter("semua")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              invitationFilter === "semua"
                ? "bg-[#7d6aee] text-white shadow-2xs"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setInvitationFilter("aktif")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              invitationFilter === "aktif"
                ? "bg-[#7d6aee] text-white shadow-2xs"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Aktif
          </button>
          <button
            type="button"
            onClick={() => setInvitationFilter("draft")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              invitationFilter === "draft"
                ? "bg-[#7d6aee] text-white shadow-2xs"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Draft
          </button>
        </div>
      </div>

      {/* KONDISI EMPTY STATE */}
      {filteredInvitations.length === 0 ? (
        <div className="bg-white rounded-3xl p-6 sm:p-10 border border-purple-100 shadow-2xs flex flex-col items-center text-center">
          <div className="size-20 sm:size-24 rounded-3xl bg-purple-50/80 border border-purple-200/70 flex items-center justify-center text-[#7d6aee] shadow-sm mb-4">
            <Heart className="w-9 h-9 sm:w-11 sm:h-11 text-[#7d6aee] fill-purple-100/50" />
          </div>

          <h3 className="text-base sm:text-lg font-black tracking-tight text-neutral-900">
            Belum Ada Undangan
          </h3>

          <p className="text-xs sm:text-sm text-neutral-500 font-medium max-w-sm mt-1.5 leading-relaxed">
            Kamu belum memiliki undangan digital yang dibuat. Pilih template favoritmu di katalog dan mulailah merancang undangan pernikahan impianmu.
          </p>

          <Button
            variant="primary"
            size="lg"
            onClick={() => onNavigate(PATHS.katalog)}
            className="mt-5 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Pilih Template di Katalog</span>
          </Button>
        </div>
      ) : (
        /* JIKA SUDAH ADA UNDANGAN DIBUAT */
        <div className="space-y-4">
          {filteredInvitations.map((inv) => (
            <div
              key={inv.id}
              className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-2xs hover:border-purple-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3.5">
                <img
                  src={inv.templateCover}
                  alt={inv.title}
                  className="size-16 sm:size-18 rounded-xl object-cover border border-purple-100 shadow-2xs shrink-0"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                      {inv.status === "active" ? "Aktif" : "Draft"}
                    </span>
                    <span className="text-xs text-neutral-400 font-medium">
                      {inv.templateName}
                    </span>
                  </div>
                  <h4 className="text-sm sm:text-base font-extrabold text-neutral-900 tracking-tight mt-1">
                    {inv.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#7d6aee]" />
                      {inv.eventDate}
                    </span>
                    <span>•</span>
                    <span>{inv.rsvpCount} RSVP</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                <button
                  type="button"
                  onClick={() => handleCopy(`https://satucerita.com/${inv.slug}`, "Link undangan disalin!")}
                  className="p-2 rounded-xl bg-purple-50 text-[#7d6aee] hover:bg-purple-100 transition-colors cursor-pointer"
                  title="Bagikan Tautan Undangan"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => showToast && showToast("Membuka editor undangan...")}
                  className="px-3.5 py-2 rounded-xl bg-[#7d6aee] text-white hover:bg-[#6b58e0] font-bold text-xs shadow-2xs transition-all cursor-pointer"
                >
                  Edit Undangan
                </button>
              </div>
            </div>
          ))}

          {/* Card di bawah item: Belum ada undangan, lihat katalog */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-purple-50 text-[#7d6aee] flex items-center justify-center shrink-0 border border-purple-100">
                <LayoutGrid className="w-5 h-5" />
              </div>
              <div>
                <h5 className="text-xs sm:text-sm font-extrabold text-neutral-900">
                  Lihat pilihan desain di katalog
                </h5>
                <p className="text-[11px] sm:text-xs text-neutral-500 font-medium mt-0.5">
                  Pilih template favoritmu di katalog untuk membuat undangan baru.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate(PATHS.katalog)}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
            >
              <span>Lihat Katalog</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UndanganPage;
