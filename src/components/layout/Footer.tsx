import React from 'react';
import { Shield, Lock, FileCheck, LifeBuoy } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AppView } from '../../types/navigation';

export const Footer: React.FC<{ onNavigate: (view: AppView) => void }> = ({ onNavigate }) => {
  const { currentUser } = useAuth();

  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 transition-colors py-8 mt-auto text-xs text-slate-500 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-900 dark:text-white font-extrabold text-sm">
              <span className="w-5 h-5 rounded bg-blue-600 text-white flex items-center justify-center text-[11px]">N</span>
              <span>NEXAPROJECT</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Sistem Manajemen Proyek Enterprise Galangan Kapal & Industri Berat dengan keandalan multi-platform (Web, Android, iOS), arsitektur PWA offline, dan keamanan berlapis.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-xs">Navigasi Utama</h4>
            <ul className="space-y-1.5 text-xs">
              <li>
                <button onClick={() => onNavigate('landing')} className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                  Halaman Utama
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('support')} className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                  Layanan Dukungan & Bantuan
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('login')} className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                  Masuk ke Sistem (Login)
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('register')} className="hover:text-blue-600 dark:hover:text-blue-400 transition">
                  Pendaftaran Akun Baru
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-xs">Standar Keamanan</h4>
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-500" />
                <span>Enkripsi Hash & Salt Terisolasi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-500" />
                <span>Anti-Screenshot & Watermarking</span>
              </div>
              <div className="flex items-center gap-1.5">
                <FileCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Audit Log Akses & Kepatuhan OWASP</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-xs">Kesiapan Operasional</h4>
            <div className="space-y-1.5 text-[11px]">
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                Sistem enterprise teroptimasi penuh untuk lingkungan desktop, tablet dock, dan smartphone lapangan (Android/iOS PWA).
              </p>
              <div className="pt-1 flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold">
                <LifeBuoy className="w-3.5 h-3.5" />
                <button onClick={() => onNavigate('support')} className="hover:underline">
                  Pusat Bantuan & Layanan
                </button>
              </div>
            </div>
          </div>

        </div>

        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <p>&copy; {new Date().getFullYear()} NEXAPROJECT Enterprise. Seluruh hak cipta dilindungi undang-undang.</p>
          <div className="flex items-center gap-4">
            <span className="text-slate-400">Versi Sistem: 1.0.0-PRO</span>
            <span>·</span>
            <span className="text-emerald-500 font-semibold">Status: Operasional Siap Pakai</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
