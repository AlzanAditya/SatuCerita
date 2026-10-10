import React, { createContext, useCallback, useContext, useState } from "react";

export type Language = "id" | "en";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_KEY = "satucerita_lang";

function readStoredLang(): Language {
  if (typeof window === "undefined") return "id";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "id" || saved === "en") return saved;
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
  }, []);

  const toggleLang = useCallback(
    () => setLang(lang === "id" ? "en" : "id"),
    [lang, setLang]
  );

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
