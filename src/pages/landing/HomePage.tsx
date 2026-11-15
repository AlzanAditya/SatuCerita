import React, { useState } from "react";
import { PATHS } from "@/routes";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import {
  ArrowRight,
  FileEdit,
  ImagePlus,
  Users,
  QrCode,
  LayoutGrid,
  CreditCard,
  SlidersHorizontal,
  Send,
  Eye,
  Plus,
  X,
  MessageCircle,
  Smartphone,
  ExternalLink,
  Music,
  Heart,
  Globe,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Accordion } from "@/components/ui/Accordion";
import { TEMPLATES_DATA, type TemplateItemData } from "@/data/templates";
import { useT, formatRupiahLang, type TKey } from "@/i18n";

interface HomePageProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

type TemplateItem = Pick<
  TemplateItemData,
  "id" | "title" | "category" | "originalPrice" | "discountPrice" | "badge" | "discountBadge" | "frameBg" | "image" | "coupleName" | "date"
>;

// Satu sumber kebenaran: sama dengan katalog (src/data/templates.ts), yaitu template yang ada di src/templates/.
const HOME_TEMPLATES: TemplateItem[] = TEMPLATES_DATA;

// Kartu hero hanya memakai cover template (tengah, kiri, kanan); diulang jika template kurang dari 3.
const heroCovers = [0, 1, 2].map((i) => TEMPLATES_DATA[i % TEMPLATES_DATA.length]);

const FAQ_COUNT = 5;

export const HomePage: React.FC<HomePageProps> = ({
  currentPath = "/",
  onNavigate = (_path: string) => { },
}) => {
  const { t, lang } = useT();
  const formatRupiah = (val: number) => formatRupiahLang(val, lang);
  const faqList = Array.from({ length: FAQ_COUNT }, (_, i) => ({
    question: t(`home.faq.${i + 1}.q` as TKey),
    answer: t(`home.faq.${i + 1}.a` as TKey),
  }));
  const [activeCategory, setActiveCategory] = useState<"ALL" | "ELYSIAN" | "DELUXE">("ALL");
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null); // Semua accordion ter-collapse secara default
  const [selectedDemo, setSelectedDemo] = useState<TemplateItem | null>(null);

  const katalogPath = PATHS.katalog;
  const caraPesanPath = PATHS.caraPesan;
  const appPath = PATHS.studioHome;

  const handleOrderTemplate = (templateTitle: string) => {
    const waText = encodeURIComponent(t("wa.order", { title: templateTitle }));
    window.open(`https://wa.me/6285187978443?text=${waText}`, "_blank");
  };

  const countByCategory = (c: TemplateItem["category"]) => HOME_TEMPLATES.filter((t) => t.category === c).length;

  const filteredTemplates =
    activeCategory === "ALL"
      ? HOME_TEMPLATES
      : HOME_TEMPLATES.filter((t) => t.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#faf9ff] text-text-primary flex flex-col font-sans selection:bg-[#7d6aee]/20 selection:text-[#7d6aee]">
      {/* 1. Navbar Satu Cerita */}
      <Navbar currentPath={currentPath} onNavigate={onNavigate} />

      <main className="flex-1 flex flex-col select-none">
        {/* ========================================================= */}
        {/* SECTION 1: HERO & PHONE SHOWCASE                         */}
        {/* Di desktop: Header dan Template Cards berada dalam SATU BARIS */}
        {/* ========================================================= */}
        <section className="w-full bg-[#7d6aee]/[0.06] border-b border-[#7d6aee]/15 px-4 sm:px-6 md:px-8 lg:px-12 py-10 sm:py-14 lg:py-16 select-none transition-colors">
          <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* SISI KIRI (DESKTOP): Header & CTA Buttons */}
            <div className="lg:col-span-7 flex flex-col items-start text-left">
              {/* Judul Hero */}
              <h1 className="text-3xl sm:text-5xl lg:text-[3.25rem] font-black tracking-tight text-neutral-900 leading-[1.12] mb-3 sm:mb-4 text-left">
                {t("home.hero.title")}{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7d6aee] via-[#9484f4] to-[#ad9fff]">
                  Satu Cerita
                </span>
              </h1>

              {/* Deskripsi Hero (Diperbesar 2px menjadi 20px pada desktop) */}
              <p className="text-base sm:text-lg lg:text-[20px] lg:leading-relaxed text-neutral-600 max-w-xl font-normal leading-relaxed text-left mb-6">
                {t("home.hero.desc")}
              </p>

              {/* Tombol CTA */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => onNavigate(katalogPath)}
                >
                  <span>{t("home.hero.ctaCatalog")}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => onNavigate(appPath)}
                >
                  <span>{t("home.hero.ctaFree")}</span>
                </Button>
              </div>
            </div>

            {/* SISI KANAN (DESKTOP): Komponen Card Template Mockup (Lebih pendek & menyebar) */}
            <div className="lg:col-span-5 flex items-center justify-center w-full py-4">
              <div className="relative w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[340px] aspect-[4/3.2] flex items-center justify-center">
                {/* Left Tilted Phone (Menjauh ke kiri) - cover template */}
                <div className="absolute -left-8 sm:-left-12 top-2 w-[58%] aspect-[3/4] bg-white rounded-2xl sm:rounded-3xl border border-purple-100 p-1.5 shadow-[0_8px_24px_rgba(125,106,238,0.12)] -rotate-12 transform origin-bottom-left transition-transform hover:-rotate-14">
                  <div className="w-full h-full rounded-xl overflow-hidden relative" style={{ backgroundColor: heroCovers[1].frameBg }}>
                    <img src={heroCovers[1].image} alt={heroCovers[1].title} className="w-full h-full object-cover" />
                  </div>

                  {/* Red Badge across bottom left */}
                  <div className="absolute -bottom-2 -left-2 z-30 bg-[#EE5B4F] text-white rounded-lg px-2 py-0.5 font-bold text-[9px] shadow-sm -rotate-3 select-none">
                    {t("home.mock.live")}
                  </div>
                </div>

                {/* Right Tilted Phone (Menjauh ke kanan) - cover template */}
                <div className="absolute -right-8 sm:-right-12 top-0 w-[58%] aspect-[3/4] bg-white rounded-2xl sm:rounded-3xl border border-purple-100 p-1.5 shadow-[0_8px_24px_rgba(125,106,238,0.12)] rotate-12 transform origin-bottom-right transition-transform hover:rotate-14">
                  <div className="w-full h-full rounded-xl overflow-hidden relative" style={{ backgroundColor: heroCovers[2].frameBg }}>
                    <img src={heroCovers[2].image} alt={heroCovers[2].title} className="w-full h-full object-cover" />
                  </div>
                </div>

                {/* Center Front Phone - cover template */}
                <div className="relative z-20 w-[62%] aspect-[3/4] bg-white rounded-2xl sm:rounded-3xl border border-purple-100 p-2 shadow-[0_16px_36px_rgba(125,106,238,0.16)] flex flex-col">
                  <div className="w-full h-full rounded-xl overflow-hidden relative" style={{ backgroundColor: heroCovers[0].frameBg }}>
                    <img src={heroCovers[0].image} alt={heroCovers[0].title} className="w-full h-full object-cover" />
                  </div>

                  {/* Top-right Pill Badge: satucerita.id/nama-kalian */}
                  <div className="absolute -top-2.5 -right-3 z-40 bg-[#7D6AEE] text-white rounded-lg px-2.5 py-1 font-bold text-[9px] shadow-[0_2px_8px_rgba(125,106,238,0.3)] rotate-3 select-none">
                    {t("home.mock.url")}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 2: KENAPA SATUCERITA (LATAR SAMA DENGAN HERO)     */}
        {/* ========================================================= */}
        <section className="w-full bg-[#7d6aee]/[0.06] py-14 sm:py-20 px-4 sm:px-6 md:px-8 text-left border-t border-[#7d6aee]/15">
          <div className="max-w-6xl mx-auto w-full text-left">
            {/* Section Badge */}
            <div className="inline-block mb-3">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 text-[#7d6aee] border border-purple-200 text-xs font-bold tracking-wide uppercase shadow-2xs">
                {t("home.why.badge")}
              </span>
            </div>

            {/* Section Title & Desc (lebar dipersempit) */}
            <h2 className="text-3xl sm:text-5xl font-black text-neutral-900 tracking-tight leading-[1.12] mb-3 max-w-[360px] sm:max-w-[560px] lg:max-w-[680px]">
              {t("home.why.title")}
            </h2>
            <p className="text-neutral-600 text-sm sm:text-base leading-relaxed mb-8 sm:mb-10 max-w-[360px] sm:max-w-[440px] font-normal">
              {t("home.why.desc")}
            </p>

            {/* 8 Feature Cards Grid (4 columns on desktop, 2 on tablet, swipe carousel on mobile ignoring side padding) */}
            <div className="relative -mx-4 sm:mx-0">
              <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 overflow-x-auto sm:overflow-visible pb-6 sm:pb-0 pl-4 pr-4 sm:px-0 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {/* Card 1 */}
                <div className="snap-start scroll-ml-6 sm:scroll-ml-0 shrink-0 w-[76vw] max-w-[280px] sm:w-auto sm:max-w-none bg-white rounded-2xl sm:rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 p-4 sm:p-5 shadow-2xs hover:border-purple-200 transition-all text-left flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border border-purple-100 bg-amber-50 text-amber-600 flex items-center justify-center shadow-2xs mb-3.5">
                      <SlidersHorizontal className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <h3 className="text-[20px] font-black text-neutral-900 tracking-tight leading-snug mb-2">
                      {t("home.why.1.title")}
                    </h3>
                    <p className="text-[16px] text-neutral-600 leading-relaxed font-normal">
                      {t("home.why.1.desc")}
                    </p>
                  </div>
                </div>

                {/* Card 2 */}
                <div className="snap-start scroll-ml-6 sm:scroll-ml-0 shrink-0 w-[76vw] max-w-[280px] sm:w-auto sm:max-w-none bg-white rounded-2xl sm:rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 p-4 sm:p-5 shadow-2xs hover:border-purple-200 transition-all text-left flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border border-purple-100 bg-rose-50 text-rose-600 flex items-center justify-center shadow-2xs mb-3.5">
                      <ImagePlus className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <h3 className="text-[20px] font-black text-neutral-900 tracking-tight leading-snug mb-2">
                      {t("home.why.2.title")}
                    </h3>
                    <p className="text-[16px] text-neutral-600 leading-relaxed font-normal">
                      {t("home.why.2.desc")}
                    </p>
                  </div>
                </div>

                {/* Card 3 */}
                <div className="snap-start scroll-ml-6 sm:scroll-ml-0 shrink-0 w-[76vw] max-w-[280px] sm:w-auto sm:max-w-none bg-white rounded-2xl sm:rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 p-4 sm:p-5 shadow-2xs hover:border-purple-200 transition-all text-left flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border border-purple-100 bg-purple-50 text-[#7D6AEE] flex items-center justify-center shadow-2xs mb-3.5">
                      <Music className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <h3 className="text-[20px] font-black text-neutral-900 tracking-tight leading-snug mb-2">
                      {t("home.why.3.title")}
                    </h3>
                    <p className="text-[16px] text-neutral-600 leading-relaxed font-normal">
                      {t("home.why.3.desc")}
                    </p>
                  </div>
                </div>

                {/* Card 4 */}
                <div className="snap-start scroll-ml-6 sm:scroll-ml-0 shrink-0 w-[76vw] max-w-[280px] sm:w-auto sm:max-w-none bg-white rounded-2xl sm:rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 p-4 sm:p-5 shadow-2xs hover:border-purple-200 transition-all text-left flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border border-purple-100 bg-pink-50 text-pink-600 flex items-center justify-center shadow-2xs mb-3.5">
                      <Heart className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <h3 className="text-[20px] font-black text-neutral-900 tracking-tight leading-snug mb-2">
                      {t("home.why.4.title")}
                    </h3>
                    <p className="text-[16px] text-neutral-600 leading-relaxed font-normal">
                      {t("home.why.4.desc")}
                    </p>
                  </div>
                </div>

                {/* Card 5 */}
                <div className="snap-start scroll-ml-6 sm:scroll-ml-0 shrink-0 w-[76vw] max-w-[280px] sm:w-auto sm:max-w-none bg-white rounded-2xl sm:rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 p-4 sm:p-5 shadow-2xs hover:border-purple-200 transition-all text-left flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border border-purple-100 bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-2xs mb-3.5">
                      <QrCode className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <h3 className="text-[20px] font-black text-neutral-900 tracking-tight leading-snug mb-2">
                      {t("home.why.5.title")}
                    </h3>
                    <p className="text-[16px] text-neutral-600 leading-relaxed font-normal">
                      {t("home.why.5.desc")}
                    </p>
                  </div>
                </div>

                {/* Card 6 */}
                <div className="snap-start scroll-ml-6 sm:scroll-ml-0 shrink-0 w-[76vw] max-w-[280px] sm:w-auto sm:max-w-none bg-white rounded-2xl sm:rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 p-4 sm:p-5 shadow-2xs hover:border-purple-200 transition-all text-left flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border border-purple-100 bg-rose-50 text-rose-600 flex items-center justify-center shadow-2xs mb-3.5">
                      <MessageCircle className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <h3 className="text-[20px] font-black text-neutral-900 tracking-tight leading-snug mb-2">
                      {t("home.why.6.title")}
                    </h3>
                    <p className="text-[16px] text-neutral-600 leading-relaxed font-normal">
                      {t("home.why.6.desc")}
                    </p>
                  </div>
                </div>

                {/* Card 7 */}
                <div className="snap-start scroll-ml-6 sm:scroll-ml-0 shrink-0 w-[76vw] max-w-[280px] sm:w-auto sm:max-w-none bg-white rounded-2xl sm:rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 p-4 sm:p-5 shadow-2xs hover:border-purple-200 transition-all text-left flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border border-purple-100 bg-sky-50 text-sky-600 flex items-center justify-center shadow-2xs mb-3.5">
                      <Globe className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <h3 className="text-[20px] font-black text-neutral-900 tracking-tight leading-snug mb-2">
                      {t("home.why.7.title")}
                    </h3>
                    <p className="text-[16px] text-neutral-600 leading-relaxed font-normal">
                      {t("home.why.7.desc")}
                    </p>
                  </div>
                </div>

                {/* Card 8 */}
                <div className="snap-start scroll-ml-6 sm:scroll-ml-0 shrink-0 w-[76vw] max-w-[280px] sm:w-auto sm:max-w-none bg-white rounded-2xl sm:rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 p-4 sm:p-5 shadow-2xs hover:border-purple-200 transition-all text-left flex flex-col justify-between">
                  <div>
                    <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl border border-purple-100 bg-purple-50 text-[#7D6AEE] flex items-center justify-center shadow-2xs mb-3.5">
                      <Link2 className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <h3 className="text-[20px] font-black text-neutral-900 tracking-tight leading-snug mb-2">
                      {t("home.why.8.title")}
                    </h3>
                    <p className="text-[16px] text-neutral-600 leading-relaxed font-normal">
                      {t("home.why.8.desc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 3: TEMPLATE PILIHAN (UNGU AKSEN & TEKS PUTIH)     */}
        {/* ========================================================= */}
        <section className="w-full bg-[#7d6aee] py-14 sm:py-20 px-4 sm:px-6 md:px-8 text-white text-left">
          <div className="max-w-6xl mx-auto w-full text-left">
            {/* Header: badge, judul, deskripsi (kiri) + tombol (kanan, desktop) */}
            <div className="lg:flex lg:items-end lg:justify-between lg:gap-8 lg:mb-6">
            <div>
            {/* Section Badge */}
            <div className="inline-block mb-3">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 text-white border border-white/30 text-xs font-bold tracking-wide uppercase shadow-2xs">
                {t("home.tpl.badge")}
              </span>
            </div>

            {/* Section Title & Desc */}
            <h2 className="text-2xl sm:text-5xl font-black text-white tracking-tight leading-snug mb-3">
              {t("home.tpl.title")}
            </h2>
            <p className="text-purple-100 text-sm sm:text-base leading-relaxed mb-6 lg:mb-0 max-w-2xl font-normal">
              {t("home.tpl.desc")}
            </p>
            </div>

            {/* Button: Lihat semua template */}
            <div className="mb-6 lg:mb-0 shrink-0">
              <button
                type="button"
                onClick={() => onNavigate(katalogPath)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl border border-white/40 font-bold text-sm text-[#7d6aee] bg-white hover:bg-purple-50 shadow-sm transition-all cursor-pointer"
              >
                <span>{t("home.tpl.seeAll")}</span>
                <ArrowRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
            </div>

            {/* Category Filter Pills */}
            <div className="relative -mx-4 sm:mx-0 mb-8">
              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 pl-6 pr-6 sm:px-0 scroll-pl-6 sm:scroll-pl-0 [scrollbar-width:none]">
                <button
                  type="button"
                  onClick={() => setActiveCategory("ALL")}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border font-bold text-xs transition-all cursor-pointer ${activeCategory === "ALL"
                    ? "bg-white text-[#7d6aee] border-white shadow-xs"
                    : "bg-white/15 text-white border-white/25 hover:bg-white/25 shadow-2xs"
                    }`}
                >
                  <span>{t("home.tpl.filterAll")}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeCategory === "ALL" ? "bg-purple-100 text-[#7d6aee]" : "bg-white/20 text-white"}`}>{HOME_TEMPLATES.length}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveCategory("ELYSIAN")}
                  className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border font-bold text-xs transition-all cursor-pointer ${activeCategory === "ELYSIAN"
                    ? "bg-white text-[#7d6aee] border-white shadow-xs"
                    : "bg-white/15 text-white border-white/25 hover:bg-white/25 shadow-2xs"
                    }`}
                >
                  <span>Elysian</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeCategory === "ELYSIAN" ? "bg-purple-100 text-[#7d6aee]" : "bg-white/20 text-white"}`}>{countByCategory("ELYSIAN")}</span>
                </button>

                {countByCategory("DELUXE") > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveCategory("DELUXE")}
                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border font-bold text-xs transition-all cursor-pointer ${activeCategory === "DELUXE"
                      ? "bg-white text-[#7d6aee] border-white shadow-xs"
                      : "bg-white/15 text-white border-white/25 hover:bg-white/25 shadow-2xs"
                      }`}
                  >
                    <span>Deluxe</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${activeCategory === "DELUXE" ? "bg-purple-100 text-[#7d6aee]" : "bg-white/20 text-white"}`}>{countByCategory("DELUXE")}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Cards Carousel on Mobile, Grid on Tablet/Desktop (Ignoring mobile side padding) */}
            <div className="relative -mx-4 sm:mx-0">
              <div
                className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 overflow-x-auto sm:overflow-visible pb-6 sm:pb-0 pl-3.5 sm:pl-4 pr-3.5 sm:pr-4 sm:px-0 scroll-pl-0 sm:scroll-pl-0 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              >
                {filteredTemplates.map((item) => (
                  <div
                    key={item.id}
                    className="snap-start scroll-ml-6 sm:scroll-ml-0 shrink-0 w-[72vw] max-w-[275px] sm:w-auto sm:max-w-none bg-white rounded-2xl sm:rounded-3xl border border-purple-200 border-b-[3px] border-b-purple-300 p-3 sm:p-4 shadow-2xs hover:border-purple-300 transition-all flex flex-col justify-between text-left group"
                  >
                    <div
                      onClick={() => onNavigate(`/katalog/${item.id}`)}
                      className="cursor-pointer"
                    >
                      {/* Cover katalog: foto mockup 3:4 ditampilkan penuh */}
                      <div
                        className="relative w-full aspect-[3/4] rounded-xl sm:rounded-2xl border border-purple-100/80 mb-3 overflow-hidden bg-neutral-100"
                        style={{ backgroundColor: item.frameBg }}
                      >
                        <img
                          src={item.image}
                          alt={item.title}
                          loading="lazy"
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      {/* Judul & Kategori */}
                      <div className="flex items-center justify-between gap-1.5 mt-1">
                        <h3 className="text-[20px] md:text-[24px] font-black text-neutral-900 tracking-tight leading-snug truncate group-hover:text-[#7d6aee] transition-colors">
                          {item.title}
                        </h3>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-purple-200 font-bold text-[12px] uppercase tracking-wider bg-purple-50 text-[#7d6aee] shrink-0">
                          {item.category}
                        </span>
                      </div>

                      {/* Harga */}
                      <div className="mt-4 sm:mt-5 mb-3 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                        <span className="text-[24px] font-black text-neutral-900 tracking-tight leading-none">
                          {formatRupiah(item.discountPrice)}
                        </span>
                        <span className="text-[16px] font-extrabold text-neutral-400 line-through decoration-[#EE5B4F] decoration-2 leading-none">
                          {formatRupiah(item.originalPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex flex-col gap-2 pt-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onNavigate(`/templates/${item.id}`)}
                        className="w-full !text-[0.85rem] !py-2.5 px-3 h-auto"
                      >
                        <Eye className="w-4 h-4 stroke-[2.2]" />
                        <span>{t("tpl.viewDemo")}</span>
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => onNavigate(`/studio/checkout/${item.id}`)}
                        className="w-full !text-[0.85rem] !py-2.5 px-3 h-auto"
                      >
                        <span>{t("tpl.choose")}</span>
                        <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 4: CARA PESAN (LATAR SAMA DENGAN HERO)            */}
        {/* ========================================================= */}
        <section className="w-full bg-[#7d6aee]/[0.06] py-14 sm:py-20 px-4 sm:px-6 text-left border-y border-[#7d6aee]/15">
          <div className="max-w-6xl mx-auto w-full text-left">
            {/* Header: badge & judul (kiri) + tombol (kanan, desktop) */}
            <div className="lg:flex lg:items-end lg:justify-between lg:gap-8 lg:mb-8">
            <div>
            {/* Section Badge */}
            <div className="inline-block mb-3">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/80 text-[#7d6aee] border border-purple-200 text-xs font-bold tracking-wide uppercase shadow-2xs">
                {t("home.how.badge")}
              </span>
            </div>

            {/* Section Title */}
            <h2 className="text-2xl sm:text-5xl font-black text-neutral-900 tracking-tight leading-snug mb-3 lg:mb-0">
              {t("home.how.title")}
            </h2>
            </div>

            {/* Button: Lihat detail cara pesan */}
            <div className="mb-8 lg:mb-0 shrink-0">
              <Button
                variant="outline"
                size="md"
                onClick={() => onNavigate(caraPesanPath)}
                className="w-full sm:w-auto text-[16px]"
              >
                <span>{t("home.how.detail")}</span>
                <ArrowRight className="w-4.5 h-4.5 stroke-[2.5]" />
              </Button>
            </div>
            </div>

            {/* 4 Steps Showcase - Dipaksa 1 baris di desktop (lg:grid-cols-4) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-5 pt-6 items-stretch">
              {/* Step 1 */}
              <div className="relative w-full bg-white rounded-2xl sm:rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 px-5 sm:px-6 pt-9 pb-6 shadow-2xs hover:border-purple-200 transition-all text-left flex flex-col justify-between">
                {/* Elemen nomor berlatar ungu: 50% di luar, 50% di dalam garis item, sejajar awal judul */}
                <div className="absolute top-0 -translate-y-1/2 left-5 sm:left-6 w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#7d6aee] border border-purple-300 border-b-[3px] border-b-[#5c49d8] text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-xs z-10 select-none">
                  1
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
                      {t("home.how.1.title")}
                    </h3>
                    <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6 text-[#7d6aee] stroke-[2.2] shrink-0" />
                  </div>
                  <p className="text-[14px] sm:text-[15px] lg:text-[14px] text-neutral-600 leading-relaxed font-normal">
                    {t("home.how.1.desc")}
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative w-full bg-white rounded-2xl sm:rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 px-5 sm:px-6 pt-9 pb-6 shadow-2xs hover:border-purple-200 transition-all text-left flex flex-col justify-between">
                {/* Elemen nomor berlatar ungu: 50% di luar, 50% di dalam garis item, sejajar awal judul */}
                <div className="absolute top-0 -translate-y-1/2 left-5 sm:left-6 w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#7d6aee] border border-purple-300 border-b-[3px] border-b-[#5c49d8] text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-xs z-10 select-none">
                  2
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
                      {t("home.how.2.title")}
                    </h3>
                    <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-[#7d6aee] stroke-[2.2] shrink-0" />
                  </div>
                  <p className="text-[14px] sm:text-[15px] lg:text-[14px] text-neutral-600 leading-relaxed font-normal">
                    {t("home.how.2.desc")}
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative w-full bg-white rounded-2xl sm:rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 px-5 sm:px-6 pt-9 pb-6 shadow-2xs hover:border-purple-200 transition-all text-left flex flex-col justify-between">
                {/* Elemen nomor berlatar ungu: 50% di luar, 50% di dalam garis item, sejajar awal judul */}
                <div className="absolute top-0 -translate-y-1/2 left-5 sm:left-6 w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#7d6aee] border border-purple-300 border-b-[3px] border-b-[#5c49d8] text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-xs z-10 select-none">
                  3
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
                      {t("home.how.3.title")}
                    </h3>
                    <SlidersHorizontal className="w-5 h-5 sm:w-6 sm:h-6 text-[#7d6aee] stroke-[2.2] shrink-0" />
                  </div>
                  <p className="text-[14px] sm:text-[15px] lg:text-[14px] text-neutral-600 leading-relaxed font-normal">
                    {t("home.how.3.desc")}
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative w-full bg-white rounded-2xl sm:rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 px-5 sm:px-6 pt-9 pb-6 shadow-2xs hover:border-purple-200 transition-all text-left flex flex-col justify-between">
                {/* Elemen nomor berlatar ungu: 50% di luar, 50% di dalam garis item, sejajar awal judul */}
                <div className="absolute top-0 -translate-y-1/2 left-5 sm:left-6 w-11 h-11 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-[#7d6aee] border border-purple-300 border-b-[3px] border-b-[#5c49d8] text-white flex items-center justify-center font-black text-xl shadow-xs z-10 select-none">
                  4
                </div>
                <div>
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <h3 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
                      {t("home.how.4.title")}
                    </h3>
                    <Send className="w-5 h-5 sm:w-6 sm:h-6 text-[#7d6aee] stroke-[2.2] shrink-0" />
                  </div>
                  <p className="text-[14px] sm:text-[15px] lg:text-[14px] text-neutral-600 leading-relaxed font-normal">
                    {t("home.how.4.desc")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* SECTION 5: FAQ ACCORDION (UNGU & TEKS PUTIH)               */}
        {/* ========================================================= */}
        <section className="w-full bg-[#7d6aee] py-14 sm:py-20 px-4 sm:px-6 text-white text-left">
          <div className="max-w-4xl mx-auto w-full text-left">
            {/* Section Badge */}
            <div className="inline-block mb-3">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/20 text-white border border-white/30 text-xs font-bold tracking-wide uppercase shadow-2xs">
                {t("home.faq.badge")}
              </span>
            </div>

            {/* Section Title */}
            <h2 className="text-2xl sm:text-5xl font-black text-white tracking-tight leading-snug mb-8">
              {t("home.faq.title")}
            </h2>

            {/* Accordion List */}
            <Accordion
              items={faqList.map((faq, index) => ({
                id: index,
                title: faq.question,
                content: faq.answer,
              }))}
              openIndex={openFaqIndex}
              onToggleIndex={setOpenFaqIndex}
              iconVariant="plus-x"
            />
          </div>
        </section>
      </main>

      {/* Modal Demo Preview Interaktif */}
      {selectedDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs p-6 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-purple-100 mb-4">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-[#7d6aee]" />
                <h4 className="text-lg font-black text-neutral-900">
                  {t("tpl.demoTitle", { title: selectedDemo.title })}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDemo(null)}
                className="w-8 h-8 rounded-xl bg-purple-50 text-[#7d6aee] border border-purple-200 flex items-center justify-center font-bold hover:bg-purple-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div
              className="relative rounded-2xl border border-purple-100/80 mb-4 overflow-hidden aspect-[3/4] bg-neutral-100"
              style={{ backgroundColor: selectedDemo.frameBg }}
            >
              <img
                src={selectedDemo.image}
                alt={selectedDemo.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-bold text-neutral-500 uppercase">{t("tpl.promoPrice")}</span>
                <p className="text-xl font-black text-neutral-900">
                  {formatRupiah(selectedDemo.discountPrice)}
                </p>
              </div>
              <span className="inline-flex items-center px-3 py-1 rounded-lg border border-purple-200 font-bold text-xs uppercase bg-purple-50 text-[#7d6aee]">
                {selectedDemo.category}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  onNavigate(`/studio/checkout/${selectedDemo.id}`);
                  setSelectedDemo(null);
                }}
                className="w-full"
              >
                <span>{t("tpl.chooseThis")}</span>
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDemo(null)}
                className="w-full text-xs"
              >
                {t("tpl.closePreview")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Reusable Footer */}
      <Footer currentPath={currentPath} onNavigate={onNavigate} />

      {/* 5. Bottom Navigation Bar */}
      <BottomNav
        currentPath={currentPath}
        onNavigate={onNavigate}
        activeTab="home"
      />
    </div>
  );
};

export default HomePage;
