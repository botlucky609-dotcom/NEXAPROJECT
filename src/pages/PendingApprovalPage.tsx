import React, { useState } from 'react';
import { 
  Clock, 
  ShieldAlert, 
  RefreshCw, 
  ArrowLeft, 
  LogOut, 
  User, 
  Database, 
  Mail, 
  BadgeCheck, 
  AlertCircle,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AppLogo } from '../components/common/AppLogo';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { AppView } from '../types/navigation';

export const PendingApprovalPage: React.FC<{ onNavigate: (view: AppView) => void }> = ({ onNavigate }) => {
  const { currentUser, logout, refreshUserStatus } = useAuth();
  const { t } = useTheme();

  const [isChecking, setIsChecking] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'info' | 'success' | 'warning'; message: string } | null>(null);

  const handleLiveCheck = async () => {
    setIsChecking(true);
    setFeedback({ type: 'info', message: 'Memeriksa status akun langsung ke database Firestore...' });

    try {
      const refreshed = await refreshUserStatus();
      if (refreshed && refreshed.status === 'active') {
        setFeedback({
          type: 'success',
          message: 'Selamat! Akun Anda telah disetujui oleh Administrator. Mengalihkan ke Dashboard...',
        });
        setTimeout(() => {
          onNavigate('dashboard');
        }, 800);
      } else {
        setFeedback({
          type: 'warning',
          message: 'Status akun masih "Pending". Akun belum disetujui oleh Admin/Creator di Firestore.',
        });
        setIsChecking(false);
      }
    } catch {
      setFeedback({
        type: 'warning',
        message: 'Gagal menghubungi server database. Periksa koneksi internet Anda.',
      });
      setIsChecking(false);
    }
  };

  const formattedDate = currentUser?.createdAt
    ? new Date(currentUser.createdAt).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Waktu registrasi';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans select-none">
      
      {/* Background Decorative Grid & Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-30 pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 flex items-center justify-between max-w-4xl mx-auto w-full pt-2">
        <AppLogo size="md" showWordmark={true} />
        
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
          <span>Pending Approval Guard</span>
        </div>
      </div>

      {/* Main Center Message Box */}
      <div className="relative z-10 max-w-xl mx-auto w-full my-auto py-8 text-center space-y-6">
        
        {/* Animated Badge & Icon */}
        <div className="relative inline-flex items-center justify-center">
          <div className="w-24 h-24 rounded-3xl bg-slate-900 border-2 border-amber-500/40 text-amber-400 flex items-center justify-center shadow-2xl shadow-amber-500/10 relative z-10">
            <Clock className="w-12 h-12 animate-pulse" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-slate-800 border border-amber-500/50 text-amber-400 flex items-center justify-center shadow-md z-20">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        {/* Status Tag */}
        <div>
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-mono font-extrabold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30 tracking-wider">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Status Akun: Menunggu Persetujuan (Pending)
          </span>
        </div>

        {/* Title & Description */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Akses Masuk Sistem Ditangguhkan
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            Akun Anda telah berhasil terdaftar di database NEXAPROJECT. Namun demi kepatuhan keamanan dan otorisasi kerja galangan kapal, setiap akun baru wajib diverifikasi dan diaktifkan oleh <strong>Administrator</strong> atau <strong>Creator</strong> sebelum dapat mengakses Dashboard.
          </p>
        </div>

        {/* User Identity Details Card */}
        <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 text-xs space-y-2.5 max-w-md mx-auto shadow-xl text-left">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold text-sm shrink-0">
              {currentUser?.fullName?.charAt(0) || <User className="w-5 h-5" />}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-extrabold text-white text-xs truncate">
                {currentUser?.fullName || 'Pengguna Baru'}
              </h4>
              <p className="text-slate-400 text-[11px] font-mono truncate">
                {currentUser?.email || currentUser?.username}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-amber-950/80 border border-amber-700/60 text-amber-300 shrink-0">
              PENDING
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
            <div>
              <span className="text-slate-500 block">Peran Sistem:</span>
              <span className="font-bold text-slate-300 capitalize">{currentUser?.role || 'Karyawan'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">ID Personel:</span>
              <span className="font-mono text-slate-300">{currentUser?.employeeId || '-'}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Waktu Registrasi:</span>
              <span className="text-slate-300">{formattedDate}</span>
            </div>
            <div>
              <span className="text-slate-500 block">Koleksi Database:</span>
              <span className="font-mono text-blue-400 text-[10px]">/users/{currentUser?.id?.slice(0, 8)}...</span>
            </div>
          </div>
        </div>

        {/* Real-time sync indicator note */}
        <div className="p-3 bg-blue-950/40 rounded-xl border border-blue-800/40 text-xs text-blue-300 max-w-md mx-auto text-left flex items-start gap-2.5">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mt-1 shrink-0" />
          <p className="text-[11px] leading-relaxed">
            <strong>Sinkronisasi Real-Time Aktif:</strong> Halaman ini terhubung langsung ke Firestore melalui listener real-time. Begitu Admin atau Creator mengubah status Anda menjadi <strong>'active'</strong> di database, akses dashboard akan terbuka secara otomatis tanpa perlu memuat ulang.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 max-w-md mx-auto pt-2">
          <button
            onClick={handleLiveCheck}
            disabled={isChecking}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>{isChecking ? 'Memeriksa Database Cloud...' : 'Periksa Status Persetujuan Sekarang'}</span>
          </button>

          {feedback && (
            <div className={`p-3 rounded-xl text-xs flex items-start gap-2 text-left animate-in fade-in duration-150 ${
              feedback.type === 'success' 
                ? 'bg-emerald-950/80 border border-emerald-700/80 text-emerald-200' 
                : feedback.type === 'warning'
                ? 'bg-amber-950/80 border border-amber-700/80 text-amber-200'
                : 'bg-slate-900 border border-slate-700 text-slate-300'
            }`}>
              {feedback.type === 'success' && <BadgeCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />}
              {feedback.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />}
              {feedback.type === 'info' && <RefreshCw className="w-4 h-4 text-blue-400 shrink-0 mt-0.5 animate-spin" />}
              <span className="leading-relaxed">{feedback.message}</span>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onNavigate('landing')}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs border border-slate-800 transition flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Halaman Utama (Landing)</span>
            </button>
            <button
              onClick={() => {
                logout();
                onNavigate('login');
              }}
              className="py-2.5 px-4 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-bold text-xs border border-rose-800/40 transition flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar (Logout)</span>
            </button>
          </div>
        </div>

      </div>

      {/* Overlay LoadingScreen during live Firestore verification */}
      {isChecking && (
        <LoadingScreen
          variant="overlay"
          text="Memeriksa Status Akun..."
          subtext="Mengecek pembaruan persetujuan akun langsung pada database Firestore..."
        />
      )}

      {/* Bottom Footer */}
      <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 max-w-4xl mx-auto w-full pt-4 border-t border-slate-900">
        <p className="text-[11px]">
          &copy; {new Date().getFullYear()} NEXAPROJECT. Hak Cipta Dilindungi.
        </p>
        <span className="text-[11px] text-slate-500">
          Otoritas & Hak Akses Terpusat (RBAC Firestore Security Rules)
        </span>
      </div>

    </div>
  );
};
