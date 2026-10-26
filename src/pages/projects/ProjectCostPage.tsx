import React, { useState, useEffect } from 'react';
import { 
  DollarSign, 
  Lock, 
  ShieldAlert, 
  ShieldCheck, 
  Download, 
  Plus, 
  FileSpreadsheet, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  PieChart, 
  Ship, 
  Calendar, 
  CheckCircle2, 
  X,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRBAC } from '../../hooks/useRBAC';
import { projectDb } from '../../services/projectDb';
import { ShipProject, ProjectCostItem } from '../../types/project';

export const ProjectCostPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { t } = useTheme();
  const rbac = useRBAC('projects-cost');

  const [projects, setProjects] = useState<ShipProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('prj-001');
  const [costs, setCosts] = useState<ProjectCostItem[]>([]);

  // Modal new entry
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<Partial<ProjectCostItem>>({
    category: 'MATERIAL',
    description: '',
    budgetAmount: 100000000,
    actualAmount: 90000000,
    approvedBy: currentUser?.fullName || 'MUHAMMAD ANDRI',
    date: new Date().toISOString().split('T')[0],
  });

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
      setCosts(projectDb.getCosts(selectedProjectId));
    }
  }, [selectedProjectId]);

  const activeProject = projects.find((p) => p.id === selectedProjectId);

  // If NOT authorized, display Access Denied Screen
  if (!rbac.canAccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4 shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            {t('common.access_denied')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            Halaman <strong>Biaya Proyek & Margin Keuntungan</strong> merupakan dokumen finansial yang dilindungi sistem dan memerlukan otorisasi eksekutif khusus atau izin dari Creator/Administrator.
          </p>
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-[11px] font-mono text-slate-600 dark:text-slate-300">
            Peran Anda saat ini: <strong className="uppercase text-blue-600 dark:text-blue-400">{currentUser?.role || 'TIDAK TERDAFTAR'}</strong>
          </div>
          <p className="text-[10px] text-slate-400">
            Silakan hubungi Administrator atau Creator jika Anda membutuhkan wewenang akses finansial ini.
          </p>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalBudget = costs.reduce((sum, c) => sum + c.budgetAmount, 0);
  const totalActual = costs.reduce((sum, c) => sum + c.actualAmount, 0);
  const totalVariance = totalBudget - totalActual;
  const marginPercent = activeProject?.budgetTotal 
    ? Math.round(((activeProject.budgetTotal - totalActual) / activeProject.budgetTotal) * 1000) / 10
    : 25.0;

  const handleExport = async () => {
    if (!rbac.canDownload) {
      alert('Akses Ditolak: Anda tidak memiliki izin untuk mengunduh laporan biaya.');
      return;
    }
    const blob = await projectDb.exportCostsToExcel(selectedProjectId);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LAPORAN_BIAYA_PROYEK_${activeProject?.projectCode || 'ALL'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveCost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rbac.canCreate && !rbac.canEdit) {
      alert('Akses Ditolak: Anda tidak memiliki izin untuk menambah item anggaran biaya.');
      return;
    }
    if (!formData.description) return;

    const budget = Number(formData.budgetAmount) || 0;
    const actual = Number(formData.actualAmount) || 0;

    projectDb.saveCost({
      id: `cst-${Date.now()}`,
      projectId: selectedProjectId,
      category: formData.category || 'MATERIAL',
      description: formData.description,
      budgetAmount: budget,
      actualAmount: actual,
      variance: budget - actual,
      approvedBy: currentUser?.fullName || 'MUHAMMAD ANDRI',
      date: formData.date || new Date().toISOString().split('T')[0],
    } as ProjectCostItem);

    setCosts(projectDb.getCosts(selectedProjectId));
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1">
              <span>{t('sidebar.group.projects')}</span>
              <span>/</span>
              <span>Biaya Proyek (Khusus Creator)</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
              <DollarSign className="w-6 h-6 text-amber-500" />
              <span>{t('proj.cost.title')}</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                🛡️ Creator Only
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('proj.cost.desc')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {rbac.canDownload && (
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5 text-blue-500" />
                <span>Ekspor Excel Keuangan (.xlsx)</span>
              </button>
            )}

            {(rbac.canCreate || rbac.canEdit) && (
              <button
                onClick={() => {
                  setFormData({
                    category: 'MATERIAL',
                    description: '',
                    budgetAmount: 150000000,
                    actualAmount: 130000000,
                    approvedBy: currentUser?.fullName || 'MUHAMMAD ANDRI',
                    date: new Date().toISOString().split('T')[0],
                  });
                  setIsModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Item Anggaran</span>
              </button>
            )}
          </div>
        </div>

        {/* Project Selector Bar */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Ship className="w-4 h-4 text-blue-500 shrink-0" />
            <span className="text-xs font-semibold text-slate-500">Pilih Proyek Kapal:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-3.5 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.projectCode} · {p.shipName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Pemilik: <strong>{activeProject?.owner}</strong></span>
            <span>·</span>
            <span>Lokasi: <strong>{activeProject?.location}</strong></span>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Total Anggaran (RAB)
            </span>
            <p className="font-mono text-xl font-extrabold text-slate-900 dark:text-white">
              Rp {totalBudget.toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] text-slate-400">Pagu anggaran yang disetujui</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Realisasi Pengeluaran
            </span>
            <p className="font-mono text-xl font-extrabold text-blue-600 dark:text-blue-400">
              Rp {totalActual.toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] text-slate-400">Pengeluaran material & upah aktual</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Efisiensi / Penghematan
            </span>
            <p className={`font-mono text-xl font-extrabold ${totalVariance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              Rp {totalVariance.toLocaleString('id-ID')}
            </p>
            <p className="text-[10px] text-slate-400">{totalVariance >= 0 ? 'Surplus / Hemat' : 'Defisit Anggaran'}</p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
              Estimasi Margin Laba
            </span>
            <p className="font-mono text-xl font-extrabold text-amber-600 dark:text-amber-400">
              +{marginPercent}%
            </p>
            <p className="text-[10px] text-slate-400">Estimasi margin laba bersih galangan</p>
          </div>

        </div>

        {/* Cost Items Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-amber-500" />
              <span>Rincian Biaya per Pos Pekerjaan</span>
            </h3>
            <span className="text-xs font-mono font-bold text-slate-400">
              {costs.length} Item Terdata
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 font-bold border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="p-3">Kategori</th>
                  <th className="p-3">Uraian / Keterangan</th>
                  <th className="p-3 text-right">Anggaran (IDR)</th>
                  <th className="p-3 text-right">Realisasi (IDR)</th>
                  <th className="p-3 text-right">Selisih</th>
                  <th className="p-3">Disetujui Oleh</th>
                  <th className="p-3">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {costs.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {c.category}
                      </span>
                    </td>
                    <td className="p-3 font-semibold max-w-xs">{c.description}</td>
                    <td className="p-3 text-right font-mono font-bold">
                      {c.budgetAmount.toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                      {c.actualAmount.toLocaleString('id-ID')}
                    </td>
                    <td className={`p-3 text-right font-mono font-bold ${c.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {c.variance >= 0 ? `+${c.variance.toLocaleString('id-ID')}` : c.variance.toLocaleString('id-ID')}
                    </td>
                    <td className="p-3 text-slate-500 font-semibold">{c.approvedBy}</td>
                    <td className="p-3 font-mono text-slate-400">{c.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Form Tambah Item */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-5 space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-amber-500" />
                  <span>Tambah Item Anggaran Biaya</span>
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveCost} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold mb-1">Kategori Biaya*</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <option value="MATERIAL">MATERIAL (Pelat, Cat, Kawat Las)</option>
                    <option value="LABOR">LABOR (Upah Tenaga Kerja)</option>
                    <option value="DOCK_RENTAL">DOCK_RENTAL (Sewa Graving Drydock)</option>
                    <option value="SUBCONTRACTOR">SUBCONTRACTOR (Uji NDT/Spesialis)</option>
                    <option value="EQUIPMENT">EQUIPMENT (Rental Crane/Kompresor)</option>
                    <option value="OVERHEAD">OVERHEAD (BKI/Listrik/Keamanan)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold mb-1">Uraian / Deskripsi Rincian*</label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Contoh: Pengadaan 50 Kaleng Cat Antifouling"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Pagu Anggaran (IDR)*</label>
                    <input
                      type="number"
                      required
                      value={formData.budgetAmount}
                      onChange={(e) => setFormData({ ...formData, budgetAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Realisasi Aktual (IDR)*</label>
                    <input
                      type="number"
                      required
                      value={formData.actualAmount}
                      onChange={(e) => setFormData({ ...formData, actualAmount: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
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
                    className="px-4 py-2 bg-amber-600 text-white font-bold rounded-xl hover:bg-amber-700 shadow-sm"
                  >
                    Simpan Biaya
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
