import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Upload, 
  Trash2, 
  Eye, 
  Lock, 
  ShieldCheck, 
  FileCheck, 
  AlertTriangle,
  User,
  CreditCard,
  FileText,
  HeartPulse,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../hooks/useRBAC';
import { employeeDb } from '../../services/employeeDb';
import { EmployeeRecord, EmployeeDocumentPhotos } from '../../types/employee';
import { CameraCaptureModal } from '../../components/common/CameraCaptureModal';
import { DeleteConfirmationModal } from '../../components/common/DeleteConfirmationModal';
import { isCreatorUser } from '../../context/AuthContext';

export const EmployeePhotoStoragePage: React.FC = () => {
  const { currentUser } = useAuth();
  const isCreator = isCreatorUser(currentUser);
  const rbac = useRBAC('employees-photos');
  const isPrivileged = rbac.isCreator || rbac.isAdmin;

  const [allEmployees, setAllEmployees] = useState<EmployeeRecord[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [activePhotoCategory, setActivePhotoCategory] = useState<keyof EmployeeDocumentPhotos | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState<{ title: string; url: string } | null>(null);

  useEffect(() => {
    const list = employeeDb.getEmployees('name');
    setAllEmployees(list);

    if (currentUser?.email) {
      const own = list.find((e) => e.email.toLowerCase() === currentUser.email.toLowerCase());
      if (own) {
        setSelectedEmployeeId(own.id);
      } else if (list.length > 0) {
        setSelectedEmployeeId(list[0].id);
      }
    }
  }, [currentUser]);

  const activeEmployee = allEmployees.find((e) => e.id === selectedEmployeeId);

  const categories: { key: keyof EmployeeDocumentPhotos; title: string; icon: React.ReactNode; desc: string }[] = [
    { key: 'profilePhoto', title: '1. Foto Profil', icon: <User className="w-5 h-5 text-blue-500" />, desc: 'Foto formal tampak depan berlatar polos untuk kartu ID galangan' },
    { key: 'ktpPhoto', title: '2. Foto KTP', icon: <CreditCard className="w-5 h-5 text-emerald-500" />, desc: 'Tangkapan jelas KTP Elektronik asli 16 digit' },
    { key: 'kkPhoto', title: '3. Foto Kartu Keluarga', icon: <FileText className="w-5 h-5 text-amber-500" />, desc: 'Foto halaman utuh Kartu Keluarga dengan NIK dan nama orang tua' },
    { key: 'npwpPhoto', title: '4. Foto NPWP', icon: <FileCheck className="w-5 h-5 text-indigo-500" />, desc: 'Foto kartu fisik atau bukti kepemilikan NPWP aktif' },
    { key: 'bpjsPhoto', title: '5. Foto BPJS', icon: <HeartPulse className="w-5 h-5 text-rose-500" />, desc: 'Foto kartu peserta BPJS Ketenagakerjaan / BPJS Kesehatan' },
    { key: 'otherPhoto', title: '6. Foto Lainnya', icon: <ImageIcon className="w-5 h-5 text-slate-500" />, desc: 'Sertifikat keahlian las (Welding Inspector / MIG/TIG), paspor, atau sertifikat keselamatan kerja' },
  ];

  const handleSavePhoto = async (cat: keyof EmployeeDocumentPhotos, base64Url: string) => {
    if (!rbac.canUpload && !rbac.canEdit && !rbac.canCreate) {
      alert('Akses Ditolak: Anda tidak memiliki izin untuk mengunggah foto/dokumen.');
      return;
    }
    if (!activeEmployee) return;

    const updatedDocs: EmployeeDocumentPhotos = {
      ...(activeEmployee.documents || {}),
      [cat]: base64Url,
    };

    // If profilePhoto, also update photoUrl on the main record
    const updatedEmployee: EmployeeRecord = {
      ...activeEmployee,
      documents: updatedDocs,
      photoUrl: cat === 'profilePhoto' ? base64Url : activeEmployee.photoUrl,
    };

    await employeeDb.saveEmployee(updatedEmployee);
    // Reload local list
    setAllEmployees(employeeDb.getEmployees('name'));
  };

  // Universal Creator Delete Modal State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    catKey: keyof EmployeeDocumentPhotos | null;
    catTitle: string;
  }>({ isOpen: false, catKey: null, catTitle: '' });
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);

  const requestDeletePhoto = (cat: { key: keyof EmployeeDocumentPhotos; title: string }) => {
    if (!rbac.canDelete && !isCreator) {
      alert('Akses Ditolak: Anda tidak memiliki izin untuk menghapus foto/dokumen.');
      return;
    }
    if (!activeEmployee) return;
    setDeleteModalState({
      isOpen: true,
      catKey: cat.key,
      catTitle: cat.title,
    });
  };

  const handleConfirmDeletePhoto = async () => {
    if (!activeEmployee || !deleteModalState.catKey) return;
    setIsDeletingPhoto(true);
    try {
      const updatedDocs = { ...(activeEmployee.documents || {}) };
      delete updatedDocs[deleteModalState.catKey];

      const updatedEmployee: EmployeeRecord = {
        ...activeEmployee,
        documents: updatedDocs,
        photoUrl: deleteModalState.catKey === 'profilePhoto' ? undefined : activeEmployee.photoUrl,
      };

      await employeeDb.saveEmployee(updatedEmployee, currentUser?.role);
      setAllEmployees(employeeDb.getEmployees('name'));
      setActiveEmployee(updatedEmployee);
      setDeleteModalState({ isOpen: false, catKey: null, catTitle: '' });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : String(err));
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const handleFileUpload = (cat: keyof EmployeeDocumentPhotos, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!rbac.canUpload && !rbac.canEdit && !rbac.canCreate) {
      alert('Akses Ditolak: Anda tidak memiliki izin untuk mengunggah foto/dokumen.');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    // Check max 10MB
    if (file.size > 10 * 1024 * 1024) {
      alert('Ukuran file foto melebihi batas maksimal 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      handleSavePhoto(cat, base64);
    };
    reader.readAsDataURL(file);
  };

  if (!rbac.canAccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-3xl p-8 text-center shadow-xl">
          <Camera className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Akses Dibatasi</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Akun Anda tidak memiliki izin untuk mengakses modul <strong>Penyimpanan Foto & Dokumen Karyawan</strong>. Hubungi Administrator atau Creator untuk memperbarui matriks izin pada halaman Izin Akses Pengguna.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
              <span>Karyawan</span>
              <span>/</span>
              <span>Sub Menu Penyimpanan Foto</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              Penyimpanan Foto & Dokumen Resmi
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Setiap kategori hanya menampung 1 file (Maks 10MB/foto). Akses terisolasi ketat hanya untuk pemilik akun dan Creator/Admin.
            </p>
          </div>

          {/* Privileged Switcher */}
          {isPrivileged && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 whitespace-nowrap">Pilih Karyawan:</span>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs"
              >
                {allEmployees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.employeeId} · {e.fullName}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Selected Employee Info Strip */}
        {activeEmployee && (
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center font-bold text-xs uppercase">
                {activeEmployee.fullName.charAt(0)}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white uppercase">{activeEmployee.fullName}</p>
                <p className="text-[11px] font-mono text-slate-500">ID: {activeEmployee.employeeId} · {activeEmployee.position}</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Penyimpanan Terisolasi (RBAC Protected)</span>
            </div>
          </div>
        )}

        {/* 6 Grid Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((cat) => {
            const photoUrl = activeEmployee?.documents?.[cat.key] || (cat.key === 'profilePhoto' ? activeEmployee?.photoUrl : undefined);

            return (
              <div
                key={cat.key}
                className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800">
                      {cat.icon}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white">{cat.title}</h3>
                      <p className="text-[10px] text-slate-400">1 File · Maksimal 10MB</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{cat.desc}</p>

                  {/* Photo Preview Canvas */}
                  <div className="w-full h-44 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 overflow-hidden relative flex items-center justify-center group">
                    {photoUrl ? (
                      <>
                        <img
                          src={photoUrl}
                          alt={cat.title}
                          className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <button
                            onClick={() => setPreviewPhoto({ title: cat.title, url: photoUrl })}
                            className="p-2 rounded-full bg-white text-slate-900 hover:bg-slate-100 shadow-md"
                            title="Lihat Pratinjau Penuh"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {(rbac.canDelete || isCreator) && (
                            <button
                              onClick={() => requestDeletePhoto(cat)}
                              className="p-2 rounded-full bg-rose-600 text-white hover:bg-rose-700 shadow-md transition"
                              title="Hapus Dokumen Foto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4 text-slate-400 text-xs">
                        <ImageIcon className="w-8 h-8 mx-auto mb-1 opacity-40" />
                        <span>Belum ada foto terunggah</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Upload & Camera Actions */}
                {(rbac.canUpload || rbac.canEdit || rbac.canCreate) ? (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActivePhotoCategory(cat.key);
                        setIsCameraOpen(true);
                      }}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition"
                    >
                      <Camera className="w-3.5 h-3.5 text-blue-600" />
                      <span>Kamera</span>
                    </button>

                    <label className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl cursor-pointer transition shadow-xs">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Pilih File</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileUpload(cat.key, e)}
                      />
                    </label>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center py-2 text-[11px] text-slate-400">
                    Akses Hanya Pratinjau
                  </div>
                )}

              </div>
            );
          })}
        </div>

      </div>

      {/* Camera Capture Modal */}
      <CameraCaptureModal
        isOpen={isCameraOpen}
        onClose={() => {
          setIsCameraOpen(false);
          setActivePhotoCategory(null);
        }}
        title={`Ambil Foto: ${activePhotoCategory ? categories.find((c) => c.key === activePhotoCategory)?.title : ''}`}
        onCapture={(base64) => {
          if (activePhotoCategory) {
            handleSavePhoto(activePhotoCategory, base64);
          }
        }}
      />

      {/* Fullscreen Photo Viewer */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <div className="flex items-center justify-between w-full pb-3 text-white">
              <span className="font-bold text-sm">{previewPhoto.title}</span>
              <button
                onClick={() => setPreviewPhoto(null)}
                className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white"
              >
                <X className="w-5 h-5" />
              </button>
            <img
              src={previewPhoto.url}
              alt={previewPhoto.title}
              className="max-h-[80vh] w-auto rounded-xl object-contain shadow-2xl border border-white/20"
            />
          </div>
        </div>
      )}

      {/* Universal Creator Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, catKey: null, catTitle: '' })}
        onConfirm={handleConfirmDeletePhoto}
        title="Hapus Dokumen Foto Pegawai"
        itemName={deleteModalState.catTitle}
        itemCode={activeEmployee?.employeeId}
        itemType="Lampiran Dokumen/Foto Pegawai"
        isLoading={isDeletingPhoto}
        cascadeDetails={[
          "Penghapusan file/dokumen foto dari profil pegawai",
          "Sinkronisasi real-time ke database Firestore",
          "Pembaruan pratinjau foto di seluruh sesi pengguna"
        ]}
      />

    </div>
  );
};
