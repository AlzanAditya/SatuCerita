import React, { useState, useMemo, useEffect } from "react";
import {
  LayoutGrid,
  Users,
  Palette,
  Settings,
  LogOut,
  CheckCircle2,
  Clock,
  ExternalLink,
  Plus,
  SquareArrowOutUpRight,
  Eye,
  X,
  Check,
  Edit3,
  Phone,
  CreditCard,
  Pencil,
  Camera,
  Upload,
  ChartPie,
  Wallet,
  Radio,
  HeartHandshake,
  ChevronRight,
  PanelLeft,
  PanelLeftOpen,
} from "lucide-react";
import { AppNavbar, DashPeriodType } from "@/components/app/AppNavbar";
import { Button } from "@/components/ui/Button";
import { DataTableColumn } from "@/components/ui/DataTable";
import { PATHS } from "@/routes";
import {
  getAdminSettingsCache,
  saveAdminSettingsCache,
  getCache,
  setCache,
  CACHE_KEYS,
  convertFileToDataUrl,
  AdminProfileData,
  AdminSettingsData,
} from "@/lib/cache";
import { useAuth } from "@/context/AuthContext";
import { avatarFallback, updateProfile } from "@/lib/auth";
import {
  DashTabType,
  AdminDashProps,
  AdminUserData,
  AdminOrderItem,
  AdminTemplateItem,
  AdminInvitationItem,
  PeriodDataResult,
  formatIndonesianDateShort,
  parseOrderTimestamp,
  pathToDashTab,
  dashTabToPath,
} from "./types";
import { OverviewPage } from "./OverviewPage";
import { UsersPage } from "./UsersPage";
import { AnalyticsPage } from "./AnalyticsPage";
import { FinancePage } from "./FinancePage";
import { TemplatesPage } from "./TemplatesPage";
import { InvitationsPage } from "./InvitationsPage";
import { SettingsPage } from "./SettingsPage";

export * from "./types";

export const AdminDash: React.FC<AdminDashProps> = ({
  currentPath = "/dash",
  activeTab: activeTabProp,
  onNavigate,
}) => {
  const isStandalone = useMemo(() => {
    if (typeof window === "undefined") return false;
    return (
      window.location.hostname.startsWith("dash.") ||
      (!window.location.pathname.startsWith("/dash") &&
        window.location.pathname !== "/")
    );
  }, []);

  const [activeTab, setActiveTab] = useState<DashTabType>(() => {
    if (activeTabProp) return activeTabProp;
    if (currentPath) return pathToDashTab(currentPath);
    if (typeof window !== "undefined") {
      return pathToDashTab(window.location.pathname);
    }
    return "overview";
  });

  // Sinkronkan activeTab saat currentPath berubah dari router luar
  useEffect(() => {
    if (activeTabProp) {
      setActiveTab(activeTabProp);
    } else if (currentPath) {
      setActiveTab(pathToDashTab(currentPath));
    }
  }, [activeTabProp, currentPath]);

  // Handle popstate (tombol back/forward browser)
  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname;
      setActiveTab(pathToDashTab(p));
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleSelectTab = (tab: DashTabType) => {
    setActiveTab(tab);
    setCache(CACHE_KEYS.DASH_ACTIVE_TAB, tab);
    const targetPath = dashTabToPath(tab, isStandalone);
    if (onNavigate) {
      onNavigate(targetPath);
    } else if (typeof window !== "undefined") {
      window.history.pushState(null, "", targetPath);
    }
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  };

  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [invitationSearchQuery, setInvitationSearchQuery] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<DashPeriodType>("Bulanan");
  const [selectedUserModal, setSelectedUserModal] = useState<AdminUserData | null>(null);
  const [selectedOrderModal, setSelectedOrderModal] = useState<AdminOrderItem | null>(null);
  const [isAddTemplateModalOpen, setIsAddTemplateModalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "1y">("30d");

  // Admin Profile Info dari Cache
  // Profil admin diambil dari akun Google yang login (bukan data bawaan).
  const { user: sessionUser, setUser: setSessionUser, signOut } = useAuth();
  const adminAvatarKey = `satucerita_avatar_${sessionUser.id}`;
  const [adminAvatarOverride, setAdminAvatarOverride] = useState<string>(() =>
    getCache<string>(adminAvatarKey, "")
  );
  const adminProfile: AdminProfileData = {
    name: sessionUser.name,
    email: sessionUser.email,
    phone: sessionUser.phone,
    role: "Admin",
    avatar: adminAvatarOverride || sessionUser.avatar || avatarFallback(sessionUser.name),
  };

  // Modal Edit Profil Admin (Foto & WhatsApp)
  const [isEditAdminProfileOpen, setIsEditAdminProfileOpen] = useState(false);
  const [editAdminName, setEditAdminName] = useState(adminProfile.name);
  const [editAdminEmail, setEditAdminEmail] = useState(adminProfile.email);
  const [editAdminPhone, setEditAdminPhone] = useState(adminProfile.phone);
  const [editAdminAvatar, setEditAdminAvatar] = useState(adminProfile.avatar);

  // Settings Platform dari Cache
  const [adminSettings, setAdminSettings] = useState<AdminSettingsData>(() =>
    getAdminSettingsCache()
  );

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. DATA PENGGUNA TERDAFTAR
  const [usersList] = useState<AdminUserData[]>(() =>
    getCache(CACHE_KEYS.ADMIN_USERS, [
      {
        id: "USR-001",
        name: "Alzan Bella",
        email: "alzanaditya2@gmail.com",
        phone: "+62 851-8797-8443",
        role: "Admin",
        invitationsCount: 3,
        totalSpent: 447000,
        joinedDate: "11 Okt 2026",
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
        joinedDate: "10 Okt 2026",
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
        joinedDate: "08 Okt 2026",
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
        joinedDate: "02 Okt 2026",
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
        joinedDate: "25 Sep 2026",
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
        joinedDate: "15 Agu 2026",
        status: "Pending",
        avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80",
      },
      {
        id: "USR-007",
        name: "Budi Santoso",
        email: "buditiara@gmail.com",
        phone: "+62 852-6677-8899",
        role: "Pengguna",
        invitationsCount: 1,
        totalSpent: 99000,
        joinedDate: "12 Jan 2026",
        status: "Aktif",
        avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
      },
      {
        id: "USR-008",
        name: "Arif Hidayat",
        email: "arif.sarah@gmail.com",
        phone: "+62 899-5544-3322",
        role: "Pengguna",
        invitationsCount: 1,
        totalSpent: 199000,
        joinedDate: "20 Des 2025",
        status: "Aktif",
        avatar: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80",
      },
    ])
  );

  useEffect(() => {
    setCache(CACHE_KEYS.ADMIN_USERS, usersList);
  }, [usersList]);

  // 2. DATA KEUANGAN & TRANSAKSI
  const [ordersList, setOrdersList] = useState<AdminOrderItem[]>([
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
    {
      id: "SC-ORD-8816",
      customer: "Andi Wijaya & Maya",
      customerEmail: "andi.maya@gmail.com",
      customerPhone: "+62 813-2233-4455",
      template: "Elysian Bloom (Gold)",
      tier: "Gold Tier",
      amount: 149000,
      uniqueCode: 72,
      total: 149072,
      paymentMethod: "QRIS",
      status: "LUNAS",
      date: "08 Okt 2026, 16:30",
      proofUrl: null,
    },
  ]);

  // 3. DATA PANTAUAN TEMPLATE
  const [templatesList] = useState<AdminTemplateItem[]>([
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

  // 4. DATA UNDANGAN AKTIF / BERLANGSUNG
  const [invitationsList] = useState<AdminInvitationItem[]>([
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
    {
      id: "INV-104",
      title: "The Wedding of Reza & Maya",
      bride: "Maya Novita",
      groom: "Reza Ramadhan",
      eventDate: "01 Juni 2026",
      template: "Deluxe Royal Navy",
      slug: "reza-maya",
      guestCount: 400,
      rsvpCount: 388,
      status: "Online",
    },
    {
      id: "INV-105",
      title: "Pernikahan Alzan & Bella",
      bride: "Bella Safitri",
      groom: "Alzan Aditya",
      eventDate: "27 Agustus 2025",
      template: "Elysian Bloom (Gold)",
      slug: "alzan-bella",
      guestCount: 600,
      rsvpCount: 540,
      status: "Online",
    },
    {
      id: "INV-106",
      title: "The Wedding of Gilang & Vina",
      bride: "Vina Pandu",
      groom: "Gilang Pratama",
      eventDate: "18 September 2026",
      template: "Adat Jawa Klasik Keraton",
      slug: "gilang-vina",
      guestCount: 300,
      rsvpCount: 260,
      status: "Online",
    },
  ]);

  // PERIOD DATA CALCULATION
  const periodData: PeriodDataResult = useMemo(() => {
    let startCurrent = 0;
    let endCurrent = new Date(2026, 9, 11, 23, 59, 59).getTime();
    let startPrev = 0;
    let endPrev = 0;
    let comparisonLabel = "";
    let periodTitle = "";
    let chartTitle = "";
    let chartCategories: { label: string; filter: (t: number) => boolean }[] = [];

    if (selectedPeriod === "Harian") {
      const d1 = new Date(2026, 9, 11, 0, 0, 0).getTime();
      const d2 = new Date(2026, 9, 11, 23, 59, 59).getTime();
      const p1 = new Date(2026, 9, 10, 0, 0, 0).getTime();
      const p2 = new Date(2026, 9, 10, 23, 59, 59).getTime();
      startCurrent = d1;
      endCurrent = d2;
      startPrev = p1;
      endPrev = p2;
      comparisonLabel = "vs kemarin";
      periodTitle = "Hari Ini (11 Okt 2026)";
      chartTitle = "Grafik Transaksi Per Jam (Hari Ini)";
      chartCategories = [
        { label: "08:00", filter: (t) => t >= new Date(2026, 9, 11, 6, 0).getTime() && t < new Date(2026, 9, 11, 10, 0).getTime() },
        { label: "11:00", filter: (t) => t >= new Date(2026, 9, 11, 10, 0).getTime() && t < new Date(2026, 9, 11, 13, 0).getTime() },
        { label: "14:00", filter: (t) => t >= new Date(2026, 9, 11, 13, 0).getTime() && t < new Date(2026, 9, 11, 16, 0).getTime() },
        { label: "17:00", filter: (t) => t >= new Date(2026, 9, 11, 16, 0).getTime() && t < new Date(2026, 9, 11, 19, 0).getTime() },
        { label: "20:00", filter: (t) => t >= new Date(2026, 9, 11, 19, 0).getTime() && t < new Date(2026, 9, 11, 22, 0).getTime() },
        { label: "23:00", filter: (t) => t >= new Date(2026, 9, 11, 22, 0).getTime() && t <= new Date(2026, 9, 11, 23, 59).getTime() },
      ];
    } else if (selectedPeriod === "Mingguan") {
      const d1 = new Date(2026, 9, 5, 0, 0, 0).getTime();
      const d2 = new Date(2026, 9, 11, 23, 59, 59).getTime();
      const p1 = new Date(2026, 8, 28, 0, 0, 0).getTime();
      const p2 = new Date(2026, 9, 4, 23, 59, 59).getTime();
      startCurrent = d1;
      endCurrent = d2;
      startPrev = p1;
      endPrev = p2;
      comparisonLabel = "vs 7 hari lalu";
      periodTitle = "Minggu Ini (5 - 11 Okt 2026)";
      chartTitle = "Grafik Pendapatan Mingguan (7 Hari Terakhir)";
      chartCategories = [
        { label: "Sen (5)", filter: (t) => t >= new Date(2026, 9, 5, 0).getTime() && t < new Date(2026, 9, 6, 0).getTime() },
        { label: "Sel (6)", filter: (t) => t >= new Date(2026, 9, 6, 0).getTime() && t < new Date(2026, 9, 7, 0).getTime() },
        { label: "Rab (7)", filter: (t) => t >= new Date(2026, 9, 7, 0).getTime() && t < new Date(2026, 9, 8, 0).getTime() },
        { label: "Kam (8)", filter: (t) => t >= new Date(2026, 9, 8, 0).getTime() && t < new Date(2026, 9, 9, 0).getTime() },
        { label: "Jum (9)", filter: (t) => t >= new Date(2026, 9, 9, 0).getTime() && t < new Date(2026, 9, 10, 0).getTime() },
        { label: "Sab (10)", filter: (t) => t >= new Date(2026, 9, 10, 0).getTime() && t < new Date(2026, 9, 11, 0).getTime() },
        { label: "Min (11)", filter: (t) => t >= new Date(2026, 9, 11, 0).getTime() && t <= new Date(2026, 9, 11, 23, 59, 59).getTime() },
      ];
    } else if (selectedPeriod === "Bulanan") {
      const d1 = new Date(2026, 9, 1, 0, 0, 0).getTime();
      const d2 = new Date(2026, 9, 31, 23, 59, 59).getTime();
      const p1 = new Date(2026, 8, 1, 0, 0, 0).getTime();
      const p2 = new Date(2026, 8, 30, 23, 59, 59).getTime();
      startCurrent = d1;
      endCurrent = d2;
      startPrev = p1;
      endPrev = p2;
      comparisonLabel = "vs bulan lalu";
      periodTitle = "Bulan Ini (Oktober 2026)";
      chartTitle = "Tren Pendapatan & Pembelian (30 Hari)";
      chartCategories = [
        { label: "Tgl 1-5", filter: (t) => t >= new Date(2026, 9, 1, 0).getTime() && t < new Date(2026, 9, 6, 0).getTime() },
        { label: "Tgl 6-10", filter: (t) => t >= new Date(2026, 9, 6, 0).getTime() && t < new Date(2026, 9, 11, 0).getTime() },
        { label: "Tgl 11-15", filter: (t) => t >= new Date(2026, 9, 11, 0).getTime() && t < new Date(2026, 9, 16, 0).getTime() },
        { label: "Tgl 16-20", filter: (t) => t >= new Date(2026, 9, 16, 0).getTime() && t < new Date(2026, 9, 21, 0).getTime() },
        { label: "Tgl 21-25", filter: (t) => t >= new Date(2026, 9, 21, 0).getTime() && t < new Date(2026, 9, 26, 0).getTime() },
        { label: "Tgl 26-31", filter: (t) => t >= new Date(2026, 9, 26, 0).getTime() && t <= new Date(2026, 9, 31, 23, 59, 59).getTime() },
      ];
    } else {
      startCurrent = 0;
      endCurrent = new Date(2030, 11, 31).getTime();
      startPrev = 0;
      endPrev = 0;
      comparisonLabel = "sepanjang waktu";
      periodTitle = "Semua Waktu";
      chartTitle = "Akumulasi Pendapatan Historis Platform";
      chartCategories = [
        { label: "2025 Q4", filter: (t) => t >= new Date(2025, 9, 1).getTime() && t < new Date(2026, 0, 1).getTime() },
        { label: "2026 Q1", filter: (t) => t >= new Date(2026, 0, 1).getTime() && t < new Date(2026, 3, 1).getTime() },
        { label: "2026 Q2", filter: (t) => t >= new Date(2026, 3, 1).getTime() && t < new Date(2026, 6, 1).getTime() },
        { label: "2026 Q3", filter: (t) => t >= new Date(2026, 6, 1).getTime() && t < new Date(2026, 9, 1).getTime() },
        { label: "2026 Q4", filter: (t) => t >= new Date(2026, 9, 1).getTime() && t <= new Date(2026, 11, 31).getTime() },
      ];
    }

    const currentOrders = ordersList.filter((ord) => {
      if (selectedPeriod === "Semua") return true;
      const t = parseOrderTimestamp(ord.date);
      return t >= startCurrent && t <= endCurrent;
    });

    const prevOrders = ordersList.filter((ord) => {
      if (selectedPeriod === "Semua" || startPrev === 0) return false;
      const t = parseOrderTimestamp(ord.date);
      return t >= startPrev && t <= endPrev;
    });

    const currentRevenue = currentOrders
      .filter((o) => o.status === "LUNAS")
      .reduce((acc, curr) => acc + curr.total, 0);

    const prevRevenue = prevOrders
      .filter((o) => o.status === "LUNAS")
      .reduce((acc, curr) => acc + curr.total, 0);

    let revenueGrowth = "+0.0%";
    let isRevenueUp = true;
    if (selectedPeriod === "Semua") {
      revenueGrowth = "Akumulasi";
      isRevenueUp = true;
    } else if (prevRevenue > 0) {
      const diff = ((currentRevenue - prevRevenue) / prevRevenue) * 100;
      revenueGrowth = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
      isRevenueUp = diff >= 0;
    } else if (currentRevenue > 0) {
      revenueGrowth = "+100%";
      isRevenueUp = true;
    }

    const pendingOrders = currentOrders.filter((o) => o.status === "MENUNGGU_VERIFIKASI");

    const totalInvitationsCount = invitationsList.filter((inv) => {
      if (selectedPeriod === "Semua") return true;
      const t = parseOrderTimestamp(inv.eventDate);
      return t >= startCurrent && t <= endCurrent;
    }).length || currentOrders.length;

    const prevInvitationsCount = invitationsList.filter((inv) => {
      if (selectedPeriod === "Semua" || startPrev === 0) return false;
      const t = parseOrderTimestamp(inv.eventDate);
      return t >= startPrev && t <= endPrev;
    }).length || prevOrders.length;

    let invitationGrowth = "+0.0%";
    let isInvUp = true;
    if (selectedPeriod === "Semua") {
      invitationGrowth = "Semua Acara";
    } else if (prevInvitationsCount > 0) {
      const diff = ((totalInvitationsCount - prevInvitationsCount) / prevInvitationsCount) * 100;
      invitationGrowth = `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`;
      isInvUp = diff >= 0;
    } else {
      invitationGrowth = `+${totalInvitationsCount}`;
    }

    const currentUsers = usersList.filter((u) => {
      if (selectedPeriod === "Semua") return true;
      const t = parseOrderTimestamp(u.joinedDate);
      return t >= startCurrent && t <= endCurrent;
    });
    const prevUsers = usersList.filter((u) => {
      if (selectedPeriod === "Semua" || startPrev === 0) return false;
      const t = parseOrderTimestamp(u.joinedDate);
      return t >= startPrev && t <= endPrev;
    });

    const newUsersCount = currentUsers.length;
    const prevNewUsersCount = prevUsers.length;
    let userGrowthText = `${newUsersCount} user baru`;
    if (selectedPeriod === "Semua") {
      userGrowthText = `${usersList.length} total akun`;
    } else if (prevNewUsersCount > 0) {
      const diff = ((newUsersCount - prevNewUsersCount) / prevNewUsersCount) * 100;
      userGrowthText = `${diff >= 0 ? "+" : ""}${diff.toFixed(0)}% vs periode lalu`;
    }

    const chartBars = chartCategories.map((cat) => {
      const ordersInCat = currentOrders.filter(
        (o) => o.status === "LUNAS" && cat.filter(parseOrderTimestamp(o.date))
      );
      const rev = ordersInCat.reduce((acc, curr) => acc + curr.total, 0);
      return {
        label: cat.label,
        revenue: rev,
        count: ordersInCat.length,
      };
    });

    const maxChartRev = Math.max(...chartBars.map((b) => b.revenue), 1);

    const tplCounter: Record<string, { count: number; revenue: number; tpl: any }> = {};
    currentOrders.forEach((ord) => {
      const key = ord.template;
      if (!tplCounter[key]) {
        const found = templatesList.find(
          (t) => t.name.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(t.name.toLowerCase())
        ) || templatesList[0];
        tplCounter[key] = { count: 0, revenue: 0, tpl: found };
      }
      tplCounter[key].count += 1;
      if (ord.status === "LUNAS") {
        tplCounter[key].revenue += ord.total;
      }
    });

    const popularTemplates = Object.entries(tplCounter)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count);

    return {
      currentOrders,
      prevOrders,
      currentRevenue,
      prevRevenue,
      revenueGrowth,
      isRevenueUp,
      pendingOrders,
      totalInvitationsCount,
      invitationGrowth,
      isInvUp,
      newUsersCount,
      userGrowthText,
      comparisonLabel,
      periodTitle,
      chartTitle,
      chartBars,
      maxChartRev,
      popularTemplates: popularTemplates.length > 0 ? popularTemplates : templatesList.slice(0, 3).map((t) => ({ name: t.name, count: t.totalUsers, revenue: t.totalRevenue, tpl: t })),
    };
  }, [selectedPeriod, ordersList, usersList, invitationsList, templatesList]);

  // COLUMNS
  const dashboardOrderColumns: DataTableColumn<AdminOrderItem>[] = [
    {
      key: "id",
      header: "INVOICE",
      sortable: true,
      render: (ord) => <span className="font-mono font-bold text-neutral-800">{ord.id}</span>,
    },
    {
      key: "customer",
      header: "PASANGAN",
      sortable: true,
      render: (ord) => <span className="font-bold text-neutral-900">{ord.customer}</span>,
    },
    {
      key: "template",
      header: "TEMPLATE",
      sortable: true,
      render: (ord) => <span className="text-neutral-600">{ord.template}</span>,
    },
    {
      key: "total",
      header: "NOMINAL",
      sortable: true,
      render: (ord) => <span className="font-bold text-neutral-900">Rp {ord.total.toLocaleString("id-ID")}</span>,
    },
    {
      key: "paymentMethod",
      header: "METODE",
      sortable: true,
      render: (ord) => <span className="text-neutral-500 font-medium">{ord.paymentMethod}</span>,
    },
    {
      key: "status",
      header: "STATUS",
      sortable: true,
      render: (ord) => (
        ord.status === "LUNAS" ? (
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
        )
      ),
    },
    {
      key: "action",
      header: "AKSI",
      align: "right",
      render: (ord) => (
        <Button
          variant="secondary"
          size="xs"
          onClick={() => setSelectedOrderModal(ord)}
        >
          Detail
        </Button>
      ),
    },
  ];

  const userColumns: DataTableColumn<AdminUserData>[] = [
    {
      key: "name",
      header: "PENGGUNA",
      sortable: true,
      render: (usr) => (
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
      ),
    },
    {
      key: "phone",
      header: "KONTAK WHATSAPP",
      sortable: true,
      render: (usr) => (
        <a
          href={`https://wa.me/${usr.phone.replace(/\D/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="hover:text-emerald-600 hover:underline inline-flex items-center gap-1 font-mono text-neutral-600"
        >
          {usr.phone}
        </a>
      ),
    },
    {
      key: "invitationsCount",
      header: "UNDANGAN",
      sortable: true,
      render: (usr) => (
        <span className="font-bold text-neutral-800">
          {usr.invitationsCount} Undangan
        </span>
      ),
    },
    {
      key: "totalSpent",
      header: "TOTAL BELANJA",
      sortable: true,
      render: (usr) => (
        <span className="font-bold text-neutral-900">
          Rp {usr.totalSpent.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      key: "joinedDate",
      header: "TGL DAFTAR",
      sortable: true,
      render: (usr) => (
        <span className="text-neutral-500 text-xs">
          {formatIndonesianDateShort(usr.joinedDate)}
        </span>
      ),
    },
    {
      key: "status",
      header: "STATUS",
      sortable: true,
      render: (usr) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
            usr.status === "Aktif"
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-800"
          }`}
        >
          {usr.status}
        </span>
      ),
    },
    {
      key: "action",
      header: "AKSI",
      align: "right",
      render: (usr) => (
        <Button
          variant="secondary"
          size="xs"
          onClick={() => setSelectedUserModal(usr)}
        >
          Detail
        </Button>
      ),
    },
  ];

  const invitationColumns: DataTableColumn<AdminInvitationItem>[] = [
    {
      key: "title",
      header: "ACARA",
      sortable: true,
      render: (inv) => <span className="font-bold text-neutral-900">{inv.title}</span>,
    },
    {
      key: "couple",
      header: "PASANGAN",
      sortable: true,
      sortKey: (inv) => `${inv.groom} ${inv.bride}`,
      render: (inv) => (
        <span className="text-neutral-700 font-medium">
          {inv.groom} &amp; {inv.bride}
        </span>
      ),
    },
    {
      key: "eventDate",
      header: "TANGGAL",
      sortable: true,
      render: (inv) => (
        <span className="text-neutral-600 font-medium">
          {formatIndonesianDateShort(inv.eventDate)}
        </span>
      ),
    },
    {
      key: "guestCount",
      header: "TAMU",
      sortable: true,
      sortKey: (inv) => inv.guestCount,
      render: (inv) => (
        <div>
          <span className="font-bold text-neutral-900">{inv.rsvpCount}</span>
          <span className="text-neutral-400 text-xs"> / {inv.guestCount} Hadir</span>
        </div>
      ),
    },
    {
      key: "action",
      header: "AKSI",
      align: "right",
      render: (inv) => (
        <a
          href={`/${inv.slug}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-extrabold text-[#7d6aee] hover:bg-purple-100 bg-purple-50 border border-purple-200/80 border-b-[2px] border-b-purple-300 px-3 py-1.5 rounded-lg transition-all cursor-pointer active:scale-[0.98] shadow-2xs"
        >
          <span>Buka</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      ),
    },
  ];

  const financeOrderColumns: DataTableColumn<AdminOrderItem>[] = [
    {
      key: "id",
      header: "NO. INVOICE",
      sortable: true,
      render: (ord) => <span className="font-mono font-bold text-neutral-800">{ord.id}</span>,
    },
    {
      key: "customer",
      header: "NAMA PASANGAN",
      sortable: true,
      render: (ord) => (
        <div>
          <p className="font-bold text-neutral-900">{ord.customer}</p>
          <p className="text-[11px] text-neutral-400">{ord.customerEmail}</p>
        </div>
      ),
    },
    {
      key: "template",
      header: "TEMPLATE & PAKET",
      sortable: true,
      render: (ord) => (
        <div>
          <p className="font-semibold text-neutral-800">{ord.template}</p>
          <span className="text-[10px] bg-neutral-100 px-1.5 py-0.2 rounded text-neutral-600 font-bold">
            {ord.tier}
          </span>
        </div>
      ),
    },
    {
      key: "paymentMethod",
      header: "METODE BAYAR",
      sortable: true,
      render: (ord) => <span className="text-neutral-600 font-medium">{ord.paymentMethod}</span>,
    },
    {
      key: "total",
      header: "TOTAL + UNIK",
      sortable: true,
      render: (ord) => <span className="font-black text-neutral-900">Rp {ord.total.toLocaleString("id-ID")}</span>,
    },
    {
      key: "date",
      header: "WAKTU PESAN",
      sortable: true,
      render: (ord) => <span className="text-neutral-500 text-xs">{ord.date}</span>,
    },
    {
      key: "status",
      header: "STATUS",
      sortable: true,
      render: (ord) => (
        ord.status === "LUNAS" ? (
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
        )
      ),
    },
    {
      key: "action",
      header: "AKSI",
      align: "right",
      render: (ord) => (
        <Button
          variant="secondary"
          size="xs"
          onClick={() => setSelectedOrderModal(ord)}
        >
          Detail &amp; Verifikasi
        </Button>
      ),
    },
  ];

  const templateColumns: DataTableColumn<AdminTemplateItem>[] = [
    {
      key: "thumbnail",
      header: "PREVIEW",
      sortable: false,
      render: (tpl) => (
        <img
          src={tpl.thumbnail}
          alt={tpl.name}
          className="size-12 rounded-xl object-cover border border-purple-100 shadow-2xs"
        />
      ),
    },
    {
      key: "name",
      header: "TEMPLATE",
      sortable: true,
      render: (tpl) => (
        <span className="font-bold text-neutral-900">{tpl.name}</span>
      ),
    },
    {
      key: "category",
      header: "KATEGORI",
      sortable: true,
      render: (tpl) => (
        <span className="text-neutral-700 font-semibold">{tpl.category}</span>
      ),
    },
    {
      key: "price",
      header: "HARGA",
      sortable: true,
      render: (tpl) => (
        <div>
          <span className="font-bold text-neutral-900 block">
            {tpl.price.toLocaleString("id-ID")}
          </span>
          <span className="text-[10px] text-neutral-400 line-through">
            {tpl.originalPrice.toLocaleString("id-ID")}
          </span>
        </div>
      ),
    },
    {
      key: "totalUsers",
      header: "PENGGUNA",
      sortable: true,
      render: (tpl) => (
        <span className="font-black text-[#7d6aee]">
          {tpl.totalUsers.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      key: "totalRevenue",
      header: "OMSET",
      sortable: true,
      render: (tpl) => (
        <span className="font-bold text-emerald-700">
          {tpl.totalRevenue.toLocaleString("id-ID")}
        </span>
      ),
    },
    {
      key: "status",
      header: "STATUS",
      sortable: true,
      render: (tpl) => (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
          {tpl.status}
        </span>
      ),
    },
    {
      key: "action",
      header: "AKSI",
      align: "right",
      render: (tpl) => (
        <div className="inline-flex items-center gap-1.5">
          <Button
            variant="outline"
            size="xs"
            onClick={() => showToast(`Membuka demo pratinjau ${tpl.name}`)}
            title="Lihat Pratinjau Template"
          >
            <Eye className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="outline"
            size="xs"
            onClick={() => showToast(`Edit template ${tpl.name}`)}
            title="Edit Template"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const handleApproveOrder = (orderId: string) => {
    setOrdersList((prev) =>
      prev.map((ord) => (ord.id === orderId ? { ...ord, status: "LUNAS" } : ord))
    );
    showToast(`Pesanan #${orderId} berhasil diverifikasi & ditandai Lunas!`);
    setSelectedOrderModal(null);
  };

  const handlePerformLogout = async () => {
    setIsLogoutModalOpen(false);
    await signOut();
    const target = isStandalone ? "/login" : PATHS.dashLogin;
    if (onNavigate) {
      onNavigate(target);
    } else {
      window.location.href = target;
    }
  };

  const navItems = [
    { id: "overview" as const, label: "Dashboard", icon: LayoutGrid },
    { id: "users" as const, label: "Pengguna", icon: Users, badge: usersList.length },
    { id: "analytics" as const, label: "Transaksi", icon: HeartHandshake },
    { id: "finance" as const, label: "Keuangan", icon: Wallet, badge: ordersList.filter(o => o.status === "MENUNGGU_VERIFIKASI").length },
    { id: "templates" as const, label: "Template", icon: Palette, badge: templatesList.length },
    { id: "invitations" as const, label: "Berlangsung", icon: Radio, badge: invitationsList.length },
  ];

  const getDashNavbarTitle = () => {
    switch (activeTab) {
      case "users":
        return "Pengguna";
      case "analytics":
        return "Transaksi";
      case "finance":
        return "Keuangan";
      case "templates":
        return "Template";
      case "invitations":
        return "Berlangsung";
      case "settings":
        return "Pengaturan";
      case "overview":
      default:
        return "Dashboard";
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] flex flex-col md:flex-row font-sans text-neutral-800 antialiased pb-20 md:pb-0 select-none">
      {/* Toast Notice */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-neutral-900 text-white px-4 py-2.5 rounded-xl shadow-xl text-xs sm:text-sm font-bold flex items-center gap-2 border border-neutral-700 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* DESKTOP SIDEBAR */}
      <aside
        className={`hidden md:flex flex-col ${
          isSidebarCollapsed ? "w-16 p-2" : "w-48 p-2.5"
        } bg-white border-r border-neutral-200/80 min-h-screen h-screen sticky top-0 shrink-0 z-30 justify-between transition-all duration-200 ease-in-out`}
      >
        <div className="flex flex-col gap-4">
          {/* Header Sidebar */}
          {isSidebarCollapsed ? (
            <div className="flex items-center justify-center pb-3 border-b border-neutral-100">
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(false)}
                title="Buka Sidebar (Expand)"
                className="relative size-10 rounded-xl overflow-hidden shrink-0 border border-purple-100 shadow-2xs group cursor-pointer focus:outline-none"
              >
                <img
                  src="/logos/satucerita.png"
                  alt="Satu Cerita"
                  width="40"
                  height="40"
                  className="w-full h-full object-cover transition-opacity duration-150 group-hover:opacity-0"
                />
                <div className="absolute inset-0 bg-[#7d6aee] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <PanelLeftOpen className="w-5 h-5 stroke-[2.2]" />
                </div>
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-8 rounded-xl overflow-hidden shrink-0 border border-purple-100 shadow-2xs">
                  <img
                    src="/logos/satucerita.png"
                    alt="Satu Cerita"
                    width="32"
                    height="32"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <span className="text-base font-black tracking-tight text-neutral-900 block leading-tight truncate">
                    Satu<span className="text-[#7d6aee]">Cerita</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(true)}
                title="Tutup Sidebar (Collapse)"
                className="p-1.5 text-neutral-400 hover:text-[#7d6aee] hover:bg-purple-50 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <PanelLeft className="w-4 h-4" />
              </button>
            </div>
          )}

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTab(item.id)}
                  title={item.label}
                  className={`w-full flex items-center ${
                    isSidebarCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2"
                  } rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#7d6aee] text-white shadow-2xs font-extrabold border border-[#7d6aee] border-b-[3px] border-b-[#5c47dc]"
                      : "text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900"
                  }`}
                >
                  <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-2.5 min-w-0"}`}>
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-neutral-500"}`} />
                    {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isSidebarCollapsed && item.badge !== undefined && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
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

        {/* SIDEBAR FOOTER */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => handleSelectTab("settings")}
            title="Pengaturan"
            className={`w-full flex items-center ${
              isSidebarCollapsed ? "justify-center p-2.5" : "justify-between px-3 py-2"
            } rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              activeTab === "settings"
                ? "bg-[#7d6aee] text-white shadow-2xs font-extrabold border border-[#7d6aee] border-b-[3px] border-b-[#5c47dc]"
                : "text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900"
            }`}
          >
            <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-2.5"}`}>
              <Settings className={`w-4 h-4 shrink-0 ${activeTab === "settings" ? "text-white" : "text-neutral-500"}`} />
              {!isSidebarCollapsed && <span>Pengaturan</span>}
            </div>
          </button>

          <div
            onClick={() => {
              setEditAdminName("Admin");
              setEditAdminEmail(adminProfile.email);
              setEditAdminPhone(adminProfile.phone);
              setEditAdminAvatar(adminProfile.avatar);
              setIsEditAdminProfileOpen(true);
            }}
            className={`flex items-center ${
              isSidebarCollapsed ? "justify-center p-1.5" : "justify-between gap-2 p-2"
            } rounded-2xl bg-white border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs cursor-pointer group hover:border-purple-200 transition-all`}
            title={`Admin (${adminProfile.email})`}
          >
            <div className={`flex items-center ${isSidebarCollapsed ? "justify-center" : "gap-2 min-w-0 flex-1"}`}>
              <div className="shrink-0">
                <img
                  src={adminProfile.avatar}
                  alt="Admin"
                  className="size-8 rounded-full object-cover border border-[#7d6aee]/30 shadow-2xs group-hover:ring-2 group-hover:ring-[#7d6aee] transition-all md:transition-none"
                />
              </div>
              {!isSidebarCollapsed && (
                <div className="min-w-0">
                  <p className="text-xs font-bold text-neutral-900 truncate leading-tight group-hover:text-[#7d6aee] transition-colors md:transition-none">
                    Admin
                  </p>
                  <p className="text-[11px] text-neutral-500 truncate leading-tight">
                    {adminProfile.email}
                  </p>
                </div>
              )}
            </div>

            {!isSidebarCollapsed && (
              <div className="p-1 rounded-lg text-neutral-400 group-hover:text-[#7d6aee] transition-colors shrink-0">
                <ChevronRight className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Content Right Side */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div className="sticky top-0 z-40 bg-white">
          <AppNavbar
            currentPath={currentPath}
            onNavigate={(to) => {
              if (onNavigate) {
                onNavigate(to);
              } else {
                handleSelectTab(pathToDashTab(to));
              }
            }}
            activeTab={activeTab}
            hideAvatar={true}
            title={getDashNavbarTitle()}
            period={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            action={
              activeTab === "overview" || activeTab === "templates" ? (
                <button
                  type="button"
                  onClick={() => setIsAddTemplateModalOpen(true)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#7d6aee] hover:bg-[#6b58e0] text-white text-xs font-extrabold border border-[#6b58e0] border-b-[3px] border-b-[#513ecb] shadow-2xs hover:shadow-xs active:scale-[0.98] active:border-b-[2px] active:translate-y-[1px] transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Template</span>
                </button>
              ) : null
            }
            userProfile={{
              name: adminProfile.name,
              email: adminProfile.email,
              avatar: adminProfile.avatar,
            }}
            onEditProfile={() => setIsEditAdminProfileOpen(true)}
            onLogout={() => setIsLogoutModalOpen(true)}
          />
        </div>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 min-w-0 flex flex-col p-4 sm:p-6 lg:p-8 gap-6 max-w-7xl mx-auto w-full pb-24 md:pb-8">
          {activeTab === "overview" && (
            <OverviewPage
              periodData={periodData}
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              dashboardOrderColumns={dashboardOrderColumns}
              ordersList={ordersList}
              onSelectTab={handleSelectTab}
            />
          )}

          {activeTab === "users" && (
            <UsersPage
              usersList={usersList}
              userColumns={userColumns}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              showToast={showToast}
            />
          )}

          {activeTab === "analytics" && (
            <AnalyticsPage
              timeRange={timeRange}
              setTimeRange={setTimeRange}
            />
          )}

          {activeTab === "finance" && (
            <FinancePage
              ordersList={ordersList}
              financeOrderColumns={financeOrderColumns}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              showToast={showToast}
            />
          )}

          {activeTab === "templates" && (
            <TemplatesPage
              templatesList={templatesList}
              templateColumns={templateColumns}
              onOpenAddModal={() => setIsAddTemplateModalOpen(true)}
            />
          )}

          {activeTab === "invitations" && (
            <InvitationsPage
              invitationsList={invitationsList}
              invitationColumns={invitationColumns}
              searchQuery={invitationSearchQuery}
              setSearchQuery={setInvitationSearchQuery}
            />
          )}

          {activeTab === "settings" && (
            <SettingsPage
              adminProfile={adminProfile}
              adminSettings={adminSettings}
              setAdminSettings={setAdminSettings}
              onOpenEditProfile={() => setIsEditAdminProfileOpen(true)}
              onOpenLogoutModal={() => setIsLogoutModalOpen(true)}
              onSaveSettings={() => {
                saveAdminSettingsCache(adminSettings);
                showToast("Pengaturan rekening pembayaran berhasil disimpan ke cache!");
              }}
            />
          )}
        </main>

        {/* Floating Bottom Nav for Satu Cerita Dash (Mobile) */}
        <nav
          id="satucerita-dash-bottom-navbar"
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-purple-100 backdrop-blur-lg shadow-lg select-none"
          aria-label="Satu Cerita Dash Navigation"
        >
          <div className="max-w-md mx-auto grid grid-cols-7 h-16 px-1">
            <button
              type="button"
              onClick={() => handleSelectTab("overview")}
              className={`flex items-center justify-center transition-all cursor-pointer relative ${
                activeTab === "overview" ? "text-[#7d6aee]" : "text-neutral-500 hover:text-neutral-900"
              }`}
              title="Dashboard"
              aria-label="Dashboard"
            >
              <div
                className={`p-1.5 sm:p-2 rounded-xl transition-all ${
                  activeTab === "overview"
                    ? "bg-purple-100/90 text-[#7d6aee] border border-purple-200 border-b-[2px] border-b-purple-300 shadow-2xs scale-105"
                    : "hover:bg-neutral-100"
                }`}
              >
                <LayoutGrid className="w-5 h-5" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab("users")}
              className={`flex items-center justify-center transition-all cursor-pointer relative ${
                activeTab === "users" ? "text-[#7d6aee]" : "text-neutral-500 hover:text-neutral-900"
              }`}
              title="Pengguna"
              aria-label="Pengguna"
            >
              <div
                className={`p-1.5 sm:p-2 rounded-xl transition-all ${
                  activeTab === "users"
                    ? "bg-purple-100/90 text-[#7d6aee] border border-purple-200 border-b-[2px] border-b-purple-300 shadow-2xs scale-105"
                    : "hover:bg-neutral-100"
                }`}
              >
                <Users className="w-5 h-5" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab("analytics")}
              className={`flex items-center justify-center transition-all cursor-pointer relative ${
                activeTab === "analytics" ? "text-[#7d6aee]" : "text-neutral-500 hover:text-neutral-900"
              }`}
              title="Transaksi"
              aria-label="Transaksi"
            >
              <div
                className={`p-1.5 sm:p-2 rounded-xl transition-all ${
                  activeTab === "analytics"
                    ? "bg-purple-100/90 text-[#7d6aee] border border-purple-200 border-b-[2px] border-b-purple-300 shadow-2xs scale-105"
                    : "hover:bg-neutral-100"
                }`}
              >
                <ChartPie className="w-5 h-5" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab("finance")}
              className={`flex items-center justify-center transition-all cursor-pointer relative ${
                activeTab === "finance" ? "text-[#7d6aee]" : "text-neutral-500 hover:text-neutral-900"
              }`}
              title="Keuangan"
              aria-label="Keuangan"
            >
              <div
                className={`p-1.5 sm:p-2 rounded-xl transition-all relative ${
                  activeTab === "finance"
                    ? "bg-purple-100/90 text-[#7d6aee] border border-purple-200 border-b-[2px] border-b-purple-300 shadow-2xs scale-105"
                    : "hover:bg-neutral-100"
                }`}
              >
                <Wallet className="w-5 h-5" />
                {ordersList.filter((o) => o.status === "MENUNGGU_VERIFIKASI").length > 0 && (
                  <span className="absolute -top-1 -right-1 size-2.5 bg-amber-500 rounded-full ring-2 ring-white" />
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab("templates")}
              className={`flex items-center justify-center transition-all cursor-pointer relative ${
                activeTab === "templates" ? "text-[#7d6aee]" : "text-neutral-500 hover:text-neutral-900"
              }`}
              title="Template"
              aria-label="Template"
            >
              <div
                className={`p-1.5 sm:p-2 rounded-xl transition-all ${
                  activeTab === "templates"
                    ? "bg-purple-100/90 text-[#7d6aee] border border-purple-200 border-b-[2px] border-b-purple-300 shadow-2xs scale-105"
                    : "hover:bg-neutral-100"
                }`}
              >
                <Palette className="w-5 h-5" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab("invitations")}
              className={`flex items-center justify-center transition-all cursor-pointer relative ${
                activeTab === "invitations" ? "text-[#7d6aee]" : "text-neutral-500 hover:text-neutral-900"
              }`}
              title="Berlangsung"
              aria-label="Berlangsung"
            >
              <div
                className={`p-1.5 sm:p-2 rounded-xl transition-all relative ${
                  activeTab === "invitations"
                    ? "bg-purple-100/90 text-[#7d6aee] border border-purple-200 border-b-[2px] border-b-purple-300 shadow-2xs scale-105"
                    : "hover:bg-neutral-100"
                }`}
              >
                <Radio className="w-5 h-5" />
                {invitationsList.length > 0 && (
                  <span className="absolute -top-1 -right-1 size-2 bg-emerald-500 rounded-full ring-2 ring-white" />
                )}
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleSelectTab("settings")}
              className={`flex items-center justify-center transition-all cursor-pointer relative ${
                activeTab === "settings" ? "text-[#7d6aee]" : "text-neutral-500 hover:text-neutral-900"
              }`}
              title="Pengaturan"
              aria-label="Pengaturan"
            >
              <div
                className={`p-1.5 sm:p-2 rounded-xl transition-all ${
                  activeTab === "settings"
                    ? "bg-purple-100/90 text-[#7d6aee] border border-purple-200 border-b-[2px] border-b-purple-300 shadow-2xs scale-105"
                    : "hover:bg-neutral-100"
                }`}
              >
                <Settings className="w-5 h-5" />
              </div>
            </button>
          </div>
        </nav>
      </div>

      {/* MODAL: DETAIL USER & EDIT */}
      {selectedUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-purple-100 border-b-[4px] border-b-purple-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Detail Pengguna</h3>
              <button
                type="button"
                onClick={() => setSelectedUserModal(null)}
                className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 cursor-pointer"
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
                className="px-4 py-2 rounded-xl bg-white border border-neutral-200 border-b-[3px] border-b-neutral-300/80 text-xs font-bold text-neutral-600 hover:bg-neutral-50 active:scale-[0.99] active:border-b-[2px] cursor-pointer transition-all"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast(`Pesan WhatsApp dikirimkan ke ${selectedUserModal.name}`);
                  setSelectedUserModal(null);
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold border border-emerald-500 border-b-[3px] border-b-emerald-800 shadow-2xs active:scale-[0.99] active:border-b-[2px] flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Hubungi WA</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETAIL PESANAN & VERIFIKASI PEMBAYARAN */}
      {selectedOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-purple-100 border-b-[4px] border-b-purple-200 space-y-4 max-h-[90vh] overflow-y-auto">
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
                className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 cursor-pointer"
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
                className="px-4 py-2 rounded-xl bg-white border border-neutral-200 border-b-[3px] border-b-neutral-300/80 text-xs font-bold text-neutral-600 hover:bg-neutral-50 active:scale-[0.99] active:border-b-[2px] cursor-pointer transition-all"
              >
                Tutup
              </button>
              {selectedOrderModal.status !== "LUNAS" && (
                <button
                  type="button"
                  onClick={() => handleApproveOrder(selectedOrderModal.id)}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-extrabold hover:bg-emerald-700 border border-emerald-500 border-b-[3px] border-b-emerald-800 shadow-2xs active:scale-[0.99] active:border-b-[2px] flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Check className="w-4 h-4" />
                  <span>Setujui &amp; Tandai Lunas</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: TAMBAH TEMPLATE BARU */}
      {isAddTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-purple-100 border-b-[4px] border-b-purple-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h3 className="text-base font-bold text-neutral-900">Tambah Template Baru</h3>
              <button
                type="button"
                onClick={() => setIsAddTemplateModalOpen(false)}
                className="p-1 rounded-full hover:bg-neutral-100 text-neutral-400 cursor-pointer"
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
                  className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 border-b-[2px] border-b-neutral-300 focus:outline-none focus:border-[#7d6aee] focus:border-b-[#7d6aee]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-700 block mb-1">
                    Kategori
                  </label>
                  <select className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 border-b-[2px] border-b-neutral-300 bg-white">
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
                  <select className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 border-b-[2px] border-b-neutral-300 bg-white">
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
                  className="w-full text-xs p-2.5 rounded-xl border border-neutral-200 border-b-[2px] border-b-neutral-300 focus:outline-none focus:border-[#7d6aee] focus:border-b-[#7d6aee]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsAddTemplateModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-neutral-200 border-b-[3px] border-b-neutral-300/80 text-xs font-bold text-neutral-600 hover:bg-neutral-50 active:scale-[0.99] active:border-b-[2px] cursor-pointer transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  showToast("Template baru berhasil ditambahkan ke katalog!");
                  setIsAddTemplateModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#7d6aee] hover:bg-[#6b58e0] text-white text-xs font-extrabold border border-[#6b58e0] border-b-[3px] border-b-[#513ecb] shadow-2xs hover:shadow-xs active:scale-[0.98] active:border-b-[2px] active:translate-y-[1px] cursor-pointer transition-all"
              >
                Simpan Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT PROFIL ADMINISTRATOR */}
      {isEditAdminProfileOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-purple-100 border-b-[4px] border-b-purple-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#7d6aee]" />
                <h3 className="text-base font-bold text-neutral-900">
                  Edit Profil Administrator
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditAdminProfileOpen(false)}
                className="size-8 rounded-full hover:bg-neutral-100 flex items-center justify-center text-neutral-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <img
                    src={editAdminAvatar}
                    alt="Preview Avatar Admin"
                    className="size-20 rounded-full object-cover border-2 border-[#7d6aee] shadow-sm mb-3"
                  />
                  <label className="absolute bottom-3 right-0 size-7 bg-[#7d6aee] hover:bg-[#6b58e0] text-white rounded-full flex items-center justify-center cursor-pointer shadow-md transition-transform active:scale-95">
                    <Camera className="w-3.5 h-3.5" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const dataUrl = await convertFileToDataUrl(file);
                            setEditAdminAvatar(dataUrl);
                          } catch (_err) {}
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-neutral-200 border-b-[3px] border-b-neutral-300/80 text-xs font-bold text-neutral-700 hover:bg-neutral-50 cursor-pointer shadow-2xs active:scale-[0.99] active:border-b-[2px] transition-all">
                  <Upload className="w-3.5 h-3.5 text-[#7d6aee]" />
                  <span>Ganti Foto Profil</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          const dataUrl = await convertFileToDataUrl(file);
                          setEditAdminAvatar(dataUrl);
                        } catch (_err) {}
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-800 block mb-1">
                  Nama Administrator
                </label>
                <input
                  type="text"
                  value={editAdminName}
                  onChange={(e) => setEditAdminName(e.target.value)}
                  className="w-full bg-white border border-neutral-200 border-b-[2px] border-b-neutral-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#7d6aee] focus:border-b-[#7d6aee]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-800 block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={editAdminEmail}
                  readOnly
                  title="Email admin terkunci dan tidak dapat diubah"
                  onChange={() => {}}
                  className="w-full bg-white border border-neutral-200 border-b-[2px] border-b-neutral-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#7d6aee] focus:border-b-[#7d6aee]"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-800 block mb-1">
                  Nomor WhatsApp Administrator
                </label>
                <input
                  type="text"
                  value={editAdminPhone}
                  onChange={(e) => setEditAdminPhone(e.target.value)}
                  placeholder="+62 851-xxxx-xxxx"
                  className="w-full bg-white border border-neutral-200 border-b-[2px] border-b-neutral-300 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm focus:outline-none focus:border-[#7d6aee] focus:border-b-[#7d6aee]"
                />
                <p className="text-[11px] text-neutral-400 mt-1">
                  Nomor WhatsApp ini disimpan di cache browser dan digunakan untuk notifikasi sistem.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 px-6 py-4 bg-neutral-50 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setIsEditAdminProfileOpen(false)}
                className="px-4 py-2 rounded-xl bg-white border border-neutral-200 border-b-[3px] border-b-neutral-300/80 text-xs font-bold text-neutral-600 hover:bg-neutral-50 active:scale-[0.99] active:border-b-[2px] cursor-pointer transition-all"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  const res = await updateProfile({ name: editAdminName, phone: editAdminPhone });
                  if (!res.ok || !res.user) {
                    showToast(res.error || "Gagal menyimpan profil admin.");
                    return;
                  }
                  setSessionUser(res.user);
                  if (editAdminAvatar && editAdminAvatar !== adminProfile.avatar) {
                    setAdminAvatarOverride(editAdminAvatar);
                    setCache(adminAvatarKey, editAdminAvatar);
                  }
                  setIsEditAdminProfileOpen(false);
                  showToast("Profil admin berhasil disimpan!");
                }}
                className="px-5 py-2.5 rounded-xl bg-[#7d6aee] hover:bg-[#6b58e0] text-white text-xs font-extrabold border border-[#6b58e0] border-b-[3px] border-b-[#513ecb] shadow-2xs hover:shadow-xs active:scale-[0.98] active:border-b-[2px] active:translate-y-[1px] cursor-pointer transition-all"
              >
                Simpan ke Cache
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL KONFIRMASI LOGOUT */}
      {isLogoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-purple-100 border-b-[4px] border-b-purple-200 overflow-hidden p-6 text-center">
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
              <Button
                variant="outline"
                size="md"
                onClick={() => setIsLogoutModalOpen(false)}
                className="w-full justify-center"
              >
                Batal
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={handlePerformLogout}
                className="w-full justify-center"
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

export default AdminDash;
