import React, { useState, useEffect } from 'react';
import { 
  Ship, 
  Calendar, 
  Download, 
  Search, 
  Filter, 
  Clock, 
  User, 
  Layers,
  ArrowUpDown,
  HardHat
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { attendanceDb } from '../../services/attendanceDb';
import { projectDb } from '../../services/projectDb';
import { ProjectCalcRow } from '../../types/attendance';
import { ShipProject } from '../../types/project';
import { AppView } from '../../types/navigation';
import { AttendanceNavTabs } from '../../components/attendance/AttendanceNavTabs';

interface ProjectCalculationPageProps {
  onNavigate?: (view: AppView) => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const ProjectCalculationPage: React.FC<ProjectCalculationPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { language } = useTheme();

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedProject, setSelectedProject] = useState<string>('ALL');
  const [projects, setProjects] = useState<ShipProject[]>([]);
  const [rows, setRows] = useState<ProjectCalcRow[]>([]);
  const [search, setSearch] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const loadData = () => {
    const projs = projectDb.getProjects();
    setProjects(projs);
    const data = attendanceDb.getProjectCalcRows(selectedYear, selectedMonth, selectedProject);
    setRows(data);
  };

  useEffect(() => {
    loadData();
  }, [selectedYear, selectedMonth, selectedProject]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const blob = await attendanceDb.exportProjectCalcToExcel(
        filtered,
        selectedYear,
        selectedMonth,
        selectedProject
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KALKULASI_PROYEK_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const filtered = rows.filter((r) =>
    r.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    r.employeeId.toLowerCase().includes(search.toLowerCase()) ||
    r.namaKapal.toLowerCase().includes(search.toLowerCase()) ||
    r.tanggal.includes(search)
  );

  const totalJamKeseluruhan = filtered.reduce((acc, curr) => acc + curr.totalJam, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Navigation Tabs */}
        {onNavigate && (
          <AttendanceNavTabs currentView="attendance-project-calc" onNavigate={onNavigate} />
        )}

        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400 mb-1">
              <Ship className="w-4 h-4" />
              <span>Halaman Absensi / Sub Menu 5</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Kalkulasi Proyek
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Menampilkan jam kerja seluruh teknisi dan pekerja per kapal proyek, berdasarkan hasil entri data Kalkulasi Waktu.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter 1: Kapal / Proyek */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <Ship className="w-3.5 h-3.5 text-teal-500 shrink-0" />
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="bg-transparent text-xs font-bold focus:outline-hidden text-slate-800 dark:text-slate-200 max-w-[190px]"
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

            {/* Filter 2: Bulan */}
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

            {/* Filter 3: Tahun */}
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

            {/* Export Excel */}
            <button
              onClick={handleExport}
              disabled={isExporting || filtered.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Mengekspor...' : 'Ekspor Excel'}</span>
            </button>
          </div>
        </div>

        {/* Top Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Jam Terdata</span>
              <p className="text-xl font-black font-mono text-teal-600 dark:text-teal-400 mt-0.5">
                {totalJamKeseluruhan} <span className="text-xs font-normal text-slate-400">jam</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Baris Penugasan</span>
              <p className="text-xl font-black font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                {filtered.length} <span className="text-xs font-normal text-slate-400">entri</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-400">Periode Evaluasi</span>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100 mt-0.5">
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Log Jam Kerja Tenaga Kerja Kapal
              </h2>
              <p className="text-[11px] text-slate-500">
                Data sinkron secara real-time dari lembar Kalkulasi Waktu masing-masing teknisi
              </p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Cari karyawan, kapal, tanggal..."
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
                  <th className="py-2.5 px-3">Tanggal</th>
                  <th className="py-2.5 px-3">ID Karyawan</th>
                  <th className="py-2.5 px-3">Nama Karyawan</th>
                  <th className="py-2.5 px-3 text-center">Shift Kerja</th>
                  <th className="py-2.5 px-3">Nama Kapal (Beserta Kode)</th>
                  <th className="py-2.5 px-3 text-right">Total Jam</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Tidak ada data jam kerja proyek yang cocok dengan filter {MONTH_NAMES[selectedMonth - 1]} {selectedYear}. Pastikan baris pada Kalkulasi Waktu telah diisi Kehadiran = HADIR dan Kapal Proyek terpilih.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600 dark:text-slate-300">
                        {item.tanggal}
                      </td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {item.employeeId}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                        {item.employeeName}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                          {item.shiftKerja}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-bold text-teal-700 dark:text-teal-300">
                        <span className="flex items-center gap-1.5">
                          <Ship className="w-3.5 h-3.5 text-teal-500" />
                          <span>{item.namaKapal}</span>
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-black font-mono text-slate-900 dark:text-white">
                        <span className="px-2 py-0.5 rounded-md bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-300">
                          {item.totalJam} jam
                        </span>
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
