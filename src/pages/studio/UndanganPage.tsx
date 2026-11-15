import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Clock, Pencil, ChevronRight, Plus, Heart, RefreshCw } from "lucide-react";
import { PATHS } from "@/routes";
import { urls } from "@/lib/urls";
import { TEMPLATES_DATA } from "@/data/templates";
import { isDemo } from "@/lib/studioDemo";
import { EDIT_STEPS, FINAL_PROGRESS, isEditFinished } from "@/lib/editSteps";
import { listInvitations, previewUrl, type InvitationSummary } from "@/lib/invitationApi";
import { StudioPageHeader } from "@/components/studio/StudioPageHeader";
import { useT, formatRupiahLang, type TKey } from "@/i18n";
import { UserInvitation, OrderItem } from "./types";

export interface UndanganPageProps {
  invitations: UserInvitation[];
  orders?: OrderItem[];
  onNavigate: (path: string) => void;
  showToast?: (msg: string) => void;
  pendingOrders?: OrderItem[];
  userName?: string;
}

/** Satu undangan (pesanan lunas) yang ditampilkan di Beranda. */
interface InvitationCard {
  key: string;
  /** id undangan di server; kosong untuk pesanan lunas yang undangannya belum terbentuk. */
  id?: string;
  title: string;
  cover: string;
  templateSlug?: string;
  /** Jumlah langkah edit yang selesai (0–5). */
  doneSteps: number;
  status?: InvitationSummary["status"];
}

const DEMO_CARDS: InvitationCard[] = [
  {
    key: "demo-1",
    title: "The Wedding of Alya & Dimas",
    cover: TEMPLATES_DATA[0]?.image ?? "",
    templateSlug: "antheia",
    doneSteps: 2,
  },
  {
    key: "demo-2",
    title: "Pawiwahan Rama & Sinta",
    cover: TEMPLATES_DATA[1]?.image ?? "",
    templateSlug: "aglaia",
    doneSteps: FINAL_PROGRESS,
    status: "published",
  },
];

const shell = "rounded-3xl bg-white shadow-[0_6px_24px_rgba(94,75,180,0.08)]";

type Load = "loading" | "ready" | "error";

export const UndanganPage: React.FC<UndanganPageProps> = ({
  orders = [],
  onNavigate,
  showToast,
  pendingOrders = [],
  userName,
}) => {
  const { t, lang } = useT();
  const formatRupiah = (v: number) => formatRupiahLang(v, lang);
  const demo = isDemo();
  const [load, setLoad] = useState<Load>(demo ? "ready" : "loading");
  const [fromApi, setFromApi] = useState<InvitationSummary[]>([]);

  const fetchInvitations = useCallback(async () => {
    if (demo) return;
    setLoad("loading");
    const res = await listInvitations();
    if (res.ok && Array.isArray(res.data.invitations)) {
      setFromApi(res.data.invitations);
      setLoad("ready");
    } else {
      setLoad("error");
    }
  }, [demo]);

  useEffect(() => {
    void fetchInvitations();
  }, [fetchInvitations]);

  // Semua undangan milik user. Jika server belum punya undangan, pakai pesanan lunas sebagai cadangan.
  const cards = useMemo<InvitationCard[]>(() => {
    if (demo) return DEMO_CARDS;
    if (fromApi.length) {
      return fromApi.map((inv) => {
        const tpl = TEMPLATES_DATA.find((t) => t.slug === inv.templateSlug);
        return {
          key: inv.id,
          id: inv.id,
          title: inv.title?.trim() || (tpl ? t("inv.defaultTitleOf", { title: tpl.title }) : t("inv.defaultTitle")),
          cover: tpl?.image ?? "",
          templateSlug: inv.templateSlug,
          doneSteps: inv.progressStep ?? 0,
          status: inv.status,
        };
      });
    }
    return orders
      .filter((o) => o.status === "paid")
      .map((o) => {
        const tpl = TEMPLATES_DATA.find((t) => t.title === o.templateName);
        return {
          key: `order-${o.invoiceNo}`,
          title: o.templateName,
          cover: tpl?.image ?? o.templateCover,
          templateSlug: tpl?.slug,
          doneSteps: 0,
        };
      });
  }, [demo, fromApi, orders, t]);

  const firstName = userName?.trim().split(/\s+/)[0];

  const openPreview = (c: InvitationCard) => {
    if (c.id) {
      window.open(previewUrl(c.id), "_blank", "noopener");
      return;
    }
    if (!c.templateSlug) {
      showToast?.("Pratinjau belum tersedia untuk undangan ini.");
      return;
    }
    window.open(urls.landing(`/preview/${c.templateSlug}`), "_blank", "noopener");
  };

  const openEditor = (c: InvitationCard) => onNavigate(c.id ? `/studio/edit?id=${encodeURIComponent(c.id)}` : "/studio/edit");

  return (
    <div className="animate-fadeIn">
      <StudioPageHeader
        title={firstName ? t("inv.welcomeNamed", { name: firstName }) : t("inv.welcome")}
        subtitle={t("inv.subtitle")}
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
                  ? t("inv.unpaidMany", { n: pendingOrders.length })
                  : t("inv.unpaidOne")}
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
              {t("inv.pay")}
            </button>
          </div>
        )}

        {load === "loading" && cards.length === 0 && (
          <div className={`${shell} p-4 animate-pulse`} aria-busy="true" aria-label={t("inv.loading")}>
            <div className="h-4 w-36 rounded bg-[#ece8fb]" />
            <div className="mt-3 aspect-[16/10] rounded-2xl bg-[#ece8fb]" />
            <div className="mt-5 h-4 w-44 rounded bg-[#ece8fb]" />
            <div className="mt-4 h-12 rounded-full bg-[#ece8fb]" />
          </div>
        )}

        {load === "error" && cards.length === 0 && (
          <section className={`${shell} p-8 text-center flex flex-col items-center`}>
            <h2 className="text-lg font-black text-[#17112e]">{t("inv.loadFailed")}</h2>
            <p className="mt-1.5 text-sm text-[#5a5476] max-w-xs leading-relaxed">
              {t("inv.checkConnection")}
            </p>
            <button
              type="button"
              onClick={() => void fetchInvitations()}
              className="mt-5 h-11 px-5 rounded-full bg-[#7d6aee] hover:bg-[#6b58e0] text-white font-bold text-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              {t("common.retry")}
            </button>
          </section>
        )}

        {cards.length > 1 && (
          <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-[#7a7494]">
            {t("inv.myCount", { n: cards.length })}
          </h2>
        )}

        {cards.map((c) => (
          <InvitationProgressCard
            key={c.key}
            card={c}
            onPreview={() => openPreview(c)}
            onEdit={() => openEditor(c)}
          />
        ))}

        {load === "ready" && cards.length === 0 && (
          <section className={`${shell} p-8 text-center flex flex-col items-center`}>
            <div className="size-16 rounded-2xl bg-[#f1edff] flex items-center justify-center">
              <Heart className="w-8 h-8 text-[#7d6aee]" />
            </div>
            <h2 className="mt-4 text-lg font-black text-[#17112e]">{t("inv.emptyTitle")}</h2>
            <p className="mt-1.5 text-sm text-[#5a5476] max-w-xs leading-relaxed">
              {t("inv.emptyDesc")}
            </p>
            <button
              type="button"
              onClick={() => onNavigate(PATHS.katalog)}
              className="mt-5 h-12 px-6 rounded-full bg-[#7d6aee] hover:bg-[#6b58e0] text-white font-bold text-[15px] inline-flex items-center gap-2 shadow-[0_6px_16px_rgba(125,106,238,0.35)] cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {t("inv.pickTemplate")}
            </button>
          </section>
        )}
      </div>
    </div>
  );
};

/** Kartu satu undangan: Preview di atas, lalu Progres Edit (bar + langkah jadi satu), lalu tombol edit. */
const InvitationProgressCard: React.FC<{
  card: InvitationCard;
  onPreview: () => void;
  onEdit: () => void;
}> = ({ card, onPreview, onEdit }) => {
  const { t } = useT();
  const total = EDIT_STEPS.length;
  const finished = isEditFinished(card.doneSteps);
  const done = Math.min(Math.max(card.doneSteps, 0), total);
  const current = finished ? -1 : done; // langkah yang sedang dikerjakan
  const percent = Math.round((done / total) * 100);
  // Garis terisi sampai titik langkah aktif (atau sampai akhir bila sudah selesai).
  const fill = Math.min(finished ? total - 1 : done, total - 1) * 20;

  return (
    <article className={`${shell} p-4`}>
      {/* Preview */}
      <button
        type="button"
        onClick={onPreview}
        className="w-full flex items-center justify-between text-left cursor-pointer"
      >
        <h2 className="text-[15px] font-extrabold text-[#17112e]">{t("inv.previewTitle")}</h2>
        <ChevronRight className="w-5 h-5 text-[#7a7494]" />
      </button>
      <button
        type="button"
        onClick={onPreview}
        aria-label={t("inv.previewAria", { title: card.title })}
        className="mt-3 relative block w-full aspect-[16/10] rounded-2xl overflow-hidden cursor-pointer bg-gradient-to-br from-[#b8abff] to-[#7d6aee]"
      >
        {card.cover && (
          <img
            src={card.cover}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            onError={(e) => (e.currentTarget.style.display = "none")}
          />
        )}
        <span className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/5" />
        {card.status && (
          <span
            className={`absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-sm ${
              card.status === "published" ? "bg-emerald-500/90 text-white" : "bg-white/85 text-[#5b49c9]"
            }`}
          >
            {card.status === "published" ? t("inv.published") : t("inv.draft")}
          </span>
        )}
        <span className="absolute inset-x-0 bottom-0 p-4 text-center text-white text-lg font-bold italic drop-shadow">
          {card.title}
        </span>
      </button>

      {/* Progres edit: bar dan langkah digabung */}
      <div className="mt-5 px-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-[15px] font-extrabold text-[#17112e]">{t("inv.progressTitle")}</h3>
          {finished ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
              <Check className="w-3.5 h-3.5" strokeWidth={3} />
              {t("inv.done")}
            </span>
          ) : (
            <span className="text-base font-black text-[#17112e] tabular-nums">{percent}%</span>
          )}
        </div>

        <ol
          className="mt-4 relative grid grid-cols-5"
          aria-label={finished ? t("inv.progressAriaDone") : t("inv.progressAria", { percent })}
        >
          <span aria-hidden className="absolute top-[13px] left-[10%] right-[10%] h-1 -translate-y-1/2 rounded-full bg-[#e1dbf8]" />
          <span
            aria-hidden
            className="absolute top-[13px] left-[10%] h-1 -translate-y-1/2 rounded-full bg-[#7d6aee] transition-[width] duration-500"
            style={{ width: `${fill}%` }}
          />
          {EDIT_STEPS.map((st, i) => {
            const isDone = finished || i < done;
            const isCurrent = i === current;
            return (
              <li
                key={st.title}
                className="relative flex flex-col items-center text-center"
                aria-current={isCurrent ? "step" : undefined}
              >
                <span
                  className={`size-7 rounded-full flex items-center justify-center border-2 text-xs font-bold transition-colors ${
                    isDone
                      ? "bg-[#7d6aee] border-[#7d6aee] text-white"
                      : isCurrent
                        ? "bg-white border-[#7d6aee] text-[#6b58e0] shadow-[0_0_0_4px_rgba(125,106,238,0.18)]"
                        : "bg-white border-[#d4ccf5] text-[#a39cc4]"
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" strokeWidth={3} /> : i + 1}
                </span>
                <span
                  className={`mt-2 text-[10.5px] leading-tight max-w-[60px] ${
                    isCurrent ? "font-bold text-[#6b58e0]" : "text-[#5a5476]"
                  }`}
                >
                  {t(`edit.step.${i + 1}.title` as TKey)}
                </span>
              </li>
            );
          })}
        </ol>
      </div>

      <button
        type="button"
        onClick={onEdit}
        className="mt-5 w-full h-12 rounded-full bg-[#7d6aee] hover:bg-[#6b58e0] active:scale-[0.99] text-white font-bold text-[15px] inline-flex items-center justify-center gap-2 shadow-[0_6px_16px_rgba(125,106,238,0.35)] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d6aee]"
      >
        <Pencil className="w-4 h-4" />
        {t("studio.title.edit")}
      </button>
    </article>
  );
};

export default UndanganPage;
