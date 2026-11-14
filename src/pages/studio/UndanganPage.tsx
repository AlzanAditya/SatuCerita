import React, { useMemo } from "react";
import { Check, Clock, Pencil, ChevronRight, Plus, Heart } from "lucide-react";
import { PATHS } from "@/routes";
import { urls } from "@/lib/urls";
import { TEMPLATES_DATA, formatRupiah } from "@/data/templates";
import { isDemo } from "@/lib/studioDemo";
import { draftDone } from "@/lib/editDraft";
import { StudioPageHeader } from "@/components/studio/StudioPageHeader";
import { UserInvitation, OrderItem } from "./types";

export interface UndanganPageProps {
  invitations: UserInvitation[];
  orders?: OrderItem[];
  onNavigate: (path: string) => void;
  showToast?: (msg: string) => void;
  pendingOrders?: OrderItem[];
  userName?: string;
}

const STEPS = ["Input Data", "Foto & Desain", "Cerita Acara", "Preview", "Selesai"];

interface ActiveInvitation {
  cover: string;
  title: string;
  templateSlug?: string;
  doneSteps: number;
}

const DEMO_ACTIVE: ActiveInvitation = {
  cover: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80",
  title: "The Wedding of Alya & Dimas",
  templateSlug: "antheia",
  doneSteps: 2,
};

export const UndanganPage: React.FC<UndanganPageProps> = ({
  invitations,
  orders = [],
  onNavigate,
  showToast,
  pendingOrders = [],
  userName,
}) => {
  // Undangan yang sedang dikerjakan: undangan tersimpan, atau pesanan lunas terbaru.
  const active = useMemo<ActiveInvitation | null>(() => {
    const inv = invitations[0];
    if (inv) {
      return {
        cover: inv.templateCover,
        title: inv.title,
        templateSlug: TEMPLATES_DATA.find((t) => t.title === inv.templateName)?.slug,
        doneSteps: Math.max(inv.progressStep ?? 0, draftDone()),
      };
    }
    const paid = orders.find((o) => o.status === "paid");
    if (paid) {
      return {
        cover: paid.templateCover,
        title: paid.templateName,
        templateSlug: TEMPLATES_DATA.find((t) => t.title === paid.templateName)?.slug,
        doneSteps: draftDone(),
      };
    }
    return isDemo() ? DEMO_ACTIVE : null;
  }, [invitations, orders]);

  const firstName = userName?.trim().split(/\s+/)[0];
  const percent = active ? Math.round((active.doneSteps / STEPS.length) * 100) : 0;

  const openPreview = () => {
    if (!active?.templateSlug) {
      showToast?.("Pratinjau belum tersedia untuk undangan ini.");
      return;
    }
    window.open(urls.landing(`/preview/${active.templateSlug}`), "_blank", "noopener");
  };

  return (
    <div className="animate-fadeIn">
      <StudioPageHeader
        title={firstName ? `Selamat datang, ${firstName}!` : "Selamat datang!"}
        subtitle="Kelola undangan digital Anda dengan mudah di sini."
        onLogoClick={() => onNavigate(PATHS.home)}
      />

      <div className="space-y-4">
        {pendingOrders.length > 0 && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 flex items-center gap-3">
            <div className="size-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-extrabold text-amber-900">
                {pendingOrders.length > 1
                  ? `${pendingOrders.length} pesanan belum dibayar`
                  : "Ada pesanan yang belum dibayar"}
              </h4>
              <p className="text-xs text-amber-800 mt-0.5 truncate">
                {pendingOrders[0].templateName} · {formatRupiah(pendingOrders[0].total)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate(`/studio/order/${pendingOrders[0].invoiceNo}`)}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-neutral-900 font-bold text-xs cursor-pointer shrink-0"
            >
              Bayar
            </button>
          </div>
        )}

        {active ? (
          <>
            {/* Progres edit */}
            <section className="rounded-3xl bg-white p-5 shadow-[0_6px_24px_rgba(94,75,180,0.08)]">
              <div className="flex items-baseline justify-between">
                <h2 className="text-[15px] font-extrabold text-[#17112e]">Progres Edit Undangan</h2>
                <span className="text-base font-black text-[#17112e] tabular-nums">{percent}%</span>
              </div>

              <div
                className="mt-3 h-2 rounded-full bg-[#ece8fb] overflow-hidden"
                role="progressbar"
                aria-valuenow={percent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progres edit undangan"
              >
                <div
                  className="h-full rounded-full bg-[#7d6aee] transition-[width] duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>

              <ol className="mt-5 relative grid grid-cols-5">
                <span aria-hidden className="absolute top-[13px] left-[10%] right-[10%] h-0.5 bg-[#e1dbf8]" />
                <span
                  aria-hidden
                  className="absolute top-[13px] left-[10%] h-0.5 bg-[#7d6aee] transition-[width] duration-500"
                  style={{ width: `${Math.max(0, Math.min(active.doneSteps - 1, STEPS.length - 1)) * 20}%` }}
                />
                {STEPS.map((label, i) => {
                  const done = i < active.doneSteps;
                  return (
                    <li key={label} className="relative flex flex-col items-center text-center">
                      <span
                        className={`size-7 rounded-full flex items-center justify-center border-2 ${
                          done
                            ? "bg-[#7d6aee] border-[#7d6aee] text-white"
                            : "bg-white border-[#d4ccf5]"
                        }`}
                      >
                        {done && <Check className="w-4 h-4" strokeWidth={3} />}
                      </span>
                      <span className="mt-2 text-[11px] leading-tight text-[#5a5476] max-w-[56px]">
                        {label}
                      </span>
                    </li>
                  );
                })}
              </ol>

              <button
                type="button"
                onClick={() => onNavigate("/studio/edit")}
                className="mt-5 w-full h-12 rounded-full bg-[#7d6aee] hover:bg-[#6b58e0] active:scale-[0.99] text-white font-bold text-[15px] inline-flex items-center justify-center gap-2 shadow-[0_6px_16px_rgba(125,106,238,0.35)] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d6aee]"
              >
                <Pencil className="w-4 h-4" />
                Edit Undangan
              </button>
            </section>

            {/* Preview */}
            <section className="rounded-3xl bg-white p-4 shadow-[0_6px_24px_rgba(94,75,180,0.08)]">
              <button
                type="button"
                onClick={openPreview}
                className="w-full flex items-center justify-between text-left cursor-pointer"
              >
                <h2 className="text-[15px] font-extrabold text-[#17112e]">Preview Undangan</h2>
                <ChevronRight className="w-5 h-5 text-[#7a7494]" />
              </button>
              <button
                type="button"
                onClick={openPreview}
                aria-label="Buka preview undangan"
                className="mt-3 relative block w-full aspect-[16/10] rounded-2xl overflow-hidden cursor-pointer group bg-gradient-to-br from-[#b8abff] to-[#7d6aee]"
              >
                {active.cover && (
                  <img
                    src={active.cover}
                    alt=""
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                  />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-black/45 via-black/10 to-black/10" />
                <span className="absolute inset-x-0 bottom-0 p-4 text-center text-white text-lg font-bold italic drop-shadow">
                  {active.title}
                </span>
              </button>
            </section>
          </>
        ) : (
          <section className="rounded-3xl bg-white p-8 text-center shadow-[0_6px_24px_rgba(94,75,180,0.08)] flex flex-col items-center">
            <div className="size-16 rounded-2xl bg-[#f1edff] flex items-center justify-center">
              <Heart className="w-8 h-8 text-[#7d6aee]" />
            </div>
            <h2 className="mt-4 text-lg font-black text-[#17112e]">Belum ada undangan</h2>
            <p className="mt-1.5 text-sm text-[#5a5476] max-w-xs leading-relaxed">
              Pilih template di katalog, lalu selesaikan pesanan untuk mulai menyusun undangan Anda.
            </p>
            <button
              type="button"
              onClick={() => onNavigate(PATHS.katalog)}
              className="mt-5 h-12 px-6 rounded-full bg-[#7d6aee] hover:bg-[#6b58e0] text-white font-bold text-[15px] inline-flex items-center gap-2 shadow-[0_6px_16px_rgba(125,106,238,0.35)] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Pilih template
            </button>
          </section>
        )}
      </div>
    </div>
  );
};

export default UndanganPage;
