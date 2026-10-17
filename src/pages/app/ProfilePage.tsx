import React, { useState, useEffect } from "react";
import {
  Pencil,
  Check,
  AlertCircle,
  Globe,
  FileText,
  Phone,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  LogOut,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { InputBase } from "@/components/ui/input";
import { InputGroup } from "@/components/ui/input-group";
import { PATHS } from "@/routes";
import { UserProfileData } from "@/lib/cache";

export interface ProfilePageProps {
  userProfile: UserProfileData;
  onUpdateProfile: (updated: UserProfileData) => void;
  onOpenEditModal: () => void;
  onOpenLogoutModal: () => void;
  onNavigate: (path: string) => void;
  invitationsCount?: number;
  ordersCount?: number;
  rsvpCount?: number;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({
  userProfile,
  onUpdateProfile,
  onOpenEditModal,
  onOpenLogoutModal,
  onNavigate,
  invitationsCount = 0,
  ordersCount = 0,
  rsvpCount = 0,
}) => {
  const getInitialWaDigits = (phoneStr: string) => {
    const digits = phoneStr.replace(/\D/g, "");
    if (digits.startsWith("62")) return digits.slice(2);
    if (digits.startsWith("0")) return digits.slice(1);
    return digits || "85187978443";
  };

  const [profileNameInput, setProfileNameInput] = useState(userProfile.name);
  const [profileWaInput, setProfileWaInput] = useState(() => getInitialWaDigits(userProfile.phone));
  const [profileLanguage, setProfileLanguage] = useState<"id" | "en">("id");
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);

  useEffect(() => {
    setProfileNameInput(userProfile.name);
    setProfileWaInput(getInitialWaDigits(userProfile.phone));
  }, [userProfile]);

  const handleNameChange = (val: string) => {
    setProfileNameInput(val);
    onUpdateProfile({ ...userProfile, name: val });
  };

  const handleWaChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    setProfileWaInput(clean);
    onUpdateProfile({ ...userProfile, phone: `+62 ${clean}` });
  };

  const langOptions = [
    { value: "id" as const, label: "Indonesia" },
    { value: "en" as const, label: "English" },
  ];

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn">
      {/* Header Profil Card (Latar Ungu Brand SatuCerita) */}
      <div className="bg-[#7d6aee] rounded-3xl p-5 sm:p-6 border border-purple-400/30 border-b-[3px] border-b-[#5c47dc] shadow-sm text-white">
        <div className="flex items-center gap-3.5 sm:gap-4.5 min-w-0">
          <div className="relative shrink-0">
            <img
              src={userProfile.avatar}
              alt={userProfile.name}
              className="size-16 sm:size-18 rounded-full object-cover border-2 border-white shadow-sm"
            />
            <button
              type="button"
              onClick={onOpenEditModal}
              className="absolute -bottom-0.5 -right-0.5 size-6 sm:size-7 rounded-full bg-white text-[#7d6aee] hover:bg-purple-50 shadow-md border border-purple-200/60 flex items-center justify-center transition-all cursor-pointer active:scale-95"
              title="Edit Profil"
              aria-label="Edit Profil"
            >
              <Pencil className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#7d6aee]" />
            </button>
          </div>

          <div className="min-w-0 flex-1 flex flex-col justify-center">
            {/* Task 1: Mobile = 20px name, Desktop = 24px */}
            <h3 className="text-[20px] md:text-[24px] font-black text-white tracking-tight truncate">
              {userProfile.name}
            </h3>
            {/* Task 1: Mobile = 16px email */}
            <p className="text-[16px] text-purple-100 font-medium truncate mt-0.5">
              {userProfile.email}
            </p>
          </div>
        </div>

        {/* Stat Ringkas User */}
        <div className="grid grid-cols-3 gap-2 pt-4 mt-4 border-t border-white/20 text-center">
          <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-xs border border-white/10">
            <strong className="text-sm sm:text-base font-black text-white block">
              {invitationsCount}
            </strong>
            <span className="text-[10px] text-purple-100 font-semibold uppercase tracking-wider">
              Undangan
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-xs border border-white/10">
            <strong className="text-sm sm:text-base font-black text-white block">
              {ordersCount}
            </strong>
            <span className="text-[10px] text-purple-100 font-semibold uppercase tracking-wider">
              Pesanan
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-xs border border-white/10">
            <strong className="text-sm sm:text-base font-black text-white block">
              {rsvpCount}
            </strong>
            <span className="text-[10px] text-purple-100 font-semibold uppercase tracking-wider">
              Tamu RSVP
            </span>
          </div>
        </div>
      </div>

      {/* Card INFORMASI PENGGUNA */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs space-y-3.5">
        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block px-1 pb-0.5">
          INFORMASI PENGGUNA
        </span>

        <div className="space-y-3">
          {/* Input Nama */}
          {/* Task 1: Mobile 14px for user info card */}
          <InputGroup
            leadingAddon={
              <InputGroup.Prefix className="w-[92px] sm:w-[116px] px-2.5 sm:px-3.5 py-3 sm:py-3.5 justify-start text-left font-semibold text-neutral-700 text-[14px] sm:text-base md:text-[16px] shrink-0">
                Nama
              </InputGroup.Prefix>
            }
            trailingAddon={
              <span className="pr-3 flex items-center select-none">
                {profileNameInput.trim() ? (
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
              </span>
            }
          >
            <InputBase
              className="font-semibold text-[14px] sm:text-base md:text-[16px] text-neutral-800 py-3 sm:py-3.5"
              placeholder="Masukkan nama lengkap"
              value={profileNameInput}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </InputGroup>

          {/* Input Nomor HP */}
          <InputGroup
            leadingAddon={
              <InputGroup.Prefix className="w-[92px] sm:w-[116px] px-2.5 sm:px-3.5 py-3 sm:py-3.5 justify-start text-left font-semibold text-neutral-700 text-[14px] sm:text-base md:text-[16px] shrink-0">
                Nomor HP
              </InputGroup.Prefix>
            }
            trailingAddon={
              <span className="pr-3 flex items-center select-none">
                {profileWaInput.trim() ? (
                  <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                )}
              </span>
            }
          >
            <InputBase
              className="font-semibold text-[14px] sm:text-base md:text-[16px] text-neutral-800 py-3 sm:py-3.5"
              placeholder="081234567890"
              value={profileWaInput}
              onChange={(e) => handleWaChange(e.target.value)}
            />
          </InputGroup>

          {/* Task 4: Language Dropdown (replaces Email input) */}
          <div className="flex items-stretch rounded-xl border border-neutral-200 bg-white overflow-hidden focus-within:border-[#7d6aee] transition-colors">
            {/* Prefix */}
            <div className="w-[92px] sm:w-[116px] px-2.5 sm:px-3.5 py-3 sm:py-3.5 flex items-center justify-start border-r border-neutral-200 font-semibold text-neutral-700 text-[14px] sm:text-base md:text-[16px] shrink-0">
              <Globe className="w-4 h-4 text-neutral-400 mr-1.5 shrink-0" />
              <span>Bahasa</span>
            </div>
            {/* Dropdown */}
            <div className="relative flex-1">
              <button
                type="button"
                onClick={() => setIsLangDropdownOpen((v) => !v)}
                className="w-full h-full flex items-center justify-between px-3 py-3 sm:py-3.5 text-[14px] sm:text-base md:text-[16px] font-semibold text-neutral-800 bg-transparent cursor-pointer focus:outline-none"
              >
                <span>{langOptions.find((o) => o.value === profileLanguage)?.label}</span>
                <ChevronDown
                  className={`w-4 h-4 text-neutral-400 transition-transform duration-150 shrink-0 ${isLangDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>
              {isLangDropdownOpen && (
                <div className="absolute top-full left-0 right-0 z-20 bg-white border border-neutral-200 rounded-xl shadow-lg mt-1 overflow-hidden">
                  {langOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setProfileLanguage(opt.value);
                        setIsLangDropdownOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 text-[14px] font-semibold transition-colors cursor-pointer ${
                        profileLanguage === opt.value
                          ? "bg-purple-50 text-[#7d6aee]"
                          : "text-neutral-700 hover:bg-neutral-50"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Bantuan & Informasi */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs space-y-1">
        <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block px-2 pb-1.5">
          Bantuan & Informasi
        </span>

        <button
          type="button"
          onClick={() => onNavigate(PATHS.caraPesan)}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-purple-50/60 transition-colors text-left cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-purple-50 text-[#7d6aee] flex items-center justify-center shrink-0">
              <FileText className="w-4.5 h-4.5" />
            </div>
            <strong className="text-sm sm:text-base font-bold text-neutral-800 block">
              Cara Pesan Undangan
            </strong>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#7d6aee] transition-colors" />
        </button>

        <a
          href="https://wa.me/6285187978443?text=Halo%20Satu%20Cerita,%20saya%20butuh%20bantuan%20terkait%20akun%20saya"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-purple-50/60 transition-colors text-left cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Phone className="w-4.5 h-4.5" />
            </div>
            <strong className="text-sm sm:text-base font-bold text-neutral-800 block">
              Hubungi Customer Service Kami
            </strong>
          </div>
          <ExternalLink className="w-4 h-4 text-neutral-400 group-hover:text-emerald-600 transition-colors" />
        </a>

        <button
          type="button"
          onClick={() => onNavigate(PATHS.kontak)}
          className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-purple-50/60 transition-colors text-left cursor-pointer group"
        >
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-purple-50 text-[#7d6aee] flex items-center justify-center shrink-0">
              <HelpCircle className="w-4.5 h-4.5" />
            </div>
            <strong className="text-sm sm:text-base font-bold text-neutral-800 block">
              Kontak & Media Sosial Kami
            </strong>
          </div>
          <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#7d6aee] transition-colors" />
        </button>
      </div>

      {/* Tombol Logout */}
      <div className="pt-2">
        <Button
          variant="danger"
          size="lg"
          onClick={onOpenLogoutModal}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
        >
          <LogOut className="w-4 h-4 text-white" />
          <span>Log out</span>
        </Button>
        <p className="text-[11px] text-center text-neutral-400 font-medium mt-2">
          Anda perlu masuk kembali untuk mengelola undangan
        </p>
      </div>
    </div>
  );
};

export default ProfilePage;
