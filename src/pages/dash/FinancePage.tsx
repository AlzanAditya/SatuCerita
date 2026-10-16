import React from "react";
import { Receipt, Search } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import { AdminOrderItem } from "./types";

export interface FinancePageProps {
  ordersList: AdminOrderItem[];
  financeOrderColumns: DataTableColumn<AdminOrderItem>[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showToast?: (msg: string) => void;
}

export const FinancePage: React.FC<FinancePageProps> = ({
  ordersList,
  financeOrderColumns,
  searchQuery,
  setSearchQuery,
  showToast,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn md:animate-none">
      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={() => showToast && showToast("Laporan keuangan berhasil diunduh!")}
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
  );
};

export default FinancePage;
