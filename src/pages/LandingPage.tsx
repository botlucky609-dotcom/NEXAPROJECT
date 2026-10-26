import React, { useEffect, useState } from 'react';
import { 
  ShieldCheck, 
  Wifi, 
  Users, 
  FileSpreadsheet, 
  ArrowRight, 
  CheckCircle2, 
  Lock, 
  Sliders, 
  Smartphone, 
  Sparkles,
  HelpCircle,
  Eye,
  Camera,
  QrCode
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { AppView } from '../types/navigation';

export const LandingPage: React.FC<{ onNavigate: (view: AppView) => void }> = ({ onNavigate }) => {
  const { t, language } = useTheme();
  const { isAuthenticated, loginWithGoogle } = useAuth();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen max-w-full overflow-x-clip bg-transparent text-slate-900 dark:text-slate-100 transition-colors selection:bg-blue-600 selection:text-white">
      
      {/* Background layer with parallax scroll effect */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute inset-0 overflow-hidden opacity-30 dark:opacity-20 max-w-full"
        style={{ transform: `translateY(${scrollY * 0.15}px)` }}
      >
        <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-blue-500/20 blur-[120px]" />
        <div className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] rounded-full bg-indigo-500/20 blur-[140px]" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          <div className="lg:col-span-7 space-y-6">
            
            {/* Clean metadata kicker */}
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400">
              <span>{t('landing.badge')}</span>
              <span aria-hidden="true">·</span>
              <span className="text-slate-500 dark:text-slate-400">{t('landing.hero.badge_fab')}</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-500 font-bold">{t('landing.hero.badge_pwa')}</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15] text-balance">
              {t('landing.hero.title')}
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              {t('landing.hero.desc')}
            </p>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'login')}
                className="inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-lg shadow-blue-600/20 transition whitespace-nowrap shrink-0"
              >
                <span>{isAuthenticated ? t('landing.cta.open_dash') : t('landing.cta.start')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigate('support')}
                className="inline-flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl transition whitespace-nowrap shrink-0"
              >
                <HelpCircle className="w-4 h-4 text-blue-500" />
                <span>{t('landing.cta.support')}</span>
              </button>

              {!isAuthenticated && (
                <>
                  <button
                    onClick={async () => {
                      const res = await loginWithGoogle();
                      if (res.success) onNavigate('dashboard');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl transition whitespace-nowrap shrink-0 shadow-xs"
                    title={language === 'en' ? 'Sign in with Google' : 'Masuk seketika dengan akun Google'}
                  >
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>{t('landing.cta.google')}</span>
                  </button>

                  <button
                    onClick={() => onNavigate('register')}
                    className="inline-flex items-center gap-1.5 px-4 py-3 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition whitespace-nowrap shrink-0"
                  >
                    <span>{t('landing.cta.register')}</span>
                  </button>
                </>
              )}
            </div>

          </div>

          {/* Hero Visual Asset */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl bg-slate-900 aspect-16/10">
              <img
                src="/src/assets/images/hero_shipyard_dock_1792239409772.jpg"
                alt="Galangan Kapal Modern NEXAPROJECT"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex flex-col justify-end p-5 text-white">
                <span className="text-[11px] font-mono text-blue-400 uppercase tracking-wider">
                  Shipyard Engineering Operations
                </span>
                <p className="text-xs font-medium text-slate-200">
                  {language === 'en' 
                    ? 'Ship Repair, Steel Fabrication, Piping, and Surface Blasting/Painting Management.'
                    : 'Manajemen Proyek Reparasi Kapal, Fabrikasi Baja, Piping, dan Blasting/Painting.'}
                </p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="py-16 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/50 dark:bg-slate-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mb-2">
              {t('landing.pillars.title')}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t('landing.pillars.desc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Pillar 1: Offline PWA */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-blue-500/50 transition">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                <Wifi className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                {t('landing.features.offline.title')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {t('landing.features.offline.desc')}
              </p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono space-y-1">
                <div>· LocalStorage & Cache Synchronization</div>
                <div>· {language === 'en' ? 'Secure Sync Queue' : 'Antrean Sinkronisasi Aman'}</div>
              </div>
            </div>

            {/* Pillar 2: Security & OWASP Hardening */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-emerald-500/50 transition">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                {t('landing.features.security.title')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {t('landing.features.security.desc')}
              </p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono space-y-1">
                <div>· Lockout 3x (5m), 6x (10m), 9x (1h)</div>
                <div>· {language === 'en' ? '24h Auto-Logout & 15m Session Lock' : 'Auto-Logout 24 Jam & Sesi Lock 15 Menit'}</div>
              </div>
            </div>

            {/* Pillar 3: RBAC 4 Roles */}
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:border-indigo-500/50 transition">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                {t('landing.features.roles.title')}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                {t('landing.features.roles.desc')}
              </p>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono space-y-1">
                <div>· {language === 'en' ? '👑 Creator (Supreme Authority & Protected)' : '👑 Creator (Otoritas Penuh & Formula Terproteksi)'}</div>
                <div>· {language === 'en' ? 'Admin, Staff & Workers (Strict Role Restrictions)' : 'Admin, Staff & Karyawan (View-Only Restriksi)'}</div>
              </div>
            </div>

          </div>

          {/* Hardware & Enterprise Features strip */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs">
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Camera className="w-4 h-4 text-blue-500" />
              <span>{t('landing.feature.camera')}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <QrCode className="w-4 h-4 text-emerald-500" />
              <span>{t('landing.feature.qr')}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <FileSpreadsheet className="w-4 h-4 text-amber-500" />
              <span>{t('landing.feature.excel')}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
              <Sliders className="w-4 h-4 text-indigo-500" />
              <span>{t('landing.feature.brightness')}</span>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
};
