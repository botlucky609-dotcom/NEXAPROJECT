import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrightnessTheme, LanguageCode } from '../types/auth';
import { AppSettings, DEFAULT_SETTINGS, ServerStatus } from '../types/settings';
import { settingsDb } from '../services/settingsDb';

export interface ThemeContextType {
  theme: BrightnessTheme;
  setTheme: (theme: BrightnessTheme) => void;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, fallback?: string) => string;
  appSettings: AppSettings;
  updateSettings: (updater: Partial<AppSettings> | ((prev: AppSettings) => AppSettings)) => Promise<void>;
  resetSettings: () => Promise<void>;
  setServerStatus: (status: ServerStatus, message?: string, estimatedEnd?: string, updatedBy?: string) => Promise<void>;
}

const translations: Record<LanguageCode, Record<string, string>> = {
  id: {
    // Brand & Topbar
    'app.name': 'NEXAPROJECT',
    'app.subtitle': 'Manajemen Galangan Kapal & Proyek Industri',
    'app.tagline': 'Enterprise Shipyard Management',
    'nav.home': 'Beranda',
    'nav.support': 'Layanan Dukungan',
    'nav.login': 'Masuk',
    'nav.register': 'Daftar Akun',
    'nav.dashboard': 'Dashboard',
    'nav.logout': 'Keluar',
    'nav.sidebar_toggle': 'Menu Samping',

    // Sidebar navigation groups
    'sidebar.group.main': 'Menu Utama',
    'sidebar.group.employees': 'Modul Karyawan',
    'sidebar.group.projects': 'Modul Proyek Kapal',
    'sidebar.group.warehouse': 'Modul Gudang & Material',
    'sidebar.group.attendance': 'Halaman Absensi (Presensi & Jam Kerja)',
    'sidebar.group.finance': 'Modul Keuangan & Kontrak',
    'sidebar.group.hse': 'Modul HSE & Tugas',
    'sidebar.group.system': 'Sistem & Administrasi',

    // Submenu links
    'menu.employees.data': 'Data Karyawan',
    'menu.employees.profile': 'Profil Resmi Karyawan',
    'menu.employees.photos': 'Penyimpanan Foto Dokumen',
    'menu.projects.list': 'Daftar Proyek Kapal',
    'menu.projects.supervisors': 'Pengawas Proyek',
    'menu.projects.progress': 'Progres Pengerjaan',
    'menu.projects.cost': 'Biaya Proyek (Khusus Creator)',
    'menu.warehouse.inventory': 'Inventaris Gudang',
    'menu.warehouse.orders': 'Permintaan Barang (Order)',
    'menu.attendance.timesheet': 'Form Time Sheet',
    'menu.attendance.overtime': 'Form Over time',
    'menu.attendance.nightshift': 'Form Night Shift',
    'menu.attendance.time_calc': 'Kalkulasi Waktu',
    'menu.attendance.project_calc': 'Kalkulasi Proyek',
    'menu.attendance.summary': 'Summary',
    'menu.attendance.labor_cost': 'Biaya Pekerja',
    'menu.finance.contracts': 'Kontrak & Termin Penagihan',
    'menu.finance.operational': 'Biaya Operasional & Voucher',
    'menu.finance.cashflow': 'Arus Kas & Margin Galangan',
    'menu.announcements': 'Pengumuman & K3',
    'menu.tasks': 'Tugas Kerja Lapangan',
    'menu.settings.audit': 'Jejak Audit & RBAC',
    'menu.waitlist': 'Daftar Tunggu Akun',
    'menu.support': 'Layanan Dukungan & Bantuan',

    // Support Page
    'support.title': 'Pusat Bantuan & Layanan Dukungan',
    'support.desc': 'Dokumentasi teknis, panduan operasional galangan kapal, FAQ, dan kebijakan privasi sistem NEXAPROJECT.',
    'support.tab.guide': 'Panduan Sistem',
    'support.tab.faq': 'FAQ & Tanya Jawab',
    'support.tab.security': 'Keamanan Sistem',
    'support.tab.privacy': 'Privasi & Kebijakan Data',
    'support.tab.maintenance': 'Pemeliharaan Server',
    'support.tab.access': 'Hak Akses & Otoritas (RBAC)',

    // Roles & Protection
    'role.creator': 'Creator (Pengembang)',
    'role.admin': 'Administrator',
    'role.staff': 'Staff Operasional',
    'role.karyawan': 'Karyawan Galangan',
    'role.creator_protected': 'Akun Creator Terlindungi',
    'role.creator_protected_desc': 'Akun ini memiliki hak istimewa CREATOR tertinggi. Hak akses dan status terlindungi dari perubahan atau penghapusan oleh Administrator, Staff, atau Karyawan.',
    'role.demo_switch': 'Ganti Peran Uji Coba (Demo):',

    // Brightness
    'theme.terang': 'Mode Terang',
    'theme.gelap': 'Mode Gelap',
    'theme.redup': 'Mode Redup (Pelindung Mata)',
    'theme.label': 'Kecerahan Layar',

    // Language
    'lang.label': 'Bahasa Sistem',
    'lang.id': 'Bahasa Indonesia',
    'lang.en': 'English',

    // Landing Page
    'landing.badge': 'Platform Manajemen Galangan Kapal & Industri Berat',
    'landing.hero.title': 'Kendali Penuh Proyek Industri Berpresisi Tinggi',
    'landing.hero.desc': 'Arsitektur multi-perangkat (Web, Android, iOS) yang tangguh dengan dukungan offline PWA, sistem keamanan berlapis, manajemen tenaga kerja galangan, monitoring progres kapal, dan proteksi akun creator.',
    'landing.hero.badge_fab': 'Galangan & Fabrikasi Baja',
    'landing.hero.badge_pwa': 'PWA Offline Ready',
    'landing.cta.start': 'Buka Dashboard Sistem',
    'landing.cta.open_dash': 'Buka Dashboard',
    'landing.cta.support': 'Pelajari Layanan Dukungan',
    'landing.cta.google': 'Masuk Google',
    'landing.cta.register': 'Daftar Akun Baru',
    'landing.quicktest.title': 'Uji Akses Cepat Akun Demo (Evaluasi Sistem)',
    'landing.quicktest.desc': 'Klik salah satu peran di bawah untuk menguji sistem seketika tanpa perlu login manual:',
    'landing.pillars.title': 'Fondasi Arsitektur Enterprise',
    'landing.pillars.desc': 'Dirancang untuk ketahanan kerja lapangan di galangan kapal tanpa ketergantungan koneksi internet konstan.',
    'landing.features.offline.title': '100% Dukungan Offline PWA',
    'landing.features.offline.desc': 'Aplikasi tetap beroperasi mulus saat koneksi internet terputus. Antrean data tersinkronisasi otomatis begitu perangkat kembali online.',
    'landing.features.security.title': 'Keamanan Tingkat Tinggi',
    'landing.features.security.desc': 'Proteksi anti-screenshot, lockout bertahap, hashing sandi bersekat, auto-lockout 10/15 menit, dan perlindungan absolut peran Creator.',
    'landing.features.roles.title': '4 Tingkatan Hak Akses Berjenjang',
    'landing.features.roles.desc': 'Pembagian otoritas presisi antara Creator (Pengembang Utama), Admin, Staff, dan Karyawan dengan proteksi anti-tampering.',
    'landing.feature.camera': 'Dukungan Izin Kamera Device',
    'landing.feature.qr': 'QR Code & Barcode Terintegrasi',
    'landing.feature.excel': 'Excel Import Center & Formula Defense',
    'landing.feature.brightness': '3 Kecerahan (Terang, Gelap, Redup)',

    // Dashboard
    'dash.welcome': 'Selamat Datang',
    'dash.subtitle': 'Sistem Operasional Galangan Kapal & Manajemen Proyek Terintegrasi',
    'dash.online_synced': 'Sinkronisasi Waktu Nyata Aktif',
    'dash.block1.title': '1. Informasi Pengumuman Proyek',
    'dash.block1.desc': 'Instruksi keselamatan kerja dan jadwal briefing harian galangan',
    'dash.block2.title': '2. Informasi Tugas & Progres Lapangan',
    'dash.block2.desc': 'Daftar penugasan aktif fabrikasi baja, perpipaan, dan kelistrikan',
    'dash.block3.title': '3. Statistik Tenaga Kerja (Karyawan)',
    'dash.block3.desc': 'Data personil lapangan terdaftar dari Halaman Data Karyawan',
    'dash.block4.title': '4. Statistik Kapal & Proyek Galangan',
    'dash.block4.desc': 'Status pengerjaan kapal dari Halaman Daftar Proyek',
    'dash.block5.title': '5. Permintaan Barang Tertunda (Warehouse Order)',
    'dash.block5.desc': 'Pengajuan material kawat las, cat primer, pelat, dan perkakas',
    'dash.block6.title': '6. Kalender Kerja Galangan',
    'dash.block6.desc': 'Jadwal operasional, hari Sabtu (Biru) & Minggu (Merah)',

    'dash.stat.active_emp': 'Karyawan Aktif',
    'dash.stat.inactive_emp': 'Karyawan Tidak Aktif / Keluar',
    'dash.stat.total_emp': 'Total Karyawan Terdata',
    'dash.stat.completed_proj': 'Proyek Selesai (Completed)',
    'dash.stat.running_proj': 'Proyek Berjalan (In Progress)',
    'dash.stat.total_proj': 'Total Proyek Terdata',

    'dash.stat.working_today': 'Bekerja di galangan hari ini',
    'dash.stat.contract_ended': 'Masa kontrak usai atau non-aktif',
    'dash.stat.all_db': 'Seluruh personil dalam database',
    'dash.stat.handover': 'Kapal telah diserahterimakan ke owner',
    'dash.stat.docking_now': 'Sedang dalam tahap docking / new building',
    'dash.stat.all_track': 'Seluruh rekam jejak galangan kapal',
    'dash.btn.waitlist': 'Kelola Daftar Tunggu',
    'dash.progress_label': 'Progres Pekerjaan',
    'dash.schedule': 'Jadwal',
    'dash.priority': 'Prioritas',
    'dash.valid_until': 'Berlaku s/d',
    'dash.applicant': 'Pemohon',
    'dash.time': 'Waktu',
    'dash.calendar.workday': 'Hari Kerja Senin-Jumat',
    'dash.calendar.saturday': 'Sabtu (Biru) - Lembur Khusus',
    'dash.calendar.sunday': 'Minggu (Merah) - Libur Nasional',

    // Employee Module
    'emp.data.title': 'Data Karyawan Galangan',
    'emp.data.desc': 'Manajemen data personil, pencatatan lengkap 7 tab, impor & ekspor Excel resmi.',
    'emp.profile.title': 'Profil Resmi Karyawan',
    'emp.profile.desc': 'Tampilan kartu identitas personil resmi galangan (Mode Tinjau Terproteksi).',
    'emp.photos.title': 'Penyimpanan Foto Dokumen & Kamera',
    'emp.photos.desc': 'Arsip digital KTP, KK, NPWP, BPJS, Sertifikat Las, dan integrasi kamera langsung.',
    'emp.btn.add': 'Tambah Karyawan Baru',
    'emp.btn.export': 'Ekspor ke Excel (.xlsx)',
    'emp.btn.import': 'Impor dari Excel (.xlsx)',
    'emp.search.placeholder': 'Cari berdasarkan nama, ID karyawan, NIK, jabatan...',
    'emp.filter.dept': 'Semua Departemen',
    'emp.filter.status': 'Semua Status',
    'emp.tab.main': '1. Data Utama',
    'emp.tab.wage': '2. Kompensasi & Upah',
    'emp.tab.personal': '3. Data Pribadi',
    'emp.tab.contacts': '4. Kontak & Sipil',
    'emp.tab.bank': '5. Rekening Bank',
    'emp.tab.account': '6. Akun Sistem',
    'emp.tab.exit': '7. Catatan Keluar',

    // Projects Module
    'proj.list.title': 'Daftar Proyek Kapal Galangan',
    'proj.list.desc': 'Monitoring kapal komersial, tipe pekerjaan, estimasi jadwal, dan status docking.',
    'proj.supervisors.title': 'Pengawas Proyek Lapangan',
    'proj.supervisors.desc': 'Penugasan Superintendent, Pengawas Hull, Welding Inspector, dan Safety Officer.',
    'proj.progress.title': 'Progres Pengerjaan & Kurva-S',
    'proj.progress.desc': 'Monitoring persentase realisasi pekerjaan per divisi, milestone, dan inspeksi.',
    'proj.cost.title': 'Biaya Proyek & Margin (Khusus Creator)',
    'proj.cost.desc': 'Analisis Rencana Anggaran Biaya (RAB), realisasi pengeluaran, dan margin keuntungan proyek.',

    // Warehouse & Material Module (Tahap 4)
    'menu.warehouse.movements': 'Arus Masuk Keluar Barang',
    'wh.inv.title': 'Inventaris & Stok Material Galangan',
    'wh.inv.desc': 'Monitoring ketersediaan pelat baja, kawat las, cat marine, perpipaan, dan peringatan batas aman persediaan.',
    'wh.orders.title': 'Permintaan Barang & Otorisasi Proyek',
    'wh.orders.desc': 'Alur pengajuan material kapal galangan dengan verifikasi batas anggaran otorisasi khusus Creator.',
    'wh.stat.total_items': 'Total Item Terdata',
    'wh.stat.low_stock': 'Peringatan Stok Rendah',
    'wh.stat.pending_orders': 'Permintaan Tertunda',
    'wh.stat.total_val': 'Estimasi Nilai Inventaris',
    'wh.btn.add_item': 'Tambah Material Baru',
    'wh.btn.stock_in': 'Penerimaan Stok Masuk',
    'wh.btn.new_order': 'Buat Permintaan Barang',
    'wh.btn.export': 'Ekspor Excel Inventaris (.xlsx)',
    'wh.btn.export_orders': 'Ekspor Permintaan (.xlsx)',
    'wh.filter.category': 'Semua Kategori Material',
    'wh.order.creator_req': 'Otorisasi Khusus Creator (> Rp 50 Jt)',
    'wh.order.approve_creator_only': 'Akses Ditolak: Otorisasi permintaan di atas Rp 50.000.000 wajib disetujui langsung oleh peran CREATOR!',
    'wh.order.fulfill': 'Keluarkan Barang ke Proyek',
    'wh.order.reject': 'Tolak Pengajuan',
    'wh.order.approve': 'Setujui Pengajuan',
    'wh.order.rejected_status': 'DITOLAK',
    'wh.order.received_status': 'BARANG DITERIMA',
    'wh.order.approved_status': 'DISETUJUI',
    'wh.order.pending_status': 'MENUNGGU PERSETUJUAN',

    // Attendance & Overtime Module (Tahap 5)
    'att.timesheet.title': 'Presensi & Jam Kerja Lapangan Galangan',
    'att.timesheet.desc': 'Monitoring kehadiran harian teknisi, shift kerja, jam kerja reguler, dan alokasi proyek kapal.',
    'att.overtime.title': 'Klaim & Perintah Lembur Lapangan (SPL)',
    'att.overtime.desc': 'Otorisasi lembur hari kerja (1.5x), Sabtu khusus (2.0x), Minggu/Libur (3.0x), shift malam, dan tunjangan gouging.',
    'att.calc.title': 'Kalkulator Biaya Upah & Jam Kerja Proyek',
    'att.calc.desc': 'Rekapitulasi total jam orang (man-hours), upah harian/jam, lembur, dan alokasi realisasi beban biaya proyek kapal.',
    'att.stat.present_today': 'Hadir Bekerja Hari Ini',
    'att.stat.ot_pending': 'Klaim Lembur Menunggu',
    'att.stat.total_hours': 'Total Jam Reguler',
    'att.stat.total_ot_hours': 'Total Jam Lembur',
    'att.btn.record': 'Catat Presensi Karyawan',
    'att.btn.new_ot': 'Buat Surat Perintah Lembur',
    'att.btn.export_att': 'Ekspor Presensi (.xlsx)',
    'att.btn.export_ot': 'Ekspor Lembur (.xlsx)',
    'att.btn.export_labor': 'Ekspor Biaya Upah (.xlsx)',

    // Common
    'common.save': 'Simpan Data',
    'common.cancel': 'Batal',
    'common.back': 'Kembali',
    'common.actions': 'Aksi',
    'common.status': 'Status',
    'common.active': 'Aktif',
    'common.inactive': 'Tidak Aktif',
    'common.pending': 'Menunggu Persetujuan',
    'common.approved': 'Disetujui',
    'common.rejected': 'Ditolak',
    'common.blocked': 'Terblokir',
    'common.role': 'Peran Akun',
    'common.access_denied': 'Akses Ditolak',
    'common.access_denied_desc': 'Halaman ini dilindungi secara ketat dan hanya dapat diakses oleh peran CREATOR sistem.',
    'common.online': 'Terhubung (Online)',
    'common.offline': 'Offline (Mode Tersimpan Lokal)',
    'common.install_pwa': 'Pasang Aplikasi (PWA)',
    'common.loading': 'Memuat data sistem...',
    'common.view': 'Lihat Detail',
    'common.edit': 'Ubah Data',
    'common.delete': 'Hapus Data',
    'common.confirm_delete': 'Apakah Anda yakin ingin menghapus data ini?',

    // Creator Protection Alert Messages
    'creator.protection_denied_edit': 'Akses Ditolak: Akun CREATOR memiliki hak istimewa tertinggi yang dilindungi. Peran dibawahnya tidak dapat mengubah akun ini.',
    'creator.protection_denied_delete': 'Akses Ditolak: Akun CREATOR dilindungi secara permanen dan tidak dapat disentuh atau dihapus oleh Administrator, Staff, maupun Karyawan!',
    'creator.protection_badge': '👑 Role Creator - Terproteksi',

    // Authentication & Accounts (Login, Pendaftaran, Lupa Kata Sandi)
    'auth.login.back_to_landing': 'Kembali ke Beranda',
    'auth.login.title': 'Masuk ke Sistem',
    'auth.login.subtitle': 'Akses Enterprise Galangan Kapal & Proyek NEXAPROJECT',
    'auth.login.locked': 'Akun Terkunci Sementara',
    'auth.login.identity': 'Nama Pengguna atau Email',
    'auth.login.identity.placeholder': 'Masukkan nama pengguna atau email...',
    'auth.login.password': 'Kata Sandi',
    'auth.login.password.placeholder': 'Masukkan kata sandi akun...',
    'auth.login.remember': 'Ingat identitas saya',
    'auth.login.forgot': 'Lupa kata sandi?',
    'auth.login.submit': 'Masuk ke Sistem',
    'auth.login.register_prompt': 'Belum memiliki akun resmi?',
    'auth.login.register_link': 'Ajukan Pendaftaran Baru',

    'auth.register.title': 'Pendaftaran Akun Baru',
    'auth.register.subtitle': 'Pengajuan akses ke Sistem Enterprise NEXAPROJECT. Verifikasi manual oleh Administrator Sistem.',
    'auth.register.fullname': 'Nama Lengkap',
    'auth.register.fullname.placeholder': 'Contoh: BUDI SANTOSO',
    'auth.register.username': 'Nama Pengguna (Username)',
    'auth.register.username.placeholder': '8-18 karakter alfanumerik...',
    'auth.register.email': 'Alamat Email Perusahaan / Pribadi',
    'auth.register.email.placeholder': 'nama@perusahaan.com',
    'auth.register.password': 'Kata Sandi Akun',
    'auth.register.password.placeholder': 'Minimal 8 karakter campuran...',
    'auth.register.confirm_password': 'Konfirmasi Kata Sandi',
    'auth.register.confirm_password.placeholder': 'Ulangi kata sandi di atas...',
    'auth.register.submit': 'Kirim Permohonan Pendaftaran',
    'auth.register.login_prompt': 'Sudah memiliki akun terverifikasi?',
    'auth.register.login_link': 'Masuk ke Sistem',
    'auth.register.pending_modal_title': 'Pendaftaran Berhasil Diajukan',
    'auth.register.pending_modal_desc': 'Data permohonan Anda telah dicatat dalam antrean waitlist sistem. Administrator sistem akan memverifikasi dan menyetujui akun Anda sebelum dapat digunakan.',
    'auth.register.blocked_modal_title': 'Akses Pendaftaran Ditangguhkan',
    'auth.register.blocked_modal_desc': 'Permohonan akun Anda telah ditolak sebanyak 3 kali berturut-turut. Sesuai kebijakan keamanan sistem galangan kapal, pendaftaran ditangguhkan sementara selama 24 jam.',

    'auth.forgot.title': 'Pemulihan Kata Sandi',
    'auth.forgot.subtitle': 'Reset kata sandi akun melalui verifikasi kode 6-digit email aman',
    'auth.forgot.input': 'Nama Pengguna atau Alamat Email',
    'auth.forgot.submit_code': 'Kirim Kode Verifikasi 6-Digit',
    'auth.forgot.timer': 'Sisa waktu berlaku kode:',
    'auth.forgot.code_label': 'Kode Verifikasi 6-Digit',
    'auth.forgot.resend': 'Kirim Ulang Kode Verifikasi',
    'auth.forgot.new_password': 'Kata Sandi Baru',
    'auth.forgot.confirm_new_password': 'Konfirmasi Kata Sandi Baru',
    'auth.forgot.reset_submit': 'Simpan & Perbarui Kata Sandi',
    'auth.forgot.success': 'Kata sandi berhasil diperbarui! Mengalihkan ke halaman masuk...',
  },
  en: {
    // Brand & Topbar
    'app.name': 'NEXAPROJECT',
    'app.subtitle': 'Shipyard & Industrial Project Management System',
    'app.tagline': 'Enterprise Shipyard Management',
    'nav.home': 'Home',
    'nav.support': 'Support Center',
    'nav.login': 'Sign In',
    'nav.register': 'Register',
    'nav.dashboard': 'Dashboard',
    'nav.logout': 'Sign Out',
    'nav.sidebar_toggle': 'Side Menu',

    // Sidebar navigation groups
    'sidebar.group.main': 'Main Navigation',
    'sidebar.group.employees': 'Employee Module',
    'sidebar.group.projects': 'Ship Projects Module',
    'sidebar.group.warehouse': 'Warehouse & Material Module',
    'sidebar.group.attendance': 'Attendance & Timesheets',
    'sidebar.group.finance': 'Shipyard Finance & Contracts',
    'sidebar.group.hse': 'HSE & Work Orders',
    'sidebar.group.system': 'System Administration',

    // Submenu links
    'menu.employees.data': 'Employee Master Data',
    'menu.employees.profile': 'Official Employee Profile',
    'menu.employees.photos': 'Document Photos & Camera',
    'menu.projects.list': 'Ship Project Directory',
    'menu.projects.supervisors': 'Project Supervisors',
    'menu.projects.progress': 'Work Progress & S-Curve',
    'menu.projects.cost': 'Project Costs (Creator Only)',
    'menu.warehouse.inventory': 'Warehouse Inventory',
    'menu.warehouse.orders': 'Material Purchase Orders',
    'menu.attendance.timesheet': 'Form Time Sheet',
    'menu.attendance.overtime': 'Form Over time',
    'menu.attendance.nightshift': 'Form Night Shift',
    'menu.attendance.time_calc': 'Time Calculation',
    'menu.attendance.project_calc': 'Project Calculation',
    'menu.attendance.summary': 'Summary',
    'menu.attendance.labor_cost': 'Worker Costs',
    'menu.finance.contracts': 'Contracts & Milestone Terms',
    'menu.finance.operational': 'Operational Expenses & Vouchers',
    'menu.finance.cashflow': 'Cashflow & Profit Margins',
    'menu.announcements': 'Safety Bulletins & HSE',
    'menu.tasks': 'Field Work Orders',
    'menu.settings.audit': 'Audit Trail & RBAC',
    'menu.waitlist': 'Approval Waitlist',
    'menu.support': 'Support & Helpdesk',

    // Support Page
    'support.title': 'Support Center & Helpdesk',
    'support.desc': 'Technical documentation, shipyard operational manuals, FAQ, and privacy policies for NEXAPROJECT.',
    'support.tab.guide': 'User Guide',
    'support.tab.faq': 'FAQ & Inquiries',
    'support.tab.security': 'System Security',
    'support.tab.privacy': 'Privacy & Data Policy',
    'support.tab.maintenance': 'Server Maintenance',
    'support.tab.access': 'Role Authority (RBAC)',

    // Roles & Protection
    'role.creator': 'Creator (Chief Architect)',
    'role.admin': 'Administrator',
    'role.staff': 'Operational Staff',
    'role.karyawan': 'Shipyard Worker',
    'role.creator_protected': 'Protected Creator Account',
    'role.creator_protected_desc': 'This account holds the supreme CREATOR authority. Account privileges and status are strictly protected from modification or deletion by Administrators, Staff, or Employees.',
    'role.demo_switch': 'Instant Role Switcher (Demo):',

    // Brightness
    'theme.terang': 'Light Mode',
    'theme.gelap': 'Dark Mode',
    'theme.redup': 'Dim Mode (Eye Care)',
    'theme.label': 'Screen Brightness',

    // Language
    'lang.label': 'System Language',
    'lang.id': 'Indonesian',
    'lang.en': 'English',

    // Landing Page
    'landing.badge': 'Shipyard & Heavy Industrial Project Platform',
    'landing.hero.title': 'Full Precision Control for Industrial Projects',
    'landing.hero.desc': 'Rugged multi-platform architecture (Web, Android, iOS) with offline PWA resilience, multi-layered security, workforce intelligence, real-time ship progress, and absolute Creator privilege protection.',
    'landing.hero.badge_fab': 'Shipyard & Steel Fabrication',
    'landing.hero.badge_pwa': 'PWA Offline Ready',
    'landing.cta.start': 'Open Project Dashboard',
    'landing.cta.open_dash': 'Open Dashboard',
    'landing.cta.support': 'Explore Support Services',
    'landing.cta.google': 'Sign in with Google',
    'landing.cta.register': 'Create New Account',
    'landing.quicktest.title': 'Instant Role Switcher (Evaluation & Demo)',
    'landing.quicktest.desc': 'Click any role below to test the entire application instantly with pre-seeded accounts:',
    'landing.pillars.title': 'Enterprise Architecture Foundation',
    'landing.pillars.desc': 'Engineered for shipyard field resilience without constant internet dependency.',
    'landing.features.offline.title': '100% Offline PWA Resilience',
    'landing.features.offline.desc': 'System continues running seamlessly when internet connection is lost. Pending data synchronizes automatically once reconnecting.',
    'landing.features.security.title': 'High-Grade Security',
    'landing.features.security.desc': 'Anti-screenshot defense, progressive lockout, isolated salt hashing, 10/15-min idle locks, and tamper-proof Creator privilege protection.',
    'landing.features.roles.title': '4-Tier Hierarchical Access Control',
    'landing.features.roles.desc': 'Strict authorization separation between Creator, Administrator, Staff, and Workers with anti-tampering enforcement.',
    'landing.feature.camera': 'Device Camera Support',
    'landing.feature.qr': 'Integrated QR Code & Barcode',
    'landing.feature.excel': 'Excel Import Center & Formula Defense',
    'landing.feature.brightness': '3 Brightness Levels (Light, Dark, Dim)',

    // Dashboard
    'dash.welcome': 'Welcome',
    'dash.subtitle': 'Integrated Commercial Shipyard & Project Management System',
    'dash.online_synced': 'Real-Time Sync Active',
    'dash.block1.title': '1. Project Announcements & Notices',
    'dash.block1.desc': 'Active safety instructions and shipyard briefing schedules',
    'dash.block2.title': '2. Tasks & Operational Work Orders',
    'dash.block2.desc': 'Active assignments for steel work, piping, and electrical teams',
    'dash.block3.title': '3. Workforce Statistics (Employees)',
    'dash.block3.desc': 'Field personnel registered from Employee Master Data',
    'dash.block4.title': '4. Vessel & Shipyard Project Statistics',
    'dash.block4.desc': 'Vessel construction and repair status from Ship Projects',
    'dash.block5.title': '5. Pending Material Orders (Warehouse)',
    'dash.block5.desc': 'Requisitions for welding rods, primer paint, steel plates, and tooling',
    'dash.block6.title': '6. Shipyard Operations Calendar',
    'dash.block6.desc': 'Working schedules, Saturday (Blue) & Sunday (Red) demarcations',

    'dash.stat.active_emp': 'Active Employees',
    'dash.stat.inactive_emp': 'Inactive / Contract Completed',
    'dash.stat.total_emp': 'Total Registered Workers',
    'dash.stat.completed_proj': 'Completed Vessels',
    'dash.stat.running_proj': 'In-Progress Projects',
    'dash.stat.total_proj': 'Total Tracked Projects',

    'dash.stat.working_today': 'Working at shipyard today',
    'dash.stat.contract_ended': 'Contract ended or inactive',
    'dash.stat.all_db': 'All personnel recorded in database',
    'dash.stat.handover': 'Vessel delivered to owner',
    'dash.stat.docking_now': 'Undergoing docking or new building',
    'dash.stat.all_track': 'Total shipyard project track record',
    'dash.btn.waitlist': 'Manage Approval Waitlist',
    'dash.progress_label': 'Work Progress',
    'dash.schedule': 'Schedule',
    'dash.priority': 'Priority',
    'dash.valid_until': 'Valid Until',
    'dash.applicant': 'Applicant',
    'dash.time': 'Time',
    'dash.calendar.workday': 'Monday-Friday Workdays',
    'dash.calendar.saturday': 'Saturday (Blue) - Overtime Shift',
    'dash.calendar.sunday': 'Sunday (Red) - National Holiday',

    // Employee Module
    'emp.data.title': 'Shipyard Workforce Master Data',
    'emp.data.desc': 'Comprehensive 7-tab personnel management, official Excel import and export.',
    'emp.profile.title': 'Official Employee Profile',
    'emp.profile.desc': 'Protected official shipyard personnel identification profile (View-Only Mode).',
    'emp.photos.title': 'Document Photos & Live Camera',
    'emp.photos.desc': 'Digital archives for National ID, Family Card, Tax ID, BPJS, Welding Certs & Camera capture.',
    'emp.btn.add': 'Add New Employee',
    'emp.btn.export': 'Export to Excel (.xlsx)',
    'emp.btn.import': 'Import from Excel (.xlsx)',
    'emp.search.placeholder': 'Search by name, employee ID, national ID, position...',
    'emp.filter.dept': 'All Departments',
    'emp.filter.status': 'All Statuses',
    'emp.tab.main': '1. Main Data',
    'emp.tab.wage': '2. Compensation & Wages',
    'emp.tab.personal': '3. Personal Data',
    'emp.tab.contacts': '4. Contacts & Civil IDs',
    'emp.tab.bank': '5. Bank Account',
    'emp.tab.account': '6. System Account',
    'emp.tab.exit': '7. Exit Notes',

    // Projects Module
    'proj.list.title': 'Ship Projects Directory',
    'proj.list.desc': 'Commercial vessel monitoring, work types, schedule forecasts, and drydock statuses.',
    'proj.supervisors.title': 'Field Project Supervisors',
    'proj.supervisors.desc': 'Superintendent assignments, Hull Supervisors, Welding Inspectors & Safety Officers.',
    'proj.progress.title': 'Work Progress & S-Curve',
    'proj.progress.desc': 'Progress tracking across divisions, milestones, and daily inspection logs.',
    'proj.cost.title': 'Project Costs & Profit Margin (Creator Only)',
    'proj.cost.desc': 'Budget estimation analysis (RAB), actual expenditures, and financial profit margin.',

    // Warehouse & Material Module (Tahap 4)
    'menu.warehouse.movements': 'Stock In & Out Movements',
    'wh.inv.title': 'Shipyard Material Inventory & Stock',
    'wh.inv.desc': 'Real-time stock monitoring of marine steel plates, welding electrodes, epoxy paints, pipes, and safety threshold alerts.',
    'wh.orders.title': 'Material Requisitions & Order Approvals',
    'wh.orders.desc': 'Project material requisition workflow with Creator authorization threshold defense.',
    'wh.stat.total_items': 'Total Stock Items',
    'wh.stat.low_stock': 'Low Stock Warnings',
    'wh.stat.pending_orders': 'Pending Requisitions',
    'wh.stat.total_val': 'Total Inventory Value',
    'wh.btn.add_item': 'Add New Material',
    'wh.btn.stock_in': 'Record Stock Receipt',
    'wh.btn.new_order': 'Create Material Requisition',
    'wh.btn.export': 'Export Inventory (.xlsx)',
    'wh.btn.export_orders': 'Export Requisitions (.xlsx)',
    'wh.filter.category': 'All Material Categories',
    'wh.order.creator_req': 'Creator Authorization Required (> Rp 50M)',
    'wh.order.approve_creator_only': 'Access Denied: Requisitions exceeding Rp 50,000,000 strictly require authorization by CREATOR!',
    'wh.order.fulfill': 'Issue Material to Project',
    'wh.order.reject': 'Reject Requisition',
    'wh.order.approve': 'Approve Requisition',
    'wh.order.rejected_status': 'REJECTED',
    'wh.order.received_status': 'RECEIVED AT YARD',
    'wh.order.approved_status': 'APPROVED',
    'wh.order.pending_status': 'PENDING APPROVAL',

    // Attendance & Overtime Module (Tahap 5)
    'att.timesheet.title': 'Shipyard Field Attendance & Timesheet',
    'att.timesheet.desc': 'Daily monitoring of field workforce presence, shift schedules, regular hours, and vessel project assignment.',
    'att.overtime.title': 'Overtime Work Orders & Authorizations',
    'att.overtime.desc': 'Multi-tier approvals for weekday overtime (1.5x), Saturday (2.0x), Sunday/Holiday (3.0x), night shift, and gouging allowances.',
    'att.calc.title': 'Project Labor Cost & Man-Hours Calculator',
    'att.calc.desc': 'Comprehensive aggregation of total man-hours, regular wages, overtime costs, and project labor expenditure tracking.',
    'att.stat.present_today': 'Working on Yard Today',
    'att.stat.ot_pending': 'Pending Overtime Claims',
    'att.stat.total_hours': 'Total Regular Hours',
    'att.stat.total_ot_hours': 'Total Overtime Hours',
    'att.btn.record': 'Record Daily Attendance',
    'att.btn.new_ot': 'Issue Overtime Order',
    'att.btn.export_att': 'Export Attendance (.xlsx)',
    'att.btn.export_ot': 'Export Overtime (.xlsx)',
    'att.btn.export_labor': 'Export Labor Cost (.xlsx)',

    // Common
    'common.save': 'Save Data',
    'common.cancel': 'Cancel',
    'common.back': 'Back',
    'common.actions': 'Actions',
    'common.status': 'Status',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.pending': 'Pending Approval',
    'common.approved': 'Approved',
    'common.rejected': 'Rejected',
    'common.blocked': 'Blocked',
    'common.role': 'Account Role',
    'common.access_denied': 'Access Denied',
    'common.access_denied_desc': 'This section is strictly protected and exclusively accessible by the system CREATOR.',
    'common.online': 'Connected (Online)',
    'common.offline': 'Offline (Local Sync Active)',
    'common.install_pwa': 'Install App (PWA)',
    'common.loading': 'Loading system records...',
    'common.view': 'View Details',
    'common.edit': 'Edit Data',
    'common.delete': 'Delete Record',
    'common.confirm_delete': 'Are you sure you want to delete this record?',

    // Creator Protection Alert Messages
    'creator.protection_denied_edit': 'Access Denied: The CREATOR account has supreme protected privileges. Subordinate roles cannot modify this account.',
    'creator.protection_denied_delete': 'Access Denied: The CREATOR account is permanently protected and cannot be deleted by Administrators, Staff, or Workers!',
    'creator.protection_badge': '👑 Creator Role - Protected',

    // Authentication & Accounts (Login, Registration, Forgot Password)
    'auth.login.back_to_landing': 'Back to Home',
    'auth.login.title': 'Sign In to System',
    'auth.login.subtitle': 'Enterprise Access for NEXAPROJECT Shipyard & Projects',
    'auth.login.locked': 'Account Temporarily Locked',
    'auth.login.identity': 'Username or Email',
    'auth.login.identity.placeholder': 'Enter username or email...',
    'auth.login.password': 'Password',
    'auth.login.password.placeholder': 'Enter account password...',
    'auth.login.remember': 'Remember my identity',
    'auth.login.forgot': 'Forgot password?',
    'auth.login.submit': 'Sign In to System',
    'auth.login.register_prompt': "Don't have an official account yet?",
    'auth.login.register_link': 'Submit New Registration',

    'auth.register.title': 'New Account Registration',
    'auth.register.subtitle': 'Application for NEXAPROJECT Enterprise System access. Manual verification by System Administrator.',
    'auth.register.fullname': 'Full Name',
    'auth.register.fullname.placeholder': 'e.g., BUDI SANTOSO',
    'auth.register.username': 'Username',
    'auth.register.username.placeholder': '8-18 alphanumeric characters...',
    'auth.register.email': 'Company / Personal Email',
    'auth.register.email.placeholder': 'user@company.com',
    'auth.register.password': 'Account Password',
    'auth.register.password.placeholder': 'Minimum 8 characters with letters & numbers...',
    'auth.register.confirm_password': 'Confirm Password',
    'auth.register.confirm_password.placeholder': 'Re-enter password above...',
    'auth.register.submit': 'Submit Registration Application',
    'auth.register.login_prompt': 'Already have a verified account?',
    'auth.register.login_link': 'Sign in to System',
    'auth.register.pending_modal_title': 'Registration Successfully Submitted',
    'auth.register.pending_modal_desc': 'Your application data has been recorded in the waitlist queue. A System Administrator will verify and approve your account before it can be used.',
    'auth.register.blocked_modal_title': 'Registration Access Suspended',
    'auth.register.blocked_modal_desc': 'Your registration application was rejected 3 consecutive times. Under shipyard system security policy, registration is temporarily suspended for 24 hours.',

    'auth.forgot.title': 'Password Recovery',
    'auth.forgot.subtitle': 'Reset your account password via secure 6-digit email code',
    'auth.forgot.input': 'Username or Email Address',
    'auth.forgot.submit_code': 'Send 6-Digit Verification Code',
    'auth.forgot.timer': 'Code expires in:',
    'auth.forgot.code_label': '6-Digit Verification Code',
    'auth.forgot.resend': 'Resend Verification Code',
    'auth.forgot.new_password': 'New Password',
    'auth.forgot.confirm_new_password': 'Confirm New Password',
    'auth.forgot.reset_submit': 'Save & Update Password',
    'auth.forgot.success': 'Password successfully updated! Redirecting to sign in...',
  }
};

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<BrightnessTheme>(() => {
    const saved = localStorage.getItem('nexaproject_theme') as BrightnessTheme;
    return saved === 'gelap' || saved === 'redup' || saved === 'terang' ? saved : 'gelap';
  });

  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('nexaproject_lang') as LanguageCode;
    return saved === 'en' || saved === 'id' ? saved : 'id';
  });

  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    return settingsDb.getSettings();
  });

  // On mount, establish real-time Firestore listener for maintenance & app settings
  useEffect(() => {
    // Initial fetch to sync immediately
    settingsDb.syncFromFirestore().then((synced) => {
      setAppSettings(synced);
    }).catch(() => {});

    // Active real-time subscription for instant maintenance updates across all devices
    const unsubscribe = settingsDb.subscribeToSettings((latest) => {
      setAppSettings(latest);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const setTheme = (newTheme: BrightnessTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('nexaproject_theme', newTheme);
  };

  const setLanguage = (newLang: LanguageCode) => {
    setLanguageState(newLang);
    localStorage.setItem('nexaproject_lang', newLang);
  };

  const updateSettings = async (updater: Partial<AppSettings> | ((prev: AppSettings) => AppSettings)) => {
    const nextSettings = typeof updater === 'function' ? updater(appSettings) : { ...appSettings, ...updater };
    setAppSettings(nextSettings);
    await settingsDb.saveSettings(nextSettings);
  };

  const resetSettings = async () => {
    const defaults = await settingsDb.resetToDefault();
    setAppSettings(defaults);
  };

  const setServerStatus = async (
    status: ServerStatus, 
    message?: string, 
    estimatedEnd?: string, 
    updatedBy?: string
  ) => {
    const updated = await settingsDb.setServerStatus(status, message, estimatedEnd, updatedBy);
    setAppSettings(updated);
  };

  // Effect: Brightness Mode
  useEffect(() => {
    document.body.classList.remove('theme-terang', 'theme-gelap', 'theme-redup');
    document.body.classList.add(`theme-${theme}`);
    if (theme === 'terang') {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  }, [theme]);

  // Effect: Font Family & Font Scaling
  useEffect(() => {
    // Remove all previous font classes
    const fontClasses = [
      'font-plus-jakarta', 'font-inter', 'font-roboto', 
      'font-montserrat', 'font-poppins', 'font-outfit', 'font-jetbrains-mono'
    ];
    document.body.classList.remove(...fontClasses);
    document.body.classList.add(`font-${appSettings.fontConfig.family}`);

    // Remove all previous font scale classes
    const scaleClasses = ['font-scale-compact', 'font-scale-normal', 'font-scale-large'];
    document.body.classList.remove(...scaleClasses);
    document.body.classList.add(`font-scale-${appSettings.fontConfig.scale}`);
  }, [appSettings.fontConfig]);

  // Effect: Primary Accent Colors on CSS Root
  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', appSettings.colorTheme.primaryHex);
    document.documentElement.style.setProperty('--color-primary-hover', appSettings.colorTheme.primaryHoverHex);
  }, [appSettings.colorTheme]);

  // Effect: Browser Title
  useEffect(() => {
    if (appSettings.appName) {
      document.title = `${appSettings.appName} - ${appSettings.appSubtitle || 'Enterprise'}`;
    }
  }, [appSettings.appName, appSettings.appSubtitle]);

  const t = (key: string, fallback?: string): string => {
    return translations[language]?.[key] || translations['id']?.[key] || fallback || key;
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      setTheme, 
      language, 
      setLanguage, 
      t,
      appSettings,
      updateSettings,
      resetSettings,
      setServerStatus
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
