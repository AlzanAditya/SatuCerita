import React, { useState, useEffect, useMemo, useRef } from "react";
import { PATHS } from "@/routes";
import {
  Home,
  ShoppingBag,
  UserRound,
  SquareArrowOutUpRight,
  Plus,
  Send,
  LogOut,
  Clock,
  CheckCircle2,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Pencil,
  Check,
  AlertCircle,
  Lock,
  Upload,
  FileText,
  X,
  Receipt,
  Copy,
  QrCode,
  CreditCard,
  Smartphone,
  ShieldCheck,
  Building2,
  ExternalLink,
  Download,
  Heart,
  Calendar,
  Share2,
  HelpCircle,
  Phone,
  Shield,
  Eye,
  RefreshCw,
  MessageCircle,
  LayoutGrid,
} from "lucide-react";
import { AppNavbar } from "@/components/app/AppNavbar";
import { Button } from "@/components/ui/Button";
import { InputBase } from "@/components/ui/input";
import { InputGroup } from "@/components/ui/input-group";
import {
  getUserProfileCache,
  saveUserProfileCache,
  convertFileToDataUrl,
  setCache,
  CACHE_KEYS,
  DEFAULT_USER_PROFILE,
} from "@/lib/cache";

export interface UserAppProps {
  activeTab?: "home" | "task" | "proses" | "chat" | "app" | "joki" | "katalog" | "profile" | "bayar";
  currentPath: string;
  onNavigate: (path: string) => void;
}

export interface UserInvitation {
  id: string;
  title: string;
  brideName: string;
  groomName: string;
  eventDate: string;
  eventLocation: string;
  slug: string;
  templateName: string;
  templateCover: string;
  status: "active" | "draft";
  guestCount: number;
  rsvpCount: number;
}

export interface OrderAddon {
  id: string;
  name: string;
  price: number;
}

export interface OrderItem {
  id: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  status: "pending" | "paid" | "cancelled";
  templateName: string;
  templateCategory: string;
  templateCover: string;
  packageTier: string;
  basePrice: number;
  addons: OrderAddon[];
  discountCode?: string;
  discountAmount?: number;
  uniqueCode: number;
  total: number;
  paymentMethod: "qris" | "bca_va" | "mandiri_va" | "gopay";
  vaNumber?: string;
  slug: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}

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

  // Tab filter states
  const [invitationFilter, setInvitationFilter] = useState<"semua" | "aktif" | "draft">("semua");
  const [orderFilter, setOrderFilter] = useState<"semua" | "pending" | "paid">("semua");

  // Selected Order for Detail View (Screenshots 4, 5, 6)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // User Profile
  const DEFAULT_PROFILE = DEFAULT_USER_PROFILE;

  const [userProfile, setUserProfile] = useState(() => getUserProfileCache());

  useEffect(() => {
    saveUserProfileCache(userProfile);
  }, [userProfile]);

  // Format initial phone for WA input (strip leading 0 or 62)
  const getInitialWaDigits = (phoneStr: string) => {
    const digits = phoneStr.replace(/\D/g, "");
    if (digits.startsWith("62")) return digits.slice(2);
    if (digits.startsWith("0")) return digits.slice(1);
    return digits || "85187978443";
  };

  const [profileNameInput, setProfileNameInput] = useState(userProfile.name);
  const [profileWaInput, setProfileWaInput] = useState(() => getInitialWaDigits(userProfile.phone));

  const handleNameChange = (val: string) => {
    setProfileNameInput(val);
    setUserProfile((prev: typeof DEFAULT_PROFILE) => ({ ...prev, name: val }));
  };

  const handleWaChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    setProfileWaInput(clean);
    setUserProfile((prev: typeof DEFAULT_PROFILE) => ({ ...prev, phone: `+62 ${clean}` }));
  };

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState(userProfile.name);
  const [editPhone, setEditPhone] = useState(userProfile.phone);
  const [editAvatarUrl, setEditAvatarUrl] = useState(userProfile.avatar);

  // Logout Confirmation Modal
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Copy feedback tooltip
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const handleCopy = (text: string, label: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopyFeedback(label);
      setTimeout(() => setCopyFeedback(null), 2500);
    } catch (_e) {}
  };

  // Toast Notice
  const [toastNotice, setToastNotice] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastNotice(msg);
    setTimeout(() => setToastNotice(null), 3000);
  };

  // Invitations State (Default: EMPTY as in Gambar 1)
  const [invitations, setInvitations] = useState<UserInvitation[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("satucerita_invitations_v2");
        if (saved) return JSON.parse(saved);
      } catch (_e) {}
    }
    return []; // Start empty per Gambar 1
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("satucerita_invitations_v2", JSON.stringify(invitations));
      } catch (_e) {}
    }
  }, [invitations]);

  // Orders State (Default: EMPTY as in Gambar 2, with sample available to test Screenshots 4, 5, 6)
  const [orders, setOrders] = useState<OrderItem[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("satucerita_orders_v2");
        if (saved) return JSON.parse(saved);
      } catch (_e) {}
    }
    return []; // Start empty per Gambar 2
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("satucerita_orders_v2", JSON.stringify(orders));
      } catch (_e) {}
    }
  }, [orders]);

  // Sample order generator for demonstrating Detail Pesanan
  const sampleOrder: OrderItem = useMemo(
    () => ({
      id: "ord-20261010-0981",
      invoiceNo: "SC-INV-20261010-0981",
      date: "10 Okt 2026, 09:30 WIB",
      dueDate: "11 Okt 2026, 09:30 WIB",
      status: "pending",
      templateName: "Rustic Blossom - Modern Elegance",
      templateCategory: "Undangan Pernikahan (Wedding)",
      templateCover:
        "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80",
      packageTier: "Paket Lengkap Digital (Unlimited Tamu + RSVP WhatsApp)",
      basePrice: 99000,
      addons: [
        { id: "custom-domain", name: "Custom Domain (alzanbella.com)", price: 50000 },
        { id: "wa-sender", name: "WhatsApp Blast Sender Otomatis", price: 25000 },
      ],
      discountCode: "HEMATCERITA",
      discountAmount: 45000,
      uniqueCode: 234,
      total: 129234,
      paymentMethod: "qris",
      vaNumber: "8801 2948 1029 381",
      slug: "alzan-bella",
      customerName: userProfile.name,
      customerPhone: userProfile.phone,
      customerEmail: userProfile.email,
    }),
    [userProfile]
  );

  const activeOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return orders.find((o) => o.id === selectedOrderId) || (selectedOrderId === "sample" ? sampleOrder : null);
  }, [selectedOrderId, orders, sampleOrder]);

  // Selected payment tab in Detail Pesanan
  const [detailPaymentMethod, setDetailPaymentMethod] = useState<"qris" | "bca_va" | "mandiri_va" | "gopay">("qris");
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);

  // Helper to add sample invitation
  const handleAddSampleInvitation = () => {
    const newInv: UserInvitation = {
      id: "inv-" + Date.now(),
      title: "The Wedding of Alzan & Bella",
      brideName: "Bella Safitri",
      groomName: "Alzan Aditya",
      eventDate: "Sabtu, 24 Oktober 2026",
      eventLocation: "Grand Ballroom Hotel Indonesia Kempinski, Jakarta",
      slug: "alzan-bella",
      templateName: "Rustic Blossom - Modern Elegance",
      templateCover:
        "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80",
      status: "active",
      guestCount: 250,
      rsvpCount: 184,
    };
    setInvitations([newInv, ...invitations]);
    showToast("Undangan contoh berhasil dibuat!");
  };

  // Helper to add sample order
  const handleAddSampleOrder = () => {
    if (!orders.some((o) => o.id === sampleOrder.id)) {
      setOrders([sampleOrder, ...orders]);
    }
    setSelectedOrderId(sampleOrder.id);
    showToast("Contoh pesanan dibuka di Detail Pesanan!");
  };

  // Toggle order payment status in detail
  const handleConfirmPaid = () => {
    setIsVerifyingPayment(true);
    setTimeout(() => {
      setIsVerifyingPayment(false);
      if (activeOrder) {
        const updated = orders.map((o) => (o.id === activeOrder.id ? { ...o, status: "paid" as const } : o));
        if (!orders.some((o) => o.id === activeOrder.id)) {
          setOrders([{ ...sampleOrder, status: "paid" }]);
        } else {
          setOrders(updated);
        }
      }
      showToast("Selamat! Pembayaran berhasil diverifikasi otomatis.");
    }, 1200);
  };

  // Save profile changes
  const handleSaveProfile = () => {
    const updated = {
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
    const landingUrl = PATHS.home;
    onNavigate(landingUrl);
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

  // Filtered lists
  const filteredInvitations = useMemo(() => {
    if (invitationFilter === "semua") return invitations;
    return invitations.filter((i) => i.status === invitationFilter);
  }, [invitations, invitationFilter]);

  const filteredOrders = useMemo(() => {
    if (orderFilter === "semua") return orders;
    return orders.filter((o) => o.status === orderFilter);
  }, [orders, orderFilter]);

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
      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR (SatuCerita User App)                                     */}
      {/* Di bagian bawah sidebarnya ada avatar, nama & email, dan di baris yang    */}
      {/* sama di bagian kanan ada tombol untuk logout                              */}
      {/* ========================================================================= */}
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

        {/* ===================================================================== */}
        {/* SIDEBAR FOOTER: USER AVATAR + NAMA & EMAIL + LOGOUT DI BARIS YANG SAMA */}
        {/* ===================================================================== */}
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

            {/* Tombol Logout di baris yang sama, di bagian kanan */}
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
        {/* ========================================================= */}
        {/* VIEW 1: DETAIL PESANAN (GAMBAR 4, 5, 6)                   */}
        {/* Ditampilkan saat user mengklik pesanan dari list pesanan  */}
        {/* ========================================================= */}
        {selectedOrderId && activeOrder ? (
          <div className="space-y-4 sm:space-y-5 animate-fadeIn">
            {/* Header Kembali & Judul */}
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedOrderId(null)}
                className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#7d6aee] hover:text-[#6b58e0] transition-colors cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-purple-100 shadow-2xs hover:shadow-xs"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Pesanan</span>
              </button>

              <span
                className={`px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase ${
                  activeOrder.status === "paid"
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : activeOrder.status === "pending"
                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                    : "bg-neutral-100 text-neutral-600 border border-neutral-200"
                }`}
              >
                {activeOrder.status === "paid"
                  ? "Lunas"
                  : activeOrder.status === "pending"
                  ? "Menunggu Pembayaran"
                  : "Dibatalkan"}
              </span>
            </div>

            {/* --------------------------------------------------------- */}
            {/* GAMBAR 4: TAMPILAN PALING ATAS DARI DETAIL PESANAN        */}
            {/* --------------------------------------------------------- */}
            {/* Countdown / Status Banner */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                activeOrder.status === "paid"
                  ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                  : "bg-amber-50/80 border-amber-200/90 text-amber-950"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                    activeOrder.status === "paid"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {activeOrder.status === "paid" ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Clock className="w-5 h-5 animate-pulse" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm sm:text-base font-extrabold tracking-tight">
                    {activeOrder.status === "paid"
                      ? "Pembayaran Terkonfirmasi"
                      : "Selesaikan Pembayaran Anda"}
                  </h4>
                  <p className="text-xs sm:text-sm mt-0.5 opacity-90 leading-relaxed">
                    {activeOrder.status === "paid"
                      ? "Pesanan Anda telah aktif. Template undangan digital siap diedit dan disebarkan ke tamu."
                      : `Batas waktu pembayaran hingga ${activeOrder.dueDate}. Undangan otomatis aktif setelah dana diterima.`}
                  </p>
                </div>
              </div>
            </div>

            {/* Ringkasan Invoice & Info Transaksi */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-2xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div>
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    Nomor Pesanan / Invoice
                  </span>
                  <div className="flex items-center gap-2 mt-0.5">
                    <strong className="text-sm sm:text-base font-black text-neutral-900 tracking-tight">
                      #{activeOrder.invoiceNo}
                    </strong>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeOrder.invoiceNo, "Invoice disalin!")}
                      className="p-1 rounded-md text-neutral-400 hover:text-[#7d6aee] hover:bg-purple-50 transition-colors"
                      title="Salin No Invoice"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {copyFeedback === "Invoice disalin!" && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        Disalin!
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-semibold text-neutral-400 uppercase tracking-wider block">
                    Waktu Pesan
                  </span>
                  <span className="text-xs sm:text-sm font-semibold text-neutral-700 block mt-0.5">
                    {activeOrder.date}
                  </span>
                </div>
              </div>

              {/* Card Template Yang Dipesan */}
              <div className="flex items-center gap-3.5 pt-1">
                <img
                  src={activeOrder.templateCover}
                  alt={activeOrder.templateName}
                  className="size-18 sm:size-20 rounded-xl object-cover border border-purple-100 shadow-2xs shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className="inline-block px-2 py-0.5 rounded-md bg-purple-50 text-[#7d6aee] text-[10px] font-bold">
                    {activeOrder.templateCategory}
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-neutral-900 truncate mt-1">
                    {activeOrder.templateName}
                  </h3>
                  <p className="text-xs text-neutral-500 font-medium truncate mt-0.5">
                    {activeOrder.packageTier}
                  </p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-xs font-bold text-[#7d6aee]">
                      Rp {activeOrder.basePrice.toLocaleString("id-ID")}
                    </span>
                    <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      Masa Aktif Selamanya
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* --------------------------------------------------------- */}
            {/* GAMBAR 5: LANJUTAN DARI DETAIL PESANAN (BAGIAN TENGAH)    */}
            {/* --------------------------------------------------------- */}
            {/* Add-ons & Layanan Tambahan */}
            {activeOrder.addons && activeOrder.addons.length > 0 && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-2xs">
                <h4 className="text-xs sm:text-sm font-bold text-neutral-900 mb-2.5 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#7d6aee]" />
                  <span>Fitur & Layanan Tambahan</span>
                </h4>
                <div className="space-y-2">
                  {activeOrder.addons.map((add) => (
                    <div
                      key={add.id}
                      className="flex items-center justify-between text-xs py-1.5 border-b border-neutral-50 last:border-b-0"
                    >
                      <span className="font-semibold text-neutral-700">{add.name}</span>
                      <span className="font-bold text-neutral-900">
                        +Rp {add.price.toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rincian Biaya (Breakdown) */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-2xs space-y-2.5">
              <h4 className="text-xs sm:text-sm font-bold text-neutral-900 mb-1 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#7d6aee]" />
                <span>Rincian Pembayaran</span>
              </h4>

              <div className="flex items-center justify-between text-xs text-neutral-600">
                <span>Harga Paket Template</span>
                <span className="font-semibold text-neutral-800">
                  Rp {activeOrder.basePrice.toLocaleString("id-ID")}
                </span>
              </div>

              {activeOrder.addons?.map((addon) => (
                <div key={addon.id} className="flex items-center justify-between text-xs text-neutral-600">
                  <span>{addon.name}</span>
                  <span className="font-semibold text-neutral-800">
                    Rp {addon.price.toLocaleString("id-ID")}
                  </span>
                </div>
              ))}

              {activeOrder.discountAmount && activeOrder.discountAmount > 0 && (
                <div className="flex items-center justify-between text-xs text-emerald-600 font-semibold">
                  <span>Diskon Promo ({activeOrder.discountCode})</span>
                  <span>-Rp {activeOrder.discountAmount.toLocaleString("id-ID")}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-neutral-600">
                <span>Kode Unik Verifikasi</span>
                <span className="font-semibold text-neutral-800">
                  +Rp {activeOrder.uniqueCode.toLocaleString("id-ID")}
                </span>
              </div>

              <div className="pt-2.5 border-t border-neutral-100 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-neutral-900 block">Total Tagihan</span>
                  <span className="text-[10px] text-neutral-400">Termasuk pajak & biaya admin</span>
                </div>
                <strong className="text-base sm:text-lg font-black text-[#7d6aee]">
                  Rp {activeOrder.total.toLocaleString("id-ID")}
                </strong>
              </div>
            </div>

            {/* Metode Pembayaran & Interaktif QRIS / Virtual Account */}
            {activeOrder.status === "pending" && (
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-2xs space-y-3.5">
                <h4 className="text-xs sm:text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-[#7d6aee]" />
                  <span>Pilih Saluran Pembayaran</span>
                </h4>

                {/* Tabs Metode Pembayaran */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setDetailPaymentMethod("qris")}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      detailPaymentMethod === "qris"
                        ? "bg-[#7d6aee] text-white border-[#7d6aee] shadow-2xs"
                        : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                    }`}
                  >
                    QRIS
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailPaymentMethod("bca_va")}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      detailPaymentMethod === "bca_va"
                        ? "bg-[#7d6aee] text-white border-[#7d6aee] shadow-2xs"
                        : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                    }`}
                  >
                    BCA VA
                  </button>
                  <button
                    type="button"
                    onClick={() => setDetailPaymentMethod("mandiri_va")}
                    className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                      detailPaymentMethod === "mandiri_va"
                        ? "bg-[#7d6aee] text-white border-[#7d6aee] shadow-2xs"
                        : "bg-neutral-50 text-neutral-600 border-neutral-200 hover:bg-neutral-100"
                    }`}
                  >
                    Mandiri VA
                  </button>
                </div>

                {/* Box Tampilan Sesuai Tab Terpilih */}
                {detailPaymentMethod === "qris" ? (
                  <div className="p-4 rounded-xl bg-purple-50/50 border border-purple-100 flex flex-col items-center text-center">
                    <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                      Scan QRIS Menggunakan E-Wallet / Mobile Banking
                    </span>

                    {/* QR Code Graphic Vector Modern */}
                    <div className="bg-white p-3 rounded-2xl border-2 border-neutral-200 shadow-sm relative group">
                      <div className="size-44 sm:size-48 bg-white flex flex-col items-center justify-center p-2 relative">
                        {/* QR Placeholder Visual */}
                        <div className="w-full h-full bg-neutral-900 rounded-lg p-2.5 flex flex-col justify-between relative overflow-hidden">
                          <div className="flex justify-between">
                            <div className="size-8 bg-white rounded-xs p-1">
                              <div className="w-full h-full bg-neutral-900" />
                            </div>
                            <div className="size-8 bg-white rounded-xs p-1">
                              <div className="w-full h-full bg-neutral-900" />
                            </div>
                          </div>
                          <div className="flex items-center justify-center">
                            <div className="px-2 py-1 rounded bg-[#7d6aee] text-white font-extrabold text-[9px] shadow-sm">
                              SATU CERITA QRIS
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <div className="size-8 bg-white rounded-xs p-1">
                              <div className="w-full h-full bg-neutral-900" />
                            </div>
                            <div className="size-8 border-2 border-white rounded-xs flex items-center justify-center">
                              <div className="size-4 bg-white" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <p className="text-[11px] text-neutral-500 mt-2 font-medium">
                      BCA Mobile • GoPay • OVO • DANA • ShopeePay • Livin' Mandiri
                    </p>

                    <button
                      type="button"
                      onClick={() => showToast("QR Code berhasil diunduh ke perangkat")}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-neutral-200 text-neutral-700 text-xs font-bold hover:bg-neutral-50 shadow-2xs cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#7d6aee]" />
                      <span>Unduh QR Code</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 space-y-2.5">
                    <span className="text-[11px] font-semibold text-neutral-500 block uppercase tracking-wider">
                      Nomor Virtual Account {detailPaymentMethod === "bca_va" ? "BCA" : "Mandiri"}
                    </span>
                    <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-neutral-200">
                      <strong className="text-base sm:text-lg font-black text-neutral-900 tracking-wider">
                        {activeOrder.vaNumber || "8801 2948 1029 381"}
                      </strong>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeOrder.vaNumber || "8801 2948 1029 381", "Nomor VA disalin!")}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#7d6aee] text-white text-xs font-bold hover:bg-[#6b58e0] cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin</span>
                      </button>
                    </div>
                    {copyFeedback === "Nomor VA disalin!" && (
                      <span className="text-[11px] font-bold text-emerald-600 block">
                        Nomor Virtual Account berhasil disalin ke clipboard!
                      </span>
                    )}
                    <div className="text-xs text-neutral-500 font-medium">
                      Atas Nama: <strong className="text-neutral-800">PT SATU CERITA DIGITAL</strong>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* --------------------------------------------------------- */}
            {/* GAMBAR 6: LANJUTAN DARI DETAIL PESANAN (BAGIAN BAWAH)     */}
            {/* --------------------------------------------------------- */}
            {/* Panduan & Instruksi Pembayaran */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-2xs space-y-3">
              <h4 className="text-xs sm:text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#7d6aee]" />
                <span>Petunjuk Pembayaran Mudah</span>
              </h4>
              <div className="space-y-2 text-xs text-neutral-600 leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-purple-100 text-[#7d6aee] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <p>Buka aplikasi m-Banking atau e-Wallet kesayangan Anda.</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-purple-100 text-[#7d6aee] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <p>
                    Pilih menu <strong>Bayar QRIS</strong> atau <strong>Transfer Virtual Account</strong>.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-purple-100 text-[#7d6aee] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </span>
                  <p>
                    Pastikan jumlah transfer tepat hingga 3 digit terakhir (
                    <strong className="text-[#7d6aee]">Rp {activeOrder.total.toLocaleString("id-ID")}</strong>).
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="size-5 rounded-full bg-purple-100 text-[#7d6aee] font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                    4
                  </span>
                  <p>Sistem memverifikasi secara otomatis dalam 1-3 menit tanpa perlu kirim bukti transfer manual.</p>
                </div>
              </div>
            </div>

            {/* Informasi Pemesan */}
            <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-2xs space-y-2">
              <h4 className="text-xs sm:text-sm font-bold text-neutral-900 mb-2">
                Data Pemesan & Tautan Undangan
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-neutral-400 block">Nama Pemesan</span>
                  <strong className="text-neutral-800">{activeOrder.customerName}</strong>
                </div>
                <div>
                  <span className="text-neutral-400 block">WhatsApp</span>
                  <strong className="text-neutral-800">{activeOrder.customerPhone}</strong>
                </div>
                <div className="col-span-2 pt-1 border-t border-neutral-100">
                  <span className="text-neutral-400 block">Tautan Undangan</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <strong className="text-[#7d6aee] font-bold">
                      satucerita.com/{activeOrder.slug}
                    </strong>
                    <button
                      type="button"
                      onClick={() => handleCopy(`https://satucerita.com/${activeOrder.slug}`, "Link disalin!")}
                      className="p-1 rounded text-neutral-400 hover:text-[#7d6aee]"
                      title="Salin Link"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {copyFeedback === "Link disalin!" && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1 py-0.5 rounded">
                        Disalin!
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tombol Aksi di Bagian Bawah */}
            <div className="space-y-2 pt-2">
              {activeOrder.status === "pending" ? (
                <>
                  <button
                    type="button"
                    disabled={isVerifyingPayment}
                    onClick={handleConfirmPaid}
                    className="w-full py-3.5 px-4 rounded-xl bg-[#7d6aee] hover:bg-[#6b58e0] text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                  >
                    {isVerifyingPayment ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Memeriksa Status Pembayaran...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Saya Sudah Membayar (Cek Verifikasi)</span>
                      </>
                    )}
                  </button>

                  <a
                    href="https://wa.me/6285187978443?text=Halo%20Satu%20Cerita,%20saya%20ingin%20konfirmasi%20pesanan%20dengan%20invoice%20SC-INV-20261010-0981"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 px-4 rounded-xl bg-white border border-neutral-200 hover:bg-neutral-50 text-neutral-700 font-bold text-xs shadow-2xs transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4 text-[#25D366]" />
                    <span>Butuh Bantuan? Hubungi CS WhatsApp</span>
                  </a>
                </>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleAddSampleInvitation();
                      onNavigate(`${prefix}/home`);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-[#7d6aee] hover:bg-[#6b58e0] text-white font-extrabold text-xs shadow-sm transition-all"
                  >
                    Mulai Edit Undangan
                  </button>
                  <button
                    type="button"
                    onClick={() => showToast("Pratinjau undangan dibuka di tab baru")}
                    className="px-4 py-3 rounded-xl bg-white border border-neutral-200 text-neutral-700 font-bold text-xs hover:bg-neutral-50"
                  >
                    Lihat Demo
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* ========================================================= */}
        {/* TAB 1: UNDANGAN (GAMBAR 1: EMPTY STATE UNDANGAN)          */}
        {/* ========================================================= */}
        {!selectedOrderId && activeTab === "home" && (
          <div className="space-y-4 sm:space-y-5 animate-fadeIn">
            {/* Filter Status Undangan (Indikator jumlah dihapus) */}
            <div className="flex items-center justify-start">
              <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-purple-100 border-b-[2px] border-b-purple-200/70 shadow-2xs select-none">
                <button
                  type="button"
                  onClick={() => setInvitationFilter("semua")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    invitationFilter === "semua"
                      ? "bg-[#7d6aee] text-white shadow-2xs"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setInvitationFilter("aktif")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    invitationFilter === "aktif"
                      ? "bg-[#7d6aee] text-white shadow-2xs"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  Aktif
                </button>
                <button
                  type="button"
                  onClick={() => setInvitationFilter("draft")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    invitationFilter === "draft"
                      ? "bg-[#7d6aee] text-white shadow-2xs"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  Draft
                </button>
              </div>
            </div>

            {/* KONDISI EMPTY STATE (GAMBAR 1) */}
            {filteredInvitations.length === 0 ? (
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-purple-100 shadow-2xs flex flex-col items-center text-center">
                {/* Clean minimalist icon container ungu */}
                <div className="size-20 sm:size-24 rounded-3xl bg-purple-50/80 border border-purple-200/70 flex items-center justify-center text-[#7d6aee] shadow-sm mb-4">
                  <Heart className="w-9 h-9 sm:w-11 sm:h-11 text-[#7d6aee] fill-purple-100/50" />
                </div>

                <h3 className="text-base sm:text-lg font-black tracking-tight text-neutral-900">
                  Belum Ada Undangan
                </h3>

                <p className="text-xs sm:text-sm text-neutral-500 font-medium max-w-sm mt-1.5 leading-relaxed">
                  Kamu belum memiliki undangan digital yang dibuat. Pilih template favoritmu di katalog dan mulailah merancang undangan pernikahan impianmu.
                </p>

                {/* Tombol CTA Buat Undangan (Ungu Minimalis) */}
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => onNavigate(PATHS.katalog)}
                  className="mt-5 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Pilih Template di Katalog</span>
                </Button>
              </div>
            ) : (
              /* JIKA SUDAH ADA UNDANGAN DIBUAT */
              <div className="space-y-4">
                {filteredInvitations.map((inv) => (
                  <div
                    key={inv.id}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 shadow-2xs hover:border-purple-300 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={inv.templateCover}
                        alt={inv.title}
                        className="size-16 sm:size-18 rounded-xl object-cover border border-purple-100 shadow-2xs shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                            {inv.status === "active" ? "Aktif" : "Draft"}
                          </span>
                          <span className="text-xs text-neutral-400 font-medium">
                            {inv.templateName}
                          </span>
                        </div>
                        <h4 className="text-sm sm:text-base font-extrabold text-neutral-900 tracking-tight mt-1">
                          {inv.title}
                        </h4>
                        <div className="flex items-center gap-3 mt-1 text-xs text-neutral-500 font-medium">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-[#7d6aee]" />
                            {inv.eventDate}
                          </span>
                          <span>•</span>
                          <span>{inv.rsvpCount} RSVP</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100">
                      <button
                        type="button"
                        onClick={() => handleCopy(`https://satucerita.com/${inv.slug}`, "Link disalin!")}
                        className="p-2 rounded-xl bg-purple-50 text-[#7d6aee] hover:bg-purple-100 transition-colors"
                        title="Bagikan Tautan Undangan"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => showToast("Membuka editor undangan...")}
                        className="px-3.5 py-2 rounded-xl bg-[#7d6aee] text-white hover:bg-[#6b58e0] font-bold text-xs shadow-2xs transition-all"
                      >
                        Edit Undangan
                      </button>
                    </div>
                  </div>
                ))}

                {/* Card di bawah item: Belum anda undangan, lihat katalog */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-purple-50 text-[#7d6aee] flex items-center justify-center shrink-0 border border-purple-100">
                      <LayoutGrid className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-extrabold text-neutral-900">
                        Belum anda undangan, lihat katalog
                      </h5>
                      <p className="text-[11px] sm:text-xs text-neutral-500 font-medium mt-0.5">
                        Pilih template favoritmu di katalog untuk membuat undangan baru.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onNavigate(PATHS.katalog)}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <span>Lihat Katalog</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PESANAN (GAMBAR 2: EMPTY STATE PESANAN)            */}
        {/* ========================================================= */}
        {!selectedOrderId && activeTab === "proses" && (
          <div className="space-y-4 sm:space-y-5 animate-fadeIn">
            {/* Filter Status Pesanan (Indikator jumlah dihapus) */}
            <div className="flex items-center justify-start">
              <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-purple-100 border-b-[2px] border-b-purple-200/70 shadow-2xs select-none overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setOrderFilter("semua")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    orderFilter === "semua"
                      ? "bg-[#7d6aee] text-white shadow-2xs"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilter("pending")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    orderFilter === "pending"
                      ? "bg-[#7d6aee] text-white shadow-2xs"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  Menunggu Bayar
                </button>
                <button
                  type="button"
                  onClick={() => setOrderFilter("paid")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    orderFilter === "paid"
                      ? "bg-[#7d6aee] text-white shadow-2xs"
                      : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  Lunas
                </button>
              </div>
            </div>

            {/* KONDISI EMPTY STATE PESANAN (GAMBAR 2) */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-3xl p-6 sm:p-10 border border-purple-100 shadow-2xs flex flex-col items-center text-center">
                {/* Clean minimalist icon container ungu */}
                <div className="size-20 sm:size-24 rounded-3xl bg-purple-50/80 border border-purple-200/70 flex items-center justify-center text-[#7d6aee] shadow-sm mb-4">
                  <ShoppingBag className="w-9 h-9 sm:w-11 sm:h-11 text-[#7d6aee]" />
                </div>

                <h3 className="text-base sm:text-lg font-black tracking-tight text-neutral-900">
                  Belum Ada Pesanan
                </h3>

                <p className="text-xs sm:text-sm text-neutral-500 font-medium max-w-sm mt-1.5 leading-relaxed">
                  Kamu belum memiliki riwayat pesanan. Semua pesanan template dan add-on undangan digital akan tercatat rapi di halaman ini.
                </p>

                {/* Tombol CTA Pesan Template */}
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => onNavigate(PATHS.katalog)}
                  className="mt-5 flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Jelajahi Katalog Template</span>
                </Button>
              </div>
            ) : (
              /* JIKA SUDAH ADA PESANAN */
              <div className="space-y-3.5">
                {filteredOrders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => setSelectedOrderId(ord.id)}
                    className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 hover:border-purple-300 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                      <div>
                        <span className="text-[11px] font-semibold text-neutral-400 block">
                          No. Pesanan
                        </span>
                        <strong className="text-xs sm:text-sm font-black text-neutral-900">
                          #{ord.invoiceNo}
                        </strong>
                      </div>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          ord.status === "paid"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-amber-50 text-amber-700 border border-amber-200"
                        }`}
                      >
                        {ord.status === "paid" ? "Lunas" : "Menunggu Bayar"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3.5 py-3">
                      <img
                        src={ord.templateCover}
                        alt={ord.templateName}
                        className="size-14 sm:size-16 rounded-xl object-cover border border-purple-100 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs sm:text-sm font-extrabold text-neutral-900 truncate">
                          {ord.templateName}
                        </h4>
                        <p className="text-[11px] text-neutral-500 font-medium truncate mt-0.5">
                          {ord.packageTier}
                        </p>
                        <div className="text-xs font-black text-[#7d6aee] mt-1">
                          Rp {ord.total.toLocaleString("id-ID")}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-neutral-50 flex items-center justify-between text-xs">
                      <span className="text-neutral-400 font-medium">{ord.date}</span>
                      <span className="font-bold text-[#7d6aee] flex items-center gap-1 group-hover:underline">
                        Lihat Detail Pesanan
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}

                {/* Card di bawah item: Tidak ada pesanan lagi */}
                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs flex items-center gap-3.5 text-left">
                  <div className="size-10 rounded-xl bg-purple-50 text-[#7d6aee] flex items-center justify-center shrink-0 border border-purple-100">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs sm:text-sm font-extrabold text-neutral-900">
                      Tidak ada pesanan lagi
                    </h5>
                    <p className="text-[11px] sm:text-xs text-neutral-500 font-medium mt-0.5">
                      Semua riwayat pesanan undangan digital Anda telah ditampilkan.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: PROFIL (GAMBAR 3: PROFIL + TOMBOL LOGOUT DI BAWAH) */}
        {/* ========================================================= */}
        {!selectedOrderId && activeTab === "profile" && (
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
                  {/* Tombol edit profil icon-only di pojok kanan bawah avatar */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditName(userProfile.name);
                      setEditPhone(userProfile.phone);
                      setEditAvatarUrl(userProfile.avatar);
                      setIsEditProfileOpen(true);
                    }}
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
                    {invitations.length}
                  </strong>
                  <span className="text-[10px] text-purple-100 font-semibold uppercase tracking-wider">
                    Undangan
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-xs border border-white/10">
                  <strong className="text-sm sm:text-base font-black text-white block">
                    {orders.length}
                  </strong>
                  <span className="text-[10px] text-purple-100 font-semibold uppercase tracking-wider">
                    Pesanan
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-white/15 backdrop-blur-xs border border-white/10">
                  <strong className="text-sm sm:text-base font-black text-white block">
                    {invitations.reduce((acc, i) => acc + i.guestCount, 0)}
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

                {/* Input Nomor HP dengan prefix Nomor HP */}
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

                {/* Input Email (Bagian paling bawah, tidak bisa diedit) */}
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
                onClick={() => {
                  const caraPesanUrl = PATHS.caraPesan;
                  onNavigate(caraPesanUrl);
                }}
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
                onClick={() => {
                  const kontakUrl = PATHS.kontak;
                  onNavigate(kontakUrl);
                }}
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

            {/* GAMBAR 3: TOMBOL LOGOUT DI BAWAHNYA */}
            <div className="pt-2">
              <Button
                variant="danger"
                size="lg"
                onClick={() => setIsLogoutModalOpen(true)}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4 text-white" />
                <span>Log out</span>
              </Button>
              <p className="text-[11px] text-center text-neutral-400 font-medium mt-2">
                Anda perlu masuk kembali untuk mengelola undangan
              </p>
            </div>
          </div>
        )}

        {/* Global Toast */}
        {toastNotice && (
          <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-semibold shadow-xl animate-fadeIn flex items-center gap-2">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>{toastNotice}</span>
          </div>
        )}
      </main>

      {/* Floating Bottom Nav for Satu Cerita App (Hanya di Mobile, Desktop Menggunakan Sidebar) */}
      <nav
        id="satucerita-app-bottom-navbar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-purple-100 backdrop-blur-lg shadow-lg select-none"
        aria-label="Satu Cerita App Navigation"
      >
        <div className="max-w-md mx-auto grid grid-cols-4 h-16 px-1">
          {/* 1. Undangan (icon Home) */}
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

          {/* 2. Pesanan (icon ShoppingBag) */}
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

          {/* 3. Profil (icon UserRound) */}
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

          {/* 4. Kembali (icon SquareArrowOutUpRight, kembali ke landing page) */}
          <button
            type="button"
            onClick={() => {
              const landingUrl = PATHS.home;
              onNavigate(landingUrl);
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
                className="size-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400"
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
