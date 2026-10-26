import React, { useState, useEffect } from 'react';
import { 
  User, 
  Shield, 
  Briefcase, 
  Calendar, 
  MapPin, 
  DollarSign, 
  FileText, 
  CreditCard, 
  Phone, 
  Mail, 
  Clock, 
  Lock,
  ChevronDown,
  Trash2
} from 'lucide-react';
import { useAuth, isCreatorUser } from '../../context/AuthContext';
import { useRBAC } from '../../hooks/useRBAC';
import { employeeDb } from '../../services/employeeDb';
import { EmployeeRecord } from '../../types/employee';
import { cascadeDeleteService } from '../../services/cascadeDeleteService';
import { DeleteConfirmationModal } from '../../components/common/DeleteConfirmationModal';

export const EmployeeProfilePage: React.FC = () => {
  const { currentUser } = useAuth();
  const rbac = useRBAC('employees-profile');
  const isPrivileged = rbac.isCreator || rbac.isAdmin;
  const isCreator = isCreatorUser(currentUser);

  const [allEmployees, setAllEmployees] = useState<EmployeeRecord[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleCascadeDelete = async () => {
    if (!activeProfile) return;
    setIsDeleting(true);
    try {
      await cascadeDeleteService.deleteEmployeeCascade(activeProfile.id, currentUser?.role || 'creator', currentUser?.email);
      const updatedList = employeeDb.getEmployees('name');
      setAllEmployees(updatedList);
      if (updatedList.length > 0) {
        setSelectedEmployeeId(updatedList[0].id);
      } else {
        setSelectedEmployeeId('');
      }
      setIsDeleteModalOpen(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const list = employeeDb.getEmployees('name');
    setAllEmployees(list);

    // Initial selected employee: if not privileged, default to own profile
    if (currentUser?.email) {
      const own = list.find((e) => e.email.toLowerCase() === currentUser.email.toLowerCase());
      if (own) {
        setSelectedEmployeeId(own.id);
      } else if (list.length > 0) {
        setSelectedEmployeeId(list[0].id);
      }
    }
  }, [currentUser]);

  const activeProfile = allEmployees.find((e) => e.id === selectedEmployeeId);

  if (!rbac.canAccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-3xl p-8 text-center shadow-xl">
          <User className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Akses Dibatasi</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Akun Anda tidak memiliki izin untuk mengakses modul <strong>Profil Karyawan Resmi</strong>. Hubungi Administrator atau Creator untuk memperbarui matriks izin pada halaman Izin Akses Pengguna.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
              <span>Karyawan</span>
              <span>/</span>
              <span>Sub Menu Profil</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Profil Karyawan Resmi
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Halaman tampilan profil resmi (View-Only). Data bersumber dari Halaman Data Karyawan.
            </p>
          </div>

          {/* If Creator/Admin, allow selecting other employees */}
          {isPrivileged && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 whitespace-nowrap">Pilih Karyawan:</span>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs max-w-xs"
              >
                {allEmployees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.employeeId} · {e.fullName} ({e.position})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {!activeProfile ? (
          <div className="p-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            Data profil karyawan belum ditemukan. Hubungi Administrator.
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Main Identity Banner */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shrink-0 flex items-center justify-center font-black text-2xl text-slate-600">
                {activeProfile.photoUrl ? (
                  <img src={activeProfile.photoUrl} alt={activeProfile.fullName} className="w-full h-full object-cover" />
                ) : (
                  activeProfile.fullName.charAt(0)
                )}
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 dark:text-white uppercase">
                      {activeProfile.fullName}
                    </h2>
                    <p className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                      ID Karyawan: {activeProfile.employeeId}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      {activeProfile.workStatus}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800 uppercase font-mono">
                      Peran: {employeeDb.isCreatorAccount(activeProfile) && currentUser?.role !== 'creator' ? 'admin' : activeProfile.accountRole}
                    </span>
                    {employeeDb.isCreatorAccount(activeProfile) && currentUser?.role === 'creator' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-xs" title="Akun Anda (Creator) terlindungi">
                        👑 Terproteksi
                      </span>
                    )}
                    {isCreator && activeProfile && (
                      <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition"
                        title="Hapus Data Pegawai & Seluruh Turunannya (Creator Universal)"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Pegawai</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{activeProfile.position}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{activeProfile.department} · {activeProfile.workLocation}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Shift {activeProfile.workShift}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Profile Grid Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Penempatan & Hubungan Kerja */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                  Penempatan & Masa Kerja
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tanggal Masuk Kerja:</span>
                    <span className="font-semibold">{activeProfile.joinDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Departemen:</span>
                    <span className="font-semibold">{activeProfile.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tipe Proyek:</span>
                    <span className="font-semibold">{activeProfile.projectType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Lokasi Kerja:</span>
                    <span className="font-semibold">{activeProfile.workLocation}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Shift Kerja:</span>
                    <span className="font-semibold">{activeProfile.workShift}</span>
                  </div>
                  {activeProfile.exitDate && (
                    <div className="flex justify-between text-rose-600">
                      <span>Tanggal Keluar:</span>
                      <span className="font-semibold">{activeProfile.exitDate}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Data Finansial & Penggajian */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                  Informasi Penggajian & Tunjangan
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Upah / Gaji Pokok:</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      Rp {Number(activeProfile.wage).toLocaleString('id-ID')} / {activeProfile.wageStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tunjangan Makan:</span>
                    <span className="font-mono">Rp {Number(activeProfile.mealAllowance || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tunjangan Transportasi:</span>
                    <span className="font-mono">Rp {Number(activeProfile.transportAllowance || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tunjangan Gouging:</span>
                    <span className="font-mono">Rp {Number(activeProfile.gougingAllowance || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-slate-400">Nomor Rekening:</span>
                    <span className="font-mono font-bold">{activeProfile.bankAccountNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bank Penggajian:</span>
                    <span className="font-semibold text-blue-600">{activeProfile.bankName}</span>
                  </div>
                </div>
              </div>

              {/* Data Pribadi & Keluarga */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                  Data Pribadi & Keluarga
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tempat, Tanggal Lahir:</span>
                    <span className="font-semibold">{activeProfile.birthPlace}, {activeProfile.birthDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Usia Saat Ini:</span>
                    <span className="font-semibold">{activeProfile.age} Tahun</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Agama:</span>
                    <span className="font-semibold">{activeProfile.religion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status Pernikahan:</span>
                    <span className="font-semibold">{activeProfile.maritalStatus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nama Orang Tua:</span>
                    <span className="font-semibold">{activeProfile.fatherName || '-'} (Ayah) / {activeProfile.motherName || '-'} (Ibu)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Alamat KTP:</span>
                    <span className="font-semibold text-right max-w-xs truncate" title={activeProfile.address}>{activeProfile.address || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Dokumen Identitas Resmi */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider pb-2 border-b border-slate-100 dark:border-slate-800">
                  Dokumen Identitas Resmi
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nomor Telepon / HP:</span>
                    <span className="font-mono font-semibold">{activeProfile.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nomor KTP (16 Digit):</span>
                    <span className="font-mono font-semibold">{activeProfile.ktpNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nomor Kartu Keluarga:</span>
                    <span className="font-mono font-semibold">{activeProfile.kkNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nomor NPWP:</span>
                    <span className="font-mono">{activeProfile.npwpNumber || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Nomor BPJS-TK:</span>
                    <span className="font-mono">{activeProfile.bpjsNumber || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email Akun:</span>
                    <span className="font-mono text-blue-600">{activeProfile.email}</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

      {/* Universal Creator Delete Confirmation Modal */}
      {activeProfile && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleCascadeDelete}
          title="Hapus Data Pegawai & Seluruh Turunan"
          itemName={activeProfile.fullName}
          itemCode={activeProfile.employeeId}
          itemType="Data Pegawai Galangan"
          isLoading={isDeleting}
          cascadeDetails={[
            "Dokumen master pegawai di Firestore ('employees')",
            "Akun otorisasi & izin modul pengguna ('users' & 'user_permissions')",
            "Seluruh arsip presensi harian & Form Time Sheet",
            "Seluruh catatan lembur & Form Night Shift",
            "Klaim lembur & lembar kalkulasi waktu bulanan",
            "Pembersihan sinkronisasi real-time ke semua perangkat aktif"
          ]}
        />
      )}

    </div>
  );
};
