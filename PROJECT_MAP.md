# NEXAPROJECT - Peta Arsitektur Sistem (Project Map)

Dokumen ini berfungsi sebagai peta arsitektur dan dokumentasi hidup (*living documentation*) untuk merangkum seluruh struktur kode, komponen, rute halaman, skema database, dan aturan keamanan agar efisien dibaca oleh AI dalam sesi berikutnya guna menghemat token LLM.

---

## 1. Ringkasan Teknologi & Konfigurasi
- **Framework & Runtime**: React 19, Vite, TypeScript
- **Database & Autentikasi**: Firebase Firestore (Shared Public Database) & Firebase Authentication (Google Auth + Email/Kredensial)
- **Styling & Desain**: Tailwind CSS, Dukungan Multi-Tema (Mode Gelap `#090d16`, Mode Redup `#171d26`, Mode Terang `#f8fafc`), Anti-AI Slop, Reset Dropdown Kustom
- **PWA & Akses Offline**: Service Worker (`sw.js`), Web App Manifest (`manifest.json`), Sinkronisasi Cache & Fallback Offline
- **Deployment & Server**: SPA Vite, Express API middleware jika diperlukan, aturan keamanan dideploy via `deploy_firebase`

---

## 2. Daftar Halaman & Rute Utama (Routes)

Aplikasi menggunakan routing internal berbasis state `AppView` yang dikelola secara terpusat di `src/App.tsx`.

| Nama Halaman / Fitur | Path / AppView | Komponen Utama | Hak Akses (RBAC) | Keterangan Singkat |
| :--- | :--- | :--- | :--- | :--- |
| **Beranda Publik** | `'landing'` | `LandingPage.tsx` | Publik (All) | Halaman muka, perkenalan fitur galangan kapal |
| **Layanan Dukungan & FAQ** | `'support'` | `SupportPage.tsx` | Publik (All) | Panduan sistem, SOP galangan, kebijakan privasi & keamanan |
| **Halaman Masuk (Login)** | `'login'` | `LoginPage.tsx` | Publik (All) | Login kredensial & Google Auth, proteksi brute-force 3x-6x-9x |
| **Pendaftaran Akun Baru** | `'register'` | `RegisterPage.tsx` | Publik (All) | Pengajuan akun personel baru ke daftar antrean (*waitlist*) |
| **Halaman Tunggu Persetujuan** | `'pending-approval'` | `PendingApprovalPage.tsx` | Authenticated (Status: Pending) | Halaman landing antrean persetujuan dengan auto-refresh live Firestore |
| **Pemulihan Kata Sandi** | `'forgot-password'` | `ForgotPasswordPage.tsx` | Publik (All) | Alur permohonan reset sandi via Administrator/Creator |
| **Dashboard Operasional** | `'dashboard'` | `DashboardPreviewPage.tsx` | Authenticated (Status: Active) | Ringkasan metrik galangan kapal, proyek aktif, cuaca maritim |
| **Data Karyawan** | `'employees-data'` | `EmployeeDataPage.tsx` | Semua (Read), Admin/Creator (Write) | Sinkronisasi real-time Firestore daftar personel galangan |
| **Profil Resmi Karyawan** | `'employees-profile'` | `EmployeeProfilePage.tsx` | Authenticated | Profil lengkap, nomor KTP/KK, dan verifikasi berkas |
| **Penyimpanan Foto Dokumen**| `'employees-photos'` | `EmployeePhotoStoragePage.tsx` | Authenticated | Arsip foto ijazah, sertifikat welder, dan dokumen legal |
| **Daftar Proyek Kapal** | `'projects-list'` | `ProjectListPage.tsx` | Authenticated | Manajemen SPK pembangunan, perbaikan, & docking kapal |
| **Pengawas Proyek (Supervisors)**| `'projects-supervisors'`| `ProjectSupervisorsPage.tsx` | Authenticated | Penugasan superintendent dan pengawas lapangan per kapal |
| **Progres Pengerjaan** | `'projects-progress'` | `ProjectProgressPage.tsx` | Authenticated | Kurva S, timeline pengerjaan lambung, pipa, & mesin |
| **Biaya Proyek & Margin** | `'projects-cost'` | `ProjectCostPage.tsx` | **Khusus Creator** | Rekapitulasi biaya rahasia, margin laba, & deviasi anggaran |
| **Inventaris Gudang Baja** | `'warehouse-stock'`, `'warehouse-storage'`, `'warehouse-flow'` | `WarehouseInventoryPage.tsx` | Authenticated | Stok pelat baja, profil, elektroda las, dan lokasi rak |
| **Permintaan Barang (Order)**| `'warehouse-order'`, `'warehouse-usage'` | `MaterialOrdersPage.tsx` | Semua (Create), Creator (>Rp50Jt) | Requisition material, otorisasi Creator untuk order besar |
| **Form Time Sheet** | `'attendance-timesheet'` | `AttendanceTimesheetPage.tsx` | Authenticated | Absensi harian mandiri/mandor teknisi galangan |
| **Form Over Time (Lembur)** | `'attendance-overtime'` | `OvertimeManagementPage.tsx` | Authenticated | Surat perintah lemur (SPL) tarif 1.5x, 2.0x, dan 3.0x |
| **Form Night Shift** | `'attendance-nightshift'` | `NightShiftFormPage.tsx` | Authenticated | Presensi giliran kerja malam & tunjangan ekstra |
| **Kalkulasi Waktu** | `'attendance-time-calc'` | `TimeCalculationPage.tsx` | Authenticated | Rekapitulasi jam normal dan jam lembur per teknisi |
| **Kalkulasi Proyek** | `'attendance-project-calc'`| `ProjectCalculationPage.tsx` | Authenticated | Alokasi total man-hours kerja per proyek kapal |
| **Summary Jam Kerja** | `'attendance-summary'` | `AttendanceSummaryPage.tsx` | Authenticated | Ringkasan kehadiran mingguan/bulanan personel |
| **Biaya Pekerja (Labor Cost)**| `'attendance-labor-cost'` | `LaborCostCalculatorPage.tsx` | Admin/Creator | Perhitungan total upah dan pengeluaran tenaga kerja |
| **Kontrak & Termin Penagihan**| `'finance-contract'` | `FinanceContractsPage.tsx` | Semua (Read), Creator (Tandatangan) | Kontrak komersial galangan kapal & jadwal termin |
| **Biaya Operasional & Voucher**| `'finance-operational'`, `'finance-claim-ot'`, dll | `FinanceOperationalPage.tsx` | Authenticated, Creator (>Rp50Jt) | Pengajuan voucher, reimbursement, petty cash galangan |
| **Arus Kas & Margin Galangan**| `'finance-labor'`, `'finance-material'` | `FinanceCashflowPage.tsx` | Admin/Creator | Arus kas masuk/keluar & analitik margin operasional |
| **Pengumuman K3 & Buletin** | `'announcements'` | `AnnouncementsPage.tsx` | Semua (Read), Admin/Creator (Post) | Buletin keselamatan kerja (HSE), toolbox meeting |
| **Tugas Kerja Lapangan** | `'tasks'` | `FieldTasksPage.tsx` | Authenticated | Dispatcher penugasan teknisi las, fitter, dan mekanik |
| **Pengaturan Aplikasi** | `'settings-app'`, `'settings-general'`, `'settings-theme'` | `AppSettingsPage.tsx` | Admin/Creator | Konfigurasi nama sistem, logo, palet tema, font, server |
| **Jejak Audit & Log Akses** | `'settings-audit'`, `'users-access'` | `SecurityAuditPage.tsx` | Admin/Creator (Read), Creator (Delete) | Log pencatatan aktivitas, deteksi anomali, & sesi login |
| **Matriks Izin Akses (RBAC)**| `'users-permissions'` | `UserPermissionsPage.tsx` | **Khusus Creator & Admin** | Pengaturan hak akses granular per peran & modul |
| **Daftar Tunggu Akun** | `'users-waitlist'` | `WaitlistPage.tsx` | Admin/Creator | Persetujuan atau penolakan akun baru (*Pending Approval*) |

---

## 3. Struktur Direktori Utama (`src/`)

- `src/components/`
  - `attendance/`: Komponen form input lembur, timesheet, dan rekapan jam.
  - `auth/`: Komponen keamanan (Modal Sesi Terkunci, Watermark Anti-Screenshot).
  - `common/`: Komponen umum (Logo `AppLogo`, Background Dinamis `GlobalAppBackground`, PWA Install Banner, Modal Kamera).
  - `layout/`: Kerangka layout (`Navbar.tsx`, `Sidebar.tsx`, `Footer.tsx`).
- `src/context/`
  - `AuthContext.tsx`: Manajemen autentikasi Firebase/Lokal, proteksi brute-force bertingkat, auto-create profil, penanganan akun Creator, dan pemeriksaan status `pending`.
  - `ThemeContext.tsx`: Manajemen tema kecerahan (`terang`, `gelap`, `redup`), bahasa (ID/EN), skala font, konfigurasi server maintenance, dan pengaturan aplikasi.
- `src/pages/`: Seluruh sub-halaman modular sesuai pembagian departemen galangan (admin, announcements, attendance, employees, finance, projects, settings, tasks, warehouse).
- `src/services/`:
  - `firebase.ts`: Inisialisasi Firebase App, Auth, dan Firestore SDK.
  - `db.ts`: Layanan database lokal pengguna, audit log, hashing sandi, dan proteksi akun Creator.
  - `employeeDb.ts`: Layanan data karyawan dengan sinkronisasi real-time Firestore `/employees`.
  - `permissionsDb.ts`: Matriks perizinan RBAC (Creator, Admin, Staff, Karyawan).
  - `projectDb.ts`: Layanan data proyek kapal dan biaya rahasia.
  - `warehouseDb.ts`: Layanan inventaris gudang dan requisition material.
  - `attendanceDb.ts`: Layanan pencatatan presensi, SPL lembur, dan shift malam.
  - `financeDb.ts`: Layanan kontrak penagihan termin dan voucher operasional.
  - `taskAnnouncementDb.ts`: Layanan buletin K3 dan tugas harian lapangan.
  - `settingsDb.ts`: Layanan sinkronisasi pengaturan global `/system_settings/app_config`.
- `src/types/`: Definisi tipe data TypeScript (`auth.ts`, `employees.ts`, `projects.ts`, `warehouse.ts`, `attendance.ts`, `finance.ts`, `settings.ts`, `navigation.ts`, `tasks.ts`).
- `src/index.css`: Tailwind CSS v4, styling font, mode kecerahan, styling reset `<select>` kustom, efek focus ring, dan proteksi cetak dokumen rahasia.

---

## 4. Skema Koleksi Firestore Database

Aturan keamanan server didefinisikan pada `firestore.rules` dan dideploy secara aktif:

- `/users/{userId}`: Profil pengguna, nama, email, `role` (`creator`, `admin`, `staff`, `karyawan`), dan `status` (`active`, `pending`, `blocked`). Pengguna terautentikasi dapat membaca dokumen mereka sendiri. Akun creator memiliki otorisasi penuh.
- `/system_settings/{settingId}` & `/settings/{settingId}`: Konfigurasi global sistem aplikasi (nama perusahaan, logo, tema bawaan, mode pemeliharaan). Akses baca publik (`allow read: if true;`) saat boot awal aplikasi.
- `/employees/{employeeDocId}`: Data publik bersama seluruh personel galangan. Semua user terautentikasi dapat membaca data real-time; operasi tulis/edit/hapus hanya diizinkan untuk Admin dan Creator. Akun Creator dilindungi secara mutlak dari perubahan oleh peran bawahannya.
- `/user_permissions/{userId}`: Matriks perizinan akses modul spesifik per pengguna.
- `/registration_waitlist/{applicantId}`: Data formulir pendaftaran akun baru yang menunggu persetujuan.
- `/audit_logs/{logId}`: Catatan jejak audit sistem. Bersifat *append-only* (tidak dapat diubah/dihapus oleh non-creator).
- `/projects/{projectId}`: Data kontrak kerja proyek pembangunan atau perbaikan kapal.
- `/project_costs/{costId}`: Data anggaran dan margin biaya proyek. Khusus dibaca dan ditulis oleh Creator.
- `/warehouse_inventory/{itemId}`: Data stok pelat, profil, pipa, cat, dan consumables gudang.
- `/material_orders/{orderId}`: Formulir permintaan barang. Order di atas Rp 50.000.000 wajib disetujui oleh Creator.
- `/stock_movements/{movementId}`: Catatan log barang masuk/keluar gudang.
- `/attendance/{recordId}`: Data absensi harian personel galangan.
- `/overtime_claims/{claimId}`: Pengajuan klaim jam lembur personel.
- `/form_timesheets/{tsId}`: Lembar formulir *time sheet* jam kerja.
- `/form_overtime/{otId}`: Formulir izin lembur resmi.
- `/form_nightshift/{nsId}`: Formulir giliran kerja malam.
- `/time_calc_sheets/{sheetId}`: Lembar rekapitulasi perhitungan jam kerja.
- `/contracts/{contractId}`: Kontrak komersial resmi galangan kapal. Penandatanganan resmi memerlukan otoritas Creator.
- `/financial_expenses/{expenseId}`: Voucher pengeluaran operasional. Pengeluaran di atas Rp 50.000.000 membutuhkan persetujuan Creator.
- `/announcements/{annId}`: Buletin pengumuman K3/HSE galangan.
- `/field_tasks/{taskId}`: Penugasan pekerjaan lapangan teknisi.

---

## 5. Catatan Perubahan Terakhir (Log)

- **2026-10-25 (07:44)**:
  - **Penyamaran & Penghapusan Tampilan Akun Creator (`MaintenanceModeScreen.tsx` & `LoginPage.tsx`)**:
    - **Penyamaran Placeholder Input**: Mengganti placeholder `creator01 / email...` pada modal otorisasi pemeliharaan (`MaintenanceModeScreen`) dan halaman login (`LoginPage`) menjadi placeholder netral `Username atau email...` / `Nama pengguna atau email...`.
    - **Penghapusan Label & Tombol Creator Publik**: Mengubah subjudul modal pemeliharaan menjadi "Verifikasi Kredensial Administrator", menghapus tombol bypass "Buka Kunci & Masuk sebagai Creator Sekarang" pada layar lockout brute-force, dan mengubah tombol darurat domain menjadi "Akses Darurat Administrator".
    - Menghilangkan referensi Creator pada dialog persetujuan akun pending sehingga akun Creator sepenuhnya tersamar dan rahasia dari pengguna umum.

- **2026-10-25 (07:35)**:
  - **Penyederhanaan UI Halaman Login (`LoginPage.tsx`)**:
    - Menghapus akordion "Petunjuk Akun & Kredensial Resmi" (Creator, Admin, Staff, Karyawan) untuk menjaga kebersihan visual halaman login, keamanan privasi kredensial, dan tampilan antarmuka yang lebih profesional sesuai permintaan.

- **2026-10-25 (07:25)**:
  - **Sistem Persetujuan Ketat (Pending Approval) & Router Guard**:
    - **Status 'pending' Otomatis untuk Akun Baru**: Pengguna baru yang mendaftar atau login pertama kali (termasuk Google Auth) otomatis dibuatkan profil di Firestore `/users/{uid}` dengan `status: 'pending'` dan `role: 'karyawan'`. Email khusus Creator (`muhammad.andri0605@gmail.com`, `ronalpaman@gmail.com`, `creator@nexaproject.com`) diproteksi mutlak langsung berstatus `'active'` dan `'creator'`.
    - **Router Guard Ketat & Pemblokiran Dashboard**: Menambahkan proteksi interceptor rute di `App.tsx` dan `Sidebar.tsx`. Selama pengguna berstatus `pending` (dan bukan creator), akses ke dashboard dan seluruh modul operasional galangan kapal diblokir secara total dan dialihkan ke `PendingApprovalPage`.
    - **Halaman Khusus Tunggu Persetujuan (`PendingApprovalPage`)**: Menampilkan status permohonan terkini, ID pengguna, instruksi persetujuan, tombol cek status server live (`getDocFromServer`), dan opsi keluar (*Sign Out*).
    - **Buka Akses Real-Time Otomatis**: Integrasi snapshot listener Firestore (`onSnapshot(doc(db, 'users', uid))`) pada `AuthContext.tsx`. Begitu Admin atau Creator mengubah status pengguna menjadi `'active'` melalui Firestore atau panel `WaitlistPage`, sistem mendeteksi pembaruan secara real-time dan langsung membuka akses serta mengarahkan pengguna ke Dashboard tanpa perlu re-login.
    - **Sinkronisasi Waitlist ke Firestore**: Pengesahan akun di `WaitlistPage` otomatis memperbarui status `/users/{uid}` dan `/registration_waitlist/{applicantId}` menjadi `'active'` di Firestore cloud.
  - **Penanganan Status Maintenance PWA & Sinkronisasi Cloud**:
    - **Bypass Cache PWA**: Menambahkan interceptor `Network-First` dan `no-store` pada Service Worker (`public/sw.js`) untuk semua URL/request status server, maintenance, dan dokumen setting agar tidak pernah tertahan di cache PWA.
    - **Real-Time Listener Maintenance**: Mengimplementasikan `onSnapshot` real-time listener di `settingsDb.ts` dan `ThemeContext.tsx` yang memantau dokumen `/system_settings/app_config` dan `/settings/system`. Begitu status diubah menjadi `maintenance`, seluruh layar perangkat aktif otomatis beralih ke `MaintenanceModeScreen` secara instan tanpa perlu reload.
    - **Pembersihan Cache Otomatis**: Menambahkan fitur pembersihan menyeluruh saat tombol "Periksa Status Server / Muat Ulang" ditekan: menghapus semua CacheStorage browser, mengirim pesan `CLEAR_CACHE` ke Service Worker, memperbarui registrasi worker, dan memverifikasi status langsung dari cloud via `getDocFromServer`.
- **2026-10-25 (06:48)**:
  - **Perbaikan Bug UI Dropdown `<select>`**:
    - Menghapus tampilan bawaan browser dengan `appearance: none !important; -webkit-appearance: none !important; -moz-appearance: none !important;` serta `select::-ms-expand { display: none !important; }`.
    - Mengatasi kotak abu-abu/putih bawaan browser di sisi kanan elemen select pada tema gelap.
    - Mengganti panah native dengan panah vektor kustom SVG chevron-down yang elegan.
    - Mengganti outline biru bawaan browser dengan efek focus ring lembut (`border-color: #38bdf8`, `box-shadow: 0 0 0 2px rgba(56, 189, 248, 0.35)`).
- **2026-10-25 (06:35)**:
  - **Autentikasi & Firestore Rules**:
    - Auto-create profil pengguna di Firestore `/users/{uid}` saat login (termasuk Google Auth).
    - Penambahan email Creator/Developer (`muhammad.andri0605@gmail.com` dan `ronalpaman@gmail.com`) dengan auto-role `creator` dan status `active`.
    - Pengaturan akses baca global pada `/system_settings/{settingId}` dan `/settings/{settingId}` untuk mencegah error permission pada boot aplikasi.
    - Penerapan proteksi brute-force bertingkat (3x=5m, 6x=10m, 9x=1h) dengan penyimpanan `localStorage` anti-bypass.
    - Dialog peringatan *Pending Approval* untuk menolak akses dashboard dan mengarahkan pengguna ke Landing Page jika status akun masih `pending`.
- **2026-10-25 (06:20)**:
  - **Sinkronisasi Real-Time Pegawai**:
    - Migrasi Manajemen Pegawai (`EmployeeDataPage`) menggunakan database publik bersama Firestore `/employees` secara real-time.
    - Pembatasan RBAC tombol Edit & Hapus (hanya aktif untuk Admin dan Creator).
