import React, { useState } from 'react';
import { 
  CheckSquare, 
  Plus, 
  Download, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Filter, 
  Anchor, 
  MapPin, 
  Users, 
  ShieldCheck, 
  FileCheck, 
  X,
  Sliders,
  ChevronRight,
  HardHat
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRBAC } from '../../hooks/useRBAC';
import { taskAnnouncementDb } from '../../services/taskAnnouncementDb';
import { employeeDb } from '../../services/employeeDb';
import { projectDb } from '../../services/projectDb';
import { FieldWorkTask, TaskStatus, TaskPriority } from '../../types/taskAnnouncement';

export const FieldTasksPage: React.FC = () => {
  const { currentUser } = useAuth();
  const rbac = useRBAC('tasks');
  const userRole = currentUser?.role || 'karyawan';
  const { t, language } = useTheme();

  const [tasks, setTasks] = useState<FieldWorkTask[]>(() => taskAnnouncementDb.getTasks());
  const [projects] = useState(() => projectDb.getProjects());
  const [employees] = useState(() => employeeDb.getEmployees());

  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [updatingTask, setUpdatingTask] = useState<FieldWorkTask | null>(null);
  const [progressInput, setProgressInput] = useState<number>(50);
  const [statusInput, setStatusInput] = useState<TaskStatus>('IN_PROGRESS');
  const [qcInspectorInput, setQcInspectorInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Task Form
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newProjectId, setNewProjectId] = useState('prj-001');
  const [newDepartment, setNewDepartment] = useState('STEEL WORK');
  const [newLocation, setNewLocation] = useState('Graving Drydock 1');
  const [newPriority, setNewPriority] = useState<TaskPriority>('HIGH');
  const [newAssignedNames, setNewAssignedNames] = useState<string[]>(['MUHAMMAD ANDRI', 'AHMAD RIFAI']);
  const [newDueDate, setNewDueDate] = useState(new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0]);
  const [newPermits, setNewPermits] = useState<string[]>(['Hot Work Permit']);
  const [newMaterials, setNewMaterials] = useState('');

  const reloadData = () => {
    setTasks(taskAnnouncementDb.getTasks());
  };

  const handleExportExcel = async () => {
    if (!rbac.canDownload) {
      setFeedbackMsg({ type: 'error', text: 'Akses Ditolak: Anda tidak memiliki izin untuk mengunduh data tugas lapangan.' });
      return;
    }
    try {
      const blob = await taskAnnouncementDb.exportTasksToExcel();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NEXAPROJECT_Surat_Tugas_Lapangan_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Gagal mengekspor file Excel tugas.' });
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rbac.canCreate && !rbac.canEdit) {
      setFeedbackMsg({ type: 'error', text: 'Akses Ditolak: Anda tidak memiliki izin untuk menerbitkan tugas lapangan.' });
      return;
    }
    if (!newTitle.trim() || !newDescription.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Judul dan uraian tugas lapangan wajib diisi.' });
      return;
    }

    const selectedProj = projects.find(p => p.id === newProjectId);

    const res = taskAnnouncementDb.saveTask(
      {
        title: newTitle,
        description: newDescription,
        projectId: newProjectId,
        projectCode: selectedProj?.projectCode || 'PRJ-2026-001',
        shipName: selectedProj?.shipName || 'MV OCEANIC LEADER',
        department: newDepartment,
        location: newLocation,
        priority: newPriority,
        assignedTo: newAssignedNames,
        dueDate: newDueDate,
        safetyPermitsRequired: newPermits,
        materialsRequired: newMaterials || undefined,
      },
      userRole,
      currentUser?.email || '',
      currentUser?.fullName || 'SUPERVISOR'
    );

    if (res.success) {
      setFeedbackMsg({ type: 'success', text: res.message });
      setIsNewTaskModalOpen(false);
      reloadData();
      setNewTitle('');
      setNewDescription('');
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  const handleUpdateProgressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rbac.canCreate && !rbac.canEdit) {
      setFeedbackMsg({ type: 'error', text: 'Akses Ditolak: Anda tidak memiliki izin untuk memperbarui progres tugas.' });
      return;
    }
    if (!updatingTask) return;

    taskAnnouncementDb.updateTaskProgress(
      updatingTask.id,
      Number(progressInput),
      statusInput,
      qcInspectorInput || undefined,
      notesInput || undefined
    );

    setFeedbackMsg({ 
      type: 'success', 
      text: `Progres tugas ${updatingTask.taskNumber} diperbarui menjadi ${progressInput}% (${statusInput}).` 
    });

    setUpdatingTask(null);
    reloadData();
  };

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = 
      t.taskNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.shipName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.assignedTo.some(name => name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesProject = projectFilter === 'ALL' || t.projectId === projectFilter;
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesProject && matchesStatus;
  });

  if (!rbac.canAccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-3xl p-8 text-center shadow-xl">
          <CheckSquare className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Akses Dibatasi</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Akun Anda tidak memiliki izin untuk mengakses modul <strong>Tugas Lapangan (Work Orders)</strong>. Hubungi Administrator atau Creator untuk memperbarui matriks izin pada halaman Izin Akses Pengguna.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Feedback Banner */}
      {feedbackMsg && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-sm shadow-xs ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
        }`}>
          <div className="flex items-center gap-2.5">
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
            <span className="font-semibold">{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'en' ? 'Field Work Orders & Task Dispatcher' : 'Manajemen Tugas & Disposisi Lapangan (Work Orders)'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {language === 'en'
                  ? 'Hull plate cutting, piping hydrotest, NDT radiography, blasting coating, and supervisor verification'
                  : 'Surat perintah kerja pemotongan pelat, hydrotest pipa, uji NDT, sandblasting, dan inspeksi QC'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {rbac.canDownload && (
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-xs"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{language === 'en' ? 'Export Tasks (.xlsx)' : 'Ekspor Tugas (.xlsx)'}</span>
            </button>
          )}

          {(rbac.canCreate || rbac.canEdit) && (
            <button
              onClick={() => setIsNewTaskModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'en' ? 'Issue Work Order' : 'Terbitkan Surat Tugas'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-500">Total Tugas Terbit</span>
          <p className="text-xl font-black text-slate-900 dark:text-white mt-1">{tasks.length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-amber-600">Sedang Dikerjakan</span>
          <p className="text-xl font-black text-amber-600 mt-1">{tasks.filter(t => t.status === 'IN_PROGRESS').length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-indigo-600">Inspeksi QC / NDT</span>
          <p className="text-xl font-black text-indigo-600 mt-1">{tasks.filter(t => t.status === 'QC_INSPECTION').length}</p>
        </div>
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-emerald-600">Selesai (Completed)</span>
          <p className="text-xl font-black text-emerald-600 mt-1">{tasks.filter(t => t.status === 'COMPLETED').length}</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'en' ? 'Search task number, ship, person...' : 'Cari nomor tugas, kapal, teknisi...'}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">Semua Kapal Proyek</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.shipName}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">Semua Status</option>
            <option value="PENDING">PENDING</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="QC_INSPECTION">QC INSPECTION</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="BLOCKED">BLOCKED</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="py-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            {language === 'en' ? 'No work orders matching search criteria.' : 'Tidak ada surat tugas yang cocok dengan filter.'}
          </div>
        ) : (
          filteredTasks.map((t) => (
            <div 
              key={t.id}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-emerald-500/40 transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-lg border border-emerald-200 dark:border-emerald-800">
                      {t.taskNumber}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Anchor className="w-3.5 h-3.5 text-blue-500" />
                      {t.shipName} ({t.projectCode})
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {t.department}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      t.priority === 'URGENT' 
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300' 
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                    }`}>
                      {t.priority}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    {t.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {t.description}
                  </p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 pt-1">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      {t.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-blue-500" />
                      Personil: <strong className="text-slate-700 dark:text-slate-200">{t.assignedTo.join(', ')}</strong>
                    </span>
                    <span className="flex items-center gap-1">
                      <HardHat className="w-3.5 h-3.5 text-amber-500" />
                      SPV: <strong>{t.supervisorName}</strong>
                    </span>
                    {t.qcInspectorName && (
                      <span className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold">
                        <FileCheck className="w-3.5 h-3.5" />
                        QC: {t.qcInspectorName}
                      </span>
                    )}
                  </div>

                  {/* Safety Permits required */}
                  {t.safetyPermitsRequired && t.safetyPermitsRequired.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 font-semibold">Izin K3:</span>
                      {t.safetyPermitsRequired.map((perm, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          🛡️ {perm}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right side: Progress Bar & Update Button */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 shrink-0 lg:w-48 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="w-full space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className={`font-extrabold uppercase text-[10px] px-2 py-0.5 rounded ${
                        t.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                          : t.status === 'QC_INSPECTION'
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                      }`}>
                        {t.status.replace('_', ' ')}
                      </span>
                      <span className="font-bold font-mono text-slate-800 dark:text-slate-200">
                        {t.progressPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all ${
                          t.progressPercentage >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                        }`}
                        style={{ width: `${t.progressPercentage}%` }}
                      />
                    </div>
                  </div>

                  {(rbac.canCreate || rbac.canEdit) ? (
                    <button
                      onClick={() => {
                        setUpdatingTask(t);
                        setProgressInput(t.progressPercentage);
                        setStatusInput(t.status);
                        setQcInspectorInput(t.qcInspectorName || '');
                        setNotesInput(t.notes || '');
                      }}
                      className="w-full sm:w-auto lg:w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Perbarui Progres</span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium italic block text-center py-2">
                      Hanya Lihat (View Only)
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Update Progress Modal */}
      {updatingTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                Update Progres & Status Tugas
              </h3>
              <button onClick={() => setUpdatingTask(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              {updatingTask.taskNumber}: <strong>{updatingTask.title}</strong>
            </p>

            <form onSubmit={handleUpdateProgressSubmit} className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Persentase Capaian (%)</span>
                  <span className="text-emerald-600 font-mono text-sm">{progressInput}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progressInput}
                  onChange={(e) => setProgressInput(Number(e.target.value))}
                  className="w-full accent-emerald-600"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Status Pekerjaan
                </label>
                <select
                  value={statusInput}
                  onChange={(e) => setStatusInput(e.target.value as TaskStatus)}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                >
                  <option value="IN_PROGRESS">IN PROGRESS (Sedang Pengerjaan)</option>
                  <option value="QC_INSPECTION">QC INSPECTION (Pemeriksaan Pengawas / NDT)</option>
                  <option value="COMPLETED">COMPLETED (Selesai Penuh)</option>
                  <option value="BLOCKED">BLOCKED (Tertunda / Kendala Material)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Inspektur QC / Surveyor Verifikator
                </label>
                <input
                  type="text"
                  value={qcInspectorInput}
                  onChange={(e) => setQcInspectorInput(e.target.value)}
                  placeholder="Contoh: Ir. Agus Wijaya (BKI Surveyor)"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Catatan Lapangan & Hasil Inspeksi
                </label>
                <textarea
                  rows={2}
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Kondisi pengelasan, tebal pelat baru, kelurusan poros..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setUpdatingTask(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Simpan Progres
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Issue Work Order Modal */}
      {isNewTaskModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  {language === 'en' ? 'Issue New Work Order' : 'Penerbitan Surat Perintah Tugas Lapangan'}
                </h3>
              </div>
              <button onClick={() => setIsNewTaskModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Judul Pekerjaan / Work Order
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Overhaul Katup Butterfly Kargo & Hydrotest"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Kapal Proyek Terkait
                  </label>
                  <select
                    value={newProjectId}
                    onChange={(e) => setNewProjectId(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.shipName} ({p.projectCode})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Departemen / Divisi
                  </label>
                  <select
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  >
                    <option value="STEEL WORK">STEEL WORK (Fabrikasi Lambung)</option>
                    <option value="PIPING">PIPING (Perpipaan Kargo & Ballast)</option>
                    <option value="ELECTRICAL">ELECTRICAL & INSTRUMENT</option>
                    <option value="MACHINERY">MACHINERY & PROPULSION</option>
                    <option value="COATING">BLASTING & COATING</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Lokasi Pekerjaan
                  </label>
                  <input
                    type="text"
                    required
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    placeholder="Contoh: Graving Drydock 1 / Tangki 2P"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Target Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Uraian Detail Spesifikasi & Prosedur Pekerjaan
                </label>
                <textarea
                  required
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Langkah pengerjaan, batas toleransi, dan standar pengujian..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Izin Keselamatan Kerja K3 Diperlukan (Safety Permits)
                </label>
                <div className="flex flex-wrap gap-2 text-xs">
                  {['Hot Work Permit', 'Confined Space Entry', 'Gas Free Clearance', 'Working at Height', 'Radiation Exclusion Zone'].map((perm) => (
                    <label key={perm} className="flex items-center gap-1.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newPermits.includes(perm)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewPermits([...newPermits, perm]);
                          } else {
                            setNewPermits(newPermits.filter(p => p !== perm));
                          }
                        }}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{perm}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  Terbitkan Surat Tugas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
