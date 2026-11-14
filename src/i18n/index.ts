import { useCallback, useMemo } from "react";
import { useLanguage, type Language } from "@/context/LanguageContext";
import { commonId } from "./common.id";
import { commonEn } from "./common.en";
import { landingId } from "./landing.id";
import { landingEn } from "./landing.en";
import { studioId } from "./studio.id";
import { studioEn } from "./studio.en";

/**
 * Gabungan kamus semua area. Saat step Dash dikerjakan,
 * cukup tambahkan `dashId/dashEn` di sini.
 */
const ID = { ...commonId, ...landingId, ...studioId } as const;
const EN: Record<keyof typeof ID, string> = { ...commonEn, ...landingEn, ...studioEn };

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
  return useMemo(() => ({ t, lang }), [t, lang]);
}

/** Locale BCP-47 untuk format angka/tanggal. */
export const localeOf = (lang: Language) => (lang === "en" ? "en-US" : "id-ID");

/** Format Rupiah mengikuti bahasa: "Rp 99.000" (id) / "Rp 99,000" (en). */
export function formatRupiahLang(val: number, lang: Language): string {
  return "Rp " + val.toLocaleString(localeOf(lang));
}

/**
 * Pesan error dari Worker/API selalu berbahasa Indonesia. Petakan ke key
 * kamus supaya tampil sesuai bahasa aktif; pesan yang tidak dikenal
 * dikembalikan apa adanya.
 */
const API_ERROR_KEYS: Record<string, TKey> = {
  "Tidak dapat terhubung ke server.": "api.err.connect",
  "Email atau kata sandi tidak valid.": "api.err.invalidCreds",
  "Akun ini hanya bisa masuk lewat Google.": "api.err.googleOnly",
  "Email belum dikonfirmasi. Cek kotak masuk Anda.": "api.err.unconfirmed",
  "Email atau kata sandi salah.": "api.err.wrongCreds",
  "Format email tidak valid.": "api.err.emailFormat",
  "Kata sandi minimal 8 karakter.": "api.err.pwMin",
  "Nama lengkap minimal 2 karakter.": "api.err.nameMin",
  "Email ini tidak dapat didaftarkan.": "api.err.emailBlocked",
  "Kata sandi terlalu lemah.": "api.err.weakPw",
  "Pendaftaran gagal. Periksa data Anda lalu coba lagi.": "api.err.signupFailed",
};

export function translateApiError(t: TFunc, message: string | undefined): string {
  if (!message) return t("api.err.generic");
  const key = API_ERROR_KEYS[message];
  return key ? t(key) : message;
}
