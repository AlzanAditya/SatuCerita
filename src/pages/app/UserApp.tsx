import React, { useState, useEffect, useMemo } from "react";
import { PATHS } from "@/routes";
import {
  Home,
  ShoppingBag,
  UserRound,
  SquareArrowOutUpRight,
  Plus,
  LogOut,
  X,
  Upload,
  LayoutGrid,
} from "lucide-react";
import { AppNavbar } from "@/components/app/AppNavbar";
import { Button } from "@/components/ui/Button";
import {
  getUserProfileCache,
  saveUserProfileCache,
  convertFileToDataUrl,
  DEFAULT_USER_PROFILE,
  UserProfileData,
} from "@/lib/cache";
import { UndanganPage } from "./UndanganPage";
import { PesananPage } from "./PesananPage";
import { ProfilePage } from "./ProfilePage";
import { UserAppProps, UserInvitation, OrderItem } from "./types";

export * from "./types";

export const UserApp: React.FC<UserAppProps> = ({
  activeTab: propActiveTab = "home",
  onNavigate,
  currentPath = "/app/home",
}) => {
  const prefix = "/app";

  // Determine current active tab
  const activeTab = useMemo(() => {
    if (propActiveTab) {
      if (propActiveTab === "task" || propActiveTab === "bayar") return "proses";
      return propActiveTab;
    }
    if (
      currentPath.includes("/proses") ||
      currentPath.includes("/task") ||
      currentPath.includes("/pesanan") ||
      currentPath.includes("/bayar")
    ) {
      return "proses";
    }
    if (currentPath.includes("/profile") || currentPath.includes("/profil")) {
      return "profile";
    }
    return "home";
  }, [propActiveTab, currentPath]);

  // Selected Order for Detail View
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // User Profile
  const [userProfile, setUserProfile] = useState<UserProfileData>(() => getUserProfileCache());

  useEffect(() => {
    saveUserProfileCache(userProfile);
  }, [userProfile]);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);
  const [editPhone, setEditPhone] = useState(userProfile.phone);
  const [editAvatarUrl, setEditAvatarUrl] = useState(userProfile.avatar);

  // Logout Confirmation Modal
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Toast Notice
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3000);
  };

  // Invitations State
  const [invitations, setInvitations] = useState<UserInvitation[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("satucerita_invitations_v2");
        if (saved) return JSON.parse(saved);
      } catch (_e) {}
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("satucerita_invitations_v2", JSON.stringify(invitations));
      } catch (_e) {}
    }
  }, [invitations]);

  // Orders State
  const [orders, setOrders] = useState<OrderItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("satucerita_orders_v2");
        if (saved) return JSON.parse(saved);
      } catch (_e) {}
    }
    return [];
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("satucerita_orders_v2", JSON.stringify(orders));
      } catch (_e) {}
    }
  }, [orders]);

  // Save profile changes
  const handleSaveProfile = () => {
    const updated: UserProfileData = {
      ...userProfile,
      name: editName,
      phone: editPhone,
      avatar: editAvatarUrl,
    };
    setUserProfile(updated);
    saveUserProfileCache(updated);
    setIsEditProfileOpen(false);
    showToast("Profil berhasil diperbarui dan disimpan ke cache!");
  };

  // Perform logout
  const handlePerformLogout = () => {
    setIsLogoutModalOpen(false);
    onNavigate(PATHS.home);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Avatar upload handler
  const handleAvatarFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const dataUrl = await convertFileToDataUrl(file);
        setEditAvatarUrl(dataUrl);
      } catch (_err) {
        showToast("Gagal membaca file gambar.");
      }
    }
  };

  const handleConfirmPaid = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: "paid" as const } : o))
    );
  };

  // Determine App Bar Title
  const getAppNavbarTitle = () => {
    if (selectedOrderId) return "Detail Pesanan";
    if (activeTab === "home") return "Undangan";
    if (activeTab === "proses") return "Pesanan";
    if (activeTab === "profile") return "Profil Saya";
    return "Satu Cerita App";
  };

  return (
    <div className="min-h-screen bg-[#faf9ff] flex flex-col md:flex-row font-sans text-neutral-800 pb-20 md:pb-0 select-none">
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-purple-100 min-h-screen h-screen sticky top-0 shrink-0 z-30 justify-between p-4 lg:p-5">
        <div className="flex flex-col gap-6">
          {/* Logo / Brand Header */}
          <div className="flex items-center justify-between pb-4 border-b border-purple-50">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-gradient-to-tr from-[#7d6aee] to-[#a394ff] flex items-center justify-center text-white font-black shadow-xs text-sm">
                SC
              </div>
              <div>
                <span className="text-base font-black tracking-tight text-neutral-900 block leading-tight">
                  Satu<span className="text-[#7d6aee]">Cerita</span>
                </span>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Dashboard Pengguna
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onNavigate(PATHS.home);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              title="Ke Halaman Web Utama"
              className="p-1.5 text-neutral-400 hover:text-[#7d6aee] hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
            >
              <SquareArrowOutUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Sidebar Menu Items */}
          <nav className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 px-3 pb-1 block">
              Menu Utama
            </span>

            {/* 1. Undangan Saya */}
            <button
              type="button"
              onClick={() => {
                setSelectedOrderId(null);
                onNavigate(`${prefix}/home`);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-all cursor-pointer ${
                !selectedOrderId && activeTab === "home"
                  ? "bg-[#7d6aee] text-white shadow-xs font-bold"
                  : "text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Home className="w-4 h-4" />
                <span>Undangan Saya</span>
              </div>
              {invitations.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                    !selectedOrderId && activeTab === "home"
                      ? "bg-white/20 text-white"
                      : "bg-purple-100 text-[#7d6aee]"
                  }`}
                >
                  {invitations.length}
                </span>
              )}
            </button>

            {/* 2. Pesanan & Tagihan */}
            <button
              type="button"
              onClick={() => {
                setSelectedOrderId(null);
                onNavigate(`${prefix}/proses`);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-all cursor-pointer ${
                selectedOrderId || activeTab === "proses"
                  ? "bg-[#7d6aee] text-white shadow-xs font-bold"
                  : "text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4" />
                <span>Pesanan &amp; Tagihan</span>
              </div>
              {orders.filter((o) => o.status === "pending").length > 0 && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800">
                  {orders.filter((o) => o.status === "pending").length}
                </span>
              )}
            </button>

            {/* 3. Profil Akun */}
            <button
              type="button"
              onClick={() => {
                setSelectedOrderId(null);
                onNavigate(`${prefix}/profile`);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-all cursor-pointer ${
                !selectedOrderId && activeTab === "profile"
                  ? "bg-[#7d6aee] text-white shadow-xs font-bold"
                  : "text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <UserRound className="w-4 h-4" />
                <span>Profil Akun</span>
              </div>
            </button>

            {/* 4. Katalog Template */}
            <button
              type="button"
              onClick={() => {
                onNavigate(PATHS.katalog);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs lg:text-sm font-semibold text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900 transition-all cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <LayoutGrid className="w-4 h-4" />
                <span>Katalog Template</span>
              </div>
            </button>
          </nav>
        </div>

        {/* SIDEBAR FOOTER: USER AVATAR + NAMA & EMAIL + LOGOUT */}
        <div className="pt-4 border-t border-neutral-100">
          <div className="flex items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-neutral-50 border border-neutral-200/70">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={userProfile.avatar}
                alt={userProfile.name}
                className="size-9 rounded-full object-cover border border-[#7d6aee]/30 shrink-0 shadow-2xs"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-neutral-900 truncate leading-tight">
                  {userProfile.name}
                </p>
                <p className="text-[11px] text-neutral-500 truncate leading-tight">
                  {userProfile.email}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              title="Keluar dari akun"
              className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
              aria-label="Tombol Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Container Right Side */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        {/* Top Navbar (Mobile only) */}
        <div className="md:hidden">
          <AppNavbar
            currentPath={currentPath}
            onNavigate={onNavigate}
            activeTab={activeTab}
            title={getAppNavbarTitle()}
            userProfile={{
              name: userProfile.name,
              email: userProfile.email,
              avatar: userProfile.avatar,
            }}
          />
        </div>

        {/* Desktop Top Header Bar for Breadcrumbs & Title */}
        <header className="hidden md:flex items-center justify-between px-6 lg:px-8 py-4 bg-white border-b border-purple-50 shrink-0">
          <div>
            <h1 className="text-lg font-black text-neutral-900 tracking-tight">
              {getAppNavbarTitle()}
            </h1>
            <p className="text-xs text-neutral-400">
              {activeTab === "home" && "Kelola dan pantau undangan digital yang telah Anda buat."}
              {activeTab === "proses" && "Daftar pesanan aktif dan status proses verifikasi pembayaran."}
              {activeTab === "profile" && "Informasi akun dan pengaturan data kontak Satu Cerita."}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                onNavigate(PATHS.katalog);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#7d6aee] text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Buat Undangan Baru</span>
            </button>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 w-full max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 animate-fadeIn">
          {activeTab === "home" && (
            <UndanganPage
              invitations={invitations}
              onNavigate={onNavigate}
              showToast={showToast}
            />
          )}

          {activeTab === "proses" && (
            <PesananPage
              orders={orders}
              selectedOrderId={selectedOrderId}
              setSelectedOrderId={setSelectedOrderId}
              onNavigate={onNavigate}
              onConfirmPaid={handleConfirmPaid}
              showToast={showToast}
            />
          )}

          {activeTab === "profile" && (
            <ProfilePage
              userProfile={userProfile}
              onUpdateProfile={setUserProfile}
              onOpenEditModal={() => {
                setEditName(userProfile.name);
                setEditPhone(userProfile.phone);
                setEditAvatarUrl(userProfile.avatar);
                setIsEditProfileOpen(true);
              }}
              onOpenLogoutModal={() => setIsLogoutModalOpen(true)}
              onNavigate={onNavigate}
              invitationsCount={invitations.length}
              ordersCount={orders.length}
              rsvpCount={invitations.reduce((acc, i) => acc + i.guestCount, 0)}
            />
          )}

          {/* Global Toast */}
          {toastNotice && (
            <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold shadow-xl animate-fadeIn flex items-center gap-2">
              <span>{toastNotice}</span>
            </div>
          )}
        </main>

        {/* Floating Bottom Nav (Mobile only) */}
        <nav
          id="satucerita-app-bottom-navbar"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-purple-100 backdrop-blur-lg shadow-lg select-none"
          aria-label="Satu Cerita App Navigation"
        >
          <div className="max-w-md mx-auto grid grid-cols-4 h-16 px-1">
            <button
              type="button"
              onClick={() => {
                setSelectedOrderId(null);
                onNavigate(`${prefix}/home`);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                !selectedOrderId && activeTab === "home"
                  ? "text-[#7d6aee] font-bold"
                  : "text-neutral-500 hover:text-neutral-900 font-semibold"
              }`}
              aria-label="Undangan"
            >
              <Home className="w-5 h-5" />
              <span
                className={`text-[11px] leading-tight ${
                  !selectedOrderId && activeTab === "home"
                    ? "font-bold text-[#7d6aee]"
                    : "font-semibold"
                }`}
              >
                Undangan
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedOrderId(null);
                onNavigate(`${prefix}/proses`);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                selectedOrderId || activeTab === "proses"
                  ? "text-[#7d6aee] font-bold"
                  : "text-neutral-500 hover:text-neutral-900 font-semibold"
              }`}
              aria-label="Pesanan"
            >
              <ShoppingBag className="w-5 h-5" />
              <span
                className={`text-[11px] leading-tight ${
                  selectedOrderId || activeTab === "proses"
                    ? "font-bold text-[#7d6aee]"
                    : "font-semibold"
                }`}
              >
                Pesanan
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSelectedOrderId(null);
                onNavigate(`${prefix}/profile`);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                !selectedOrderId && activeTab === "profile"
                  ? "text-[#7d6aee] font-bold"
                  : "text-neutral-500 hover:text-neutral-900 font-semibold"
              }`}
              aria-label="Profil"
            >
              <UserRound className="w-5 h-5" />
              <span
                className={`text-[11px] leading-tight ${
                  !selectedOrderId && activeTab === "profile"
                    ? "font-bold text-[#7d6aee]"
                    : "font-semibold"
                }`}
              >
                Profil
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigate(PATHS.home);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer text-neutral-500 hover:text-neutral-900 font-semibold"
              aria-label="Kembali ke Landing Page"
            >
              <SquareArrowOutUpRight className="w-5 h-5" />
              <span className="text-[11px] leading-tight font-semibold">
                Kembali
              </span>
            </button>
          </div>
        </nav>
      </div>

      {/* Modal Edit Profil */}
      {isEditProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-purple-100 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Edit Profil</h3>
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(false)}
                className="size-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-col items-center">
                <img
                  src={editAvatarUrl}
                  alt="Preview Avatar"
                  className="size-20 rounded-full object-cover border-2 border-[#7d6aee] shadow-sm mb-3"
                />
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-bold text-neutral-700 hover:bg-neutral-50 cursor-pointer shadow-2xs">
                  <Upload className="w-3.5 h-3.5 text-[#7d6aee]" />
                  <span>Upload Foto Baru</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-800 block mb-1">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#7d6aee]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-800 block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={userProfile.email}
                  disabled
                  readOnly
                  className="w-full bg-neutral-100 border border-neutral-200 text-neutral-500 rounded-xl px-3.5 py-2 text-xs cursor-not-allowed"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-800 block mb-1">
                  Nomor WhatsApp
                </label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-[#7d6aee]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-neutral-50 border-t border-neutral-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditProfileOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveProfile}
              >
                Simpan
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Logout */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-neutral-100 overflow-hidden p-6 text-center">
            <div className="size-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-neutral-900 tracking-tight">
              Yakin Ingin Keluar?
            </h3>
            <p className="text-xs text-neutral-500 font-medium mt-1 leading-relaxed">
              Anda akan keluar dari akun Satu Cerita dan diarahkan kembali ke beranda.
            </p>

            <div className="grid grid-cols-2 gap-2 mt-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLogoutModalOpen(false)}
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handlePerformLogout}
              >
                Ya, Keluar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserApp;
