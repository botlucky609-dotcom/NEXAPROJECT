import React, { useState } from 'react';
import { 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  UserPlus, 
  Clock, 
  Ban,
  Loader2 
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { AppLogo } from '../components/common/AppLogo';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { AppView } from '../types/navigation';
import { dbService, hashPasswordWithSalt, generateSalt } from '../services/db';
import { db } from '../services/firebase';
import { doc, setDoc } from 'firebase/firestore';

export const RegisterPage: React.FC<{ onNavigate: (view: AppView) => void }> = ({ onNavigate }) => {
  const { t } = useTheme();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Modals for the 3 conditions
  const [pendingModal, setPendingModal] = useState(false);
  const [blockedModal, setBlockedModal] = useState<{ isBlocked: boolean; remainingHours?: number }>({
    isBlocked: false,
  });

  // Auto-uppercase Full Name and filter non letters/space/dot
  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    // Keep only letters, space, and dot
    const filtered = raw.replace(/[^a-zA-Z\s.]/g, '').toUpperCase();
    setFullName(filtered);
    setErrorMessage('');
  };

  // Username validation: letters & numbers only, 8-18 chars
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const alphanumeric = raw.replace(/[^a-zA-Z0-9]/g, '');
    setUsername(alphanumeric);
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // 1. Validate Full Name
    if (!fullName.trim() || fullName.trim().length < 3) {
      setErrorMessage('Nama Lengkap harus diisi minimal 3 huruf (hanya huruf, spasi, dan titik).');
      return;
    }

    // 2. Validate Username
    const u = username.trim().toLowerCase();
    if (u.length < 8 || u.length > 18) {
      setErrorMessage('Nama Pengguna harus terdiri dari 8 hingga 18 karakter (hanya huruf dan angka).');
      return;
    }

    // Check banned keywords / SQL injection words
    const bannedWords = ['admin', 'root', 'creator', 'system', 'select', 'drop', 'insert', 'delete', 'script', 'eval', 'hack'];
    if (bannedWords.some((b) => u === b || u.includes(`__${b}`))) {
      setErrorMessage('Nama Pengguna ini dicadangkan atau tidak diizinkan oleh sistem.');
      return;
    }

    // 3. Validate Email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMessage('Format Email tidak valid. Harus menyertakan tanda "@" dan diakhiri domain sah (.com, .id, dll).');
      return;
    }

    // Check duplicate in active users
    const existingUser = dbService.findUserByIdentity(u) || dbService.findUserByIdentity(email);
    if (existingUser) {
      setErrorMessage('Nama Pengguna atau Email sudah terdaftar dalam sistem. Silakan masuk atau gunakan email lain.');
      return;
    }

    // Check waitlist for previous rejections and 24-hour block condition
    const existingApplicant = dbService.findWaitlistByIdentity(u, email);
    if (existingApplicant) {
      // Condition 2: 3x rejections block rule
      if (existingApplicant.rejectionCount >= 3) {
        if (existingApplicant.blockedUntil && Date.now() < existingApplicant.blockedUntil) {
          const remainingHours = Math.ceil((existingApplicant.blockedUntil - Date.now()) / (3600 * 1000));
          setBlockedModal({ isBlocked: true, remainingHours });
          return;
        }
      }

      // If pending already
      if (existingApplicant.status === 'pending') {
        setPendingModal(true);
        return;
      }
    }

    // 4. Validate Password
    if (password.length < 8) {
      setErrorMessage('Kata Sandi minimal 8 karakter.');
      return;
    }
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    if (!hasLetter || !hasNumber) {
      setErrorMessage('Kata Sandi harus merupakan kombinasi campuran huruf dan angka.');
      return;
    }

    // 5. Confirm Password
    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi Kata Sandi tidak cocok dengan Kata Sandi yang dimasukkan.');
      return;
    }

    // Generate isolated salt & hash
    const salt = generateSalt(u);
    const passwordHash = hashPasswordWithSalt(password, salt);

    setIsSubmitting(true);
    try {
      // Create waitlist applicant & pending user
      const previousRejectionCount = existingApplicant ? existingApplicant.rejectionCount : 0;
      const applicantId = `wait-${Date.now()}`;
      const waitlistData = {
        id: applicantId,
        fullName: fullName.trim(),
        username: u,
        email: email.trim(),
        passwordHash,
        salt,
        status: 'pending' as const,
        rejectionCount: previousRejectionCount,
        appliedAt: Date.now(),
        createdAt: new Date().toISOString(),
      };

      dbService.addWaitlistApplicant(waitlistData);

      // Also register pending user in local DB so login rejects until approved
      const newUserRecord = {
        id: `usr-${Date.now()}`,
        fullName: fullName.trim(),
        username: u,
        email: email.trim(),
        role: 'karyawan' as const,
        status: 'pending' as const,
        rejectionCount: 0,
        salt,
        passwordHash,
        employeeId: `EMP-${Date.now().toString().slice(-4)}`,
        position: 'KARYAWAN OPERASIONAL',
        department: 'STEEL WORK',
        failedLoginAttempts: 0,
        createdAt: Date.now(),
        lastLoginAt: Date.now(),
      };
      dbService.addUser(newUserRecord);

      // Sync to Firestore registration_waitlist and /users/{id}
      await Promise.allSettled([
        setDoc(doc(db, 'registration_waitlist', applicantId), waitlistData),
        setDoc(doc(db, 'users', newUserRecord.id), {
          id: newUserRecord.id,
          fullName: newUserRecord.fullName,
          username: newUserRecord.username,
          email: newUserRecord.email,
          role: 'karyawan',
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }, { merge: true }),
      ]);

      dbService.addAuditLog({
        id: `aud-${Date.now()}`,
        timestamp: Date.now(),
        userId: u,
        username: u,
        role: 'karyawan',
        action: 'REGISTRATION_SUBMITTED',
        module: 'Pendaftaran Akun',
        details: `Permohonan pendaftaran akun baru oleh ${fullName.trim()} (${email.trim()}). Menunggu verifikasi Creator/Admin.`,
        status: 'success',
      });

      // Condition 1: Show pending notification modal, then redirect to landing
      setPendingModal(true);
    } catch (e) {
      console.error('Registration submission error:', e);
      setErrorMessage('Terjadi kendala saat mengirim permohonan ke server. Silakan coba kembali.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Back button */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg mb-6">
        <button
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="text-center mb-6">
          <div className="mb-3 flex justify-center">
            <AppLogo size="lg" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t('auth.register.title', 'Pendaftaran Akun Baru')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {t('auth.register.subtitle', 'Pengajuan akses ke Sistem Enterprise NEXAPROJECT. Verifikasi manual oleh Administrator Sistem.')}
          </p>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-slate-200/90 dark:border-slate-800/90 sm:px-10">
          
          {/* Error alert */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="font-medium">{errorMessage}</p>
            </div>
          )}

          {/* Stacked Form: One row per field as strictly requested */}
          <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
            
            {/* Field 1: Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('auth.register.fullname', 'Nama Lengkap')}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={handleFullNameChange}
                placeholder={t('auth.register.fullname.placeholder', 'Contoh: BUDI SANTOSO')}
                autoComplete="off"
                className="w-full px-3.5 py-2.5 text-xs uppercase font-medium rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                Hanya huruf, spasi, dan tanda titik. Otomatis huruf kapital.
              </span>
            </div>

            {/* Field 2: Username */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('auth.register.username', 'Nama Pengguna (Username)')}
              </label>
              <input
                type="text"
                value={username}
                onChange={handleUsernameChange}
                placeholder={t('auth.register.username.placeholder', '8-18 karakter alfanumerik...')}
                maxLength={18}
                autoComplete="off"
                className="w-full px-3.5 py-2.5 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                8-18 karakter, huruf dan angka saja.
              </span>
            </div>

            {/* Field 3: Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('auth.register.email', 'Alamat Email Perusahaan / Pribadi')}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setErrorMessage(''); }}
                placeholder={t('auth.register.email.placeholder', 'nama@perusahaan.com')}
                autoComplete="off"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
              />
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                Wajib menyertakan karakter @ dan akhiran domain (.com, .id, dll).
              </span>
            </div>

            {/* Field 4: Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('auth.register.password', 'Kata Sandi Akun')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMessage(''); }}
                  placeholder={t('auth.register.password.placeholder', 'Minimal 8 karakter campuran...')}
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                Minimal 8 karakter campuran huruf dan angka.
              </span>
            </div>

            {/* Field 5: Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('auth.register.confirm_password', 'Konfirmasi Kata Sandi')}
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrorMessage(''); }}
                  placeholder={t('auth.register.confirm_password.placeholder', 'Ulangi kata sandi di atas...')}
                  autoComplete="new-password"
                  className="w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>{isSubmitting ? 'Mengirim Permohonan...' : t('auth.register.submit', 'Kirim Permohonan Pendaftaran')}</span>
              </button>
            </div>

          </form>

          {/* Overlay Loader during Registration Submission */}
          {isSubmitting && (
            <LoadingScreen
              variant="overlay"
              text="Mendaftarkan Akun Baru..."
              subtext="Mengunggah formulir permohonan ke Firestore dan menetapkan status Pending Approval..."
            />
          )}

          {/* Login prompt */}
          <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('auth.register.login_prompt', 'Sudah memiliki akun terverifikasi?')}{' '}
              <button
                onClick={() => onNavigate('login')}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline ml-1"
              >
                {t('auth.register.login_link', 'Masuk ke Sistem')}
              </button>
            </p>
          </div>

        </div>
      </div>

      {/* Condition 1 Modal: Pending Approval */}
      {pendingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center mb-4 ring-1 ring-amber-500/20">
              <Clock className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              {t('auth.register.pending_modal_title', 'Pendaftaran Berhasil Diajukan')}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-6">
              {t('auth.register.pending_modal_desc', 'Data permohonan Anda telah dicatat dalam antrean waitlist sistem. Administrator sistem akan memverifikasi dan menyetujui akun Anda sebelum dapat digunakan.')}
            </p>
            <button
              onClick={() => {
                setPendingModal(false);
                onNavigate('landing');
              }}
              className="w-full py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-sm"
            >
              Kembali ke Halaman Beranda
            </button>
          </div>
        </div>
      )}

      {/* Condition 2 Modal: Blocked 24 Hours due to 3x Rejections */}
      {blockedModal.isBlocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 shadow-2xl p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 mx-auto flex items-center justify-center mb-4 ring-1 ring-rose-500/20">
              <Ban className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-rose-900 dark:text-rose-200 mb-2">
              {t('auth.register.blocked_modal_title', 'Akses Pendaftaran Ditangguhkan')}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
              {t('auth.register.blocked_modal_desc', 'Permohonan akun Anda telah ditolak sebanyak 3 kali berturut-turut. Sesuai kebijakan keamanan sistem galangan kapal, pendaftaran ditangguhkan sementara selama 24 jam.')}
            </p>
            <p className="text-xs font-mono font-bold text-rose-600 dark:text-rose-400 mb-6">
              Sisa Waktu Pemblokiran: ~{blockedModal.remainingHours || 24} Jam
            </p>
            <button
              onClick={() => {
                setBlockedModal({ isBlocked: false });
                onNavigate('landing');
              }}
              className="w-full py-2.5 text-xs font-bold text-white bg-slate-900 dark:bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              Tutup & Kembali
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
