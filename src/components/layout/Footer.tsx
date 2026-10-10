import React from "react";
import { PATHS } from "@/routes";
import {
  MessageCircleMore,
  Mail,
  Clock,
  Instagram,
  MapPin,
} from "lucide-react";

export interface FooterProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const Footer: React.FC<FooterProps> = ({
  currentPath = "/",
  onNavigate = (_path: string) => {},
}) => {


  const handleLinkClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    onNavigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const lintasanLinks = [
    { label: "Katalog", href: PATHS.katalog },
    { label: "Cara Pesan", href: PATHS.caraPesan },
    { label: "Kontak", href: PATHS.kontak },
    { label: "Kebijakan & Syarat", href: PATHS.kebijakan },
  ];

  return (
    <footer
      id="satucerita-footer"
      className="border-t border-[#383838] bg-[#292929] text-white pt-8 sm:pt-12 pb-[92px] sm:pb-[100px] md:pb-9 mt-auto select-none transition-colors"
    >
      {/* 1. Konten Utama Footer: max-w-6xl dengan gap antar-kolom lebih renggang */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col text-left items-start md:grid md:grid-cols-12 md:gap-12 lg:gap-16 xl:gap-20">
          {/* Brand, Logo & Slogan */}
          <div className="w-full md:col-span-5 lg:col-span-5 flex flex-col text-left items-start mb-10 sm:mb-12 md:mb-0">
            {/* Logo + Nama Web (SatuCerita) - Logo dikurangi 6px (38px / 42px), tanpa outline/border */}
            <a
              href={PATHS.home}
              onClick={(e) => handleLinkClick(e, PATHS.home)}
              className="flex items-center gap-3 group cursor-pointer"
            >
              <div className="size-[38px] sm:size-[42px] rounded-xl overflow-hidden shrink-0 group-hover:scale-105 transition-transform">
                <img
                  src="/logos/satucerita.png"
                  alt="SatuCerita Logo"
                  width="42"
                  height="42"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="text-xl sm:text-2xl font-black tracking-tight text-white transition-colors">
                SatuCerita
              </span>
            </a>

            {/* Slogan Utama & Secondary: Jarak atas dan bawah diperlebar */}
            <div className="mt-7 sm:mt-9 mb-2 sm:mb-4">
              <p className="text-lg sm:text-xl md:text-2xl font-extrabold text-white leading-snug">
                bagikan satu cerita istimewa ini
              </p>
              <p className="text-base sm:text-lg font-semibold text-neutral-300 mt-2 sm:mt-2.5 leading-relaxed">
                Buat Momen spesial lebih berkesan
              </p>
            </div>
          </div>

          {/* List Lintasan -> Judul 'PINTASAN' dengan jarak antar section lebih renggang */}
          <div className="w-full md:col-span-3 lg:col-span-3 flex flex-col text-left items-start mb-10 sm:mb-12 md:mb-0">
            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-[#ad9fff] mb-3.5 sm:mb-4">
              PINTASAN
            </h3>
            <ul className="flex flex-col gap-2.5 sm:gap-3 w-full">
              {lintasanLinks.map((link) => {
                const isActive = currentPath === link.href;

                return (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      onClick={(e) => handleLinkClick(e, link.href)}
                      className={`inline-block text-base sm:text-lg transition-colors duration-200 cursor-pointer ${
                        isActive
                          ? "font-medium text-white underline underline-offset-4 decoration-white/40"
                          : "font-medium text-neutral-300 hover:text-white"
                      }`}
                    >
                      {link.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* List Kontak -> Judul 'KONTAK' dengan jarak antar section lebih renggang */}
          <div className="w-full md:col-span-4 lg:col-span-4 flex flex-col text-left items-start mb-2 md:mb-0">
            <h3 className="text-sm sm:text-base font-extrabold uppercase tracking-wider text-[#ad9fff] mb-3.5 sm:mb-4">
              KONTAK
            </h3>
            <ul className="flex flex-col gap-2.5 sm:gap-3 w-full text-base sm:text-lg">
              {/* WhatsApp */}
              <li>
                <a
                  href="https://wa.me/6285187978443"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 text-neutral-300 hover:text-white transition-colors group cursor-pointer"
                >
                  <MessageCircleMore className="w-[18px] h-[18px] text-neutral-300 shrink-0 group-hover:text-white transition-colors" />
                  <span className="font-medium text-base sm:text-lg">
                    +62 851 8797 8443
                  </span>
                </a>
              </li>

              {/* Email */}
              <li>
                <a
                  href="mailto:satuceritadotid@gmail.com"
                  className="inline-flex items-center gap-2.5 text-neutral-300 hover:text-white transition-colors group cursor-pointer"
                >
                  <Mail className="w-[18px] h-[18px] text-neutral-300 shrink-0 group-hover:text-white transition-colors" />
                  <span className="font-medium text-base sm:text-lg">
                    satuceritadotid@gmail.com
                  </span>
                </a>
              </li>

              {/* Instagram */}
              <li>
                <a
                  href="https://instagram.com/satuceritaid"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 text-neutral-300 hover:text-white transition-colors group cursor-pointer"
                >
                  <Instagram className="w-[18px] h-[18px] text-neutral-300 shrink-0 group-hover:text-white transition-colors" />
                  <span className="font-medium text-base sm:text-lg">
                    @satuceritaid
                  </span>
                </a>
              </li>

              {/* Jam Operasional */}
              <li className="inline-flex items-center gap-2.5 text-neutral-300">
                <Clock className="w-[18px] h-[18px] text-neutral-300 shrink-0" />
                <span className="font-medium text-base sm:text-lg">
                  Setiap Hari: 08.00 - 22.00 WIB
                </span>
              </li>

              {/* Area Layanan */}
              <li className="inline-flex items-center gap-2.5 text-neutral-300">
                <MapPin className="w-[18px] h-[18px] text-neutral-300 shrink-0" />
                <span className="font-medium text-base sm:text-lg">
                  Seluruh Indonesia (Online)
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* 2. Separator 100% Width (Dari Ujung ke Ujung) */}
      <hr className="w-full border-t border-white/10 mt-8 sm:mt-10 mb-4 sm:mb-5" />

      {/* 3. Bagian Bawah: Hak Cipta */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-left">
          <p className="text-sm sm:text-base font-medium text-neutral-400 leading-snug">
            ©2026 SatuCerita. Semua Hak Dilindungi
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
