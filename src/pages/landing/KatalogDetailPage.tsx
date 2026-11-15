import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import {
  ArrowRight,
  Smartphone,
  Monitor,
  Maximize2,
  MessageCircle,
  Globe,
  Sparkles,
  Music,
  Book,
  BookOpen,
  Flower,
  Users,
  Timer,
  Shirt,
  Video,
  Camera,
  Quote,
  MessageSquare,
  Gift,
  Heart,
  Calendar,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  TEMPLATES_DATA,
  TemplateItemData,
  getTemplateBySlug,
  formatRupiah as formatRupiahBase,
} from "@/data/templates";
import { useT } from "@/i18n";
import { localizeTemplate } from "@/i18n/templates";

interface KatalogDetailPageProps {
  currentPath: string;
  onNavigate?: (path: string) => void;
}

// Template asli yang siap ditampilkan via iframe
const AVAILABLE_TEMPLATES = ["aglaia", "antheia", "thaleia"];

export const KatalogDetailPage: React.FC<KatalogDetailPageProps> = ({
  currentPath,
  onNavigate = (_path: string) => {},
}) => {
  // Extract slug from /katalog/:slug
  const { t, lang } = useT();
  const formatRupiah = (val: number) => formatRupiahBase(val, lang);
  const rawSlug = currentPath.replace(/^\/katalog\/?/, "");
  const baseTemplate: TemplateItemData =
    getTemplateBySlug(rawSlug) || TEMPLATES_DATA[0];
  // Teks yang tampil (badge, section, bahasa) mengikuti bahasa aktif.
  const template = localizeTemplate(baseTemplate, lang);

  const [previewMode, setPreviewMode] = useState<"phone" | "desktop">("phone");

  const handleOrderTemplate = () => {
    const checkoutUrl = `/studio/checkout/${template.slug}`;
    if (onNavigate) {
      onNavigate(checkoutUrl);
    } else {
      window.location.href = checkoutUrl;
    }
  };

  const handleConsultWa = () => {
    const waText = encodeURIComponent(t("wa.ask", { title: template.title }));
    window.open(`https://wa.me/6285187978443?text=${waText}`, "_blank");
  };

  const getSectionBadgeConfig = (sectionName: string) => {
    const s = sectionName.toLowerCase();

    // Sampul -> icon book
    if (s.includes("sampul")) {
      return {
        icon: <Book className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
        badgeClasses:
          "bg-amber-50 text-amber-950 border border-amber-200 border-b-[2px] border-b-amber-400 hover:bg-amber-100/70",
      };
    }

    // Halaman utama -> icon book-open
    if (s.includes("halaman utama")) {
      return {
        icon: <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />,
        badgeClasses:
          "bg-indigo-50 text-indigo-950 border border-indigo-200 border-b-[2px] border-b-indigo-400 hover:bg-indigo-100/70",
      };
    }

    // Salam pembuka / membuka -> icon flower
    if (s.includes("salam")) {
      return {
        icon: <Flower className="w-3.5 h-3.5 text-rose-600 shrink-0" />,
        badgeClasses:
          "bg-rose-50 text-rose-950 border border-rose-200 border-b-[2px] border-b-rose-400 hover:bg-rose-100/70",
      };
    }

    // Profil mempelai
    if (s.includes("profil") || s.includes("mempelai")) {
      return {
        icon: <Users className="w-3.5 h-3.5 text-sky-600 shrink-0" />,
        badgeClasses:
          "bg-sky-50 text-sky-950 border border-sky-200 border-b-[2px] border-b-sky-400 hover:bg-sky-100/70",
      };
    }

    // Kisah cinta
    if (s.includes("kisah") || s.includes("cinta")) {
      return {
        icon: <Heart className="w-3.5 h-3.5 text-pink-600 fill-pink-600/20 shrink-0" />,
        badgeClasses:
          "bg-pink-50 text-pink-950 border border-pink-200 border-b-[2px] border-b-pink-400 hover:bg-pink-100/70",
      };
    }

    // Hitung mundur
    if (s.includes("hitung") || s.includes("mundur")) {
      return {
        icon: <Timer className="w-3.5 h-3.5 text-orange-600 shrink-0" />,
        badgeClasses:
          "bg-orange-50 text-orange-950 border border-orange-200 border-b-[2px] border-b-orange-400 hover:bg-orange-100/70",
      };
    }

    // Detail acara
    if (s.includes("acara")) {
      return {
        icon: <Calendar className="w-3.5 h-3.5 text-emerald-600 shrink-0" />,
        badgeClasses:
          "bg-emerald-50 text-emerald-950 border border-emerald-200 border-b-[2px] border-b-emerald-400 hover:bg-emerald-100/70",
      };
    }

    // Dress code
    if (s.includes("dress")) {
      return {
        icon: <Shirt className="w-3.5 h-3.5 text-violet-600 shrink-0" />,
        badgeClasses:
          "bg-violet-50 text-violet-950 border border-violet-200 border-b-[2px] border-b-violet-400 hover:bg-violet-100/70",
      };
    }

    // Live streaming
    if (s.includes("live") || s.includes("streaming")) {
      return {
        icon: <Video className="w-3.5 h-3.5 text-red-600 shrink-0" />,
        badgeClasses:
          "bg-red-50 text-red-950 border border-red-200 border-b-[2px] border-b-red-400 hover:bg-red-100/70",
      };
    }

    // Galeri foto
    if (s.includes("galeri") || s.includes("foto")) {
      return {
        icon: <Camera className="w-3.5 h-3.5 text-cyan-600 shrink-0" />,
        badgeClasses:
          "bg-cyan-50 text-cyan-950 border border-cyan-200 border-b-[2px] border-b-cyan-400 hover:bg-cyan-100/70",
      };
    }

    // Kutipan
    if (s.includes("kutipan")) {
      return {
        icon: <Quote className="w-3.5 h-3.5 text-teal-600 shrink-0" />,
        badgeClasses:
          "bg-teal-50 text-teal-950 border border-teal-200 border-b-[2px] border-b-teal-400 hover:bg-teal-100/70",
      };
    }

    // RSVP & ucapan
    if (s.includes("rsvp") || s.includes("ucapan")) {
      return {
        icon: <MessageSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />,
        badgeClasses:
          "bg-blue-50 text-blue-950 border border-blue-200 border-b-[2px] border-b-blue-400 hover:bg-blue-100/70",
      };
    }

    // Amplop digital
    if (s.includes("amplop") || s.includes("hadiah")) {
      return {
        icon: <Gift className="w-3.5 h-3.5 text-amber-600 shrink-0" />,
        badgeClasses:
          "bg-amber-50 text-amber-950 border border-amber-200 border-b-[2px] border-b-amber-400 hover:bg-amber-100/70",
      };
    }

    // Penutup
    if (s.includes("penutup")) {
      return {
        icon: <Bookmark className="w-3.5 h-3.5 text-fuchsia-600 shrink-0" />,
        badgeClasses:
          "bg-fuchsia-50 text-fuchsia-950 border border-fuchsia-200 border-b-[2px] border-b-fuchsia-400 hover:bg-fuchsia-100/70",
      };
    }

    // Musik latar
    if (s.includes("musik")) {
      return {
        icon: <Music className="w-3.5 h-3.5 text-[#7d6aee] shrink-0" />,
        badgeClasses:
          "bg-purple-50 text-purple-950 border border-purple-200 border-b-[2px] border-b-purple-400 hover:bg-purple-100/70",
      };
    }

    return {
      icon: <Sparkles className="w-3.5 h-3.5 text-[#7d6aee] shrink-0" />,
      badgeClasses:
        "bg-purple-50 text-purple-950 border border-purple-200 border-b-[2px] border-b-purple-400 hover:bg-purple-100/70",
    };
  };

  return (
    <div className="min-h-screen bg-[#faf9ff] text-neutral-900 flex flex-col font-sans selection:bg-[#7d6aee]/20 selection:text-[#7d6aee]">
      {/* 1. Navbar Satu Cerita Asli */}
      <Navbar currentPath={currentPath} onNavigate={onNavigate} />

      <main className="flex-1 py-8 sm:py-12 md:py-14 select-none">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Two Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
            {/* SISI KIRI: Pratinjau Langsung */}
            <section
              aria-labelledby="pratinjau-judul"
              className="lg:col-span-7 flex flex-col gap-5"
            >
              {/* Header Pratinjau */}
              <div className="text-left">
                <h1
                  id="pratinjau-judul"
                  className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight leading-snug"
                >
                  {t("detail.preview.title")}
                </h1>
                <p className="mt-1 text-sm sm:text-base text-neutral-600 leading-relaxed font-normal">
                  {t("detail.preview.desc")}
                </p>
              </div>

              {/* Toolbar: Mode Tampilan & Layar Penuh */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {/* Mode Tampilan Switch (Ponsel / Desktop) */}
                <div
                  role="group"
                  aria-label={t("detail.viewMode")}
                  className="inline-flex p-1 rounded-xl bg-white border border-purple-200 border-b-[3px] border-b-purple-300 shadow-2xs"
                >
                  <button
                    type="button"
                    aria-pressed={previewMode === "phone"}
                    onClick={() => setPreviewMode("phone")}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      previewMode === "phone"
                        ? "bg-[#7d6aee] text-white shadow-xs"
                        : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{t("detail.phone")}</span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={previewMode === "desktop"}
                    onClick={() => setPreviewMode("desktop")}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      previewMode === "desktop"
                        ? "bg-[#7d6aee] text-white shadow-xs"
                        : "text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>{t("detail.desktop")}</span>
                  </button>
                </div>

                {/* Buka Layar Penuh Button -> buka /templates/:slug */}
                <button
                  type="button"
                  onClick={() => onNavigate(`/templates/${template.slug}`)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white hover:bg-purple-50 text-neutral-800 border border-purple-200 border-b-[3px] border-b-purple-300 font-bold text-xs shadow-2xs transition-all cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-[#7d6aee]" />
                  <span>{t("detail.fullscreen")}</span>
                </button>
              </div>

              {/* Mockup Frame Container */}
              <div
                className="relative w-full rounded-2xl sm:rounded-3xl border border-purple-200 border-b-[4px] border-b-purple-300 bg-white p-3 sm:p-5 shadow-2xs transition-all"
              >
                {/* Device Window Dots */}
                <div className="flex items-center gap-1.5 pb-1 mb-2.5 w-full">
                  <span className="w-3 h-3 rounded-full bg-[#EE5B4F]" />
                  <span className="w-3 h-3 rounded-full bg-[#F5C744]" />
                  <span className="w-3 h-3 rounded-full bg-[#22C55E]" />
                </div>

                {/* Device Mockup Frame */}
                <div className="flex justify-center w-full py-2">
                  <div
                    className={`transition-all duration-300 relative rounded-2xl overflow-hidden border border-neutral-800 shadow-xl bg-neutral-950 ${
                      previewMode === "phone"
                        ? "w-full max-w-[320px] aspect-[9/16] sm:max-w-[340px]"
                        : "w-full max-w-[620px] aspect-[16/10]"
                    }`}
                  >
                    {/* Simulated Phone Notch / Dynamic Island */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-neutral-900 rounded-full z-30 border border-neutral-800 flex items-center justify-center">
                      <span className="w-2 h-2 rounded-full bg-neutral-800" />
                    </div>

                    {/* Template iframe — tampil interaktif jika template tersedia */}
                    {AVAILABLE_TEMPLATES.includes(template.slug.toLowerCase()) ? (
                      <div className="relative w-full h-full">
                        <iframe
                          key={`${template.slug}-${previewMode}`}
                          src={`/templates/${template.slug}/index.html`}
                          title={t("detail.iframeTitle", { title: template.title })}
                          className="w-full h-full border-0 bg-white"
                          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                          loading="lazy"
                        />
                        {/* Floating quick action to fullscreen preview */}
                        <div className="absolute bottom-3 right-3 z-30 pointer-events-auto">
                          <button
                            type="button"
                            onClick={() => onNavigate(`/templates/${template.slug}`)}
                            title={t("detail.fullscreenTitle")}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900/80 hover:bg-neutral-900 text-white text-[11px] font-bold backdrop-blur-md shadow-lg border border-white/20 transition-all cursor-pointer hover:scale-105"
                          >
                            <Maximize2 className="w-3 h-3 text-purple-300" />
                            <span>{t("detail.fullscreenShort")}</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Fallback mockup cover jika template belum tersedia */
                      <div className="relative w-full h-full">
                        <img
                          src={template.image}
                          alt={template.title}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />
                        <div className="relative z-20 w-full h-full p-6 flex flex-col justify-between text-white text-center">
                          <div className="pt-4">
                            <span className="inline-block px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-[9px] uppercase tracking-widest font-bold">
                              {template.category} Wedding Invitation
                            </span>
                          </div>
                          <div className="my-auto space-y-2 py-4">
                            <p className="text-[11px] font-serif uppercase tracking-widest text-purple-200">
                              The Wedding Celebration Of
                            </p>
                            <h2 className="text-2xl sm:text-3xl font-serif font-black tracking-wide leading-tight drop-shadow-md">
                              {template.coupleName}
                            </h2>
                            <div className="flex items-center justify-center gap-2 pt-1">
                              <span className="h-[1px] w-6 bg-white/50" />
                              <p className="text-xs font-mono font-bold tracking-widest text-amber-300">
                                {template.date}
                              </p>
                              <span className="h-[1px] w-6 bg-white/50" />
                            </div>
                          </div>
                          <div className="pb-8">
                            <button
                              type="button"
                              onClick={() => onNavigate(`/templates/${template.slug}`)}
                              className="px-5 py-2 rounded-xl bg-white text-neutral-900 font-bold text-xs shadow-md hover:bg-neutral-100 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>{t("detail.openFullPreview")}</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* SISI KANAN: Sidebar Informasi & Pembelian */}
            <aside className="lg:col-span-5 flex flex-col gap-6 lg:sticky lg:top-24 lg:self-start text-left">
              {/* Card 1: Harga & Pemesanan (Tanpa separator garis pemisah di dalam card) */}
              <div className="relative bg-white rounded-2xl sm:rounded-3xl border border-purple-200 border-b-[4px] border-b-purple-300 p-6 sm:p-8 shadow-2xs">
                {/* Floating Discount Sticker */}
                <div className="absolute -top-3.5 -right-2 z-10 rotate-6 bg-[#EE5B4F] text-white px-3 py-1 font-black text-xs sm:text-sm rounded-lg shadow-sm border border-white/40 select-none">
                  {template.discountBadge}
                </div>

                {/* Title */}
                <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight leading-tight pr-16">
                  {template.title}
                </h1>

                {/* Categories & Badges (Tanpa separator border bawah) */}
                <div className="mt-3 mb-5 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md border border-purple-200 font-bold text-xs uppercase tracking-wider bg-purple-50 text-[#7d6aee]">
                    {template.category}
                  </span>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md border border-amber-200 font-bold text-xs uppercase tracking-wider bg-amber-50 text-amber-700">
                    {template.badge}
                  </span>
                </div>

                {/* Harga Template */}
                <div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-neutral-500">
                    {t("detail.priceTitle")}
                  </h2>
                  <div className="mt-4 sm:mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-3xl sm:text-4xl font-black text-neutral-900 tracking-tight leading-none">
                      {formatRupiah(template.discountPrice)}
                    </span>
                    <span className="text-base sm:text-lg font-extrabold text-neutral-400 line-through decoration-[#EE5B4F] decoration-2 leading-none">
                      {formatRupiah(template.originalPrice)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs font-bold uppercase tracking-wider text-neutral-500">
                    {t("detail.oncePerInvite")}
                  </p>
                </div>

                {/* Tombol Utama: Pilih Template Ini */}
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleOrderTemplate}
                  className="mt-6 w-full !py-3 !text-base shadow-sm hover:shadow-md"
                >
                  <span>{t("detail.choose")}</span>
                  <ArrowRight className="w-5 h-5 stroke-[2.5]" />
                </Button>

                <p className="mt-3 text-xs text-neutral-500 text-left leading-relaxed">
                  {t("detail.redirectNote")}
                </p>

                {/* Tombol Tanya Dulu via WhatsApp (Semuanya hitam: icon, teks, dan garis bawah, tanpa separator atas) */}
                <div className="mt-4 pt-1">
                  <button
                    type="button"
                    onClick={handleConsultWa}
                    className="inline-flex items-center gap-2 text-sm font-bold text-black hover:text-neutral-800 transition-colors cursor-pointer group"
                  >
                    <MessageCircle className="w-4 h-4 text-black stroke-[2.2] group-hover:scale-110 transition-transform" />
                    <span className="underline decoration-2 underline-offset-4 decoration-black text-black">
                      {t("detail.askWa")}
                    </span>
                  </button>
                </div>
              </div>

              {/* Card 2: Section Yang Tersedia */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-purple-200 border-b-[4px] border-b-purple-300 p-6 sm:p-7 shadow-2xs">
                <h2 className="text-lg sm:text-xl font-black text-neutral-900 tracking-tight">
                  {t("detail.sections.title")}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-neutral-600 leading-relaxed font-normal">
                  {t("detail.sections.desc")}
                </p>

                <ul className="mt-4 flex flex-wrap gap-2">
                  {template.availableSections.map((sec, idx) => {
                    const config = getSectionBadgeConfig(sec);
                    const label = template.sectionLabels[idx] ?? sec;
                    return (
                      <li
                        key={idx}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold shadow-2xs transition-all ${config.badgeClasses}`}
                      >
                        {config.icon}
                        <span>{label}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              {/* Card 3: Bahasa Undangan */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-purple-200 border-b-[4px] border-b-purple-300 p-5 sm:p-6 shadow-2xs flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#7d6aee] border border-purple-200 flex items-center justify-center shrink-0 shadow-2xs">
                  <Globe className="w-6 h-6 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-neutral-900">
                    {t("detail.language.title")}
                  </h3>
                  <p className="text-xs sm:text-sm font-semibold text-neutral-600 mt-0.5">
                    {template.languageLabels.join(" · ")}
                  </p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </main>

      {/* 4. Footer Satu Cerita Asli */}
      <Footer currentPath={currentPath} onNavigate={onNavigate} />

      {/* 5. Bottom Navigation Bar */}
      <BottomNav
        currentPath={currentPath}
        onNavigate={onNavigate}
        activeTab="katalog"
      />
    </div>
  );
};

export default KatalogDetailPage;
