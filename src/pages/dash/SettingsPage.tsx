import React from "react";
import { Users, Pencil, Phone, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AdminProfileData, AdminSettingsData } from "@/lib/cache";

export interface SettingsPageProps {
  adminProfile: AdminProfileData;
  adminSettings: AdminSettingsData;
  setAdminSettings: React.Dispatch<React.SetStateAction<AdminSettingsData>>;
  onOpenEditProfile: () => void;
  onOpenLogoutModal: () => void;
  onSaveSettings: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  adminProfile,
  adminSettings,
  setAdminSettings,
  onOpenEditProfile,
  onOpenLogoutModal,
  onSaveSettings,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn md:animate-none">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profil Administrator & Kontak WhatsApp */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-[#7d6aee]" />
              <h3 className="text-sm font-extrabold text-neutral-900">
                Profil Administrator
              </h3>
            </div>
            <button
              type="button"
              onClick={onOpenEditProfile}
              className="text-xs font-extrabold text-[#7d6aee] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit Profil</span>
            </button>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50/50 border border-purple-100">
            <img
              src={adminProfile.avatar}
              alt={adminProfile.name}
              className="size-14 rounded-full object-cover border-2 border-[#7d6aee] shadow-sm shrink-0"
            />
            <div className="min-w-0">
              <h4 className="text-sm font-bold text-neutral-900 truncate">{adminProfile.name}</h4>
              <p className="text-xs text-neutral-500 truncate">{adminProfile.email}</p>
              <p className="text-xs font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <span>{adminProfile.phone || "+62 851-8797-8443"}</span>
              </p>
            </div>
          </div>

          <div className="space-y-2 text-xs text-neutral-500">
            <p>
              Perubahan foto profil, nama, dan nomor WhatsApp admin langsung disimpan ke cache browser secara otomatis.
            </p>
          </div>
        </div>

        {/* Payment Gateway Config */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-[#7d6aee]" />
              <h3 className="text-sm font-extrabold text-neutral-900">
                Metode Pembayaran
              </h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              Aktif
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">
                Bank Utama (BCA)
              </label>
              <input
                type="text"
                value={adminSettings.bankBca}
                onChange={(e) =>
                  setAdminSettings({ ...adminSettings, bankBca: e.target.value })
                }
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 border-b-[2px] border-b-neutral-300 bg-neutral-50 font-mono focus:outline-none focus:border-[#7d6aee] focus:border-b-[#7d6aee]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-700 block mb-1">
                Merchant QRIS Statis / Dinamis
              </label>
              <input
                type="text"
                value={adminSettings.qrisNmid}
                onChange={(e) =>
                  setAdminSettings({ ...adminSettings, qrisNmid: e.target.value })
                }
                className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 border-b-[2px] border-b-neutral-300 bg-neutral-50 font-mono focus:outline-none focus:border-[#7d6aee] focus:border-b-[#7d6aee]"
              />
            </div>

            <button
              type="button"
              onClick={onSaveSettings}
              className="w-full py-2.5 bg-[#7d6aee] hover:bg-[#6b58e0] text-white text-xs font-extrabold rounded-xl border border-[#6b58e0] border-b-[3px] border-b-[#513ecb] shadow-2xs hover:shadow-xs active:scale-[0.98] active:border-b-[2px] active:translate-y-[1px] transition-all cursor-pointer"
            >
              Simpan Pengaturan
            </button>
          </div>
        </div>

        {/* Tombol Logout */}
        <div className="bg-white p-5 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs lg:col-span-2">
          <Button
            variant="danger"
            size="lg"
            onClick={onOpenLogoutModal}
            className="w-full py-3.5 rounded-xl sm:rounded-2xl flex items-center justify-center cursor-pointer font-bold"
          >
            Keluar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
