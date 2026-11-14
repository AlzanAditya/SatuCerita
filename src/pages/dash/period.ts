import type { DashPeriodType } from "@/components/app/AppNavbar";
import type {
  AdminInvitationItem,
  AdminOrderItem,
  AdminTemplateItem,
  AdminUserData,
  PeriodDataResult,
} from "./types";

const BULAN_PENDEK = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
const BULAN_PANJANG = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const HARI = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const pad = (n: number) => String(n).padStart(2, "0");

/** Waktu yang dipakai untuk menempatkan pesanan di periode: saat lunas untuk yang lunas, selain itu saat dibuat. */
export const orderTs = (o: AdminOrderItem): number =>
  Date.parse(o.status === "LUNAS" && o.paidAt ? o.paidAt : o.createdAt) || 0;

export interface Range { from: number; to: number } // from termasuk, to tidak termasuk
export interface Bucket extends Range { label: string }
export const inRange = (t: number, r: Range) => t >= r.from && t < r.to;

function growth(cur: number, prev: number, kind: "pct" | "count"): { text: string; up: boolean } {
  if (prev > 0) {
    const diff = ((cur - prev) / prev) * 100;
    return { text: `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}%`, up: diff >= 0 };
  }
  if (cur > 0) return { text: kind === "pct" ? "+100%" : `+${cur}`, up: true };
  return { text: "0%", up: true };
}

/** Rentang periode (sekarang & pembanding) + bucket grafik, berdasarkan tanggal sebenarnya. */
export function periodRanges(period: DashPeriodType, now: Date) {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const t = (yy: number, mm: number, dd = 1, hh = 0) => new Date(yy, mm, dd, hh).getTime();
  const dayLabel = (dt: Date) => `${HARI[dt.getDay()]} (${dt.getDate()})`;

  switch (period) {
    case "Harian":
      return {
        cur: { from: t(y, m, d), to: t(y, m, d + 1) },
        prev: { from: t(y, m, d - 1), to: t(y, m, d) } as Range | null,
        comparisonLabel: "vs kemarin",
        periodTitle: `Hari Ini (${d} ${BULAN_PENDEK[m]} ${y})`,
        chartTitle: "Grafik Pendapatan Per 4 Jam (Hari Ini)",
        buckets: [0, 4, 8, 12, 16, 20].map((h): Bucket => ({ label: `${pad(h)}:00`, from: t(y, m, d, h), to: t(y, m, d, h + 4) })),
      };
    case "Mingguan": {
      const start = new Date(y, m, d - 6);
      return {
        cur: { from: start.getTime(), to: t(y, m, d + 1) },
        prev: { from: t(y, m, d - 13), to: start.getTime() } as Range | null,
        comparisonLabel: "vs 7 hari sebelumnya",
        periodTitle: `7 Hari Terakhir (${start.getDate()} ${BULAN_PENDEK[start.getMonth()]} - ${d} ${BULAN_PENDEK[m]} ${y})`,
        chartTitle: "Grafik Pendapatan Mingguan (7 Hari Terakhir)",
        buckets: Array.from({ length: 7 }, (_, i): Bucket => {
          const day = new Date(y, m, d - 6 + i);
          return { label: dayLabel(day), from: day.getTime(), to: t(day.getFullYear(), day.getMonth(), day.getDate() + 1) };
        }),
      };
    }
    case "Bulanan": {
      const last = new Date(y, m + 1, 0).getDate();
      const starts = [1, 6, 11, 16, 21, 26];
      return {
        cur: { from: t(y, m, 1), to: t(y, m + 1, 1) },
        prev: { from: t(y, m - 1, 1), to: t(y, m, 1) } as Range | null,
        comparisonLabel: "vs bulan lalu",
        periodTitle: `Bulan Ini (${BULAN_PANJANG[m]} ${y})`,
        chartTitle: `Tren Pendapatan ${BULAN_PANJANG[m]} ${y}`,
        buckets: starts.map((a, i): Bucket => {
          const next = starts[i + 1] ?? last + 1;
          return { label: `Tgl ${a}-${next - 1}`, from: t(y, m, a), to: t(y, m, next) };
        }),
      };
    }
    case "Kuartalan": {
      const q = Math.floor(m / 3);
      return {
        cur: { from: t(y, q * 3, 1), to: t(y, q * 3 + 3, 1) },
        prev: { from: t(y, q * 3 - 3, 1), to: t(y, q * 3, 1) } as Range | null,
        comparisonLabel: "vs kuartal lalu",
        periodTitle: `Kuartal ${q + 1} ${y}`,
        chartTitle: `Pendapatan Per Bulan (Kuartal ${q + 1} ${y})`,
        buckets: [0, 1, 2].map((i): Bucket => ({ label: BULAN_PENDEK[(q * 3 + i) % 12], from: t(y, q * 3 + i, 1), to: t(y, q * 3 + i + 1, 1) })),
      };
    }
    case "Tahunan":
      return {
        cur: { from: t(y, 0, 1), to: t(y + 1, 0, 1) },
        prev: { from: t(y - 1, 0, 1), to: t(y, 0, 1) } as Range | null,
        comparisonLabel: "vs tahun lalu",
        periodTitle: `Tahun ${y}`,
        chartTitle: `Pendapatan Per Bulan (${y})`,
        buckets: BULAN_PENDEK.map((label, i): Bucket => ({ label, from: t(y, i, 1), to: t(y, i + 1, 1) })),
      };
    default:
      return {
        cur: { from: 0, to: t(y, m + 1, 1) },
        prev: null as Range | null,
        comparisonLabel: "sepanjang waktu",
        periodTitle: "Semua Waktu",
        chartTitle: "Pendapatan 6 Bulan Terakhir",
        buckets: Array.from({ length: 6 }, (_, k): Bucket => {
          const i = 5 - k;
          const from = new Date(y, m - i, 1);
          return { label: BULAN_PENDEK[from.getMonth()], from: from.getTime(), to: t(y, m - i + 1, 1) };
        }),
      };
  }
}

export function buildPeriodData(
  period: DashPeriodType,
  orders: AdminOrderItem[],
  users: AdminUserData[],
  invitations: AdminInvitationItem[],
  templates: AdminTemplateItem[],
  now: Date = new Date(),
): PeriodDataResult {
  const { cur, prev, comparisonLabel, periodTitle, chartTitle, buckets } = periodRanges(period, now);
  const all = period === "Semua";

  const currentOrders = orders.filter((o) => all || inRange(orderTs(o), cur));
  const prevOrders = prev ? orders.filter((o) => inRange(orderTs(o), prev)) : [];
  const sum = (list: AdminOrderItem[]) => list.filter((o) => o.status === "LUNAS").reduce((n, o) => n + o.total, 0);
  const currentRevenue = sum(currentOrders);
  const prevRevenue = sum(prevOrders);
  const rev = all ? { text: "Akumulasi", up: true } : growth(currentRevenue, prevRevenue, "pct");

  const invTs = (i: AdminInvitationItem) => Date.parse(i.createdAt) || 0;
  const curInv = invitations.filter((i) => all || inRange(invTs(i), cur)).length;
  const prevInv = prev ? invitations.filter((i) => inRange(invTs(i), prev)).length : 0;
  const inv = all ? { text: "Semua undangan", up: true } : growth(curInv, prevInv, "count");

  const joinTs = (u: AdminUserData) => Date.parse(u.joinedAt) || 0;
  const newUsersCount = users.filter((u) => all || inRange(joinTs(u), cur)).length;
  const prevNewUsers = prev ? users.filter((u) => inRange(joinTs(u), prev)).length : 0;
  let userGrowthText = `${newUsersCount} user baru`;
  if (all) userGrowthText = `${users.length} total akun`;
  else if (prevNewUsers > 0) {
    const diff = ((newUsersCount - prevNewUsers) / prevNewUsers) * 100;
    userGrowthText = `${diff >= 0 ? "+" : ""}${diff.toFixed(0)}% vs periode lalu`;
  }

  const chartBars = buckets.map((b) => {
    const hit = currentOrders.filter((o) => o.status === "LUNAS" && inRange(orderTs(o), b));
    return { label: b.label, revenue: hit.reduce((n, o) => n + o.total, 0), count: hit.length };
  });

  const bySlug = new Map<string, { name: string; count: number; revenue: number; slug: string; cover: string; category: string }>();
  for (const o of currentOrders.filter((x) => x.status === "LUNAS")) {
    const e = bySlug.get(o.templateSlug) ?? { name: o.template, count: 0, revenue: 0, slug: o.templateSlug, cover: "", category: o.templateCategory };
    e.count += 1;
    e.revenue += o.total;
    bySlug.set(o.templateSlug, e);
  }
  const popularTemplates = [...bySlug.values()]
    .sort((a, b) => b.count - a.count || b.revenue - a.revenue)
    .map((e) => {
      const tpl = templates.find((t) => t.id === e.slug);
      return { name: e.name, count: e.count, revenue: e.revenue, tpl: tpl ?? { thumbnail: e.cover, category: e.category } };
    });

  return {
    currentOrders,
    prevOrders,
    currentRevenue,
    prevRevenue,
    revenueGrowth: rev.text,
    isRevenueUp: rev.up,
    // Pesanan yang perlu ditinjau admin (nominal tidak cocok / fraud challenge) — tidak dibatasi periode.
    pendingOrders: orders.filter((o) => o.status === "MENUNGGU_VERIFIKASI"),
    totalInvitationsCount: curInv,
    invitationGrowth: inv.text,
    isInvUp: inv.up,
    newUsersCount,
    userGrowthText,
    comparisonLabel,
    periodTitle,
    chartTitle,
    chartBars,
    maxChartRev: Math.max(...chartBars.map((b) => b.revenue), 1),
    popularTemplates,
  };
}
