import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import {
  OrnFlower,
  OrnHeart,
  OrnHeartFill,
  OrnLetter,
  OrnMusic,
  OrnRings,
  OrnStar,
  SectionWave,
} from "@/components/landing/SectionDecor";
import { Footer } from "@/components/layout/Footer";
import { BottomNav } from "@/components/layout/BottomNav";
import { PATHS } from "@/routes";
import { useT } from "@/i18n";

interface NotFoundPageProps {
  currentPath?: string;
  onNavigate: (path: string) => void;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  currentPath = "/",
  onNavigate,
}) => {
  const { t } = useT();
  return (
  <div className="min-h-screen bg-[#faf9ff] text-text-primary flex flex-col">
    <Navbar currentPath={currentPath} onNavigate={onNavigate} />

    <main className="relative flex-1 flex flex-col items-center justify-center text-center px-4 py-24 overflow-hidden">
      {/* Ombak gradasi di bawah + ornamen di tepi */}
      <SectionWave className="absolute bottom-0 left-0 w-full h-[100px] sm:h-[180px]" color="#7d6aee" strength={0.09} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 text-[#7d6aee]">
        <OrnStar className="absolute top-[20%] left-[10%] w-6 h-6 opacity-[0.18]" />
        <OrnHeartFill className="absolute bottom-[24%] right-[10%] w-5 h-5 opacity-[0.14]" />
      </div>
      <div className="relative z-10 flex flex-col items-center">
      <p className="text-6xl sm:text-7xl font-black text-[#7d6aee]">404</p>
      <h1 className="mt-4 text-2xl sm:text-3xl font-extrabold tracking-tight">
        {t("notfound.title")}
      </h1>
      <p className="mt-3 max-w-md text-text-secondary font-medium">
        {t("notfound.desc")}
      </p>
      <a
        href={PATHS.home}
        onClick={(e) => {
          e.preventDefault();
          onNavigate(PATHS.home);
        }}
        className="mt-8 inline-flex items-center justify-center px-6 py-3 rounded-xl bg-[#7d6aee] hover:bg-[#6b58e0] text-white font-bold text-sm shadow-sm cursor-pointer"
      >
        {t("notfound.back")}
      </a>
      </div>
    </main>

    <Footer currentPath={currentPath} onNavigate={onNavigate} />
    <BottomNav currentPath={currentPath} onNavigate={onNavigate} />
  </div>
  );
};

export default NotFoundPage;
