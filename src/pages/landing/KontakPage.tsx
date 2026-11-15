import React from "react";
import { Navbar } from "@/components/layout/Navbar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";
import { SubpageHeader } from "@/components/layout/SubpageHeader";
import { MessageCircle } from "lucide-react";
import { useT } from "@/i18n";
import type { TKey } from "@/i18n";

interface KontakPageProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

interface ContactCardItem {
  id: string;
  appName: string;
  contactValue: string;
  actionKey: TKey;
  link: string;
  logoSrc: string;
  btnStyle: string;
  isExternal?: boolean;
}

// Urutan: WhatsApp, Gmail, Instagram, TikTok
const CONTACT_ITEMS: ContactCardItem[] = [
  {
    id: "whatsapp",
    appName: "WhatsApp",
    contactValue: "+62 851 8797 8443",
    actionKey: "contact.whatsapp.cta",
    link: "https://wa.me/6285187978443",
    logoSrc: "/logos/whatsapp.webp",
    // Warna hijau lebih redup/gelap agar kontras tinggi dengan teks putih
    btnStyle: "bg-[#188c43] hover:bg-[#137336] shadow-[#188c43]/20",
    isExternal: true,
  },
  {
    id: "gmail",
    appName: "Gmail",
    contactValue: "satuceritadotid@gmail.com",
    actionKey: "contact.gmail.cta",
    link: "mailto:satuceritadotid@gmail.com",
    logoSrc: "/logos/gmail.webp",
    btnStyle: "bg-[#EA4335] hover:bg-[#d93025] shadow-[#EA4335]/20",
    isExternal: true,
  },
  {
    id: "instagram",
    appName: "Instagram",
    contactValue: "@satuceritaid",
    actionKey: "contact.instagram.cta",
    link: "https://instagram.com/satuceritaid",
    logoSrc: "/logos/instagram.webp",
    btnStyle: "bg-[#E1306C] hover:bg-[#cf2560] shadow-[#E1306C]/20",
    isExternal: true,
  },
  {
    id: "tiktok",
    appName: "TikTok",
    contactValue: "@satuceritaid",
    actionKey: "contact.tiktok.cta",
    link: "https://www.tiktok.com/@satuceritaid",
    logoSrc: "/logos/tiktok.webp",
    btnStyle: "bg-[#010101] hover:bg-[#1a1a1a] shadow-black/20",
    isExternal: true,
  },
];

export const KontakPage: React.FC<KontakPageProps> = ({
  currentPath = "/kontak",
  onNavigate = (_path: string) => {},
}) => {
  const { t } = useT();

  return (
    <div className="min-h-screen bg-[#faf9ff] text-text-primary flex flex-col font-sans selection:bg-[#7d6aee]/20 selection:text-[#7d6aee]">
      {/* 1. Navbar Satu Cerita */}
      <Navbar currentPath={currentPath} onNavigate={onNavigate} />

      {/* 2. Header Bagian Khusus */}
      <SubpageHeader
        badgeText={t("contact.badge")}
        badgeIcon={<MessageCircle className="w-3.5 h-3.5 text-[#7d6aee] shrink-0" />}
        titlePrefix={t("contact.titlePrefix")}
        titleHighlight={t("contact.titleHighlight")}
        description={t("contact.desc")}
      />

      {/* 3. Konten Utama: Card Kontak Sederhana (WhatsApp, Gmail, Instagram, TikTok) */}
      <main className="flex-1 bg-[#faf9ff] py-12 sm:py-16 md:py-20 select-none">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {CONTACT_ITEMS.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 hover:border-purple-200 p-6 sm:p-7 shadow-2xs hover:shadow-xs transition-all duration-300 ease-out hover:-translate-y-1 flex flex-col items-center text-center group"
              >
                {/* 1. Icon (Asset Logo Resmi dari public/logos tanpa border radius, dengan shadow lembut) */}
                <div className="mb-4 transition-transform group-hover:scale-105 duration-200 flex items-center justify-center">
                  <img
                    src={item.logoSrc}
                    alt={`${item.appName} Logo`}
                    width={64}
                    height={64}
                    className="w-14 h-14 sm:w-16 sm:h-16 object-contain rounded-none drop-shadow-[0_2px_4px_rgba(16,24,40,0.08)] select-none pointer-events-none"
                    loading="lazy"
                  />
                </div>

                {/* 2. Nama Aplikasi */}
                <h3 className="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
                  {item.appName}
                </h3>

                {/* 3. Kontak / Username dari Aplikasinya (Ukuran diperkecil 2px & warna lebih pudar) */}
                <p className="text-[18px] sm:text-[16px] md:text-[16px] font-semibold sm:font-bold md:font-bold text-neutral-500 mt-1.5 mb-6 break-all select-text tracking-tight">
                  {item.contactValue}
                </p>

                {/* 4. Tombol CTA (Teks diperbesar & dipertebal 100, warna mengikuti logo aplikasi) */}
                <a
                  href={item.id === "whatsapp" ? `${item.link}?text=${encodeURIComponent(t("wa.consult"))}` : item.link}
                  target={item.isExternal ? "_blank" : undefined}
                  rel={item.isExternal ? "noopener noreferrer" : undefined}
                  className={`mt-auto w-full py-2.5 sm:py-3 px-4 rounded-xl font-bold text-sm sm:text-base text-white flex items-center justify-center transition-all duration-200 hover:opacity-95 active:scale-[0.98] shadow-[0px_1px_2px_rgba(16,24,40,0.05)] hover:shadow-[0px_4px_8px_-2px_rgba(16,24,40,0.12),0px_2px_4px_-2px_rgba(16,24,40,0.06)] ${item.btnStyle}`}
                >
                  <span>{t(item.actionKey)}</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 4. Reusable Footer */}
      <Footer currentPath={currentPath} onNavigate={onNavigate} />

      {/* 5. Bottom Navigation Bar */}
      <BottomNav
        currentPath={currentPath}
        onNavigate={onNavigate}
        activeTab="kontak"
      />
    </div>
  );
};

export default KontakPage;
