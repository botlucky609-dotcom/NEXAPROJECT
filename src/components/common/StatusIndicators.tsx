import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, Inbox, Loader2 } from 'lucide-react';

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Memuat data sistem...' }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-3" />
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{message}</p>
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}> = ({ title, description, actionText, onAction }) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
        <Inbox className="w-6 h-6 text-slate-400" />
      </div>
      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4">{description}</p>
      {actionText && onAction && (
        <button
          onClick={onAction}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
}> = ({ title = 'Terjadi Kesalahan Sistem', message, onRetry }) => {
  return (
    <div className="p-6 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20 text-center">
      <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/40 text-rose-600 mx-auto flex items-center justify-center mb-3">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200 mb-1">{title}</h4>
      <p className="text-xs text-rose-700 dark:text-rose-300 max-w-md mx-auto mb-4">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-3.5 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition"
        >
          Coba Lagi
        </button>
      )}
    </div>
  );
};

export const AccessDeniedState: React.FC<{
  moduleName?: string;
  onBackToDashboard?: () => void;
}> = ({ moduleName = 'Halaman Ini', onBackToDashboard }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center">
      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 ring-1 ring-amber-500/20">
        <ShieldAlert className="w-7 h-7" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Akses Ditolak (403 Forbidden)</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
        Peran akun Anda saat ini tidak memiliki otorisasi untuk mengakses {moduleName}. Hak akses ini diatur secara ketat oleh Administrator dan Manajemen sesuai matriks RBAC sistem.
      </p>
      {onBackToDashboard && (
        <button
          onClick={onBackToDashboard}
          className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
        >
          Kembali ke Dashboard Utama
        </button>
      )}
    </div>
  );
};
