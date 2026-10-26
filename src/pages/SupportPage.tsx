import React, { useState } from 'react';
import { 
  BookOpen, 
  HelpCircle, 
  ShieldCheck, 
  Lock, 
  Server, 
  Key, 
  ArrowLeft, 
  ChevronRight, 
  CheckCircle2, 
  AlertTriangle,
  FileText,
  UserCheck,
  Ship,
  Sparkles
} from 'lucide-react';
import { AppView } from '../types/navigation';
import supportBanner from '../assets/images/support_center_hub_1792239410321.jpg';

export const SupportPage: React.FC<{ onNavigate: (view: AppView) => void }> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'guide' | 'faq' | 'security' | 'privacy' | 'maintenance' | 'access'>('guide');
  const [imgError, setImgError] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header / Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">
              <button 
                onClick={() => onNavigate('landing')}
                className="inline-flex items-center gap-1 hover:underline text-slate-500 dark:text-slate-400"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Beranda</span>
              </button>
              <span>/</span>
              <span>Layanan Dukungan Resmi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Pusat Bantuan &amp; Layanan Dukungan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Dokumentasi teknis, panduan operasional galangan kapal, FAQ, dan kebijakan privasi sistem NEXAPROJECT.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('login')}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition whitespace-nowrap"
            >
              Masuk ke Aplikasi
            </button>
          </div>
        </div>

        {/* Hero Visual for Support Hub */}
        <div className="mb-8 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-md relative min-h-[180px] sm:min-h-[220px] bg-linear-to-r from-slate-950 via-slate-900 to-blue-950 flex items-center">
          {!imgError && (
            <img
              src={supportBanner}
              alt="Pusat Layanan Dukungan NEXAPROJECT"
              onError={() => setImgError(true)}
              className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-luminosity"
            />
          )}

          {/* Fallback decorative technical grid */}
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

          <div className="relative z-10 p-6 sm:p-10 text-white max-w-2xl">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-blue-900/60 border border-blue-500/30 text-[11px] font-mono text-blue-300 uppercase tracking-wider mb-2 font-semibold">
              <Sparkles className="w-3 h-3 text-blue-400" />
              <span>Technical Documentation &amp; Security Compliance</span>
            </div>
            <h2 className="text-lg sm:text-2xl font-bold leading-snug">
              Bantuan Terintegrasi Untuk Operasional Galangan Tanpa Hambatan
            </h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed hidden sm:block">
              Panduan lengkap tata kelola sistem galangan kapal: perizinan peran berjenjang, sinkronisasi offline PWA, kepatuhan K3/HSE, serta audit integritas data.
            </p>
          </div>
        </div>

        {/* Tab Navigation Controls (Button segmented, not pills) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 border-b border-slate-200 dark:border-slate-800 scrollbar-none">
          <button
            onClick={() => setActiveTab('guide')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap shrink-0 ${
              activeTab === 'guide'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Panduan Sistem</span>
          </button>

          <button
            onClick={() => setActiveTab('faq')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap shrink-0 ${
              activeTab === 'faq'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>FAQ &amp; Tanya Jawab</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap shrink-0 ${
              activeTab === 'security'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Keamanan Sistem</span>
          </button>

          <button
            onClick={() => setActiveTab('privacy')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap shrink-0 ${
              activeTab === 'privacy'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privasi &amp; Kebijakan Data</span>
          </button>

          <button
            onClick={() => setActiveTab('maintenance')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap shrink-0 ${
              activeTab === 'maintenance'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Pemeliharaan Server</span>
          </button>

          <button
            onClick={() => setActiveTab('access')}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap shrink-0 ${
              activeTab === 'access'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Hak Akses &amp; Otoritas (RBAC)</span>
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xs">
          
          {/* 1. Panduan Penggunaan */}
          {activeTab === 'guide' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Panduan Penggunaan Sistem (User Guide)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Instruksi alur kerja lengkap dari registrasi awal hingga pengisian data lapangan di galangan kapal.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">1</span>
                    Registrasi &amp; Persetujuan Akun
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Setiap pendaftar baru otomatis masuk ke Daftar Tunggu dengan peran Karyawan. Administrator atau Creator akan memverifikasi data dan menentukan jabatan sebelum Anda dapat login.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">2</span>
                    Penggunaan Mode Offline (PWA)
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Jika Anda berada di dalam lambung kapal (hull) tanpa sinyal internet, pengisian time sheet dan stok tetap tersimpan di penyimpanan lokal dan disinkronkan saat terhubung kembali.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">3</span>
                    Kamera &amp; Pemindaian Barcode
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Beri izin akses kamera pada perangkat untuk memindai QR Code barang gudang, ID Karyawan, dan mengambil foto progres proyek langsung di lapangan.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">4</span>
                    Pusat Ekspor &amp; Impor Excel
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Setiap tabel data mendukung unduh template, validasi formula injection, dan peninjauan pra-impor untuk mencegah duplikasi atau korupsi data.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 2. Pertanyaan & Bantuan */}
          {activeTab === 'faq' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Pertanyaan yang Sering Diajukan (FAQ)</h3>
              
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                  Mengapa akun saya berstatus "Menunggu Persetujuan"?
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Semua registrasi baru harus diaudit oleh Creator atau Administrator proyek guna memverifikasi bahwa pendaftar adalah tenaga kerja resmi pada proyek galangan bersangkutan.
                </p>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                  Apa yang terjadi jika saya salah memasukkan kata sandi 3 kali?
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Sistem keamanan akan mengunci akun selama 5 menit. Jika setelahnya gagal 3x lagi, penguncian bertambah menjadi 10 menit, dan 3x lagi menjadi 1 jam demi mencegah serangan brute force.
                </p>
              </div>

              <div className="border border-slate-200 dark:border-slate-800 rounded-xl p-4">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                  Mengapa layar terkunci setelah 15 menit tidak ada aktivitas?
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Ini adalah standar proteksi data rahasia galangan. Masukkan kembali kata sandi Anda pada modal "Sesi Terkunci" untuk melanjutkan tanpa kehilangan form yang sedang Anda isi.
                </p>
              </div>
            </div>
          )}

          {/* 3. Keamanan Akun */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Standar Keamanan Akun &amp; OWASP</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="font-bold block mb-1 text-blue-600 dark:text-blue-400">1. Salt Terisolasi</span>
                  <p className="text-slate-600 dark:text-slate-300">
                    Kata sandi disimpan dengan salt unik terpisah per akun sehingga tidak dapat diterjemahkan menggunakan rainbow tables.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="font-bold block mb-1 text-emerald-600 dark:text-emerald-400">2. Anti-Screenshot</span>
                  <p className="text-slate-600 dark:text-slate-300">
                    Sistem mendeteksi percobaan pencetakan dan tangkapan layar, lalu memburamkan data sensitif seketika.
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <span className="font-bold block mb-1 text-amber-600 dark:text-amber-400">3. Audit Log Terinci</span>
                  <p className="text-slate-600 dark:text-slate-300">
                    Setiap upaya login gagal, perubahan hak akses, dan persetujuan akun dicatat ke dalam log audit tak terhapus.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 4. Privasi & Data */}
          {activeTab === 'privacy' && (
            <div className="space-y-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Kebijakan Privasi &amp; Perlindungan Data</h3>
              <p>
                NEXAPROJECT mengelola data personal karyawan (KTP, NPWP, BPJS, Rekening Bank) serta nilai kontrak proyek secara terenkripsi. Hak akses dibatasi hanya untuk Creator dan Administrator berwenang.
              </p>
              <p>
                File gambar KTP dan Kartu Keluarga hanya dapat diakses oleh pemilik akun dan Creator/Admin, tidak pernah dibagikan kepada pihak ketiga di luar kepatuhan regulasi ketenagakerjaan.
              </p>
            </div>
          )}

          {/* 5. Pemeliharaan Sistem */}
          {activeTab === 'maintenance' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Jadwal Pemeliharaan &amp; Ketersediaan Sistem</h3>
              <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20 text-xs">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300 font-bold mb-1">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Sistem Berjalan Normal (100% Uptime Operational)</span>
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  Pemeliharaan database otomatis dijadwalkan setiap hari Minggu pukul 02:00 - 03:00 WIB tanpa mengganggu antrean lokal PWA.
                </p>
              </div>
            </div>
          )}

          {/* 6. Akses Layanan */}
          {activeTab === 'access' && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Matriks Otoritas Peran (RBAC)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white">
                    <tr>
                      <th className="p-2.5 border-b border-slate-200 dark:border-slate-800">Peran Akun</th>
                      <th className="p-2.5 border-b border-slate-200 dark:border-slate-800">Cakupan Otoritas</th>
                      <th className="p-2.5 border-b border-slate-200 dark:border-slate-800">Hak Khusus</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-600 dark:text-slate-300">
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">Creator</td>
                      <td className="p-2.5">Otoritas absolut seluruh modul, skema, dan database</td>
                      <td className="p-2.5 text-blue-600 dark:text-blue-400 font-mono">Bypass RBAC, Edit Biaya Proyek</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">Admin</td>
                      <td className="p-2.5">Kelola pengguna, proyek, kalkulasi waktu, persetujuan daftar tunggu</td>
                      <td className="p-2.5">Tidak bisa memberi peran Creator</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">Staff</td>
                      <td className="p-2.5">Operasional penginputan proyek, gudang, absensi lapangan</td>
                      <td className="p-2.5">Tidak dapat menghapus data permanen</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">Karyawan</td>
                      <td className="p-2.5">Hanya melihat data profil pribadi, tugas, dan modul publik</td>
                      <td className="p-2.5 text-slate-400">View-only terestriksi</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
