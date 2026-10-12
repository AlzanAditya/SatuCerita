import React, { useState, useRef, useEffect } from "react";
import { PATHS } from "@/routes";
import { Bell, Pencil } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";

export interface AppNavbarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  activeTab?: string;
  title?: string;
  action?: React.ReactNode;
  hideAvatar?: boolean;
  onEditProfile?: () => void;
  onLogout?: () => void;
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

  const defaultUser = {
    name: "Alzan Bella",
    email: "student@satucerita.com",
    avatarInitial: "AB",
    avatar: "https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80",
    avatarSrc: "https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80",
  };

  const userProfile = propUserProfile || cachedProfile || defaultUser;

  const avatarDisplaySrc =
    userProfile.avatar ||
    (userProfile as any).avatarSrc ||
    "https://www.untitledui.com/images/avatars/olivia-rhye?fm=webp&q=80";

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

        {!hideAvatar && activeTab !== "profile" && activeTab !== "profil" && activeTab !== "settings" && activeTab !== "pengaturan" && (
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-expanded={isMenuOpen}
              aria-label="User Account Menu"
              className="rounded-full cursor-pointer hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-100 flex items-center justify-center"
            >
              <Avatar
                key={avatarDisplaySrc}
                border
                size="md"
                alt={userProfile.name}
                src={avatarDisplaySrc}
              />
            </button>

            {/* Pop-Up Modal Menu saat Avatar diklik */}
            <div
              className={`absolute right-0 top-full mt-2 w-56 sm:w-64 transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] z-50 ${
                isMenuOpen
                  ? "translate-y-0 opacity-100 pointer-events-auto scale-100"
                  : "-translate-y-3 opacity-0 pointer-events-none scale-95"
              }`}
            >
              <div className="bg-white border border-neutral-200/90 shadow-[0px_14px_35px_rgba(0,0,0,0.12)] rounded-2xl p-3 sm:p-3.5 text-neutral-900">
                <div className="pb-2.5 mb-2.5 border-b border-neutral-100">
                  <p className="text-xs sm:text-sm font-bold text-neutral-900 tracking-tight leading-tight truncate">
                    {userProfile.name}
                  </p>
                  <p className="text-[11px] text-neutral-500 font-medium mt-0.5 truncate">
                    {userProfile.email}
                  </p>
                </div>

                <div className="space-y-1.5">
                  {onEditProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        onEditProfile();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 font-bold text-xs sm:text-sm py-2 rounded-lg sm:rounded-xl transition-all cursor-pointer text-center select-none"
                    >
                      <Pencil className="w-3.5 h-3.5 text-[#7d6aee]" />
                      <span>Edit Profil</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      if (onLogout) {
                        onLogout();
                      } else {
                        handleNav(PATHS.home);
                      }
                    }}
                    className="w-full bg-gradient-to-r from-[#7d6aee] to-[#ad9fff] hover:opacity-95 text-white font-bold text-xs sm:text-sm py-2 sm:py-2.5 rounded-lg sm:rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.99] text-center select-none"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default AppNavbar;
