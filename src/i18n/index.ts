import { useCallback, useMemo } from "react";
import { useLanguage, type Language } from "@/context/LanguageContext";
import { commonId } from "./common.id";
import { commonEn } from "./common.en";
import { landingId } from "./landing.id";
import { landingEn } from "./landing.en";
import { studioId } from "./studio.id";
import { studioEn } from "./studio.en";
import { dashId } from "./dash.id";
import { dashEn } from "./dash.en";
import { trPhrase } from "./phrases";

/**
 * Gabungan kamus semua area (common, landing, studio, dash).
 */
const ID = { ...commonId, ...landingId, ...studioId, ...dashId } as const;
const EN: Record<keyof typeof ID, string> = { ...commonEn, ...landingEn, ...studioEn, ...dashEn };

export type TKey = keyof typeof ID;
export type TVars = Record<string, string | number>;
export type TFunc = (key: TKey, vars?: TVars) => string;

const DICTS: Record<Language, Record<string, string>> = { id: ID, en: EN };

function interpolate(text: string, vars?: TVars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
}

/** Terjemahan murni (tanpa React), aman dipakai di luar komponen. */
export function translate(lang: Language, key: TKey, vars?: TVars): string {
  const text = DICTS[lang][key] ?? ID[key] ?? key;
  return interpolate(text, vars);
}

/** Hook utama: `const { t, lang } = useT(); t("nav.home")` */
export function useT() {
  const { lang } = useLanguage();
  const t = useCallback<TFunc>((key, vars) => translate(lang, key, vars), [lang]);
  /** Terjemahkan teks Indonesia dari luar komponen (label editor, pesan error server, dll). */
  const tr = useCallback((text: string | undefined | null) => trPhrase(lang, text ?? ""), [lang]);
  /** Jumlah satu/banyak: `tn("dash.n.orders", 3)` memakai key `dash.n.orders.one` / `.other`. */
  const tn = useCallback(
    (base: string, n: number, vars?: TVars) =>
      translate(lang, `${base}.${n === 1 ? "one" : "other"}` as TKey, { n, ...vars }),
    [lang]
  );
  return useMemo(() => ({ t, tr, tn, lang }), [t, tr, tn, lang]);
}

/** Locale BCP-47 untuk format angka/tanggal. */
export const localeOf = (lang: Language) => (lang === "en" ? "en-US" : "id-ID");

/** Format Rupiah mengikuti bahasa: "Rp 99.000" (id) / "Rp 99,000" (en). */
export function formatRupiahLang(val: number, lang: Language): string {
  return "Rp " + val.toLocaleString(localeOf(lang));
}

/** Tanggal pendek WIB, mis. "24 Sep 2026" (id) / "Sep 24, 2026" (en). */
const MONTHS: Record<Language, string[]> = {
  id: ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
};

function wib(iso: string): Date | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getTime() + 7 * 3600_000);
}

export function formatShortDate(iso: string, lang: Language): string {
  const w = wib(iso);
  if (!w) return iso;
  const day = w.getUTCDate();
  const mon = MONTHS[lang][w.getUTCMonth()];
  const year = w.getUTCFullYear();
  return lang === "en" ? `${mon} ${day}, ${year}` : `${day} ${mon} ${year}`;
}

/** Tanggal + jam WIB. id: "24 Sep 2026, 14.30 WIB" / en: "Sep 24, 2026, 14:30 WIB". */
export function formatDateTimeWib(iso: string, lang: Language): string {
  const w = wib(iso);
  if (!w) return iso;
  const p = (n: number) => String(n).padStart(2, "0");
  const sep = lang === "en" ? ":" : ".";
  return `${formatShortDate(iso, lang)}, ${p(w.getUTCHours())}${sep}${p(w.getUTCMinutes())} WIB`;
}

/** Nama bulan & hari singkat/panjang mengikuti bahasa (untuk label grafik dan judul periode). */
const MONTHS_LONG: Record<Language, string[]> = {
  id: ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"],
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
};
const WEEKDAYS_SHORT: Record<Language, string[]> = {
  id: ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
};
export const monthsShort = (lang: Language) => MONTHS[lang];
export const monthsLong = (lang: Language) => MONTHS_LONG[lang];
export const weekdaysShort = (lang: Language) => WEEKDAYS_SHORT[lang];
