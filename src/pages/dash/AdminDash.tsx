import React, { useState, useMemo, useEffect, useCallback } from "react";
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
  removeCache,
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
  pathToDashTab,
  dashTabToPath,
} from "./types";
import { fetchAdminOverview, downloadCsv } from "@/lib/adminApi";
import { buildPeriodData } from "./period";
import { OverviewPage } from "./OverviewPage";
import { UsersPage } from "./UsersPage";
import { AnalyticsPage } from "./AnalyticsPage";
import { FinancePage } from "./FinancePage";
import { TemplatesPage } from "./TemplatesPage";
import { InvitationsPage } from "./InvitationsPage";
import { SettingsPage } from "./SettingsPage";
import { AppSidebar } from "@/components/AppSidebar";
import { ImageCropModal } from "@/components/ImageCropModal";

export * from "./types";

const OrderStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  if (status === "LUNAS") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        Lunas
      </span>
    );
  }
  if (status === "MENUNGGU_VERIFIKASI") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 animate-pulse">
        <Clock className="w-3 h-3 text-amber-600" />
        Perlu Ditinjau
      </span>
    );
  }
  if (status === "MENUNGGU_BAYAR") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800">
        <Clock className="w-3 h-3 text-sky-600" />
        Belum Bayar
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
      Batal
    </span>
  );
};

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

  // Image Crop Modal
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);

  const handleSelectCropFile = async (file: File) => {
    try {
      const dataUrl = await convertFileToDataUrl(file);
      setCropImageSrc(dataUrl);
      setIsCropModalOpen(true);
    } catch (_err) {}
  };

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

  // ===== DATA ASLI dari Supabase (Worker: GET /api/admin/overview, hanya akun admin) =====
  const [usersList, setUsersList] = useState<AdminUserData[]>([]);
  const [ordersList, setOrdersList] = useState<AdminOrderItem[]>([]);
  const [templatesList, setTemplatesList] = useState<AdminTemplateItem[]>([]);
  const [allInvitations, setAllInvitations] = useState<AdminInvitationItem[]>([]);
  const [dataState, setDataState] = useState<{ loading: boolean; error: string | null }>({ loading: true, error: null });

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setDataState({ loading: true, error: null });
    const res = await fetchAdminOverview();
    if (!res.ok) {
      // Refresh otomatis yang gagal tidak menimpa data yang sudah tampil.
      if (!silent) setDataState({ loading: false, error: res.error });
      return;
    }
    setUsersList(res.data.users);
    setOrdersList(res.data.orders);
    setTemplatesList(res.data.templates);
    setAllInvitations(res.data.invitations);
    setDataState({ loading: false, error: null });
  }, []);

  useEffect(() => {
    // Buang sisa data pengguna tiruan dari versi lama (tidak dipakai lagi).
    removeCache(CACHE_KEYS.ADMIN_USERS);
    void loadData();
    const timer = window.setInterval(() => void loadData(true), 60_000);
    return () => window.clearInterval(timer);
  }, [loadData]);

  // Tab "Berlangsung" = undangan yang sudah dipublikasikan.
  const invitationsList = useMemo(() => allInvitations.filter((i) => i.status === "Online"), [allInvitations]);

  const periodData: PeriodDataResult = useMemo(
    () => buildPeriodData(selectedPeriod, ordersList, usersList, allInvitations, templatesList),
    [selectedPeriod, ordersList, usersList, allInvitations, templatesList]
  );

  const exportUsersCsv = () => {
    downloadCsv(
      "pengguna-satucerita.csv",
      ["Nama", "Email", "WhatsApp", "Role", "Jumlah Undangan", "Total Belanja", "Tanggal Daftar", "Status"],
      usersList.map((u) => [u.name, u.email, u.phone, u.role, u.invitationsCount, u.totalSpent, u.joinedDate, u.status])
    );
  };
  const exportOrdersCsv = () => {
    downloadCsv(
      "pesanan-satucerita.csv",
      ["Invoice", "Pemesan", "Email", "WhatsApp", "Template", "Paket", "Harga", "Total", "Metode", "Status", "Dibuat", "Lunas"],
      ordersList.map((o) => [o.id, o.customer, o.customerEmail, o.customerPhone, o.template, o.tier, o.amount, o.total, o.paymentMethod, o.status, o.date, o.paidAt ?? ""])
    );
  };


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
      render: (ord) => <OrderStatusBadge status={ord.status} />,
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
        usr.phone ? (
          <a
            href={`https://wa.me/${usr.phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noreferrer"
            className="hover:text-emerald-600 hover:underline inline-flex items-center gap-1 font-mono text-neutral-600"
          >
            {usr.phone}
          </a>
        ) : (
          <span className="text-neutral-300">-</span>
        )
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
          {inv.eventDate ? formatIndonesianDateShort(inv.eventDate) : "-"}
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
          <span className="text-neutral-400 text-xs">
            {inv.guestCount > 0 ? ` / ${inv.guestCount} tamu` : " hadir"} · {inv.wishesCount} ucapan
          </span>
        </div>
      ),
    },
    {
      key: "action",
      header: "AKSI",
      align: "right",
      render: (inv) => (
        <a
          href={inv.publicUrl}
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
      header: "TOTAL",
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
      render: (ord) => <OrderStatusBadge status={ord.status} />,
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

  const handlePerformLogout = async () => {
    setIsLogoutModalOpen(false);
    await signOut();
    const target = isStandalone ? "/login" : PATHS.dashLogin;
    window.location.replace(target);
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

      {/* DESKTOP SIDEBAR - Shared AppSidebar (Lebar 15% lebih besar, teks & icon 14px di desktop, tanpa animasi) */}
      <AppSidebar
        logoSrc="/logos/satucerita.png"
        brandName={<>Satu<span className="text-[#7d6aee]">Cerita</span></>}
        brandSubtitle="Admin Panel"
        onLogoClick={() => handleSelectTab("overview")}
        collapsible
        collapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
        navItems={navItems.map((item) => ({
          id: item.id,
          label: item.label,
          icon: item.icon,
          badge: item.badge,
          isActive: activeTab === item.id,
          onClick: () => handleSelectTab(item.id),
        }))}
        footerNavItems={[
          {
            id: "settings",
            label: "Pengaturan",
            icon: Settings,
            isActive: activeTab === "settings",
            onClick: () => handleSelectTab("settings"),
          },
        ]}
        footerUser={{
          avatar: adminProfile.avatar,
          name: adminProfile.name || "Admin",
          email: adminProfile.email,
          onEdit: () => {
            setEditAdminName("Admin");
            setEditAdminEmail(adminProfile.email);
            setEditAdminPhone(adminProfile.phone);
            setEditAdminAvatar(adminProfile.avatar);
            setIsEditAdminProfileOpen(true);
          },
        }}
      />

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
          {dataState.loading && (
            <div role="status" className="text-xs font-bold text-[#7d6aee] bg-purple-50 border border-purple-100 rounded-xl px-4 py-2.5">
              Memuat data dari database…
            </div>
          )}
          {dataState.error && (
            <div role="alert" className="flex items-center justify-between gap-3 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">
              <span>{dataState.error}</span>
              <button
                type="button"
                onClick={() => void loadData()}
                className="shrink-0 px-3 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-700 hover:bg-rose-100 cursor-pointer"
              >
                Coba lagi
              </button>
            </div>
          )}
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
              onExport={exportUsersCsv}
            />
          )}

          {activeTab === "analytics" && (
            <AnalyticsPage
              timeRange={timeRange}
              setTimeRange={setTimeRange}
              ordersList={ordersList}
              templatesList={templatesList}
            />
          )}

          {activeTab === "finance" && (
            <FinancePage
              ordersList={ordersList}
              financeOrderColumns={financeOrderColumns}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              showToast={showToast}
              onExport={exportOrdersCsv}
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
                <span className="font-bold text-neutral-800">{selectedUserModal.phone || "-"}</span>
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
              {selectedUserModal.phone ? (
                <a
                  href={`https://wa.me/${selectedUserModal.phone.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold border border-emerald-500 border-b-[3px] border-b-emerald-800 shadow-2xs active:scale-[0.99] active:border-b-[2px] flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Hubungi WA</span>
                </a>
              ) : (
                <span className="text-xs text-neutral-400 px-2">Belum ada nomor WhatsApp</span>
              )}
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
                  Detail Pesanan #{selectedOrderModal.id}
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
                <span className="font-medium text-neutral-700">{selectedOrderModal.customerPhone || "-"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Template / Paket:</span>
                <span className="font-bold text-neutral-900">
                  {selectedOrderModal.template}
                  {selectedOrderModal.tier ? ` (${selectedOrderModal.tier})` : ""}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Metode Pembayaran:</span>
                <span className="font-bold text-[#7d6aee]">{selectedOrderModal.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold border-t border-neutral-200 pt-2 mt-2">
                <span className="text-neutral-900">Total Pembayaran:</span>
                <span className="text-emerald-600">
                  Rp {selectedOrderModal.total.toLocaleString("id-ID")}
                </span>
              </div>
            </div>

            {selectedOrderModal.status === "MENUNGGU_VERIFIKASI" && (
              <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs font-medium border border-amber-200 leading-relaxed">
                Pesanan ini ditahan otomatis (nominal pembayaran tidak cocok atau ditandai fraud challenge). Periksa transaksinya di dashboard Midtrans;
                status baru berubah lunas lewat notifikasi pembayaran Midtrans.
              </div>
            )}
            {selectedOrderModal.status === "MENUNGGU_BAYAR" && (
              <div className="p-3 rounded-xl bg-sky-50 text-sky-800 text-xs font-medium border border-sky-200">
                Pembeli belum menyelesaikan pembayaran. Status berubah otomatis saat Midtrans mengirim notifikasi.
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
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleSelectCropFile(file);
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
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleSelectCropFile(file);
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

      {/* Image Crop Modal */}
      <ImageCropModal
        isOpen={isCropModalOpen}
        imageSrc={cropImageSrc}
        onClose={() => setIsCropModalOpen(false)}
        onApplyCrop={(croppedUrl) => {
          setEditAdminAvatar(croppedUrl);
        }}
      />

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
