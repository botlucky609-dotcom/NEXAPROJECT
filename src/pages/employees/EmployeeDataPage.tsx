import React, { useState, useEffect } from 'react';
import { 
  Users, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit3, 
  LayoutGrid, 
  List, 
  Camera, 
  AlertTriangle, 
  Check, 
  Clock, 
  ShieldAlert, 
  Briefcase,
  DollarSign,
  UserCheck,
  Building,
  CreditCard,
  LogOut,
  X,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../hooks/useRBAC';
import { employeeDb } from '../../services/employeeDb';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { 
  EmployeeRecord, 
  EMPLOYEE_POSITIONS, 
  WORK_SHIFTS, 
  WORK_STATUSES, 
  DEPARTMENTS, 
  PROJECT_TYPES, 
  WAGE_STATUSES, 
  RELIGIONS, 
  MARITAL_STATUSES, 
  BANK_LIST,
  EmployeePosition
} from '../../types/employee';
import { CameraCaptureModal } from '../../components/common/CameraCaptureModal';
import { ExcelImportCenterModal } from '../../components/common/ExcelImportCenterModal';
import { cascadeDeleteService } from '../../services/cascadeDeleteService';
import { DeleteConfirmationModal } from '../../components/common/DeleteConfirmationModal';
import { isCreatorUser } from '../../context/AuthContext';

export const EmployeeDataPage: React.FC = () => {
  const { currentUser } = useAuth();
  // Strict RBAC Hook: Creator gets 100% full authority; Admin & Karyawan strictly adhere to Izin Akses Pengguna
  const { isCreator, canCreate, canEdit, canDelete, canDownload: canExport, canUpload: canImport } = useRBAC('employees-data');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [search, setSearch] = useState('');
  const [filterDepartment, setFilterDepartment] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4 | 5 | 6 | 7>(1);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isImportCenterOpen, setIsImportCenterOpen] = useState(false);

  // Editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<EmployeeRecord>>({
    employeeId: '',
    fullName: '',
    position: 'WELDER',
    joinDate: new Date().toISOString().split('T')[0],
    workShift: 'PAGI',
    workStatus: 'AKTIF',
    department: 'STEEL WORK',
    projectType: 'SHIP REPAIR',
    workLocation: 'Galangan Utama',
    wage: 0,
    wageStatus: 'Jam',
    mealAllowance: 0,
    transportAllowance: 0,
    gougingAllowance: 0,
    address: '',
    birthPlace: '',
    birthDate: '1995-01-01',
    age: 31,
    religion: 'Islam',
    maritalStatus: 'TK/0',
    fatherName: '',
    motherName: '',
    phone: '',
    ktpNumber: '',
    kkNumber: '',
    npwpNumber: '',
    bpjsNumber: '',
    bankAccountNumber: '',
    bankName: 'BANK OCBC (OCBC NISP)',
    exitDate: '',
    exitNotes: '',
    email: '',
    accountRole: 'karyawan',
  });

  // Real-time synchronization state
  const [syncStatus, setSyncStatus] = useState<'syncing' | 'connected' | 'offline'>('syncing');
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());

  const getDisplayAccountRole = (emp: EmployeeRecord) => {
    if (employeeDb.isCreatorAccount(emp)) {
      if (currentUser?.role === 'creator') return 'creator';
      return 'admin';
    }
    return emp.accountRole;
  };

  const loadData = () => {
    setEmployees(employeeDb.getEmployees('id'));
  };

  // Real-time Firestore synchronization listener
  useEffect(() => {
    setSyncStatus('syncing');
    const unsubscribe = employeeDb.subscribeEmployees(
      (updatedList) => {
        setEmployees(updatedList);
        setSyncStatus('connected');
        setLastSyncTime(new Date());
        setIsLoading(false);
      },
      (error) => {
        console.warn('Real-time listener warning, maintaining offline cache:', error);
        setSyncStatus('offline');
        setEmployees(employeeDb.getEmployees('id'));
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  // Format phone with dashes every 4 digits: 0812-3456-7890
  const handlePhoneChange = (val: string) => {
    const raw = val.replace(/[^0-9]/g, '').slice(0, 13);
    const parts: string[] = [];
    for (let i = 0; i < raw.length; i += 4) {
      parts.push(raw.slice(i, i + 4));
    }
    setFormData((prev) => ({ ...prev, phone: parts.join('-') }));
  };

  // Auto calculate age from birthDate
  const handleBirthDateChange = (val: string) => {
    const calculatedAge = employeeDb.calculateAge(val);
    setFormData((prev) => ({ ...prev, birthDate: val, age: calculatedAge }));
  };

  // Exit date auto sets workStatus to TIDAK AKTIF
  const handleExitDateChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      exitDate: val,
      workStatus: val ? 'TIDAK AKTIF' : prev.workStatus || 'AKTIF',
    }));
  };

  // Gouging allowance is strictly restricted to FOREMAN WELDER and WELDER
  const isGougingAllowed = (pos?: string) => {
    return pos === 'FOREMAN WELDER' || pos === 'WELDER';
  };

  const handlePositionChange = (pos: EmployeePosition) => {
    setFormData((prev) => ({
      ...prev,
      position: pos,
      // If position doesn't allow gouging, reset to 0
      gougingAllowance: isGougingAllowed(pos) ? prev.gougingAllowance || 0 : 0,
    }));
  };

  const openNewForm = () => {
    if (!canEdit) {
      alert('Akses Ditolak: Anda tidak memiliki izin untuk menambah data pegawai. Fitur ini hanya untuk Admin dan Creator.');
      return;
    }
    const nextNum = employees.length + 1;
    const autoId = `EMP-${nextNum.toString().padStart(3, '0')}`;
    setEditingId(null);
    setFormData({
      id: `emp-${Date.now()}`,
      employeeId: autoId,
      fullName: '',
      position: 'WELDER',
      joinDate: new Date().toISOString().split('T')[0],
      workShift: 'PAGI',
      workStatus: 'AKTIF',
      department: 'STEEL WORK',
      projectType: 'SHIP REPAIR',
      workLocation: 'Galangan Utama Drydock',
      wage: 50000,
      wageStatus: 'Jam',
      mealAllowance: 40000,
      transportAllowance: 20000,
      gougingAllowance: 20000,
      address: '',
      birthPlace: '',
      birthDate: '1995-01-01',
      age: 31,
      religion: 'Islam',
      maritalStatus: 'TK/0',
      fatherName: '',
      motherName: '',
      phone: '',
      ktpNumber: '',
      kkNumber: '',
      npwpNumber: '',
      bpjsNumber: '',
      bankAccountNumber: '',
      bankName: 'BANK OCBC (OCBC NISP)',
      exitDate: '',
      exitNotes: '',
      email: '',
      accountRole: 'karyawan',
    });
    setActiveTab(1);
    setFormError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (emp: EmployeeRecord) => {
    if (!canEdit) {
      alert('Akses Ditolak: Anda tidak memiliki izin untuk mengedit data pegawai.');
      return;
    }
    if (employeeDb.isCreatorAccount(emp) && currentUser?.role !== 'creator') {
      alert('Akses Ditolak: Data akun ini dilindungi oleh kebijakan otorisasi sistem tingkat tinggi.');
      return;
    }
    setEditingId(emp.id);
    setFormData({ ...emp });
    setActiveTab(1);
    setFormError(null);
    setIsFormOpen(true);
  };

  const handleSaveForm = async () => {
    setFormError(null);

    if (!canEdit) {
      setFormError('Akses Ditolak: Hanya Admin dan Creator yang berwenang menambah atau mengedit data pegawai.');
      return;
    }

    // Validation
    if (!formData.employeeId?.trim()) {
      setFormError('ID Karyawan wajib diisi.');
      setActiveTab(1);
      return;
    }

    if (employeeDb.isEmployeeIdTaken(formData.employeeId, editingId || undefined)) {
      setFormError(`ID Karyawan ${formData.employeeId} sudah digunakan oleh karyawan lain.`);
      setActiveTab(1);
      return;
    }

    if (!formData.fullName?.trim()) {
      setFormError('Nama Karyawan wajib diisi.');
      setActiveTab(1);
      return;
    }

    if (!formData.email?.trim() || !formData.email.includes('@')) {
      setFormError('Alamat Email sah wajib diisi.');
      setActiveTab(7);
      return;
    }

    // Role safety: Admin cannot grant Creator role
    if (currentUser?.role !== 'creator' && formData.accountRole === 'creator') {
      setFormError('Anda tidak memiliki wewenang untuk menetapkan hak istimewa ini.');
      setActiveTab(7);
      return;
    }

    setIsSubmitting(true);
    try {
      await employeeDb.saveEmployee(formData as EmployeeRecord, currentUser?.role);
      setIsFormOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Universal Creator Delete State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    employeeId: string;
    employeeName: string;
    employeeCode: string;
  }>({ isOpen: false, employeeId: '', employeeName: '', employeeCode: '' });
  const [isDeletingCascade, setIsDeletingCascade] = useState(false);

  const handleDelete = (id: string, name: string) => {
    const target = employees.find((e) => e.id === id);
    if (!canDelete && !isCreator) {
      alert('Akses Ditolak: Anda tidak memiliki izin untuk menghapus data pegawai.');
      return;
    }

    if (target && employeeDb.isCreatorAccount(target) && !isCreator) {
      alert('Akses Ditolak: Akun ini dilindungi secara permanen oleh kebijakan keamanan sistem dan tidak dapat dihapus.');
      return;
    }

    setDeleteModalState({
      isOpen: true,
      employeeId: id,
      employeeName: name,
      employeeCode: target?.employeeId || id,
    });
  };

  const handleExecuteCascadeDelete = async () => {
    if (!deleteModalState.employeeId) return;
    setIsDeletingCascade(true);
    try {
      if (isCreator) {
        await cascadeDeleteService.deleteEmployeeCascade(
          deleteModalState.employeeId,
          currentUser?.role || 'creator',
          currentUser?.email
        );
      } else {
        await employeeDb.deleteEmployee(deleteModalState.employeeId, currentUser?.role);
      }
      setDeleteModalState({ isOpen: false, employeeId: '', employeeName: '', employeeCode: '' });
      await loadData();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setIsDeletingCascade(false);
    }
  };

  // Excel Actions
  const handleExportExcel = async () => {
    const blob = await employeeDb.exportToExcel(filteredEmployees);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DATA_KARYAWAN_NEXAPROJECT_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTemplate = async () => {
    const blob = await employeeDb.downloadTemplate();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TEMPLATE_INPUT_KARYAWAN_NEXAPROJECT.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Filtered employees
  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.fullName.toLowerCase().includes(search.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(search.toLowerCase()) ||
      emp.position.toLowerCase().includes(search.toLowerCase()) ||
      emp.department.toLowerCase().includes(search.toLowerCase());

    const matchesDept = filterDepartment === 'ALL' || emp.department === filterDepartment;
    const matchesStatus = filterStatus === 'ALL' || emp.workStatus === filterStatus;

    return matchesSearch && matchesDept && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
              <span>Karyawan</span>
              <span>/</span>
              <span>Sub Menu Data Karyawan</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Data Karyawan & Personil Galangan
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Pusat input data 7 bagian, ekspor-impor Excel, dan manajemen tenaga kerja terverifikasi.
            </p>
          </div>

          {/* 3 SEPARATE ACTION BUTTONS (As strictly required in Requirement 36) */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* 1. Ekspor Excel */}
            {canExport && (
              <button
                onClick={handleExportExcel}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs transition"
                title="Mengunduh data yang sudah ada ke format Excel .xlsx"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Ekspor Excel</span>
              </button>
            )}

            {/* 2. Unduh Template */}
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs transition"
              title="Mengunduh format Excel kosong siap diisi"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Unduh Template</span>
            </button>

            {/* 3. Impor Excel */}
            {canImport && (
              <button
                onClick={() => setIsImportCenterOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs transition"
                title="Mengunggah data dari file Excel melalui Excel Import Center"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                <span>Impor Excel</span>
              </button>
            )}

            {/* Add Employee Button (Creator/Admin based on permissions) */}
            {(canCreate || canEdit) && (
              <button
                onClick={openNewForm}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Karyawan</span>
              </button>
            )}

          </div>
        </div>

        {/* Real-time Shared Database (Firestore) & RBAC Access Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 px-4 py-3 bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-transparent dark:from-blue-950/40 dark:via-indigo-950/30 dark:to-transparent border border-blue-200/80 dark:border-blue-800/60 rounded-2xl">
          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20">
              <span className={`w-2 h-2 rounded-full ${syncStatus === 'connected' ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'}`} />
              <span className="w-2 h-2 rounded-full bg-emerald-500 -ml-3.5" />
              <span>{syncStatus === 'connected' ? 'Firestore Real-Time Bersama' : 'Sinkronisasi Firestore...'}</span>
            </span>
            <span className="text-slate-600 dark:text-slate-400 font-medium">
              Semua perangkat melihat data yang sama ({employees.length} Pegawai)
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {canEdit ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/15 text-blue-700 dark:text-blue-300 font-bold border border-blue-500/30">
                <span>🛡️ Hak Akses:</span>
                <span className="uppercase">{currentUser?.role || 'ADMIN'} (Akses Penuh Tambah, Edit, Hapus)</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-500/10 text-slate-700 dark:text-slate-300 font-bold border border-slate-300 dark:border-slate-700">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>Mode Karyawan (Hanya Lihat): Tombol Edit & Hapus Dinonaktifkan Sesuai RBAC</span>
              </span>
            )}
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, ID, jabatan..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Filter Dept */}
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="ALL">Semua Departemen</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* Filter Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="ALL">Semua Status</option>
              {WORK_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* View Switch */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'card'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500'
                }`}
                title="Tampilan Kartu"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-slate-500'
                }`}
                title="Tampilan Tabel Terkontrol"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* DATA DISPLAY: 1. TAMPILAN KARTU (Exact fields specified: Foto, Nama Lengkap, Nomor Karyawan, Jabatan, Status Kerja, Shift Kerja, Department, Status Akun) */}
        {isLoading ? (
          <div className="py-8">
            <LoadingScreen 
              variant="inline"
              text="Menyinkronkan Basis Data Pegawai..."
              subtext="Mengambil arsip karyawan, status verifikasi, dan sinkronisasi Firestore..."
            />
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredEmployees.map((emp) => (
              <div
                key={emp.id}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs hover:border-blue-500/50 transition flex flex-col justify-between"
              >
                <div className="space-y-3">
                  
                  {/* Card Top: Photo & Basic Info */}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-600 text-sm">
                      {emp.photoUrl ? (
                        <img src={emp.photoUrl} alt={emp.fullName} className="w-full h-full object-cover" />
                      ) : (
                        emp.fullName.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate uppercase" title={emp.fullName}>
                        {emp.fullName}
                      </p>
                      <p className="text-[11px] font-mono text-blue-600 dark:text-blue-400 font-bold">
                        {emp.employeeId}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate" title={emp.position}>
                        {emp.position}
                      </p>
                    </div>
                  </div>

                  {/* Card Attributes */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Departemen:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{emp.department}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Shift Kerja:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{emp.workShift}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Status Kerja:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        emp.workStatus === 'AKTIF'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : emp.workStatus === 'DAFTAR HITAM'
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                      }`}>
                        {emp.workStatus}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Status Akun:</span>
                      <span className="font-mono uppercase font-bold text-[10px] text-indigo-600 dark:text-indigo-400">
                        {getDisplayAccountRole(emp)}
                      </span>
                    </div>
                  </div>

                </div>

                {/* Card Actions (RBAC: Controlled by Izin Akses Pengguna, Creator always full access) */}
                {(canEdit || canDelete) ? (
                  <div className="flex items-center justify-between gap-1.5 pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      {employeeDb.isCreatorAccount(emp) && isCreator && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" title="Akun Anda (Creator) terlindungi">
                          👑 Terproteksi
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {canEdit && (
                        <button
                          onClick={() => openEditForm(emp)}
                          className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition"
                          title="Edit Data Karyawan"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                      {canDelete && (!employeeDb.isCreatorAccount(emp) || isCreator) && (
                        <button
                          onClick={() => handleDelete(emp.id, emp.fullName)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                          title="Hapus Karyawan"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 text-[10px]">
                      <ShieldAlert className="w-3 h-3 text-slate-400" />
                      Hanya Lihat (View Only)
                    </span>
                    <span className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Real-Time Sync
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* 2. TAMPILAN TABEL TERKONTROL DENGAN KOLOM PRIORITAS */
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 font-bold border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="p-3">ID Karyawan</th>
                    <th className="p-3">Nama Lengkap</th>
                    <th className="p-3">Jabatan</th>
                    <th className="p-3">Departemen</th>
                    <th className="p-3">Shift</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Peran Akun</th>
                    {(canEdit || canDelete) && <th className="p-3 text-right">Aksi</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-mono font-bold text-blue-600">{emp.employeeId}</td>
                      <td className="p-3 font-semibold uppercase">{emp.fullName}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{emp.position}</td>
                      <td className="p-3">{emp.department}</td>
                      <td className="p-3">{emp.workShift}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          emp.workStatus === 'AKTIF'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                        }`}>
                          {emp.workStatus}
                        </span>
                      </td>
                      <td className="p-3 font-mono uppercase text-indigo-600 dark:text-indigo-400 font-bold text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span>{getDisplayAccountRole(emp)}</span>
                          {employeeDb.isCreatorAccount(emp) && currentUser?.role === 'creator' && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" title="Akun Anda (Creator) terlindungi">
                              👑
                            </span>
                          )}
                        </div>
                      </td>
                      {(canEdit || canDelete) && (
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {canEdit && (
                              <button
                                onClick={() => openEditForm(emp)}
                                className="p-1 rounded text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
                                title="Edit Data Karyawan"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDelete && (!employeeDb.isCreatorAccount(emp) || isCreator) ? (
                              <button
                                onClick={() => handleDelete(emp.id, emp.fullName)}
                                className="p-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                title="Hapus Karyawan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            ) : null}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* FORM INPUT MODAL: 7 BAGIAN/TAB (Requirement 29) */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="w-full max-w-4xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingId ? 'Edit Data Karyawan' : 'Input Data Karyawan Baru'}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Formulir terbagi menjadi 7 bagian terstruktur
                </p>
              </div>
              <button
                onClick={() => setIsFormOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tab Strip */}
            <div className="flex items-center gap-1 p-2 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 overflow-x-auto text-xs font-semibold scrollbar-none">
              {[
                { tab: 1, label: '1. Data Utama' },
                { tab: 2, label: '2. Penempatan' },
                { tab: 3, label: '3. Penggajian' },
                { tab: 4, label: '4. Data Pribadi' },
                { tab: 5, label: '5. Dokumen' },
                { tab: 6, label: '6. Data Keluar' },
                { tab: 7, label: '7. Status Akun' },
              ].map((t) => (
                <button
                  key={t.tab}
                  type="button"
                  onClick={() => setActiveTab(t.tab as any)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition shrink-0 ${
                    activeTab === t.tab
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* TAB 1: DATA UTAMA */}
              {activeTab === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="w-16 h-16 rounded-xl bg-slate-200 dark:bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-slate-500">
                      {formData.photoUrl ? (
                        <img src={formData.photoUrl} alt="Foto Profil" className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">Foto Profil Karyawan</h4>
                      <p className="text-[11px] text-slate-500 mb-2">Foto ini akan otomatis masuk ke dalam Profil dan Kartu Karyawan.</p>
                      <button
                        type="button"
                        onClick={() => setIsCameraOpen(true)}
                        className="inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Buka Kamera / Unggah Foto</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        ID Karyawan (Unik / Tidak Boleh Duplikat)*
                      </label>
                      <input
                        type="text"
                        value={formData.employeeId}
                        onChange={(e) => setFormData({ ...formData, employeeId: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                        placeholder="Contoh: EMP-001"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Nama Lengkap Karyawan*
                      </label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value.toUpperCase() })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase"
                        placeholder="NAMA LENGKAP"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Jabatan Karyawan*
                      </label>
                      <select
                        value={formData.position}
                        onChange={(e) => handlePositionChange(e.target.value as EmployeePosition)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        {EMPLOYEE_POSITIONS.map((pos) => (
                          <option key={pos} value={pos}>{pos}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Tanggal Masuk Kerja*
                      </label>
                      <input
                        type="date"
                        value={formData.joinDate}
                        onChange={(e) => setFormData({ ...formData, joinDate: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Shift Kerja*
                      </label>
                      <select
                        value={formData.workShift}
                        onChange={(e) => setFormData({ ...formData, workShift: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        {WORK_SHIFTS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        Status Kerja*
                      </label>
                      <select
                        value={formData.workStatus}
                        onChange={(e) => setFormData({ ...formData, workStatus: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      >
                        {WORK_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PENEMPATAN KERJA */}
              {activeTab === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Departemen*
                    </label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Proyek Kerja*
                    </label>
                    <select
                      value={formData.projectType}
                      onChange={(e) => setFormData({ ...formData, projectType: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {PROJECT_TYPES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Lokasi Kerja Lapangan*
                    </label>
                    <input
                      type="text"
                      value={formData.workLocation}
                      onChange={(e) => setFormData({ ...formData, workLocation: e.target.value })}
                      placeholder="Contoh: Drydock 1 - Lambung Kanan / Bengkel Modul 2"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* TAB 3: PENGGAJIAN */}
              {activeTab === 3 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Besaran Upah / Gaji Pokok (Angka)*
                    </label>
                    <input
                      type="number"
                      value={formData.wage || ''}
                      onChange={(e) => setFormData({ ...formData, wage: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      placeholder="Contoh: 15000000"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Status Upah / Gaji*
                    </label>
                    <select
                      value={formData.wageStatus}
                      onChange={(e) => setFormData({ ...formData, wageStatus: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {WAGE_STATUSES.map((ws) => (
                        <option key={ws} value={ws}>Per {ws}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tunjangan Makan (Angka)
                    </label>
                    <input
                      type="number"
                      value={formData.mealAllowance || ''}
                      onChange={(e) => setFormData({ ...formData, mealAllowance: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tunjangan Transportasi (Angka)
                    </label>
                    <input
                      type="number"
                      value={formData.transportAllowance || ''}
                      onChange={(e) => setFormData({ ...formData, transportAllowance: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                      placeholder="0"
                    />
                  </div>

                  {/* Tunjangan Gouging: STRICTLY RESTRICTED TO FOREMAN WELDER & WELDER */}
                  <div className="sm:col-span-2 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-700 dark:text-slate-300">
                        Tunjangan Gouging (Khusus Foreman Welder & Welder)
                      </label>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        isGougingAllowed(formData.position)
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {isGougingAllowed(formData.position) ? 'Diizinkan untuk Jabatan Ini' : 'Terkunci'}
                      </span>
                    </div>
                    <input
                      type="number"
                      disabled={!isGougingAllowed(formData.position)}
                      value={formData.gougingAllowance || ''}
                      onChange={(e) => setFormData({ ...formData, gougingAllowance: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono disabled:opacity-40"
                      placeholder={isGougingAllowed(formData.position) ? 'Masukkan nominal tunjangan gouging...' : 'Terkunci (Hanya berlaku untuk Foreman Welder & Welder)'}
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: DATA PRIBADI */}
              {activeTab === 4 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Alamat Lengkap Sesuai KTP
                    </label>
                    <textarea
                      rows={2}
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      placeholder="Jl. / RT/RW / Kelurahan / Kecamatan / Kota"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tempat Lahir
                    </label>
                    <input
                      type="text"
                      value={formData.birthPlace}
                      onChange={(e) => setFormData({ ...formData, birthPlace: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tanggal Lahir (Usia Terhitung Otomatis)*
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={formData.birthDate}
                        onChange={(e) => handleBirthDateChange(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <span className="px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-mono font-bold whitespace-nowrap">
                        {formData.age} Tahun
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Agama
                    </label>
                    <select
                      value={formData.religion}
                      onChange={(e) => setFormData({ ...formData, religion: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {RELIGIONS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Status Pernikahan (TK/0 s/d K/5)
                    </label>
                    <select
                      value={formData.maritalStatus}
                      onChange={(e) => setFormData({ ...formData, maritalStatus: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      {MARITAL_STATUSES.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Ayah Kandung
                    </label>
                    <input
                      type="text"
                      value={formData.fatherName}
                      onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Ibu Kandung
                    </label>
                    <input
                      type="text"
                      value={formData.motherName}
                      onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: DATA DOKUMEN */}
              {activeTab === 5 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor HP (10-13 digit, tanda - setiap 4 digit)*
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="0812-3456-7890"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor KTP (16 Digit Khusus)*
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={formData.ktpNumber}
                      onChange={(e) => setFormData({ ...formData, ktpNumber: e.target.value.replace(/[^0-9]/g, '') })}
                      placeholder="16 digit angka KTP"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor Kartu Keluarga (16 Digit Khusus)*
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={formData.kkNumber}
                      onChange={(e) => setFormData({ ...formData, kkNumber: e.target.value.replace(/[^0-9]/g, '') })}
                      placeholder="16 digit angka KK"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor NPWP
                    </label>
                    <input
                      type="text"
                      value={formData.npwpNumber}
                      onChange={(e) => setFormData({ ...formData, npwpNumber: e.target.value })}
                      placeholder="XX.XXX.XXX.X-XXX.XXX"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor BPJS-TK (Ketenagakerjaan)
                    </label>
                    <input
                      type="text"
                      value={formData.bpjsNumber}
                      onChange={(e) => setFormData({ ...formData, bpjsNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nomor Rekening Bank*
                    </label>
                    <input
                      type="text"
                      value={formData.bankAccountNumber}
                      onChange={(e) => setFormData({ ...formData, bankAccountNumber: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Nama Bank (Diutamakan Bank OCBC)*
                    </label>
                    <select
                      value={formData.bankName}
                      onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                    >
                      {BANK_LIST.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* TAB 6: DATA KELUAR */}
              {activeTab === 6 && (
                <div className="space-y-4 text-xs">
                  <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                    <p className="font-bold text-slate-900 dark:text-white mb-1">Pemberitahuan Otomatisasi:</p>
                    <p className="text-[11px] text-slate-500">
                      Jika kolom Tanggal Keluar Kerja diisi, sistem akan otomatis menetapkan Status Kerja menjadi <strong>TIDAK AKTIF</strong>.
                    </p>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Tanggal Keluar Kerja (Opsional)
                    </label>
                    <input
                      type="date"
                      value={formData.exitDate || ''}
                      onChange={(e) => handleExitDateChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Keterangan Keluar / Catatan Pengunduran Diri
                    </label>
                    <textarea
                      rows={3}
                      value={formData.exitNotes || ''}
                      onChange={(e) => setFormData({ ...formData, exitNotes: e.target.value })}
                      placeholder="Contoh: Selesai masa kontrak proyek galangan / Pindah domisili"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              {/* TAB 7: STATUS AKUN */}
              {activeTab === 7 && (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Alamat Email Tertaut Akun*
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="user@perusahaan.com"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Peran Hak Akses (Role Akun)*
                    </label>
                    <select
                      value={formData.accountRole}
                      disabled={employeeDb.isCreatorAccount(formData) && currentUser?.role !== 'creator'}
                      onChange={(e) => setFormData({ ...formData, accountRole: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60 disabled:bg-slate-100 dark:disabled:bg-slate-800"
                    >
                      <option value="karyawan">Karyawan (Dasar / View-Only)</option>
                      <option value="staff">Staff (Operasional Lapangan & Gudang)</option>
                      <option value="admin">Admin (Administrator)</option>
                      {currentUser?.role === 'creator' && (
                        <option value="creator">Creator (Pembuat Aplikasi / Otoritas Penuh)</option>
                      )}
                    </select>
                    {employeeDb.isCreatorAccount(formData) && currentUser?.role !== 'creator' ? (
                      <div className="mt-2 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-[11px] font-semibold">
                        🛡️ Akun ini dilindungi oleh kebijakan keamanan sistem dan tidak dapat diubah oleh peran saat ini.
                      </div>
                    ) : currentUser?.role === 'admin' ? (
                      <p className="text-[10px] text-slate-400 mt-1">
                        *Tingkat wewenang akun ditetapkan berdasarkan kebijakan keamanan sistem terpusat.
                      </p>
                    ) : null}
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer (Rule 25: Form cancel does not alter stored data) */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Batal mengisi form? Data yang belum disimpan akan otomatis dibatalkan tanpa mengubah sistem.')) {
                    setIsFormOpen(false);
                  }
                }}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                Batal
              </button>

              <div className="flex items-center gap-2">
                {activeTab < 7 && (
                  <button
                    type="button"
                    onClick={() => setActiveTab((prev) => (prev + 1) as any)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                  >
                    Selanjutnya &rarr;
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveForm}
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-sm transition flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? 'Menyimpan ke Server...' : 'Simpan Data Karyawan'}</span>
                </button>
              </div>
            </div>

            {/* Overlay Loader during Form Submission */}
            {isSubmitting && (
              <LoadingScreen
                variant="overlay"
                text="Menyimpan Data Karyawan..."
                subtext="Menyinkronkan data profil dan peran ke database Firestore..."
              />
            )}

          </div>
        </div>
      )}

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(base64) => setFormData((prev) => ({ ...prev, photoUrl: base64 }))}
      />

      {/* Excel Import Center Modal */}
      <ExcelImportCenterModal
        isOpen={isImportCenterOpen}
        onClose={() => setIsImportCenterOpen(false)}
        onSuccess={loadData}
      />

      {/* Universal Creator Cascade Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, employeeId: '', employeeName: '', employeeCode: '' })}
        onConfirm={handleExecuteCascadeDelete}
        title="Hapus Data Pegawai & Seluruh Turunan"
        itemName={deleteModalState.employeeName}
        itemCode={deleteModalState.employeeCode}
        itemType="Data Pegawai Galangan"
        isLoading={isDeletingCascade}
        cascadeDetails={[
          "Dokumen master pegawai di Firestore ('employees')",
          "Akun otorisasi & izin modul pengguna ('users' & 'user_permissions')",
          "Seluruh arsip presensi harian & Form Time Sheet",
          "Seluruh catatan lembur & Form Night Shift",
          "Klaim lembur & lembar kalkulasi waktu bulanan",
          "Pembersihan sinkronisasi real-time ke semua perangkat aktif"
        ]}
      />

    </div>
  );
};
