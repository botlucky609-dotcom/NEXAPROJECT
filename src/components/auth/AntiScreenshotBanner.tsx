import React, { useState } from 'react';
import { ShieldCheck, EyeOff, AlertOctagon, Check } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AntiScreenshotBanner: React.FC = () => {
  const { hasAcknowledgedAntiScreenshot, acknowledgeAntiScreenshot, isScreenshotBlocked } = useAuth();
  const [showConsentModal, setShowConsentModal] = useState(!hasAcknowledgedAntiScreenshot);

  const handleAccept = () => {
    acknowledgeAntiScreenshot();
    setShowConsentModal(false);
  };

  return (
    <>
      {/* Active Screen Blocker Overlay when print or screenshot event is triggered */}
      {isScreenshotBlocked && (
        <div className="fixed inset-0 z-9999 flex flex-col items-center justify-center bg-slate-950/95 backdrop-blur-xl text-white p-6 text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-rose-600/20 text-rose-500 flex items-center justify-center mb-4 ring-1 ring-rose-500/30 animate-pulse">
            <EyeOff className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Tangkapan Layar Terdeteksi / Terblokir</h2>
          <p className="text-sm text-slate-300 max-w-md mb-2">
            Kebijakan Kerahasiaan Proyek NEXAPROJECT melarang penyalinan, perekaman layar, atau tangkapan layar data sensitif perusahaan.
          </p>
          <span className="text-xs text-slate-400 font-mono">CONFIDENTIAL &copy; NEXAPROJECT ENTERPRISE</span>
        </div>
      )}

      {/* Device Policy Consent Modal on First Use */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Pemberitahuan Keamanan Perangkat</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Protokol Anti-Screenshot & Kerahasiaan Dokumen</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 mb-6 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
              <div className="flex items-start gap-2">
                <AlertOctagon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p>
                  Sistem ini memuat data rahasia galangan kapal, upah tenaga kerja, dan spesifikasi kapal. Pengguna dilarang mengambil tangkapan layar (screenshot) atau membagikan rekaman data.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <p>
                  Aplikasi memantau aktivitas pencetakan (print) dan fokus layar guna memastikan kepatuhan regulasi keamanan.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={handleAccept}
                className="w-full py-2.5 px-4 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
              >
                Saya Mengerti & Mengizinkan Protokol Keamanan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
