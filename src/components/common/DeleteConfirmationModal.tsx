import React from 'react';
import { Trash2, AlertTriangle, ShieldAlert, Loader2, X, Database } from 'lucide-react';

export interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  itemName: string;
  itemCode?: string;
  itemType: string;
  cascadeDetails?: string[];
  isLoading?: boolean;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Konfirmasi Penghapusan Permanen',
  itemName,
  itemCode,
  itemType,
  cascadeDetails = [],
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div 
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900/60 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Header with Creator Privilege Banner */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-white/15 backdrop-blur-md">
                <Trash2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-black/25 text-amber-200 border border-amber-300/30">
                  <ShieldAlert className="w-3 h-3 text-amber-300" />
                  Otoritas Khusus Creator
                </span>
                <h3 className="text-base font-bold text-white mt-0.5">
                  {title}
                </h3>
              </div>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition disabled:opacity-50"
              aria-label="Tutup dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Target Item Card */}
          <div className="p-4 rounded-xl bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide">
                  {itemType} yang akan dihapus:
                </p>
                <p className="text-base font-bold text-slate-900 dark:text-white">
                  {itemName}
                </p>
                {itemCode && (
                  <p className="text-xs font-mono text-slate-600 dark:text-slate-400">
                    Kode / ID: <span className="font-semibold text-red-700 dark:text-red-300">{itemCode}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Cascade Notification Box */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <Database className="w-4 h-4 text-amber-500" />
              <span>Pembersihan Otomatis Data Terkait (Cascade Deletion):</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Sistem akan menjalankan <strong className="text-slate-700 dark:text-slate-200">Firestore Batch Write</strong> secara real-time untuk menghapus dokumen ini serta membersihkan seluruh data turunan berikut:
            </p>
            {cascadeDetails && cascadeDetails.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700 dark:text-slate-300 pl-1 font-medium">
                {cascadeDetails.map((detail, idx) => (
                  <li key={idx} className="leading-snug">{detail}</li>
                ))}
              </ul>
            ) : (
              <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-700 dark:text-slate-300 pl-1 font-medium">
                <li>Dokumen master di koleksi Firestore utama</li>
                <li>Rekam transaksi, riwayat presensi, dan referensi turunan terkait</li>
                <li>Pembaruan instan pada memori lokal dan cache seluruh perangkat</li>
              </ul>
            )}
          </div>

          <div className="text-[11px] text-red-600 dark:text-red-400 bg-red-500/10 dark:bg-red-500/5 px-3 py-2 rounded-lg border border-red-500/20 font-medium">
            ⚠️ <strong>Perhatian:</strong> Tindakan ini bersifat permanen dan tidak dapat dibatalkan (Irreversible).
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 transition disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 active:bg-red-800 shadow-md shadow-red-600/30 transition disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menghapus Data & Turunan...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Permanen</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
