import React, { useState } from 'react';
import { 
  Server, 
  Wrench, 
  RefreshCw, 
  Clock, 
  ShieldAlert, 
  Lock, 
  LogIn, 
  ChevronRight,
  HardHat,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { settingsDb } from '../../services/settingsDb';
import { CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import { AppLogo } from './AppLogo';

interface MaintenanceModeScreenProps {
  onRefresh?: () => void;
}

export const MaintenanceModeScreen: React.FC<MaintenanceModeScreenProps> = ({ onRefresh }) => {
  const { appSettings } = useTheme();
  const { login } = useAuth();
  const { serverConfig, appName, appSubtitle } = appSettings;

  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'info' | 'success' | 'warning'; message: string } | null>(null);

  const handleManualCheck = async () => {
    setIsChecking(true);
    setFeedback({
      type: 'info',
      message: 'Membersihkan cache PWA & memeriksa status server langsung ke cloud...',
    });

    try {
      // 1. Pembersihan Cache Browser & CacheStorage PWA
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const cacheKeys = await caches.keys();
          await Promise.all(cacheKeys.map((key) => caches.delete(key)));
        } catch (cErr) {
          console.warn('CacheStorage purge warning:', cErr);
        }
      }

      // 2. Beritahu Service Worker untuk membersihkan cache & perbarui service worker
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        try {
          if (navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({ action: 'CLEAR_CACHE' });
          }
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            await reg.update().catch(() => {});
          }
        } catch (swErr) {
          console.warn('ServiceWorker update warning:', swErr);
        }
      }

      // 3. Pengecekan status server langsung tanpa cache (Network-First)
      const freshSettings = await settingsDb.fetchServerStatusDirectly();

      if (freshSettings.serverConfig.status === 'active') {
        setFeedback({
          type: 'success',
          message: 'Server telah aktif kembali! Memuat ulang sistem...',
        });
        setTimeout(() => {
          if (onRefresh) {
            onRefresh();
          } else {
            window.location.href = window.location.origin + window.location.pathname + '?nocache=' + Date.now();
          }
        }, 600);
      } else {
        setFeedback({
          type: 'warning',
          message: `Server masih dalam perawatan (${freshSettings.serverConfig.estimatedEnd || 'Menunggu jadwal selesai'}). Seluruh cache lokal telah dibersihkan.`,
        });
        setIsChecking(false);
      }
    } catch (err: any) {
      setFeedback({
        type: 'warning',
        message: 'Gagal terhubung langsung ke server. Menampilkan status tersimpan.',
      });
      setIsChecking(false);
    }
  };

  const handleEmergencyLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identity.trim() || !password) {
      setErrorMsg('Masukkan identitas dan kata sandi otorisasi.');
      return;
    }

    const res = await login(identity.trim(), password, false);
    if (res.success) {
      setShowEmergencyModal(false);
      window.location.reload();
    } else {
      setErrorMsg(res.error || 'Akses ditolak: Kredensial tidak valid atau tidak memiliki wewenang pemeliharaan.');
    }
  };

  const formattedDate = serverConfig.updatedAt
    ? new Date(serverConfig.updatedAt).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Waktu terkini';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans select-none">
      
      {/* Background Decorative Grid & Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Brand */}
      <div className="relative z-10 flex items-center justify-between max-w-5xl mx-auto w-full pt-2">
        <AppLogo size="md" showWordmark={true} />
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
          <span>Sistem Pemeliharaan</span>
        </div>
      </div>

      {/* Main Center Message Box */}
      <div className="relative z-10 max-w-xl mx-auto w-full my-auto py-8 text-center space-y-6">
        
        {/* Animated Badge & Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-24 h-24 rounded-3xl bg-slate-900 border-2 border-amber-500/30 text-amber-500 flex items-center justify-center shadow-2xl shadow-amber-500/10 relative z-10">
            <Wrench className="w-12 h-12 animate-pulse" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-slate-800 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-md z-20">
            <HardHat className="w-5 h-5" />
          </div>
        </div>

        {/* Status Tag */}
        <div>
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-mono font-extrabold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30 tracking-wider">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            Status Server: Tidak Aktif / Maintenance
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Sistem Sedang Dalam Perawatan
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            {serverConfig.message || 'Server aplikasi sedang ditangguhkan sementara waktu untuk pemeliharaan berkala, pembaruan arsitektur sistem, dan optimasi performa operasional.'}
          </p>
        </div>

        {/* Maintenance Info Details Card */}
        <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 text-xs space-y-2.5 max-w-md mx-auto shadow-xl">
          <div className="flex items-center justify-between text-slate-400">
            <span className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Estimasi Selesai:</span>
            </span>
            <span className="font-bold text-amber-300 font-mono">
              {serverConfig.estimatedEnd || 'Menunggu Informasi Lanjutan'}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-slate-800/80 text-[11px]">
            <span>Terakhir Diperbarui:</span>
            <span className="font-mono text-slate-300">{formattedDate}</span>
          </div>

          <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-slate-800/80 text-[11px]">
            <span>Dikelola Oleh:</span>
            <span className="font-bold text-blue-400">Tim Manajemen Sistem</span>
          </div>
        </div>

        {/* Action Button: Check status */}
        <div className="flex flex-col items-center justify-center gap-3 pt-2">
          <button
            onClick={handleManualCheck}
            disabled={isChecking}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Memeriksa Status Server...' : 'Periksa Status Server / Muat Ulang'}</span>
          </button>

          {feedback && (
            <div className={`p-3 rounded-xl text-xs max-w-md w-full flex items-start gap-2 animate-in fade-in slide-in-from-top-1 text-left ${
              feedback.type === 'success' 
                ? 'bg-emerald-950/70 border border-emerald-700/80 text-emerald-200' 
                : feedback.type === 'warning'
                ? 'bg-amber-950/70 border border-amber-700/80 text-amber-200'
                : 'bg-slate-900 border border-slate-700 text-slate-300'
            }`}>
              {feedback.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              {feedback.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
              {feedback.type === 'info' && <RefreshCw className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 animate-spin" />}
              <span className="leading-relaxed">{feedback.message}</span>
            </div>
          )}
        </div>

      </div>

      {/* Bottom Footer & Discreet Creator Entry */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 max-w-5xl mx-auto w-full pt-4 border-t border-slate-900">
        <p className="text-[11px]">
          &copy; {new Date().getFullYear()} {appName}. Seluruh hak cipta dilindungi.
        </p>

        {/* Discreet Creator Access Link */}
        <button
          onClick={() => {
            setShowEmergencyModal(true);
            setErrorMsg('');
          }}
          className="text-[11px] text-slate-500 hover:text-slate-300 transition flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-slate-900"
        >
          <Lock className="w-3 h-3 text-slate-500" />
          <span>Akses Otorisasi Darurat</span>
        </button>
      </div>

      {/* Emergency Creator Login Modal */}
      {showEmergencyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-slate-900 rounded-3xl border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">Otorisasi Akses Pemeliharaan</h3>
                  <p className="text-[10px] text-slate-400">Verifikasi Kredensial Administrator</p>
                </div>
              </div>
              <button
                onClick={() => setShowEmergencyModal(false)}
                className="text-slate-400 hover:text-white text-xs font-bold px-2 py-1"
              >
                Tutup
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleEmergencyLogin} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Identitas Otorisasi (Username / Email)
                </label>
                <input
                  type="text"
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  placeholder="Username atau email..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  Kata Sandi Otorisasi
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEmergencyModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Verifikasi & Masuk</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
