import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Calendar, 
  Download, 
  Search, 
  DollarSign, 
  Clock, 
  Users, 
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRBAC } from '../../hooks/useRBAC';
import { attendanceDb, formatIDR, getDaysInMonth } from '../../services/attendanceDb';
import { EmployeeMonthSummaryMatrix } from '../../types/attendance';
import { AppView } from '../../types/navigation';
import { AttendanceNavTabs } from '../../components/attendance/AttendanceNavTabs';

interface AttendanceSummaryPageProps {
  onNavigate?: (view: AppView) => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const AttendanceSummaryPage: React.FC<AttendanceSummaryPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { language } = useTheme();
  const rbac = useRBAC('attendance-summary');

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [matrixData, setMatrixData] = useState<EmployeeMonthSummaryMatrix[]>([]);
  const [search, setSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const daysCount = getDaysInMonth(selectedYear, selectedMonth);

  const loadData = () => {
    const data = attendanceDb.getSummaryMatrix(selectedYear, selectedMonth);
    setMatrixData(data);
  };

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedMonth]);

  const handleExport = async () => {
    if (!rbac.canDownload) {
      alert('Akses Ditolak: Anda tidak memiliki izin untuk mengunduh rekap matrix.');
      return;
    }
    try {
      setIsExporting(true);
      const blob = await attendanceDb.exportSummaryMatrixToExcel(filtered, selectedYear, selectedMonth);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `SUMMARY_ABSENSI_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const filtered = matrixData.filter((item) =>
    item.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    item.employeeId.toLowerCase().includes(search.toLowerCase()) ||
    item.position.toLowerCase().includes(search.toLowerCase())
  );

  const grandTotalHours = filtered.reduce((sum, item) => sum + item.totalJam, 0);
  const grandTotalWage = filtered.reduce((sum, item) => sum + item.totalUpah, 0);
  const grandTotalOverall = filtered.reduce((sum, item) => sum + item.totalKeseluruhan, 0);

  if (!rbac.canAccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-3xl p-8 text-center shadow-xl">
          <Table className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Akses Dibatasi</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Akun Anda tidak memiliki izin untuk mengakses modul <strong>Summary Jam Kerja & Upah</strong>. Hubungi Administrator atau Creator untuk memperbarui matriks izin pada halaman Izin Akses Pengguna.
          </p>
          {onNavigate && (
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-5 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold hover:opacity-90 transition"
            >
              Kembali ke Dashboard
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Tabs */}
        {onNavigate && (
          <AttendanceNavTabs currentView="attendance-summary" onNavigate={onNavigate} />
        )}

        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-sky-600 dark:text-sky-400 mb-1">
              <Table className="w-4 h-4" />
              <span>Halaman Absensi / Sub Menu 6</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Summary Jam Kerja & Upah Bulanan
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Tampilan matriks lembar kerja Excel menampilkan jam kerja per tanggal (1-{daysCount}) beserta rekapitulasi upah, makan, transport, gouging, dan total keseluruhan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter 1: Bulan */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <Calendar className="w-3.5 h-3.5 text-sky-500 shrink-0" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-transparent text-xs font-bold focus:outline-hidden text-slate-800 dark:text-slate-200"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx} value={idx + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter 2: Tahun */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-transparent text-xs font-bold focus:outline-hidden text-slate-800 dark:text-slate-200"
              >
                {[2024, 2025, 2026, 2027].map((yr) => (
                  <option key={yr} value={yr}>
                    {yr}
                  </option>
                ))}
              </select>
            </div>

            {/* Action: Export to Excel */}
            {rbac.canDownload && (
              <button
                onClick={handleExport}
                disabled={isExporting || filtered.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Mengekspor...' : 'Ekspor Matrix Excel'}</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Jam Akumulasi</span>
              <p className="text-xl font-black font-mono text-sky-600 dark:text-sky-400 mt-0.5">
                {grandTotalHours} <span className="text-xs font-normal text-slate-400">jam</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Upah Jam Kerja</span>
              <p className="text-xl font-black font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                {formatIDR(grandTotalWage)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-600 text-white shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-emerald-100">Total Keseluruhan (Upah + Tunjangan)</span>
              <p className="text-xl font-black font-mono mt-0.5 text-white">
                {formatIDR(grandTotalOverall)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/30 text-white flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Matrix Spreadsheet Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Matriks Jam Kerja Harian & Upah ({MONTH_NAMES[selectedMonth - 1]} {selectedYear})
              </h2>
              <p className="text-[11px] text-slate-500">
                Poin 1: ID & Nama • Poin 2: Barisan Tanggal • Poin 3: Jam per Hari • Poin 4: Total Jam • Poin 5: Total Upah • Poin 6-8: Tunjangan • Poin 9: Total Keseluruhan
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari nama, ID, jabatan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 max-h-[600px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase text-[10px] shadow-xs">
                <tr>
                  {/* Point 1: ID Karyawan dan Nama Karyawan (Pinned) */}
                  <th className="py-2.5 px-3 sticky left-0 z-30 bg-slate-200 dark:bg-slate-800 border-b border-r border-slate-300 dark:border-slate-700 min-w-[200px]">
                    1. ID & Nama Karyawan
                  </th>

                  {/* Point 2: Tanggal, berisi barisan setiap tanggal dalam waktu satu bulan */}
                  {Array.from({ length: daysCount }, (_, i) => i + 1).map((d) => {
                    const dayOfWeek = new Date(selectedYear, selectedMonth - 1, d).getDay();
                    const isSat = dayOfWeek === 6;
                    const isSun = dayOfWeek === 0;

                    return (
                      <th
                        key={d}
                        className={`py-2 px-1 text-center border-b border-r border-slate-200 dark:border-slate-700 min-w-[38px] ${
                          isSat
                            ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 font-extrabold'
                            : isSun
                            ? 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 font-extrabold'
                            : ''
                        }`}
                        title={`Tanggal ${d} ${MONTH_NAMES[selectedMonth - 1]}`}
                      >
                        {d}
                      </th>
                    );
                  })}

                  {/* Point 4: Total Jam */}
                  <th className="py-2.5 px-2.5 text-center border-b border-r border-slate-200 dark:border-slate-700 min-w-[80px] bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300">
                    4. Total Jam
                  </th>

                  {/* Point 5: Total Upah */}
                  <th className="py-2.5 px-3 text-right border-b border-r border-slate-200 dark:border-slate-700 min-w-[120px]">
                    5. Total Upah
                  </th>

                  {/* Point 6: Tunjangan Makan */}
                  <th className="py-2.5 px-2.5 text-right border-b border-r border-slate-200 dark:border-slate-700 min-w-[105px]">
                    6. Tj. Makan
                  </th>

                  {/* Point 7: Tunjangan Transportasi */}
                  <th className="py-2.5 px-2.5 text-right border-b border-r border-slate-200 dark:border-slate-700 min-w-[105px]">
                    7. Tj. Transport
                  </th>

                  {/* Point 8: Tunjangan Gouging */}
                  <th className="py-2.5 px-2.5 text-right border-b border-r border-slate-200 dark:border-slate-700 min-w-[105px]">
                    8. Tj. Gouging
                  </th>

                  {/* Point 9: Total Keseluruhan */}
                  <th className="py-2.5 px-3 text-right border-b border-slate-200 dark:border-slate-700 min-w-[140px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-black">
                    9. Total Keseluruhan
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filtered.map((item) => (
                  <tr key={item.employeeId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    
                    {/* Point 1: ID & Nama (Pinned) */}
                    <td className="py-2 px-3 sticky left-0 z-10 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 font-semibold shadow-xs">
                      <div className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400">
                        {item.employeeId}
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {item.employeeName}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {item.position}
                      </div>
                    </td>

                    {/* Point 3: Total Jam per tanggal/hari (di bawah tanggal) */}
                    {Array.from({ length: daysCount }, (_, i) => i + 1).map((d) => {
                      const dayOfWeek = new Date(selectedYear, selectedMonth - 1, d).getDay();
                      const isSat = dayOfWeek === 6;
                      const isSun = dayOfWeek === 0;
                      const val = item.dailyHours[d] || 0;

                      return (
                        <td
                          key={d}
                          className={`py-2 px-1 text-center font-mono text-[11px] border-r border-slate-200/80 dark:border-slate-800 ${
                            isSat
                              ? 'bg-blue-50/40 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200 font-bold'
                              : isSun
                              ? 'bg-rose-50/40 dark:bg-rose-950/20 text-rose-900 dark:text-rose-200 font-bold'
                              : ''
                          }`}
                        >
                          {val > 0 ? (
                            <span className="font-bold text-slate-800 dark:text-slate-100">
                              {val}
                            </span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-700">-</span>
                          )}
                        </td>
                      );
                    })}

                    {/* Point 4: Total Jam Keseluruhan */}
                    <td className="py-2 px-2.5 text-center font-black font-mono border-r border-slate-200 dark:border-slate-800 text-blue-700 dark:text-blue-300 bg-blue-50/30 dark:bg-blue-950/20">
                      {item.totalJam}
                    </td>

                    {/* Point 5: Total Upah */}
                    <td className="py-2 px-3 text-right font-mono font-bold border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200">
                      {formatIDR(item.totalUpah)}
                    </td>

                    {/* Point 6: Tunjangan Makan */}
                    <td className="py-2 px-2.5 text-right font-mono text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                      {item.totalTunjanganMakan > 0 ? formatIDR(item.totalTunjanganMakan) : '-'}
                    </td>

                    {/* Point 7: Tunjangan Transportasi */}
                    <td className="py-2 px-2.5 text-right font-mono text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                      {item.totalTunjanganTransport > 0 ? formatIDR(item.totalTunjanganTransport) : '-'}
                    </td>

                    {/* Point 8: Tunjangan Gouging */}
                    <td className="py-2 px-2.5 text-right font-mono text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-800">
                      {item.totalTunjanganGouging > 0 ? formatIDR(item.totalTunjanganGouging) : '-'}
                    </td>

                    {/* Point 9: Total Keseluruhan (Poin 5 + 6 + 7 + 8) */}
                    <td className="py-2 px-3 text-right font-black font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50/30 dark:bg-emerald-950/20">
                      {formatIDR(item.totalKeseluruhan)}
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  );
};
