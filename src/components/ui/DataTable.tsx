import React, { useState, useMemo } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  sortable?: boolean;
  sortKey?: keyof T | ((item: T) => any);
  align?: "left" | "center" | "right";
  className?: string;
  headerClassName?: string;
  render?: (item: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  rowKey?: (item: T, index: number) => string | number;
  emptyMessage?: React.ReactNode;
  className?: string;
  tableClassName?: string;
  headerClassName?: string;
  rowClassName?: (item: T, index: number) => string;
  onRowClick?: (item: T) => void;
  defaultSortColumn?: string | null;
  defaultSortDirection?: "asc" | "desc" | null;
}

// Helper parser untuk tanggal teks format Indonesia (contoh: "14 Nov 2026", "11 Okt 2026, 14:20", "Sabtu, 24 Oktober 2026", "1 Jun 2026", "27 Agu 2025")
function parseIndonesianDate(dateStr: string): number | null {
  if (typeof dateStr !== "string") return null;
  const monthMap: Record<string, string> = {
    jan: "01", januari: "01",
    feb: "02", februari: "02",
    mar: "03", maret: "03",
    apr: "04", april: "04",
    mei: "05",
    jun: "06", juni: "06",
    jul: "07", juli: "07",
    agu: "08", agustus: "08",
    sep: "09", september: "09",
    okt: "10", oktober: "10",
    nov: "11", november: "11",
    des: "12", desember: "12",
  };

  const clean = dateStr.toLowerCase().replace(/[,]/g, " ").trim();
  const tokens = clean.split(/\s+/);

  // Look for 4-digit year
  const yearToken = tokens.find((t) => /^\d{4}$/.test(t));
  // Look for 1-2 digit day
  const dayToken = tokens.find((t) => t !== yearToken && /^\d{1,2}$/.test(t));
  // Look for month
  const monthToken = tokens.find((t) => monthMap[t] !== undefined);
  // Look for time HH:mm
  const timeToken = tokens.find((t) => /^\d{1,2}:\d{2}(:\d{2})?$/.test(t));

  if (dayToken && monthToken && yearToken) {
    const day = dayToken.padStart(2, "0");
    const month = monthMap[monthToken];
    const timeStr = timeToken ? (timeToken.length === 5 ? `T${timeToken}:00` : `T${timeToken}`) : "T00:00:00";
    const iso = `${yearToken}-${month}-${day}${timeStr}`;
    const t = Date.parse(iso);
    if (!isNaN(t)) return t;
  }

  const standard = Date.parse(dateStr);
  return isNaN(standard) ? null : standard;
}

export function DataTable<T>({
  columns,
  data,
  rowKey,
  emptyMessage = "Tidak ada data yang tersedia",
  className = "",
  tableClassName = "",
  headerClassName = "",
  rowClassName,
  onRowClick,
  defaultSortColumn = null,
  defaultSortDirection = null,
}: DataTableProps<T>) {
  // 3-state sorting: asc -> desc -> null (default)
  const [sortColumn, setSortColumn] = useState<string | null>(defaultSortColumn);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(
    defaultSortDirection
  );

  const handleColumnHeaderClick = (col: DataTableColumn<T>) => {
    if (!col.sortable) return;

    if (sortColumn !== col.key) {
      // Step 1: Kolom baru -> langsung Ascending
      setSortColumn(col.key);
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      // Step 2: Kolom sama, sebelumnya Asc -> Descending
      setSortDirection("desc");
    } else if (sortDirection === "desc") {
      // Step 3: Kolom sama, sebelumnya Desc -> Reset ke default
      setSortColumn(null);
      setSortDirection(null);
    } else {
      // Fallback
      setSortColumn(col.key);
      setSortDirection("asc");
    }
  };

  // Sorting data aktual
  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) {
      return data;
    }

    const activeCol = columns.find((c) => c.key === sortColumn);
    if (!activeCol) return data;

    const getValue = (item: T) => {
      if (typeof activeCol.sortKey === "function") {
        return activeCol.sortKey(item);
      }
      if (activeCol.sortKey) {
        return item[activeCol.sortKey];
      }
      return (item as any)[activeCol.key];
    };

    return [...data].sort((a, b) => {
      const valA = getValue(a);
      const valB = getValue(b);

      if (valA === valB) return 0;
      if (valA == null) return 1;
      if (valB == null) return -1;

      // Handle Dates
      if (typeof valA === "string" && typeof valB === "string") {
        const dateA = parseIndonesianDate(valA);
        const dateB = parseIndonesianDate(valB);
        if (dateA !== null && dateB !== null) {
          return sortDirection === "asc" ? dateA - dateB : dateB - dateA;
        }
      }

      // Handle Numbers
      if (typeof valA === "number" && typeof valB === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }

      // Handle Strings with Indonesian locale
      const strA = String(valA);
      const strB = String(valB);
      const comparison = strA.localeCompare(strB, "id", {
        numeric: true,
        sensitivity: "base",
      });

      return sortDirection === "asc" ? comparison : -comparison;
    });
  }, [data, columns, sortColumn, sortDirection]);

  return (
    <div
      className={`bg-white rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs overflow-hidden ${className}`}
    >
      <div className="overflow-x-auto">
        <table className={`w-full text-left text-xs sm:text-sm ${tableClassName}`}>
          <thead
            className={`bg-neutral-50/70 text-neutral-500 font-semibold border-b border-neutral-200/80 text-[11px] uppercase tracking-wider select-none ${headerClassName}`}
          >
            <tr>
              {columns.map((col) => {
                const isSorted = sortColumn === col.key && sortDirection !== null;
                const alignClass =
                  col.align === "center"
                    ? "text-center"
                    : col.align === "right"
                    ? "text-right"
                    : "text-left";

                return (
                  <th
                    key={col.key}
                    scope="col"
                    onClick={() => handleColumnHeaderClick(col)}
                    className={`py-3 px-4 ${alignClass} ${
                      col.sortable
                        ? "cursor-pointer hover:bg-neutral-100/70 transition-colors group"
                        : ""
                    } ${col.headerClassName || ""}`}
                  >
                    <div
                      className={`inline-flex items-center gap-1.5 ${
                        col.align === "right"
                          ? "justify-end"
                          : col.align === "center"
                          ? "justify-center"
                          : "justify-start"
                      }`}
                    >
                      <span>{col.header}</span>
                      {col.sortable && (
                        <span className="inline-flex shrink-0">
                          {isSorted ? (
                            sortDirection === "asc" ? (
                              <ArrowUp className="w-3.5 h-3.5 text-[#7d6aee] stroke-[2.5]" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-[#7d6aee] stroke-[2.5]" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-300 group-hover:text-neutral-500 transition-colors" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {sortedData.length > 0 ? (
              sortedData.map((item, index) => {
                const k = rowKey ? rowKey(item, index) : (item as any).id ?? index;
                const customRowClass = rowClassName ? rowClassName(item, index) : "";

                return (
                  <tr
                    key={k}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={`hover:bg-neutral-50/60 transition-colors ${
                      onRowClick ? "cursor-pointer" : ""
                    } ${customRowClass}`}
                  >
                    {columns.map((col) => {
                      const alignClass =
                        col.align === "center"
                          ? "text-center"
                          : col.align === "right"
                          ? "text-right"
                          : "text-left";

                      return (
                        <td
                          key={col.key}
                          className={`py-3 px-4 ${alignClass} ${col.className || ""}`}
                        >
                          {col.render
                            ? col.render(item, index)
                            : (item as any)[col.key]}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="py-10 text-center text-neutral-400 text-xs sm:text-sm font-medium"
                >
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
