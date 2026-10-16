import React from "react";
import { Search, Download } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import { AdminUserData } from "./types";

export interface UsersPageProps {
  usersList: AdminUserData[];
  userColumns: DataTableColumn<AdminUserData>[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  showToast?: (msg: string) => void;
}

export const UsersPage: React.FC<UsersPageProps> = ({
  usersList,
  userColumns,
  searchQuery,
  setSearchQuery,
  showToast,
}) => {
  return (
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
            onClick={() => showToast && showToast("Ekspor data pengguna berhasil!")}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-neutral-200 border-b-[3px] border-b-neutral-300/80 hover:bg-neutral-50 text-xs font-extrabold text-neutral-700 shadow-2xs active:scale-[0.99] active:border-b-[2px] transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor CSV</span>
          </button>
        </div>
      </div>

      {/* Users Data Table */}
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
  );
};

export default UsersPage;
