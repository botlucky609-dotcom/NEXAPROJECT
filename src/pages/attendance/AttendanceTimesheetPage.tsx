import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Calendar, 
  Plus, 
  Download, 
  Search, 
  Trash2, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  User, 
  Briefcase,
  Building,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRBAC } from '../../hooks/useRBAC';
import { attendanceDb } from '../../services/attendanceDb';
import { employeeDb } from '../../services/employeeDb';
import { FormTimesheetEntry } from '../../types/attendance';
import { EmployeeRecord } from '../../types/employee';
import { AppView } from '../../types/navigation';
import { AttendanceNavTabs } from '../../components/attendance/AttendanceNavTabs';

interface AttendanceTimesheetPageProps {
  onNavigate?: (view: AppView) => void;
}

export const AttendanceTimesheetPage: React.FC<AttendanceTimesheetPageProps> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { language } = useTheme();
  const rbac = useRBAC('attendance-timesheet');

  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [timesheetList, setTimesheetList] = useState<FormTimesheetEntry[]>([]);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [search, setSearch] = useState('');

  // Form State
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [selectedEmp, setSelectedEmp] = useState<EmployeeRecord | null>(null);
  const [alertMessage, setAlertMessage] = useState<{ type: 'error' | 'warning' | 'success'; text: string } | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const loadData = () => {
    setTimesheetList(attendanceDb.getFormTimesheets(selectedDate));
    const allEmps = employeeDb.getEmployees();
    setEmployees(allEmps);
    if (allEmps.length > 0 && !selectedEmpId) {
      handleSelectEmployee(allEmps[0].employeeId, allEmps);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleSelectEmployee = (empId: string, empList: EmployeeRecord[] = employees) => {
    setSelectedEmpId(empId);
    setAlertMessage(null);
    const found = empList.find((e) => e.employeeId === empId) || null;
    setSelectedEmp(found);

    if (found) {
      if (found.workStatus === 'TIDAK AKTIF' || found.workStatus === 'DAFTAR HITAM') {
        setAlertMessage({
          type: 'warning',
          text: `PEMBERITAHUAN: Karyawan ${found.fullName} (${found.employeeId}) berstatus ${found.workStatus}! Tidak dapat mengisi atau diproses dalam Form Time Sheet.`,
        });
      }
    }
  };

  const handleAddTimesheet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rbac.canCreate && !rbac.canEdit) {
      setAlertMessage({
        type: 'error',
        text: 'Akses Ditolak: Anda tidak memiliki izin untuk menambah data Time Sheet.',
      });
      return;
    }
    if (!selectedEmp) return;

    // Call service with duplicate and inactive defense
    const result = attendanceDb.addFormTimesheet({
      employeeId: selectedEmp.employeeId,
      fullName: selectedEmp.fullName,
      position: selectedEmp.position,
      department: selectedEmp.department || 'OPERASI',
      date: selectedDate,
    });

    if (!result.success) {
      setAlertMessage({
        type: 'error',
        text: result.error || 'Gagal menambahkan data!',
      });
      return;
    }

    setAlertMessage({
      type: 'success',
      text: `Berhasil menambahkan data Time Sheet untuk ${selectedEmp.fullName}!`,
    });
    setTimesheetList(attendanceDb.getFormTimesheets(selectedDate));
  };

  const handleDelete = (id: string) => {
    if (!rbac.canDelete) {
      setAlertMessage({
        type: 'error',
        text: 'Akses Ditolak: Anda tidak memiliki izin untuk menghapus data Time Sheet.',
      });
      return;
    }
    attendanceDb.deleteFormTimesheet(id);
    setTimesheetList(attendanceDb.getFormTimesheets(selectedDate));
  };

  const handleExport = async () => {
    if (!rbac.canDownload) {
      setAlertMessage({
        type: 'error',
        text: 'Akses Ditolak: Anda tidak memiliki izin untuk mengunduh data Time Sheet.',
      });
      return;
    }
    try {
      setIsExporting(true);
      const blob = await attendanceDb.exportFormTimesheetToExcel(selectedDate);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `FORM_TIME_SHEET_${selectedDate}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const isInactive = selectedEmp?.workStatus === 'TIDAK AKTIF' || selectedEmp?.workStatus === 'DAFTAR HITAM';

  const filtered = timesheetList.filter((item) =>
    item.fullName.toLowerCase().includes(search.toLowerCase()) ||
    item.employeeId.toLowerCase().includes(search.toLowerCase()) ||
    item.position.toLowerCase().includes(search.toLowerCase()) ||
    item.department.toLowerCase().includes(search.toLowerCase())
  );

  if (!rbac.canAccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-3xl p-8 text-center shadow-xl">
          <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Akses Dibatasi</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Akun Anda tidak memiliki izin untuk mengakses modul <strong>Form Time Sheet</strong>. Hubungi Administrator atau Creator untuk memperbarui matriks izin pada halaman Izin Akses Pengguna.
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
        
        {/* Navigation Tabs to 7 Sub Menus */}
        {onNavigate && (
          <AttendanceNavTabs currentView="attendance-timesheet" onNavigate={onNavigate} />
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">
              <FileSpreadsheet className="w-4 h-4" />
              <span>Halaman Absensi / Sub Menu 1</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              Form Time Sheet
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Form pengisian data resmi kehadiran time sheet galangan dengan ekspor Excel, proteksi karyawan tidak aktif, dan pencegahan data duplikat.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <Calendar className="w-4 h-4 text-blue-500" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent text-xs font-bold focus:outline-hidden text-slate-800 dark:text-slate-200"
              />
            </div>

            {rbac.canDownload && (
              <button
                onClick={handleExport}
                disabled={isExporting || timesheetList.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Mengekspor...' : 'Ekspor Excel'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Notification Alerts */}
        {alertMessage && (
          <div
            className={`p-4 rounded-2xl flex items-start gap-3 border text-xs font-bold animate-in fade-in duration-150 ${
              alertMessage.type === 'error'
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200'
                : alertMessage.type === 'warning'
                ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
            }`}
          >
            {alertMessage.type === 'error' ? (
              <ShieldAlert className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
            ) : alertMessage.type === 'warning' ? (
              <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400" />
            ) : (
              <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
            )}
            <div className="flex-1">
              <span>{alertMessage.text}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ================= LEFT: FORM INPUT TIME SHEET ================= */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-sm font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Pengisian Form Time Sheet</span>
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300">
                Data Karyawan
              </span>
            </div>

            <form onSubmit={handleAddTimesheet} className="space-y-4">
              
              {/* Field 1: Pilih Karyawan / ID Karyawan */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Pilih Karyawan (ID Karyawan) <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedEmpId}
                  onChange={(e) => handleSelectEmployee(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  {employees.map((emp) => (
                    <option key={emp.employeeId} value={emp.employeeId}>
                      {emp.employeeId} - {emp.fullName} ({emp.position}) [{emp.workStatus}]
                    </option>
                  ))}
                </select>
              </div>

              {/* Field 2: ID Karyawan (Readonly display) */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  ID Karyawan
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>{selectedEmp?.employeeId || '-'}</span>
                </div>
              </div>

              {/* Field 3: Nama Lengkap */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Nama Lengkap
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <User className="w-4 h-4 text-blue-500" />
                  <span>{selectedEmp?.fullName || '-'}</span>
                </div>
              </div>

              {/* Field 4: Jabatan */}
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1">
                  Jabatan
                </label>
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/60 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <Briefcase className="w-4 h-4 text-indigo-500" />
                  <span>{selectedEmp?.position || '-'}</span>
                </div>
              </div>

              {/* Status Badge */}
              <div className="pt-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mr-2">
                  Status Operasional:
                </span>
                <span
                  className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black uppercase ${
                    selectedEmp?.workStatus === 'AKTIF'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                  }`}
                >
                  {selectedEmp?.workStatus || 'TIDAK DIKETAHUI'}
                </span>
              </div>

              {/* Submit Button with Inactive Status Lock */}
              <button
                type="submit"
                disabled={isInactive || !selectedEmp || (!rbac.canCreate && !rbac.canEdit)}
                className="w-full mt-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition shadow-sm flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>
                  {!rbac.canCreate && !rbac.canEdit
                    ? 'Akses Terbatas (Hanya Lihat)'
                    : isInactive
                    ? 'Karyawan Tidak Aktif (Terkunci)'
                    : 'Tambahkan ke Form Time Sheet'}
                </span>
              </button>
            </form>
          </div>

          {/* ================= RIGHT: DATA TABLE ================= */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Daftar Data Form Time Sheet
                </h2>
                <p className="text-[11px] text-slate-500">
                  Tanggal aktif: <span className="font-bold text-blue-600">{selectedDate}</span> • Total {filtered.length} Karyawan
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

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">No</th>
                    <th className="py-2.5 px-3">ID Karyawan</th>
                    <th className="py-2.5 px-3">Nama Lengkap</th>
                    <th className="py-2.5 px-3">Jabatan</th>
                    <th className="py-2.5 px-3">Departemen</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Belum ada data time sheet untuk tanggal {selectedDate}. Gunakan form di sebelah kiri untuk menambahkan.
                      </td>
                    </tr>
                  ) : (
                    filtered.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {item.employeeId}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                          {item.fullName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                          {item.position}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {item.department}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          {rbac.canDelete ? (
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                              title="Hapus Baris"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 text-xs">-</span>
                          )}
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
    </div>
  );
};
