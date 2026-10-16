import React, { useState } from "react";

export interface AnalyticsPageProps {
  timeRange?: "7d" | "30d" | "1y";
  setTimeRange?: (range: "7d" | "30d" | "1y") => void;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  timeRange: propTimeRange,
  setTimeRange: propSetTimeRange,
}) => {
  const [internalTimeRange, setInternalTimeRange] = useState<"7d" | "30d" | "1y">("30d");
  const timeRange = propTimeRange ?? internalTimeRange;
  const setTimeRange = propSetTimeRange ?? setInternalTimeRange;

  return (
    <div className="space-y-6 animate-fadeIn md:animate-none">
      {/* Filter Waktu */}
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-purple-100 border-b-[2px] border-b-purple-200/70 shadow-2xs select-none">
          <button
            type="button"
            onClick={() => setTimeRange("7d")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              timeRange === "7d" ? "bg-[#7d6aee] text-white shadow-2xs" : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            7 Hari
          </button>
          <button
            type="button"
            onClick={() => setTimeRange("30d")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              timeRange === "30d" ? "bg-[#7d6aee] text-white shadow-2xs" : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            30 Hari
          </button>
          <button
            type="button"
            onClick={() => setTimeRange("1y")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              timeRange === "1y" ? "bg-[#7d6aee] text-white shadow-2xs" : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            1 Tahun
          </button>
        </div>
      </div>

      {/* Metric KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-neutral-400">Total Transaksi Selesai</p>
          <p className="text-2xl font-black text-neutral-900 mt-1">142 Pesanan</p>
          <span className="text-xs font-bold text-emerald-600 mt-2 block">+24% vs periode lalu</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-neutral-400">Rata-rata Nilai Transaksi (AOV)</p>
          <p className="text-2xl font-black text-neutral-900 mt-1">Rp 148.500</p>
          <span className="text-xs font-bold text-neutral-500 mt-2 block">Dominan paket Gold & Platinum</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
          <p className="text-xs font-semibold text-neutral-400">Tingkat Konversi Pembayaran</p>
          <p className="text-2xl font-black text-emerald-600 mt-1">94.2%</p>
          <span className="text-xs font-bold text-emerald-600 mt-2 block">QRIS terbukti paling cepat</span>
        </div>
      </div>

      {/* Big Chart Section */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-neutral-900">
              Grafik Volume Pembelian Harian
            </h2>
            <p className="text-xs text-neutral-400">Jumlah pemesanan dan checkout per tanggal</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold text-neutral-500">
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-[#7d6aee]" /> Lunas
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-purple-200" /> Pending
            </span>
          </div>
        </div>

        {/* Chart Visual */}
        <div className="h-64 flex items-end gap-2 sm:gap-4 pt-8 pb-2 px-2 border-b border-neutral-100">
          {[
            { day: "Sen", paid: 12, pending: 2 },
            { day: "Sel", paid: 18, pending: 3 },
            { day: "Rab", paid: 15, pending: 1 },
            { day: "Kam", paid: 24, pending: 4 },
            { day: "Jum", paid: 30, pending: 2 },
            { day: "Sab", paid: 42, pending: 5 },
            { day: "Min", paid: 38, pending: 3 },
          ].map((item, idx) => {
            const maxH = 50;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="relative w-full flex flex-col items-center justify-end h-full">
                  <span className="absolute -top-7 hidden group-hover:block bg-neutral-900 text-white text-[10px] font-bold py-0.5 px-2 rounded shadow whitespace-nowrap">
                    {item.paid} Lunas / {item.pending} Pending
                  </span>
                  <div
                    style={{ height: `${(item.pending / maxH) * 100}%` }}
                    className="w-full max-w-[32px] bg-purple-200 rounded-t-sm"
                  />
                  <div
                    style={{ height: `${(item.paid / maxH) * 100}%` }}
                    className="w-full max-w-[32px] bg-[#7d6aee] rounded-t-sm"
                  />
                </div>
                <span className="text-xs font-bold text-neutral-600">{item.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Breakdown Metode Pembayaran */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
          <h3 className="text-sm font-extrabold text-neutral-900 mb-4">
            Metode Pembayaran Paling Digunakan
          </h3>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-bold text-neutral-700 mb-1">
                <span>QRIS Instant (GoPay/ShopeePay/BCA)</span>
                <span>58% (82 Transaksi)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                <div className="bg-[#7d6aee] h-full rounded-full" style={{ width: "58%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-neutral-700 mb-1">
                <span>BCA Virtual Account</span>
                <span>24% (34 Transaksi)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: "24%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-neutral-700 mb-1">
                <span>Mandiri Virtual Account</span>
                <span>12% (17 Transaksi)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                <div className="bg-blue-400 h-full rounded-full" style={{ width: "12%" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold text-neutral-700 mb-1">
                <span>E-Wallet GoPay Direct</span>
                <span>6% (9 Transaksi)</span>
              </div>
              <div className="w-full h-2 rounded-full bg-neutral-100 overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: "6%" }} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-purple-100 border-b-[3px] border-b-purple-200/80 shadow-2xs">
          <h3 className="text-sm font-extrabold text-neutral-900 mb-4">
            Kategori Undangan Paling Laris
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50/50 border border-purple-100">
              <span className="text-xs font-bold text-neutral-800">Pernikahan (Wedding)</span>
              <span className="text-xs font-black text-[#7d6aee]">78% dari total pesanan</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
              <span className="text-xs font-bold text-neutral-800">Lamaran &amp; Tunangan</span>
              <span className="text-xs font-black text-neutral-700">14% dari total pesanan</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-50 border border-neutral-100">
              <span className="text-xs font-bold text-neutral-800">Khitanan &amp; Ulang Tahun</span>
              <span className="text-xs font-black text-neutral-700">8% dari total pesanan</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
