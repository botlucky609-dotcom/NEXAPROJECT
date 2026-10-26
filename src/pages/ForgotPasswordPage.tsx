import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  KeyRound, 
  Mail, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { AppView } from '../types/navigation';
import { dbService } from '../services/db';

export const ForgotPasswordPage: React.FC<{ onNavigate: (view: AppView) => void }> = ({ onNavigate }) => {
  const { t } = useTheme();

  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [identity, setIdentity] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [simulatedEmail, setSimulatedEmail] = useState('');
  const [displayedCodeDemo, setDisplayedCodeDemo] = useState('');
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // 3-minute timer countdown
  useEffect(() => {
    if (secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining]);

  const handleRequestCode = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!identity.trim()) {
      setErrorMessage('Masukkan Nama Pengguna atau Alamat Email Anda.');
      return;
    }

    const res = dbService.createPasswordResetCode(identity.trim());
    if (!res) {
      setErrorMessage('Nama Pengguna atau Email ini belum pernah terdaftar di dalam sistem.');
      return;
    }

    setSimulatedEmail(res.email);
    setDisplayedCodeDemo(res.code);
    setSecondsRemaining(180); // 3 minutes
    setStep('verify');
    setSuccessMessage(`Kode verifikasi 6-digit telah dikirim ke alamat email ${res.email}.`);
  };

  const handleResendCode = () => {
    if (secondsRemaining > 0) return;
    setErrorMessage('');
    const res = dbService.createPasswordResetCode(identity.trim());
    if (res) {
      setDisplayedCodeDemo(res.code);
      setSecondsRemaining(180);
      setSuccessMessage(`Kode baru telah dibuat dan dikirimkan. Berlaku 3 menit.`);
    }
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!code.trim() || code.trim().length !== 6) {
      setErrorMessage('Masukkan 6 digit kode verifikasi yang sah.');
      return;
    }

    if (secondsRemaining <= 0) {
      setErrorMessage('Masa berlaku kode telah habis (3 menit). Silakan minta kode baru.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Kata Sandi baru minimal 8 karakter campuran huruf dan angka.');
      return;
    }

    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      setErrorMessage('Kata Sandi baru harus kombinasi huruf dan angka.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Konfirmasi Kata Sandi Baru tidak cocok.');
      return;
    }

    const ok = dbService.completePasswordReset(simulatedEmail, code, newPassword);
    if (!ok) {
      setErrorMessage('Kode verifikasi salah atau sudah kadaluarsa.');
      return;
    }

    setSuccessMessage(t('auth.forgot.success', 'Kata sandi berhasil diperbarui! Mengalihkan ke halaman masuk...'));
    setTimeout(() => {
      onNavigate('login');
    }, 1500);
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 text-slate-900 dark:text-slate-100 transition-colors">
      
      {/* Top back */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6">
        <button
          onClick={() => onNavigate('login')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Halaman Masuk</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl mx-auto shadow-md mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            {t('auth.forgot.title', 'Pemulihan Kata Sandi')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {t('auth.forgot.subtitle', 'Reset kata sandi akun melalui verifikasi kode 6-digit email aman')}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 py-8 px-6 shadow-xl rounded-2xl border border-slate-200 dark:border-slate-800 sm:px-10">
          
          {/* Notifications */}
          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p className="font-medium">{errorMessage}</p>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="font-medium">{successMessage}</p>
            </div>
          )}

          {step === 'request' ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('auth.forgot.input', 'Nama Pengguna atau Alamat Email')}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={identity}
                    onChange={(e) => { setIdentity(e.target.value); setErrorMessage(''); }}
                    placeholder="Masukkan nama pengguna atau email..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                    autoFocus
                  />
                  <Mail className="absolute right-3.5 top-3 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition"
              >
                {t('auth.forgot.submit_code', 'Kirim Kode Verifikasi 6-Digit')}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetSubmit} className="space-y-4">
              
              {/* Simulated code banner */}
              <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-blue-900 dark:text-blue-200">Kode Verifikasi Email (Simulasi):</span>
                  <span className="font-mono text-sm font-extrabold text-blue-600 dark:text-blue-400 tracking-widest bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                    {displayedCodeDemo}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 text-[11px] pt-1">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('auth.forgot.timer', 'Sisa waktu berlaku kode:')} <strong>{formatTimer(secondsRemaining)}</strong></span>
                </div>
              </div>

              {/* Input Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('auth.forgot.code_label', 'Kode Verifikasi 6-Digit')}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="6 digit angka..."
                  className="w-full px-3.5 py-2.5 text-xs text-center font-mono text-lg tracking-widest rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                />
              </div>

              {/* Resend Code: Disabled until 3 minutes pass */}
              <div className="text-right">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={secondsRemaining > 0}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 disabled:opacity-40 disabled:pointer-events-none hover:underline"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>{t('auth.forgot.resend', 'Kirim Ulang Kode Verifikasi')}</span>
                </button>
              </div>

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('auth.forgot.new_password', 'Kata Sandi Baru')}
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter campuran..."
                    className="w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-2.5 text-slate-400"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('auth.forgot.confirm_new_password', 'Konfirmasi Kata Sandi Baru')}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru..."
                    className="w-full px-3.5 py-2.5 pr-10 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-slate-400"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition"
                >
                  {t('auth.forgot.reset_submit', 'Simpan & Perbarui Kata Sandi')}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>

    </div>
  );
};
