import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Power, 
  Sliders, 
  CheckCircle2, 
  X, 
  RefreshCw 
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { AppView } from '../../types/navigation';

interface CreatorMaintenanceBannerProps {
  onNavigate?: (view: AppView) => void;
}

export const CreatorMaintenanceBanner: React.FC<CreatorMaintenanceBannerProps> = ({ onNavigate }) => {
  const { appSettings, setServerStatus } = useTheme();
  const { currentUser } = useAuth();
  const [isActivating, setIsActivating] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const isCreator = currentUser?.role === 'creator' || 
    currentUser?.email === 'muhammad.andri0605@gmail.com' || 
    currentUser?.email === 'creator@nexaproject.com';

  if (!isCreator || appSettings.serverConfig.status !== 'maintenance') {
    return null;
  }

  const handleActivateServer = async () => {
    if (window.confirm('Aktifkan kembali server sekarang? Seluruh pengguna (Admin, Staff, Karyawan) akan dapat mengakses sistem kembali.')) {
      setIsActivating(true);
      try {
        await setServerStatus('active', '', '', currentUser?.fullName || 'Creator');
      } finally {
        setIsActivating(false);
      }
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-2xl transition animate-bounce border-2 border-slate-900"
          title="Server dalam mode maintenance. Klik untuk membuka panel kendali."
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Mode Maintenance Aktif</span>
        </button>
      </div>
    );
  }

  return (
    <div className="sticky top-0 z-40 bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-slate-950 px-4 py-2.5 shadow-lg border-b border-amber-400/40 animate-in slide-in-from-top duration-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        
        {/* Left message */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
            <AlertTriangle className="w-4 h-4 animate-pulse" />
          </div>
          <div className="text-xs">
            <div className="font-extrabold flex items-center gap-2">
              <span>⚠️ MODE MAINTENANCE DIAKTIFKAN OLEH CREATOR</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase bg-slate-950 text-amber-400">
                Server Offline untuk Umum
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-900 mt-0.5">
              Akses pengguna lain (Admin, Staff, Karyawan) diblokir sementara. Anda dapat leluasa menguji & memperbarui sistem.
            </p>
          </div>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            onClick={handleActivateServer}
            disabled={isActivating}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs transition shadow-sm active:scale-95"
            title="Kembalikan status server menjadi AKTIF"
          >
            <Power className={`w-3.5 h-3.5 text-emerald-400 ${isActivating ? 'animate-spin' : ''}`} />
            <span>{isActivating ? 'Mengaktifkan...' : '🟢 Aktifkan Server Kembali'}</span>
          </button>

          {onNavigate && (
            <button
              onClick={() => onNavigate('settings-app')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/50 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
              title="Buka Pengaturan Server"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Pengaturan</span>
            </button>
          )}

          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-lg text-slate-900 hover:bg-amber-400/40 transition"
            title="Kecilkan pemberitahuan"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
