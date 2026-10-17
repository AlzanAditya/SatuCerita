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

import { TEMPLATES_DATA, formatRupiah, TemplateItemData } from "@/data/templates";

const TEMPLATES: TemplateItemData[] = TEMPLATES_DATA;

export const KatalogPage: React.FC<KatalogPageProps> = ({
  currentPath = "/katalog",
  onNavigate = (_path: string) => {},
}) => {
  const [selectedDemo, setSelectedDemo] = useState<TemplateItemData | null>(null);

  return (
    <div className="min-h-screen bg-[#faf9ff] text-text-primary flex flex-col font-sans selection:bg-[#7d6aee]/20 selection:text-[#7d6aee]">
      {/* 1. Navbar Satu Cerita */}
      <Navbar currentPath={currentPath} onNavigate={onNavigate} />

      {/* 2. Header Bagian Khusus */}
      <SubpageHeader
        badgeText="Katalog Undangan"
        badgeIcon={<LayoutGrid className="w-3.5 h-3.5 text-[#7d6aee] shrink-0" />}
        titlePrefix="Jelajahi Beragam Pilihan"
        titleHighlight="Katalog Terbaik"
        description="Temukan koleksi template undangan digital eksklusif yang dirancang elegan, interaktif, dan siap membuat momen bahagia Anda semakin berkesan."
      />

      {/* 3. Konten Utama: Katalog Template Mengikuti Style App Satu Cerita */}
      <main className="flex-1 bg-[#faf9ff] py-10 sm:py-14 md:py-16 select-none">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Header Ringkas: Menampilkan N template */}
          <div className="mb-6 sm:mb-8 text-left">
            <h2 className="text-base sm:text-lg font-black text-neutral-800 tracking-tight">
              Menampilkan {TEMPLATES.length} template
            </h2>
          </div>

          {/* Grid / Horizontal Swipe Card Katalog (Ignoring mobile side padding) */}
          <div className="relative -mx-4 sm:mx-0">
            <div
              className="flex sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 overflow-x-auto sm:overflow-visible pb-6 sm:pb-0 px-4 sm:px-0 snap-x snap-mandatory scroll-smooth touch-pan-x [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {TEMPLATES.map((item) => (
                <div
                  key={item.id}
                  className="snap-start shrink-0 w-[74vw] max-w-[275px] sm:w-auto sm:max-w-none bg-white rounded-2xl sm:rounded-3xl border border-purple-100 border-b-[3px] border-b-purple-200/80 p-3.5 sm:p-4 shadow-2xs hover:border-purple-200 transition-all flex flex-col justify-between text-left group"
                >
                  <div
                    onClick={() => onNavigate(`/katalog/${item.slug}`)}
                    className="cursor-pointer"
                  >
                    {/* Top Frame dengan Smartphone Mockup (Ratio 1:1) */}
                    <div
                      className="relative w-full aspect-square rounded-xl sm:rounded-2xl border border-purple-100/80 p-2.5 sm:p-3 mb-3 flex items-center justify-center overflow-hidden"
                      style={{ backgroundColor: item.frameBg }}
                    >
                      {/* Smartphone Mockup */}
                      <div className="relative h-[86%] aspect-[9/13] max-w-[150px] bg-neutral-950 rounded-[20px] p-1 sm:p-1.5 shadow-xl border border-neutral-800 overflow-hidden flex flex-col my-auto">
                        {/* Dynamic Island / Notch */}
                        <div className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-2 bg-neutral-900 rounded-full z-20 border border-neutral-800" />

                        {/* Inner Screen Preview */}
                        <div className="w-full h-full rounded-[15px] overflow-hidden relative bg-neutral-100 flex flex-col justify-end">
                          <img
                            src={item.image}
                            alt={item.title}
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />

                          {/* Overlay Kartu Undangan di Layar */}
                          <div className="relative z-10 p-2 bg-gradient-to-t from-black/85 via-black/40 to-transparent text-white text-center">
                            <p className="text-[8px] uppercase tracking-widest font-serif opacity-80">
                              Pawiwahan
                            </p>
                            <p className="text-[11px] font-serif font-bold tracking-wide leading-tight truncate">
                              {item.coupleName}
                            </p>
                            <p className="text-[7px] opacity-75 mt-0.5">{item.date}</p>
                            <div className="mt-1 inline-block px-1.5 py-0.5 bg-white/20 backdrop-blur-xs rounded-full text-[7px] font-semibold">
                              Buka Undangan
                            </div>
                          </div>
                        </div>
                      </div>
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
                      onClick={() => onNavigate(`/katalog/${item.slug}`)}
                      className="w-full !text-[0.85rem] !py-2.5 px-3 h-auto"
                    >
                      <Eye className="w-4 h-4 stroke-[2.2]" />
                      <span>Lihat Demo</span>
                    </Button>

                    {/* Tombol Pilih Template -> Checkout */}
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onNavigate(`/app/checkout/${item.slug}`)}
                      className="w-full !text-[0.85rem] !py-2.5 px-3 h-auto"
                    >
                      <span>Pilih Template</span>
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
                  Demo: {selectedDemo.title}
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
              className="relative rounded-2xl border border-purple-100/80 p-4 mb-4 flex items-center justify-center overflow-hidden"
              style={{ backgroundColor: selectedDemo.frameBg }}
            >
              <div className="relative w-[75%] max-w-[200px] aspect-[9/16] bg-neutral-950 rounded-[26px] p-2 border border-neutral-800 shadow-xl overflow-hidden flex flex-col">
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-12 h-3 bg-neutral-900 rounded-full z-20" />
                <div className="w-full h-full rounded-[18px] overflow-hidden relative">
                  <img
                    src={selectedDemo.image}
                    alt={selectedDemo.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-3 text-white text-center">
                    <p className="text-[10px] uppercase font-serif opacity-80">Pawiwahan</p>
                    <p className="text-sm font-serif font-bold">{selectedDemo.coupleName}</p>
                    <p className="text-[9px] opacity-75 mt-0.5">{selectedDemo.date}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Keterangan & Harga */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs font-bold text-neutral-500 uppercase">Harga Promo</span>
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
                  onNavigate(`/app/checkout/${selectedDemo.slug}`);
                  setSelectedDemo(null);
                }}
                className="w-full"
              >
                <span>Pilih Template Ini</span>
                <ExternalLink className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedDemo(null)}
                className="w-full text-xs"
              >
                Tutup Preview
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
