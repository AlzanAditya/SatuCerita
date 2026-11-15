import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CheckCircle2, HelpCircle, Loader2, MessageCircle, MessageSquareText, Trash2, XCircle } from "lucide-react";
import { PATHS } from "@/routes";
import { StudioPageHeader } from "@/components/studio/StudioPageHeader";
import { Button } from "@/components/ui/Button";
import { deleteWish, listMyWishes, type OwnerWish, type WishInvitation } from "@/lib/invitationApi";
import { DEMO_INVITATIONS, DEMO_WISHES, isDemo } from "@/lib/studioDemo";
import { useT, formatShortDate, type TKey } from "@/i18n";
import type { Language } from "@/context/LanguageContext";

export interface UcapanPageProps {
  onNavigate?: (path: string) => void;
  showToast?: (msg: string) => void;
}

function stamp(iso: string, lang: Language): string {
  const w = new Date(new Date(iso).getTime() + 7 * 3600_000); // WIB
  if (Number.isNaN(w.getTime())) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  return `${formatShortDate(iso, lang)} • ${p(w.getUTCHours())}:${p(w.getUTCMinutes())}`;
}
const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((s) => s[0]?.toUpperCase() ?? "").join("");

const ATTEND = {
  yes: { key: "wishes.attend.yes" as TKey, cls: "bg-emerald-50 text-emerald-700", Icon: CheckCircle2 },
  no: { key: "wishes.attend.no" as TKey, cls: "bg-rose-50 text-rose-600", Icon: XCircle },
  maybe: { key: "wishes.attend.maybe" as TKey, cls: "bg-amber-50 text-amber-700", Icon: HelpCircle },
} as const;

const PAGE_SIZE = 5;

export const UcapanPage: React.FC<UcapanPageProps> = ({ onNavigate, showToast }) => {
  const { t, tr, lang } = useT();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invitations, setInvitations] = useState<WishInvitation[]>([]);
  const [wishes, setWishes] = useState<OwnerWish[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [showAll, setShowAll] = useState(false);
  const [toDelete, setToDelete] = useState<OwnerWish | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (isDemo()) {
      setInvitations(DEMO_INVITATIONS);
      setWishes(DEMO_WISHES);
      setLoading(false);
      return;
    }
    const res = await listMyWishes();
    if (res.ok && Array.isArray(res.data.wishes)) {
      setInvitations(res.data.invitations ?? []);
      setWishes(res.data.wishes);
    } else {
      setError(res.data.error || "Gagal memuat ucapan.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const list = useMemo(() => (filter === "all" ? wishes : wishes.filter((w) => w.invitationId === filter)), [wishes, filter]);
  const visible = showAll ? list : list.slice(0, PAGE_SIZE);
  const attending = list.filter((w) => w.attendance === "yes").length;
  const titleOf = (id: string) => {
    const i = invitations.find((x) => x.id === id);
    return i ? i.title || i.slug : "";
  };

  const confirmDelete = async () => {
    if (!toDelete || deleting) return;
    setDeleting(true);
    if (isDemo()) {
      setWishes((prev) => prev.filter((w) => w.id !== toDelete.id));
      setToDelete(null);
      setDeleting(false);
      return;
    }
    const res = await deleteWish(toDelete.invitationId, toDelete.id);
    setDeleting(false);
    if (res.ok || res.status === 404) {
      setWishes((prev) => prev.filter((w) => w.id !== toDelete.id));
      setToDelete(null);
      showToast?.("Ucapan dihapus.");
    } else {
      showToast?.(res.data.error || "Gagal menghapus ucapan. Coba lagi.");
    }
  };

  return (
    <div className="animate-fadeIn">
      <StudioPageHeader
        title={t("studio.title.wishes")}
        subtitle={t("wishes.subtitle")}
        onLogoClick={() => onNavigate?.(PATHS.home)}
      />

      <div className="space-y-4">
        <section className="rounded-3xl bg-[#e4defa] py-4 grid grid-cols-2 items-center">
          <div className="flex items-center justify-center gap-3 border-r border-[#c9bff0]">
            <MessageCircle className="w-9 h-9 text-[#7d6aee] fill-[#7d6aee]/90" strokeWidth={1.5} />
            <div>
              <div className="text-[26px] leading-none font-black text-[#17112e] tabular-nums">{list.length}</div>
              <div className="text-xs text-[#5a5476] mt-1">{t("wishes.incoming")}</div>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <CheckCircle2 className="w-9 h-9 text-[#7d6aee]" strokeWidth={1.5} />
            <div>
              <div className="text-[26px] leading-none font-black text-[#17112e] tabular-nums">{attending}</div>
              <div className="text-xs text-[#5a5476] mt-1">{t("wishes.confirmed")}</div>
            </div>
          </div>
        </section>

        {invitations.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Filter undangan">
            {[{ id: "all", label: t("wishes.all") }, ...invitations.map((i) => ({ id: i.id, label: i.title || i.slug }))].map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={filter === tab.id}
                onClick={() => {
                  setFilter(tab.id);
                  setShowAll(false);
                }}
                className={`shrink-0 h-9 px-4 rounded-full text-xs font-bold cursor-pointer ${
                  filter === tab.id ? "bg-[#7d6aee] text-white" : "bg-white text-[#5a5476] hover:bg-[#f1edff]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl bg-white p-8 flex items-center justify-center gap-2 text-sm text-[#5a5476]" role="status">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t("wishes.loading")}
          </div>
        ) : error ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-[0_6px_24px_rgba(94,75,180,0.08)]">
            <p className="text-sm text-[#5a5476]">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="mt-4 h-10 px-6 rounded-full bg-[#e9e4fb] hover:bg-[#e0daf8] text-sm font-bold text-[#5b49c9] cursor-pointer"
            >
              {t("common.retry")}
            </button>
          </div>
        ) : list.length === 0 ? (
          <div className="rounded-3xl bg-white p-8 text-center shadow-[0_6px_24px_rgba(94,75,180,0.08)] flex flex-col items-center">
            <div className="size-16 rounded-2xl bg-[#f1edff] flex items-center justify-center">
              <MessageSquareText className="w-8 h-8 text-[#7d6aee]" />
            </div>
            <h2 className="mt-4 text-lg font-black text-[#17112e]">{t("wishes.emptyTitle")}</h2>
            <p className="mt-1.5 text-sm text-[#5a5476] max-w-xs leading-relaxed">
              {invitations.length === 0
                ? t("wishes.emptyNoInv")
                : t("wishes.emptyShared")}
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {visible.map((w) => {
              const a = ATTEND[w.attendance] ?? ATTEND.maybe;
              return (
                <li key={w.id} className="rounded-2xl bg-white p-4 shadow-[0_4px_18px_rgba(94,75,180,0.07)]">
                  <div className="flex items-start gap-3">
                    <span
                      aria-hidden
                      className="size-11 rounded-full bg-[#ece8fb] text-[#6b58e0] font-bold text-sm flex items-center justify-center shrink-0"
                    >
                      {initials(w.name)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[15px] font-extrabold text-[#17112e] truncate">{w.name}</div>
                          <div className="text-xs text-[#7a7494]">{stamp(w.createdAt, lang)}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setToDelete(w)}
                          aria-label={t("wishes.deleteAria", { name: w.name })}
                          className="size-8 -mr-1 -mt-1 rounded-full flex items-center justify-center text-[#7a7494] hover:text-rose-600 hover:bg-rose-50 cursor-pointer focus-visible:outline-2 focus-visible:outline-rose-500"
                        >
                          <Trash2 className="w-[18px] h-[18px]" strokeWidth={1.8} />
                        </button>
                      </div>
                      <p className="mt-2 text-sm text-[#17112e] leading-relaxed whitespace-pre-line break-words">{w.message}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 ${a.cls}`}>
                          <a.Icon className="w-3.5 h-3.5" />
                          {t(a.key)}
                          {w.attendance === "yes" && w.guestCount > 1 ? t("wishes.guests", { n: w.guestCount }) : ""}
                        </span>
                        {invitations.length > 1 && (
                          <span className="rounded-full bg-[#f1edff] text-[#5b49c9] px-2.5 py-1 truncate max-w-[12rem]">
                            {titleOf(w.invitationId)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {!loading && !error && list.length > PAGE_SIZE && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="h-10 px-6 rounded-full bg-[#e9e4fb] hover:bg-[#e0daf8] text-sm font-bold text-[#5b49c9] cursor-pointer"
            >
              {showAll ? t("wishes.showLess") : t("wishes.showAll", { n: list.length })}
            </button>
          </div>
        )}
      </div>

      {toDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hapus-ucapan-judul"
          onClick={() => !deleting && setToDelete(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-neutral-100 overflow-hidden p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="size-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 id="hapus-ucapan-judul" className="text-base font-extrabold text-neutral-900 tracking-tight">
              {t("wishes.deleteTitle")}
            </h3>
            <p className="text-xs text-neutral-500 font-medium mt-1 leading-relaxed">
              {t("wishes.deletePrefix")} <b>{toDelete.name}</b> {t("wishes.deleteSuffix")}
            </p>
            <div className="grid grid-cols-2 gap-2 mt-5">
              <Button variant="outline" size="sm" onClick={() => setToDelete(null)} disabled={deleting}>
                {t("common.cancel")}
              </Button>
              <Button variant="danger" size="sm" onClick={() => void confirmDelete()} disabled={deleting}>
                {deleting ? t("wishes.deleting") : t("wishes.confirmDelete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UcapanPage;
