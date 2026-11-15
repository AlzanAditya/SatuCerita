import React, { useEffect, useMemo, useState } from "react";
import { Link2, MoreHorizontal } from "lucide-react";
import { PATHS } from "@/routes";
import { SITE } from "@/config/site";
import { isDemo } from "@/lib/studioDemo";
import { TEMPLATES_DATA } from "@/data/templates";
import { listInvitations, type InvitationSummary } from "@/lib/invitationApi";
import { STUDIO_KEYS, isStudioFresh, peekStudio } from "@/lib/studioCache";
import { WhatsappBlast } from "./WhatsappBlast";
import { StudioPageHeader } from "@/components/studio/StudioPageHeader";
import { useT } from "@/i18n";
import { OrderItem, UserInvitation } from "./types";

export interface BagikanPageProps {
  invitations?: UserInvitation[];
  orders?: OrderItem[];
  onNavigate?: (path: string) => void;
  showToast?: (msg: string) => void;
}

/** Ilustrasi ponsel + ikon bagikan (SVG inline, warna mengikuti merek). */
const ShareIllustration: React.FC = () => {
  const { t } = useT();
  return (
  <svg viewBox="0 0 320 190" className="w-full h-auto" role="img" aria-label={t("share.illustrationAria")}>
    <path d="M30 120c-8-38 18-70 62-76 30-4 44 12 76 6 40-8 74 2 92 36 14 28-2 60-40 70-50 12-120 14-150 4-24-8-34-22-40-40z" fill="#e4defa" />
    <circle cx="48" cy="70" r="14" fill="#ece8fb" />
    <circle cx="276" cy="58" r="8" fill="#ece8fb" />
    <g transform="rotate(-6 160 100)">
      <rect x="112" y="14" width="96" height="170" rx="16" fill="#fff" stroke="#17112e" strokeWidth="3.5" />
      <rect x="146" y="20" width="28" height="5" rx="2.5" fill="#17112e" />
      <rect x="120" y="32" width="80" height="140" rx="8" fill="#f1edff" />
      <g stroke="#7d6aee" strokeWidth="3" strokeLinecap="round" fill="none">
        <circle cx="178" cy="96" r="7" fill="#fff" />
        <circle cx="146" cy="82" r="7" fill="#fff" />
        <circle cx="146" cy="112" r="7" fill="#fff" />
        <path d="M152 85l20 9M152 109l20-9" />
      </g>
    </g>
    <g stroke="#17112e" strokeWidth="3" strokeLinecap="round">
      <path d="M232 52l12-10M238 70l16-2M232 88l12 8" />
    </g>
  </svg>
  );
};

/** Ikon resmi merek dari Simple Icons (CDN jsDelivr, versi dikunci). Glyph hitam diputihkan lewat filter CSS. */
const SI = "https://cdn.jsdelivr.net/npm/simple-icons@16.37.0/icons";

const BrandIcon: React.FC<{ name: "whatsapp" | "instagram"; bg: string }> = ({ name, bg }) => (
  <span className={`size-12 rounded-full flex items-center justify-center ${bg}`}>
    <img
      src={`${SI}/${name}.svg`}
      alt=""
      width={26}
      height={26}
      loading="lazy"
      referrerPolicy="no-referrer"
      className="size-[26px] brightness-0 invert"
      onError={(e) => (e.currentTarget.style.visibility = "hidden")}
    />
  </span>
);

const TelegramIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" className="w-7 h-7" aria-hidden>
    <path fill="#fff" d="M18.6 5.4 3.9 11.1c-1 .4-1 1 0 1.3l3.8 1.2 1.5 4.6c.2.5.1.7.6.7.4 0 .6-.2.8-.4l1.9-1.9 3.9 2.9c.7.4 1.2.2 1.4-.7l2.6-12.2c.3-1.1-.4-1.6-1.3-1.2zM9 13.5l8.3-5.2c.4-.2.8-.1.5.2l-6.9 6.2-.3 3z" />
  </svg>
);

export const BagikanPage: React.FC<BagikanPageProps> = ({ invitations = [], orders = [], onNavigate, showToast }) => {
  const { t } = useT();
  // Semua undangan milik user (satu pesanan lunas = satu undangan). Pilih salah satu untuk dibagikan.
  const cached = isDemo() ? undefined : peekStudio<InvitationSummary[]>(STUDIO_KEYS.invitations);
  const [mine, setMine] = useState<InvitationSummary[]>(cached ?? []);
  const [selectedId, setSelectedId] = useState<string>(cached?.[0]?.id ?? "");

  useEffect(() => {
    if (isDemo()) return;
    if (isStudioFresh(STUDIO_KEYS.invitations)) return;
    let off = false;
    listInvitations().then((r) => {
      if (off || !r.ok || !Array.isArray(r.data.invitations)) return;
      setMine(r.data.invitations);
      setSelectedId((cur) => cur || r.data.invitations[0]?.id || "");
    });
    return () => { off = true; };
  }, []);

  const selected = mine.find((i) => i.id === selectedId) ?? mine[0];
  const labelOf = (i: InvitationSummary) =>
    i.title?.trim() || TEMPLATES_DATA.find((x) => x.slug === i.templateSlug)?.title || t("inv.defaultTitle");

  const slug = useMemo(() => {
    if (selected) return selected.slug;
    const fromInv = invitations[0]?.slug;
    if (fromInv) return fromInv;
    const paid = orders.find((o) => o.status === "paid" && o.slug);
    if (paid) return paid.slug;
    return isDemo() ? "alya-dimas" : "";
  }, [selected, invitations, orders]);

  const link = selected?.publicUrl || (slug ? `${SITE.url}/i/${slug}/` : "");
  const notPublished = !!selected && selected.status !== "published";
  const text = t("share.text", { link });

  const copy = async (msg = "Tautan disalin!") => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      showToast?.(msg);
    } catch {
      showToast?.("Tidak bisa menyalin otomatis. Salin tautan secara manual.");
    }
  };

  const open = (url: string) => window.open(url, "_blank", "noopener,noreferrer");

  const more = async () => {
    if (!link) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: t("share.shareTitle"), text, url: link });
        return;
      } catch {
        /* dibatalkan pengguna */
        return;
      }
    }
    copy();
  };

  const apps: { id: string; label: string; onClick: () => void; icon: React.ReactNode }[] = [
    {
      id: "wa",
      label: "WhatsApp",
      onClick: () => open(`https://wa.me/?text=${encodeURIComponent(text)}`),
      icon: <BrandIcon name="whatsapp" bg="bg-[#25D366]" />,
    },
    {
      id: "tg",
      label: "Telegram",
      onClick: () => open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(t("share.tgText"))}`),
      icon: (
        <span className="size-12 rounded-full bg-[#2aabee] flex items-center justify-center">
          <TelegramIcon />
        </span>
      ),
    },
    {
      id: "ig",
      label: "Instagram",
      // Instagram tidak punya tautan bagikan web: salin tautan lalu buka Instagram.
      onClick: async () => {
        await copy("Tautan disalin. Tempel di Instagram.");
        open("https://www.instagram.com/");
      },
      icon: <BrandIcon name="instagram" bg="bg-gradient-to-tr from-[#FEDA75] via-[#D62976] to-[#4F5BD5]" />,
    },
    {
      id: "more",
      label: t("share.more"),
      onClick: more,
      icon: (
        <span className="size-12 rounded-full bg-[#f1edff] flex items-center justify-center text-[#5a5476]">
          <MoreHorizontal className="w-6 h-6" />
        </span>
      ),
    },
  ];

  return (
    <div className="animate-fadeIn">
      <StudioPageHeader
        title={t("studio.title.share")}
        subtitle={t("share.subtitle")}
        onLogoClick={() => onNavigate?.(PATHS.home)}
      />

      <div className="max-w-md mx-auto md:mx-0">
        <div className="px-4">
          <ShareIllustration />
        </div>

        <section className="-mt-3 rounded-3xl bg-white p-5 shadow-[0_6px_24px_rgba(94,75,180,0.08)] text-center">
          <h2 className="text-base font-extrabold text-[#17112e]">{t("share.heading")}</h2>

          {link ? (
            <>
              <p className="mt-2 text-sm text-[#5a5476] leading-relaxed">
                {t("share.desc")}
              </p>

              {mine.length > 1 && (
                <div className="mt-3 flex flex-wrap justify-center gap-2" role="radiogroup" aria-label={t("share.pickInvitation")}>
                  {mine.map((i) => {
                    const on = i.id === selected?.id;
                    return (
                      <button
                        key={i.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        onClick={() => setSelectedId(i.id)}
                        className={`px-3.5 h-9 rounded-full text-sm font-bold border cursor-pointer max-w-full truncate ${
                          on ? "bg-[#7d6aee] border-[#7d6aee] text-white" : "bg-white border-[#d4ccf5] text-[#5b49c9]"
                        }`}
                      >
                        {labelOf(i)}
                      </button>
                    );
                  })}
                </div>
              )}

              {notPublished && (
                <p className="mt-3 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-800">
                  {t("share.notPublished")}
                </p>
              )}

              <button
                type="button"
                onClick={() => copy()}
                className="mt-4 w-full h-12 rounded-full bg-[#7d6aee] hover:bg-[#6b58e0] active:scale-[0.99] text-white font-bold text-[15px] inline-flex items-center justify-center gap-2 shadow-[0_6px_16px_rgba(125,106,238,0.35)] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d6aee]"
              >
                <Link2 className="w-4 h-4" />
                {t("share.copyLink")}
              </button>
              <p className="mt-2 text-xs text-[#7a7494] truncate" title={link}>
                {link.replace(/^https?:\/\//, "")}
              </p>

              <div className="mt-4 flex items-center gap-3 text-xs text-[#7a7494]">
                <span className="flex-1 h-px bg-[#e5e0f5]" />
                {t("share.or")}
                <span className="flex-1 h-px bg-[#e5e0f5]" />
              </div>

              <ul className="mt-4 grid grid-cols-4 gap-2">
                {apps.map((a) => (
                  <li key={a.id}>
                    <button
                      type="button"
                      onClick={a.onClick}
                      className="w-full flex flex-col items-center gap-1.5 cursor-pointer rounded-xl py-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7d6aee]"
                    >
                      {a.icon}
                      <span className="text-[11px] text-[#5a5476]">{a.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <>
              <p className="mt-2 text-sm text-[#5a5476] leading-relaxed">
                {t("share.noLink")}
              </p>
              <button
                type="button"
                onClick={() => onNavigate?.(PATHS.katalog)}
                className="mt-4 w-full h-12 rounded-full bg-[#7d6aee] hover:bg-[#6b58e0] text-white font-bold text-[15px] cursor-pointer shadow-[0_6px_16px_rgba(125,106,238,0.35)]"
              >
                {t("inv.pickTemplate")}
              </button>
            </>
          )}
        </section>
      </div>

      {/* WhatsApp Blast: daftar tamu + tombol bagikan per tamu */}
      {link && (
        <div className="max-w-2xl mx-auto md:mx-0 mt-5">
          <WhatsappBlast storageId={selected?.id || slug} link={link} />
        </div>
      )}
    </div>
  );
};

export default BagikanPage;
