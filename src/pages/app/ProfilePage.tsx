import React, { useState, useEffect } from "react";
import {
  Pencil,
  Check,
  AlertCircle,
  Lock,
  FileText,
  Phone,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  LogOut,
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
            <h3 className="text-base sm:text-lg font-black text-white tracking-tight truncate">
              {userProfile.name}
            </h3>
            <p className="text-xs text-purple-100 font-medium truncate mt-0.5">
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
          <InputGroup
            leadingAddon={
              <InputGroup.Prefix className="w-[92px] sm:w-[116px] px-2.5 sm:px-3.5 py-3 sm:py-3.5 justify-start text-left font-semibold text-neutral-700 text-base sm:text-[18px] shrink-0">
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
              className="font-semibold text-base sm:text-[18px] text-neutral-800 py-3 sm:py-3.5"
              placeholder="Masukkan nama lengkap"
              value={profileNameInput}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </InputGroup>

          {/* Input Nomor HP */}
          <InputGroup
            leadingAddon={
              <InputGroup.Prefix className="w-[92px] sm:w-[116px] px-2.5 sm:px-3.5 py-3 sm:py-3.5 justify-start text-left font-semibold text-neutral-700 text-base sm:text-[18px] shrink-0">
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
              className="font-semibold text-base sm:text-[18px] text-neutral-800 py-3 sm:py-3.5"
              placeholder="081234567890"
              value={profileWaInput}
              onChange={(e) => handleWaChange(e.target.value)}
            />
          </InputGroup>

          {/* Input Email */}
          <InputGroup
            leadingAddon={
              <InputGroup.Prefix className="w-[92px] sm:w-[116px] px-2.5 sm:px-3.5 py-3 sm:py-3.5 justify-start text-left font-semibold text-neutral-700 text-base sm:text-[18px] shrink-0">
                Email
              </InputGroup.Prefix>
            }
            trailingAddon={
              <span className="pr-3 flex items-center select-none" title="Email akun tidak dapat diedit">
                <Lock className="w-4 h-4 text-neutral-400 shrink-0" />
              </span>
            }
          >
            <InputBase
              readOnly
              className="font-semibold text-base sm:text-[18px] text-neutral-500 py-3 sm:py-3.5 bg-neutral-50/60 cursor-not-allowed select-all"
              placeholder="email@example.com"
              value={userProfile.email}
            />
          </InputGroup>
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
