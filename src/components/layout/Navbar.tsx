import React, { useState, useRef } from "react";
import { PATHS } from "@/routes";
import { Home, LayoutGrid, ShoppingBag, MessageCircle } from "lucide-react";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

interface NavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  onNavigate,
}) => {

  const loginPath = PATHS.login;

  const handleNav = (e: React.MouseEvent, href: string) => {
    e.preventDefault();
    onNavigate(href);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navLinks = [
    {
      label: "Beranda",
      href: PATHS.home,
      icon: <Home className="w-5 h-5" strokeWidth={1.5} />,
      isActive: (path: string) => path === PATHS.home,
    },
    {
      label: "Katalog",
      href: PATHS.katalog,
      icon: <LayoutGrid className="w-5 h-5" strokeWidth={1.5} />,
      isActive: (path: string) => path === PATHS.katalog,
    },
    {
      label: "Cara Pesan",
      href: PATHS.caraPesan,
      icon: <ShoppingBag className="w-5 h-5" strokeWidth={1.5} />,
      isActive: (path: string) => path === PATHS.caraPesan,
    },
    {
      label: "Kontak",
      href: PATHS.kontak,
      icon: <MessageCircle className="w-5 h-5" strokeWidth={1.5} />,
      isActive: (path: string) => path === PATHS.kontak,
    },
  ];

  return (
    <>
      <header
        id="satucerita-header"
        className="w-full sticky top-0 z-50 select-none bg-background/90 backdrop-blur-md border-b border-foreground/80"
      >
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Sisi Kiri: Logo & Title Satu Cerita */}
          <div className="flex items-center gap-2.5">
            <a
              id="satucerita-home-brand-logo"
              href={PATHS.home}
              onClick={(e) => handleNav(e, PATHS.home)}
              className="flex items-center gap-2.5 text-text-primary hover:opacity-90 transition-opacity"
            >
              <div className="size-10 sm:size-11 rounded-xl overflow-hidden shrink-0">
                <img
                  src="/logos/satucerita.png"
                  alt="Satu Cerita"
                  width="44"
                  height="44"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-lg md:text-xl tracking-tight leading-tight text-text-primary">
                  Satu Cerita
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Center Navigation Links (Minimalis tanpa bungkus, dengan outline bawah pada menu aktif) */}
          <nav
            id="satucerita-desktop-center-menu"
            className="hidden md:flex items-center gap-6 lg:gap-8 h-16"
          >
            {navLinks.map((item) => {
              const active = item.isActive(currentPath);
              return (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={(e) => handleNav(e, item.href)}
                  className={`relative h-full flex items-center text-sm lg:text-base transition-colors duration-200 cursor-pointer ${
                    active
                      ? "font-bold text-[#7d6aee] border-b-2 border-[#7d6aee]"
                      : "font-semibold text-text-secondary hover:text-text-primary border-b-2 border-transparent"
                  }`}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Right side navigation: LanguageSwitcher (mobile & desktop) and CTA Mulai Sekarang (desktop) */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0 z-10">
            {/* Language Switcher (Tersedia di desktop maupun mobile menggantikan tombol menu) */}
            <LanguageSwitcher />

            {/* Main CTA Button: 'Mulai Sekarang' dengan warna latar ungu (Desktop) */}
            <a
              id="satucerita-navbar-cta-button"
              href={loginPath}
              onClick={(e) => handleNav(e, loginPath)}
              className="hidden md:inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#7d6aee] hover:bg-[#6b58e0] text-white font-bold text-sm shadow-sm hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer select-none"
            >
              Mulai Sekarang
            </a>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
