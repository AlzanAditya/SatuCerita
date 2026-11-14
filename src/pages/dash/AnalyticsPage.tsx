import React, { useMemo, useState } from "react";
import { AdminOrderItem, AdminTemplateItem } from "./types";
import { orderTs, inRange, type Bucket, type Range } from "./period";
import { useT, type TKey } from "@/i18n";

type TimeRange = "7d" | "30d" | "1y";

export interface AnalyticsPageProps {
  timeRange?: TimeRange;
  setTimeRange?: (range: TimeRange) => void;
  ordersList?: AdminOrderItem[];
  templatesList?: AdminTemplateItem[];
}

const BAR_COLORS = ["bg-[#7d6aee]", "bg-indigo-500", "bg-blue-400", "bg-emerald-500", "bg-amber-400", "bg-rose-400"];

/** Rentang sekarang, rentang pembanding (panjang sama tepat sebelumnya), dan bucket grafik. */
function rangesFor(range: TimeRange, now: Date, locale: string): { cur: Range; prev: Range; buckets: Bucket[]; titleKey: TKey } {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  const day = (offset: number) => new Date(y, m, d + offset).getTime();
  const monthShort = new Intl.DateTimeFormat(locale, { month: "short" });
  const weekdayShort = new Intl.DateTimeFormat(locale, { weekday: "short" });
  if (range === "1y") {
    const buckets = Array.from({ length: 12 }, (_, k): Bucket => {
      const from = new Date(y, m - 11 + k, 1);
      return { label: monthShort.format(from), from: from.getTime(), to: new Date(y, m - 11 + k + 1, 1).getTime() };
    });
    return {
      cur: { from: buckets[0].from, to: buckets[11].to },
      prev: { from: new Date(y, m - 23, 1).getTime(), to: buckets[0].from },
      buckets,
      titleKey: "st.dash.an.title.year",
    };
  }
  if (range === "30d") {
    const buckets = Array.from({ length: 6 }, (_, k): Bucket => {
      const from = day(-29 + k * 5);
      const first = new Date(from);
      const last = new Date(day(-29 + k * 5 + 4));
      return {
        label: `${first.getDate()}/${first.getMonth() + 1}-${last.getDate()}/${last.getMonth() + 1}`,
        from,
        to: day(-29 + (k + 1) * 5),
      };
    });
    return { cur: { from: day(-29), to: day(1) }, prev: { from: day(-59), to: day(-29) }, buckets, titleKey: "st.dash.an.title.month" };
  }
  const buckets = Array.from({ length: 7 }, (_, k): Bucket => {
    const from = day(-6 + k);
    const dt = new Date(from);
    return { label: `${weekdayShort.format(dt)} (${dt.getDate()})`, from, to: day(-6 + k + 1) };
  });
  return { cur: { from: day(-6), to: day(1) }, prev: { from: day(-13), to: day(-6) }, buckets, titleKey: "st.dash.an.title.week" };
}

const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  timeRange: propTimeRange,
  setTimeRange: propSetTimeRange,
  ordersList = [],
  templatesList = [],
}) => {
  const { t, lang } = useT();
  const locale = lang === "en" ? "en-US" : "id-ID";
  const rupiah = (n: number) => `Rp ${Math.round(n).toLocaleString(locale)}`;
  const [internalTimeRange, setInternalTimeRange] = useState<TimeRange>("30d");
  const timeRange = propTimeRange ?? internalTimeRange;
  const setTimeRange = propSetTimeRange ?? setInternalTimeRange;

  const stats = useMemo(() => {
    const { cur, prev, buckets, titleKey } = rangesFor(timeRange, new Date(), locale);
    const inCur = ordersList.filter((o) => inRange(orderTs(o), cur));
    const inPrev = ordersList.filter((o) => inRange(orderTs(o), prev));
    const paid = inCur.filter((o) => o.status === "LUNAS");
    const paidPrev = inPrev.filter((o) => o.status === "LUNAS");
    const revenue = paid.reduce((n, o) => n + o.total, 0);

    let delta = t("st.dash.an.delta.none");
    let deltaUp = true;
    if (paidPrev.length > 0) {
      const diff = ((paid.length - paidPrev.length) / paidPrev.length) * 100;
      delta = t("st.dash.an.delta.vsPrev", { pct: `${diff >= 0 ? "+" : ""}${diff.toFixed(0)}%` });
      deltaUp = diff >= 0;
    } else if (paid.length > 0) {
      delta = t("st.dash.an.delta.count", { count: paid.length });
    }

    const bars = buckets.map((b) => {
      const hit = inCur.filter((o) => inRange(orderTs(o), b));
      return {
        label: b.label,
        paid: hit.filter((o) => o.status === "LUNAS").length,
        pending: hit.filter((o) => o.status === "MENUNGGU_BAYAR" || o.status === "MENUNGGU_VERIFIKASI").length,
      };
    });

    const byMethod = new Map<string, number>();
    for (const o of paid) byMethod.set(o.paymentMethod, (byMethod.get(o.paymentMethod) ?? 0) + 1);
    const methods = [...byMethod.entries()].sort((a, b) => b[1] - a[1]);

    const catOf = (o: AdminOrderItem) => templatesList.find((t) => t.id === o.templateSlug)?.category || o.templateCategory || "Lainnya";
    const byCat = new Map<string, number>();
    for (const o of paid) byCat.set(catOf(o), (byCat.get(catOf(o)) ?? 0) + 1);
    const categories = [...byCat.entries()].sort((a, b) => b[1] - a[1]);

    return {
      titleKey,
      created: inCur.length,
      paid: paid.length,
      aov: paid.length ? revenue / paid.length : 0,
      conversion: pct(paid.length, inCur.length),
      delta,
      deltaUp,
      bars,
      maxBar: Math.max(...bars.map((b) => b.paid + b.pending), 1),
      methods,
      categories,
    };
  }, [ordersList, templatesList, timeRange, t, locale]);

  const rangeBtn = (value: TimeRange, label: string) => (
    <button
      type="button"
      onClick={() => setTimeRange(value)}
      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
        timeRange === value ? "bg-[#7d6aee] text-white shadow-2xs" : "text-neutral-500 hover:text-neutral-800"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6 animate-fadeIn md:animate-none">
      {/* Filter Waktu */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-purple-100 border-b-[2px] border-b-purple-200/70 shadow-2xs select-none">
          {rangeBtn("7d", t("st.dash.an.range.7d"))}
          {rangeBtn("30d", t("st.dash.an.range.30d"))}
          {rangeBtn("1y", t("st.dash.an.range.1y"))}
        </div>
      </div>

      {/* Metric KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-neutral-400">{t("st.dash.an.kpi.completed")}</p>
          <p className="text-2xl font-black text-neutral-900 mt-1">{stats.paid} {t("st.dash.an.kpi.orders")}</p>
          <span className={`text-xs font-bold mt-2 block ${stats.deltaUp ? "text-emerald-600" : "text-rose-600"}`}>{stats.delta}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-neutral-400">{t("st.dash.an.kpi.aov")}</p>
          <p className="text-2xl font-black text-neutral-900 mt-1">{rupiah(stats.aov)}</p>
          <span className="text-xs font-bold text-neutral-500 mt-2 block">
            {stats.paid > 0 ? t("st.dash.an.aov.fromPaid", { count: stats.paid }) : t("st.dash.an.aov.none")}
          </span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-neutral-400">{t("st.dash.an.kpi.conversion")}</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">{stats.conversion}%</p>
          <span className="text-xs font-bold text-emerald-600 mt-2 block">
            {t("st.dash.an.conversion.detail", { paid: stats.paid, created: stats.created })}
          </span>
        </div>
      </div>

      {/* Big Chart Section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-extrabold text-neutral-900">{t(stats.titleKey)}</h2>
            <p className="text-xs text-neutral-400">{t("st.dash.an.chart.subtitle")}</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-neutral-500 shrink-0">
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-[#7d6aee]" /> {t("st.dash.an.legend.paid")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-purple-200" /> {t("st.dash.an.legend.pending")}
            </span>
          </div>
        </div>

        <div className="h-64 flex items-end gap-2 sm:gap-4 pt-8 pb-2 px-2 border-b border-neutral-100">
          {stats.bars.map((item, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
              <div className="relative w-full flex flex-col items-center justify-end h-full">
                <span className="absolute -top-7 hidden group-hover:block bg-neutral-900 text-white text-[10px] font-bold py-0.5 px-2 rounded shadow whitespace-nowrap z-10">
                  {t("st.dash.an.tooltip", { paid: item.paid, pending: item.pending })}
                </span>
                <div style={{ height: `${(item.pending / stats.maxBar) * 100}%` }} className="w-full max-w-[32px] bg-purple-200 rounded-t-sm" />
                <div style={{ height: `${(item.paid / stats.maxBar) * 100}%` }} className="w-full max-w-[32px] bg-[#7d6aee] rounded-t-sm" />
              </div>
              <span className="text-[10px] sm:text-xs font-bold text-neutral-600 truncate max-w-full">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
          <h3 className="text-sm font-extrabold text-neutral-900 mb-4">{t("st.dash.an.methods.title")}</h3>
          {stats.methods.length === 0 ? (
            <p className="text-xs text-neutral-400 py-4 text-center">{t("st.dash.an.methods.empty")}</p>
          ) : (
            <div className="space-y-3">
              {stats.methods.map(([name, n], i) => (
                <div key={name}>
                  <div className="flex justify-between text-xs font-bold text-neutral-700 mb-1">
                    <span>{name}</span>
                    <span>
                      {t("st.dash.an.methods.count", { pct: pct(n, stats.paid), count: n })}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                    <div className={`${BAR_COLORS[i % BAR_COLORS.length]} h-full rounded-full`} style={{ width: `${pct(n, stats.paid)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
          <h3 className="text-sm font-extrabold text-neutral-900 mb-4">{t("st.dash.an.categories.title")}</h3>
          {stats.categories.length === 0 ? (
            <p className="text-xs text-neutral-400 py-4 text-center">{t("st.dash.an.categories.empty")}</p>
          ) : (
            <div className="space-y-3">
              {stats.categories.slice(0, 5).map(([name, n], i) => (
                <div
                  key={name}
                  className={`flex items-center justify-between p-2.5 rounded-xl border ${
                    i === 0 ? "bg-purple-50/50 border-purple-100" : "bg-neutral-50 border-neutral-100"
                  }`}
                >
                  <span className="text-xs font-bold text-neutral-800">{name}</span>
                  <span className={`text-xs font-black ${i === 0 ? "text-[#7d6aee]" : "text-neutral-700"}`}>
                    {t("st.dash.an.categories.count", { pct: pct(n, stats.paid), count: n })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
