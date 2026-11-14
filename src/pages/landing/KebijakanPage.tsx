import React, { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { ChevronRight } from "lucide-react";
import { useT } from "@/i18n";
import type { TKey } from "@/i18n";

interface KebijakanPageProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const KebijakanPage: React.FC<KebijakanPageProps> = ({
  currentPath = "/kebijakan",
  onNavigate = (_path: string) => {},
}) => {
  const { t } = useT();
  const [activeSection, setActiveSection] = useState<"privasi" | "syarat">("privasi");

  useEffect(() => {
    const handleScroll = () => {
      const syaratElement = document.getElementById("syarat");
      if (syaratElement) {
        const rect = syaratElement.getBoundingClientRect();
        if (rect.top <= 160) {
          setActiveSection("syarat");
          return;
        }
      }
      setActiveSection("privasi");
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent, id: "privasi" | "syarat") => {
    e.preventDefault();
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const topOffset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      window.scrollTo({
        top: elementPosition - topOffset,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9ff] text-neutral-800 flex flex-col antialiased selection:bg-[#7d6aee]/20 selection:text-[#5c49dc]">
      {/* Top Navigation */}
      <Navbar currentPath={currentPath} onNavigate={onNavigate} />

      {/* Main Content */}
      <main id="konten" className="flex-1 bg-[#faf9ff]">
        {/* 
          1. Header Hero Section:
          Warna latar menggunakan warna aksen persis (#7d6aee),
          Teks berwarna putih, dan badge putih dengan teks ungu.
        */}
        <section className="relative overflow-hidden bg-[#7d6aee] py-14 sm:py-20 md:py-24 select-none shadow-xs">
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex max-w-3xl flex-col gap-3.5 sm:gap-4 items-start text-left">
              {/* Badge: Legal */}
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white text-[#7d6aee] text-xs sm:text-sm font-bold tracking-wider uppercase shadow-xs">
                {t("policy.badge")}
              </span>

              {/* H1 Title: Teks putih */}
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-[1.12]">
                {t("policy.title")}
              </h1>

              {/* Subtitle Terakhir Diperbarui: Teks putih, diperbesar 2px menjadi 20px */}
              <p className="max-w-2xl text-base sm:text-lg md:text-[20px] md:leading-relaxed text-white/90 font-medium">
                {t("policy.updated")}
              </p>
            </div>
          </div>
        </section>

        {/* 
          2. Content Section:
          Warna latar halaman polosan mengikuti app SatuCerita (bg-[#faf9ff]).
          2 Kolom di Desktop (Daftar Isi Sticky di Kiri, Konten di Kanan)
        */}
        <div className="mx-auto grid max-w-6xl gap-8 lg:gap-12 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[14rem_1fr] lg:px-8">
          {/* Sisi Kiri: Daftar Isi Sticky (Tanpa Ikon) */}
          <nav aria-label={t("policy.tocLabel")} className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-neutral-400 mb-3 sm:mb-4">
              {t("policy.tocLabel")}
            </p>
            <ul className="grid gap-2 sm:gap-2.5">
              <li>
                <a
                  href="#privasi"
                  onClick={(e) => scrollToSection(e, "privasi")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                    activeSection === "privasi"
                      ? "bg-[#7d6aee] text-white shadow-[0_2px_8px_rgba(125,106,238,0.25)]"
                      : "bg-white text-neutral-700 hover:text-[#7d6aee] hover:bg-purple-50/50 border border-purple-100 shadow-2xs"
                  }`}
                >
                  <span>{t("policy.privacy")}</span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      activeSection === "privasi" ? "translate-x-0.5" : "opacity-40"
                    }`}
                  />
                </a>
              </li>
              <li>
                <a
                  href="#syarat"
                  onClick={(e) => scrollToSection(e, "syarat")}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer ${
                    activeSection === "syarat"
                      ? "bg-[#7d6aee] text-white shadow-[0_2px_8px_rgba(125,106,238,0.25)]"
                      : "bg-white text-neutral-700 hover:text-[#7d6aee] hover:bg-purple-50/50 border border-purple-100 shadow-2xs"
                  }`}
                >
                  <span>{t("policy.terms")}</span>
                  <ChevronRight
                    className={`w-4 h-4 transition-transform ${
                      activeSection === "syarat" ? "translate-x-0.5" : "opacity-40"
                    }`}
                  />
                </a>
              </li>
            </ul>
          </nav>

          {/* Sisi Kanan: Konten Utama */}
          <div className="grid gap-10 sm:gap-12">
            {/* 
              1. Bagian Kebijakan Privasi:
              - Judul berlatar lebih ungu dibanding item di bawahnya (#7d6aee).
              - Tanpa ikon.
              - Nomor item tanpa badge pembungkus.
              - Tanpa garis separator antar item.
            */}
            <section
              id="privasi"
              aria-labelledby="privasi-judul"
              className="bg-white rounded-2xl sm:rounded-3xl border border-purple-100 shadow-[0_4px_20px_rgba(125,106,238,0.06)] overflow-hidden scroll-mt-24 transition-all"
            >
              {/* Judul: Latar lebih ungu (#7d6aee), tanpa ikon */}
              <div className="bg-[#7d6aee] text-white px-6 py-5 sm:px-8 sm:py-6">
                <h2
                  id="privasi-judul"
                  className="text-xl sm:text-2xl font-black text-white tracking-tight"
                >
                  {t("policy.privacy")}
                </h2>
              </div>

              {/* Item-item di bawahnya: Tanpa separator, nomor tanpa badge */}
              <ol className="grid gap-6 sm:gap-7 p-6 sm:p-8">
                {/* 01 */}
                <li>
                  <h3 className="flex items-baseline gap-2.5 text-base sm:text-lg font-bold text-neutral-900">
                    <span aria-hidden="true" className="text-sm sm:text-base font-bold text-neutral-400 shrink-0">
                      01
                    </span>
                    {t("policy.p.1.title")}
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-sm sm:text-base leading-relaxed text-neutral-600 pl-7">
                    {t("policy.p.1.body")}
                  </p>
                </li>

                {/* 02 */}
                <li>
                  <h3 className="flex items-baseline gap-2.5 text-base sm:text-lg font-bold text-neutral-900">
                    <span aria-hidden="true" className="text-sm sm:text-base font-bold text-neutral-400 shrink-0">
                      02
                    </span>
                    {t("policy.p.2.title")}
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-sm sm:text-base leading-relaxed text-neutral-600 pl-7">
                    {t("policy.p.2.body")}
                  </p>
                </li>

                {/* 03 */}
                <li>
                  <h3 className="flex items-baseline gap-2.5 text-base sm:text-lg font-bold text-neutral-900">
                    <span aria-hidden="true" className="text-sm sm:text-base font-bold text-neutral-400 shrink-0">
                      03
                    </span>
                    {t("policy.p.3.title")}
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-sm sm:text-base leading-relaxed text-neutral-600 pl-7">
                    {t("policy.p.3.body")}
                  </p>
                </li>

                {/* 04 */}
                <li>
                  <h3 className="flex items-baseline gap-2.5 text-base sm:text-lg font-bold text-neutral-900">
                    <span aria-hidden="true" className="text-sm sm:text-base font-bold text-neutral-400 shrink-0">
                      04
                    </span>
                    {t("policy.p.4.title")}
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-sm sm:text-base leading-relaxed text-neutral-600 pl-7">
                    {t("policy.p.4.body")}
                  </p>
                </li>

                {/* 05 */}
                <li>
                  <h3 className="flex items-baseline gap-2.5 text-base sm:text-lg font-bold text-neutral-900">
                    <span aria-hidden="true" className="text-sm sm:text-base font-bold text-neutral-400 shrink-0">
                      05
                    </span>
                    {t("policy.p.5.title")}
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-sm sm:text-base leading-relaxed text-neutral-600 pl-7">
                    {t("policy.p.5.body")}
                  </p>
                </li>

                {/* 06 */}
                <li>
                  <h3 className="flex items-baseline gap-2.5 text-base sm:text-lg font-bold text-neutral-900">
                    <span aria-hidden="true" className="text-sm sm:text-base font-bold text-neutral-400 shrink-0">
                      06
                    </span>
                    {t("policy.p.6.title")}
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-sm sm:text-base leading-relaxed text-neutral-600 pl-7">
                    {t("policy.p.6.body")}
                  </p>
                </li>
              </ol>
            </section>

            {/* 
              2. Bagian Syarat & Ketentuan:
              - Judul berlatar lebih ungu dibanding item di bawahnya (#7d6aee).
              - Tanpa ikon.
              - Nomor item tanpa badge pembungkus.
              - Tanpa garis separator antar item.
            */}
            <section
              id="syarat"
              aria-labelledby="syarat-judul"
              className="bg-white rounded-2xl sm:rounded-3xl border border-purple-100 shadow-[0_4px_20px_rgba(125,106,238,0.06)] overflow-hidden scroll-mt-24 transition-all"
            >
              {/* Judul: Latar lebih ungu (#7d6aee), tanpa ikon */}
              <div className="bg-[#7d6aee] text-white px-6 py-5 sm:px-8 sm:py-6">
                <h2
                  id="syarat-judul"
                  className="text-xl sm:text-2xl font-black text-white tracking-tight"
                >
                  {t("policy.terms")}
                </h2>
              </div>

              {/* Item-item di bawahnya: Tanpa separator, nomor tanpa badge */}
              <ol className="grid gap-6 sm:gap-7 p-6 sm:p-8">
                {/* 01 */}
                <li>
                  <h3 className="flex items-baseline gap-2.5 text-base sm:text-lg font-bold text-neutral-900">
                    <span aria-hidden="true" className="text-sm sm:text-base font-bold text-neutral-400 shrink-0">
                      01
                    </span>
                    {t("policy.t.1.title")}
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-sm sm:text-base leading-relaxed text-neutral-600 pl-7">
                    {t("policy.t.1.body")}
                  </p>
                </li>

                {/* 02 */}
                <li>
                  <h3 className="flex items-baseline gap-2.5 text-base sm:text-lg font-bold text-neutral-900">
                    <span aria-hidden="true" className="text-sm sm:text-base font-bold text-neutral-400 shrink-0">
                      02
                    </span>
                    {t("policy.t.2.title")}
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-sm sm:text-base leading-relaxed text-neutral-600 pl-7">
                    {t("policy.t.2.body")}
                  </p>
                </li>

                {/* 03 */}
                <li>
                  <h3 className="flex items-baseline gap-2.5 text-base sm:text-lg font-bold text-neutral-900">
                    <span aria-hidden="true" className="text-sm sm:text-base font-bold text-neutral-400 shrink-0">
                      03
                    </span>
                    {t("policy.t.3.title")}
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-sm sm:text-base leading-relaxed text-neutral-600 pl-7">
                    {t("policy.t.3.body")}
                  </p>
                </li>

                {/* 04 */}
                <li>
                  <h3 className="flex items-baseline gap-2.5 text-base sm:text-lg font-bold text-neutral-900">
                    <span aria-hidden="true" className="text-sm sm:text-base font-bold text-neutral-400 shrink-0">
                      04
                    </span>
                    {t("policy.t.4.title")}
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-sm sm:text-base leading-relaxed text-neutral-600 pl-7">
                    {t("policy.t.4.body")}
                  </p>
                </li>

                {/* 05 */}
                <li>
                  <h3 className="flex items-baseline gap-2.5 text-base sm:text-lg font-bold text-neutral-900">
                    <span aria-hidden="true" className="text-sm sm:text-base font-bold text-neutral-400 shrink-0">
                      05
                    </span>
                    {t("policy.t.5.title")}
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-sm sm:text-base leading-relaxed text-neutral-600 pl-7">
                    {t("policy.t.5.body")}
                  </p>
                </li>

                {/* 06 */}
                <li>
                  <h3 className="flex items-baseline gap-2.5 text-base sm:text-lg font-bold text-neutral-900">
                    <span aria-hidden="true" className="text-sm sm:text-base font-bold text-neutral-400 shrink-0">
                      06
                    </span>
                    {t("policy.t.6.title")}
                  </h3>
                  <p className="mt-1.5 sm:mt-2 text-sm sm:text-base leading-relaxed text-neutral-600 pl-7">
                    {t("policy.t.6.body")}
                  </p>
                </li>
              </ol>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer currentPath={currentPath} onNavigate={onNavigate} />

      {/* Mobile Bottom Navigation */}
      <BottomNav currentPath={currentPath} onNavigate={onNavigate} />
    </div>
  );
};

export default KebijakanPage;
