import React, { useState, useRef, useEffect } from "react";
import { PATHS } from "@/routes";
import { Bell, Pencil, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

export type DashPeriodType =
  | "Harian"
  | "Mingguan"
  | "Bulanan"
  | "Kuartalan"
  | "Tahunan"
  | "Semua";

export interface AppNavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  activeTab?: string;
  title?: string;
  action?: React.ReactNode;
  hideAvatar?: boolean;
  onEditProfile?: () => void;
  onLogout?: () => void;
  period?: DashPeriodType;
  onPeriodChange?: (period: DashPeriodType) => void;
  userProfile?: {
    name: string;
    email: string;
    avatar?: string;
    avatarInitial?: string;
    avatarSrc?: string;
  };
}

export const AppNavbar: React.FC<AppNavbarProps> = ({
  currentPath = "/app/home",
  onNavigate,
  activeTab = "home",
  title,
  action,
  hideAvatar = false,
  onEditProfile,
  onLogout,
  period = "Bulanan",
  onPeriodChange,
  userProfile: propUserProfile,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(true);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  const getPageTitle = () => {
    if (title) return title;
    switch (activeTab) {
      case "home":
        return "Undangan";
      case "task":
      case "proses":
      case "pesanan":
        return "Pesanan";
      case "profile":
      case "profil":
        return "Profil";
      case "katalog":
        return "Katalog Template";
      default:
        return "Satu Cerita App";
    }
  };

  const pageTitle = getPageTitle();

  const getStoredProfile = () => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("satucerita_user_profile");
        if (saved) return JSON.parse(saved);
      } catch (_e) {}
    }
    return null;
  };

  const [cachedProfile, setCachedProfile] = useState(getStoredProfile);

  useEffect(() => {
    const handleProfileSync = () => {
      setCachedProfile(getStoredProfile());
    };
    window.addEventListener("satucerita_profile_updated", handleProfileSync);
    window.addEventListener("storage", handleProfileSync);
    return () => {
      window.removeEventListener("satucerita_profile_updated", handleProfileSync);
      window.removeEventListener("storage", handleProfileSync);
    };
  }, []);

  // Tanpa data bawaan: profil selalu dikirim dari akun yang login (lihat UserApp / AdminDash)
  const defaultUser = {
    name: "Pengguna",
    email: "",
    avatarInitial: "P",
    avatar: "",
    avatarSrc: "",
  };

  const userProfile = propUserProfile || cachedProfile || defaultUser;

  const avatarDisplaySrc =
    userProfile.avatar ||
    (userProfile as any).avatarSrc ||
    "";

  const handleNav = (href: string) => {
    setIsMenuOpen(false);
    onNavigate(href);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-purple-100 border-b-[2px] border-b-purple-200/80 bg-white/95 backdrop-blur-md px-4 sm:px-6 md:px-8 h-16 flex items-center justify-between transition-all select-none shadow-2xs">
      {/* SISI KIRI: Judul halaman saat ini */}
      <div className="flex items-center gap-2">
        <h1 className="text-lg md:text-xl font-extrabold tracking-tight leading-tight text-text-primary">
          {pageTitle}
        </h1>
      </div>

      {/* SISI KANAN: Action Opsional + Lonceng Notifikasi & Avatar Profil */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {action}
        <button
          type="button"
          onClick={() => setHasUnreadNotification(false)}
          className="size-9 sm:size-10 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary hover:bg-neutral-100 transition-colors cursor-pointer relative"
          title="Notifikasi"
          aria-label="Lihat Notifikasi"
        >
          <Bell className="w-5 h-5" />
          {hasUnreadNotification && (
            <span className="absolute top-2 right-2 size-2 bg-[#7d6aee] rounded-full ring-2 ring-white" />
          )}
        </button>

        {/* Dropdown periode di navbar atas dashboard */}
        {activeTab === "overview" && onPeriodChange && (
          <div className="flex items-center">
            <div className="relative">
              <select
                value={period}
                onChange={(e) => onPeriodChange(e.target.value as DashPeriodType)}
                aria-label="Pilih Periode Dashboard"
                className="appearance-none bg-purple-50 hover:bg-purple-100 text-[#7d6aee] font-extrabold text-xs py-1.5 pl-3 pr-7 rounded-xl border border-purple-200 border-b-[2px] border-b-purple-300 shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#7d6aee]/30 transition-all cursor-pointer"
              >
                <option value="Harian">Harian</option>
                <option value="Mingguan">Mingguan</option>
                <option value="Bulanan">Bulanan</option>
                <option value="Kuartalan">Kuartalan</option>
                <option value="Tahunan">Tahunan</option>
                <option value="Semua">Semua</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[#7d6aee] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none stroke-[2.5]" />
            </div>
          </div>
        )}


      </div>
    </header>
  );
};

export default AppNavbar;
