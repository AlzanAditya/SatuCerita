import React from "react";
import { DashPeriodType } from "@/components/app/AppNavbar";

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

export interface AdminUserData {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  invitationsCount: number;
  totalSpent: number;
  joinedDate: string;
  status: string;
  avatar: string;
}

export interface AdminOrderItem {
  id: string;
  customer: string;
  customerEmail: string;
  customerPhone: string;
  template: string;
  tier: string;
  amount: number;
  uniqueCode: number;
  total: number;
  paymentMethod: string;
  status: string;
  date: string;
  proofUrl: string | null;
}

export interface AdminTemplateItem {
  id: string;
  name: string;
  category: string;
  tier: string;
  price: number;
  originalPrice: number;
  totalUsers: number;
  totalRevenue: number;
  status: string;
  thumbnail: string;
  rating: number;
}

export interface AdminInvitationItem {
  id: string;
  title: string;
  bride: string;
  groom: string;
  eventDate: string;
  template: string;
  slug: string;
  guestCount: number;
  rsvpCount: number;
  status: string;
}

export interface PeriodDataResult {
  currentOrders: AdminOrderItem[];
  prevOrders: AdminOrderItem[];
  currentRevenue: number;
  prevRevenue: number;
  revenueGrowth: string;
  isRevenueUp: boolean;
  pendingOrders: AdminOrderItem[];
  totalInvitationsCount: number;
  invitationGrowth: string;
  isInvUp: boolean;
  newUsersCount: number;
  userGrowthText: string;
  comparisonLabel: string;
  periodTitle: string;
  chartTitle: string;
  chartBars: { label: string; revenue: number; count: number }[];
  maxChartRev: number;
  popularTemplates: { name: string; count: number; revenue: number; tpl: any }[];
}
