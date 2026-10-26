import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  Calendar, 
  User, 
  Search, 
  Download, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  Ship, 
  HardHat, 
  Lock,
  Layers,
  Sparkles,
  RefreshCw,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRBAC } from '../../hooks/useRBAC';
import { attendanceDb, formatIDR, getDaysInMonth } from '../../services/attendanceDb';
import { employeeDb } from '../../services/employeeDb';
import { projectDb } from '../../services/projectDb';
import { 
  MonthlyTimeCalcSheet, 
  DailyTimeCalcRow, 
  MonthlyTimeCalcSummary, 
  RestDurationType, 
  CalcKehadiranType 
} from '../../types/attendance';
import { EmployeeRecord } from '../../types/employee';
import { ShipProject } from '../../types/project';
import { AppView } from '../../types/navigation';
import { AttendanceNavTabs } from '../../components/attendance/AttendanceNavTabs';

interface TimeCalculationPageProps {
  onNavigate?: (view: AppView) => void;
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const REST_OPTIONS: RestDurationType[] = [
  '0 mnt', '30 mnt', '1 jam', '1.30 jam', '2 jam', '2.30 jam', '3 jam', '3.30 jam', '4 jam'
];

export const TimeCalculationPage: React.FC<TimeCalculationPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { language } = useTheme();
  const rbac = useRBAC('attendance-time-calc');

  const now = new Date();
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [projects, setProjects] = useState<ShipProject[]>([]);

  // Selected Employee
  const [selectedEmpId, setSelectedEmpId] = useState<string>('EMP-001');
  const [activeSheet, setActiveSheet] = useState<MonthlyTimeCalcSheet | null>(null);
  const [summary, setSummary] = useState<MonthlyTimeCalcSummary | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const isPrivileged = rbac.isCreator || rbac.isAdmin;

  // Initialize data
  useEffect(() => {
    const allEmps = employeeDb.getEmployees();
    setEmployees(allEmps);
    const allProjs = projectDb.getProjects();
    setProjects(allProjs);

    // If non-privileged role (staff, karyawan), lock to current user's matching employee or default
    if (!isPrivileged && currentUser) {
      const match = allEmps.find(
        (e) => e.email?.toLowerCase() === currentUser.email?.toLowerCase() ||
               e.employeeId === currentUser.employeeId ||
               e.fullName.toLowerCase() === currentUser.fullName?.toLowerCase()
      );
      if (match) {
        setSelectedEmpId(match.employeeId);
      } else {
        setSelectedEmpId(allEmps[0]?.employeeId || 'EMP-004');
      }
    } else {
      if (!selectedEmpId && allEmps.length > 0) {
        setSelectedEmpId(allEmps[0].employeeId);
      }
    }
  }, [currentUser]);

  // Load sheet when employee, year, or month changes
  useEffect(() => {
    if (!selectedEmpId) return;
    const sheet = attendanceDb.getTimeCalcSheet(selectedEmpId, selectedYear, selectedMonth);
    setActiveSheet(sheet);
    refreshSummary(sheet);
  }, [selectedEmpId, selectedYear, selectedMonth]);

  const refreshSummary = (sheet: MonthlyTimeCalcSheet) => {
    const summ = attendanceDb.calculateMonthlySummary(
      sheet,
      currentUser?.role || 'karyawan',
      sheet.position
    );
    setSummary(summ);
  };

  const handleRowChange = (dayNumber: number, field: keyof DailyTimeCalcRow, value: any) => {
    if (!rbac.canEdit && !rbac.canCreate) return;
    if (!activeSheet) return;
    const updatedSheet = attendanceDb.updateTimeCalcRow(
      activeSheet.employeeId,
      activeSheet.year,
      activeSheet.month,
      dayNumber,
      { [field]: value }
    );
    setActiveSheet({ ...updatedSheet });
    refreshSummary(updatedSheet);
  };

  const handleSaveSheet = () => {
    if (!rbac.canEdit && !rbac.canCreate) {
      alert('Akses Ditolak: Anda tidak memiliki izin untuk menyimpan rekap kalkulasi waktu.');
      return;
    }
    if (!activeSheet) return;
    attendanceDb.saveTimeCalcSheet(activeSheet);
    setSaveSuccessMsg(`Rekapitulasi kerja ${activeSheet.employeeName} bulan ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} berhasil disimpan.`);
    setTimeout(() => setSaveSuccessMsg(null), 4000);
  };

  const handleExport = async () => {
    if (!rbac.canDownload) {
      alert('Akses Ditolak: Anda tidak memiliki izin untuk mengunduh rekap kalkulasi waktu.');
      return;
    }
    if (!activeSheet) return;
    try {
      setIsExporting(true);
      const blob = await attendanceDb.exportTimeCalcSheetToExcel(activeSheet);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `KALKULASI_WAKTU_${activeSheet.employeeId}_${MONTH_NAMES[selectedMonth - 1]}_${selectedYear}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const currentEmp = employees.find((e) => e.employeeId === selectedEmpId) || {
    employeeId: selectedEmpId,
    fullName: activeSheet?.employeeName || 'Karyawan',
    position: activeSheet?.position || 'Teknisi',
    wage: activeSheet?.wage || 50000,
    wageStatus: activeSheet?.wageStatus || 'Jam',
    mealAllowance: activeSheet?.mealAllowance || 45000,
    transportAllowance: activeSheet?.transportAllowance || 25000,
    gougingAllowance: activeSheet?.gougingAllowance || 0,
    department: activeSheet?.department || 'OPERASI',
  };

  if (!rbac.canAccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-3xl p-8 text-center shadow-xl">
          <Calculator className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Akses Dibatasi</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Akun Anda tidak memiliki izin untuk mengakses modul <strong>Kalkulasi Waktu Kerja</strong>. Hubungi Administrator atau Creator untuk memperbarui matriks izin pada halaman Izin Akses Pengguna.
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
          <AttendanceNavTabs currentView="attendance-time-calc" onNavigate={onNavigate} />
        )}

        {/* Page Header & Filter Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
              <Calculator className="w-4 h-4" />
              <span>Halaman Absensi / Sub Menu 4</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Kalkulasi Waktu (Rekap Jam Kerja & Upah Bulanan)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Rekapitulasi jam kerja harian, upah, tunjangan makan, transport, dan gouging per bulan dengan proteksi visual hari Sabtu (Biru) & Minggu (Merah).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter 1: Pilih Karyawan */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <User className="w-3.5 h-3.5 text-blue-500 shrink-0" />
              {isPrivileged ? (
                <select
                  value={selectedEmpId}
                  onChange={(e) => setSelectedEmpId(e.target.value)}
                  className="bg-transparent text-xs font-bold focus:outline-hidden text-slate-800 dark:text-slate-200 max-w-[190px]"
                >
                  {employees.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.employeeId} - {emp.fullName}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-200">
                  <span className="truncate max-w-[160px]">{currentEmp.fullName}</span>
                  <span title="Terkunci: Hanya melihat milik Anda">
                    <Lock className="w-3 h-3 text-slate-400" />
                  </span>
                </div>
              )}
            </div>

            {/* Filter 2: Bulan */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
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

            {/* Action Buttons */}
            {(rbac.canEdit || rbac.canCreate) && (
              <button
                onClick={handleSaveSheet}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                title="Simpan perubahan rekapitulasi waktu"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Simpan Rekap</span>
              </button>
            )}

            {rbac.canDownload && (
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isExporting ? 'Mengekspor...' : 'Ekspor Excel'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Non-privileged Notification Notice */}
        {!isPrivileged && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-xl flex items-center justify-between text-xs text-blue-800 dark:text-blue-300">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-500 shrink-0" />
              <span>
                <strong>Akses Karyawan:</strong> Sesuai aturan sistem, Anda hanya dapat melihat dan mengelola kalkulasi waktu milik Anda pribadi ({currentEmp.fullName}).
              </span>
            </div>
          </div>
        )}

        {saveSuccessMsg && (
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-bold text-emerald-800 dark:text-emerald-200 animate-in fade-in duration-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveSuccessMsg}</span>
          </div>
        )}

        {/* ================= BAGIAN 1: IDENTITAS KARYAWAN ================= */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                Bagian 1: Identitas Karyawan
              </h2>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
              Periode: {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            
            {/* ID Karyawan */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400">ID Karyawan</span>
              <p className="text-sm font-black font-mono text-blue-600 dark:text-blue-400 mt-0.5">
                {currentEmp.employeeId}
              </p>
            </div>

            {/* Nama Lengkap */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400">Nama Lengkap</span>
              <p className="text-sm font-black text-slate-900 dark:text-white mt-0.5 truncate">
                {currentEmp.fullName}
              </p>
            </div>

            {/* Jabatan */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400">Jabatan</span>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-0.5 truncate">
                {currentEmp.position}
              </p>
            </div>

            {/* Upah / Gaji */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[10px] font-bold uppercase text-slate-400">Upah / Gaji Acuan</span>
              <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatIDR(currentEmp.wage)} <span className="text-[10px] font-semibold text-slate-400">/ {currentEmp.wageStatus}</span>
              </p>
            </div>

          </div>

          {/* Reference Allowances Bar */}
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400">
            <span><strong>Tunjangan Master:</strong></span>
            <span>Makan: <strong className="text-slate-800 dark:text-slate-200">{formatIDR(currentEmp.mealAllowance)}</strong></span>
            <span>Transportasi: <strong className="text-slate-800 dark:text-slate-200">{formatIDR(currentEmp.transportAllowance)}</strong></span>
            <span>Gouging: <strong className="text-slate-800 dark:text-slate-200">{formatIDR(currentEmp.gougingAllowance)}</strong></span>
            <span className="text-slate-400 text-[10px]">(Otomatis terisi jika Kehadiran = HADIR)</span>
          </div>
        </div>

        {/* ================= BAGIAN 2: REKAP HARIAN (INLINE EDITABLE TABLE) ================= */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  Bagian 2: Rekap Harian ({MONTH_NAMES[selectedMonth - 1]} {selectedYear})
                </h2>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Baris hanya bisa diisi jika Kehadiran menjadi <span className="font-bold text-emerald-600">HADIR</span>. Hari Sabtu bertanda <span className="font-bold text-blue-600">Biru</span> dan Hari Minggu bertanda <span className="font-bold text-rose-600">Merah</span>.
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                <span>Sabtu (Biru)</span>
              </span>
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                <span className="w-2 h-2 rounded-full bg-rose-600" />
                <span>Minggu (Merah)</span>
              </span>
            </div>
          </div>

          {/* Real-time Inline Spreadsheet Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 max-h-[580px]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold uppercase text-[10px] shadow-xs">
                <tr>
                  <th className="py-2.5 px-2 text-center w-12 border-b border-r border-slate-200 dark:border-slate-700">Tgl</th>
                  <th className="py-2.5 px-3 w-28 border-b border-r border-slate-200 dark:border-slate-700">Hari</th>
                  <th className="py-2.5 px-2.5 w-28 border-b border-r border-slate-200 dark:border-slate-700">Kehadiran</th>
                  <th className="py-2.5 px-2 w-24 border-b border-r border-slate-200 dark:border-slate-700">Jam Masuk</th>
                  <th className="py-2.5 px-2 w-24 border-b border-r border-slate-200 dark:border-slate-700">Jam Keluar</th>
                  <th className="py-2.5 px-2 w-28 border-b border-r border-slate-200 dark:border-slate-700">Istirahat</th>
                  <th className="py-2.5 px-2 w-20 text-center border-b border-r border-slate-200 dark:border-slate-700">Jam Normal</th>
                  <th className="py-2.5 px-2 w-20 text-center border-b border-r border-slate-200 dark:border-slate-700">Jam Lembur</th>
                  <th className="py-2.5 px-2 w-20 text-center border-b border-r border-slate-200 dark:border-slate-700">Total Jam</th>
                  <th className="py-2.5 px-2.5 w-28 text-right border-b border-r border-slate-200 dark:border-slate-700">Tj. Makan</th>
                  <th className="py-2.5 px-2.5 w-28 text-right border-b border-r border-slate-200 dark:border-slate-700">Tj. Transport</th>
                  <th className="py-2.5 px-2 w-28 text-center border-b border-r border-slate-200 dark:border-slate-700">Gouging?</th>
                  <th className="py-2.5 px-3 min-w-[200px] border-b border-r border-slate-200 dark:border-slate-700">Nama Kapal (Proyek)</th>
                  <th className="py-2.5 px-3 w-32 text-right border-b border-slate-200 dark:border-slate-700">Total Upah</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {activeSheet?.rows.map((row) => {
                  const isHadir = row.kehadiran === 'HADIR';

                  // Visual color rule:
                  // "dengan hari sabtu berwarna Biru dan Minggu berwarna Merah"
                  let rowColorClass = '';
                  if (row.isSaturday) {
                    rowColorClass = 'bg-blue-50/70 dark:bg-blue-950/30 text-blue-950 dark:text-blue-100 font-bold';
                  } else if (row.isSunday) {
                    rowColorClass = 'bg-rose-50/70 dark:bg-rose-950/30 text-rose-950 dark:text-rose-100 font-bold';
                  } else {
                    rowColorClass = 'hover:bg-slate-50 dark:hover:bg-slate-800/40';
                  }

                  return (
                    <tr key={row.day} className={`transition-colors ${rowColorClass}`}>
                      
                      {/* Day Number */}
                      <td className="py-1.5 px-2 text-center font-bold font-mono border-r border-slate-200/80 dark:border-slate-800">
                        {row.day}
                      </td>

                      {/* Day Name */}
                      <td className="py-1.5 px-3 border-r border-slate-200/80 dark:border-slate-800">
                        <span className={row.isSaturday ? 'text-blue-600 dark:text-blue-400 font-extrabold' : row.isSunday ? 'text-rose-600 dark:text-rose-400 font-extrabold' : ''}>
                          {row.dayName}
                        </span>
                      </td>

                      {/* Kehadiran (HADIR, ALPHA, SAKIT, IZIN, '-') */}
                      <td className="py-1 px-2 border-r border-slate-200/80 dark:border-slate-800">
                        <select
                          value={row.kehadiran}
                          onChange={(e) => handleRowChange(row.day, 'kehadiran', e.target.value as CalcKehadiranType)}
                          className={`w-full px-2 py-1 rounded-lg text-xs font-black border focus:outline-hidden transition ${
                            row.kehadiran === 'HADIR'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : row.kehadiran === 'ALPHA'
                              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                              : row.kehadiran === 'SAKIT' || row.kehadiran === 'IZIN'
                              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                          }`}
                        >
                          <option value="-">- (Pilih)</option>
                          <option value="HADIR">HADIR</option>
                          <option value="ALPHA">ALPHA</option>
                          <option value="SAKIT">SAKIT</option>
                          <option value="IZIN">IZIN</option>
                        </select>
                      </td>

                      {/* Jam Masuk */}
                      <td className="py-1 px-1.5 border-r border-slate-200/80 dark:border-slate-800">
                        <input
                          type="text"
                          placeholder="07:30"
                          disabled={!isHadir}
                          value={row.jamMasuk}
                          onChange={(e) => handleRowChange(row.day, 'jamMasuk', e.target.value)}
                          className="w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:bg-slate-100 dark:disabled:bg-slate-800/40 disabled:text-slate-400 disabled:cursor-not-allowed focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        />
                      </td>

                      {/* Jam Keluar */}
                      <td className="py-1 px-1.5 border-r border-slate-200/80 dark:border-slate-800">
                        <input
                          type="text"
                          placeholder="15:30"
                          disabled={!isHadir}
                          value={row.jamKeluar}
                          onChange={(e) => handleRowChange(row.day, 'jamKeluar', e.target.value)}
                          className="w-full px-2 py-1 text-xs font-mono font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:bg-slate-100 dark:disabled:bg-slate-800/40 disabled:text-slate-400 disabled:cursor-not-allowed focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        />
                      </td>

                      {/* Istirahat */}
                      <td className="py-1 px-1.5 border-r border-slate-200/80 dark:border-slate-800">
                        <select
                          disabled={!isHadir}
                          value={row.istirahat}
                          onChange={(e) => handleRowChange(row.day, 'istirahat', e.target.value as RestDurationType)}
                          className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:bg-slate-100 dark:disabled:bg-slate-800/40 disabled:text-slate-400 disabled:cursor-not-allowed focus:outline-hidden"
                        >
                          {REST_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Jam Normal */}
                      <td className="py-1 px-1.5 border-r border-slate-200/80 dark:border-slate-800">
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="12"
                          disabled={!isHadir}
                          value={row.jamNormal || ''}
                          onChange={(e) => handleRowChange(row.day, 'jamNormal', parseFloat(e.target.value) || 0)}
                          className="w-full text-center px-1.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:bg-slate-100 dark:disabled:bg-slate-800/40 disabled:text-slate-400 disabled:cursor-not-allowed focus:outline-hidden focus:ring-1 focus:ring-blue-500"
                        />
                      </td>

                      {/* Jam Lembur */}
                      <td className="py-1 px-1.5 border-r border-slate-200/80 dark:border-slate-800">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max="12"
                          disabled={!isHadir}
                          value={row.jamLembur || ''}
                          onChange={(e) => handleRowChange(row.day, 'jamLembur', parseFloat(e.target.value) || 0)}
                          className="w-full text-center px-1.5 py-1 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:bg-slate-100 dark:disabled:bg-slate-800/40 disabled:text-slate-400 disabled:cursor-not-allowed focus:outline-hidden focus:ring-1 focus:ring-amber-500 text-amber-600 dark:text-amber-400"
                        />
                      </td>

                      {/* Total Jam */}
                      <td className="py-1 px-2 text-center font-black font-mono border-r border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-100">
                        {row.totalJam > 0 ? (
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300">
                            {row.totalJam}
                          </span>
                        ) : (
                          <span className="text-slate-400">0</span>
                        )}
                      </td>

                      {/* Tunjangan Makan */}
                      <td className="py-1 px-2.5 text-right font-mono text-slate-700 dark:text-slate-300 border-r border-slate-200/80 dark:border-slate-800">
                        {row.tunjanganMakan > 0 ? formatIDR(row.tunjanganMakan) : '-'}
                      </td>

                      {/* Tunjangan Transport */}
                      <td className="py-1 px-2.5 text-right font-mono text-slate-700 dark:text-slate-300 border-r border-slate-200/80 dark:border-slate-800">
                        {row.tunjanganTransport > 0 ? formatIDR(row.tunjanganTransport) : '-'}
                      </td>

                      {/* Tunjangan Gouging (Checkbox Iya/Tidak) */}
                      <td className="py-1 px-2 text-center border-r border-slate-200/80 dark:border-slate-800">
                        <label className={`inline-flex items-center gap-1.5 cursor-pointer text-[11px] ${!isHadir ? 'opacity-40 cursor-not-allowed' : ''}`}>
                          <input
                            type="checkbox"
                            disabled={!isHadir}
                            checked={row.tunjanganGougingCentang}
                            onChange={(e) => handleRowChange(row.day, 'tunjanganGougingCentang', e.target.checked)}
                            className="rounded text-amber-600 focus:ring-amber-500 w-3.5 h-3.5"
                          />
                          <span className="font-bold text-[10px]">
                            {row.tunjanganGougingCentang ? 'Iya' : 'Tidak'}
                          </span>
                        </label>
                      </td>

                      {/* Nama Kapal beserta kode */}
                      <td className="py-1 px-2 border-r border-slate-200/80 dark:border-slate-800">
                        <select
                          disabled={!isHadir}
                          value={row.namaKapal}
                          onChange={(e) => handleRowChange(row.day, 'namaKapal', e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:bg-slate-100 dark:disabled:bg-slate-800/40 disabled:text-slate-400 disabled:cursor-not-allowed focus:outline-hidden truncate"
                        >
                          <option value="">(Pilih Kapal Proyek)</option>
                          {projects.map((p) => (
                            <option key={p.id} value={`${p.shipName} (${p.projectCode})`}>
                              {p.shipName} ({p.projectCode})
                            </option>
                          ))}
                          <option value="TB SAMUDERA PERKASA VIII (PRJ-2026-003)">TB SAMUDERA PERKASA VIII (PRJ-2026-003)</option>
                        </select>
                      </td>

                      {/* Total Upah */}
                      <td className="py-1 px-3 text-right font-black font-mono text-emerald-600 dark:text-emerald-400">
                        {row.totalUpah > 0 ? formatIDR(row.totalUpah) : '-'}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>

        {/* ================= BAGIAN 3: RINGKASAN BULANAN ================= */}
        {summary && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100">
                  Bagian 3: Ringkasan Bulanan (Akumulasi Rekap)
                </h2>
              </div>
              <span className="text-[10px] font-bold text-slate-400">
                Otomatis Dikalkulasi dari Rekap Harian
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
              
              {/* Total Jam Normal */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400">Total Jam Normal</span>
                <p className="text-lg font-black font-mono text-slate-800 dark:text-slate-100 mt-0.5">
                  {summary.totalJamNormal} <span className="text-xs font-normal text-slate-400">jam</span>
                </p>
              </div>

              {/* Total Jam Lembur */}
              <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">Total Jam Lembur</span>
                <p className="text-lg font-black font-mono text-amber-700 dark:text-amber-300 mt-0.5">
                  {summary.totalJamLembur} <span className="text-xs font-normal text-amber-500">jam</span>
                </p>
              </div>

              {/* Total Jam (Normal + Lembur) */}
              <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40">
                <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">Total Jam Keseluruhan</span>
                <p className="text-lg font-black font-mono text-blue-700 dark:text-blue-300 mt-0.5">
                  {summary.totalJam} <span className="text-xs font-normal text-blue-500">jam</span>
                </p>
              </div>

              {/* Hadir */}
              <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
                <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">Kehadiran (Hadir)</span>
                <p className="text-lg font-black font-mono text-emerald-700 dark:text-emerald-300 mt-0.5">
                  {summary.hadirCount} <span className="text-xs font-normal text-emerald-500">hari</span>
                </p>
              </div>

              {/* Alpha */}
              <div className="p-3.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40">
                <span className="text-[10px] font-bold uppercase text-rose-600 dark:text-rose-400">Tidak Hadir (Alpha)</span>
                <p className="text-lg font-black font-mono text-rose-700 dark:text-rose-300 mt-0.5">
                  {summary.alphaCount} <span className="text-xs font-normal text-rose-500">hari</span>
                </p>
              </div>

              {/* Izin / Sakit */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400">Izin / Sakit</span>
                <p className="text-lg font-black font-mono text-slate-700 dark:text-slate-300 mt-0.5">
                  {summary.izinSakitCount} <span className="text-xs font-normal text-slate-400">hari</span>
                </p>
              </div>

              {/* Tunjangan Makan */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400">Tunjangan Makan</span>
                <p className="text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5">
                  {formatIDR(summary.totalTunjanganMakan)}
                </p>
              </div>

              {/* Tunjangan Transport */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-400">Tunjangan Transport</span>
                <p className="text-sm font-black font-mono text-slate-900 dark:text-white mt-0.5">
                  {formatIDR(summary.totalTunjanganTransport)}
                </p>
              </div>

              {/* Tunjangan Gouging - Rule: Hanya ditampilkan untuk Foreman Welder, Welder, Creator & Admin */}
              {summary.canViewGouging ? (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
                  <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">
                    Tj. Gouging (Welder)
                  </span>
                  <p className="text-sm font-black font-mono text-amber-700 dark:text-amber-300 mt-0.5">
                    {formatIDR(summary.totalTunjanganGouging)}
                  </p>
                </div>
              ) : null}

              {/* Total Upah */}
              <div className="p-3.5 rounded-xl bg-emerald-600 text-white shadow-sm sm:col-span-2 lg:col-span-1">
                <span className="text-[10px] font-bold uppercase text-emerald-100">Total Upah Akumulasi</span>
                <p className="text-base font-black font-mono mt-0.5 text-white truncate">
                  {formatIDR(summary.totalUpah)}
                </p>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
