import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  ArrowRight, 
  Check, 
  AlertCircle,
  Download,
  Loader2
} from 'lucide-react';
import { employeeDb } from '../../services/employeeDb';
import { EmployeeRecord } from '../../types/employee';
import { useAuth } from '../../context/AuthContext';

interface ExcelImportCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExcelImportCenterModal: React.FC<ExcelImportCenterModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [parseResults, setParseResults] = useState<{
    validRows: Partial<EmployeeRecord>[];
    duplicateRows: { rowNumber: number; id: string; reason: string }[];
    invalidRows: { rowNumber: number; reason: string; data: Record<string, unknown> }[];
    totalRows: number;
  } | null>(null);

  const [importedCount, setImportedCount] = useState<number>(0);

  if (!isOpen) return null;

  const handleFileDrop = async (selectedFile: File) => {
    setErrorMessage(null);

    // Validate size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setErrorMessage('Ukuran file melebihi batas maksimal 10MB.');
      return;
    }

    // Validate extension
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'csv') {
      setErrorMessage('Format file harus berupa .xlsx atau .csv');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      // Step 2 & 3: Mapping & Validation
      const results = await employeeDb.parseAndValidateExcel(selectedFile);
      setParseResults(results);
      setStep(4); // Move directly to Preview before import
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal memproses file Excel.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCommitImport = async () => {
    if (!parseResults || parseResults.validRows.length === 0) return;

    setIsProcessing(true);
    try {
      const count = await employeeDb.commitImportedRows(parseResults.validRows, currentUser?.role);
      setImportedCount(count);
      setStep(6); // Success confirmation
      onSuccess();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal menyimpan data.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAll = () => {
    setStep(1);
    setFile(null);
    setParseResults(null);
    setErrorMessage(null);
    setImportedCount(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="w-full max-w-3xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600/10 text-emerald-600 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Excel Import Center — Data Karyawan
              </h3>
              <p className="text-[11px] text-slate-500">
                Alur verifikasi 6-tahap: Upload, Pemetaan, Validasi, Preview, Koreksi & Impor
              </p>
            </div>
          </div>
          <button
            onClick={() => { resetAll(); onClose(); }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Indicator strip */}
        <div className="grid grid-cols-4 border-b border-slate-200 dark:border-slate-800 text-[11px] bg-slate-50 dark:bg-slate-800/40 font-semibold text-center py-2">
          <div className={step === 1 ? 'text-blue-600 font-bold' : 'text-slate-400'}>
            1. Unggah File
          </div>
          <div className={step === 4 ? 'text-blue-600 font-bold' : 'text-slate-400'}>
            2. Hasil Pemeriksaan
          </div>
          <div className={step === 5 ? 'text-blue-600 font-bold' : 'text-slate-400'}>
            3. Laporan Error
          </div>
          <div className={step === 6 ? 'text-emerald-600 font-bold' : 'text-slate-400'}>
            4. Selesai Impor
          </div>
        </div>

        {/* Main Body */}
        <div className="p-6 overflow-y-auto flex-1">
          
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: Upload */}
          {step === 1 && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files?.[0]) handleFileDrop(e.dataTransfer.files[0]);
                }}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-2xl p-8 text-center transition flex flex-col items-center justify-center cursor-pointer bg-slate-50/50 dark:bg-slate-800/20"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.xlsx, .csv';
                  input.onchange = (e) => {
                    const f = (e.target as HTMLInputElement).files?.[0];
                    if (f) handleFileDrop(f);
                  };
                  input.click();
                }}
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                  Tarik & Lepas File Excel (.xlsx / .csv) di Sini
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-3">
                  Ukuran file maksimal 10MB per file. File akan diperiksa terlebih dahulu sebelum data disimpan.
                </p>
                <span className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg shadow-sm">
                  Pilih File dari Komputer
                </span>
              </div>

              {isProcessing && (
                <div className="flex items-center justify-center gap-2 text-xs text-slate-500 pt-3">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <span>Membaca dan memvalidasi struktur kolom Excel...</span>
                </div>
              )}
            </div>
          )}

          {/* STEP 4: Preview Before Import */}
          {step === 4 && parseResults && (
            <div className="space-y-4 text-xs">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20">
                  <p className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">Data Valid</p>
                  <p className="text-xl font-extrabold font-mono text-emerald-600">
                    {parseResults.validRows.length} Baris
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20">
                  <p className="text-[11px] font-semibold text-amber-800 dark:text-amber-300">Data Duplikat</p>
                  <p className="text-xl font-extrabold font-mono text-amber-600">
                    {parseResults.duplicateRows.length} Baris
                  </p>
                </div>

                <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20">
                  <p className="text-[11px] font-semibold text-rose-800 dark:text-rose-300">Data Bermasalah</p>
                  <p className="text-xl font-extrabold font-mono text-rose-600">
                    {parseResults.invalidRows.length} Baris
                  </p>
                </div>
              </div>

              {/* Valid Rows Preview Table */}
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">
                  Pratinjau Baris Siap Diimpor ({parseResults.validRows.length} baris):
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto max-h-56">
                  <table className="w-full text-left text-[11px]">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 font-bold border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-2">ID Karyawan</th>
                        <th className="p-2">Nama Lengkap</th>
                        <th className="p-2">Jabatan</th>
                        <th className="p-2">Departemen</th>
                        <th className="p-2">Upah/Gaji</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {parseResults.validRows.map((r, i) => (
                        <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                          <td className="p-2 font-mono font-bold text-blue-600">{r.employeeId}</td>
                          <td className="p-2 font-semibold">{r.fullName}</td>
                          <td className="p-2 text-slate-600 dark:text-slate-300">{r.position}</td>
                          <td className="p-2">{r.department}</td>
                          <td className="p-2 font-mono text-right">
                            Rp {Number(r.wage).toLocaleString('id-ID')} / {r.wageStatus}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Warning for duplicates or errors */}
              {(parseResults.duplicateRows.length > 0 || parseResults.invalidRows.length > 0) && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold text-amber-900 dark:text-amber-200">
                        Perhatian: Ditemukan {parseResults.duplicateRows.length + parseResults.invalidRows.length} baris yang tidak memenuhi syarat.
                      </p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300">
                        Baris yang bermasalah akan dilewati secara otomatis untuk mencegah kerusakan basis data.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep(5)}
                    className="px-2.5 py-1 text-[11px] font-semibold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 rounded-lg hover:underline whitespace-nowrap"
                  >
                    Lihat Rincian Error
                  </button>
                </div>
              )}

            </div>
          )}

          {/* STEP 5: Error Correction / Details */}
          {step === 5 && parseResults && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-rose-900 dark:text-rose-200">
                  Laporan Baris yang Gagal / Ditolak Sistem:
                </h4>
                <button
                  onClick={() => setStep(4)}
                  className="text-blue-600 hover:underline"
                >
                  Kembali ke Pratinjau
                </button>
              </div>

              <div className="border border-rose-200 dark:border-rose-900/60 rounded-xl overflow-x-auto max-h-64 p-3 space-y-2 bg-rose-50/20">
                {parseResults.duplicateRows.map((d, i) => (
                  <div key={`dup-${i}`} className="p-2 rounded bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-rose-600">Baris #{d.rowNumber}</span> · {d.reason}
                    </div>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Duplikat</span>
                  </div>
                ))}

                {parseResults.invalidRows.map((inv, i) => (
                  <div key={`inv-${i}`} className="p-2 rounded bg-white dark:bg-slate-800 border border-rose-200 dark:border-rose-900 flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-rose-600">Baris #{inv.rowNumber}</span> · {inv.reason}
                    </div>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded">Format Salah</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 6: Confirmation & Success */}
          {step === 6 && (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Impor Data Excel Berhasil!
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 max-w-sm mx-auto">
                Sebanyak <strong>{importedCount} data karyawan</strong> baru telah berhasil diverifikasi dan disimpan ke dalam sistem basis data.
              </p>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => { resetAll(); onClose(); }}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
          >
            {step === 6 ? 'Tutup' : 'Batal'}
          </button>

          {step === 4 && parseResults && (
            <button
              type="button"
              disabled={isProcessing || parseResults.validRows.length === 0}
              onClick={handleCommitImport}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menyimpan ke Database...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Konfirmasi & Impor {parseResults.validRows.length} Data Valid</span>
                </>
              )}
            </button>
          )}

          {step === 6 && (
            <button
              type="button"
              onClick={() => { resetAll(); onClose(); }}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
            >
              Selesai
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
