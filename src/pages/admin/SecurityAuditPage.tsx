import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  Key, 
  Eye, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  Clock, 
  FileText, 
  Activity,
  Layers,
  Database,
  Camera
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { dbService } from '../../services/db';
import { AuditLogItem, UserRole } from '../../types/auth';

const RBAC_MODULES = [
  {
    module: 'Manajemen Karyawan',
    creator: 'Full Akses + Proteksi Formula',
    admin: 'Kelola Master Data & Foto',
    staff: 'Lihat Data & Input Harian',
    karyawan: 'Lihat Profil Mandiri'
  },
  {
    module: 'Proyek Kapal & Supervisi',
    creator: 'Full Akses + Otoritas RAB',
    admin: 'Update Progres & Supervisi',
    staff: 'Update Progres Lapangan',
    karyawan: 'Lihat Status Proyek'
  },
  {
    module: 'Gudang & Logistik (> 50M)',
    creator: 'Otorisasi Mutlak > 50 Jt',
    admin: 'Pengajuan & Order < 50 Jt',
    staff: 'Pengajuan Barang Lapangan',
    karyawan: 'Lihat Ketersediaan Stok'
  },
  {
    module: 'Presensi & Lembur (SPL)',
    creator: 'Full Audit Biaya Upah',
    admin: 'Otorisasi SPL & Verifikasi',
    staff: 'Input Presensi Lapangan',
    karyawan: 'Presensi Masuk/Pulang'
  },
  {
    module: 'Keuangan & Kontrak Galangan',
    creator: 'Tanda Tangan Nilai Kontrak',
    admin: 'Faktur Tagihan & Verifikasi',
    staff: 'Pengajuan Voucher Kas',
    karyawan: 'Tidak Memiliki Akses'
  },
  {
    module: 'HSE & Disposisi Tugas',
    creator: 'Siaran Instruksi Darurat',
    admin: 'Disposisi Surat Tugas SPV',
    staff: 'Laporan Progres & QC',
    karyawan: 'Konfirmasi Baca & Tugas'
  },
  {
    module: 'Sistem Keamanan & Audit',
    creator: 'Hak Istimewa Tertinggi',
    admin: 'Kelola User & Review Log',
    staff: 'Tidak Memiliki Akses',
    karyawan: 'Tidak Memiliki Akses'
  }
];

export const SecurityAuditPage: React.FC = () => {
  const { currentUser } = useAuth();
  const isCreator = currentUser?.role === 'creator' || currentUser?.email === 'muhammad.andri0605@gmail.com' || currentUser?.email === 'creator@nexaproject.com';
  const { t, language } = useTheme();

  const [auditLogs] = useState<AuditLogItem[]>(() => dbService.getAuditLogs());
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState<'audit' | 'rbac' | 'firewall'>('audit');

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'ALL' || log.action.includes(actionFilter);
    return matchesSearch && matchesAction;
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              {language === 'en' ? 'Security Administration & Forensic Audit Trail' : 'Administrasi Keamanan & Jejak Audit Forensik'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {isCreator
                ? (language === 'en' ? 'Immutable audit logs, Multi-Role RBAC matrix, and supreme Creator account firewall defense' : 'Jejak log forensik anti-tampering, matriks RBAC 4 tingkat, dan proteksi firewall akun Creator')
                : (language === 'en' ? 'Immutable audit logs and multi-level RBAC operational security matrix' : 'Jejak log forensik anti-tampering dan matriks hak akses operasional RBAC')}
            </p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl self-start md:self-auto">
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'audit'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Jejak Audit ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === 'rbac'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Matriks RBAC
          </button>
          {isCreator && (
            <button
              onClick={() => setActiveTab('firewall')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
                activeTab === 'firewall'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              🛡️ Firewall Creator
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari aksi, detail, atau personil..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
              >
                <option value="ALL">Semua Aktivitas</option>
                <option value="LOGIN">LOGIN</option>
                <option value="ROLE">ROLE SWITCH</option>
                <option value="CREATE">CREATE</option>
                <option value="UPDATE">UPDATE</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Waktu & Timestamp</th>
                    <th className="py-3 px-4">Aksi / Operasi</th>
                    <th className="py-3 px-4">Dilakukan Oleh</th>
                    <th className="py-3 px-4">Detail Perubahan</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">
                        Tidak ada catatan log forensik yang cocok.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const isCreatorLog = log.role === 'creator' || log.username === 'creator01' || log.userId === 'creator01';
                      const displayRole = !isCreator && isCreatorLog ? 'admin' : log.role;
                      const displayDetails = !isCreator && isCreatorLog
                        ? log.details.replace(/Creator/g, 'Admin').replace(/creator/g, 'admin')
                        : log.details;

                      return (
                        <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                            {new Date(log.timestamp).toLocaleString('id-ID')}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              log.action.includes('SECURITY') || log.action.includes('LOCK')
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                                : log.action.includes('LOGIN')
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                            <div>{log.username}</div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono">{displayRole}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-400 max-w-md">
                            {displayDetails}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3" />
                              Tercatat
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RBAC MATRIX */}
      {activeTab === 'rbac' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs overflow-hidden p-5 space-y-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              Matriks Hak Akses Berjenjang (Multi-Role Access Control)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pemisahan wewenang operasional antara Creator, Admin, Staff, dan Karyawan di seluruh 7 modul galangan kapal.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Modul Sistem</th>
                  {isCreator && <th className="py-3 px-4 text-amber-600">👑 Creator</th>}
                  <th className="py-3 px-4 text-blue-600">Admin</th>
                  <th className="py-3 px-4 text-indigo-600">Staff</th>
                  <th className="py-3 px-4 text-emerald-600">Karyawan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {RBAC_MODULES.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      {row.module}
                    </td>
                    {isCreator && (
                      <td className="py-3.5 px-4 font-semibold text-amber-700 dark:text-amber-400 bg-amber-50/30 dark:bg-amber-950/10">
                        {row.creator}
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                      {row.admin}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {row.staff}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-500">
                      {row.karyawan}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: CREATOR FIREWALL MONITOR */}
      {activeTab === 'firewall' && (
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-amber-500/10 border border-amber-300 dark:border-amber-800/80 space-y-4 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xl shadow-xs">
                👑
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">
                  Firewall Proteksi Akun Creator (Muhammad Andri)
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Status: <strong>AKTIF & TERKUNCI MUTLAK</strong> (Client State, Local Storage, dan Firestore Security Rules)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Identitas Creator Resmi</span>
                <p className="font-extrabold text-xs text-slate-900 dark:text-white">muhammad.andri0605@gmail.com</p>
                <p className="text-[11px] font-mono text-amber-600 font-bold">EMP-001 (PROJECT MANAGER)</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Pertahanan Tingkat Database</span>
                <p className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400">Firestore Rules Zero-Trust</p>
                <p className="text-[11px] text-slate-500">Blokir mutlak mutasi peran oleh Admin/Staff</p>
              </div>

              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Otorisasi Finansial & Gudang</span>
                <p className="font-extrabold text-xs text-blue-600 dark:text-blue-400">Ambang Batas &gt; Rp 50.000.000</p>
                <p className="text-[11px] text-slate-500">Hanya dapat diapprove oleh akun Creator</p>
              </div>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-400 bg-white/70 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                Laporan Keamanan Multi-Lapisan:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px]">
                <li>Akun Creator tidak dapat diedit atau dihapus dari antarmuka master data oleh Administrator maupun Staff.</li>
                <li>Pencatatan hash sandi menggunakan partisi salt dinamis per pengguna (anti-rainbow table).</li>
                <li>Sesi tidak aktif otomatis terkunci setelah 10 menit (karyawan/staff) dan 15 menit (admin/creator).</li>
                <li>Lapisan anti-screenshot aktif mengaburkan layar saat jendela browser kehilangan fokus.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
