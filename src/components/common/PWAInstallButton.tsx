import React, { useEffect, useState } from 'react';
import { Download, Smartphone, Monitor, X, CheckCircle2, Info } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

declare global {
  interface Window {
    __pwaInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

export const PWAInstallButton: React.FC = () => {
  const { t } = useTheme();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => {
    if (typeof window !== 'undefined' && window.__pwaInstallPrompt) {
      return window.__pwaInstallPrompt;
    }
    return null;
  });
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [installSuccess, setInstallSuccess] = useState(false);

  useEffect(() => {
    // 1. Check standalone mode (already installed as PWA)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    // 2. Detect iOS Safari
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isAppleDevice);

    // 3. Check early captured prompt from window
    if (window.__pwaInstallPrompt) {
      setDeferredPrompt(window.__pwaInstallPrompt);
    }

    // 4. Listener for standard beforeinstallprompt
    const handleBeforePrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      window.__pwaInstallPrompt = promptEvent;
      setDeferredPrompt(promptEvent);
      console.log('[PWA] beforeinstallprompt captured in PWAInstallButton');
    };

    // 5. Listener for custom prompt captured event from index.html
    const handleCustomPromptCaptured = () => {
      if (window.__pwaInstallPrompt) {
        setDeferredPrompt(window.__pwaInstallPrompt);
      }
    };

    // 6. Listener for successful install
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__pwaInstallPrompt = null;
      setInstallSuccess(true);
      setTimeout(() => setInstallSuccess(false), 4000);
      console.log('[PWA] App successfully installed as standalone PWA.');
    };

    window.addEventListener('beforeinstallprompt', handleBeforePrompt);
    window.addEventListener('pwa-prompt-captured', handleCustomPromptCaptured);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforePrompt);
      window.removeEventListener('pwa-prompt-captured', handleCustomPromptCaptured);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    // Check if deferredPrompt is available
    const promptEvent = deferredPrompt || window.__pwaInstallPrompt;

    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        console.log('[PWA] User choice outcome:', outcome);
        if (outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
          window.__pwaInstallPrompt = null;
        }
      } catch (err) {
        console.warn('[PWA] Prompt invocation failed:', err);
        setShowGuideModal(true);
      }
      return;
    }

    // If prompt is not directly available (e.g. iOS Safari, Chrome desktop address bar, or browser restricted),
    // display guided installation instructions modal
    setShowGuideModal(true);
  };

  // If already running as an installed PWA, hide the install button
  if (isInstalled && !installSuccess) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 transition rounded-xl shadow-xs whitespace-nowrap shrink-0 border border-blue-500/30 cursor-pointer"
        title="Pasang NEXAPROJECT di perangkat Anda (Desktop, Android, iOS)"
        aria-label="Pasang Aplikasi (PWA)"
      >
        <Download className="w-3.5 h-3.5 shrink-0" />
        <span>{t('common.install_pwa', 'Pasang Aplikasi (PWA)')}</span>
      </button>

      {/* Guided Installation Modal for All Platforms */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Download className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Panduan Pemasangan Aplikasi (PWA)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    NEXAPROJECT Shipyard Enterprise System
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content per Device Platform */}
            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              
              {isIOS ? (
                // iOS Safari Steps
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400">
                    <Smartphone className="w-4 h-4" />
                    <span>Perangkat Apple iOS (Safari)</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                    <li>Buka aplikasi menggunakan browser <strong>Safari</strong>.</li>
                    <li>Ketuk ikon <strong>Bagikan / Share</strong> (kotak dengan panah ke atas) di bilah bawah Safari.</li>
                    <li>Gulir menu ke bawah lalu pilih <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong>.</li>
                    <li>Ketuk <strong>"Tambah" (Add)</strong> di sudut kanan atas untuk menyelesaikan pemasangan.</li>
                  </ol>
                </div>
              ) : (
                // Android & Desktop Chrome / Edge Steps
                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400">
                      <Monitor className="w-4 h-4" />
                      <span>Desktop (Google Chrome / Microsoft Edge)</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                      <li>Lihat di bilah alamat browser (URL bar) sebelah kanan.</li>
                      <li>Klik ikon <strong>Instal / Pasang Aplikasi</strong> (ikon komputer dengan panah ke bawah).</li>
                      <li>Atau klik <strong>Menu (Titik Tiga ⋮)</strong> → pilih <strong>"Pasang NEXAPROJECT..."</strong>.</li>
                    </ol>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                      <Smartphone className="w-4 h-4" />
                      <span>Smartphone Android (Chrome)</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
                      <li>Ketuk tombol <strong>Menu (Titik Tiga ⋮)</strong> di kanan atas Chrome.</li>
                      <li>Pilih menu <strong>"Pasang Aplikasi"</strong> atau <strong>"Tambahkan ke Layar Utama"</strong>.</li>
                      <li>Konfirmasi dengan mengetuk <strong>"Instal"</strong>.</li>
                    </ol>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-2 p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300 text-[11px]">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Setelah terpasang, aplikasi dapat diakses langsung dari beranda/desktop dan bekerja secara offline saat jaringan terputus.
                </span>
              </div>
            </div>

            {/* Modal Footer Action */}
            <div className="pt-2">
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-full py-2.5 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition"
              >
                Mengerti & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
