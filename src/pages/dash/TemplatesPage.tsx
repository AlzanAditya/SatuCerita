import React from "react";
import { Plus } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import { AdminTemplateItem } from "./types";

export interface TemplatesPageProps {
  templatesList: AdminTemplateItem[];
  templateColumns: DataTableColumn<AdminTemplateItem>[];
  onOpenAddModal: () => void;
}

export const TemplatesPage: React.FC<TemplatesPageProps> = ({
  templatesList,
  templateColumns,
  onOpenAddModal,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn md:animate-none">
      <div className="flex items-center justify-end sm:hidden">
        <button
          type="button"
          onClick={onOpenAddModal}
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
  );
};

export default TemplatesPage;
