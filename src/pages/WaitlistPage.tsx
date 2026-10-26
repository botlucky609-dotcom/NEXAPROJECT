import React, { useState } from 'react';
import { 
  Users, 
  Check, 
  X, 
  Clock, 
  ShieldAlert, 
  AlertTriangle, 
  UserPlus, 
  UserCheck, 
  Ban, 
  Search,
  Filter
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/db';
import { WaitlistApplicant, UserRole } from '../types/auth';
import { AccessDeniedState } from '../components/common/StatusIndicators';
import { db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

export const WaitlistPage: React.FC<{ onNavigateToDashboard: () => void }> = ({ onNavigateToDashboard }) => {
  const { currentUser, hasPermission } = useAuth();
  const [waitlist, setWaitlist] = useState<WaitlistApplicant[]>(() => dbService.getWaitlist());
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'rejected' | 'approved'>('all');

  // Rejection modal state
  const [rejectingApplicant, setRejectingApplicant] = useState<WaitlistApplicant | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Approval modal state
  const [approvingApplicant, setApprovingApplicant] = useState<WaitlistApplicant | null>(null);
  const [selectedRole, setSelectedRole] = useState<'karyawan' | 'staff' | 'admin'>('karyawan');
  const [isProcessing, setIsProcessing] = useState(false);

  // Verify access rights (Creator and Admin only)
  if (!currentUser || (currentUser.role !== 'creator' && currentUser.role !== 'admin')) {
    return <AccessDeniedState moduleName="Halaman Daftar Tunggu Akun" onBackToDashboard={onNavigateToDashboard} />;
  }

  const refreshData = () => {
    setWaitlist(dbService.getWaitlist());
  };

  const handleApprove = async () => {
    if (!approvingApplicant || !currentUser) return;
    setIsProcessing(true);
    try {
      const approvedUser = dbService.approveApplicant(approvingApplicant.id, currentUser.username, selectedRole);

      // Real-time synchronization to Firestore so the user's active listener triggers immediately
      const nowIso = new Date().toISOString();
      if (approvedUser) {
        await setDoc(
          doc(db, 'users', approvedUser.id),
          {
            id: approvedUser.id,
            fullName: approvedUser.fullName,
            username: approvedUser.username,
            email: approvedUser.email,
            role: selectedRole,
            status: 'active',
            updatedAt: nowIso,
          },
          { merge: true }
        ).catch(() => {});
      }

      // If applicant email or identity matches existing user with different ID (e.g. Firebase Auth UID)
      if (approvingApplicant.email) {
        const matched = dbService.findUserByIdentity(approvingApplicant.email);
        if (matched && matched.id !== approvedUser?.id) {
          await setDoc(
            doc(db, 'users', matched.id),
            {
              role: selectedRole,
              status: 'active',
              updatedAt: nowIso,
            },
            { merge: true }
          ).catch(() => {});
        }
      }

      // Update waitlist in Firestore
      await setDoc(
        doc(db, 'registration_waitlist', approvingApplicant.id),
        {
          status: 'approved',
          assignedRole: selectedRole,
          reviewedBy: currentUser.username,
          reviewedAt: nowIso,
        },
        { merge: true }
      ).catch(() => {});
    } catch (err) {
      console.warn('Firestore approval sync warning:', err);
    } finally {
      setIsProcessing(false);
      setApprovingApplicant(null);
      refreshData();
    }
  };

  const handleReject = async () => {
    if (!rejectingApplicant || !currentUser) return;
    if (!rejectReason.trim()) return;

    if (rejectingApplicant.email.toLowerCase() === 'muhammad.andri0605@gmail.com' && currentUser.role !== 'creator') {
      alert('Akses Ditolak: Akun dilindungi oleh kebijakan otorisasi sistem tingkat tinggi.');
      return;
    }

    setIsProcessing(true);
    try {
      dbService.rejectApplicant(rejectingApplicant.id, currentUser.username, rejectReason.trim());

      const nowIso = new Date().toISOString();
      await setDoc(
        doc(db, 'registration_waitlist', rejectingApplicant.id),
        {
          status: 'rejected',
          rejectionReason: rejectReason.trim(),
          reviewedBy: currentUser.username,
          reviewedAt: nowIso,
        },
        { merge: true }
      ).catch(() => {});
    } catch (err) {
      console.warn('Firestore reject sync warning:', err);
    } finally {
      setIsProcessing(false);
      setRejectingApplicant(null);
      setRejectReason('');
      refreshData();
    }
  };

  const filtered = waitlist.filter((app) => {
    const matchesSearch =
      app.fullName.toLowerCase().includes(search.toLowerCase()) ||
      app.username.toLowerCase().includes(search.toLowerCase()) ||
      app.email.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
              <span>Pengguna</span>
              <span>/</span>
              <span>Daftar Tunggu Akun</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Daftar Tunggu Akun (Approval Queue)
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Audit dan validasi permohonan pendaftaran tenaga kerja baru sebelum akun diaktifkan.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold border border-blue-200 dark:border-blue-800">
              Otoritas: {currentUser.role.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama, username, atau email..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-2.5 top-2 w-4 h-4 text-slate-400" />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition shrink-0 ${
                filterStatus === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Semua ({waitlist.length})
            </button>
            <button
              onClick={() => setFilterStatus('pending')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition shrink-0 ${
                filterStatus === 'pending'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Menunggu ({waitlist.filter((w) => w.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilterStatus('approved')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition shrink-0 ${
                filterStatus === 'approved'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Disetujui ({waitlist.filter((w) => w.status === 'approved').length})
            </button>
            <button
              onClick={() => setFilterStatus('rejected')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition shrink-0 ${
                filterStatus === 'rejected'
                  ? 'bg-rose-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Ditolak ({waitlist.filter((w) => w.status === 'rejected').length})
            </button>
          </div>
        </div>

        {/* Waitlist Applicants Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Nama Lengkap & Identitas</th>
                  <th className="p-3.5">Nama Pengguna</th>
                  <th className="p-3.5">Tanggal Permohonan</th>
                  <th className="p-3.5">Status Pengajuan</th>
                  <th className="p-3.5">Riwayat Penolakan</th>
                  <th className="p-3.5 text-right">Aksi Verifikasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">
                      Tidak ada permohonan pendaftaran yang sesuai kriteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 dark:text-white uppercase">{item.fullName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{item.email}</div>
                      </td>

                      <td className="p-3.5 font-mono text-slate-700 dark:text-slate-300">
                        @{item.username}
                      </td>

                      <td className="p-3.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {new Date(item.appliedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>

                      <td className="p-3.5">
                        {item.status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3" />
                            <span>Menunggu</span>
                          </span>
                        )}
                        {item.status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <Check className="w-3 h-3" />
                            <span>Disetujui</span>
                          </span>
                        )}
                        {item.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            <X className="w-3 h-3" />
                            <span>Ditolak</span>
                          </span>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`font-mono text-xs font-bold ${
                            item.rejectionCount >= 3 ? 'text-rose-600' : item.rejectionCount > 0 ? 'text-amber-600' : 'text-slate-400'
                          }`}>
                            {item.rejectionCount || 0}x
                          </span>
                          {item.rejectionCount >= 3 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300">
                              Terblokir 24 Jam
                            </span>
                          )}
                        </div>
                        {item.rejectionReason && (
                          <p className="text-[10px] text-slate-400 italic mt-0.5 max-w-xs truncate" title={item.rejectionReason}>
                            "{item.rejectionReason}"
                          </p>
                        )}
                      </td>

                      <td className="p-3.5 text-right">
                        {item.status === 'pending' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setRejectingApplicant(item);
                                setRejectReason('');
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg border border-rose-200 dark:border-rose-900/60 transition"
                            >
                              Tolak
                            </button>
                            <button
                              onClick={() => {
                                setApprovingApplicant(item);
                                setSelectedRole('karyawan');
                              }}
                              className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition"
                            >
                              Setujui
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            {item.reviewedBy ? `Oleh: ${item.reviewedBy}` : 'Selesai'}
                          </span>
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

      {/* Approve Modal with Role Assignment */}
      {approvingApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
              Konfirmasi Persetujuan Akun
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Pendaftar <strong>{approvingApplicant.fullName}</strong> (@{approvingApplicant.username}) akan diaktifkan ke dalam sistem.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tetapkan Tingkat Peran (Role):
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as 'karyawan' | 'staff' | 'admin')}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              >
                <option value="karyawan">Karyawan (Hak Akses Dasar / View-Only)</option>
                <option value="staff">Staff (Operasional Galangan & Gudang)</option>
                {/* Admin cannot assign creator role */}
                <option value="admin">Admin (Administrator Sistem)</option>
              </select>
              {currentUser?.role === 'creator' ? (
                <p className="text-[10px] text-slate-400 mt-1">
                  *Role Creator tidak dapat diberikan oleh Admin untuk menjamin integritas arsitektur sistem.
                </p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1">
                  *Tingkat wewenang akun ditetapkan berdasarkan kebijakan keamanan sistem terpusat.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                disabled={isProcessing}
                onClick={() => setApprovingApplicant(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50"
              >
                Batal
              </button>
              <button
                disabled={isProcessing}
                onClick={handleApprove}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm"
              >
                {isProcessing ? 'Memproses...' : 'Simpan & Aktifkan Akun'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal with Mandatory Reason */}
      {rejectingApplicant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 shadow-2xl p-6">
            <h3 className="text-base font-bold text-rose-900 dark:text-rose-200 mb-1">
              Tolak Permohonan Akun
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Menolak pendaftaran <strong>{rejectingApplicant.fullName}</strong>. Akun ini akan tercatat riwayat penolakan ke-{(rejectingApplicant.rejectionCount || 0) + 1}. Jika mencapai 3x, akun akan terblokir selama 24 jam.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Alasan Penolakan (Wajib Diisi):
              </label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Contoh: Lampiran KTP tidak terbaca / Data belum sesuai dengan manifes proyek galangan..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                disabled={isProcessing}
                onClick={() => setRejectingApplicant(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg disabled:opacity-50"
              >
                Batal
              </button>
              <button
                disabled={!rejectReason.trim() || isProcessing}
                onClick={handleReject}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-lg shadow-sm"
              >
                {isProcessing ? 'Memproses...' : 'Konfirmasi Penolakan'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
