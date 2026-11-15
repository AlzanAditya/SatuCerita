import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import {
  LayoutGrid,
  Eye,
  ArrowRight,
  X,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface KatalogPageProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

import { TEMPLATES_DATA, formatRupiah as formatRupiahBase, TemplateItemData } from "@/data/templates";
import { useT } from "@/i18n";

const TEMPLATES: TemplateItemData[] = TEMPLATES_DATA;

export const KatalogPage: React.FC<KatalogPageProps> = ({
  currentPath = "/katalog",
  onNavigate = (_path: string) => { },
}) => {
  const { t, lang } = useT();
  const formatRupiah = (val: number) => formatRupiahBase(val, lang);
  const [selectedDemo, setSelectedDemo] = useState<TemplateItemData | null>(null);

  return (
    <div className="min-h-screen bg-[#faf9ff] text-text-primary flex flex-col font-sans selection:bg-[#7d6aee]/20 selection:text-[#7d6aee]">
      {/* 1. Navbar Satu Cerita */}
      <Navbar currentPath={currentPath} onNavigate={onNavigate} />

      {/* 2. Header Bagian Khusus */}
      <SubpageHeader
        badgeText={t("catalog.badge")}
        badgeIcon={<LayoutGrid className="w-3.5 h-3.5 text-[#7d6aee] shrink-0" />}
        titlePrefix={t("catalog.titlePrefix")}
        titleHighlight={t("catalog.titleHighlight")}
        description={t("catalog.desc")}
      />

      {/* 3. Konten Utama: Katalog Template Mengikuti Style App Satu Cerita */}
      <main className="flex-1 bg-[#faf9ff] py-10 sm:py-14 md:py-16 select-none">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Header Ringkas: Menampilkan N template */}
          <div className="mb-6 sm:mb-8 text-left">
            <h2 className="text-base sm:text-lg font-black text-neutral-800 tracking-tight">
              {t(TEMPLATES.length === 1 ? "catalog.showing.one" : "catalog.showing.other", { n: TEMPLATES.length })}
            </h2>
          </div>

          {/* Grid / Horizontal Swipe Card Katalog (Ignoring mobile side padding) */}
          <div className="relative -mx-4 sm:mx-0">
            <div
              className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 overflow-x-auto sm:overflow-visible pb-6 sm:pb-0 pl-3.5 sm:pl-4 pr-3.5 sm:pr-4 sm:px-0 scroll-pl-0 sm:scroll-pl-0 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {TEMPLATES.map((item) => (
                <div
                  key={item.id}
                  className="snap-start scroll-ml-6 sm:scroll-ml-0 shrink-0 w-[74vw] max-w-[275px] sm:w-auto sm:max-w-none bg-white rounded-2xl sm:rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 p-3.5 sm:p-4 shadow-2xs hover:border-purple-200 transition-all flex flex-col justify-between text-left group"
                >
                  <div
                    onClick={() => onNavigate(`/katalog/${item.slug}`)}
                    className="cursor-pointer"
                  >
                    {/* Cover katalog: foto mockup 1:1 ditampilkan penuh */}
                    <div
                      className="relative w-full aspect-square rounded-xl sm:rounded-2xl border border-purple-100/80 mb-3 overflow-hidden bg-neutral-100"
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
                    <div className="flex items-center justify-between gap-1.5 mt-1.5">
                      <h3 className="text-[20px] md:text-[24px] font-black text-neutral-900 tracking-tight leading-snug truncate group-hover:text-[#7d6aee] transition-colors">
                        {item.title}
                      </h3>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md border border-purple-200 font-bold text-[12px] uppercase tracking-wider bg-purple-50 text-[#7d6aee] shrink-0">
                        {item.category}
                      </span>
                    </div>

                    {/* Harga */}
                    <div className="mt-4 sm:mt-5 mb-3.5 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
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
                    {/* Tombol Lihat Demo */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onNavigate(`/templates/${item.slug}`)}
                      className="w-full !text-[0.85rem] !py-2.5 px-3 h-auto"
                    >
                      <Eye className="w-4 h-4 stroke-[2.2]" />
                      <span>{t("tpl.viewDemo")}</span>
                    </Button>

                    {/* Tombol Pilih Template -> Checkout */}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onNavigate(`/studio/checkout/${item.slug}`)}
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
      </main>

      {/* Modal Demo Preview Interaktif */}
      {selectedDemo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none">
          <div className="relative w-full max-w-md bg-white rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs p-6 text-left">
            {/* Header Modal */}
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

            {/* Gambar Preview Besar */}
            <div
              className="relative rounded-2xl border border-purple-100/80 mb-4 overflow-hidden aspect-square bg-neutral-100"
              style={{ backgroundColor: selectedDemo.frameBg }}
            >
              <img
                src={selectedDemo.image}
                alt={selectedDemo.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            {/* Keterangan & Harga */}
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

            {/* Action Buttons Modal */}
            <div className="flex flex-col gap-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  onNavigate(`/studio/checkout/${selectedDemo.slug}`);
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
        activeTab="katalog"
      />
    </div>
  );
};

export default KatalogPage;
