import React from "react";
import { Search } from "lucide-react";
import { DataTable, DataTableColumn } from "@/components/ui/DataTable";
import { AdminInvitationItem } from "./types";

export interface InvitationsPageProps {
  invitationsList: AdminInvitationItem[];
  invitationColumns: DataTableColumn<AdminInvitationItem>[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const InvitationsPage: React.FC<InvitationsPageProps> = ({
  invitationsList,
  invitationColumns,
  searchQuery,
  setSearchQuery,
}) => {
  const filtered = invitationsList.filter(
    (inv) =>
      inv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.groom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.bride.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn md:animate-none">
      {/* Search Bar & Total Counter di atas tabel */}
      <div className="bg-white p-4 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari acara atau pasangan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-neutral-200 border-b-[2px] border-b-neutral-300 focus:outline-none focus:border-[#7d6aee] focus:border-b-[#7d6aee]"
          />
        </div>

        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 border-b-[2px] border-b-emerald-300 shadow-2xs self-start sm:self-auto">
          Total: <strong className="text-neutral-900">{filtered.length} Undangan Online</strong>
        </span>
      </div>

      {/* Invitations Table via Shared DataTable */}
      <DataTable
        columns={invitationColumns}
        data={filtered}
        emptyMessage="Undangan tidak ditemukan."
      />
    </div>
  );
};

export default InvitationsPage;
