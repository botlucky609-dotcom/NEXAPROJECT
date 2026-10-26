import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  ShieldAlert, 
  CheckCircle2, 
  LogIn, 
  Clock, 
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
  Info,
  Loader2
} from 'lucide-react';
import { AppLogo } from '../components/common/AppLogo';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AppView } from '../types/navigation';
import { dbService } from '../services/db';

export const LoginPage: React.FC<{ onNavigate: (view: AppView) => void }> = ({ onNavigate }) => {
  const { login, loginWithGoogle, loginAsCreator, isLoading, savedIdentity } = useAuth();
  const { t } = useTheme();

  const [identity, setIdentity] = useState(savedIdentity || '');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(!!savedIdentity);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Persistent tiered lockout: reads from localStorage to prevent bypass via page refresh
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('nexaproject_login_lockout_v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        const diff = Math.ceil((parsed.lockoutUntil - Date.now()) / 1000);
        return diff > 0 ? diff : 0;
      }
    } catch {}
    return 0;
  });

  // Modal Status Akun: Pending Approval
  const [pendingApproval, setPendingApproval] = useState<{
    isOpen: boolean;
    message: string;
  } | null>(null);

  const [showDomainGuide, setShowDomainGuide] = useState(false);

  // Countdown timer for lockout
  useEffect(() => {
    if (lockoutRemaining <= 0) {
      try {
        localStorage.removeItem('nexaproject_login_lockout_v1');
      } catch {}
      return;
    }
    const interval = setInterval(() => {
      setLockoutRemaining((prev) => {
        if (prev <= 1) {
          try {
            localStorage.removeItem('nexaproject_login_lockout_v1');
          } catch {}
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  // Check initial lockout state for identity
  useEffect(() => {
    if (identity.trim()) {
      const user = dbService.findUserByIdentity(identity);
      if (user && user.lockoutUntil && Date.now() < user.lockoutUntil) {
        // Creator is immune to lockout; automatically unlock if creator
        if (dbService.isCreatorUser(user)) {
          user.failedLoginAttempts = 0;
          user.lockoutUntil = undefined;
          dbService.updateUser(user, 'system');
          try {
            localStorage.removeItem('nexaproject_login_lockout_v1');
          } catch {}
          setLockoutRemaining(0);
          setErrorMessage('');
        } else {
          const secs = Math.ceil((user.lockoutUntil - Date.now()) / 1000);
          setLockoutRemaining(secs);
          setErrorMessage('Akun ini sedang diblokir sementara karena beberapa kali gagal masuk.');
        }
      } else if (lockoutRemaining > 0 && (!user || !user.lockoutUntil || Date.now() >= user.lockoutUntil)) {
        // If user specific lockout ended, verify if device lockout is also clear
        try {
          const saved = localStorage.getItem('nexaproject_login_lockout_v1');
          if (!saved) {
            setLockoutRemaining(0);
            setErrorMessage('');
          }
        } catch {
          setLockoutRemaining(0);
          setErrorMessage('');
        }
      }
    }
  }, [identity, lockoutRemaining]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (lockoutRemaining > 0) {
      setErrorMessage(`Sistem proteksi brute-force aktif. Tunggu ${formatTimer(lockoutRemaining)} sebelum mencoba kembali.`);
      return;
    }

    if (!identity.trim()) {
      setErrorMessage('Silakan isi Nama Pengguna atau Alamat Email Anda.');
      return;
    }

    if (!password) {
      setErrorMessage('Silakan isi Kata Sandi Anda.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi harus minimal 6 karakter.');
      return;
    }

    const res = await login(identity.trim(), password, rememberMe);
    if (res.isPending || (res.error && res.error.includes('STATUS_PENDING'))) {
      onNavigate('pending-approval');
    } else if (res.success) {
      onNavigate('dashboard');
    } else {
      setErrorMessage(res.error || 'Gagal masuk. Periksa kembali informasi Anda.');
      if (res.lockoutSeconds) {
        setLockoutRemaining(res.lockoutSeconds);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    const res = await loginWithGoogle();
    if (res.isPending || (res.error && res.error.includes('STATUS_PENDING'))) {
      onNavigate('pending-approval');
    } else if (res.success) {
      onNavigate('dashboard');
    } else {
      setErrorMessage(res.error || 'Gagal masuk dengan Google.');
    }
  };

  const handleQuickCreatorLogin = async () => {
    setErrorMessage('');
    try {
      localStorage.removeItem('nexaproject_login_lockout_v1');
    } catch {}
    setLockoutRemaining(0);
    const res = await loginAsCreator();
    if (res.success) {
      onNavigate('dashboard');
    } else {
      setErrorMessage(res.error || 'Gagal masuk sebagai Creator.');
    }
  };





  const formatTimer = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isUnauthorizedDomain = errorMessage.startsWith('AUTH_UNAUTHORIZED_DOMAIN:');
  const unauthorizedHost = isUnauthorizedDomain 
    ? errorMessage.replace('AUTH_UNAUTHORIZED_DOMAIN:', '').trim() 
    : (typeof window !== 'undefined' ? window.location.hostname : '');

  return (
    <div className="min-h-screen bg-transparent flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Top back link */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6">
        <button
          onClick={() => onNavigate('landing')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t('auth.login.back_to_landing', 'Kembali ke Beranda')}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-6">
          <div className="mb-3 flex justify-center">
            <AppLogo size="lg" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t('auth.login.title', 'Masuk ke Sistem')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {t('auth.login.subtitle', 'Akses Enterprise Galangan Kapal & Proyek NEXAPROJECT')}
          </p>
        </div>

        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md py-8 px-6 shadow-2xl rounded-2xl border border-slate-200/90 dark:border-slate-800/90 sm:px-10">
          
          {/* SPECIAL ADVISORY: Firebase Authorized Domain Mismatch Detected */}
          {isUnauthorizedDomain && (
            <div className="mb-5 p-4 rounded-xl border border-amber-300 dark:border-amber-700/80 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 text-xs shadow-xs animate-fade-in space-y-3">
              <div className="flex items-start gap-2.5">
                <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-bold text-xs text-amber-900 dark:text-amber-200">
                    Domain Hosting Belum Diotorisasi di Firebase
                  </p>
                  <p className="text-[11px] text-amber-800/90 dark:text-amber-300/90 leading-relaxed">
                    Domain publik <code className="px-1.5 py-0.5 rounded bg-amber-200/60 dark:bg-amber-900/60 font-mono font-bold text-[10px]">{unauthorizedHost}</code> belum didaftarkan di daftar <em>Authorized Domains</em> Firebase Console.
                  </p>
                </div>
              </div>

              {/* 1-Click Administrator Direct Login Fallback */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleQuickCreatorLogin}
                  disabled={isLoading}
                  className="w-full py-2 px-3 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-98 rounded-lg shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Masuk dengan Akses Darurat Administrator</span>
                </button>
              </div>

              {/* Expandable Firebase Setup Guide */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowDomainGuide(!showDomainGuide)}
                  className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 hover:underline inline-flex items-center gap-1"
                >
                  <span>{showDomainGuide ? 'Sembunyikan panduan domain' : 'Cara mendaftarkan domain di Firebase Console'}</span>
                  {showDomainGuide ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {showDomainGuide && (
                  <ol className="mt-2 pl-4 list-decimal text-[10px] space-y-1 text-amber-800 dark:text-amber-200">
                    <li>Buka <strong>Firebase Console</strong> &gt; pilih project Anda.</li>
                    <li>Menu <strong>Authentication</strong> &gt; tab <strong>Settings</strong> &gt; <strong>Authorized domains</strong>.</li>
                    <li>Klik <strong>Add domain</strong>, masukkan: <code className="font-mono font-bold">{unauthorizedHost}</code> lalu simpan.</li>
                    <li>Setelah disimpan, Google Sign-In akan aktif sepenuhnya pada domain ini.</li>
                  </ol>
                )}
              </div>
            </div>
          )}

          {/* Lockout Warning Banner with Live Seconds Counter */}
          {lockoutRemaining > 0 && !isUnauthorizedDomain && (
            <div className="mb-5 p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 text-xs flex flex-col gap-2.5 animate-fade-in">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
                <div className="grow">
                  <p className="font-bold">{t('auth.login.locked', 'Akun Terkunci Sementara')}</p>
                  <p className="font-mono text-sm font-extrabold mt-1 text-rose-600 dark:text-rose-400">
                    {formatTimer(lockoutRemaining)}
                  </p>
                  <p className="text-[11px] text-rose-600/80 dark:text-rose-300/80 mt-1">
                    Proteksi brute-force aktif karena beberapa kali gagal masuk.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Standard Error Notice */}
          {errorMessage && lockoutRemaining === 0 && !isUnauthorizedDomain && (
            <div className="mb-5 p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="grow">
                <p className="font-medium">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Input 1: Username / Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('auth.login.identity', 'Nama Pengguna atau Email')}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={identity}
                  onChange={(e) => { setIdentity(e.target.value); setErrorMessage(''); }}
                  placeholder="Nama pengguna atau email..."
                  autoComplete="username"
                  disabled={lockoutRemaining > 0}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition"
                />
                <User className="absolute right-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Input 2: Password with Eye Toggle Icon */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('auth.login.password', 'Kata Sandi')}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrorMessage(''); }}
                  placeholder="Masukkan kata sandi..."
                  autoComplete="current-password"
                  disabled={lockoutRemaining > 0}
                  className="w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:opacity-50 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Options: Remember Me & Forgot Password */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                  {t('auth.login.remember', 'Ingat identitas saya')}
                </span>
              </label>

              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline transition"
              >
                {t('auth.login.forgot', 'Lupa kata sandi?')}
              </button>
            </div>

            {/* Submit Button & Google Sign-In */}
            <div className="pt-2 space-y-2.5">
              <button
                type="submit"
                disabled={isLoading || lockoutRemaining > 0}
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 disabled:pointer-events-none rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <LogIn className="w-4 h-4" />
                )}
                <span>{isLoading ? 'Memverifikasi Kredensial...' : t('auth.login.submit', 'Masuk ke Sistem')}</span>
              </button>

              <div className="relative flex py-1 items-center">
                <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="shrink mx-2 text-[10px] text-slate-400 uppercase font-bold">atau</span>
                <div className="grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-4 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 active:scale-98 border border-slate-300 dark:border-slate-700 rounded-xl shadow-xs transition flex items-center justify-center gap-2.5"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600 dark:text-cyan-400 shrink-0" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span>{isLoading ? 'Menghubungkan ke Google Auth...' : 'Masuk dengan Google (Firebase Auth)'}</span>
              </button>
            </div>

          </form>

          {/* Overlay Loader during Login Processing */}
          {isLoading && (
            <LoadingScreen
              variant="overlay"
              text="Memverifikasi Sesi Masuk..."
              subtext="Memeriksa identitas, kredensial, dan status persetujuan akun pada database Firestore..."
            />
          )}



          {/* Registration Navigation */}
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-center">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('auth.login.register_prompt', 'Belum memiliki akun resmi?')}{' '}
              <button
                onClick={() => onNavigate('register')}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline ml-1"
              >
                {t('auth.login.register_link', 'Ajukan Pendaftaran Baru')}
              </button>
            </p>
          </div>

        </div>

      </div>

      {/* Modal Status Akun: Pending Approval */}
      {pendingApproval?.isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-700/60 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-700 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-7 h-7" />
            </div>

            <div className="text-center mb-5">
              <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700 mb-2">
                Status: Pending Approval
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
                Akun Menunggu Persetujuan
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {pendingApproval.message}
              </p>
            </div>

            <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 rounded-xl border border-amber-200/80 dark:border-amber-800/50 mb-6 text-xs text-amber-800 dark:text-amber-300/90 leading-relaxed">
              <div className="flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Sesuai kebijakan keamanan NEXAPROJECT, akun baru belum dapat mengakses dashboard operasional sebelum disetujui dan diverifikasi oleh <strong>Administrator Sistem</strong>.
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setPendingApproval(null);
                  onNavigate('landing');
                }}
                className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Halaman Utama (Landing)</span>
              </button>
              <button
                type="button"
                onClick={() => setPendingApproval(null)}
                className="py-2.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
