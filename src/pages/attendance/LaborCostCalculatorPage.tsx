import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Calendar, 
  Ship, 
  Download, 
  Search, 
  Clock, 
  Users, 
  TrendingUp, 
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRBAC } from '../../hooks/useRBAC';
import { attendanceDb, formatIDR } from '../../services/attendanceDb';
import { projectDb } from '../../services/projectDb';
import { ProjectWorkerCostRow } from '../../types/attendance';
import { ShipProject } from '../../types/project';
import { AppView } from '../../types/navigation';
import { AttendanceNavTabs } from '../../components/attendance/AttendanceNavTabs';

interface LaborCostCalculatorPageProps {
  onNavigate?: (view: AppView) => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const LaborCostCalculatorPage: React.FC<LaborCostCalculatorPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { language } = useTheme();
  const rbac = useRBAC('attendance-labor-cost');

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [projects, setProjects] = useState<ShipProject[]>([]);
  const [workerCosts, setWorkerCosts] = useState<ProjectWorkerCostRow[]>([]);
  const [search, setSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const loadData = () => {
    const projs = projectDb.getProjects();
    setProjects(projs);
    const data = attendanceDb.getProjectWorkerCosts(selectedYear, selectedMonth, selectedProject);
    setWorkerCosts(data);
  };

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedMonth, selectedProject]);

  const handleExport = async () => {
    if (!rbac.canDownload) {
      alert('Akses Ditolak: Anda tidak memiliki izin untuk mengunduh rekap biaya pekerja.');
      return;
    }
    try {
      setIsExporting(true);
      const blob = await attendanceDb.exportProjectWorkerCostsToExcel(
        filtered,
        selectedYear,
        selectedMonth
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BIAYA_PEKERJA_PROYEK_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const filtered = workerCosts.filter((row) =>
    row.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    row.employeeId.toLowerCase().includes(search.toLowerCase()) ||
    row.proyek.toLowerCase().includes(search.toLowerCase()) ||
    row.bulan.toLowerCase().includes(search.toLowerCase())
  );

  const totalJam = filtered.reduce((acc, curr) => acc + curr.totalJam, 0);
  const totalHari = filtered.reduce((acc, curr) => acc + curr.totalHari, 0);
  const totalBiayaUpah = filtered.reduce((acc, curr) => acc + curr.totalUpah, 0);

  if (!rbac.canAccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-3xl p-8 text-center shadow-xl">
          <DollarSign className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Akses Dibatasi</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Akun Anda tidak memiliki izin untuk mengakses modul <strong>Biaya Pekerja Proyek</strong>. Hubungi Administrator atau Creator untuk memperbarui matriks izin pada halaman Izin Akses Pengguna.
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
          <AttendanceNavTabs currentView="attendance-labor-cost" onNavigate={onNavigate} />
        )}

        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-rose-600 dark:text-rose-400 mb-1">
              <DollarSign className="w-4 h-4" />
              <span>Halaman Absensi / Sub Menu 7</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Biaya Pekerja Proyek Kapal
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Menampilkan total jam kerja, hari kerja, dan akumulasi biaya upah para pekerja untuk pekerjaan kapal/proyek hingga selesai.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter: Bulan */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
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

            {/* Filter: Proyek */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <Ship className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="bg-transparent text-xs font-bold focus:outline-hidden text-slate-800 dark:text-slate-200 max-w-[210px]"
              >
                <option value="ALL">Semua Kapal / Proyek</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.shipName}>
                    {p.shipName}
                  </option>
                ))}
                <option value="TB SAMUDERA PERKASA VIII">TB SAMUDERA PERKASA VIII</option>
              </select>
            </div>

            {/* Action: Export to Excel */}
            {rbac.canDownload && (
              <button
                onClick={handleExport}
                disabled={isExporting || filtered.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Mengekspor...' : 'Ekspor Excel'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Jam Pekerja</span>
              <p className="text-xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                {totalJam} <span className="text-xs font-normal text-slate-400">jam</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Hari Kerja Proyek</span>
              <p className="text-xl font-black font-mono text-amber-600 dark:text-amber-400 mt-0.5">
                {totalHari} <span className="text-xs font-normal text-slate-400">hari aktif</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-rose-600 text-white shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-rose-100">Total Biaya Tenaga Kerja (Upah + TJ)</span>
              <p className="text-xl font-black font-mono mt-0.5 text-white truncate">
                {formatIDR(totalBiayaUpah)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-rose-500/30 text-white flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Rincian Biaya Para Pekerja per Proyek
              </h2>
              <p className="text-[11px] text-slate-500">
                1. Bulan • 2. Proyek • 3. Nama Karyawan (beserta ID) • 4. Total Jam • 5. Total Hari • 6. Total Upah
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari pekerja, proyek, bulan..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">No</th>
                  <th className="py-2.5 px-3">1. Bulan</th>
                  <th className="py-2.5 px-3">2. Proyek</th>
                  <th className="py-2.5 px-3">3. Nama Karyawan (Beserta ID)</th>
                  <th className="py-2.5 px-3 text-center">4. Total Jam</th>
                  <th className="py-2.5 px-3 text-center">5. Total Hari</th>
                  <th className="py-2.5 px-3 text-right">6. Total Biaya Upah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada data biaya pekerja yang cocok dengan filter {MONTH_NAMES[selectedMonth - 1]} {selectedYear}.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">
                        {item.bulan}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-teal-700 dark:text-teal-400">
                        <span className="flex items-center gap-1.5">
                          <Ship className="w-3.5 h-3.5 text-teal-500 shrink-0" />
                          <span>{item.proyek}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {item.employeeName}
                        </span>{' '}
                        <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-semibold">
                          ({item.employeeId})
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-black font-mono text-slate-800 dark:text-slate-100">
                        <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                          {item.totalJam} jam
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-amber-700 dark:text-amber-400">
                        {item.totalHari} hari
                      </td>
                      <td className="py-2.5 px-3 text-right font-black font-mono text-rose-600 dark:text-rose-400 text-sm">
                        {formatIDR(item.totalUpah)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  );
};
