import React, { useState, useEffect } from 'react';
import { 
  Ship, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight, 
  Anchor, 
  MapPin, 
  Layers, 
  FileSpreadsheet, 
  DollarSign, 
  ShieldCheck, 
  User, 
  Building, 
  X,
  Edit3,
  Trash2,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../hooks/useRBAC';
import { useTheme } from '../../context/ThemeContext';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { projectDb } from '../../services/projectDb';
import { ShipProject, ProjectStatus, VesselType, ProjectScope } from '../../types/project';

export const ProjectListPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useTheme();
  // Strict RBAC Hook: Creator gets 100% full authority; Admin & Karyawan strictly adhere to Izin Akses Pengguna
  const { isCreator, canCreate, canEdit, canDelete, canDownload } = useRBAC('projects-list');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projects, setProjects] = useState<ShipProject[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Modal New / Edit Project
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<ShipProject>>({
    projectCode: '',
    shipName: '',
    vesselType: 'Bulk Carrier',
    deadweightTonnage: 10000,
    lengthOverall: 120,
    beam: 20,
    owner: '',
    flag: 'Indonesia',
    classificationSociety: 'BKI',
    projectType: 'Ship Repair',
    location: 'Graving Drydock 1',
    startDate: new Date().toISOString().split('T')[0],
    targetDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
    status: 'in_progress',
    progressPercentage: 10,
    budgetTotal: 2000000000,
    actualCost: 1500000000,
    estimatedMargin: 25.0,
    assignedSupervisors: ['MUHAMMAD ANDRI', 'BAMBANG SETIAWAN'],
    description: '',
  });

  const loadData = () => {
    setProjects(projectDb.getProjects());
  };

  useEffect(() => {
    loadData();
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const filtered = projects.filter((p) => {
    const matchesSearch = 
      p.shipName.toLowerCase().includes(search.toLowerCase()) ||
      p.projectCode.toLowerCase().includes(search.toLowerCase()) ||
      p.owner.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || p.status === filterStatus;
    const matchesType = filterType === 'ALL' || p.vesselType === filterType;

    return matchesSearch && matchesStatus && matchesType;
  });

  const handleOpenAdd = () => {
    setEditingId(null);
    setFormData({
      id: `prj-${Date.now()}`,
      projectCode: `PRJ-2026-${(projects.length + 1).toString().padStart(3, '0')}`,
      shipName: '',
      vesselType: 'Bulk Carrier',
      deadweightTonnage: 15000,
      lengthOverall: 135,
      beam: 22,
      owner: '',
      flag: 'Indonesia',
      classificationSociety: 'BKI',
      projectType: 'Ship Repair',
      location: 'Graving Drydock 1',
      startDate: new Date().toISOString().split('T')[0],
      targetDate: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().split('T')[0],
      status: 'in_progress',
      progressPercentage: 5,
      budgetTotal: 2500000000,
      actualCost: 0,
      estimatedMargin: 20.0,
      assignedSupervisors: ['BAMBANG SETIAWAN'],
      description: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: ShipProject) => {
    setEditingId(p.id);
    setFormData({ ...p });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.shipName || !formData.projectCode) {
      alert('Nama kapal dan kode proyek wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await projectDb.saveProject(formData as ShipProject);
      setIsModalOpen(false);
      loadData();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!canDelete) {
      alert('Akses Ditolak: Anda tidak memiliki otoritas untuk menghapus data proyek kapal.');
      return;
    }
    if (window.confirm(`Hapus proyek "${name}"? Data proyek dan milestone terkait akan dihapus.`)) {
      await projectDb.deleteProject(id);
      loadData();
    }
  };

  const handleExport = async () => {
    if (!canDownload) {
      alert('Akses Ditolak: Anda tidak memiliki otoritas untuk mengunduh laporan proyek kapal.');
      return;
    }
    const blob = await projectDb.exportProjectsToExcel();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DAFTAR_PROYEK_KAPAL_NEXAPROJECT_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
              <span>{t('sidebar.group.projects')}</span>
              <span>/</span>
              <span>{t('menu.projects.list')}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Ship className="w-6 h-6 text-blue-600" />
              <span>{t('proj.list.title')}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('proj.list.desc')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canDownload && (
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
                title="Unduh Laporan Excel (.xlsx)"
              >
                <Download className="w-3.5 h-3.5 text-blue-500" />
                <span className="hidden sm:inline">Ekspor Excel</span>
              </button>
            )}

            {(canCreate || canEdit) && (
              <button
                onClick={handleOpenAdd}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Proyek Kapal</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kapal, pemilik, kode proyek, lokasi..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="ALL">Semua Status</option>
              <option value="in_progress">Sedang Berjalan</option>
              <option value="completed">Selesai (Completed)</option>
              <option value="on_hold">Tertunda (On Hold)</option>
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              <option value="ALL">Semua Jenis Kapal</option>
              <option value="Bulk Carrier">Bulk Carrier</option>
              <option value="Oil / Chemical Tanker">Oil / Chemical Tanker</option>
              <option value="Ocean Tugboat">Ocean Tugboat</option>
              <option value="Container Ship">Container Ship</option>
              <option value="Cargo Vessel">Cargo Vessel</option>
            </select>
          </div>
        </div>

        {/* Project Cards Grid */}
        {isLoading ? (
          <div className="py-8">
            <LoadingScreen
              variant="inline"
              text="Memuat Data Proyek Galangan..."
              subtext="Mengambil armada kapal, jadwal docking, dan status progres pengerjaan..."
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-blue-500/50 transition flex flex-col justify-between"
            >
              <div className="space-y-4">
                
                {/* Header: Ship Name & Status */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                        {p.projectCode}
                      </span>
                      <span className="text-[11px] text-slate-400">·</span>
                      <span className="text-[11px] font-semibold text-slate-500">{p.vesselType}</span>
                    </div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white uppercase tracking-tight">
                      {p.shipName}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Owner: <strong className="text-slate-700 dark:text-slate-300">{p.owner}</strong>
                    </p>
                  </div>

                  <span className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase shrink-0 ${
                    p.status === 'completed'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : p.status === 'in_progress'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  }`}>
                    {p.status === 'completed' ? 'Selesai' : p.status === 'in_progress' ? 'Berjalan' : 'Tertunda'}
                  </span>
                </div>

                {/* Technical Specs Tags */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-[11px]">
                  <div>
                    <p className="text-slate-400 text-[10px]">Bobot Kapal:</p>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{p.deadweightTonnage.toLocaleString()} DWT</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px]">Dimensi (LOA x B):</p>
                    <p className="font-mono font-bold text-slate-800 dark:text-slate-200">{p.lengthOverall}m x {p.beam}m</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-[10px]">Klasifikasi:</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate">{p.classificationSociety.split(' ')[0]}</p>
                  </div>
                </div>

                {/* Location & Scope */}
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300 pt-1">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    <span>{p.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span>{p.startDate} s/d {p.targetDate}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-500">Realisasi Pekerjaan:</span>
                    <span className="font-bold font-mono text-blue-600 dark:text-blue-400">{p.progressPercentage}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all ${
                        p.progressPercentage === 100 ? 'bg-emerald-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${p.progressPercentage}%` }}
                    />
                  </div>
                </div>

                {/* Supervisors on site */}
                <div className="text-[11px] text-slate-500">
                  <span>Pengawas Lapangan: </span>
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {p.assignedSupervisors.join(', ')}
                  </span>
                </div>

              </div>

              {/* Action Footer (RBAC Guarded) */}
              {(canEdit || canDelete) ? (
                <div className="flex items-center justify-end gap-2 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                  {canEdit && (
                    <button
                      onClick={() => handleOpenEdit(p)}
                      className="p-1.5 rounded-lg text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition"
                      title="Ubah Data Proyek"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(p.id, p.shipName)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                      title="Hapus Proyek"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                  <span>Status: Terverifikasi Dok</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">Hanya Lihat</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

        {/* Modal Form Tambah / Edit Proyek */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-2xl my-8 overflow-hidden animate-in zoom-in-95 duration-150">
              
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Ship className="w-5 h-5 text-blue-600" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    {editingId ? 'Ubah Data Proyek Kapal' : 'Pendaftaran Proyek Kapal Baru'}
                  </h2>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-5 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Kode Proyek*</label>
                    <input
                      type="text"
                      required
                      value={formData.projectCode}
                      onChange={(e) => setFormData({ ...formData, projectCode: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Nama Kapal (Vessel Name)*</label>
                    <input
                      type="text"
                      required
                      value={formData.shipName}
                      onChange={(e) => setFormData({ ...formData, shipName: e.target.value.toUpperCase() })}
                      placeholder="Contoh: MV OCEANIC LEADER"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tipe Kapal*</label>
                    <select
                      value={formData.vesselType}
                      onChange={(e) => setFormData({ ...formData, vesselType: e.target.value as VesselType })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="Bulk Carrier">Bulk Carrier</option>
                      <option value="Oil / Chemical Tanker">Oil / Chemical Tanker</option>
                      <option value="Container Ship">Container Ship</option>
                      <option value="Ocean Tugboat">Ocean Tugboat</option>
                      <option value="Cargo Vessel">Cargo Vessel</option>
                      <option value="Offshore Barge">Offshore Barge</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tipe Proyek Pekerjaan*</label>
                    <select
                      value={formData.projectType}
                      onChange={(e) => setFormData({ ...formData, projectType: e.target.value as ProjectScope })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="Ship Repair">Ship Repair (Perbaikan)</option>
                      <option value="Annual Docking (SS/DS)">Annual Docking (SS/DS)</option>
                      <option value="Special Survey">Special Survey (5 Tahunan)</option>
                      <option value="New Building">New Building (Pembangunan Baru)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Pemilik Kapal (Shipowner)*</label>
                    <input
                      type="text"
                      required
                      value={formData.owner}
                      onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                      placeholder="Nama PT / Perusahaan Pemilik"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Lokasi Galangan*</label>
                    <input
                      type="text"
                      required
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Graving Drydock 1 / Slipway A / Berth 2"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Tanggal Mulai Docking*</label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Target Selesai Undocking*</label>
                    <input
                      type="date"
                      required
                      value={formData.targetDate}
                      onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Status Proyek*</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as ProjectStatus })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
                    >
                      <option value="in_progress">Sedang Berjalan (In Progress)</option>
                      <option value="completed">Selesai (Completed)</option>
                      <option value="on_hold">Tertunda (On Hold)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Progres Pekerjaan (%)*</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={formData.progressPercentage}
                      onChange={(e) => setFormData({ ...formData, progressPercentage: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Deskripsi Ruang Lingkup Pekerjaan</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Contoh: Pemotongan pelat bottom, penggantian zink anode, cat lambung, overhaul katup laut..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none shadow-sm flex items-center gap-2"
                  >
                    {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Proyek'}</span>
                  </button>
                </div>
              </form>

              {/* Overlay Loader during Project Save */}
              {isSubmitting && (
                <LoadingScreen
                  variant="overlay"
                  text="Menyimpan Data Proyek..."
                  subtext="Menyinkronkan spesifikasi kapal dan jadwal docking ke sistem..."
                />
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
