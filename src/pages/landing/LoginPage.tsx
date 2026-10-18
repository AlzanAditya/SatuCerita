import React, { useEffect, useState } from "react";
import { PATHS } from "@/routes";
import { LoginCard } from "@/components/auth/LoginCard";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { fetchSession, googleLoginUrl, loginWithEmail, signUpWithEmail } from "@/lib/auth";
import { urls } from "@/lib/urls";

const ERRORS: Record<string, string> = {
  oauth_failed: "Login dengan Google gagal. Silakan coba lagi.",
  forbidden: "Akun ini tidak diizinkan.",
};

export interface LoginPageProps {
  currentPath?: string;
  onNavigate: (path: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigate,
  currentPath,
}) => {
  const [isSignUp, setIsSignUp] = useState(
    currentPath?.includes("signup") || false
  );

  const homePath = PATHS.home;
  const [notice, setNotice] = useState<{ type: "error"; text: string } | null>(null);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("error");
    if (code) setNotice({ type: "error", text: ERRORS[code] || "Terjadi kesalahan. Coba lagi." });
    // Sudah login -> langsung ke dashboard user
    fetchSession().then((u) => u && window.location.replace(urls.appHome()));
  }, []);

  useEffect(() => {
    const origOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = origOverflow;
    };
  }, []);

  const handleEmail = async (p: { email: string; password: string; name: string; isSignUp: boolean }) => {
    if (p.isSignUp) {
      const r = await signUpWithEmail(p.email, p.password, p.name);
      if (!r.ok) return { error: r.error };
      return { info: "Pendaftaran berhasil. Cek email Anda untuk konfirmasi, lalu login." };
    }
    const r = await loginWithEmail(p.email, p.password);
    if (!r.ok) return { error: r.error };
    window.location.assign(urls.appHome());
  };
  const kebijakanPath = PATHS.kebijakan;

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full flex flex-col justify-between bg-gradient-to-b from-[#5c49dc] via-[#7460ee] to-[#ad9fff] relative select-none overflow-hidden">
      {/* 
        HEADER ATAS (Mobile & Desktop):
        - Pojok kiri atas: Tombol panah kembali + Logo SatuCerita + Nama Website Satu Cerita
        - Pojok kanan atas: Tombol switch bahasa (ID, EN)
      */}
      <header className="w-full relative z-30 pt-[max(1rem,env(safe-area-inset-top))] px-4 sm:px-6 pb-2 sm:pb-4 flex items-center justify-between shrink-0">
        {/* Kiri Atas: Logo & Nama Website */}
        <div className="flex items-center gap-3">
          <a
            href={homePath}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(homePath);
            }}
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
            <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white drop-shadow-xs">
              Satu Cerita
            </span>
          </a>
        </div>

        {/* Kanan Atas: Switch Bahasa (ID, EN) */}
        <div className="flex items-center">
          <LanguageSwitcher variant="transparent-light" />
        </div>
      </header>

      {/* 
        AREA CARD LOGIN:
        - Di desktop: Card floating di tengah-tengah dengan background ungu tetap terjaga
        - Di mobile: Card berada di bagian bawah dengan lengkungan atas
      */}
      <div className="flex-1 w-full flex flex-col justify-end md:justify-center md:items-center relative z-20 md:p-6 md:pb-12 min-h-0">
        <div className="w-full md:max-w-md md:mx-auto">
          <LoginCard
            onGoogle={() => window.location.assign(googleLoginUrl("app"))}
            onEmailSubmit={handleEmail}
            notice={notice}
            onBackToLanding={() => onNavigate(homePath)}
            isSignUp={isSignUp}
            onToggleSignUp={() => setIsSignUp(!isSignUp)}
            onNavigateToKebijakan={() => onNavigate(kebijakanPath)}
          />
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
