import { UserRole } from './auth';

export type PermissionAction = 'canAccess' | 'canEdit' | 'canDelete' | 'canUpload' | 'canDownload';

export interface ModulePermission {
  canAccess: boolean;   // Tampilkan ikon & izinkan akses halaman
  canEdit: boolean;     // Izin ubah data (EDIT)
  canDelete: boolean;   // Izin hapus data (DELETE)
  canUpload: boolean;   // Izin unggah berkas/foto/dokumen (UPLOAD)
  canDownload: boolean; // Izin unduh/ekspor data (UNDUH)
}

export interface AppPermissionModule {
  id: string;
  name: string;
  category: string;
  iconName: string;
  description: string;
  supportedActions: {
    canAccess: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canUpload: boolean;
    canDownload: boolean;
  };
}

export const ALL_PERMISSION_MODULES: AppPermissionModule[] = [
  // 1. Ringkasan & Dashboard
  {
    id: 'dashboard',
    name: 'Dashboard & Analitik Galangan',
    category: 'Ringkasan Eksekutif',
    iconName: 'LayoutDashboard',
    description: 'Statistik armada kapal, kurva S proyek, status K3, dan ringkasan keuangan galangan.',
    supportedActions: { canAccess: true, canEdit: false, canDelete: false, canUpload: false, canDownload: true }
  },
  // 2. Modul Karyawan
  {
    id: 'employees-data',
    name: 'Master Data Karyawan',
    category: 'Modul Karyawan',
    iconName: 'Users',
    description: 'Data induk tenaga kerja galangan, sertifikasi profesi, dan status kepegawaian.',
    supportedActions: { canAccess: true, canEdit: true, canDelete: true, canUpload: true, canDownload: true }
  },
  {
    id: 'employees-profile',
    name: 'Profil & Verifikasi Karyawan',
    category: 'Modul Karyawan',
    iconName: 'UserCheck',
    description: 'Data pribadi, detail kontak darurat, dan verifikasi sertifikat keselamatan.',
    supportedActions: { canAccess: true, canEdit: true, canDelete: false, canUpload: true, canDownload: true }
  },
  {
    id: 'employees-photos',
    name: 'Galeri Foto & Dokumen Karyawan',
    category: 'Modul Karyawan',
    iconName: 'Camera',
    description: 'Penyimpanan arsip foto ID Card dan pindaian dokumen sertifikasi.',
    supportedActions: { canAccess: true, canEdit: true, canDelete: true, canUpload: true, canDownload: true }
  },
  // 3. Modul Proyek Kapal
  {
    id: 'projects-list',
    name: 'Daftar Proyek & Dok Kapal',
    category: 'Modul Proyek Kapal',
    iconName: 'Ship',
    description: 'Daftar reparasi kapal, kapal bangunan baru, dan alokasi dok apung/graving.',
    supportedActions: { canAccess: true, canEdit: true, canDelete: true, canUpload: true, canDownload: true }
  },
  {
    id: 'projects-supervisors',
    name: 'Tim Supervisi & Koordinator',
    category: 'Modul Proyek Kapal',
    iconName: 'Anchor',
    description: 'Penetapan supervisor lapangan, koordinator lambung, mesin, dan elektrik.',
    supportedActions: { canAccess: true, canEdit: true, canDelete: true, canUpload: false, canDownload: true }
  },
  {
    id: 'projects-progress',
    name: 'Progres Fabrikasi & Kurva S',
    category: 'Modul Proyek Kapal',
    iconName: 'Activity',
    description: 'Pemantauan persentase penyelesaian fisik pekerjaan kapal harian dan mingguan.',
    supportedActions: { canAccess: true, canEdit: true, canDelete: false, canUpload: true, canDownload: true }
  },
  {
    id: 'projects-cost',
    name: 'RAB & Biaya Proyek',
    category: 'Modul Proyek Kapal',
    iconName: 'DollarSign',
    description: 'Rencana Anggaran Biaya, realisasi pengeluaran, dan deviasi biaya proyek kapal.',
    supportedActions: { canAccess: true, canEdit: true, canDelete: true, canUpload: true, canDownload: true }
  },
  // 4. Modul Gudang & Logistik
  {
    id: 'warehouse-stock',
    name: 'Inventaris & Stok Plat Baja/Material',
    category: 'Gudang & Material',
    iconName: 'Package',
    description: 'Manajemen persediaan plat baja grade marine, pipa, elektroda las, dan cat pelindung.',
    supportedActions: { canAccess: true, canEdit: true, canDelete: true, canUpload: true, canDownload: true }
  },
  {
    id: 'warehouse-flow',
    name: 'Alur Keluar Masuk Barang',
    category: 'Gudang & Material',
    iconName: 'TrendingUp',
    description: 'Surat jalan material masuk dari supplier dan bon pengeluaran material ke bengkel.',
    supportedActions: { canAccess: true, canEdit: true, canDelete: false, canUpload: true, canDownload: true }
  },
  {
    id: 'warehouse-order',
    name: 'Pengajuan & Pemesanan Material',
    category: 'Gudang & Material',
    iconName: 'ShoppingCart',
    description: 'Purchase Request (PR) dan Purchase Order (PO) suku cadang serta perlengkapan dok.',
    supportedActions: { canAccess: true, canEdit: true, canDelete: true, canUpload: true, canDownload: true }
  },
  // 5. Modul Presensi & Lembur
  {
    id: 'attendance-timesheet',
    name: 'Timesheet Harian Galangan',
    category: 'Presensi & Lembur',
    iconName: 'Clock',
    description: 'Pencatatan jam masuk, istirahat, dan jam kepulangan teknisi dok kapal.',
    supportedActions: { canAccess: true, canEdit: true, canDelete: false, canUpload: false, canDownload: true }
  },
  {
    id: 'attendance-overtime',
    name: 'Surat Perintah Lembur (SPL)',
    category: 'Presensi & Lembur',
    iconName: 'Calendar',
    description: 'Pengajuan dan persetujuan jam lembur darurat untuk percepatan proyek dok.',
    supportedActions: { canAccess: true, canEdit: true, canDelete: true, canUpload: true, canDownload: true }
  },
  {
    id: 'attendance-nightshift',
    name: 'Pengajuan Shift Malam & Insentif',
    category: 'Presensi & Lembur',
    iconName: 'Moon',
    description: 'Pekerjaan pengecatan atau sandblasting di waktu malam bebas terik matahari.',
    supportedActions: { canAccess: true, canEdit: true, canDelete: false, canUpload: false, canDownload: true }
  },
  {
    id: 'attendance-time-calc',
    name: 'Kalkulator Jam Kerja Lapangan',
    category: 'Presensi & Lembur',
    iconName: 'Calculator',
    description: 'Perhitungan otomatis total jam kerja reguler dan kelipatan jam lembur.',
    supportedActions: { canAccess: true, canEdit: false, canDelete: false, canUpload: false, canDownload: true }
  },
  {
    id: 'attendance-summary',
    name: 'Rekapitulasi Presensi Dok',
    category: 'Presensi & Lembur',
    iconName: 'Table',
    description: 'Laporan ringkasan kehadiran bulanan seluruh departemen bengkel galangan.',
    supportedActions: { canAccess: true, canEdit: false, canDelete: false, canUpload: false, canDownload: true }
  },
  {
    id: 'attendance-labor-cost',
    name: 'Kalkulasi Upah & Insentif Kerja',
    category: 'Presensi & Lembur',
    iconName: 'CreditCard',
    description: 'Perhitungan estimasi biaya upah harian dan kompensasi shift malam teknisi.',
    supportedActions: { canAccess: true, canEdit: true, canDelete: false, canUpload: false, canDownload: true }
  },
  // 6. Modul Keuangan & Kontrak
  {
    id: 'finance-contract',
    name: 'Kontrak Kerja & Termin Pemilik Kapal',
    category: 'Keuangan & Kontrak',
    iconName: 'FileText',
    description: 'Arsip kontrak pemeliharaan kapal, klausul jaminan, dan jadwal penagihan termin.',
    supportedActions: { canAccess: true, canEdit: true, canDelete: true, canUpload: true, canDownload: true }
  },
  {
    id: 'finance-operational',
    name: 'Biaya Operasional Galangan',
    category: 'Keuangan & Kontrak',
    iconName: 'Receipt',
    description: 'Tagihan listrik fasilitas dok, solar genset, crane, dan sertifikasi class.',
    supportedActions: { canAccess: true, canEdit: true, canDelete: true, canUpload: true, canDownload: true }
  },
  {
    id: 'finance-labor',
    name: 'Arus Kas & Margin Proyek',
    category: 'Keuangan & Kontrak',
    iconName: 'TrendingUp',
    description: 'Analisis laba rugi per proyek dok kapal dan realisasi anggaran berbanding RAB.',
    supportedActions: { canAccess: true, canEdit: true, canDelete: false, canUpload: true, canDownload: true }
  },
  // 7. Modul HSE & Lapangan
  {
    id: 'announcements',
    name: 'Pengumuman & Keselamatan K3',
    category: 'HSE & Tugas Lapangan',
    iconName: 'Bell',
    description: 'Protokol keselamatan kerja, instruksi toolbox meeting, dan siaran darurat.',
    supportedActions: { canAccess: true, canEdit: true, canDelete: true, canUpload: true, canDownload: true }
  },
  {
    id: 'tasks',
    name: 'Tugas Kerja Lapangan & QC',
    category: 'HSE & Tugas Lapangan',
    iconName: 'CheckSquare',
    description: 'Disposisi tugas harian per mandor, inspeksi NDT, dan checklist uji fungsi kapal.',
    supportedActions: { canAccess: true, canEdit: true, canDelete: true, canUpload: true, canDownload: true }
  },
  // 8. Sistem & Administrasi
  {
    id: 'settings-audit',
    name: 'Jejak Audit & Keamanan Sistem',
    category: 'Sistem & Administrasi',
    iconName: 'ShieldAlert',
    description: 'Pencatatan aktivitas login, proteksi data, dan log modifikasi sistem.',
    supportedActions: { canAccess: true, canEdit: false, canDelete: false, canUpload: false, canDownload: true }
  },
  {
    id: 'settings-app',
    name: 'Pengaturan Tampilan & Aplikasi',
    category: 'Sistem & Administrasi',
    iconName: 'Sliders',
    description: 'Kustomisasi warna, font, logo, nama brand, dan pemeliharaan server.',
    supportedActions: { canAccess: true, canEdit: true, canDelete: false, canUpload: true, canDownload: true }
  },
  {
    id: 'users-permissions',
    name: 'Izin Akses Pengguna (Access Control)',
    category: 'Sistem & Administrasi',
    iconName: 'Key',
    description: 'Matriks otorisasi peran, penentuan akses halaman, EDIT, DELETE, UPLOAD, dan UNDUH.',
    supportedActions: { canAccess: true, canEdit: true, canDelete: true, canUpload: false, canDownload: true }
  },
  {
    id: 'users-waitlist',
    name: 'Persetujuan Pendaftaran Akun',
    category: 'Sistem & Administrasi',
    iconName: 'ShieldCheck',
    description: 'Verifikasi identitas pendaftar baru sebelum diizinkan mengakses sistem.',
    supportedActions: { canAccess: true, canEdit: true, canDelete: true, canUpload: false, canDownload: true }
  }
];

export const CATEGORIES_LIST = [
  'Semua Kategori',
  'Ringkasan Eksekutif',
  'Modul Karyawan',
  'Modul Proyek Kapal',
  'Gudang & Material',
  'Presensi & Lembur',
  'Keuangan & Kontrak',
  'HSE & Tugas Lapangan',
  'Sistem & Administrasi'
];

/**
 * Generate default permissions based on standard enterprise roles
 */
export function getDefaultPermissionsForRole(role: UserRole): Record<string, ModulePermission> {
  const result: Record<string, ModulePermission> = {};

  for (const mod of ALL_PERMISSION_MODULES) {
    if (role === 'creator') {
      // Creator has absolute, full authority across every module
      result[mod.id] = {
        canAccess: true,
        canEdit: true,
        canDelete: true,
        canUpload: true,
        canDownload: true
      };
    } else if (role === 'admin') {
      // Admin has broad operational authority
      const isSystemAdminOnly = mod.id === 'settings-audit' || mod.id === 'users-permissions' || mod.id === 'users-waitlist';
      result[mod.id] = {
        canAccess: true,
        canEdit: mod.supportedActions.canEdit,
        canDelete: isSystemAdminOnly ? (mod.id === 'users-waitlist') : mod.supportedActions.canDelete,
        canUpload: mod.supportedActions.canUpload,
        canDownload: mod.supportedActions.canDownload
      };
    } else if (role === 'staff') {
      // Staff can access operational pages, but not system administration
      const isSystem = mod.category === 'Sistem & Administrasi';
      const isRestrictedFinance = mod.id === 'finance-contract' || mod.id === 'finance-labor';
      
      result[mod.id] = {
        canAccess: !isSystem && !isRestrictedFinance,
        canEdit: !isSystem && !isRestrictedFinance && mod.supportedActions.canEdit,
        canDelete: false, // Staff never deletes records
        canUpload: !isSystem && mod.supportedActions.canUpload,
        canDownload: !isSystem && mod.supportedActions.canDownload
      };
    } else {
      // Karyawan has restricted view-only permissions on select pages
      const allowedKaryawanPages = [
        'dashboard',
        'employees-profile',
        'employees-photos',
        'attendance-timesheet',
        'attendance-overtime',
        'attendance-nightshift',
        'attendance-time-calc',
        'announcements',
        'tasks'
      ];
      const isAllowed = allowedKaryawanPages.includes(mod.id);

      result[mod.id] = {
        canAccess: isAllowed,
        canEdit: false,
        canDelete: false,
        canUpload: mod.id === 'employees-photos', // Allow uploading personal photo
        canDownload: isAllowed && mod.supportedActions.canDownload
      };
    }
  }

  return result;
}
