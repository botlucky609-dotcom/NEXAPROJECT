import React, { useState } from 'react';
import { Lock, Eye, EyeOff, LogOut, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SessionLockModal: React.FC = () => {
  const { isSessionLocked, unlockSession, currentUser, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isSessionLocked || !currentUser) return null;

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setErrorMsg('Masukkan kata sandi untuk membuka sesi.');
      return;
    }

    const success = unlockSession(password);
    if (success) {
      setPassword('');
      setErrorMsg('');
    } else {
      setErrorMsg('Kata sandi salah. Silakan coba kembali.');
    }
  };

  return (
    <div className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-center animate-scale-up">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center mb-4 ring-1 ring-amber-500/20">
          <Lock className="w-7 h-7" />
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
          Sesi Terkunci Otomatis
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
          Tidak ada aktivitas terdeteksi selama 15 menit. Masukkan kata sandi akun Anda untuk melanjutkan sesi tanpa kehilangan perubahan data.
        </p>

        <div className="mb-4 p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200/50 dark:border-slate-700/50 flex items-center justify-between text-left">
          <div>
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{currentUser.fullName}</p>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">@{currentUser.username} · {currentUser.role.toUpperCase()}</p>
          </div>
          <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
            Aktif
          </span>
        </div>

        {errorMsg && (
          <div className="mb-4 p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center gap-2 text-left">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <p className="text-xs text-rose-700 dark:text-rose-300 font-medium">{errorMsg}</p>
          </div>
        )}

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan kata sandi..."
              className="w-full px-3.5 py-2.5 pr-10 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={logout}
              className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              Keluar
            </button>
            <button
              type="submit"
              className="flex-1 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
            >
              Buka Sesi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
