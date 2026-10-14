import React, { useState, useMemo, useEffect } from "react";
import {
  LayoutGrid,
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
  Upload,
  Pencil,
  Camera,
  ChartPie,
  Wallet,
  Radio,
} from "lucide-react";
import { AppNavbar, DashPeriodType } from "@/components/app/AppNavbar";
import { Button } from "@/components/ui/Button";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import { PATHS } from "@/routes";
import {
  getAdminProfileCache,
  saveAdminProfileCache,
  getAdminSettingsCache,
  saveAdminSettingsCache,
  getCache,
  setCache,
  CACHE_KEYS,
  convertFileToDataUrl,
  AdminProfileData,
  AdminSettingsData,
  setDashAuthenticated,
} from "@/lib/cache";
import { SITE } from "@/config/site";

export function formatIndonesianDateShort(dateStr: string): string {
  if (!dateStr) return "";
  const monthMap: Record<string, string> = {
    "01": "Jan", "1": "Jan", "jan": "Jan", "januari": "Jan",
    "02": "Feb", "2": "Feb", "feb": "Feb", "februari": "Feb",
    "03": "Mar", "3": "Mar", "mar": "Mar", "maret": "Mar",
    "04": "Apr", "4": "Apr", "apr": "Apr", "april": "Apr",
    "05": "Mei", "5": "Mei", "mei": "Mei",
    "06": "Jun", "6": "Jun", "jun": "Jun", "juni": "Jun",
    "07": "Jul", "7": "Jul", "jul": "Jul", "juli": "Jul",
    "08": "Agu", "8": "Agu", "agu": "Agu", "agustus": "Agu",
    "09": "Sep", "9": "Sep", "sep": "Sep", "september": "Sep",
    "10": "Okt", "okt": "Okt", "oktober": "Okt",
    "11": "Nov", "nov": "Nov", "november": "Nov",
    "12": "Des", "des": "Des", "desember": "Des",
  };

  const clean = dateStr.replace(/,/g, " ").trim();
  const tokens = clean.split(/\s+/);
  const yearToken = tokens.find((t) => /^\d{4}$/.test(t));
  const dayToken = tokens.find((t) => t !== yearToken && /^\d{1,2}$/.test(t));
  const monthToken = tokens.find((t) => monthMap[t.toLowerCase()] !== undefined);

  if (dayToken && monthToken && yearToken) {
    const day = parseInt(dayToken, 10);
    const month = monthMap[monthToken.toLowerCase()];
    return `${day} ${month} ${yearToken}`;
  }
  return dateStr;
}

export function parseOrderTimestamp(dateStr: string): number {
  if (!dateStr) return 0;
  const clean = dateStr.toLowerCase().replace(/[,]/g, " ").trim();
  const tokens = clean.split(/\s+/);
  const monthMap: Record<string, number> = {
    jan: 0, januari: 0,
    feb: 1, februari: 1,
    mar: 2, maret: 2,
    apr: 3, april: 3,
    mei: 4,
    jun: 5, juni: 5,
    jul: 6, juli: 6,
    agu: 7, agustus: 7,
    sep: 8, september: 8,
    okt: 9, oktober: 9,
    nov: 10, november: 10,
    des: 11, desember: 11,
  };
  const yearToken = tokens.find((t) => /^\d{4}$/.test(t));
  const dayToken = tokens.find((t) => t !== yearToken && /^\d{1,2}$/.test(t));
  const monthToken = tokens.find((t) => monthMap[t] !== undefined);
  const timeToken = tokens.find((t) => /^\d{1,2}:\d{2}/.test(t));

  if (yearToken && monthToken && dayToken) {
    const year = parseInt(yearToken, 10);
    const month = monthMap[monthToken];
    const day = parseInt(dayToken, 10);
    let hour = 12;
    let min = 0;
    if (timeToken) {
      const [h, m] = timeToken.split(":");
      hour = parseInt(h, 10);
      min = parseInt(m, 10);
    }
    return new Date(year, month, day, hour, min).getTime();
  }
  const parsed = Date.parse(dateStr);
  return isNaN(parsed) ? 0 : parsed;
}

export type DashTabType =
  | "overview"
  | "users"
  | "analytics"
  | "finance"
  | "templates"
  | "invitations"
  | "settings";

export function pathToDashTab(pathname: string): DashTabType {
  const p = pathname.toLowerCase();
  if (p.includes("customer") || p.includes("users") || p.includes("pengguna")) {
    return "users";
  }
  if (p.includes("analytics") || p.includes("transaksi") || p.includes("grafik") || p.includes("penjualan")) {
    return "analytics";
  }
  if (p.includes("finance") || p.includes("keuangan")) {
    return "finance";
  }
  if (p.includes("templates") || p.includes("template")) {
    return "templates";
  }
  if (p.includes("invitations") || p.includes("berlangsung") || p.includes("undangan")) {
    return "invitations";
  }
  if (p.includes("settings") || p.includes("pengaturan")) {
    return "settings";
  }
  return "overview";
}

export function dashTabToPath(tab: DashTabType, isStandalone = false): string {
  const prefix = isStandalone ? "" : "/dash";
  switch (tab) {
    case "users":
      return `${prefix}/customer`;
    case "analytics":
      return `${prefix}/analytics`;
    case "finance":
      return `${prefix}/finance`;
    case "templates":
      return `${prefix}/templates`;
    case "invitations":
      return `${prefix}/invitations`;
    case "settings":
      return `${prefix}/settings`;
    case "overview":
    default:
      return isStandalone ? "/overview" : "/dash";
  }
}

export interface AdminDashProps {
  currentPath?: string;
  activeTab?: DashTabType;
  onNavigate?: (path: string) => void;
}

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

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [invitationSearchQuery, setInvitationSearchQuery] = useState("");
  const [selectedPeriod, setSelectedPeriod] = useState<DashPeriodType>("Bulanan");
  const [selectedUserModal, setSelectedUserModal] = useState<any | null>(null);
  const [selectedOrderModal, setSelectedOrderModal] = useState<any | null>(null);
  const [isAddTemplateModalOpen, setIsAddTemplateModalOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "1y">("30d");

  // Admin Profile Info dari Cache
  const [adminProfile, setAdminProfile] = useState<AdminProfileData>(() =>
    getAdminProfileCache()
  );

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

  // 1. DATA PENGGUNA TERDAFTAR (Dikelola dengan Cache)
  const [usersList, setUsersList] = useState(() =>
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

  // 2. DATA KEUANGAN & TRANSAKSI AKTUAL
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
    {
      id: "SC-ORD-8815",
      customer: "Hendra Gunawan & Rini",
      customerEmail: "hendra.rini@gmail.com",
      customerPhone: "+62 817-5566-7788",
      template: "Adat Jawa Klasik Keraton",
      tier: "Gold Tier",
      amount: 149000,
      uniqueCode: 19,
      total: 149019,
      paymentMethod: "BCA Virtual Account",
      status: "LUNAS",
      date: "06 Okt 2026, 10:15",
      proofUrl: null,
    },
    {
      id: "SC-ORD-8814",
      customer: "Reza Rahardian & Putri",
      customerEmail: "reza.putri@gmail.com",
      customerPhone: "+62 822-9988-1122",
      template: "Elysian Luxe Emerald",
      tier: "Platinum Tier",
      amount: 199000,
      uniqueCode: 55,
      total: 199055,
      paymentMethod: "QRIS",
      status: "LUNAS",
      date: "03 Okt 2026, 19:45",
      proofUrl: null,
    },
    {
      id: "SC-ORD-8813",
      customer: "Gilang Pratama & Vina",
      customerEmail: "gilang.vina@yahoo.com",
      customerPhone: "+62 856-4433-2211",
      template: "Deluxe Royal Navy",
      tier: "Silver Tier",
      amount: 99000,
      uniqueCode: 38,
      total: 99038,
      paymentMethod: "Mandiri VA",
      status: "LUNAS",
      date: "01 Okt 2026, 15:10",
      proofUrl: null,
    },
    {
      id: "SC-ORD-8812",
      customer: "Eko Prasetyo & Dewi",
      customerEmail: "eko.dewi@gmail.com",
      customerPhone: "+62 877-6655-4433",
      template: "Minimalist Modern Flora",
      tier: "Gold Tier",
      amount: 149000,
      uniqueCode: 84,
      total: 149084,
      paymentMethod: "QRIS",
      status: "LUNAS",
      date: "28 Sep 2026, 12:20",
      proofUrl: null,
    },
    {
      id: "SC-ORD-8811",
      customer: "Bayu Segara & Citra",
      customerEmail: "bayu.citra@gmail.com",
      customerPhone: "+62 819-1122-8899",
      template: "Elysian Bloom (Gold)",
      tier: "Gold Tier",
      amount: 149000,
      uniqueCode: 61,
      total: 149061,
      paymentMethod: "BCA Virtual Account",
      status: "LUNAS",
      date: "25 Sep 2026, 09:40",
      proofUrl: null,
    },
    {
      id: "SC-ORD-8810",
      customer: "Taufik Hidayat & Lina",
      customerEmail: "taufik.lina@gmail.com",
      customerPhone: "+62 811-3344-5566",
      template: "Elysian Luxe Emerald",
      tier: "Platinum Tier",
      amount: 199000,
      uniqueCode: 93,
      total: 199093,
      paymentMethod: "GoPay",
      status: "LUNAS",
      date: "20 Sep 2026, 17:15",
      proofUrl: null,
    },
    {
      id: "SC-ORD-8809",
      customer: "Doni Kusuma & Ayu",
      customerEmail: "doni.ayu@gmail.com",
      customerPhone: "+62 859-7788-9900",
      template: "Deluxe Royal Navy",
      tier: "Silver Tier",
      amount: 99000,
      uniqueCode: 27,
      total: 99027,
      paymentMethod: "QRIS",
      status: "LUNAS",
      date: "15 Sep 2026, 14:05",
      proofUrl: null,
    },
    {
      id: "SC-ORD-8808",
      customer: "Satria Perkasa & Anita",
      customerEmail: "satria.anita@gmail.com",
      customerPhone: "+62 818-4455-6677",
      template: "Elysian Bloom (Gold)",
      tier: "Gold Tier",
      amount: 149000,
      uniqueCode: 48,
      total: 149048,
      paymentMethod: "QRIS",
      status: "LUNAS",
      date: "22 Agu 2026, 11:30",
      proofUrl: null,
    },
    {
      id: "SC-ORD-8807",
      customer: "Wahyu Tri & Lestari",
      customerEmail: "wahyu.lestari@gmail.com",
      customerPhone: "+62 823-1122-3344",
      template: "Adat Jawa Klasik Keraton",
      tier: "Gold Tier",
      amount: 149000,
      uniqueCode: 31,
      total: 149031,
      paymentMethod: "Mandiri VA",
      status: "LUNAS",
      date: "14 Jul 2026, 16:50",
      proofUrl: null,
    },
    {
      id: "SC-ORD-8806",
      customer: "Irfan Hakim & Bella",
      customerEmail: "irfan.bella@gmail.com",
      customerPhone: "+62 858-6677-8899",
      template: "Minimalist Modern Flora",
      tier: "Gold Tier",
      amount: 149000,
      uniqueCode: 12,
      total: 149012,
      paymentMethod: "BCA Virtual Account",
      status: "LUNAS",
      date: "18 Mei 2026, 13:20",
      proofUrl: null,
    },
    {
      id: "SC-ORD-8805",
      customer: "Ferry Irawan & Dian",
      customerEmail: "ferry.dian@gmail.com",
      customerPhone: "+62 812-9900-1122",
      template: "Deluxe Royal Navy",
      tier: "Silver Tier",
      amount: 99000,
      uniqueCode: 77,
      total: 99077,
      paymentMethod: "QRIS",
      status: "LUNAS",
      date: "10 Mar 2026, 10:00",
      proofUrl: null,
    },
    {
      id: "SC-ORD-8804",
      customer: "Bambang Pamungkas & Ratna",
      customerEmail: "bambang.ratna@gmail.com",
      customerPhone: "+62 815-4433-2211",
      template: "Elysian Luxe Emerald",
      tier: "Platinum Tier",
      amount: 199000,
      uniqueCode: 85,
      total: 199085,
      paymentMethod: "GoPay",
      status: "LUNAS",
      date: "12 Jan 2026, 15:45",
      proofUrl: null,
    },
    {
      id: "SC-ORD-8799",
      customer: "Rizky Billar & Lesti",
      customerEmail: "rizky.lesti@gmail.com",
      customerPhone: "+62 812-7788-9900",
      template: "Elysian Bloom (Gold)",
      tier: "Gold Tier",
      amount: 149000,
      uniqueCode: 36,
      total: 149036,
      paymentMethod: "QRIS",
      status: "LUNAS",
      date: "24 Des 2025, 14:15",
      proofUrl: null,
    },
    {
      id: "SC-ORD-8798",
      customer: "Atta Halilintar & Aurel",
      customerEmail: "atta.aurel@gmail.com",
      customerPhone: "+62 813-8899-0011",
      template: "Elysian Luxe Emerald",
      tier: "Platinum Tier",
      amount: 199000,
      uniqueCode: 64,
      total: 199064,
      paymentMethod: "BCA Virtual Account",
      status: "LUNAS",
      date: "15 Nov 2025, 11:20",
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

  // 4. DATA UNDANGAN AKTIF / BERLANGSUNG
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

  // ---------------------------------------------------------------------------
  // FILTER PERIODE DASHBOARD (Harian, Mingguan, Bulanan, Kuartalan, Tahunan, Semua)
  // Menghitung data aktual dan perbandingan periode sebelumnya yang setara
  // ---------------------------------------------------------------------------
  const periodData = useMemo(() => {
    let startCurrent = 0;
    let endCurrent = new Date(2026, 9, 11, 23, 59, 59).getTime();
    let startPrev = 0;
    let endPrev = 0;
    let comparisonLabel = "";
    let periodTitle = "";
    let chartTitle = "";
    let chartCategories: { label: string; filter: (t: number) => boolean }[] = [];

    if (selectedPeriod === "Harian") {
      // Hari ini: 11 Okt 2026 00:00 - 23:59
      const d1 = new Date(2026, 9, 11, 0, 0, 0).getTime();
      const d2 = new Date(2026, 9, 11, 23, 59, 59).getTime();
      // Kemarin: 10 Okt 2026 00:00 - 23:59
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
      // 7 hari terakhir: 5 Okt - 11 Okt 2026
      const d1 = new Date(2026, 9, 5, 0, 0, 0).getTime();
      const d2 = new Date(2026, 9, 11, 23, 59, 59).getTime();
      // 7 hari sebelumnya: 28 Sep - 4 Okt 2026
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
      // Bulan ini: 1 Okt - 31 Okt 2026
      const d1 = new Date(2026, 9, 1, 0, 0, 0).getTime();
      const d2 = new Date(2026, 9, 31, 23, 59, 59).getTime();
      // Bulan lalu: 1 Sep - 30 Sep 2026
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
    } else if (selectedPeriod === "Kuartalan") {
      // Kuartal 4: 1 Okt - 31 Des 2026
      const d1 = new Date(2026, 9, 1, 0, 0, 0).getTime();
      const d2 = new Date(2026, 11, 31, 23, 59, 59).getTime();
      // Kuartal 3: 1 Jul - 30 Sep 2026
      const p1 = new Date(2026, 6, 1, 0, 0, 0).getTime();
      const p2 = new Date(2026, 8, 30, 23, 59, 59).getTime();
      startCurrent = d1;
      endCurrent = d2;
      startPrev = p1;
      endPrev = p2;
      comparisonLabel = "vs kuartal lalu";
      periodTitle = "Kuartal 4 (Okt - Des 2026)";
      chartTitle = "Tren Pendapatan Kuartal Q4 (Okt, Nov, Des)";
      chartCategories = [
        { label: "Oktober", filter: (t) => t >= new Date(2026, 9, 1, 0).getTime() && t < new Date(2026, 10, 1, 0).getTime() },
        { label: "November", filter: (t) => t >= new Date(2026, 10, 1, 0).getTime() && t < new Date(2026, 11, 1, 0).getTime() },
        { label: "Desember", filter: (t) => t >= new Date(2026, 11, 1, 0).getTime() && t <= new Date(2026, 11, 31, 23, 59, 59).getTime() },
      ];
    } else if (selectedPeriod === "Tahunan") {
      // Tahun 2026: 1 Jan - 31 Des 2026
      const d1 = new Date(2026, 0, 1, 0, 0, 0).getTime();
      const d2 = new Date(2026, 11, 31, 23, 59, 59).getTime();
      // Tahun 2025: 1 Jan - 31 Des 2025
      const p1 = new Date(2025, 0, 1, 0, 0, 0).getTime();
      const p2 = new Date(2025, 11, 31, 23, 59, 59).getTime();
      startCurrent = d1;
      endCurrent = d2;
      startPrev = p1;
      endPrev = p2;
      comparisonLabel = "vs tahun lalu";
      periodTitle = "Tahun 2026";
      chartTitle = "Tren Pendapatan Tahunan (2026)";
      chartCategories = [
        { label: "Q1", filter: (t) => t >= new Date(2026, 0, 1).getTime() && t < new Date(2026, 3, 1).getTime() },
        { label: "Q2", filter: (t) => t >= new Date(2026, 3, 1).getTime() && t < new Date(2026, 6, 1).getTime() },
        { label: "Q3", filter: (t) => t >= new Date(2026, 6, 1).getTime() && t < new Date(2026, 9, 1).getTime() },
        { label: "Q4", filter: (t) => t >= new Date(2026, 9, 1).getTime() && t <= new Date(2026, 11, 31).getTime() },
      ];
    } else {
      // "Semua": Seluruh data yang tersedia
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

    // Filter order aktual
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

    // 1. Omset Pendapatan Aktual
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

    // 2. Perlu Verifikasi
    const pendingOrders = currentOrders.filter((o) => o.status === "MENUNGGU_VERIFIKASI");

    // 3. Total Undangan
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

    // 4. Pengguna Terdaftar
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

    // 5. Data Chart Bars Dinamis dari data transaksi aktual
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

    // 6. Template Terlaris di Periode Ini
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

  // ---------------------------------------------------------------------------
  // DEFINISI KOLOM DATA TABLE BERSAMA (DataTable.tsx)
  // ---------------------------------------------------------------------------

  // Kolom Tabel Dashboard Pesanan Terkini
  const dashboardOrderColumns: DataTableColumn<any>[] = [
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

  // Kolom Tabel Pengguna (Role TELAH DIHAPUS sesuai permintaan)
  const userColumns: DataTableColumn<any>[] = [
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

  // Kolom Tabel Undangan Berlangsung (ACARA, PASANGAN, TANGGAL, TAMU, AKSI)
  const invitationColumns: DataTableColumn<any>[] = [
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

  // Kolom Tabel Keuangan
  const financeOrderColumns: DataTableColumn<any>[] = [
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

  // Kolom Tabel Template
  const templateColumns: DataTableColumn<any>[] = [
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
        <div>
          <p className="font-bold text-neutral-900">{tpl.name}</p>
          <span className="text-[11px] text-amber-600 font-medium">
            ⭐ {tpl.rating} (Review Positif)
          </span>
        </div>
      ),
    },
    {
      key: "category",
      header: "KATEGORI & TIER",
      sortable: true,
      render: (tpl) => (
        <div>
          <p className="text-neutral-700 font-semibold">{tpl.category}</p>
          <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded">
            {tpl.tier}
          </span>
        </div>
      ),
    },
    {
      key: "price",
      header: "HARGA",
      sortable: true,
      render: (tpl) => (
        <div>
          <span className="font-bold text-neutral-900 block">
            Rp {tpl.price.toLocaleString("id-ID")}
          </span>
          <span className="text-[10px] text-neutral-400 line-through">
            Rp {tpl.originalPrice.toLocaleString("id-ID")}
          </span>
        </div>
      ),
    },
    {
      key: "totalUsers",
      header: "TOTAL PENGGUNA",
      sortable: true,
      render: (tpl) => (
        <span className="font-black text-[#7d6aee]">
          {tpl.totalUsers} Pasangan
        </span>
      ),
    },
    {
      key: "totalRevenue",
      header: "TOTAL OMSET",
      sortable: true,
      render: (tpl) => (
        <span className="font-bold text-emerald-700">
          Rp {tpl.totalRevenue.toLocaleString("id-ID")}
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
    setDashAuthenticated(false);
    const target = isStandalone ? "/login" : PATHS.dashLogin;
    if (onNavigate) {
      onNavigate(target);
    } else {
      window.location.href = target;
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
    { id: "overview", label: "Dashboard", icon: LayoutGrid },
    { id: "users", label: "Pengguna", icon: Users, badge: usersList.length },
    { id: "analytics", label: "Transaksi", icon: ChartPie },
    { id: "finance", label: "Keuangan", icon: Wallet, badge: ordersList.filter(o => o.status === "MENUNGGU_VERIFIKASI").length },
    { id: "templates", label: "Template", icon: Palette, badge: templatesList.length },
    { id: "invitations", label: "Berlangsung", icon: Radio, badge: invitationsList.length },
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

      {/* ========================================================================= */}
      {/* DESKTOP SIDEBAR                                                           */}
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
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-all md:transition-none cursor-pointer ${
                    isActive
                      ? "bg-[#7d6aee] text-white shadow-2xs font-extrabold border border-[#7d6aee] border-b-[3px] border-b-[#5c47dc]"
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

        {/* SIDEBAR FOOTER: MENU PENGATURAN + USER AVATAR & LOGOUT (TANPA SEPARATOR) */}
        <div className="flex flex-col gap-2">
          {/* Menu Pengaturan di atas component profile group */}
          <button
            type="button"
            onClick={() => handleSelectTab("settings")}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs lg:text-sm font-semibold transition-all md:transition-none cursor-pointer ${
              activeTab === "settings"
                ? "bg-[#7d6aee] text-white shadow-2xs font-extrabold border border-[#7d6aee] border-b-[3px] border-b-[#5c47dc]"
                : "text-neutral-600 hover:bg-neutral-100/80 hover:text-neutral-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Settings className={`w-4 h-4 ${activeTab === "settings" ? "text-white" : "text-neutral-500"}`} />
              <span>Pengaturan</span>
            </div>
          </button>

          {/* Component Profile Group */}
          <div className="flex items-center justify-between gap-2.5 p-2.5 rounded-2xl bg-white border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
            <div
              onClick={() => {
                setEditAdminName(adminProfile.name);
                setEditAdminEmail(adminProfile.email);
                setEditAdminPhone(adminProfile.phone);
                setEditAdminAvatar(adminProfile.avatar);
                setIsEditAdminProfileOpen(true);
              }}
              className="flex items-center gap-2.5 min-w-0 cursor-pointer group flex-1 hover:opacity-90"
              title="Klik untuk Edit Profil Admin (Foto & WhatsApp)"
            >
              <div className="relative shrink-0">
                <img
                  src={adminProfile.avatar}
                  alt={adminProfile.name}
                  className="size-9 rounded-full object-cover border border-[#7d6aee]/30 shadow-2xs group-hover:ring-2 group-hover:ring-[#7d6aee] transition-all md:transition-none"
                />
                <span className="absolute -bottom-0.5 -right-0.5 size-3.5 bg-[#7d6aee] text-white rounded-full flex items-center justify-center p-0.5 shadow-2xs">
                  <Pencil className="w-2 h-2" />
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-neutral-900 truncate leading-tight group-hover:text-[#7d6aee] transition-colors md:transition-none">
                  {adminProfile.name}
                </p>
                <p className="text-[11px] text-neutral-500 truncate leading-tight">
                  {adminProfile.phone || adminProfile.email}
                </p>
              </div>
            </div>

            {/* Tombol Logout di baris yang sama, di bagian kanan */}
            <button
              type="button"
              onClick={() => setIsLogoutModalOpen(true)}
              title="Logout / Keluar"
              className="p-2 rounded-xl text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors md:transition-none shrink-0 cursor-pointer"
              aria-label="Tombol Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Right Side */}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        {/* Top Navbar Dash Sticky di Desktop */}
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
            hideAvatar={activeTab === "settings"}
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

      {/* ========================================================================= */}
      {/* MAIN CONTENT AREA                                                         */}
      {/* ========================================================================= */}
      <main className="flex-1 min-w-0 flex flex-col p-4 sm:p-6 lg:p-8 gap-6 max-w-7xl mx-auto w-full pb-24 md:pb-8">
        {/* ----------------------------------------------------------------------- */}
        {/* TAB 1: RINGKASAN / OVERVIEW                                             */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-fadeIn md:animate-none">
            {/* Header Tab 1 Ringkasan & Filter Periode Desktop */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
              <div>
                <h1 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
                  Ringkasan Kinerja Platform
                </h1>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                  Menampilkan data aktual periode: <span className="font-bold text-[#7d6aee]">{periodData.periodTitle}</span>
                </p>
              </div>

              {/* Filter Periode Desktop */}
              <div className="hidden md:flex items-center gap-1.5 p-1 bg-purple-50/70 border border-purple-200 rounded-xl">
                {(["Harian", "Mingguan", "Bulanan", "Kuartalan", "Tahunan", "Semua"] as DashPeriodType[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setSelectedPeriod(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                      selectedPeriod === p
                        ? "bg-[#7d6aee] text-white shadow-xs"
                        : "text-neutral-600 hover:text-neutral-900 hover:bg-white/80"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Stat KPI Cards (Data Aktual Terhubung ke Filter Periode) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-neutral-500">Total Undangan</p>
                    <p className="text-xl sm:text-2xl font-black text-neutral-900 mt-1">
                      {periodData.totalInvitationsCount.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 text-white shadow-2xs">
                    <FileHeart className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{periodData.invitationGrowth}</span>
                  <span className="text-neutral-400 font-normal">{periodData.comparisonLabel}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-neutral-500">Perlu Verifikasi</p>
                    <p className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
                      {periodData.pendingOrders.length} Pesanan
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-2xs">
                    <Clock className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block border border-amber-200/60 border-b-[2px] border-b-amber-300/80">
                  {periodData.pendingOrders.length > 0 ? "Butuh aksi konfirmasi bukti" : "Semua pesanan terverifikasi"}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-neutral-500">Omset {periodData.periodTitle}</p>
                    <p className="text-xl sm:text-2xl font-black text-neutral-900 mt-1">
                      Rp {periodData.currentRevenue.toLocaleString("id-ID")}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white shadow-2xs">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{periodData.revenueGrowth}</span>
                  <span className="text-neutral-400 font-normal">{periodData.comparisonLabel}</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-neutral-500">Pengguna Terdaftar</p>
                    <p className="text-xl sm:text-2xl font-black text-neutral-900 mt-1">
                      {periodData.newUsersCount} Pengguna
                    </p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-gradient-to-tr from-purple-500 to-[#7d6aee] text-white shadow-2xs">
                    <Users className="w-5 h-5" />
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                  <span>{periodData.userGrowthText}</span>
                </div>
              </div>
            </div>

            {/* Quick Chart Preview & Ringkasan Penjualan */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
                <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
                  <div>
                    <h2 className="text-sm sm:text-base font-extrabold text-neutral-900">
                      {periodData.chartTitle}
                    </h2>
                    <p className="text-xs text-neutral-400">
                      Total {periodData.currentOrders.length} transaksi pada periode ini
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab("analytics")}
                    className="text-xs font-extrabold text-[#7d6aee] hover:underline flex items-center gap-1"
                  >
                    Lihat Transaksi <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* SVG Mini Chart Bars (Dinamis dari Data Aktual Periode) */}
                <div className="mt-6 flex items-end gap-2 sm:gap-4 h-44 sm:h-52 pt-6 pb-2 px-2 border-b border-neutral-100">
                  {periodData.chartBars.map((bar, idx) => {
                    const heightPercent =
                      periodData.maxChartRev > 0
                        ? Math.max(12, Math.round((bar.revenue / periodData.maxChartRev) * 100))
                        : 12;
                    return (
                      <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                        <div className="relative w-full flex justify-center">
                          <span className="absolute -top-7 hidden group-hover:block bg-neutral-900 text-white text-[10px] font-bold py-0.5 px-1.5 rounded shadow z-10 whitespace-nowrap">
                            Rp {bar.revenue.toLocaleString("id-ID")} ({bar.count} order)
                          </span>
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full max-w-[28px] rounded-t-md transition-all ${
                              bar.revenue > 0
                                ? "bg-[#7d6aee] hover:bg-[#6b58e0]"
                                : "bg-purple-100 hover:bg-purple-200"
                            }`}
                          />
                        </div>
                        <span className="text-[10px] sm:text-xs text-neutral-500 font-bold truncate max-w-full">
                          {bar.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2 px-2">
                  <span>Periode: {periodData.periodTitle}</span>
                  <span className="font-bold text-[#7d6aee]">
                    Total Omset: Rp {periodData.currentRevenue.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Template Terpopuler Box */}
              <div className="bg-white rounded-2xl p-5 border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs flex flex-col justify-between">
                <div>
                  <h2 className="text-sm sm:text-base font-extrabold text-neutral-900 pb-3 border-b border-neutral-100">
                    Template Terlaris ({periodData.periodTitle})
                  </h2>
                  <div className="mt-4 space-y-3">
                    {periodData.popularTemplates.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-neutral-50 transition-colors">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={item.tpl.thumbnail}
                            alt={item.name}
                            className="size-10 rounded-lg object-cover border border-purple-100 shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-neutral-900 truncate">{item.name}</p>
                            <p className="text-[11px] text-neutral-400">{item.tpl.category}</p>
                          </div>
                        </div>
                        <span className="text-xs font-black text-[#7d6aee] shrink-0">
                          {item.count} x
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setActiveTab("templates")}
                  className="w-full mt-4 justify-center"
                >
                  Kelola Semua Template &rarr;
                </Button>
              </div>
            </div>

            {/* Pesanan Terbaru yang Butuh Perhatian (Menggunakan Shared DataTable) */}
            <div className="bg-white rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h2 className="font-extrabold text-sm sm:text-base text-neutral-900">
                    Pesanan &amp; Verifikasi Terkini ({periodData.periodTitle})
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Daftar pembayaran masuk yang menunggu verifikasi atau transaksi pada periode ini.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("finance")}
                  className="text-xs font-extrabold text-[#7d6aee] hover:underline"
                >
                  Buka Menu Keuangan &rarr;
                </button>
              </div>

              <DataTable
                columns={dashboardOrderColumns}
                data={periodData.currentOrders.length > 0 ? periodData.currentOrders.slice(0, 5) : ordersList.slice(0, 5)}
                emptyMessage="Tidak ada pesanan pada periode ini."
              />
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 2: DATA PENGGUNA TERDAFTAR (USERS TABLE)                            */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === "users" && (
          <div className="space-y-6 animate-fadeIn md:animate-none">
            {/* Filter & Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama, email, atau nomor WhatsApp..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 border-b-[2px] border-b-neutral-300 focus:outline-none focus:border-[#7d6aee] focus:border-b-[#7d6aee]"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-extrabold text-purple-700 bg-purple-50 px-3 py-2 rounded-xl border border-purple-200 border-b-[2px] border-b-purple-300 shadow-2xs">
                  Total: <strong className="text-neutral-900">{usersList.length} Akun</strong>
                </span>
                <button
                  type="button"
                  onClick={() => showToast("Ekspor data pengguna berhasil!")}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-neutral-200 border-b-[3px] border-b-neutral-300/80 hover:bg-neutral-50 text-xs font-extrabold text-neutral-700 shadow-2xs active:scale-[0.99] active:border-b-[2px] transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Ekspor CSV</span>
                </button>
              </div>
            </div>

            {/* Users Data Table (Role TELAH DIHAPUS, Menggunakan Shared DataTable) */}
            <DataTable
              columns={userColumns}
              data={usersList.filter(
                (u) =>
                  u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  u.phone.includes(searchQuery)
              )}
              emptyMessage="Pengguna tidak ditemukan."
            />
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 3: GRAFIK PEMBELIAN & ANALISIS (CHARTS & ANALYTICS)                  */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === "analytics" && (
          <div className="space-y-6 animate-fadeIn md:animate-none">
            {/* Filter Waktu */}
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-purple-100 border-b-[2px] border-b-purple-200/70 shadow-2xs select-none">
                <button
                  type="button"
                  onClick={() => setTimeRange("7d")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timeRange === "7d" ? "bg-[#7d6aee] text-white shadow-2xs" : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  7 Hari
                </button>
                <button
                  type="button"
                  onClick={() => setTimeRange("30d")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timeRange === "30d" ? "bg-[#7d6aee] text-white shadow-2xs" : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  30 Hari
                </button>
                <button
                  type="button"
                  onClick={() => setTimeRange("1y")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timeRange === "1y" ? "bg-[#7d6aee] text-white shadow-2xs" : "text-neutral-500 hover:text-neutral-800"
                  }`}
                >
                  1 Tahun
                </button>
              </div>
            </div>

            {/* Metric KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
                <p className="text-xs font-semibold text-neutral-400">Total Transaksi Selesai</p>
                <p className="text-2xl font-black text-neutral-900 mt-1">142 Pesanan</p>
                <span className="text-xs font-bold text-emerald-600 mt-2 block">+24% vs periode lalu</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
                <p className="text-xs font-semibold text-neutral-400">Rata-rata Nilai Transaksi (AOV)</p>
                <p className="text-2xl font-black text-neutral-900 mt-1">Rp 148.500</p>
                <span className="text-xs font-bold text-neutral-500 mt-2 block">Dominan paket Gold & Platinum</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
                <p className="text-xs font-semibold text-neutral-400">Tingkat Konversi Pembayaran</p>
                <p className="text-2xl font-black text-emerald-600 mt-1">94.2%</p>
                <span className="text-xs font-bold text-emerald-600 mt-2 block">QRIS terbukti paling cepat</span>
              </div>
            </div>

            {/* Big Chart Section */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs space-y-4">
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
              <div className="bg-white p-5 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
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

              <div className="bg-white p-5 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
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
          <div className="space-y-6 animate-fadeIn md:animate-none">
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => showToast("Laporan keuangan berhasil diunduh!")}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7d6aee] hover:bg-[#6b58e0] text-white text-xs font-extrabold border border-[#6b58e0] border-b-[3px] border-b-[#513ecb] shadow-2xs hover:shadow-xs active:scale-[0.98] active:border-b-[2px] active:translate-y-[1px] transition-all cursor-pointer"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Cetak Rekap Keuangan</span>
              </button>
            </div>

            {/* Financial Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
                <span className="text-xs font-semibold text-neutral-400">Total Pemasukan Bersih</span>
                <p className="text-2xl font-black text-emerald-600 mt-1">Rp 14.850.000</p>
                <span className="text-[11px] text-neutral-500 mt-1 block">Bulan Berjalan (Oktober 2026)</span>
              </div>
              <div className="bg-white p-5 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
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
              <div className="bg-white p-5 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
                <span className="text-xs font-semibold text-neutral-400">Biaya Payment Gateway (Est.)</span>
                <p className="text-2xl font-black text-neutral-900 mt-1">Rp 124.500</p>
                <span className="text-[11px] text-neutral-500 mt-1 block">0.7% QRIS MDR Rate</span>
              </div>
            </div>

            {/* Orders Data Table */}
            <div className="bg-white rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs overflow-hidden">
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
                    className="pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-200 border-b-[2px] border-b-neutral-300 focus:outline-none focus:border-[#7d6aee] focus:border-b-[#7d6aee] w-full sm:w-64"
                  />
                </div>
              </div>

              <DataTable
                columns={financeOrderColumns}
                data={ordersList.filter(
                  (ord) =>
                    ord.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    ord.customer.toLowerCase().includes(searchQuery.toLowerCase())
                )}
                emptyMessage="Pesanan tidak ditemukan."
              />
            </div>
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 5: PANTAUAN TEMPLATE (TEMPLATES & USAGE MONITOR)                     */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === "templates" && (
          <div className="space-y-6 animate-fadeIn md:animate-none">
            <div className="flex items-center justify-end sm:hidden">
              <button
                type="button"
                onClick={() => setIsAddTemplateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7d6aee] hover:bg-[#6b58e0] text-white text-xs font-extrabold border border-[#6b58e0] border-b-[3px] border-b-[#513ecb] shadow-2xs hover:shadow-xs active:scale-[0.98] active:border-b-[2px] active:translate-y-[1px] transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Template Baru</span>
              </button>
            </div>

            {/* Template Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
                <span className="text-xs text-neutral-400 font-semibold">Total Template Aktif</span>
                <p className="text-xl font-black text-neutral-900 mt-1">{templatesList.length} Desain</p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
                <span className="text-xs text-neutral-400 font-semibold">Total Undangan Dibuat</span>
                <p className="text-xl font-black text-neutral-900 mt-1">
                  {templatesList.reduce((acc, t) => acc + t.totalUsers, 0)} Undangan
                </p>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
                <span className="text-xs text-neutral-400 font-semibold">Akumulasi Omset Template</span>
                <p className="text-xl font-black text-emerald-600 mt-1">
                  Rp {(templatesList.reduce((acc, t) => acc + t.totalRevenue, 0) / 1000000).toFixed(1)} Juta
                </p>
              </div>
            </div>

            {/* Templates Data Table via Shared DataTable */}
            <DataTable
              columns={templateColumns}
              data={templatesList}
              emptyMessage="Template tidak ditemukan."
            />
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 6: UNDANGAN AKTIF / TAYANG (LIVE INVITATIONS MONITOR)               */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === "invitations" && (
          <div className="space-y-6 animate-fadeIn md:animate-none">
            {/* Search Bar & Total Counter di atas tabel */}
            <div className="bg-white p-4 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari acara atau pasangan..."
                  value={invitationSearchQuery}
                  onChange={(e) => setInvitationSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 border-b-[2px] border-b-neutral-300 focus:outline-none focus:border-[#7d6aee] focus:border-b-[#7d6aee]"
                />
              </div>

              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 border-b-[2px] border-b-emerald-300 shadow-2xs self-start sm:self-auto">
                Total: <strong className="text-neutral-900">{invitationsList.filter((inv) =>
                  inv.title.toLowerCase().includes(invitationSearchQuery.toLowerCase()) ||
                  inv.groom.toLowerCase().includes(invitationSearchQuery.toLowerCase()) ||
                  inv.bride.toLowerCase().includes(invitationSearchQuery.toLowerCase())
                ).length} Undangan Online</strong>
              </span>
            </div>

            {/* Invitations Table via Shared DataTable */}
            <DataTable
              columns={invitationColumns}
              data={invitationsList.filter((inv) =>
                inv.title.toLowerCase().includes(invitationSearchQuery.toLowerCase()) ||
                inv.groom.toLowerCase().includes(invitationSearchQuery.toLowerCase()) ||
                inv.bride.toLowerCase().includes(invitationSearchQuery.toLowerCase())
              )}
              emptyMessage="Undangan tidak ditemukan."
            />
          </div>
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* TAB 7: PENGATURAN PLATFORM                                              */}
        {/* ----------------------------------------------------------------------- */}
        {activeTab === "settings" && (
          <div className="space-y-6 animate-fadeIn md:animate-none">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Profil Administrator & Kontak WhatsApp */}
              <div className="bg-white p-5 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#7d6aee]" />
                    <h3 className="text-sm font-extrabold text-neutral-900">
                      Profil Administrator (Tersimpan di Cache)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditAdminName(adminProfile.name);
                      setEditAdminEmail(adminProfile.email);
                      setEditAdminPhone(adminProfile.phone);
                      setEditAdminAvatar(adminProfile.avatar);
                      setIsEditAdminProfileOpen(true);
                    }}
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
                  <button
                    type="button"
                    onClick={() => {
                      setEditAdminName(adminProfile.name);
                      setEditAdminEmail(adminProfile.email);
                      setEditAdminPhone(adminProfile.phone);
                      setEditAdminAvatar(adminProfile.avatar);
                      setIsEditAdminProfileOpen(true);
                    }}
                    className="w-full py-2.5 bg-[#7d6aee] hover:bg-[#6b58e0] text-white text-xs font-extrabold rounded-xl border border-[#6b58e0] border-b-[3px] border-b-[#513ecb] shadow-2xs hover:shadow-xs active:scale-[0.98] active:border-b-[2px] active:translate-y-[1px] transition-all cursor-pointer"
                  >
                    Ubah Foto Profil &amp; Nomor WhatsApp
                  </button>
                </div>
              </div>

              {/* Payment Gateway Config */}
              <div className="bg-white p-5 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#7d6aee]" />
                    <h3 className="text-sm font-extrabold text-neutral-900">
                      Rekening Pembayaran &amp; QRIS
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
                    onClick={() => {
                      saveAdminSettingsCache(adminSettings);
                      showToast("Pengaturan rekening pembayaran berhasil disimpan ke cache!");
                    }}
                    className="w-full py-2.5 bg-[#7d6aee] hover:bg-[#6b58e0] text-white text-xs font-extrabold rounded-xl border border-[#6b58e0] border-b-[3px] border-b-[#513ecb] shadow-2xs hover:shadow-xs active:scale-[0.98] active:border-b-[2px] active:translate-y-[1px] transition-all cursor-pointer"
                  >
                    Simpan Pengaturan ke Cache
                  </button>
                </div>
              </div>

              {/* Tombol Logout Seperti pada Halaman Profile di App */}
              <div className="bg-white p-5 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs space-y-4 lg:col-span-2">
                <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                  <div className="flex items-center gap-2">
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <h3 className="text-sm font-extrabold text-neutral-900">
                      Keluar dari Sesi Administrator
                    </h3>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs text-neutral-500 font-medium">
                    Akhiri sesi masuk dashboard admin ini. Anda perlu masuk kembali dengan kredensial administrator untuk mengakses panel pengawasan.
                  </p>
                  <Button
                    variant="danger"
                    size="lg"
                    onClick={() => setIsLogoutModalOpen(true)}
                    className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-white" />
                    <span>Log out</span>
                  </Button>
                  <p className="text-[11px] text-center text-neutral-400 font-medium mt-2">
                    Anda perlu masuk kembali untuk mengakses Admin Panel
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Nav for Satu Cerita Dash (Hanya di Mobile, sama persis dengan app) */}
      {/* Paksakan menampilkan 6 icon menu TANPA judul (hilangkan menu Undangan Tayang) */}
      <nav
        id="satucerita-dash-bottom-navbar"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 border-t border-purple-100 backdrop-blur-lg shadow-lg select-none"
        aria-label="Satu Cerita Dash Navigation"
      >
        <div className="max-w-md mx-auto grid grid-cols-7 h-16 px-1">
          {/* 1. Dashboard */}
          <button
            type="button"
            onClick={() => handleSelectTab("overview")}
            className={`flex items-center justify-center transition-all cursor-pointer relative ${
              activeTab === "overview"
                ? "text-[#7d6aee]"
                : "text-neutral-500 hover:text-neutral-900"
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

          {/* 2. Pengguna */}
          <button
            type="button"
            onClick={() => handleSelectTab("users")}
            className={`flex items-center justify-center transition-all cursor-pointer relative ${
              activeTab === "users"
                ? "text-[#7d6aee]"
                : "text-neutral-500 hover:text-neutral-900"
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

          {/* 3. Transaksi */}
          <button
            type="button"
            onClick={() => handleSelectTab("analytics")}
            className={`flex items-center justify-center transition-all cursor-pointer relative ${
              activeTab === "analytics"
                ? "text-[#7d6aee]"
                : "text-neutral-500 hover:text-neutral-900"
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

          {/* 4. Keuangan */}
          <button
            type="button"
            onClick={() => handleSelectTab("finance")}
            className={`flex items-center justify-center transition-all cursor-pointer relative ${
              activeTab === "finance"
                ? "text-[#7d6aee]"
                : "text-neutral-500 hover:text-neutral-900"
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

          {/* 5. Template */}
          <button
            type="button"
            onClick={() => handleSelectTab("templates")}
            className={`flex items-center justify-center transition-all cursor-pointer relative ${
              activeTab === "templates"
                ? "text-[#7d6aee]"
                : "text-neutral-500 hover:text-neutral-900"
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

          {/* 6. Berlangsung */}
          <button
            type="button"
            onClick={() => handleSelectTab("invitations")}
            className={`flex items-center justify-center transition-all cursor-pointer relative ${
              activeTab === "invitations"
                ? "text-[#7d6aee]"
                : "text-neutral-500 hover:text-neutral-900"
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

          {/* 7. Pengaturan */}
          <button
            type="button"
            onClick={() => handleSelectTab("settings")}
            className={`flex items-center justify-center transition-all cursor-pointer relative ${
              activeTab === "settings"
                ? "text-[#7d6aee]"
                : "text-neutral-500 hover:text-neutral-900"
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

      {/* ========================================================================= */}
      {/* MODAL: DETAIL USER & EDIT                                                 */}
      {/* ========================================================================= */}
      {selectedUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-purple-100 border-b-[4px] border-b-purple-200 space-y-4">
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

      {/* ========================================================================= */}
      {/* MODAL: DETAIL PESANAN & VERIFIKASI PEMBAYARAN                             */}
      {/* ========================================================================= */}
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

      {/* ========================================================================= */}
      {/* MODAL: TAMBAH TEMPLATE BARU                                               */}
      {/* ========================================================================= */}
      {isAddTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-purple-100 border-b-[4px] border-b-purple-200 space-y-4">
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

      {/* ========================================================================= */}
      {/* MODAL: EDIT PROFIL ADMINISTRATOR (FOTO & WHATSAPP)                        */}
      {/* ========================================================================= */}
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
              {/* Upload Foto Profil */}
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
                  onChange={(e) => setEditAdminEmail(e.target.value)}
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
                onClick={() => {
                  const updated = saveAdminProfileCache({
                    name: editAdminName,
                    email: editAdminEmail,
                    phone: editAdminPhone,
                    avatar: editAdminAvatar,
                  });
                  setAdminProfile(updated);
                  setIsEditAdminProfileOpen(false);
                  showToast("Profil admin & nomor WhatsApp berhasil disimpan ke cache!");
                }}
                className="px-5 py-2.5 rounded-xl bg-[#7d6aee] hover:bg-[#6b58e0] text-white text-xs font-extrabold border border-[#6b58e0] border-b-[3px] border-b-[#513ecb] shadow-2xs hover:shadow-xs active:scale-[0.98] active:border-b-[2px] active:translate-y-[1px] cursor-pointer transition-all"
              >
                Simpan ke Cache
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
