import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Ship, 
  Calendar, 
  TrendingUp, 
  Plus, 
  Edit3, 
  Layers, 
  CheckSquare, 
  ChevronRight,
  FileCheck,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRBAC } from '../../hooks/useRBAC';
import { projectDb } from '../../services/projectDb';
import { ShipProject, ProgressMilestone } from '../../types/project';

export const ProjectProgressPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useTheme();
  const rbac = useRBAC('projects-progress');
  const isPrivileged = rbac.isCreator || rbac.isAdmin;

  const [projects, setProjects] = useState<ShipProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('prj-001');
  const [milestones, setMilestones] = useState<ProgressMilestone[]>([]);

  // Editing milestone state
  const [editingMilestone, setEditingMilestone] = useState<ProgressMilestone | null>(null);

  const loadData = () => {
    const list = projectDb.getProjects();
    setProjects(list);
    if (list.length > 0 && !selectedProjectId) {
      setSelectedProjectId(list[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      setMilestones(projectDb.getMilestones(selectedProjectId));
    }
  }, [selectedProjectId]);

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  const handleUpdateMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rbac.canEdit && !rbac.canCreate) {
      alert('Akses Ditolak: Anda tidak memiliki izin untuk memperbarui progres milestone.');
      return;
    }
    if (!editingMilestone) return;

    projectDb.saveMilestone(editingMilestone);
    setMilestones(projectDb.getMilestones(selectedProjectId));
    setEditingMilestone(null);
  };

  if (!rbac.canAccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-3xl p-8 text-center shadow-xl">
          <Activity className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Akses Dibatasi</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Akun Anda tidak memiliki izin untuk mengakses modul <strong>Progres Fabrikasi & Kurva S</strong>. Hubungi Administrator atau Creator untuk memperbarui matriks izin pada halaman Izin Akses Pengguna.
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
              <span>{t('menu.projects.progress')}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Activity className="w-6 h-6 text-emerald-500" />
              <span>{t('proj.progress.title')}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('proj.progress.desc')}
            </p>
          </div>

          {/* Project Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Pilih Kapal Proyek:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs max-w-xs"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectCode} · {p.shipName} ({p.progressPercentage}%)
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeProject && (
          <div className="space-y-6">
            
            {/* Top Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500">Total Progres Kapal</span>
                  <span className="font-mono text-xl font-extrabold text-blue-600 dark:text-blue-400">
                    {activeProject.progressPercentage}%
                  </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{ width: `${activeProject.progressPercentage}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-400">
                  Target Penyelesaian: <strong>{activeProject.targetDate}</strong>
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2">
                <p className="text-xs font-semibold text-slate-500">Informasi Galangan & Tipe</p>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white truncate">
                  {activeProject.shipName}
                </p>
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <span>{activeProject.location}</span>
                  <span>·</span>
                  <span>{activeProject.vesselType}</span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  Klasifikasi: {activeProject.classificationSociety}
                </p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2">
                <p className="text-xs font-semibold text-slate-500">Status Tahapan Kerja</p>
                <div className="flex items-center gap-4 text-xs pt-1">
                  <div>
                    <p className="text-lg font-mono font-bold text-emerald-600">
                      {milestones.filter((m) => m.status === 'done').length}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Selesai</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                  <div>
                    <p className="text-lg font-mono font-bold text-blue-600">
                      {milestones.filter((m) => m.status === 'in_progress').length}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Sedang Proses</p>
                  </div>
                  <div className="w-px h-8 bg-slate-200 dark:bg-slate-700" />
                  <div>
                    <p className="text-lg font-mono font-bold text-slate-400">
                      {milestones.filter((m) => m.status === 'pending').length}
                    </p>
                    <p className="text-[10px] text-slate-400 uppercase font-bold">Menunggu</p>
                  </div>
                </div>
              </div>

            </div>

            {/* Visual S-Curve (Kurva-S) Simulation */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Monitoring Kurva-S Progres Galangan (Rencana vs Realisasi)
                  </h3>
                </div>
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-blue-500" />
                    <span>Rencana Target (Cumulative Planned)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500" />
                    <span>Realisasi Lapangan (Actual Progress)</span>
                  </div>
                </div>
              </div>

              {/* S-Curve Bars Visualization */}
              <div className="space-y-3 pt-2">
                {milestones.map((m, idx) => {
                  const cumPlanned = milestones.slice(0, idx + 1).reduce((acc, curr) => acc + curr.plannedPercent, 0);
                  const cumActual = milestones.slice(0, idx + 1).reduce((acc, curr) => acc + curr.actualPercent, 0);

                  return (
                    <div key={m.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300 truncate max-w-md">
                          {m.phaseName}
                        </span>
                        <div className="flex items-center gap-3 font-mono text-[11px]">
                          <span className="text-blue-600 dark:text-blue-400 font-bold">Rencana: {m.plannedPercent}%</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">Realisasi: {m.actualPercent}%</span>
                          {(rbac.canEdit || rbac.canCreate) && (
                            <button
                              onClick={() => setEditingMilestone({ ...m })}
                              className="text-slate-400 hover:text-blue-600 font-sans"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(m.plannedPercent / 35) * 100}%` }} />
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(m.actualPercent / 35) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Milestone Detail Checklist */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-blue-500" />
                <span>Rincian Milestone Tahapan Pengerjaan</span>
              </h3>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {milestones.map((m) => (
                  <div key={m.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${
                          m.status === 'done' ? 'bg-emerald-500' : m.status === 'in_progress' ? 'bg-blue-500 animate-pulse' : 'bg-slate-300'
                        }`} />
                        <h4 className="font-bold text-slate-900 dark:text-white">{m.phaseName}</h4>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-4">{m.notes}</p>
                    </div>

                    <div className="flex items-center gap-3 pl-4 sm:pl-0 shrink-0">
                      <div className="text-right">
                        <p className="font-mono font-bold text-blue-600 dark:text-blue-400">{m.actualPercent}% / {m.plannedPercent}%</p>
                        <p className="text-[10px] text-slate-400">Target: {m.targetDate}</p>
                      </div>

                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        m.status === 'done'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : m.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                      }`}>
                        {m.status === 'done' ? 'Selesai' : m.status === 'in_progress' ? 'Proses' : 'Menunggu'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* Edit Milestone Modal */}
        {editingMilestone && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-5 space-y-4 animate-in zoom-in-95 duration-150">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Perbarui Progres Milestone
              </h3>
              <p className="text-xs text-slate-500">{editingMilestone.phaseName}</p>

              <form onSubmit={handleUpdateMilestone} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold mb-1">Realisasi Persentase (%):</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={editingMilestone.actualPercent}
                    onChange={(e) => setEditingMilestone({ ...editingMilestone, actualPercent: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Status Tahapan:</label>
                  <select
                    value={editingMilestone.status}
                    onChange={(e) => setEditingMilestone({ ...editingMilestone, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold"
                  >
                    <option value="pending">Menunggu (Pending)</option>
                    <option value="in_progress">Sedang Pengerjaan (In Progress)</option>
                    <option value="done">Selesai (Done)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Catatan Lapangan & Temuan:</label>
                  <textarea
                    rows={3}
                    value={editingMilestone.notes}
                    onChange={(e) => setEditingMilestone({ ...editingMilestone, notes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingMilestone(null)}
                    className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-sm"
                  >
                    Simpan Perubahan
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
