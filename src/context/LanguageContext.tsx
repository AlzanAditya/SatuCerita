import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Language = "id" | "en";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "satucerita_lang";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 tahun

const isLang = (v: unknown): v is Language => v === "id" || v === "en";

/**
 * Landing, studio, dan dash berjalan di subdomain berbeda (mis. satucerita.app,
 * studio.satucerita.app). localStorage tidak dibagi antar-subdomain, jadi pilihan
 * bahasa juga disimpan di cookie pada root domain agar ikut terbawa ke semua web.
 * Di localhost / IP, cookie dipasang tanpa atribut domain.
 */
function cookieDomain(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname;
  const isLocal = host === "localhost" || /^[\d.]+$/.test(host) || host.includes(":");
  if (isLocal) return "";
  const parts = host.split(".");
  return parts.length >= 2 ? `; domain=.${parts.slice(-2).join(".")}` : "";
}

function readCookieLang(): Language | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${STORAGE_KEY}=([^;]*)`));
  const v = m ? decodeURIComponent(m[1]) : null;
  return isLang(v) ? v : null;
}

function writeCookieLang(lang: Language) {
  if (typeof document === "undefined") return;
  document.cookie = `${STORAGE_KEY}=${lang}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax${cookieDomain()}`;
}

function readStoredLang(): Language {
  if (typeof window === "undefined") return "id";
  // Cookie dulu (dibagi lintas subdomain), lalu localStorage.
  const fromCookie = readCookieLang();
  if (fromCookie) return fromCookie;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLang(saved)) return saved;
  } catch {
    // localStorage bisa diblokir (mode privat, dll.) -> pakai default.
  }
  return "id";
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [lang, setLangState] = useState<Language>(readStoredLang);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // abaikan
    }
    writeCookieLang(next);
  }, []);

  const toggleLang = useCallback(
    () => setLang(lang === "id" ? "en" : "id"),
    [lang, setLang]
  );

  // Sinkronkan <html lang> agar pembaca layar & penerjemah browser tahu bahasa aktif.
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within a LanguageProvider");
  return ctx;
};
