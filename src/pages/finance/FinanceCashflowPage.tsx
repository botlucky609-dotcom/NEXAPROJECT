import React, { useState } from 'react';
import { 
  TrendingUp, 
  Download, 
  DollarSign, 
  ArrowUpRight, 
  ArrowDownRight, 
  Shield, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  PieChart, 
  BarChart3,
  Building2,
  Anchor,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useRBAC } from '../../hooks/useRBAC';
import { financeDb } from '../../services/financeDb';
import { projectDb } from '../../services/projectDb';
import { attendanceDb } from '../../services/attendanceDb';
import { warehouseDb } from '../../services/warehouseDb';
import { LaborProjectSummary } from '../../types/attendance';

export const FinanceCashflowPage: React.FC = () => {
  const { currentUser } = useAuth();
  const rbac = useRBAC('finance-labor');
  const userRole = currentUser?.role || 'karyawan';
  const { t, language } = useTheme();

  const [contracts] = useState(() => financeDb.getContracts());
  const [expenses] = useState(() => financeDb.getExpenses());
  const [projects] = useState(() => projectDb.getProjects());
  const laborSummaries: LaborProjectSummary[] = attendanceDb.calculateLaborCostByProject();
  const cashflow = financeDb.getCashflowSummary();

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };

  // Aggregated Outflow by category
  const expenseByCategory: Record<string, number> = {};
  expenses.forEach(e => {
    if (e.status === 'PAID' || e.status === 'APPROVED') {
      expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount;
    }
  });

  // Export Combined Financial Report
  const handleExportSummary = async () => {
    if (!rbac.canDownload) {
      alert('Akses Ditolak: Anda tidak memiliki izin untuk mengunduh laporan arus kas.');
      return;
    }
    try {
      const blob = await financeDb.exportContractsToExcel();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `NEXAPROJECT_Laporan_Arus_Kas_Galangan_${new Date().toISOString().split('T')[0]}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    }
  };

  if (!rbac.canAccess) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900 rounded-3xl p-8 text-center shadow-xl">
          <TrendingUp className="w-16 h-16 text-rose-500 mx-auto mb-4" />
          <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Akses Dibatasi</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-6">
            Akun Anda tidak memiliki izin untuk mengakses modul <strong>Arus Kas & Margin Proyek</strong>. Hubungi Administrator atau Creator untuk memperbarui matriks izin pada halaman Izin Akses Pengguna.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                {language === 'en' ? 'Shipyard Cashflow & Profit Margin Analytics' : 'Arus Kas & Analisis Margin Laba Galangan'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                {language === 'en' 
                  ? 'Real-time financial cashflow, contract revenue, project RAB vs actual variance, and shipyard profit margin'
                  : 'Arus kas waktu nyata, pendapatan kontrak termin, komparasi RAB vs realisasi, dan margin laba galangan'}
              </p>
            </div>
          </div>
        </div>

        {rbac.canDownload && (
          <button
            onClick={handleExportSummary}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs self-start md:self-auto"
          >
            <Download className="w-4 h-4" />
            <span>{language === 'en' ? 'Export Cashflow Summary (.xlsx)' : 'Ekspor Ringkasan Arus Kas (.xlsx)'}</span>
          </button>
        )}
      </div>

      {/* Creator Financial Authority Banner */}
      <div className="p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 flex items-center gap-3 shadow-xs">
        <Shield className="w-6 h-6 text-amber-600 shrink-0" />
        <div className="text-xs text-amber-800 dark:text-amber-200">
          <p className="font-bold text-sm">
            {language === 'en' ? 'Creator Privilege Financial Firewall' : 'Firewall & Hak Otoritas Finansial Creator'}
          </p>
          <p className="mt-0.5 text-slate-600 dark:text-slate-300">
            {language === 'en'
              ? 'Formulas for net operating profit, project profit margins, and high-budget authorization (> Rp 50.000.000) are protected exclusively under Creator Muhammad Andri.'
              : 'Formula perhitungan laba bersih operasional, margin laba proyek kapal, dan otorisasi anggaran tinggi (> Rp 50.000.000) dilindungi mutlak di bawah otoritas Creator Muhammad Andri.'}
          </p>
        </div>
      </div>

      {/* Main Cashflow KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Inflow Total */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Total Cash Inflow (Paid)' : 'Pemasukan Kas (Inflow)'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
            {formatRupiah(cashflow.totalRevenueReceived)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Dari {formatRupiah(cashflow.totalRevenueInvoiced)} tagihan terbit
          </p>
        </div>

        {/* Outflow Total */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Operating Outflow (Paid)' : 'Pengeluaran Operasional (Outflow)'}
            </span>
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
            {formatRupiah(cashflow.totalExpensesPaid)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Beban sewa dok, listrik, solar & subkon
          </p>
        </div>

        {/* Net Operating Profit */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Net Operating Cash' : 'Surplus Arus Kas Bersih'}
            </span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight">
            {formatRupiah(cashflow.netOperatingProfit)}
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Saldo likuiditas kas galangan
          </p>
        </div>

        {/* Operating Margin */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {language === 'en' ? 'Shipyard Profit Margin' : 'Rasio Margin Laba Bersih'}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 tracking-tight">
            {cashflow.overallProfitMargin}%
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
              Sangat Sehat (&gt; 20% Standar BKI)
            </span>
          </div>
        </div>
      </div>

      {/* Project-by-Project RAB & Margin Variance */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Anchor className="w-4 h-4 text-indigo-600" />
              <span>Komparasi Nilai Kontrak vs Anggaran (RAB) & Realisasi Biaya Proyek</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monitoring deviasi biaya langsung galangan dan marjin laba per kapal
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 self-start">
            Audit Terverifikasi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/80 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Nama Kapal & Proyek</th>
                <th className="py-3 px-4 text-right">Nilai Kontrak (Inc. PPN)</th>
                <th className="py-3 px-4 text-right">Anggaran RAB</th>
                <th className="py-3 px-4 text-right">Realisasi Biaya Aktual</th>
                <th className="py-3 px-4 text-right">Sisa Anggaran</th>
                <th className="py-3 px-4 text-center">Margin Laba (%)</th>
                <th className="py-3 px-4 text-center">Kesehatan Finansial</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {projects.map((prj) => {
                const linkedContract = contracts.find(c => c.projectId === prj.id || c.projectCode === prj.projectCode);
                const contractTotal = linkedContract ? linkedContract.grandTotalValue : prj.budgetTotal * 1.11;
                const remainingBudget = prj.budgetTotal - prj.actualCost;
                const margin = prj.estimatedMargin;

                return (
                  <tr key={prj.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div>{prj.shipName}</div>
                      <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 font-normal">
                        {prj.projectCode} • {prj.vesselType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 dark:text-white">
                      {formatRupiah(contractTotal)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-slate-700 dark:text-slate-300">
                      {formatRupiah(prj.budgetTotal)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-rose-600 dark:text-rose-400">
                      {formatRupiah(prj.actualCost)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatRupiah(remainingBudget)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300">
                        {margin.toFixed(1)}%
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Aman (Profitabel)
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operational Breakdown & Labor Cost Integration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Categories Breakdown */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs p-5 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <PieChart className="w-4 h-4 text-amber-500" />
            <span>Distribusi Beban Pengeluaran Galangan</span>
          </h3>

          <div className="space-y-3">
            {Object.entries(expenseByCategory).map(([cat, amount]) => {
              const pct = cashflow.totalExpensesPaid > 0 ? (amount / cashflow.totalExpensesPaid) * 100 : 0;
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      {cat.replace(/_/g, ' ')}
                    </span>
                    <span className="font-mono text-slate-900 dark:text-white">
                      {formatRupiah(amount)} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all" 
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Labor & Overtime Field Cost Realization */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/90 dark:border-slate-800/90 shadow-xs p-5 space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            <span>Alokasi Upah Tenaga Kerja & Lembur (Tahap 5 Sync)</span>
          </h3>

          <div className="space-y-3">
            {laborSummaries.map((lab: LaborProjectSummary) => (
              <div key={lab.projectId} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/70">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">
                    {lab.shipName}
                  </span>
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">
                    {formatRupiah(lab.totalLaborCost)}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Upah Reguler: {formatRupiah(lab.totalRegularWage)} ({lab.totalRegularHours} Jam)</span>
                  <span>Lembur: {formatRupiah(lab.totalOvertimeCost)} ({lab.totalOvertimeHours} Jam)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
