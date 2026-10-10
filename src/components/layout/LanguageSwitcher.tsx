import React from "react";
import { useLanguage, type Language } from "@/context/LanguageContext";

export type { Language };

interface LanguageSwitcherProps {
  variant?: "default" | "dark" | "transparent-light";
  className?: string;
  onChange?: (lang: Language) => void;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({
  variant = "default",
  className = "",
  onChange,
}) => {
  const { lang: currentLang, setLang } = useLanguage();

  const handleSelect = (lang: Language) => {
    setLang(lang);
    onChange?.(lang);
  };

  // Variant styling:
  // - "transparent-light": for purple background (login page)
  // - "default": for standard navbar (white/light backdrop)
  const containerStyle =
    variant === "transparent-light"
      ? "bg-black/20 backdrop-blur-md border border-white/20 p-1 rounded-xl shadow-xs"
      : "bg-transparent p-0 border-0 shadow-none";

  const getBtnStyle = (lang: Language) => {
    const isActive = currentLang === lang;
    if (variant === "transparent-light") {
      return isActive
        ? "bg-white text-[#5c49dc] font-extrabold shadow-sm px-2.5 py-1 rounded-lg"
        : "text-white/80 hover:text-white font-semibold px-2.5 py-1 rounded-lg";
    }
    return isActive
      ? "text-[#7d6aee] font-black px-1 py-0.5 bg-transparent shadow-none"
      : "text-neutral-400 hover:text-neutral-600 font-semibold px-1 py-0.5 bg-transparent shadow-none";
  };

  return (
    <div
      role="group"
      aria-label="Pilih Bahasa"
      className={`inline-flex items-center gap-1 select-none ${containerStyle} ${className}`}
    >
      <button
        type="button"
        lang="id"
        aria-pressed={currentLang === "id"}
        aria-label="Bahasa Indonesia"
        onClick={() => handleSelect("id")}
        className={`text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer ${getBtnStyle(
          "id"
        )}`}
      >
        ID
      </button>
      {variant !== "transparent-light" && (
        <span className="text-neutral-300 text-xs font-light select-none">/</span>
      )}
      <button
        type="button"
        lang="en"
        aria-pressed={currentLang === "en"}
        aria-label="English"
        onClick={() => handleSelect("en")}
        className={`text-xs uppercase tracking-wider transition-all duration-150 cursor-pointer ${getBtnStyle(
          "en"
        )}`}
      >
        EN
      </button>
    </div>
  );
};

export default LanguageSwitcher;
