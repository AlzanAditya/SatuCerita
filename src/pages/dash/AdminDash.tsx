import React, { useState, useMemo } from "react";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  DollarSign,
  Palette,
  FileHeart,
  Settings,
  LogOut,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  ShieldCheck,
  TrendingUp,
  ArrowLeft,
  SquareArrowOutUpRight,
  ChevronRight,
  Download,
  RefreshCw,
  AlertCircle,
  Eye,
  X,
  Check,
  Edit3,
  Copy,
  ArrowUpRight,
  Menu,
  Phone,
  Mail,
  UserCheck,
  CreditCard,
  Receipt,
  Sparkles,
} from "lucide-react";
import { PATHS } from "@/routes";

export interface AdminDashProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export const AdminDash: React.FC<AdminDashProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<
    | "overview"
    | "users"
    | "analytics"
    | "finance"
    | "templates"
    | "invitations"
    | "settings"
  >("overview");

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserModal, setSelectedUserModal] = useState<any | null>(null);
  const [selectedOrderModal, setSelectedOrderModal] = useState<any | null>(null);
  const [isAddTemplateModalOpen, setIsAddTemplateModalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "1y">("30d");

  // Admin Profile Info
  const adminProfile = {
    name: "Alzan Bella (Super Admin)",
    email: "admin@satucerita.id",
    role: "Super Admin",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
  };

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. DATA PENGGUNA TERDAFTAR
  const [usersList, setUsersList] = useState([
    {
      id: "USR-001",
      name: "Alzan Bella",
      email: "alzanaditya2@gmail.com",
      phone: "+62 851-8797-8443",
      role: "Admin",
      invitationsCount: 3,
      totalSpent: 447000,
      joinedDate: "12 Jan 2026",
      status: "Aktif",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
    },
    {
      id: "USR-002",
      name: "Rian Pratama",
      email: "rian.pratama@gmail.com",
      phone: "+62 812-3456-7890",
      role: "Pengguna",
      invitationsCount: 1,
      totalSpent: 149000,
      joinedDate: "28 Feb 2026",
      status: "Aktif",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    },
    {
      id: "USR-003",
      name: "Dimas Anggara",
      email: "dimas.ang@yahoo.com",
      phone: "+62 857-1122-3344",
      role: "Pengguna",
      invitationsCount: 1,
      totalSpent: 99000,
      joinedDate: "05 Mar 2026",
      status: "Aktif",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    },
    {
      id: "USR-004",
      name: "Salsabila Putri",
      email: "salsaputri@gmail.com",
      phone: "+62 878-9988-7766",
      role: "Pengguna",
      invitationsCount: 2,
      totalSpent: 298000,
      joinedDate: "15 Mar 2026",
      status: "Aktif",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    },
    {
      id: "USR-005",
      name: "Fajar Santoso",
      email: "fajar.santo@outlook.com",
      phone: "+62 821-4455-6677",
      role: "Pengguna",
      invitationsCount: 1,
      totalSpent: 149000,
      joinedDate: "22 Mar 2026",
      status: "Aktif",
      avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=200&q=80",
    },
    {
      id: "USR-006",
      name: "Nadia Rahmawati",
      email: "nadiarahma@gmail.com",
      phone: "+62 813-7766-5544",
      role: "Pengguna",
      invitationsCount: 0,
      totalSpent: 0,
      joinedDate: "01 Apr 2026",
      status: "Pending",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
    },
  ]);

  // 2. DATA KEUANGAN & TRANSAKSI
  const [ordersList, setOrdersList] = useState([
    {
      id: "SC-ORD-8821",
      customer: "Rian Pratama & Salsabila",
      customerEmail: "rian.pratama@gmail.com",
      customerPhone: "+62 812-3456-7890",
      template: "Elysian Bloom (Gold)",
      tier: "Gold Tier",
      amount: 149000,
      uniqueCode: 24,
      total: 149024,
      paymentMethod: "QRIS",
      status: "LUNAS",
      date: "11 Okt 2026, 14:20",
      proofUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "SC-ORD-8820",
      customer: "Dimas Anggara & Nadia",
      customerEmail: "dimas.ang@yahoo.com",
      customerPhone: "+62 857-1122-3344",
      template: "Deluxe Royal Navy",
      tier: "Silver Tier",
      amount: 99000,
      uniqueCode: 87,
      total: 99087,
      paymentMethod: "BCA Virtual Account",
      status: "MENUNGGU_VERIFIKASI",
      date: "11 Okt 2026, 13:05",
      proofUrl: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80",
    },
    {
      id: "SC-ORD-8819",
      customer: "Fajar Santoso & Indah",
      customerEmail: "fajar.santo@outlook.com",
      customerPhone: "+62 821-4455-6677",
      template: "Minimalist Modern Flora",
      tier: "Gold Tier",
      amount: 149000,
      uniqueCode: 15,
      total: 149015,
      paymentMethod: "Mandiri VA",
      status: "LUNAS",
      date: "10 Okt 2026, 21:14",
      proofUrl: null,
    },
    {
      id: "SC-ORD-8818",
      customer: "Arif Hidayat & Sarah",
      customerEmail: "arif.sarah@gmail.com",
      customerPhone: "+62 899-5544-3322",
      template: "Elysian Luxe Emerald",
      tier: "Platinum Tier",
      amount: 199000,
      uniqueCode: 42,
      total: 199042,
      paymentMethod: "GoPay",
      status: "LUNAS",
      date: "10 Okt 2026, 18:40",
      proofUrl: null,
    },
    {
      id: "SC-ORD-8817",
      customer: "Budi Santoso & Tiara",
      customerEmail: "buditiara@gmail.com",
      customerPhone: "+62 852-6677-8899",
      template: "Rustic Wooden Botanical",
      tier: "Silver Tier",
      amount: 99000,
      uniqueCode: 63,
      total: 99063,
      paymentMethod: "QRIS",
      status: "DIBATALKAN",
      date: "09 Okt 2026, 11:25",
      proofUrl: null,
    },
  ]);

  // 3. DATA PANTAUAN TEMPLATE
  const [templatesList, setTemplatesList] = useState([
    {
      id: "tpl-1",
      name: "Elysian Bloom (Gold Edition)",
      category: "Floral & Elegant",
      tier: "Gold",
      price: 149000,
      originalPrice: 299000,
      totalUsers: 428,
      totalRevenue: 63772000,
      status: "Aktif",
      thumbnail: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80",
      rating: 4.9,
    },
    {
      id: "tpl-2",
      name: "Deluxe Royal Navy",
      category: "Luxury & Modern",
      tier: "Silver",
      price: 99000,
      originalPrice: 199000,
      totalUsers: 312,
      totalRevenue: 30888000,
      status: "Aktif",
      thumbnail: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=400&q=80",
      rating: 4.8,
    },
    {
      id: "tpl-3",
      name: "Minimalist Modern Flora",
      category: "Minimalist Clean",
      tier: "Gold",
      price: 149000,
      originalPrice: 249000,
      totalUsers: 254,
      totalRevenue: 37846000,
      status: "Aktif",
      thumbnail: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=400&q=80",
      rating: 4.9,
    },
    {
      id: "tpl-4",
      name: "Elysian Luxe Emerald",
      category: "Exclusive Platinum",
      tier: "Platinum",
      price: 199000,
      originalPrice: 399000,
      totalUsers: 168,
      totalRevenue: 33432000,
      status: "Aktif",
      thumbnail: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=400&q=80",
      rating: 5.0,
    },
    {
      id: "tpl-5",
      name: "Adat Jawa Klasik Keraton",
      category: "Tradisional Adat",
      tier: "Gold",
      price: 149000,
      originalPrice: 299000,
      totalUsers: 86,
      totalRevenue: 12814000,
      status: "Aktif",
      thumbnail: "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&w=400&q=80",
      rating: 4.7,
    },
  ]);

  // 4. DATA UNDANGAN AKTIF
  const [invitationsList, setInvitationsList] = useState([
    {
      id: "INV-101",
      title: "The Wedding of Dimas & Sarah",
      bride: "Sarah Alisha",
      groom: "Dimas Anggara",
      eventDate: "14 November 2026",
      template: "Elysian Bloom (Gold)",
      slug: "dimas-sarah",
      guestCount: 350,
      rsvpCount: 284,
      status: "Online",
    },
    {
      id: "INV-102",
      title: "Pernikahan Rian & Salsabila",
      bride: "Salsabila Putri",
      groom: "Rian Pratama",
      eventDate: "20 Desember 2026",
      template: "Elysian Bloom (Gold)",
      slug: "rian-salsabila",
      guestCount: 500,
      rsvpCount: 412,
      status: "Online",
    },
    {
      id: "INV-103",
      title: "The Wedding of Fajar & Indah",
      bride: "Indah Permata",
      groom: "Fajar Santoso",
      eventDate: "05 Januari 2027",
      template: "Minimalist Modern Flora",
      slug: "fajar-indah",
      guestCount: 200,
      rsvpCount: 145,
      status: "Online",
    },
  ]);

  // Quick action: Verifikasi Order
  const handleApproveOrder = (orderId: string) => {
    setOrdersList((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: "LUNAS" } : ord))
    );
    showToast(`Pesanan #${orderId} berhasil diverifikasi & ditandai Lunas!`);
    setSelectedOrderModal(null);
  };

  const handlePerformLogout = () => {
    setIsLogoutModalOpen(false);
    if (onNavigate) {
      onNavigate(PATHS.login);
    } else {
      window.location.href = PATHS.login;
    }
  };

  interface NavItem {
    id: "overview" | "users" | "analytics" | "finance" | "templates" | "invitations" | "settings";
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
  }

  // Nav item list
  const navItems: NavItem[] = [
    { id: "overview", label: "Ringkasan", icon: LayoutDashboard },
    { id: "users", label: "Pengguna Terdaftar", icon: Users, badge: usersList.length },
    { id: "analytics", label: "Grafik & Penjualan", icon: BarChart3 },
    { id: "finance", label: "Keuangan & Transaksi", icon: DollarSign, badge: ordersList.filter(o => o.status === "MENUNGGU_VERIFIKASI").length },
    { id: "templates", label: "Pantauan Template", icon: Palette, badge: templatesList.length },
    { id: "invitations", label: "Undangan Tayang", icon: FileHeart, badge: invitationsList.length },
    { id: "settings", label: "Pengaturan Platform", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col md:flex-row font-sans text-neutral-800 antialiased select-none">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-neutral-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs sm:text-sm font-bold flex items-center gap-2 border border-neutral-700 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR                                                           */}
      {/* Di bagian bawah sidebarnya ada avatar, nama & email, dan di baris yang    */}
      {/* sama di bagian kanan ada tombol logout                                    */}
      {/* ========================================================================= */}
      <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white border-r border-neutral-200/80 min-h-screen h-screen sticky top-0 shrink-0 z-30 justify-between p-4 lg:p-5">
        <div className="flex flex-col gap-5">
          {/* Logo Brand SatuCerita Admin */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-xl bg-gradient-to-tr from-[#7d6aee] to-[#a394ff] flex items-center justify-center text-white font-black shadow-xs text-sm">
                SC
              </div>
              <div>
                <span className="text-base font-black tracking-tight text-neutral-900 block leading-tight">
                  Satu<span className="text-[#7d6aee]">Cerita</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-sm uppercase tracking-wider">
                  <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Admin Panel
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate ? onNavigate(PATHS.home) : (window.location.href = PATHS.home)}
              title="Ke Halaman Web Utama"
              className="p-1.5 text-neutral-400 hover:text-[#7d6aee] hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
            >
              <SquareArrowOutUpRight className="w-4 h-4" />
            </button>
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 px-3 pb-1 block">
              Menu Pengawasan
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#7d6aee] text-white shadow-xs font-bold"
                      : "text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-neutral-500"}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                        isActive
                          ? "bg-white/20 text-white"
                          : item.id === "finance" && item.badge > 0
                          ? "bg-amber-100 text-amber-800"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* SIDEBAR FOOTER: USER AVATAR + NAMA & EMAIL + TOMBOL LOGOUT DI BARIS YANG SAMA */}
        <div className="pt-4 border-t border-neutral-200/80">
          <div className="flex items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-neutral-50 border border-neutral-200/70">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={adminProfile.avatar}
                alt={adminProfile.name}
                className="size-9 rounded-full object-cover border border-[#7d6aee]/30 shrink-0 shadow-2xs"
              />
              <div className="min-w-0">
                <p className="text-xs font-bold text-neutral-900 truncate leading-tight">
                  {adminProfile.name}
                </p>
                <p className="text-[11px] text-neutral-500 truncate leading-tight">
                  {adminProfile.email}
                </p>
              </div>
            </div>

            {/* Tombol Logout di baris yang sama, di bagian kanan */}
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              title="Logout / Keluar"
              className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0 cursor-pointer"
              aria-label="Tombol Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* MOBILE HEADER (HANYA MUNCUL DI HP/TABLET KECIL)                           */}
      {/* ========================================================================= */}
      <header className="md:hidden bg-white border-b border-neutral-200 px-4 py-3 sticky top-0 z-30 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-2.5">
          <div className="size-8 rounded-lg bg-gradient-to-tr from-[#7d6aee] to-[#a394ff] flex items-center justify-center text-white font-black text-xs">
            SC
          </div>
          <div>
            <h1 className="text-sm font-black text-neutral-900 leading-tight">
              SatuCerita Admin
            </h1>
            <span className="text-[10px] text-neutral-500 font-semibold">
              {navItems.find((n) => n.id === activeTab)?.label}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-50"
            aria-label="Toggle Mobile Menu"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* MOBILE DRAWER */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-xs flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto space-y-4 animate-slideUp">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <span className="text-sm font-extrabold text-neutral-900">Menu Admin</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-full hover:bg-neutral-100 text-neutral-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold ${
                      isActive
                        ? "bg-[#7d6aee] text-white font-bold"
                        : "text-neutral-700 hover:bg-neutral-100"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge !== undefined && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-neutral-100 text-neutral-600">
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Mobile Footer with User & Logout */}
            <div className="pt-3 border-t border-neutral-200 flex items-center justify-between gap-2 p-2 rounded-xl bg-neutral-50">
              <div className="flex items-center gap-2 min-w-0">
                <img
                  src={adminProfile.avatar}
                  alt={adminProfile.name}
                  className="size-8 rounded-full object-cover shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-bold text-neutral-900 truncate">{adminProfile.name}</p>
                  <p className="text-[10px] text-neutral-500 truncate">{adminProfile.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsLogoutModalOpen(true);
                }}
                className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA                                                         */}
      {/* ========================================================================= */}
      <main className="flex-1 min-w-0 flex flex-col p-4 sm:p-6 lg:p-8 gap-6 max-w-7xl mx-auto w-full">
        {/* ----------------------------------------------------------------------- */}
        {/* TAB 1: RINGKASAN / OVERVIEW                                             */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Bar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                  Dashboard Ringkasan
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-0.5">
                  Pantauan performa platform, transaksi undangan, dan pendapatan secara real-time.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTemplateModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7d6aee] hover:bg-[#6b58e0] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Template</span>
                </button>
              </div>
            </div>

            {/* Stat KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-neutral-500">Total Undangan</p>
                    <p className="text-xl sm:text-2xl font-black text-neutral-900 mt-1">1,248</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-xs">
                    <FileHeart className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+12.5%</span>
                  <span className="text-neutral-400 font-normal">vs bulan lalu</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-neutral-500">Perlu Verifikasi</p>
                    <p className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
                      {ordersList.filter((o) => o.status === "MENUNGGU_VERIFIKASI").length} Pesanan
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-xs">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                  Butuh aksi konfirmasi bukti
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-neutral-500">Omset Bulan Ini</p>
                    <p className="text-xl sm:text-2xl font-black text-neutral-900 mt-1">Rp 14.850.000</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-xs">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+18.2%</span>
                  <span className="text-neutral-400 font-normal">target tercapai</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-neutral-200/80 shadow-xs flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-neutral-500">Pengguna Terdaftar</p>
                    <p className="text-xl sm:text-2xl font-black text-neutral-900 mt-1">{usersList.length * 160}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-500 to-[#7d6aee] text-white shadow-xs">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <span>+45 user baru</span>
                  <span className="text-neutral-400 font-normal">minggu ini</span>
                </div>
              </div>
            </div>

            {/* Quick Chart Preview & Ringkasan Penjualan */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                  <div>
                    <h2 className="text-sm sm:text-base font-extrabold text-neutral-900">
                      Tren Pendapatan &amp; Pembelian (30 Hari)
                    </h2>
                    <p className="text-xs text-neutral-400">Total 124 transaksi berhasil diselesaikan</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("analytics")}
                    className="text-xs font-bold text-[#7d6aee] hover:underline flex items-center gap-1"
                  >
                    Lihat Analitik Lengkap <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* SVG Mini Chart Bars */}
                <div className="mt-6 flex items-end gap-2 sm:gap-3 h-44 sm:h-52 pt-6 pb-2 px-2 border-b border-neutral-100">
                  {[35, 45, 60, 40, 75, 90, 65, 80, 50, 95, 110, 85, 120, 105, 130].map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      <div className="relative w-full flex justify-center">
                        <span className="absolute -top-7 hidden group-hover:block bg-neutral-900 text-white text-[10px] font-bold py-0.5 px-1.5 rounded shadow">
                          Rp {val * 120}.000
                        </span>
                        <div
                          style={{ height: `${(val / 130) * 100}%` }}
                          className={`w-full max-w-[20px] rounded-t-md transition-all ${
                            idx === 14
                              ? "bg-[#7d6aee]"
                              : "bg-purple-200 hover:bg-[#7d6aee]"
                          }`}
                        />
                      </div>
                      <span className="text-[9px] text-neutral-400 font-mono">
                        {idx * 2 + 1}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2 px-2">
                  <span>Awal Bulan (Tgl 1)</span>
                  <span>Pertengahan (Tgl 15)</span>
                  <span>Hari Ini (Tgl 30)</span>
                </div>
              </div>

              {/* Template Terpopuler Box */}
              <div className="bg-white rounded-2xl p-5 border border-neutral-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-neutral-900 pb-3 border-b border-neutral-100">
                    Template Terlaris
                  </h2>
                  <div className="mt-4 space-y-3">
                    {templatesList.slice(0, 3).map((tpl, idx) => (
                      <div key={tpl.id} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-neutral-50 transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={tpl.thumbnail}
                            alt={tpl.name}
                            className="size-10 rounded-lg object-cover border border-purple-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-neutral-900 truncate">{tpl.name}</p>
                            <p className="text-[11px] text-neutral-400">{tpl.category}</p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-[#7d6aee] shrink-0">
                          {tpl.totalUsers} x
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab("templates")}
                  className="w-full mt-4 py-2 rounded-xl border border-purple-200 text-xs font-bold text-[#7d6aee] hover:bg-purple-50 transition-colors cursor-pointer"
                >
                  Kelola Semua Template &rarr;
                </button>
              </div>
            </div>

            {/* Pesanan Terbaru yang Butuh Perhatian */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="font-extrabold text-sm sm:text-base text-neutral-900">
                    Pesanan &amp; Verifikasi Terkini
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Daftar pembayaran masuk yang menunggu verifikasi atau baru saja lunas.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("finance")}
                  className="text-xs font-bold text-[#7d6aee] hover:underline"
                >
                  Buka Menu Keuangan &rarr;
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-neutral-50/70 text-neutral-500 font-semibold border-b border-neutral-200/80 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Invoice</th>
                      <th className="py-3 px-4">Pasangan</th>
                      <th className="py-3 px-4">Template</th>
                      <th className="py-3 px-4">Nominal</th>
                      <th className="py-3 px-4">Metode</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {ordersList.slice(0, 4).map((ord) => (
                      <tr key={ord.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-3 px-4 font-mono font-bold text-neutral-700">{ord.id}</td>
                        <td className="py-3 px-4 font-bold text-neutral-900">{ord.customer}</td>
                        <td className="py-3 px-4 text-neutral-600">{ord.template}</td>
                        <td className="py-3 px-4 font-bold text-neutral-900">Rp {ord.total.toLocaleString("id-ID")}</td>
                        <td className="py-3 px-4 text-neutral-500">{ord.paymentMethod}</td>
                        <td className="py-3 px-4">
                          {ord.status === "LUNAS" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Lunas
                            </span>
                          ) : ord.status === "MENUNGGU_VERIFIKASI" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                              <Clock className="w-3 h-3 text-amber-600" />
                              Verifikasi
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                              Batal
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedOrderModal(ord)}
                            className="text-xs font-bold text-[#7d6aee] hover:underline cursor-pointer bg-purple-50 px-2.5 py-1 rounded-lg"
                          >
                            Detail
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 2: DATA PENGGUNA TERDAFTAR (USERS TABLE)                            */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === "users" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                  Manajemen Pengguna Terdaftar
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-0.5">
                  Pantau seluruh data akun pengguna, riwayat belanja, dan status keaktifan.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-neutral-500 bg-white px-3 py-2 rounded-xl border border-neutral-200">
                  Total: <strong className="text-neutral-900">{usersList.length} Akun</strong>
                </span>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama, email, atau nomor WhatsApp..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#7d6aee]/30"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => showToast("Ekspor data pengguna berhasil!")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 text-xs font-bold text-neutral-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor CSV</span>
                </button>
              </div>
            </div>

            {/* Users Data Table */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-neutral-50/70 text-neutral-500 font-semibold border-b border-neutral-200/80 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Pengguna</th>
                      <th className="py-3 px-4">Kontak WhatsApp</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Undangan</th>
                      <th className="py-3 px-4">Total Belanja</th>
                      <th className="py-3 px-4">Tgl Daftar</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {usersList
                      .filter(
                        (u) =>
                          u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.phone.includes(searchQuery)
                      )
                      .map((usr) => (
                        <tr key={usr.id} className="hover:bg-neutral-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={usr.avatar}
                                alt={usr.name}
                                className="size-8 rounded-full object-cover border border-purple-100 shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-neutral-900 truncate">{usr.name}</p>
                                <p className="text-[11px] text-neutral-400 truncate">{usr.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-mono text-neutral-600">
                            <a
                              href={`https://wa.me/${usr.phone.replace(/\D/g, "")}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-emerald-600 hover:underline inline-flex items-center gap-1"
                            >
                              {usr.phone}
                            </a>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                usr.role === "Admin"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-neutral-100 text-neutral-700"
                              }`}
                            >
                              {usr.role}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold text-neutral-800">
                            {usr.invitationsCount} Undangan
                          </td>
                          <td className="py-3 px-4 font-bold text-neutral-900">
                            Rp {usr.totalSpent.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-4 text-neutral-500 text-xs">
                            {usr.joinedDate}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                usr.status === "Aktif"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {usr.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedUserModal(usr)}
                              className="text-xs font-bold text-[#7d6aee] hover:underline cursor-pointer bg-purple-50 px-2.5 py-1 rounded-lg"
                            >
                              Kelola
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 3: GRAFIK PEMBELIAN & ANALISIS (CHARTS & ANALYTICS)                  */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === "analytics" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                  Grafik Pembelian &amp; Tren Transaksi
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-0.5">
                  Visualisasi performa penjualan paket undangan dan metode pembayaran favorit.
                </p>
              </div>

              <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-neutral-200">
                <button
                  type="button"
                  onClick={() => setTimeRange("7d")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    timeRange === "7d" ? "bg-[#7d6aee] text-white" : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  7 Hari
                </button>
                <button
                  type="button"
                  onClick={() => setTimeRange("30d")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    timeRange === "30d" ? "bg-[#7d6aee] text-white" : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  30 Hari
                </button>
                <button
                  type="button"
                  onClick={() => setTimeRange("1y")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                    timeRange === "1y" ? "bg-[#7d6aee] text-white" : "text-neutral-600 hover:bg-neutral-100"
                  }`}
                >
                  1 Tahun
                </button>
              </div>
            </div>

            {/* Metric KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
                <p className="text-xs font-semibold text-neutral-400">Total Transaksi Selesai</p>
                <p className="text-2xl font-black text-neutral-900 mt-1">142 Pesanan</p>
                <span className="text-xs font-bold text-emerald-600 mt-2 block">+24% vs periode lalu</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
                <p className="text-xs font-semibold text-neutral-400">Rata-rata Nilai Transaksi (AOV)</p>
                <p className="text-2xl font-black text-neutral-900 mt-1">Rp 148.500</p>
                <span className="text-xs font-bold text-neutral-500 mt-2 block">Dominan paket Gold & Platinum</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
                <p className="text-xs font-semibold text-neutral-400">Tingkat Konversi Pembayaran</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">94.2%</p>
                <span className="text-xs font-bold text-emerald-600 mt-2 block">QRIS terbukti paling cepat</span>
              </div>
            </div>

            {/* Big Chart Section */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-neutral-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-extrabold text-neutral-900">
                    Grafik Volume Pembelian Harian
                  </h2>
                  <p className="text-xs text-neutral-400">Jumlah pemesanan dan checkout per tanggal</p>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold text-neutral-500">
                  <span className="flex items-center gap-1.5">
                    <span className="size-3 rounded-sm bg-[#7d6aee]" /> Lunas
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="size-3 rounded-sm bg-purple-200" /> Pending
                  </span>
                </div>
              </div>

              {/* Chart Visual */}
              <div className="h-64 flex items-end gap-2 sm:gap-4 pt-8 pb-2 px-2 border-b border-neutral-100">
                {[
                  { day: "Sen", paid: 12, pending: 2 },
                  { day: "Sel", paid: 18, pending: 3 },
                  { day: "Rab", paid: 15, pending: 1 },
                  { day: "Kam", paid: 24, pending: 4 },
                  { day: "Jum", paid: 30, pending: 2 },
                  { day: "Sab", paid: 42, pending: 5 },
                  { day: "Min", paid: 38, pending: 3 },
                ].map((item, idx) => {
                  const maxH = 50;
                  return (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                      <div className="relative w-full flex flex-col items-center justify-end h-full">
                        <span className="absolute -top-7 hidden group-hover:block bg-neutral-900 text-white text-[10px] font-bold py-0.5 px-2 rounded shadow whitespace-nowrap">
                          {item.paid} Lunas / {item.pending} Pending
                        </span>
                        <div
                          style={{ height: `${(item.pending / maxH) * 100}%` }}
                          className="w-full max-w-[32px] bg-purple-200 rounded-t-sm"
                        />
                        <div
                          style={{ height: `${(item.paid / maxH) * 100}%` }}
                          className="w-full max-w-[32px] bg-[#7d6aee] rounded-t-sm"
                        />
                      </div>
                      <span className="text-xs font-bold text-neutral-600">{item.day}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Breakdown Metode Pembayaran */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
                <h3 className="text-sm font-extrabold text-neutral-900 mb-4">
                  Metode Pembayaran Paling Digunakan
                </h3>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs font-bold text-neutral-700 mb-1">
                      <span>QRIS Instant (GoPay/ShopeePay/BCA)</span>
                      <span>58% (82 Transaksi)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div className="bg-[#7d6aee] h-full rounded-full" style={{ width: "58%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-neutral-700 mb-1">
                      <span>BCA Virtual Account</span>
                      <span>24% (34 Transaksi)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div className="bg-indigo-500 h-full rounded-full" style={{ width: "24%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-neutral-700 mb-1">
                      <span>Mandiri Virtual Account</span>
                      <span>12% (17 Transaksi)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div className="bg-blue-400 h-full rounded-full" style={{ width: "12%" }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-bold text-neutral-700 mb-1">
                      <span>E-Wallet GoPay Direct</span>
                      <span>6% (9 Transaksi)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: "6%" }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
                <h3 className="text-sm font-extrabold text-neutral-900 mb-4">
                  Kategori Undangan Paling Laris
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/50 border border-purple-100">
                    <span className="text-xs font-bold text-neutral-800">Pernikahan (Wedding)</span>
                    <span className="text-xs font-black text-[#7d6aee]">78% dari total pesanan</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
                    <span className="text-xs font-bold text-neutral-800">Lamaran &amp; Tunangan</span>
                    <span className="text-xs font-black text-neutral-700">14% dari total pesanan</span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
                    <span className="text-xs font-bold text-neutral-800">Khitanan &amp; Ulang Tahun</span>
                    <span className="text-xs font-black text-neutral-700">8% dari total pesanan</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 4: KEUANGAN & TRANSAKSI (FINANCE DATA TABLE)                         */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === "finance" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                  Keuangan &amp; Verifikasi Transaksi
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-0.5">
                  Validasi transfer bank, konfirmasi bukti pembayaran, dan riwayat arus kas platform.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => showToast("Laporan keuangan berhasil diunduh!")}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#7d6aee] text-white text-xs font-bold shadow-xs hover:bg-[#6b58e0]"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Cetak Rekap Keuangan</span>
                </button>
              </div>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
                <span className="text-xs font-semibold text-neutral-400">Total Pemasukan Bersih</span>
                <p className="text-2xl font-black text-emerald-600 mt-1">Rp 14.850.000</p>
                <span className="text-[11px] text-neutral-500 mt-1 block">Bulan Berjalan (Oktober 2026)</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
                <span className="text-xs font-semibold text-neutral-400">Pending Verifikasi Manual</span>
                <p className="text-2xl font-black text-amber-600 mt-1">
                  Rp{" "}
                  {ordersList
                    .filter((o) => o.status === "MENUNGGU_VERIFIKASI")
                    .reduce((acc, curr) => acc + curr.total, 0)
                    .toLocaleString("id-ID")}
                </p>
                <span className="text-[11px] text-amber-700 font-semibold mt-1 block">
                  {ordersList.filter((o) => o.status === "MENUNGGU_VERIFIKASI").length} pesanan menanti konfirmasi
                </span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs">
                <span className="text-xs font-semibold text-neutral-400">Biaya Payment Gateway (Est.)</span>
                <p className="text-2xl font-black text-neutral-900 mt-1">Rp 124.500</p>
                <span className="text-[11px] text-neutral-500 mt-1 block">0.7% QRIS MDR Rate</span>
              </div>
            </div>

            {/* Orders Data Table */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="font-extrabold text-sm sm:text-base text-neutral-900">
                  Daftar Seluruh Pesanan
                </h2>
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Cari no invoice / pemesan..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs rounded-xl border border-neutral-200 focus:outline-none focus:ring-2 focus:ring-[#7d6aee]/30 w-full sm:w-64"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-neutral-50/70 text-neutral-500 font-semibold border-b border-neutral-200/80 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">No. Invoice</th>
                      <th className="py-3 px-4">Nama Pasangan</th>
                      <th className="py-3 px-4">Template &amp; Paket</th>
                      <th className="py-3 px-4">Metode Bayar</th>
                      <th className="py-3 px-4">Total + Unik</th>
                      <th className="py-3 px-4">Waktu Pesan</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {ordersList
                      .filter(
                        (ord) =>
                          ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ord.customer.toLowerCase().includes(searchQuery.toLowerCase())
                      )
                      .map((ord) => (
                        <tr key={ord.id} className="hover:bg-neutral-50/60 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-neutral-800">{ord.id}</td>
                          <td className="py-3 px-4">
                            <p className="font-bold text-neutral-900">{ord.customer}</p>
                            <p className="text-[11px] text-neutral-400">{ord.customerEmail}</p>
                          </td>
                          <td className="py-3 px-4">
                            <p className="font-semibold text-neutral-800">{ord.template}</p>
                            <span className="text-[10px] bg-neutral-100 px-1.5 py-0.2 rounded text-neutral-600 font-bold">
                              {ord.tier}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-neutral-600 font-medium">{ord.paymentMethod}</td>
                          <td className="py-3 px-4 font-black text-neutral-900">
                            Rp {ord.total.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3 px-4 text-neutral-500 text-xs">{ord.date}</td>
                          <td className="py-3 px-4">
                            {ord.status === "LUNAS" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                Lunas
                              </span>
                            ) : ord.status === "MENUNGGU_VERIFIKASI" ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 animate-pulse">
                                <Clock className="w-3 h-3 text-amber-600" />
                                Menunggu
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                                Batal
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedOrderModal(ord)}
                              className="text-xs font-bold text-[#7d6aee] hover:bg-purple-100 bg-purple-50 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                            >
                              Detail &amp; Verifikasi
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 5: PANTAUAN TEMPLATE (TEMPLATES & USAGE MONITOR)                     */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === "templates" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                  Pantauan Template &amp; Penggunanya
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-0.5">
                  Statistik popularitas setiap desain template, jumlah pemakai aktif, dan pendapatan yang dihasilkan.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddTemplateModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7d6aee] hover:bg-[#6b58e0] text-white text-xs sm:text-sm font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Template Baru</span>
                </button>
              </div>
            </div>

            {/* Template Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
                <span className="text-xs text-neutral-400 font-semibold">Total Template Aktif</span>
                <p className="text-xl font-black text-neutral-900 mt-1">{templatesList.length} Desain</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
                <span className="text-xs text-neutral-400 font-semibold">Total Undangan Dibuat</span>
                <p className="text-xl font-black text-neutral-900 mt-1">
                  {templatesList.reduce((acc, t) => acc + t.totalUsers, 0)} Undangan
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
                <span className="text-xs text-neutral-400 font-semibold">Akumulasi Omset Template</span>
                <p className="text-xl font-black text-emerald-600 mt-1">
                  Rp {(templatesList.reduce((acc, t) => acc + t.totalRevenue, 0) / 1000000).toFixed(1)} Juta
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-neutral-200/80 shadow-xs">
                <span className="text-xs text-neutral-400 font-semibold">Rating Kepuasan Tamu</span>
                <p className="text-xl font-black text-amber-500 mt-1">4.9 / 5.0 ⭐</p>
              </div>
            </div>

            {/* Templates Data Table */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-neutral-50/70 text-neutral-500 font-semibold border-b border-neutral-200/80 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Preview</th>
                      <th className="py-3 px-4">Nama Template</th>
                      <th className="py-3 px-4">Kategori &amp; Tier</th>
                      <th className="py-3 px-4">Harga Jual</th>
                      <th className="py-3 px-4">Pengguna Aktif</th>
                      <th className="py-3 px-4">Total Omset</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {templatesList.map((tpl) => (
                      <tr key={tpl.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <img
                            src={tpl.thumbnail}
                            alt={tpl.name}
                            className="size-12 rounded-xl object-cover border border-purple-100 shadow-2xs"
                          />
                        </td>
                        <td className="py-3 px-4 font-bold text-neutral-900">
                          {tpl.name}
                          <span className="block text-[11px] text-amber-600 font-medium">
                            ⭐ {tpl.rating} (Review Positif)
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-neutral-700 font-semibold">{tpl.category}</p>
                          <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded">
                            {tpl.tier}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-neutral-900 block">
                            Rp {tpl.price.toLocaleString("id-ID")}
                          </span>
                          <span className="text-[10px] text-neutral-400 line-through">
                            Rp {tpl.originalPrice.toLocaleString("id-ID")}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 font-black text-[#7d6aee]">
                            {tpl.totalUsers} Pasangan
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-700">
                          Rp {tpl.totalRevenue.toLocaleString("id-ID")}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            {tpl.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => showToast(`Membuka demo pratinjau ${tpl.name}`)}
                              className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:text-[#7d6aee] hover:bg-neutral-50"
                              title="Lihat Pratinjau Template"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => showToast(`Edit template ${tpl.name}`)}
                              className="p-1.5 rounded-lg border border-neutral-200 text-neutral-600 hover:text-[#7d6aee] hover:bg-neutral-50"
                              title="Edit Template"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 6: UNDANGAN AKTIF / TAYANG (LIVE INVITATIONS MONITOR)               */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === "invitations" && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                  Undangan Tayang &amp; Publikasi Tamu
                </h1>
                <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-0.5">
                  Pantau tautan website undangan pernikahan yang sedang aktif diakses oleh para tamu.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  {invitationsList.length} Undangan Online
                </span>
              </div>
            </div>

            {/* Invitations Table */}
            <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-neutral-50/70 text-neutral-500 font-semibold border-b border-neutral-200/80 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Judul Acara</th>
                      <th className="py-3 px-4">Pasangan Pengantin</th>
                      <th className="py-3 px-4">Tanggal Resepsi</th>
                      <th className="py-3 px-4">Template</th>
                      <th className="py-3 px-4">Tamu &amp; RSVP</th>
                      <th className="py-3 px-4">Link Undangan</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {invitationsList.map((inv) => (
                      <tr key={inv.id} className="hover:bg-neutral-50/60 transition-colors">
                        <td className="py-3 px-4 font-bold text-neutral-900">{inv.title}</td>
                        <td className="py-3 px-4 text-neutral-700">
                          {inv.groom} &amp; {inv.bride}
                        </td>
                        <td className="py-3 px-4 text-neutral-600 font-medium">{inv.eventDate}</td>
                        <td className="py-3 px-4 text-neutral-600">{inv.template}</td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-neutral-900">{inv.rsvpCount}</span>
                          <span className="text-neutral-400 text-xs"> / {inv.guestCount} Hadir</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs text-[#7d6aee] bg-purple-50 px-2 py-0.5 rounded-md">
                            satucerita.id/{inv.slug}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <a
                            href={`/${inv.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-bold text-[#7d6aee] hover:underline bg-purple-50 px-2.5 py-1 rounded-lg"
                          >
                            <span>Buka</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 7: PENGATURAN PLATFORM                                              */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === "settings" && (
          <div className="space-y-6 animate-fadeIn">
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                Pengaturan Sistem Platform
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 font-medium mt-0.5">
                Konfigurasi akun rekening pembayaran, gateway WhatsApp, dan koneksi Supabase.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Gateway Config */}
              <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#7d6aee]" />
                    <h3 className="text-sm font-extrabold text-neutral-900">
                      Rekening Pembayaran &amp; QRIS
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
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
                      defaultValue="882-019-4821 a.n PT SATU CERITA DIGITAL"
                      className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-neutral-700 block mb-1">
                      Merchant QRIS Statis / Dinamis
                    </label>
                    <input
                      type="text"
                      defaultValue="NMID: ID1020304958291"
                      className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 bg-neutral-50 font-mono"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => showToast("Pengaturan pembayaran berhasil disimpan!")}
                    className="w-full py-2 bg-[#7d6aee] text-white text-xs font-bold rounded-xl hover:bg-[#6b58e0] cursor-pointer"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>

              {/* Database & Supabase Status */}
              <div className="bg-white p-5 rounded-2xl border border-neutral-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-sm font-extrabold text-neutral-900">
                      Koneksi Backend Supabase
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                    Terkonfigurasi
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <p className="text-neutral-500">
                    File migrasi database dan skema PostgreSQL telah diatur di direktori:
                  </p>
                  <div className="p-3 rounded-xl bg-neutral-900 text-neutral-200 font-mono text-[11px] leading-relaxed">
                    supabase/migrations/20260101000000_initial_schema.sql
                  </div>
                  <p className="text-neutral-500">
                    Tabel: <code className="font-bold text-neutral-800">users, orders, templates, invitations, rsvps, guestbook</code>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODAL: DETAIL USER & EDIT                                                 */}
      {/* ========================================================================= */}
      {selectedUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Detail Pengguna</h3>
              <button
                type="button"
                onClick={() => setSelectedUserModal(null)}
                className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <img
                src={selectedUserModal.avatar}
                alt={selectedUserModal.name}
                className="size-14 rounded-full object-cover border-2 border-[#7d6aee]"
              />
              <div>
                <h4 className="text-base font-bold text-neutral-900">{selectedUserModal.name}</h4>
                <p className="text-xs text-neutral-500">{selectedUserModal.email}</p>
                <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full mt-1 inline-block">
                  Role: {selectedUserModal.role}
                </span>
              </div>
            </div>

            <div className="bg-neutral-50 p-3.5 rounded-xl text-xs space-y-2 border border-neutral-100">
              <div className="flex justify-between">
                <span className="text-neutral-500">Nomor WhatsApp:</span>
                <span className="font-bold text-neutral-800">{selectedUserModal.phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Jumlah Undangan:</span>
                <span className="font-bold text-neutral-800">{selectedUserModal.invitationsCount} Undangan</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Total Transaksi:</span>
                <span className="font-bold text-emerald-600">
                  Rp {selectedUserModal.totalSpent.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Tanggal Bergabung:</span>
                <span className="font-bold text-neutral-800">{selectedUserModal.joinedDate}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSelectedUserModal(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast(`Pesan WhatsApp dikirimkan ke ${selectedUserModal.name}`);
                  setSelectedUserModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 flex items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Hubungi WA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DETAIL PESANAN & VERIFIKASI PEMBAYARAN                             */}
      {/* ========================================================================= */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-neutral-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div>
                <h3 className="text-base font-bold text-neutral-900">
                  Verifikasi Pesanan #{selectedOrderModal.id}
                </h3>
                <span className="text-xs text-neutral-400">{selectedOrderModal.date}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderModal(null)}
                className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-100 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-neutral-500">Pemesan:</span>
                <span className="font-bold text-neutral-900">{selectedOrderModal.customer}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Email:</span>
                <span className="font-medium text-neutral-700">{selectedOrderModal.customerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">WhatsApp:</span>
                <span className="font-medium text-neutral-700">{selectedOrderModal.customerPhone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Template / Paket:</span>
                <span className="font-bold text-neutral-900">
                  {selectedOrderModal.template} ({selectedOrderModal.tier})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Metode Pembayaran:</span>
                <span className="font-bold text-[#7d6aee]">{selectedOrderModal.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold border-t border-neutral-200 pt-2 mt-2">
                <span className="text-neutral-900">Total Nominal (+ Unik):</span>
                <span className="text-emerald-600">
                  Rp {selectedOrderModal.total.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {/* Bukti Transfer */}
            {selectedOrderModal.proofUrl ? (
              <div>
                <p className="text-xs font-bold text-neutral-800 mb-2">Foto / Bukti Transfer:</p>
                <img
                  src={selectedOrderModal.proofUrl}
                  alt="Bukti Transfer"
                  className="w-full h-44 object-cover rounded-xl border border-neutral-200"
                />
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200">
                Belum ada lampiran bukti transfer manual (Pembayaran otomatis QRIS/VA terdeteksi di gateway).
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setSelectedOrderModal(null)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
              >
                Tutup
              </button>
              {selectedOrderModal.status !== "LUNAS" && (
                <button
                  type="button"
                  onClick={() => handleApproveOrder(selectedOrderModal.id)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700 shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Setujui &amp; Tandai Lunas</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH TEMPLATE BARU                                               */}
      {/* ========================================================================= */}
      {isAddTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-neutral-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Tambah Template Baru</h3>
              <button
                type="button"
                onClick={() => setIsAddTemplateModalOpen(false)}
                className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Nama Template
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Golden Serenade Royal"
                  className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-[#7d6aee]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    Kategori
                  </label>
                  <select className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 bg-white">
                    <option>Floral &amp; Elegant</option>
                    <option>Luxury &amp; Modern</option>
                    <option>Tradisional Adat</option>
                    <option>Minimalist Clean</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    Tier Paket
                  </label>
                  <select className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 bg-white">
                    <option>Gold Tier</option>
                    <option>Silver Tier</option>
                    <option>Platinum Tier</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-700 block mb-1">
                  Harga Promo (Rp)
                </label>
                <input
                  type="number"
                  defaultValue={149000}
                  className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 focus:outline-none focus:border-[#7d6aee]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsAddTemplateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast("Template baru berhasil ditambahkan ke katalog!");
                  setIsAddTemplateModalOpen(false);
                }}
                className="px-5 py-2 rounded-xl bg-[#7d6aee] text-white text-xs font-bold hover:bg-[#6b58e0] shadow-xs cursor-pointer"
              >
                Simpan Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL KONFIRMASI LOGOUT                                                   */}
      {/* ========================================================================= */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-neutral-100 overflow-hidden p-6 text-center">
            <div className="size-14 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <LogOut className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-neutral-900 tracking-tight">
              Keluar dari Admin Dashboard?
            </h3>
            <p className="text-xs text-neutral-500 font-medium mt-1 leading-relaxed">
              Sesi login administrator Anda akan diakhiri dan diarahkan kembali ke halaman masuk.
            </p>

            <div className="grid grid-cols-2 gap-2 mt-5">
              <button
                type="button"
                onClick={() => setIsLogoutModalOpen(false)}
                className="py-2.5 px-4 rounded-xl border border-neutral-200 text-neutral-700 text-xs font-bold hover:bg-neutral-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handlePerformLogout}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold shadow-sm cursor-pointer"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDash;
