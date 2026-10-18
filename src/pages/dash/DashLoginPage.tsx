import React, { useEffect, useState } from "react";
import { PATHS } from "@/routes";
import { LoginCard } from "@/components/auth/LoginCard";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { fetchSession, googleLoginUrl } from "@/lib/auth";
import { urls } from "@/lib/urls";
import { SITE } from "@/config/site";

export interface DashLoginPageProps {
  currentPath?: string;
  onNavigate: (path: string) => void;
}

export const DashLoginPage: React.FC<DashLoginPageProps> = ({
  onNavigate,
}) => {

  const [notice, setNotice] = useState<{ type: "error"; text: string } | null>(null);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("error");
    if (code === "forbidden")
      setNotice({ type: "error", text: "Akun Google ini tidak diizinkan mengakses dashboard admin." });
    else if (code) setNotice({ type: "error", text: "Login gagal. Silakan coba lagi." });
    // Sudah login sebagai admin -> langsung ke dashboard
    fetchSession().then((u) => u?.role === "admin" && window.location.replace(urls.dashHome()));
  }, []);

  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = origOverflow;
    };
  }, []);

  const handleBackToLanding = () => {
    const isStandaloneDash =
      typeof window !== "undefined" &&
      window.location.hostname.startsWith("dash.");

    if (isStandaloneDash) {
      window.location.href = SITE.url || "https://satucerita.id";
    } else {
      onNavigate(PATHS.home);
    }
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full flex flex-col justify-between bg-gradient-to-b from-[#5c49dc] via-[#7460ee] to-[#ad9fff] relative select-none overflow-hidden">
      {/* 
        HEADER ATAS (Mobile & Desktop):
        - Pojok kiri atas: Logo SatuCerita + Nama Website Satu Cerita
        - Pojok kanan atas: Switch Bahasa (ID, EN)
      */}
      <header className="w-full relative z-30 pt-[max(1rem,env(safe-area-inset-top))] px-4 sm:px-6 pb-2 sm:pb-4 flex items-center justify-between shrink-0">
        {/* Kiri Atas: Logo & Nama Website */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleBackToLanding}
            className="flex items-center gap-2.5 text-white hover:opacity-90 transition-opacity cursor-pointer group"
          >
            <div className="size-9 sm:size-10 rounded-xl overflow-hidden shrink-0 shadow-sm border border-white/20 group-hover:scale-105 transition-transform">
              <img
                src="/logos/satucerita.png"
                alt="Satu Cerita"
                width="40"
                height="40"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white drop-shadow-xs leading-none">
                Satu Cerita
              </span>
              <span className="text-[10px] text-white/80 font-bold uppercase tracking-wider mt-0.5">
                Admin Portal
              </span>
            </div>
          </button>
        </div>

        {/* Kanan Atas: Switch Bahasa (ID, EN) */}
        <div className="flex items-center">
          <LanguageSwitcher variant="transparent-light" />
        </div>
      </header>

      {/* 
        AREA CARD LOGIN:
        Sama persis dengan halaman login landing page,
        namun hideTerms=true (tanpa bagian "Dengan masuk, Anda menyetujui....")
      */}
      <div className="flex-1 w-full flex flex-col justify-end md:justify-center md:items-center relative z-20 md:p-6 md:pb-12 min-h-0">
        <div className="w-full md:max-w-md md:mx-auto">
          <LoginCard
            onGoogle={() => window.location.assign(googleLoginUrl("dash"))}
            notice={notice}
            onBackToLanding={handleBackToLanding}
            googleOnly={true}
            hideTerms={true}
          />
        </div>
      </div>
    </div>
  );
};

export default DashLoginPage;
