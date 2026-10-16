import React, { useState } from "react";
import { PATHS } from "@/routes";
import { LoginCard } from "@/components/auth/LoginCard";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { setDashAuthenticated } from "@/lib/cache";
import { SITE } from "@/config/site";

export interface DashLoginPageProps {
  currentPath?: string;
  onNavigate: (path: string) => void;
}

export const DashLoginPage: React.FC<DashLoginPageProps> = ({
  onNavigate,
}) => {

  const handleSuccessfulLogin = () => {
    // Simpan status autentikasi admin ke cache
    setDashAuthenticated(true);

    // Cek apakah host adalah domain mandiri dash (dash.satucerita.id)
    const isStandaloneDash =
      typeof window !== "undefined" &&
      window.location.hostname.startsWith("dash.");

    // Arahkan ke menu utama / overview dash
    if (isStandaloneDash) {
      onNavigate("/overview");
    } else {
      onNavigate(PATHS.dash);
    }
  };

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
    <div className="min-h-screen w-full flex flex-col justify-between bg-gradient-to-b from-[#5c49dc] via-[#7460ee] to-[#ad9fff] relative select-none overflow-y-auto">
      {/* 
        HEADER ATAS (Mobile & Desktop):
        - Pojok kiri atas: Logo SatuCerita + Nama Website Satu Cerita
        - Pojok kanan atas: Switch Bahasa (ID, EN)
      */}
      <header className="w-full relative z-30 p-4 sm:p-6 flex items-center justify-between">
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
      <div className="flex-1 w-full flex flex-col justify-end md:justify-center md:items-center relative z-20 md:p-6 md:pb-12">
        <div className="w-full md:max-w-md md:mx-auto">
          <LoginCard
            onLogin={handleSuccessfulLogin}
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
