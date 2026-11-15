import React, { useEffect, useRef, useState } from "react";
import { MessageCircle, RotateCcw, Settings2, Trash2 } from "lucide-react";
import { getCache, setCache } from "@/lib/cache";
import { useT } from "@/i18n";

interface Guest {
  id: string;
  name: string;
  shared: boolean;
}

interface BlastData {
  guests: Guest[];
  /** Teks pesan buatan user. Kosong = pakai teks bawaan sesuai bahasa. */
  template?: string;
}

export interface WhatsappBlastProps {
  /** Kunci penyimpanan daftar tamu (id undangan; cadangan: slug). */
  storageId: string;
  /** Tautan publik undangan (tanpa nama tamu). */
  link: string;
}

const SI_WA = "https://cdn.jsdelivr.net/npm/simple-icons@16.37.0/icons/whatsapp.svg";
const keyOf = (id: string) => `satucerita_blast_${id}`;
const newId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);

const WaIcon: React.FC = () => {
  const [broken, setBroken] = useState(false);
  if (broken) return <MessageCircle className="size-[18px] text-white" aria-hidden />;
  return (
    <img
      src={SI_WA}
      alt=""
      width={18}
      height={18}
      loading="lazy"
      referrerPolicy="no-referrer"
      className="size-[18px] brightness-0 invert"
      onError={() => setBroken(true)}
    />
  );
};

/**
 * WhatsApp Blast: daftar tamu (nama + status + tombol bagikan).
 * User cukup mengetik nama lalu Enter; baris baru muncul otomatis. Tombol WhatsApp membuka WhatsApp
 * (user memilih penerima) dengan pesan berisi nama tamu dan tautan undangan ber-query `?to=<nama>`,
 * lalu status berubah menjadi "Dibagikan". Data disimpan di browser ini (localStorage) per undangan.
 */
export const WhatsappBlast: React.FC<WhatsappBlastProps> = ({ storageId, link }) => {
  const { t } = useT();
  const [data, setData] = useState<BlastData>(() => getCache<BlastData>(keyOf(storageId), { guests: [] }));
  const [draft, setDraft] = useState("");
  const [showText, setShowText] = useState(false);
  const draftRef = useRef<HTMLInputElement>(null);

  // Ganti undangan -> muat daftar tamu undangan itu.
  useEffect(() => {
    setData(getCache<BlastData>(keyOf(storageId), { guests: [] }));
    setDraft("");
  }, [storageId]);

  const save = (next: BlastData) => {
    setData(next);
    setCache(keyOf(storageId), next);
  };

  const defaultText = t("blast.defaultText");
  const template = data.template ?? defaultText;

  const guestLink = (name: string) => `${link}${link.includes("?") ? "&" : "?"}to=${encodeURIComponent(name)}`;
  const buildMessage = (name: string) => {
    const url = guestLink(name);
    const hasLink = /\{link\}/i.test(template);
    const body = template.replace(/\{(?:nama|name)\}/gi, name).replace(/\{link\}/gi, url);
    // Tautan wajib ikut terkirim walau user menghapus {link} dari teks.
    return hasLink ? body : `${body}\n${url}`;
  };

  const addGuest = () => {
    const name = draft.trim();
    if (!name) return;
    save({ ...data, guests: [...data.guests, { id: newId(), name, shared: false }] });
    setDraft("");
  };

  const patchGuest = (id: string, patch: Partial<Guest>) =>
    save({ ...data, guests: data.guests.map((g) => (g.id === id ? { ...g, ...patch } : g)) });
  const removeGuest = (id: string) => save({ ...data, guests: data.guests.filter((g) => g.id !== id) });

  const share = (g: Guest) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(buildMessage(g.name))}`, "_blank", "noopener,noreferrer");
    if (!g.shared) patchGuest(g.id, { shared: true });
  };

  const done = data.guests.filter((g) => g.shared).length;
  const sample = data.guests[0]?.name || t("blast.sampleName");

  const inputCls =
    "w-full h-10 px-2.5 rounded-lg bg-transparent text-sm font-semibold text-[#17112e] placeholder:font-normal placeholder:text-[#a39cc4] outline-none focus:bg-[#f4f1ff] select-text";

  return (
    <section className="rounded-3xl bg-white p-5 shadow-[0_6px_24px_rgba(94,75,180,0.08)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-[#17112e]">{t("blast.heading")}</h2>
          <p className="mt-1 text-xs text-[#5a5476] leading-relaxed">{t("blast.desc")}</p>
        </div>
        <button
          type="button"
          onClick={() => setShowText((v) => !v)}
          aria-expanded={showText}
          className="shrink-0 h-9 px-3 rounded-full border border-[#d4ccf5] text-[#5b49c9] text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer hover:bg-[#f4f1ff]"
        >
          <Settings2 className="w-3.5 h-3.5" />
          {t("blast.editText")}
        </button>
      </div>

      {showText && (
        <div className="mt-3 rounded-2xl bg-[#f4f1ff] p-3">
          <label htmlFor="blast-text" className="text-xs font-bold text-[#17112e]">
            {t("blast.textLabel")}
          </label>
          <textarea
            id="blast-text"
            value={template}
            onChange={(e) => save({ ...data, template: e.target.value })}
            rows={5}
            className="mt-1.5 w-full rounded-xl border border-[#d4ccf5] bg-white p-3 text-sm text-[#17112e] leading-relaxed outline-none focus:border-[#7d6aee] select-text resize-y"
          />
          <p className="mt-1.5 text-[11px] text-[#5a5476] leading-relaxed">{t("blast.textHint")}</p>
          <div className="mt-2 rounded-xl bg-white border border-[#e5e0f5] p-3">
            <div className="text-[11px] font-bold text-[#7a7494] mb-1">{t("blast.preview")}</div>
            <p className="text-xs text-[#17112e] whitespace-pre-line break-words">{buildMessage(sample)}</p>
          </div>
          {data.template !== undefined && (
            <button
              type="button"
              onClick={() => save({ ...data, template: undefined })}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-[#5b49c9] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              {t("blast.resetText")}
            </button>
          )}
        </div>
      )}

      {data.guests.length > 0 && (
        <p className="mt-4 text-xs font-semibold text-[#5a5476]">
          {t("blast.progress", { done, total: data.guests.length })}
        </p>
      )}

      <div className="mt-2 -mx-2 overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-0">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-[#7a7494]">
              <th className="px-2.5 py-2 font-bold">{t("blast.col.name")}</th>
              <th className="px-2 py-2 font-bold">{t("blast.col.status")}</th>
              <th className="px-2 py-2 font-bold text-center">{t("blast.col.share")}</th>
            </tr>
          </thead>
          <tbody>
            {data.guests.map((g) => (
              <tr key={g.id} className="group">
                <td className="border-t border-[#efeafb] py-1 pr-1">
                  <div className="flex items-center">
                    <input
                      value={g.name}
                      maxLength={60}
                      aria-label={t("blast.col.name")}
                      enterKeyHint="next"
                      onChange={(e) => patchGuest(g.id, { name: e.target.value })}
                      onBlur={() => {
                        if (!g.name.trim()) removeGuest(g.id);
                        else if (g.name !== g.name.trim()) patchGuest(g.id, { name: g.name.trim() });
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                          e.preventDefault();
                          draftRef.current?.focus();
                        }
                      }}
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() => removeGuest(g.id)}
                      aria-label={t("blast.remove", { name: g.name })}
                      title={t("blast.remove", { name: g.name })}
                      className="shrink-0 size-8 rounded-lg text-[#a39cc4] hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
                <td className="border-t border-[#efeafb] px-2 py-1">
                  <button
                    type="button"
                    onClick={() => patchGuest(g.id, { shared: !g.shared })}
                    title={t("blast.toggleStatus")}
                    className={`whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold cursor-pointer ${
                      g.shared ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {g.shared ? t("blast.status.shared") : t("blast.status.pending")}
                  </button>
                </td>
                <td className="border-t border-[#efeafb] px-2 py-1 text-center">
                  <button
                    type="button"
                    onClick={() => share(g)}
                    aria-label={t("blast.shareTo", { name: g.name })}
                    title={t("blast.shareTo", { name: g.name })}
                    className="size-9 rounded-full bg-[#25D366] hover:bg-[#20ba5a] active:scale-95 inline-flex items-center justify-center cursor-pointer"
                  >
                    <WaIcon />
                  </button>
                </td>
              </tr>
            ))}

            {/* Baris input: ketik nama lalu Enter -> tersimpan, baris baru muncul dan fokus kembali ke sini. */}
            <tr>
              <td className="border-t border-[#efeafb] py-1 pr-1">
                <input
                  ref={draftRef}
                  value={draft}
                  maxLength={60}
                  placeholder={t("blast.placeholder")}
                  aria-label={t("blast.placeholder")}
                  enterKeyHint="next"
                  autoComplete="off"
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={addGuest}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
                      e.preventDefault();
                      addGuest();
                    }
                  }}
                  className={inputCls}
                />
              </td>
              <td className="border-t border-[#efeafb] px-2 py-1">
                <span className="whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold bg-[#f1edff] text-[#a39cc4]">
                  {t("blast.status.pending")}
                </span>
              </td>
              <td className="border-t border-[#efeafb] px-2 py-1 text-center">
                <span className="size-9 rounded-full bg-[#25D366]/40 inline-flex items-center justify-center" aria-hidden>
                  <WaIcon />
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-[11px] text-[#7a7494] leading-relaxed">{t("blast.hint")}</p>
    </section>
  );
};

export default WhatsappBlast;
