import React from "react";
import {
  FileHeart,
  Clock,
  DollarSign,
  Users,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { DashPeriodType } from "@/components/app/AppNavbar";
import { Button } from "@/components/ui/Button";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import { DashTabType, PeriodDataResult, AdminOrderItem } from "./types";
import { useT, formatRupiahLang, localeOf, type TKey } from "@/i18n";

const PERIOD_OPTIONS: [DashPeriodType, TKey][] = [
  ["Harian", "period.daily"],
  ["Mingguan", "period.weekly"],
  ["Bulanan", "period.monthly"],
  ["Kuartalan", "period.quarterly"],
  ["Tahunan", "period.yearly"],
  ["Semua", "period.all"],
];

export interface OverviewPageProps {
  periodData: PeriodDataResult;
  selectedPeriod: DashPeriodType;
  onPeriodChange: (period: DashPeriodType) => void;
  dashboardOrderColumns: DataTableColumn<AdminOrderItem>[];
  ordersList: AdminOrderItem[];
  onSelectTab: (tab: DashTabType) => void;
}

export const OverviewPage: React.FC<OverviewPageProps> = ({
  periodData,
  selectedPeriod,
  onPeriodChange,
  dashboardOrderColumns,
  ordersList,
  onSelectTab,
}) => {
  const { t, tn, lang } = useT();
  const rp = (n: number) => formatRupiahLang(n, lang);
  return (
    <div className="space-y-6 animate-fadeIn md:animate-none">
      {/* Header Tab 1 Ringkasan & Filter Periode Desktop */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
        <div>
          <h1 className="text-base sm:text-lg font-black text-neutral-900 tracking-tight">
            {t("dash.overview.title")}
          </h1>
          <p className="text-xs text-neutral-500 font-medium mt-0.5">
            {t("dash.overview.subtitle")} <span className="font-bold text-[#7d6aee]">{periodData.periodTitle}</span>
          </p>
        </div>

        {/* Filter Periode Desktop */}
        <div className="hidden md:flex items-center gap-1.5 p-1 bg-purple-50/70 border border-purple-200 rounded-xl">
          {PERIOD_OPTIONS.map(([p, labelKey]) => (
            <button
              key={p}
              type="button"
              onClick={() => onPeriodChange(p)}
              className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                selectedPeriod === p
                  ? "bg-[#7d6aee] text-white shadow-xs"
                  : "text-neutral-600 hover:text-neutral-900 hover:bg-white/80"
              }`}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-500">{t("dash.overview.totalInvitations")}</p>
              <p className="text-xl sm:text-2xl font-black text-neutral-900 mt-1">
                {periodData.totalInvitationsCount.toLocaleString(localeOf(lang))}
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
              <p className="text-xs font-semibold text-neutral-500">{t("dash.overview.needReview")}</p>
              <p className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
                {tn("dash.n.orders", periodData.pendingOrders.length)}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 text-white shadow-2xs">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block border border-amber-200/60 border-b-[2px] border-b-amber-300/80">
            {periodData.pendingOrders.length > 0 ? t("dash.overview.reviewHint") : t("dash.overview.noHeld")}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs flex flex-col justify-between hover:shadow-xs transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-neutral-500">{t("dash.overview.revenueOf", { period: periodData.periodTitle })}</p>
              <p className="text-xl sm:text-2xl font-black text-neutral-900 mt-1">
                {rp(periodData.currentRevenue)}
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
              <p className="text-xs font-semibold text-neutral-500">{t("dash.overview.registeredUsers")}</p>
              <p className="text-xl sm:text-2xl font-black text-neutral-900 mt-1">
                {tn("dash.n.users", periodData.newUsersCount)}
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
                {tn("dash.n.totalTx", periodData.currentOrders.length)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab("analytics")}
              className="text-xs font-extrabold text-[#7d6aee] hover:underline flex items-center gap-1 cursor-pointer"
            >
              {t("dash.overview.viewTx")} <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

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
                      {rp(bar.revenue)} ({tn("dash.n.orderShort", bar.count)})
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
            <span>{t("dash.overview.periodLabel", { period: periodData.periodTitle })}</span>
            <span className="font-bold text-[#7d6aee]">
              {t("dash.overview.totalRevenue", { amount: rp(periodData.currentRevenue) })}
            </span>
          </div>
        </div>

        {/* Template Terpopuler Box */}
        <div className="bg-white rounded-2xl p-5 border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs flex flex-col justify-between">
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-neutral-900 pb-3 border-b border-neutral-100">
              {t("dash.overview.bestSellers", { period: periodData.periodTitle })}
            </h2>
            <div className="mt-4 space-y-3">
              {periodData.popularTemplates.length === 0 && (
                <p className="text-xs text-neutral-400 py-6 text-center">{t("dash.overview.noSales")}</p>
              )}
              {periodData.popularTemplates.slice(0, 3).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 p-2 rounded-xl hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {item.tpl.thumbnail ? (
                      <img
                        src={item.tpl.thumbnail}
                        alt={item.name}
                        className="size-10 rounded-lg object-cover border border-purple-100 shrink-0"
                      />
                    ) : (
                      <span className="size-10 rounded-lg bg-purple-50 border border-purple-100 shrink-0" />
                    )}
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
            onClick={() => onSelectTab("templates")}
            className="w-full mt-4 justify-center cursor-pointer"
          >
            {t("dash.overview.manageAll")}
          </Button>
        </div>
      </div>

      {/* Pesanan Terbaru yang Butuh Perhatian */}
      <div className="bg-white rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-neutral-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="font-extrabold text-sm sm:text-base text-neutral-900">
              {t("dash.overview.latest", { period: periodData.periodTitle })}
            </h2>
            <p className="text-xs text-neutral-400">
              {t("dash.overview.latestSub")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onSelectTab("finance")}
            className="text-xs font-extrabold text-[#7d6aee] hover:underline cursor-pointer"
          >
            {t("dash.overview.openFinance")}
          </button>
        </div>

        <DataTable
          columns={dashboardOrderColumns}
          data={periodData.currentOrders.length > 0 ? periodData.currentOrders.slice(0, 5) : ordersList.slice(0, 5)}
          emptyMessage={t("dash.overview.noOrders")}
        />
      </div>
    </div>
  );
};

export default OverviewPage;
