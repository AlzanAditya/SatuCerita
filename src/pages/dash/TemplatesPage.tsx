import React from "react";
import { Plus } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import { AdminTemplateItem } from "./types";
import { useT } from "@/i18n";

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
  const { t, tn } = useT();
  return (
    <div className="space-y-6 animate-fadeIn md:animate-none">
      <div className="flex items-center justify-end sm:hidden">
        <button
          type="button"
          onClick={onOpenAddModal}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#7d6aee] hover:bg-[#6b58e0] text-white text-xs font-extrabold border border-[#6b58e0] border-b-[3px] border-b-[#513ecb] shadow-2xs hover:shadow-xs active:scale-[0.98] active:border-b-[2px] active:translate-y-[1px] transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{t("dash.addTpl.title")}</span>
        </button>
      </div>

      {/* Template Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
          <span className="text-xs text-neutral-400 font-semibold">{t("dash.templates.totalActive")}</span>
          <p className="text-xl font-black text-neutral-900 mt-1">{tn("dash.n.designs", templatesList.length)}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
          <span className="text-xs text-neutral-400 font-semibold">{t("dash.templates.totalInvitations")}</span>
          <p className="text-xl font-black text-neutral-900 mt-1">
            {tn("dash.n.invitations", templatesList.reduce((acc, tpl) => acc + tpl.totalUsers, 0))}
          </p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
          <span className="text-xs text-neutral-400 font-semibold">{t("dash.templates.accRevenue")}</span>
          <p className="text-xl font-black text-emerald-600 mt-1">
            {t("dash.templates.revenueValue", { value: (templatesList.reduce((acc, tpl) => acc + tpl.totalRevenue, 0) / 1000000).toFixed(1) })}
          </p>
        </div>
      </div>

      {/* Templates Data Table via Shared DataTable */}
      <DataTable
        columns={templateColumns}
        data={templatesList}
        emptyMessage={t("dash.templates.empty")}
      />
    </div>
  );
};

export default TemplatesPage;
