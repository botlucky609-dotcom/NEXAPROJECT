import React, { useState, useEffect } from 'react';
import { 
  HardHat, 
  Search, 
  Phone, 
  Mail, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Award, 
  Plus, 
  Ship, 
  User, 
  Building, 
  X,
  FileCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRBAC } from '../../hooks/useRBAC';
import { projectDb } from '../../services/projectDb';
import { ProjectSupervisor } from '../../types/project';

export const ProjectSupervisorsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useTheme();
  const rbac = useRBAC('projects-supervisors');
  const isPrivileged = rbac.isCreator || rbac.isAdmin;

  const [supervisors, setSupervisors] = useState<ProjectSupervisor[]>([]);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<string>('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<ProjectSupervisor>>({
    fullName: '',
    employeeId: 'EMP-001',
    role: 'HULL & STEEL SUPERVISOR',
    phone: '',
    email: '',
    assignedProjectCode: 'PRJ-2026-001',
    assignedShipName: 'MV OCEANIC LEADER',
    status: 'ON_DUTY',
    lastInspectionDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
    certifications: '',
  });

  const loadData = () => {
    setSupervisors(projectDb.getSupervisors());
  };

  useEffect(() => {
    loadData();
  }, []);

  const filtered = supervisors.filter((s) => {
    const matchesSearch = 
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.assignedShipName.toLowerCase().includes(search.toLowerCase()) ||
      s.role.toLowerCase().includes(search.toLowerCase()) ||
      s.employeeId.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === 'ALL' || s.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rbac.canCreate && !rbac.canEdit) {
      alert('Akses Ditolak: Anda tidak memiliki izin untuk menambah/mengubah penugasan pengawas.');
      return;
    }
    if (!formData.fullName) return;

    projectDb.saveSupervisor({
      ...formData,
      id: formData.id || `spv-${Date.now()}`,
    } as ProjectSupervisor);

    setIsModalOpen(false);
    loadData();
  };

  if (!rbac.canAccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-3xl p-8 text-center shadow-xl">
          <HardHat className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Akses Dibatasi</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Akun Anda tidak memiliki izin untuk mengakses modul <strong>Tim Supervisi & Koordinator</strong>. Hubungi Administrator atau Creator untuk memperbarui matriks izin pada halaman Izin Akses Pengguna.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
              <span>{t('sidebar.group.projects')}</span>
              <span>/</span>
              <span>{t('menu.projects.supervisors')}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
              <HardHat className="w-6 h-6 text-amber-500" />
              <span>{t('proj.supervisors.title')}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('proj.supervisors.desc')}
            </p>
          </div>

          {(rbac.canCreate || rbac.canEdit) && (
            <button
              onClick={() => {
                setFormData({
                  id: `spv-${Date.now()}`,
                  fullName: '',
                  employeeId: `EMP-${(supervisors.length + 1).toString().padStart(3, '0')}`,
                  role: 'HULL & STEEL SUPERVISOR',
                  phone: '',
                  email: '',
                  assignedProjectCode: 'PRJ-2026-001',
                  assignedShipName: 'MV OCEANIC LEADER',
                  status: 'ON_DUTY',
                  lastInspectionDate: new Date().toISOString().replace('T', ' ').slice(0, 16),
                  certifications: 'BKI / AWS Certified',
                });
                setIsModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Penugasan Pengawas</span>
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari pengawas, kapal penugasan, sertifikasi..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-white"
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="w-full md:w-auto px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
          >
            <option value="ALL">Semua Bidang Keahlian</option>
            <option value="SUPERINTENDENT">Superintendent</option>
            <option value="HULL & STEEL SUPERVISOR">Hull & Steel Supervisor</option>
            <option value="PIPING SUPERVISOR">Piping Supervisor</option>
            <option value="WELDING INSPECTOR (WI)">Welding Inspector (WI)</option>
            <option value="PAINTING & BLASTING QC">Painting & Blasting QC</option>
            <option value="HSE SAFETY OFFICER">HSE Safety Officer</option>
          </select>
        </div>

        {/* Supervisors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-blue-500/50 transition flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold text-sm shrink-0">
                      <HardHat className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900 dark:text-white uppercase truncate">
                        {s.fullName}
                      </h3>
                      <p className="text-[10px] font-mono text-slate-400 font-bold">{s.employeeId}</p>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase shrink-0 ${
                    s.status === 'ON_DUTY'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : s.status === 'STANDBY'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                  }`}>
                    {s.status === 'ON_DUTY' ? 'Bertugas' : s.status === 'STANDBY' ? 'Standby' : 'Libur'}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Bidang:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400 text-[11px]">{s.role}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Kapal:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-[11px] truncate max-w-[170px]">{s.assignedShipName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Inspeksi Terakhir:</span>
                    <span className="font-mono text-slate-600 dark:text-slate-300 text-[10px]">{s.lastInspectionDate}</span>
                  </div>
                </div>

                <div className="space-y-1 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    <span className="font-mono text-[11px]">{s.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate text-[11px]">{s.email}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-start gap-1.5 text-[11px] text-slate-500">
                  <Award className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="leading-tight">{s.certifications}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Form */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-150">
              
              <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <HardHat className="w-5 h-5 text-amber-500" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Form Penugasan Pengawas Lapangan
                  </h2>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold mb-1">Nama Lengkap Pengawas*</label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Peran Pengawas / Bidang Keahlian*</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    <option value="SUPERINTENDENT">Superintendent</option>
                    <option value="HULL & STEEL SUPERVISOR">Hull & Steel Supervisor</option>
                    <option value="PIPING SUPERVISOR">Piping Supervisor</option>
                    <option value="WELDING INSPECTOR (WI)">Welding Inspector (WI)</option>
                    <option value="PAINTING & BLASTING QC">Painting & Blasting QC</option>
                    <option value="HSE SAFETY OFFICER">HSE Safety Officer</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Kapal Penugasan*</label>
                  <input
                    type="text"
                    required
                    value={formData.assignedShipName}
                    onChange={(e) => setFormData({ ...formData, assignedShipName: e.target.value.toUpperCase() })}
                    placeholder="MV OCEANIC LEADER"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Nomor HP / WhatsApp*</label>
                    <input
                      type="text"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="0812-xxxx-xxxx"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Status Kehadiran*</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="ON_DUTY">Bertugas di Galangan</option>
                      <option value="STANDBY">Standby</option>
                      <option value="OFF_DUTY">Libur / Istirahat</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Sertifikasi & Lisensi Resmi</label>
                  <input
                    type="text"
                    value={formData.certifications}
                    onChange={(e) => setFormData({ ...formData, certifications: e.target.value })}
                    placeholder="Contoh: Certified Welding Inspector CSWIP 3.1, NDT Level II"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-sm"
                  >
                    Simpan Pengawas
                  </button>
                </div>
              </form>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
