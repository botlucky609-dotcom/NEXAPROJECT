import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckSquare, 
  Users, 
  FolderKanban, 
  ShoppingBag, 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { AppView } from '../types/navigation';
import { LoadingScreen } from '../components/common/LoadingScreen';
import { dbService } from '../services/db';
import { employeeDb } from '../services/employeeDb';
import { projectDb } from '../services/projectDb';
import { warehouseDb } from '../services/warehouseDb';
import { taskAnnouncementDb } from '../services/taskAnnouncementDb';

export const DashboardPreviewPage: React.FC<{ onNavigate: (view: AppView) => void }> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { t, language } = useTheme();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Settle async metrics on mount
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, []);

  // Current real-time date state
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Live active announcements & field work order tasks from taskAnnouncementDb
  const announcements = taskAnnouncementDb.getActiveAnnouncements();
  const tasks = taskAnnouncementDb.getTasks().slice(0, 4);

  // Employee stats from live service
  const allEmployees = employeeDb.getEmployees();
  const activeEmployees = allEmployees.filter((e) => e.workStatus === 'AKTIF').length;
  const inactiveEmployees = allEmployees.filter((e) => e.workStatus !== 'AKTIF').length;
  const totalEmployees = allEmployees.length;

  // Project stats from live service
  const allProjects = projectDb.getProjects();
  const completedProjects = allProjects.filter((p) => p.status === 'completed').length;
  const runningProjects = allProjects.filter((p) => p.status === 'in_progress').length;
  const totalProjects = allProjects.length;

  // Live Pending Material Requisition Orders (Tahap 4)
  const pendingOrders = warehouseDb.getPendingOrders();

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNamesId = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthNamesEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const dayNamesId = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const monthNames = language === 'en' ? monthNamesEn : monthNamesId;
  const dayNames = language === 'en' ? dayNamesEn : dayNamesId;

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Header Welcome Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
              <span>NEXAPROJECT</span>
              <span>/</span>
              <span>{t('nav.dashboard')}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
              {t('dash.welcome')}, {currentUser?.fullName || 'User'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('common.role')}: <strong className="text-blue-600 dark:text-blue-400 uppercase">{currentUser?.role}</strong> · {t('dash.online_synced')}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsLoading(true);
                setTimeout(() => setIsLoading(false), 300);
              }}
              title="Perbarui Metrik"
              className="p-2 text-slate-500 hover:text-blue-600 dark:hover:text-cyan-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <Clock className="w-4 h-4" />
            </button>
            {(currentUser?.role === 'creator' || currentUser?.role === 'admin') && (
              <button
                onClick={() => onNavigate('users-waitlist')}
                className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
              >
                {t('dash.btn.waitlist')}
              </button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="py-12">
            <LoadingScreen 
              variant="inline" 
              text="Menyinkronkan Metrik Operasional Galangan..." 
              subtext="Mengambil ringkasan proyek kapal, status logistik gudang, dan absensi lapangan..."
            />
          </div>
        ) : (
          <>
        {/* 1. INFORMASI PENGUMUMAN DARI HALAMAN PENGUMUMAN */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('dash.block1.title')}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t('dash.block1.desc')}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('announcements')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1 transition"
            >
              <span>{language === 'en' ? 'View All Bulletins' : 'Buka Halaman Pengumuman & K3'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.map((ann) => (
              <div
                key={ann.id}
                onClick={() => onNavigate('announcements')}
                className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs space-y-2 cursor-pointer hover:border-blue-400 dark:hover:border-blue-700 transition"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    ann.priority === 'CRITICAL' || ann.priority === 'HIGH'
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                  }`}>
                    {ann.priority}
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">{t('dash.valid_until')}: {ann.validUntil}</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-xs">{ann.title}</h3>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px] line-clamp-2">{ann.content}</p>
                <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-between">
                  <span>Target: {ann.targetDepartment}</span>
                  <span className="text-blue-600 dark:text-blue-400">{ann.issuedBy}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2. INFORMASI TUGAS DARI HALAMAN TUGAS */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <CheckSquare className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('dash.block2.title')}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t('dash.block2.desc')}
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('tasks')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 flex items-center gap-1 transition"
            >
              <span>{language === 'en' ? 'View Field Tasks Dispatcher' : 'Buka Halaman Tugas Lapangan'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tasks.map((tsk) => (
              <div
                key={tsk.id}
                onClick={() => onNavigate('tasks')}
                className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs space-y-2.5 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-700 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-blue-600 dark:text-blue-400 font-bold">
                    {tsk.taskNumber} · {tsk.shipName}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    tsk.status === 'COMPLETED'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : tsk.status === 'QC_INSPECTION'
                      ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300'
                      : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                  }`}>
                    {tsk.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="font-bold text-slate-900 dark:text-white text-xs leading-snug line-clamp-1">{tsk.title}</p>
                <div>
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>{t('dash.progress_label')}:</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{tsk.progressPercentage}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        tsk.progressPercentage >= 100 ? 'bg-emerald-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${tsk.progressPercentage}%` }}
                    />
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 font-mono flex justify-between">
                  <span>Lokasi: {tsk.location}</span>
                  <span>Target: {tsk.dueDate}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 3 & 4. SIDE-BY-SIDE STATS: KARYAWAN (KIRI) & PROYEK (KANAN) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* 3. KARYAWAN AKTIF, TIDAK AKTIF, TOTAL (KIRI MENURUN) */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('dash.block3.title')}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t('dash.block3.desc')}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
                <div className="text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">{t('dash.stat.active_emp')}</p>
                  <p className="text-[10px] text-slate-500">{t('dash.stat.working_today')}</p>
                </div>
                <span className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {activeEmployees}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20">
                <div className="text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">{t('dash.stat.inactive_emp')}</p>
                  <p className="text-[10px] text-slate-500">{t('dash.stat.contract_ended')}</p>
                </div>
                <span className="text-xl font-extrabold font-mono text-slate-500 dark:text-slate-400">
                  {inactiveEmployees}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-blue-200/60 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20">
                <div className="text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">{t('dash.stat.total_emp')}</p>
                  <p className="text-[10px] text-slate-500">{t('dash.stat.all_db')}</p>
                </div>
                <span className="text-xl font-extrabold font-mono text-blue-600 dark:text-blue-400">
                  {totalEmployees}
                </span>
              </div>
            </div>

            {/* Quick module action links */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => onNavigate('employees-data')}
                className="px-2.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition text-center"
              >
                {t('menu.employees.data')}
              </button>
              <button
                onClick={() => onNavigate('employees-profile')}
                className="px-2.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition text-center"
              >
                {t('menu.employees.profile')}
              </button>
              <button
                onClick={() => onNavigate('employees-photos')}
                className="px-2.5 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition text-center"
              >
                {t('menu.employees.photos')}
              </button>
            </div>
          </section>

          {/* 4. PROYEK SELESAI, PROYEK BERJALAN, TOTAL PROYEK (KANAN MENURUN) */}
          <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-600/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <FolderKanban className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('dash.block4.title')}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t('dash.block4.desc')}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
                <div className="text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">{t('dash.stat.completed_proj')}</p>
                  <p className="text-[10px] text-slate-500">{t('dash.stat.handover')}</p>
                </div>
                <span className="text-xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                  {completedProjects}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-amber-200/60 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20">
                <div className="text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">{t('dash.stat.running_proj')}</p>
                  <p className="text-[10px] text-slate-500">{t('dash.stat.docking_now')}</p>
                </div>
                <span className="text-xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
                  {runningProjects}
                </span>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl border border-indigo-200/60 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20">
                <div className="text-xs">
                  <p className="font-bold text-slate-900 dark:text-white">{t('dash.stat.total_proj')}</p>
                  <p className="text-[10px] text-slate-500">{t('dash.stat.all_track')}</p>
                </div>
                <span className="text-xl font-extrabold font-mono text-indigo-600 dark:text-indigo-400">
                  {totalProjects}
                </span>
              </div>
            </div>

            {/* Quick Project action links */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => onNavigate('projects-list')}
                className="px-2 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition text-center"
              >
                {t('menu.projects.list')}
              </button>
              <button
                onClick={() => onNavigate('projects-supervisors')}
                className="px-2 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition text-center"
              >
                {t('menu.projects.supervisors')}
              </button>
              <button
                onClick={() => onNavigate('projects-progress')}
                className="px-2 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-700 dark:text-slate-300 text-[11px] font-bold transition text-center"
              >
                {t('menu.projects.progress')}
              </button>
              <button
                onClick={() => onNavigate('projects-cost')}
                className="px-2 py-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-600 text-[11px] font-bold transition text-center flex items-center justify-center gap-1"
              >
                <span>{t('menu.projects.cost')}</span>
                {currentUser?.role === 'creator' && <span className="text-[9px]">👑</span>}
              </button>
            </div>
          </section>

        </div>

        {/* 5. ORDER BARANG --> STATUS PENGAJUAN (HANYA YANG STATUS MENUNGGU) */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-orange-600/10 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{t('dash.block5.title')}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
                    {pendingOrders.length} {language === 'en' ? 'Pending' : 'Menunggu'}
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t('dash.block5.desc')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('warehouse-stock')}
                className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
              >
                {t('menu.warehouse.inventory')}
              </button>
              <button
                onClick={() => onNavigate('warehouse-order')}
                className="px-3 py-1.5 text-xs font-bold rounded-xl bg-orange-600 hover:bg-orange-700 text-white shadow-xs transition"
              >
                {t('menu.warehouse.orders')}
              </button>
            </div>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
              {language === 'en' ? 'No pending material requisitions at this time.' : 'Tidak ada pengajuan barang yang berstatus menunggu saat ini.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingOrders.map((ord) => (
                <div
                  key={ord.id}
                  onClick={() => onNavigate('warehouse-order')}
                  className="p-4 rounded-xl border border-amber-200/70 dark:border-amber-900/50 bg-amber-50/20 dark:bg-amber-950/10 text-xs space-y-2 hover:border-orange-500/60 cursor-pointer transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-extrabold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 uppercase">
                      {ord.orderNumber} · {ord.status}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">Dibutuhkan: {ord.dateNeeded}</span>
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">
                    {ord.items.map((i) => `${i.itemName} (${i.qty} ${i.unit})`).join(', ')}
                  </h3>
                  <div className="flex items-center justify-between pt-1 border-t border-amber-200/40 dark:border-amber-900/40 text-[11px]">
                    <div className="text-slate-600 dark:text-slate-300">
                      {t('dash.applicant')}: <span className="font-bold text-slate-900 dark:text-white">{ord.requesterName}</span>
                    </div>
                    <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
                      Rp {ord.totalEstimatedCost.toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                    <span>Proyek: {ord.projectCode} · {ord.shipName}</span>
                    {ord.isCreatorApprovalRequired && (
                      <span className="text-amber-600 font-bold">
                        {currentUser?.role === 'creator' ? '🛡️ Wajib Creator' : '🛡️ Otorisasi Khusus'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 6. KALENDER 1 BULAN REAL TIME */}
        <section className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-600/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('dash.block6.title')} ({monthNames[month]} {year})
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {t('dash.block6.desc')}
                </p>
              </div>
            </div>

            <div className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-3 py-1 rounded-lg border border-blue-200 dark:border-blue-900">
              {currentDate.toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="overflow-x-auto">
            <div className="min-w-[320px]">
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] mb-2">
                {dayNames.map((d, i) => (
                  <div 
                    key={d} 
                    className={`py-1.5 rounded-lg ${
                      i === 0 ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/30' : i === 6 ? 'text-blue-500 bg-blue-50 dark:bg-blue-950/30' : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1 text-xs">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDayIndex }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-10 rounded-lg bg-slate-50/50 dark:bg-slate-800/20" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dayOfWeek = (firstDayIndex + i) % 7;
                  const isToday =
                    dayNum === currentDate.getDate() &&
                    month === new Date().getMonth() &&
                    year === new Date().getFullYear();

                  const isSunday = dayOfWeek === 0;
                  const isSaturday = dayOfWeek === 6;

                  return (
                    <div
                      key={`day-${dayNum}`}
                      className={`h-10 rounded-lg flex flex-col items-center justify-center font-mono transition ${
                        isToday
                          ? 'bg-blue-600 text-white font-extrabold shadow-sm scale-105 z-10'
                          : 'border border-slate-100 dark:border-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className={`text-xs ${
                        !isToday && isSunday ? 'text-rose-600 font-bold' : !isToday && isSaturday ? 'text-blue-600 font-bold' : ''
                      }`}>
                        {dayNum}
                      </span>
                      {isToday && (
                        <span className="text-[9px] uppercase font-bold text-blue-200">
                          {language === 'en' ? 'Today' : 'Hari Ini'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      </>
    )}

      </div>
    </div>
  );
};
