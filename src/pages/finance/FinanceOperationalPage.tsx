import React, { useState } from 'react';
import { 
  Receipt, 
  Plus, 
  Download, 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Shield, 
  Lock, 
  DollarSign, 
  Filter,
  X,
  CreditCard,
  Building,
  Fuel,
  Zap,
  Wrench,
  ShieldAlert,
  FileCheck2,
  FileSpreadsheet,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../hooks/useRBAC';
import { useTheme } from '../../context/ThemeContext';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { financeDb } from '../../services/financeDb';
import { OperationalExpense, ExpenseCategory } from '../../types/finance';

const CATEGORY_LABELS: Record<ExpenseCategory, { labelId: string; labelEn: string; icon: any }> = {
  DOCK_RENTAL: { labelId: 'Sewa Graving Dock & Slipway', labelEn: 'Drydock & Slipway Rental', icon: Building },
  ELECTRICITY_WATER: { labelId: 'Listrik Shore Power & Air', labelEn: 'Shore Power & Water Utility', icon: Zap },
  FUEL_GENSET: { labelId: 'BBM Solar Genset & Crane', labelEn: 'Fuel & Genset Oil', icon: Fuel },
  NDT_CERTIFICATION: { labelId: 'Uji NDT & Sertifikasi BKI/ABS', labelEn: 'NDT & Class Certification', icon: FileCheck2 },
  SUB_CONTRACTOR: { labelId: 'Jasa Subkontraktor Galangan', labelEn: 'Subcontractor Services', icon: Wrench },
  SAFETY_CONSUMABLES: { labelId: 'APD K3 & Perlengkapan Kerja', labelEn: 'PPE & Safety Consumables', icon: ShieldAlert },
  MATERIAL_PURCHASE: { labelId: 'Pembelian Material Tambahan', labelEn: 'Material Direct Purchase', icon: Receipt },
  OVERHEAD_OFFICE: { labelId: 'Beban Operasional Kantor', labelEn: 'Yard Overhead & Utilities', icon: CreditCard },
  LABOR_PAYROLL: { labelId: 'Payroll & Upah Lembur', labelEn: 'Labor & Overtime Payroll', icon: DollarSign }
};

export const FinanceOperationalPage: React.FC = () => {
  const { currentUser } = useAuth();
  // Strict RBAC Hook: Creator gets 100% full authority; Admin & Karyawan adhere to Izin Akses Pengguna
  const { isCreator, canCreate, canEdit, canDelete, canDownload } = useRBAC('finance-operational');
  const userRole = currentUser?.role || 'karyawan';
  const { t, language } = useTheme();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmittingVoucher, setIsSubmittingVoucher] = useState(false);
  const [expenses, setExpenses] = useState<OperationalExpense[]>(() => financeDb.getExpenses());

  React.useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 300);
    return () => clearTimeout(timer);
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [rejectingExpense, setRejectingExpense] = useState<OperationalExpense | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New Voucher Form
  const [newCategory, setNewCategory] = useState<ExpenseCategory>('DOCK_RENTAL');
  const [newDescription, setNewDescription] = useState('');
  const [newAmount, setNewAmount] = useState<number>(25000000);
  const [newRecipient, setNewRecipient] = useState('');
  const [newPaymentMethod, setNewPaymentMethod] = useState<'TRANSFER_BANK' | 'PETTY_CASH' | 'GIRO'>('TRANSFER_BANK');
  const [newReceiptNumber, setNewReceiptNumber] = useState('');
  const [newShipName, setNewShipName] = useState('MV OCEANIC LEADER');
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  const reloadData = () => {
    setExpenses(financeDb.getExpenses());
  };

  const handleExportExcel = async () => {
    if (!canDownload) {
      setFeedbackMsg({ type: 'error', text: 'Akses Ditolak: Anda tidak memiliki otoritas untuk mengunduh buku kas operasional.' });
      return;
    }
    try {
      const blob = await financeDb.exportExpensesToExcel();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NEXAPROJECT_Buku_Kas_Operasional_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setFeedbackMsg({ type: 'error', text: 'Gagal mengekspor buku kas pengeluaran.' });
    }
  };

  const handleSubmitVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate && !canEdit) {
      setFeedbackMsg({ type: 'error', text: 'Akses Ditolak: Anda tidak memiliki izin untuk mengajukan voucher kas operasional.' });
      return;
    }
    if (!newDescription || !newRecipient || newAmount <= 0) {
      setFeedbackMsg({ type: 'error', text: 'Harap lengkapi uraian pengeluaran, vendor penerima, dan nominal rupiah.' });
      return;
    }

    setIsSubmittingVoucher(true);
    try {
      await new Promise((r) => setTimeout(r, 450));
      financeDb.submitExpense(
        {
          date: newDate,
          category: newCategory,
          description: newDescription,
          amount: Number(newAmount),
          paymentMethod: newPaymentMethod,
          recipient: newRecipient,
          receiptNumber: newReceiptNumber || undefined,
          shipName: newShipName || undefined,
        },
        currentUser?.fullName || 'STAFF OPERASIONAL'
      );

      setFeedbackMsg({ 
        type: 'success', 
        text: `Voucher pengeluaran sebesar ${formatRupiah(newAmount)} berhasil diajukan untuk verifikasi.` 
      });

      setIsSubmitModalOpen(false);
      reloadData();
      setNewDescription('');
      setNewRecipient('');
      setNewReceiptNumber('');
    } finally {
      setIsSubmittingVoucher(false);
    }
  };

  const handleVerify = (exp: OperationalExpense) => {
    financeDb.verifyExpense(exp.id, currentUser?.fullName || 'STAFF FINANCE');
    setFeedbackMsg({ type: 'success', text: `Voucher ${exp.voucherNumber} berhasil diverifikasi.` });
    reloadData();
  };

  const handleApprove = (exp: OperationalExpense) => {
    const res = financeDb.approveExpense(
      exp.id,
      userRole,
      currentUser?.email || '',
      currentUser?.fullName || 'CREATOR'
    );

    if (res.success) {
      setFeedbackMsg({ type: 'success', text: res.message });
      reloadData();
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  const handleMarkPaid = (exp: OperationalExpense) => {
    const res = financeDb.markExpensePaid(exp.id, userRole);
    if (res.success) {
      setFeedbackMsg({ type: 'success', text: res.message });
      reloadData();
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  const handleReject = () => {
    if (!rejectingExpense) return;
    const res = financeDb.rejectExpense(
      rejectingExpense.id,
      rejectionReasonInput || 'Pengeluaran tidak sesuai RAB atau dokumen tidak lengkap',
      userRole,
      currentUser?.email || ''
    );
    if (res.success) {
      setFeedbackMsg({ type: 'success', text: res.message });
      setRejectingExpense(null);
      reloadData();
    } else {
      setFeedbackMsg({ type: 'error', text: res.message });
    }
  };

  // Filtered
  const filteredExpenses = expenses.filter(e => {
    const matchesSearch = 
      e.voucherNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (e.shipName && e.shipName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'ALL' || e.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const totalPaidExpenses = expenses
    .filter(e => e.status === 'PAID')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalPendingApproval = expenses
    .filter(e => e.status === 'SUBMITTED' || e.status === 'VERIFIED')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalApprovedWaitingDisburse = expenses
    .filter(e => e.status === 'APPROVED')
    .reduce((sum, e) => sum + e.amount, 0);

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
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'en' ? 'Shipyard Operational Expenses & Vouchers' : 'Biaya Operasional & Voucher Kas Galangan'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {language === 'en' 
                  ? 'Drydock rental, shore power electricity, genset diesel, NDT certification, sub-contractors, and 2-tier approval'
                  : 'Sewa dok, listrik shore power, BBM genset, sertifikasi NDT BKI/ABS, subkontraktor, dan persetujuan 2 tingkat'}
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
              <span>{language === 'en' ? 'Export Cash Book (.xlsx)' : 'Ekspor Buku Kas (.xlsx)'}</span>
            </button>
          )}

          {(canCreate || canEdit) && (
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'en' ? 'Submit Expense Voucher' : 'Ajukan Voucher Pengeluaran'}</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Total Expenses Disbursed (Paid)' : 'Total Kas Terbayar (Lunas)'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {formatRupiah(totalPaidExpenses)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {expenses.filter(e => e.status === 'PAID').length} {language === 'en' ? 'Vouchers settled in cash ledger' : 'Voucher telah dicairkan kas'}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Approved (Waiting Cash Out)' : 'Disetujui (Menunggu Pencairan)'}
            </span>
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tight">
            {formatRupiah(totalApprovedWaitingDisburse)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {expenses.filter(e => e.status === 'APPROVED').length} {language === 'en' ? 'Vouchers ready for bank transfer / cash' : 'Voucher siap transfer / kasir'}
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Pending Verification & Sign-off' : 'Menunggu Verifikasi & Persetujuan'}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
            {formatRupiah(totalPendingApproval)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            {expenses.filter(e => e.status === 'SUBMITTED' || e.status === 'VERIFIED').length} {language === 'en' ? 'Vouchers under review' : 'Pengajuan dalam tinjauan'}
          </p>
        </div>
      </div>

      {/* Creator High-Budget Alert Notice */}
      <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center gap-3">
        <Shield className="w-5 h-5 text-amber-600 shrink-0" />
        <div className="text-xs text-amber-800 dark:text-amber-200">
          <span className="font-bold">
            {language === 'en' ? 'Two-Tier Expense Approval Defense: ' : 'Ketentuan Otoritas Approval Pengeluaran: '}
          </span>
          {language === 'en'
            ? 'Expenses under Rp 50.000.000 can be approved by Supervisor/Admin. Expenses exceeding Rp 50.000.000 strictly require supreme approval from CREATOR (Muhammad Andri).'
            : 'Pengeluaran di bawah Rp 50.000.000 dapat disetujui Supervisor/Admin. Pengeluaran di atas Rp 50.000.000 strictly memerlukan persetujuan langsung dari CREATOR (Muhammad Andri).'}
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'en' ? 'Search voucher, description, vendor...' : 'Cari nomor voucher, uraian, penerima/vendor...'}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">{language === 'en' ? 'All Categories' : 'Semua Kategori Beban'}</option>
            {Object.keys(CATEGORY_LABELS).map((cat) => (
              <option key={cat} value={cat}>
                {language === 'en' ? CATEGORY_LABELS[cat as ExpenseCategory].labelEn : CATEGORY_LABELS[cat as ExpenseCategory].labelId}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
          >
            <option value="ALL">{language === 'en' ? 'All Status' : 'Semua Status'}</option>
            <option value="SUBMITTED">SUBMITTED (Diajukan)</option>
            <option value="VERIFIED">VERIFIED (Diverifikasi)</option>
            <option value="APPROVED">APPROVED (Disetujui)</option>
            <option value="PAID">PAID (Lunas Kas)</option>
            <option value="REJECTED">REJECTED (Ditolak)</option>
          </select>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">No Voucher & Tgl</th>
                <th className="py-3 px-4">Kategori & Proyek</th>
                <th className="py-3 px-4">Uraian & Vendor</th>
                <th className="py-3 px-4 text-right">Nominal (Rp)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Otoritas & Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center">
                    <LoadingScreen
                      variant="inline"
                      compact={true}
                      text="Memuat Buku Kas Operasional & Voucher..."
                      subtext="Menyinkronkan transaksi pengeluaran galangan kapal..."
                    />
                  </td>
                </tr>
              ) : filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    {language === 'en' ? 'No operational vouchers found.' : 'Tidak ada voucher kas operasional yang cocok dengan filter.'}
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp) => {
                  const isHighBudget = exp.amount > 50000000;
                  const catConfig = CATEGORY_LABELS[exp.category] || CATEGORY_LABELS.OVERHEAD_OFFICE;
                  const IconComp = catConfig.icon;

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-bold text-amber-700 dark:text-amber-400 block">
                          {exp.voucherNumber}
                        </span>
                        <span className="text-[11px] text-slate-500">
                          {exp.date} • {exp.paymentMethod.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                          <IconComp className="w-3.5 h-3.5 text-amber-600" />
                          <span>{language === 'en' ? catConfig.labelEn : catConfig.labelId}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {exp.shipName || 'Beban Umum Galangan'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="font-medium text-slate-900 dark:text-white line-clamp-2">
                          {exp.description}
                        </p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Vendor/Penerima: <strong>{exp.recipient}</strong> {exp.receiptNumber && `(${exp.receiptNumber})`}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <span className="font-black text-slate-900 dark:text-white block">
                          {formatRupiah(exp.amount)}
                        </span>
                        {isHighBudget && (
                          <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300">
                            🛡️ High Budget &gt; 50M
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase ${
                          exp.status === 'PAID'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                            : exp.status === 'APPROVED'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300'
                            : exp.status === 'VERIFIED'
                            ? 'bg-sky-100 text-sky-800 dark:bg-sky-950/70 dark:text-sky-300'
                            : exp.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                        }`}>
                          {exp.status}
                        </span>
                        {exp.approvedBy && (
                          <span className="block text-[10px] text-slate-400 mt-0.5">
                            acc: {exp.approvedBy}
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {canEdit ? (
                            <>
                              {/* Step 1: Verification */}
                              {exp.status === 'SUBMITTED' && (
                                <button
                                  onClick={() => handleVerify(exp)}
                                  className="px-2.5 py-1 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] transition shadow-xs"
                                >
                                  Verifikasi
                                </button>
                              )}

                              {/* Step 2: Approval */}
                              {exp.status === 'VERIFIED' && (
                                <>
                                  {isHighBudget && !isCreator ? (
                                    <button
                                      disabled
                                      className="px-2.5 py-1 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 font-bold text-[11px] cursor-not-allowed flex items-center gap-1"
                                      title="Khusus Creator: Pengeluaran > Rp 50Jt memerlukan persetujuan khusus"
                                    >
                                      <Lock className="w-3 h-3 text-amber-500" />
                                      <span>Creator Only</span>
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleApprove(exp)}
                                      className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition shadow-xs flex items-center gap-1"
                                    >
                                      <CheckCircle2 className="w-3 h-3" />
                                      <span>Setujui</span>
                                    </button>
                                  )}

                                  <button
                                    onClick={() => setRejectingExpense(exp)}
                                    className="px-2 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold text-[11px] transition"
                                  >
                                    Tolak
                                  </button>
                                </>
                              )}

                              {/* Step 3: Cash Disbursement */}
                              {exp.status === 'APPROVED' && (
                                <button
                                  onClick={() => handleMarkPaid(exp)}
                                  className="px-2.5 py-1 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] transition shadow-xs"
                                >
                                  Cairkan Kas (Lunas)
                                </button>
                              )}
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-semibold">Hanya Lihat</span>
                          )}

                          {exp.status === 'PAID' && (
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Lunas Kasir
                            </span>
                          )}

                          {exp.status === 'REJECTED' && (
                            <span className="text-[10px] text-rose-500 italic max-w-[120px] truncate" title={exp.rejectionReason}>
                              {exp.rejectionReason || 'Ditolak'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Voucher Modal */}
      {isSubmitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-amber-600" />
                <h3 className="font-black text-base text-slate-900 dark:text-white">
                  {language === 'en' ? 'Submit Operational Expense Voucher' : 'Pengajuan Voucher Pengeluaran Galangan'}
                </h3>
              </div>
              <button onClick={() => setIsSubmitModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitVoucher} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Kategori Pengeluaran
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ExpenseCategory)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium"
                  >
                    {Object.keys(CATEGORY_LABELS).map((cat) => (
                      <option key={cat} value={cat}>
                        {language === 'en' ? CATEGORY_LABELS[cat as ExpenseCategory].labelEn : CATEGORY_LABELS[cat as ExpenseCategory].labelId}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Tanggal Pengeluaran
                  </label>
                  <input
                    type="date"
                    required
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nominal Biaya (Rp)
                  </label>
                  <input
                    type="number"
                    required
                    min={10000}
                    step={10000}
                    value={newAmount}
                    onChange={(e) => setNewAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-bold text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Metode Pembayaran
                  </label>
                  <select
                    value={newPaymentMethod}
                    onChange={(e) => setNewPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value="TRANSFER_BANK">Transfer Bank Resmi</option>
                    <option value="PETTY_CASH">Kas Kecil (Petty Cash)</option>
                    <option value="GIRO">Bilyet Giro Galangan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Penerima / Vendor Rekanan
                  </label>
                  <input
                    type="text"
                    required
                    value={newRecipient}
                    onChange={(e) => setNewRecipient(e.target.value)}
                    placeholder="Contoh: PT Pelindo / CV Logistik"
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Alokasi Proyek Kapal
                  </label>
                  <select
                    value={newShipName}
                    onChange={(e) => setNewShipName(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 font-medium"
                  >
                    <option value="MV OCEANIC LEADER">MV OCEANIC LEADER (PRJ-2026-001)</option>
                    <option value="MT PACIFIC CHEMIST">MT PACIFIC CHEMIST (PRJ-2026-002)</option>
                    <option value="TB SAMUDERA PERKASA VIII">TB SAMUDERA PERKASA VIII (PRJ-2026-003)</option>
                    <option value="Beban Umum Galangan">Beban Umum Galangan (Overhead)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Nomor Referensi Nota / Invoice / Kuitansi
                </label>
                <input
                  type="text"
                  value={newReceiptNumber}
                  onChange={(e) => setNewReceiptNumber(e.target.value)}
                  placeholder="Contoh: KWT-PLN-8821 atau NOTA-291"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Uraian Lengkap Kebutuhan Biaya
                </label>
                <textarea
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                  placeholder="Rincian peruntukan biaya operasional lapangan..."
                />
              </div>

              {newAmount > 50000000 && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs">
                  <span className="font-bold text-rose-800 dark:text-rose-200">🛡️ Otoritas High Budget (&gt; Rp 50.000.000):</span>
                  <p className="text-rose-700 dark:text-rose-300 mt-0.5">
                    Pengajuan nominal ini akan memerlukan otorisasi persetujuan final langsung dari Creator (Muhammad Andri).
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsSubmitModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingVoucher}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:pointer-events-none text-white text-xs font-bold flex items-center gap-2"
                >
                  {isSubmittingVoucher && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmittingVoucher ? 'Memproses Pengajuan...' : 'Ajukan Voucher'}</span>
                </button>
              </div>
            </form>

            {/* Overlay Loader during Voucher Submission */}
            {isSubmittingVoucher && (
              <LoadingScreen
                variant="overlay"
                text="Memproses Pengajuan Voucher Kas..."
                subtext="Menyinkronkan transaksi ke buku kas dan server sistem..."
              />
            )}
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {rejectingExpense && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-black text-base text-rose-600">
                Penolakan Voucher Pengeluaran
              </h3>
              <button onClick={() => setRejectingExpense(null)} className="p-1 text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Voucher <strong>{rejectingExpense.voucherNumber}</strong> ({formatRupiah(rejectingExpense.amount)})
            </p>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Alasan Penolakan Resmi
              </label>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700"
                placeholder="Tuliskan catatan alasan penolakan, kekurangan nota, atau ketidaksesuaian anggaran..."
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => setRejectingExpense(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
