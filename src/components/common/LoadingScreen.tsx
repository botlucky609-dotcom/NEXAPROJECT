import React from 'react';
import { Loader2, ShieldCheck, Database, RefreshCw, Anchor, Cpu } from 'lucide-react';

export interface LoadingScreenProps {
  fullScreen?: boolean;
  variant?: 'fullscreen' | 'inline' | 'overlay' | 'card';
  text?: string;
  subtext?: string;
  progress?: number;
  compact?: boolean;
  className?: string;
  showLogo?: boolean;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  fullScreen = true,
  variant,
  text = 'Memuat Sesi Sistem...',
  subtext = 'Memverifikasi otorisasi, status akun, dan menyinkronkan data...',
  progress,
  compact = false,
  className = '',
  showLogo = true,
}) => {
  // Determine effective display mode
  const isFullScreen = variant === 'fullscreen' || (fullScreen && variant !== 'inline' && variant !== 'card' && variant !== 'overlay');
  const isOverlay = variant === 'overlay';
  const isInline = variant === 'inline' || variant === 'card' || (!isFullScreen && !isOverlay);

  // Full Screen / App Boot or Route Guard Loader
  if (isFullScreen) {
    return (
      <div 
        role="status"
        aria-live="polite"
        className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-slate-100 select-none overflow-hidden transition-all duration-300 ${className}`}
      >
        {/* Background Industrial Ambience */}
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-40 pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-600/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Center Animated Loader Card */}
        <div className="relative z-10 flex flex-col items-center max-w-sm mx-auto px-6 text-center">
          
          {/* Concentric Animated Radar & Rings */}
          <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
            {/* Outer Pulsing Wave Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 animate-ping opacity-60" />
            
            {/* Outer Rotating Segment Ring */}
            <div className="absolute inset-0 rounded-full border-2 border-dashed border-cyan-500/40 animate-spin [animation-duration:8s]" />
            
            {/* Middle Reverse Rotating Ring */}
            <div className="absolute inset-2 rounded-full border-2 border-t-blue-500 border-r-transparent border-b-cyan-400 border-l-transparent animate-spin [animation-direction:reverse] [animation-duration:3s]" />
            
            {/* Inner Core Shield & Icon */}
            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 border border-cyan-500/40 flex items-center justify-center shadow-xl shadow-cyan-500/10">
              <div className="relative flex items-center justify-center">
                <Anchor className="w-8 h-8 text-cyan-400 animate-pulse" />
                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-900" />
              </div>
            </div>
          </div>

          {/* Logo Brand Title */}
          {showLogo && (
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm font-black tracking-widest bg-gradient-to-r from-blue-400 via-cyan-300 to-white bg-clip-text text-transparent">
                NEXAPROJECT
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-300 border border-blue-500/30">
                SYSTEM
              </span>
            </div>
          )}

          {/* Dynamic Headline */}
          <h2 className="text-base font-bold text-white tracking-wide mb-1.5 flex items-center justify-center gap-1.5">
            <span>{text}</span>
          </h2>

          {/* Subtext explanation */}
          {subtext && (
            <p className="text-xs text-slate-400 leading-relaxed max-w-xs mb-5">
              {subtext}
            </p>
          )}

          {/* Progress Bar (Determinate or Indeterminate) */}
          <div className="w-56 h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50 shadow-inner relative">
            {typeof progress === 'number' ? (
              <div 
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            ) : (
              <div className="h-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent w-1/2 rounded-full animate-[shimmer_1.4s_infinite_linear] relative -left-1/2" 
                style={{
                  animation: 'indeterminateSlide 1.5s infinite ease-in-out'
                }}
              />
            )}
          </div>

          {/* Footer Status Indicators */}
          <div className="mt-5 flex items-center gap-4 text-[10px] text-slate-400 font-mono tracking-tight">
            <span className="inline-flex items-center gap-1">
              <Database className="w-3 h-3 text-cyan-400" />
              <span>FIRESTORE SYNC</span>
            </span>
            <span className="text-slate-600">•</span>
            <span className="inline-flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-blue-400" />
              <span>AUTH GUARD</span>
            </span>
          </div>

        </div>

        {/* Global Keyframe Helper */}
        <style dangerouslySetInnerHTML={{
          __html: `
            @keyframes indeterminateSlide {
              0% { transform: translateX(-100%); width: 30%; }
              50% { transform: translateX(150%); width: 60%; }
              100% { transform: translateX(350%); width: 30%; }
            }
          `
        }} />
      </div>
    );
  }

  // Overlay Mode (For Form submission, Modal processing, or Async operations)
  if (isOverlay) {
    return (
      <div 
        role="status"
        aria-live="polite"
        className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs select-none transition-all duration-200 ${className}`}
      >
        <div className="bg-slate-900 border border-slate-700/80 shadow-2xl rounded-2xl p-6 max-w-sm w-full mx-4 text-center text-slate-100 relative overflow-hidden">
          {/* Subtle top indicator bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-500 animate-pulse" />
          
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 text-cyan-400 flex items-center justify-center mx-auto mb-4">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
          </div>

          <h3 className="text-sm font-bold text-white mb-1">
            {text}
          </h3>

          {subtext && (
            <p className="text-xs text-slate-400 leading-relaxed">
              {subtext}
            </p>
          )}

          {typeof progress === 'number' && (
            <div className="mt-4 w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div 
                className="h-full bg-cyan-400 rounded-full transition-all duration-200"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Inline / Container Mode (For table loading, card sections, and view transitions)
  return (
    <div 
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 select-none ${className}`}
    >
      <div className={`relative flex items-center justify-center ${compact ? 'w-10 h-10 mb-2' : 'w-14 h-14 mb-3'}`}>
        <div className="absolute inset-0 rounded-full border-2 border-slate-200 dark:border-slate-700/60" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-600 dark:border-t-cyan-400 animate-spin" />
        <Loader2 className={`${compact ? 'w-4 h-4' : 'w-6 h-6'} text-blue-600 dark:text-cyan-400 animate-spin`} />
      </div>

      <div className="space-y-1 max-w-xs">
        <p className={`font-bold text-slate-800 dark:text-slate-200 ${compact ? 'text-xs' : 'text-sm'}`}>
          {text}
        </p>
        {subtext && (
          <p className={`text-slate-500 dark:text-slate-400 ${compact ? 'text-[10px]' : 'text-xs'}`}>
            {subtext}
          </p>
        )}
      </div>

      {typeof progress === 'number' && (
        <div className="mt-3 w-40 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-600 dark:bg-cyan-400 rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
