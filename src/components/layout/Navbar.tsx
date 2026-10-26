import React, { useState, useEffect, useRef } from 'react';
import { 
  Sun, 
  Moon, 
  Eye, 
  Globe, 
  Wifi, 
  WifiOff, 
  LogOut, 
  Shield, 
  PanelLeft,
  Sliders,
  ChevronDown,
  Key
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { AppView } from '../../types/navigation';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { AppLogo } from '../common/AppLogo';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  isOnline: boolean;
  onToggleSidebar?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  currentView, 
  onNavigate, 
  isOnline,
  onToggleSidebar 
}) => {
  const { currentUser, isAuthenticated, logout } = useAuth();
  const { theme, setTheme, language, setLanguage, t } = useTheme();

  // Dropdown states for Theme and User Profile
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const themeRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (themeRef.current && !themeRef.current.contains(target)) {
        setShowThemeMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-slate-200/90 dark:border-slate-800/90 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md transition-colors overflow-x-clip">
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* ================= ZONE 1: BRAND LOGO & WORDMARK + LEFT SIDEBAR TRIGGER ================= */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition mr-0.5"
              title={t('nav.sidebar_toggle', 'Buka/Tutup Menu Samping')}
              aria-label="Toggle Sidebar Navigation"
            >
              <PanelLeft className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </button>
          )}

          <button
            onClick={() => onNavigate(isAuthenticated ? 'dashboard' : 'landing')}
            className="flex items-center gap-2.5 text-left text-slate-900 dark:text-white whitespace-nowrap group focus:outline-hidden"
            aria-label="Home"
          >
            <AppLogo size="sm" showWordmark={true} />
          </button>
        </div>

        {/* ================= ZONE 2: ACTIONS & UTILITY CONTROLS (RIGHT) ================= */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          
          {/* PWA Install Button (Desktop & Tablet >= 768px) */}
          <div className="hidden md:block">
            <PWAInstallButton />
          </div>

          {/* Connection Status Badge (>= 640px) */}
          <div 
            className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50"
            title={isOnline ? t('common.online', 'Terhubung (Online)') : t('common.offline', 'Offline')}
          >
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3 text-emerald-500" />
                <span className="hidden xl:inline text-slate-600 dark:text-slate-300">Online</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-amber-500 animate-pulse" />
                <span className="text-amber-600 font-bold">Offline</span>
              </>
            )}
          </div>

          {/* Language Switcher (>= 640px) */}
          <button
            onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
            className="hidden sm:flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={language === 'id' ? 'Switch to English' : 'Ganti ke Bahasa Indonesia'}
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span className="uppercase text-[11px] font-bold">{language}</span>
          </button>

          {/* Brightness Theme Selector */}
          <div className="relative" ref={themeRef}>
            <button
              onClick={() => setShowThemeMenu(!showThemeMenu)}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={`${t('theme.label', 'Kecerahan Layar')}: ${theme}`}
              aria-label="Screen Brightness"
            >
              {theme === 'terang' && <Sun className="w-4 h-4 text-amber-500" />}
              {theme === 'gelap' && <Moon className="w-4 h-4 text-blue-400" />}
              {theme === 'redup' && <Eye className="w-4 h-4 text-emerald-400" />}
            </button>

            {showThemeMenu && (
              <div 
                className="absolute right-0 mt-2 w-44 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100"
              >
                <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {t('theme.label', 'Kecerahan Layar')}
                </div>
                <button
                  onClick={() => { setTheme('terang'); setShowThemeMenu(false); }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition ${
                    theme === 'terang' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('theme.terang', 'Mode Terang')}</span>
                </button>
                <button
                  onClick={() => { setTheme('gelap'); setShowThemeMenu(false); }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition ${
                    theme === 'gelap' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-blue-400" />
                  <span>{t('theme.gelap', 'Mode Gelap')}</span>
                </button>
                <button
                  onClick={() => { setTheme('redup'); setShowThemeMenu(false); }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left transition ${
                    theme === 'redup' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 font-bold' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{t('theme.redup', 'Mode Redup')}</span>
                </button>
              </div>
            )}
          </div>

          {/* User Profile or Sign In CTA */}
          {isAuthenticated && currentUser ? (
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-1.5 p-1 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {currentUser.fullName ? currentUser.fullName.charAt(0) : 'U'}
                </div>
                <div className="hidden sm:flex flex-col text-left pr-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight max-w-[90px] truncate">
                    {currentUser.username}
                  </span>
                  <span className="text-[9px] uppercase font-bold text-blue-600 dark:text-blue-400 flex items-center gap-0.5">
                    {currentUser.role === 'creator' ? '👑 CREATOR' : currentUser.role}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
              </button>

              {showUserMenu && (
                <div
                  className="absolute right-0 mt-2 w-64 max-w-[calc(100vw-1.5rem)] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 text-xs text-slate-700 dark:text-slate-200 animate-in fade-in zoom-in-95 duration-100"
                >
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                    <p className="font-bold text-slate-900 dark:text-white truncate">{currentUser.fullName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.email}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase">
                      <Shield className="w-3 h-3" />
                      <span>{t('common.role', 'Peran')}: {currentUser.role}</span>
                      {currentUser.role === 'creator' && (
                        <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-black">PROTECTED</span>
                      )}
                    </div>
                  </div>

                  {/* Settings quick link */}
                  <button
                    onClick={() => { setShowUserMenu(false); onNavigate('settings-app'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left font-medium"
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{language === 'en' ? 'App Settings' : 'Pengaturan Aplikasi'}</span>
                  </button>

                  {(currentUser.role === 'creator' || currentUser.role === 'admin') && (
                    <button
                      onClick={() => { setShowUserMenu(false); onNavigate('users-permissions'); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left font-medium"
                    >
                      <Key className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{language === 'en' ? 'User Permissions' : 'Izin Akses Pengguna'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => { logout(); setShowUserMenu(false); onNavigate('landing'); }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-left font-semibold"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>{t('nav.logout', 'Keluar')}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => onNavigate('login')}
                className="px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 transition whitespace-nowrap shrink-0"
              >
                {t('nav.login', 'Masuk')}
              </button>
              <button
                onClick={() => onNavigate('register')}
                className="hidden sm:inline-flex px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition whitespace-nowrap shrink-0"
              >
                {t('nav.register', 'Daftar')}
              </button>
            </div>
          )}

          {/* NOTE: The right-side hamburger menu button and drawer have been removed as requested.
              All navigation is now exclusively accessed via the left Side Menu (Sidebar). */}

        </div>
      </div>
    </header>
  );
};
