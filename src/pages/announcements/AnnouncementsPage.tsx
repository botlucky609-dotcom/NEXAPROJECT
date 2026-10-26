import React, { useState } from 'react';
import { 
  Bell, 
  Plus, 
  Download, 
  Search, 
  Pin, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Info, 
  Users, 
  X,
  Shield,
  ThumbsUp
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRBAC } from '../../hooks/useRBAC';
import { taskAnnouncementDb } from '../../services/taskAnnouncementDb';
import { ShipyardAnnouncement, AnnouncementPriority } from '../../types/taskAnnouncement';

export const AnnouncementsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const rbac = useRBAC('announcements');
  const userRole = currentUser?.role || 'karyawan';
  const { t, language } = useTheme();

  const [announcements, setAnnouncements] = useState<ShipyardAnnouncement[]>(() => taskAnnouncementDb.getAnnouncements());
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'SAFETY_HSE' | 'OPERATIONAL' | 'TECHNICAL' | 'MANAGEMENT'>('SAFETY_HSE');
  const [newPriority, setNewPriority] = useState<AnnouncementPriority>('NORMAL');
  const [newTargetDept, setNewTargetDept] = useState('SELURUH PERSONIL GALANGAN');
  const [newValidUntil, setNewValidUntil] = useState(new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0]);
  const [newContent, setNewContent] = useState('');
  const [newIsPinned, setNewIsPinned] = useState(false);

  const reloadData = () => {
    setAnnouncements(taskAnnouncementDb.getAnnouncements());
  };

  const handleExportExcel = async () => {
    if (!rbac.canDownload) {
      setFeedbackMsg({ type: 'error', text: 'Akses Ditolak: Anda tidak memiliki izin untuk mengunduh data pengumuman.' });
      return;
    }
    try {
      const blob = await taskAnnouncementDb.exportAnnouncementsToExcel();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NEXAPROJECT_Pengumuman_Resmi_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Gagal mengekspor file Excel pengumuman.' });
    }
  };

  const handleCreateAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rbac.canCreate && !rbac.canEdit) {
      setFeedbackMsg({ type: 'error', text: 'Akses Ditolak: Anda tidak memiliki izin untuk membuat pengumuman.' });
      return;
    }
    if (!newTitle.trim() || !newContent.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Judul dan isi instruksi pengumuman wajib diisi.' });
      return;
    }

    const res = taskAnnouncementDb.saveAnnouncement(
      {
        title: newTitle,
        category: newCategory,
        priority: newPriority,
        targetDepartment: newTargetDept,
        validUntil: newValidUntil,
        content: newContent,
        isPinned: newIsPinned,
      },
      userRole,
      currentUser?.email || '',
      currentUser?.fullName || 'STAFF HSE'
    );

    if (res.success) {
      setFeedbackMsg({ type: 'success', text: res.message });
      setIsNewModalOpen(false);
      reloadData();
      setNewTitle('');
      setNewContent('');
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  const handleAcknowledge = (id: string) => {
    taskAnnouncementDb.acknowledgeAnnouncement(id);
    reloadData();
  };

  const handleDelete = (id: string) => {
    if (!rbac.canDelete) {
      setFeedbackMsg({ type: 'error', text: 'Akses Ditolak: Anda tidak memiliki izin untuk menghapus pengumuman.' });
      return;
    }
    if (!confirm('Apakah Anda yakin ingin menghapus pengumuman ini?')) return;
    const res = taskAnnouncementDb.deleteAnnouncement(id, userRole, currentUser?.email || '');
    if (res.success) {
      setFeedbackMsg({ type: 'success', text: res.message });
      reloadData();
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  const filteredAnnouncements = announcements.filter(a => {
    const matchesSearch = 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.targetDepartment.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || a.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  if (!rbac.canAccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-3xl p-8 text-center shadow-xl">
          <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Akses Dibatasi</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Akun Anda tidak memiliki izin untuk mengakses modul <strong>Pengumuman Galangan</strong>. Hubungi Administrator atau Creator untuk memperbarui matriks izin pada halaman Izin Akses Pengguna.
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
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'en' ? 'Shipyard HSE & Official Announcements' : 'Pengumuman Resmi & Keselamatan Kerja K3'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {language === 'en'
                  ? 'Official safety briefings, hot work permits, weather alerts, and operational directives'
                  : 'Pemberitahuan resmi briefing harian, instruksi izin kerja panas, peringatan cuaca, dan arahan lapangan'}
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
              <span>{language === 'en' ? 'Export (.xlsx)' : 'Ekspor Excel (.xlsx)'}</span>
            </button>
          )}

          {(rbac.canCreate || rbac.canEdit) && (
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'en' ? 'Broadcast Notice' : 'Siarkan Pengumuman'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Creator Notice Shield */}
      <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center gap-3">
        <Shield className="w-5 h-5 text-blue-600 shrink-0" />
        <div className="text-xs text-blue-800 dark:text-blue-200">
          <span className="font-bold">
            {language === 'en' ? 'Official Directive Authorization: ' : 'Otoritas Siaran Resmi Galangan: '}
          </span>
          {language === 'en'
            ? 'Safety directives and emergency notices issued by Creator hold top priority across all divisions and cannot be revoked by non-creator accounts.'
            : 'Instruksi keselamatan kerja dan surat edaran darurat dari Creator memiliki prioritas tertinggi di seluruh divisi galangan.'}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'en' ? 'Search announcements...' : 'Cari judul, divisi sasaran, isi...'}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'SAFETY_HSE', 'OPERATIONAL', 'TECHNICAL', 'MANAGEMENT'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                categoryFilter === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat === 'ALL' ? (language === 'en' ? 'All' : 'Semua') : cat.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Announcements Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredAnnouncements.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800">
            {language === 'en' ? 'No announcements found.' : 'Tidak ada pengumuman yang sesuai dengan filter.'}
          </div>
        ) : (
          filteredAnnouncements.map((ann) => {
            const isCritical = ann.priority === 'CRITICAL';
            const isHigh = ann.priority === 'HIGH';

            return (
              <div 
                key={ann.id}
                className={`p-5 rounded-2xl border transition-all space-y-3 relative overflow-hidden bg-white dark:bg-slate-900 shadow-xs ${
                  isCritical 
                    ? 'border-rose-400 dark:border-rose-800 ring-1 ring-rose-500/20' 
                    : isHigh
                    ? 'border-amber-300 dark:border-amber-800'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                {/* Top Badge & Priority */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      isCritical
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 animate-pulse'
                        : isHigh
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300'
                    }`}>
                      {ann.priority}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                      {ann.category.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {ann.isPinned && (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded">
                        <Pin className="w-3 h-3 fill-amber-500" />
                        Pinned
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-slate-400">
                      Berlaku: {ann.validUntil}
                    </span>
                  </div>
                </div>

                {/* Title & Content */}
                <div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                    {ann.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                    {ann.content}
                  </p>
                </div>

                {/* Target & Issuer */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="text-[11px] text-slate-400 block font-medium">Target Sasaran:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{ann.targetDepartment}</span>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-[11px] text-slate-400 block font-medium">Diterbitkan oleh:</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{ann.issuedBy}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => handleAcknowledge(ann.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-700 dark:text-slate-200 transition"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-blue-600" />
                    <span>Sudah Baca ({ann.acknowledgmentsCount || 0})</span>
                  </button>

                  {rbac.canDelete && (
                    <button
                      onClick={() => handleDelete(ann.id)}
                      className="text-xs text-rose-500 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
                    >
                      Hapus
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Broadcast Notice Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-blue-600" />
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  {language === 'en' ? 'Broadcast Official Notice' : 'Siarkan Pengumuman Resmi Galangan'}
                </h3>
              </div>
              <button onClick={() => setIsNewModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Judul Pengumuman / Instruksi
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Contoh: Briefing Keselamatan Kerja & Surat Izin Hot Work"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Kategori
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  >
                    <option value="SAFETY_HSE">SAFETY HSE / K3</option>
                    <option value="OPERATIONAL">OPERASIONAL DERMAGA</option>
                    <option value="TECHNICAL">TEKNIS & KELAS BKI/ABS</option>
                    <option value="MANAGEMENT">MANAJEMEN & UMUM</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tingkat Prioritas
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  >
                    <option value="NORMAL">NORMAL</option>
                    <option value="HIGH">HIGH (Penting)</option>
                    <option value="CRITICAL">CRITICAL (Darurat / Wajib)</option>
                    <option value="INFO">INFO UMUM</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Divisi Sasaran (Target)
                  </label>
                  <input
                    type="text"
                    required
                    value={newTargetDept}
                    onChange={(e) => setNewTargetDept(e.target.value)}
                    placeholder="Contoh: Welder, Fitter, Crane Operator"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Berlaku Hingga
                  </label>
                  <input
                    type="date"
                    required
                    value={newValidUntil}
                    onChange={(e) => setNewValidUntil(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Isi Instruksi / Pengumuman Lengkap
                </label>
                <textarea
                  required
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Tuliskan isi instruksi, pedoman kerja, lokasi dan waktu briefing..."
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={newIsPinned}
                  onChange={(e) => setNewIsPinned(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="pinCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Sematkan di bagian atas (Pin Announcement)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold"
                >
                  Siarkan Pengumuman
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
