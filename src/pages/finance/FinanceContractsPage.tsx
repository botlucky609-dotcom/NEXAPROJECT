import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Download, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Shield, 
  Lock, 
  DollarSign, 
  ChevronRight,
  Anchor,
  Calendar,
  CreditCard,
  Building2,
  ExternalLink,
  X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../hooks/useRBAC';
import { useTheme } from '../../context/ThemeContext';
import { financeDb } from '../../services/financeDb';
import { projectDb } from '../../services/projectDb';
import { ShipyardContract, ContractMilestoneTerm, ContractBillingStatus } from '../../types/finance';

export const FinanceContractsPage: React.FC = () => {
  const { currentUser } = useAuth();
  // Strict RBAC Hook: Creator gets full authority; Admin & Karyawan adhere to Izin Akses Pengguna
  const { isCreator, canCreate, canEdit, canDelete, canDownload } = useRBAC('finance-contract');
  const userRole = currentUser?.role || 'karyawan';
  const { t, language } = useTheme();

  const [contracts, setContracts] = useState<ShipyardContract[]>(() => financeDb.getContracts());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  
  // Selected contract modal for milestone management
  const [selectedContract, setSelectedContract] = useState<ShipyardContract | null>(null);
  const [isNewContractModalOpen, setIsNewContractModalOpen] = useState(false);
  
  // Milestone edit modal
  const [editingMilestone, setEditingMilestone] = useState<{
    contract: ShipyardContract;
    term: ContractMilestoneTerm;
  } | null>(null);
  const [invoiceNumberInput, setInvoiceNumberInput] = useState('');
  const [paidDateInput, setPaidDateInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [targetStatus, setTargetStatus] = useState<'INVOICED' | 'PAID'>('INVOICED');

  // New Contract Form State
  const [newProjectCode, setNewProjectCode] = useState('');
  const [newShipName, setNewShipName] = useState('');
  const [newOwnerName, setNewOwnerName] = useState('');
  const [newVesselType, setNewVesselType] = useState('Bulk Carrier');
  const [newContractValue, setNewContractValue] = useState<number>(3000000000);
  const [newTaxPercent, setNewTaxPercent] = useState<number>(11);
  const [newTargetDate, setNewTargetDate] = useState('2026-11-30');
  const [newScope, setNewScope] = useState('');
  const [newSignedByClient, setNewSignedByClient] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const reloadData = () => {
    setContracts(financeDb.getContracts());
    if (selectedContract) {
      const refreshed = financeDb.getContractById(selectedContract.id);
      setSelectedContract(refreshed || null);
    }
  };

  const handleExportExcel = async () => {
    if (!canDownload) {
      setFeedbackMsg({ type: 'error', text: 'Akses Ditolak: Anda tidak memiliki otoritas untuk mengunduh portofolio kontrak.' });
      return;
    }
    try {
      const blob = await financeDb.exportContractsToExcel();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NEXAPROJECT_Kontrak_Galangan_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Gagal mengekspor file Excel kontrak.' });
    }
  };

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate && !canEdit) {
      setFeedbackMsg({ type: 'error', text: 'Akses Ditolak: Anda tidak memiliki otoritas untuk mendaftarkan kontrak baru.' });
      return;
    }
    if (!newShipName || !newOwnerName || newContractValue <= 0) {
      setFeedbackMsg({ type: 'error', text: 'Mohon lengkapi nama kapal, pemilik, dan nilai kontrak.' });
      return;
    }

    const res = financeDb.saveContract(
      {
        projectCode: newProjectCode || 'PRJ-2026-NEW',
        shipName: newShipName,
        ownerName: newOwnerName,
        vesselType: newVesselType,
        totalContractValue: Number(newContractValue),
        taxPercent: Number(newTaxPercent),
        completionTargetDate: newTargetDate,
        scopeOfWork: newScope,
        signedByClient: newSignedByClient || 'Perwakilan Resmi Pemilik Kapal',
      },
      userRole,
      currentUser?.email || ''
    );

    if (res.success) {
      setFeedbackMsg({ type: 'success', text: res.message });
      setIsNewContractModalOpen(false);
      reloadData();
      // Reset
      setNewShipName('');
      setNewOwnerName('');
      setNewScope('');
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  const handleUpdateMilestone = () => {
    if (!editingMilestone) return;

    financeDb.updateMilestoneStatus(
      editingMilestone.contract.id,
      editingMilestone.term.termNumber,
      targetStatus,
      invoiceNumberInput || undefined,
      paidDateInput || undefined,
      notesInput || undefined
    );

    setFeedbackMsg({ 
      type: 'success', 
      text: targetStatus === 'PAID' 
        ? `Termin ${editingMilestone.term.termNumber} berhasil ditandai LUNAS dan kas bertambah.` 
        : `Faktur penagihan ${invoiceNumberInput || 'resmi'} berhasil diterbitkan ke pemilik kapal.` 
    });

    setEditingMilestone(null);
    reloadData();
  };

  // Filtered List
  const filteredContracts = contracts.filter(c => {
    const matchesSearch = 
      c.contractNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.shipName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.ownerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.projectCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalContractPortfolio = contracts.reduce((sum, c) => sum + c.grandTotalValue, 0);
  const totalPaidPortfolio = contracts.reduce((sum, c) => sum + c.totalPaid, 0);
  const totalReceivables = contracts.reduce((sum, c) => sum + c.balanceRemaining, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Feedback Banner */}
      {feedbackMsg && (
        <div className={`p-4 rounded-2xl flex items-center justify-between text-sm shadow-xs ${
          feedbackMsg.type === 'success' 
            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800'
            : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-800'
        }`}>
          <div className="flex items-center gap-2.5">
            {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <span className="font-semibold">{feedbackMsg.text}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'en' ? 'Shipyard Commercial Contracts & Billing' : 'Kontrak Komersial & Termin Penagihan Galangan'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {language === 'en' 
                  ? 'Official ship repair & building contracts, milestone terms, tax PPN 11%, and verified billing'
                  : 'Manajemen kontrak reparasi/bangun baru kapal, termin penagihan progres, PPN 11%, dan verifikasi lunas'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {canDownload && (
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition shadow-xs"
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t('att.btn.export_att', 'Ekspor Kontrak (.xlsx)')}</span>
            </button>
          )}

          {(canCreate || canEdit) && (
            <button
              onClick={() => setIsNewContractModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'en' ? 'Register New Contract' : 'Daftarkan Kontrak Baru'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Total Contract Portfolio' : 'Total Nilai Portofolio Kontrak'}
            </span>
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatRupiah(totalContractPortfolio)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {contracts.length} {language === 'en' ? 'Active registered contracts' : 'Kontrak kapal terdaftar resmi'}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Total Received Payments' : 'Total Kas Termin Masuk (Lunas)'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatRupiah(totalPaidPortfolio)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {((totalPaidPortfolio / (totalContractPortfolio || 1)) * 100).toFixed(1)}% {language === 'en' ? 'of contract value realized' : 'telah terbayar penuh'}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Outstanding Receivables' : 'Sisa Piutang / Belum Ditagih'}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
            {formatRupiah(totalReceivables)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {language === 'en' ? 'Invoiced & future milestone terms' : 'Termin berjalan & garansi retensi'}
          </p>
        </div>
      </div>

      {/* Creator Privilege Alert */}
      <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
        <Shield className="w-5 h-5 text-amber-600 shrink-0" />
        <div className="text-xs text-amber-800 dark:text-amber-200">
          <span className="font-bold">
            {language === 'en' ? 'Supreme Creator Protection Active: ' : 'Proteksi Otoritas Finansial Creator Aktif: '}
          </span>
          {language === 'en'
            ? 'Only Creator (Muhammad Andri) holds supreme authority to sign official commercial contracts and modify value margins.'
            : 'Hanya Creator (Muhammad Andri) yang berhak menandatangani nilai kontrak induk galangan dan mengunci margin komersial.'}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'en' ? 'Search contract number, vessel, owner...' : 'Cari nomor kontrak, nama kapal, pemilik...'}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['ALL', 'PROSES_TERMIN', 'LUNAS', 'DRAFT'] as (ContractBillingStatus | 'ALL')[]).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {st === 'ALL' ? (language === 'en' ? 'All Contracts' : 'Semua Kontrak') : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Contracts Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">No Kontrak & Kapal</th>
                <th className="py-3 px-4">Pemilik (Owner)</th>
                <th className="py-3 px-4 text-right">Nilai Kontrak (DPP)</th>
                <th className="py-3 px-4 text-right">Total (+PPN 11%)</th>
                <th className="py-3 px-4 text-right">Terbayar</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi & Termin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredContracts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    {language === 'en' ? 'No contracts found matching criteria.' : 'Tidak ada kontrak galangan yang cocok dengan kriteria pencarian.'}
                  </td>
                </tr>
              ) : (
                filteredContracts.map((c) => {
                  const paidPercentage = c.grandTotalValue > 0 ? (c.totalPaid / c.grandTotalValue) * 100 : 0;
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-teal-100 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 flex items-center justify-center shrink-0">
                            <Anchor className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-extrabold text-slate-900 dark:text-white block">
                              {c.shipName}
                            </span>
                            <span className="text-[11px] font-mono text-teal-600 dark:text-teal-400">
                              {c.contractNumber} ({c.projectCode})
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 dark:text-slate-200">
                          {c.ownerName}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {c.vesselType} • Selesai: {c.completionTargetDate}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-slate-800 dark:text-slate-200">
                        {formatRupiah(c.totalContractValue)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                        {formatRupiah(c.grandTotalValue)}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatRupiah(c.totalPaid)}
                        </div>
                        <div className="w-24 ml-auto bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div 
                            className="bg-emerald-500 h-full rounded-full transition-all" 
                            style={{ width: `${Math.min(100, paidPercentage)}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                          c.status === 'LUNAS' 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                            : c.status === 'PROSES_TERMIN'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                            : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {c.status.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedContract(c)}
                          className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 dark:hover:bg-teal-900/50 text-teal-700 dark:text-teal-300 font-bold text-xs transition flex items-center justify-center gap-1 mx-auto"
                        >
                          <span>Kelola Termin</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contract Detail & Milestone Modal */}
      {selectedContract && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center">
                  <Anchor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    {selectedContract.shipName} ({selectedContract.contractNumber})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedContract.ownerName} • Nilai Kontrak Total: {formatRupiah(selectedContract.grandTotalValue)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedContract(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1 text-xs sm:text-sm">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">DPP Nilai Kontrak</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{formatRupiah(selectedContract.totalContractValue)}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <span className="text-[10px] text-slate-400 uppercase font-bold">PPN 11%</span>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">{formatRupiah(selectedContract.taxAmount)}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold">Total Lunas Terbayar</span>
                  <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatRupiah(selectedContract.totalPaid)}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-50/60 dark:bg-amber-950/30">
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 uppercase font-bold">Sisa Piutang Termin</span>
                  <p className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">{formatRupiah(selectedContract.balanceRemaining)}</p>
                </div>
              </div>

              {/* Signatures & Scope */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 space-y-2">
                <div className="flex flex-col sm:flex-row justify-between gap-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-semibold">Penandatangan Galangan:</span>
                    <p className="font-bold text-teal-700 dark:text-teal-300">{selectedContract.signedByYard}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 font-semibold">Penandatangan Pemilik:</span>
                    <p className="font-bold text-slate-800 dark:text-slate-200">{selectedContract.signedByClient}</p>
                  </div>
                </div>
                <div className="text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
                  <span className="text-slate-400 font-semibold">Ruang Lingkup Pekerjaan (Scope of Work):</span>
                  <p className="text-slate-700 dark:text-slate-300 mt-0.5">{selectedContract.scopeOfWork}</p>
                </div>
              </div>

              {/* Milestone Terms Timeline */}
              <div>
                <h4 className="font-black text-sm uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-teal-600" />
                  <span>Jadwal & Status Penagihan Termin (Milestone Terms)</span>
                </h4>

                <div className="space-y-3">
                  {selectedContract.terms.map((term) => (
                    <div 
                      key={term.termNumber} 
                      className={`p-4 rounded-2xl border transition ${
                        term.status === 'PAID'
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                          : term.status === 'INVOICED'
                          ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-300 dark:border-blue-800'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                              {term.termName}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              term.status === 'PAID'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                                : term.status === 'INVOICED'
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300'
                                : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                            }`}>
                              {term.status}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                            <span>Bobot: <strong>{term.percentage}%</strong></span>
                            <span>Nominal: <strong className="text-teal-600 dark:text-teal-400">{formatRupiah(term.amount)}</strong></span>
                            {term.invoiceNumber && <span>No Faktur: <strong>{term.invoiceNumber}</strong></span>}
                            {term.paidDate && <span>Tgl Bayar: <strong>{term.paidDate}</strong></span>}
                          </div>
                          {term.notes && (
                            <p className="text-xs italic text-slate-600 dark:text-slate-400 mt-1">
                              Catatan: {term.notes}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {canEdit && (
                            <>
                              {term.status === 'PENDING' && (
                                <button
                                  onClick={() => {
                                    setEditingMilestone({ contract: selectedContract, term });
                                    setTargetStatus('INVOICED');
                                    setInvoiceNumberInput(`INV-2026-${Math.floor(100 + Math.random() * 900)}`);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs"
                                >
                                  Terbitkan Faktur
                                </button>
                              )}

                              {term.status === 'INVOICED' && (
                                <button
                                  onClick={() => {
                                    setEditingMilestone({ contract: selectedContract, term });
                                    setTargetStatus('PAID');
                                    setPaidDateInput(new Date().toISOString().split('T')[0]);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
                                >
                                  Konfirmasi Lunas (Bayar)
                                </button>
                              )}
                            </>
                          )}

                          {term.status === 'PAID' && (
                            <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-bold px-2 py-1 bg-emerald-100 dark:bg-emerald-950/70 rounded-lg">
                              <CheckCircle2 className="w-4 h-4" />
                              Dana Masuk
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedContract(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Milestone Status Modal */}
      {editingMilestone && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-black text-base text-slate-900 dark:text-white">
                {targetStatus === 'PAID' ? 'Konfirmasi Pelunasan Termin' : 'Penerbitan Faktur Penagihan'}
              </h3>
              <button onClick={() => setEditingMilestone(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              {editingMilestone.term.termName} — Nilai: <strong>{formatRupiah(editingMilestone.term.amount)}</strong>
            </p>

            <div className="space-y-3">
              {targetStatus === 'INVOICED' ? (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nomor Faktur Tagihan (Invoice Number)
                  </label>
                  <input
                    type="text"
                    value={invoiceNumberInput}
                    onChange={(e) => setInvoiceNumberInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono"
                    placeholder="Contoh: INV-2026-105"
                  />
                </div>
              ) : (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tanggal Penerimaan Dana Lunas
                  </label>
                  <input
                    type="date"
                    value={paidDateInput}
                    onChange={(e) => setPaidDateInput(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Catatan Bukti Transfer / Kliring Bank
                </label>
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  placeholder="Contoh: Dana kliring via Rekening Mandiri Galangan Ref #9921"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setEditingMilestone(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleUpdateMilestone}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
              >
                Simpan & Perbarui
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Contract Modal */}
      {isNewContractModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  {language === 'en' ? 'Register Shipyard Contract' : 'Pendaftaran Kontrak Komersial Kapal'}
                </h3>
              </div>
              <button onClick={() => setIsNewContractModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContract} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nama Kapal
                  </label>
                  <input
                    type="text"
                    required
                    value={newShipName}
                    onChange={(e) => setNewShipName(e.target.value)}
                    placeholder="Contoh: MV NUSANTARA GLORY"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Kode Proyek (Terkait)
                  </label>
                  <input
                    type="text"
                    value={newProjectCode}
                    onChange={(e) => setNewProjectCode(e.target.value)}
                    placeholder="Contoh: PRJ-2026-004"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Pemilik Kapal (Ship Owner)
                  </label>
                  <input
                    type="text"
                    required
                    value={newOwnerName}
                    onChange={(e) => setNewOwnerName(e.target.value)}
                    placeholder="Contoh: PT Pelayaran Bahari Mandiri"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tipe Kapal
                  </label>
                  <select
                    value={newVesselType}
                    onChange={(e) => setNewVesselType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  >
                    <option value="Bulk Carrier">Bulk Carrier</option>
                    <option value="Oil / Chemical Tanker">Oil / Chemical Tanker</option>
                    <option value="Container Ship">Container Ship</option>
                    <option value="Tugboat / Kapal Tunda">Tugboat / Kapal Tunda</option>
                    <option value="Barge / Tongkang">Barge / Tongkang</option>
                    <option value="Offshore Supply Vessel">Offshore Supply Vessel (AHTS)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nilai Kontrak DPP (Rupiah)
                  </label>
                  <input
                    type="number"
                    required
                    min={1000000}
                    step={1000000}
                    value={newContractValue}
                    onChange={(e) => setNewContractValue(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Target Tanggal Selesai
                  </label>
                  <input
                    type="date"
                    required
                    value={newTargetDate}
                    onChange={(e) => setNewTargetDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nama Perwakilan Penandatangan Owner
                </label>
                <input
                  type="text"
                  value={newSignedByClient}
                  onChange={(e) => setNewSignedByClient(e.target.value)}
                  placeholder="Contoh: Bpk. Ir. Gunawan Wibisono (General Manager Armada)"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Ringkasan Ruang Lingkup Pekerjaan (Scope of Work)
                </label>
                <textarea
                  value={newScope}
                  onChange={(e) => setNewScope(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  placeholder="Uraian pekerjaan lambung, mesin, perpipaan, dan sertifikasi kelas"
                />
              </div>

              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 text-xs">
                <span className="font-bold text-teal-800 dark:text-teal-200">Kalkulasi Otomatis:</span>
                <p className="text-teal-700 dark:text-teal-300 mt-0.5">
                  PPN 11%: {formatRupiah((newContractValue * 11) / 100)} | Grand Total: {formatRupiah(newContractValue + (newContractValue * 11) / 100)}
                </p>
                <p className="text-[11px] text-teal-600 dark:text-teal-400 mt-1">
                  Termin standar 4 tahap (30% DP, 40% Mid-Progress, 25% Undocking/Sea Trial, 5% Retensi) akan dibuat otomatis.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewContractModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold"
                >
                  Daftarkan Kontrak
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
