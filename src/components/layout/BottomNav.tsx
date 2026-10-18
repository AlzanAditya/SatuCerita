import React, { useState, useEffect } from "react";
import { PATHS } from "@/routes";
import { Home, LayoutGrid, ShoppingBag, MessageCircle, UserRound } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { fetchSession, type SessionUser } from "@/lib/auth";

export interface BottomNavProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
  activeTab?: string;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentPath = "/",
  onNavigate = (_path: string) => {},
  activeTab: propActiveTab,
}) => {
  const { lang } = useLanguage();
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    let alive = true;
    fetchSession().then((u) => {
      if (alive && u) setUser(u);
    });
    return () => {
      alive = false;
    };
  }, []);

  const firstName = user?.name ? user.name.trim().split(/\s+/)[0] || user.name : "";

  const getEffectiveTab = () => {
    if (propActiveTab) return propActiveTab;
    if (currentPath.includes("/login") || currentPath.includes("/signup") || currentPath.includes("/app")) return "login";
    if (currentPath.includes("/katalog")) return "katalog";
    if (currentPath.includes("/cara-pesan") || currentPath.includes("/carapesan")) return "carapesan";
    if (currentPath.includes("/kontak") || currentPath.includes("/contact")) return "kontak";
    return "home";
  };

  const effectiveActiveTab = getEffectiveTab();

  const handleTabClick = (tab: "home" | "katalog" | "carapesan" | "kontak" | "login") => {
    if (tab === "home") {
      onNavigate(PATHS.home);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (tab === "katalog") {
      onNavigate(PATHS.katalog);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (tab === "carapesan") {
      onNavigate(PATHS.caraPesan);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (tab === "kontak") {
      onNavigate(PATHS.kontak);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (tab === "login") {
      if (user) {
        onNavigate(PATHS.appHome);
      } else {
        onNavigate(PATHS.login);
      }
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
  };

  return (
    <>
      {/* Tombol WhatsApp Sticky di Pojok Kanan Bawah (di atas navbar bawah mobile, dan pojok bawah di desktop) */}
      <a
        id="satucerita-sticky-whatsapp-button"
        href="https://wa.me/6285187978443"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Hubungi WhatsApp Satu Cerita"
        title="Hubungi WhatsApp Satu Cerita"
        className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 md:right-8 z-40 w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#25D366] hover:bg-[#20ba5a] border border-[#22bf5c] border-b-[3px] sm:border-b-[4px] border-b-[#126b34] shadow-md hover:shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 group cursor-pointer"
      >
        <MessageCircle className="w-7 h-7 sm:w-8 sm:h-8 text-white shrink-0 group-hover:scale-110 transition-transform" />
      </a>

      {/* Navbar Bawah (Hanya tampil di mobile/tablet, tidak terlihat di tampilan desktop) */}
      <nav
        id="satucerita-bottom-navbar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-neutral-200/90 backdrop-blur-lg shadow-lg select-none"
        aria-label="Satu Cerita Navigation"
      >
      <div className="max-w-md mx-auto grid grid-cols-5 h-16 px-1">
        {/* 1. Beranda */}
        <button
          type="button"
          id="satucerita-bottom-nav-home"
          onClick={() => handleTabClick("home")}
          className={`flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
            effectiveActiveTab === "home"
              ? "text-[#7d6aee] font-bold"
              : "text-text-secondary hover:text-text-primary font-semibold"
          }`}
          aria-label={lang === "id" ? "Beranda" : "Home"}
        >
          <Home className="w-5 h-5" />
          <span className={`text-[11px] leading-tight ${effectiveActiveTab === "home" ? "font-bold text-[#7d6aee]" : "font-semibold"}`}>
            {lang === "id" ? "Beranda" : "Home"}
          </span>
        </button>

        {/* 2. Katalog (icon layout-grid) */}
        <button
          type="button"
          id="satucerita-bottom-nav-katalog"
          onClick={() => handleTabClick("katalog")}
          className={`flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
            effectiveActiveTab === "katalog"
              ? "text-[#7d6aee] font-bold"
              : "text-text-secondary hover:text-text-primary font-semibold"
          }`}
          aria-label={lang === "id" ? "Katalog" : "Catalog"}
        >
          <LayoutGrid className="w-5 h-5" />
          <span className={`text-[11px] leading-tight ${effectiveActiveTab === "katalog" ? "font-bold text-[#7d6aee]" : "font-semibold"}`}>
            {lang === "id" ? "Katalog" : "Catalog"}
          </span>
        </button>

        {/* 3. Cara Pesan (icon shopping-bag) */}
        <button
          type="button"
          id="satucerita-bottom-nav-carapesan"
          onClick={() => handleTabClick("carapesan")}
          className={`flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
            effectiveActiveTab === "carapesan"
              ? "text-[#7d6aee] font-bold"
              : "text-text-secondary hover:text-text-primary font-semibold"
          }`}
          aria-label={lang === "id" ? "Cara Pesan" : "How to Order"}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className={`text-[11px] leading-tight ${effectiveActiveTab === "carapesan" ? "font-bold text-[#7d6aee]" : "font-semibold"}`}>
            {lang === "id" ? "Cara Pesan" : "How to Order"}
          </span>
        </button>

        {/* 4. Kontak (icon message-circle) */}
        <button
          type="button"
          id="satucerita-bottom-nav-kontak"
          onClick={() => handleTabClick("kontak")}
          className={`flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
            effectiveActiveTab === "kontak"
              ? "text-[#7d6aee] font-bold"
              : "text-text-secondary hover:text-text-primary font-semibold"
          }`}
          aria-label={lang === "id" ? "Kontak" : "Contact"}
        >
          <MessageCircle className="w-5 h-5" />
          <span className={`text-[11px] leading-tight ${effectiveActiveTab === "kontak" ? "font-bold text-[#7d6aee]" : "font-semibold"}`}>
            {lang === "id" ? "Kontak" : "Contact"}
          </span>
        </button>

        {/* 5. Masuk / Profil User */}
        <button
          type="button"
          id="satucerita-bottom-nav-login"
          onClick={() => handleTabClick("login")}
          className={`flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
            effectiveActiveTab === "login"
              ? "text-[#7d6aee] font-bold"
              : "text-text-secondary hover:text-text-primary font-semibold"
          }`}
          aria-label={user ? firstName : lang === "id" ? "Masuk" : "Login"}
        >
          {user ? (
            <div className={`size-5 rounded-full overflow-hidden flex items-center justify-center font-bold text-[10px] shrink-0 border ${
              effectiveActiveTab === "login" ? "border-[#7d6aee] ring-1 ring-[#7d6aee]" : "border-neutral-300"
            }`}>
              {user.avatar ? (
                <img src={user.avatar} alt={firstName} className="w-full h-full object-cover" />
              ) : (
                <span className="w-full h-full bg-[#7d6aee] text-white flex items-center justify-center">
                  {firstName.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          ) : (
            <UserRound className="w-5 h-5" />
          )}
          <span className={`text-[11px] leading-tight truncate max-w-[64px] ${effectiveActiveTab === "login" ? "font-bold text-[#7d6aee]" : "font-semibold"}`}>
            {user ? firstName : lang === "id" ? "Masuk" : "Login"}
          </span>
        </button>
      </div>
    </nav>
  </>
);
};

export default BottomNav;
