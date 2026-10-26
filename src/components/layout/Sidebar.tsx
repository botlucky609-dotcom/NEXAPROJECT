import React, { useState } from 'react';
import { 
  Home, 
  LayoutDashboard, 
  Users, 
  UserCheck, 
  Camera, 
  Ship, 
  HardHat, 
  Activity, 
  DollarSign, 
  HelpCircle, 
  ShieldCheck, 
  Lock, 
  ChevronRight, 
  ChevronDown, 
  Menu, 
  X, 
  Globe, 
  Sun, 
  Moon, 
  Eye, 
  LogOut, 
  Download, 
  ShieldAlert,
  Package,
  FileText,
  Clock,
  Calculator,
  Flame,
  Receipt,
  TrendingUp,
  Bell,
  CheckSquare,
  PanelLeftClose,
  PanelLeftOpen,
  Wifi,
  WifiOff,
  FileSpreadsheet,
  Table,
  Sliders,
  Key
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { AppView } from '../../types/navigation';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { AppLogo } from '../common/AppLogo';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  isOpen: boolean;
  onToggle: () => void;
  isOnline: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  isOpen,
  onToggle,
  isOnline,
}) => {
  const { currentUser, isAuthenticated, logout, canAccessModule } = useAuth();
  const { theme, setTheme, language, setLanguage, t } = useTheme();

  // Collapsible sub-accordions
  const [employeesOpen, setEmployeesOpen] = useState(true);
  const [projectsOpen, setProjectsOpen] = useState(true);
  const [warehouseOpen, setWarehouseOpen] = useState(true);
  const [attendanceOpen, setAttendanceOpen] = useState(true);
  const [financeOpen, setFinanceOpen] = useState(true);
  const [hseOpen, setHseOpen] = useState(true);

  const isCreator = currentUser?.role === 'creator' || 
    currentUser?.email === 'muhammad.andri0605@gmail.com' || 
    currentUser?.email === 'ronalpaman@gmail.com' || 
    currentUser?.email === 'creator@nexaproject.com';
  const isPrivileged = isCreator || currentUser?.role === 'admin';
  const isPending = !!currentUser && currentUser.status === 'pending' && !isCreator;

  const isModuleVisible = (view: AppView): boolean => {
    if (!isAuthenticated || isPending) return view === 'landing' || view === 'support' || view === 'pending-approval';
    if (isCreator) return true;
    return canAccessModule(view);
  };

  const handleNav = (view: AppView) => {
    onNavigate(view);
    // On mobile (< 1024px), close sidebar after navigation
    if (window.innerWidth < 1024) {
      onToggle();
    }
  };

  const navItemClass = (view: AppView) => {
    const isActive = currentView === view;
    return `w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
      isActive
        ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
    }`;
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && (
        <div 
          onClick={onToggle}
          className="lg:hidden fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200/90 dark:border-slate-800/90 transition-all duration-300 ease-in-out ${
          isOpen ? 'w-72 translate-x-0' : '-translate-x-full lg:translate-x-0 lg:w-20'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
          <button
            onClick={() => handleNav(isAuthenticated ? 'dashboard' : 'landing')}
            className="flex items-center gap-3 text-left focus:outline-hidden"
          >
            <AppLogo size="md" showWordmark={isOpen} />
          </button>

          {/* Desktop Collapse / Expand Toggle */}
          <button
            onClick={onToggle}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={language === 'en' ? (isOpen ? 'Collapse Sidebar' : 'Expand Sidebar') : (isOpen ? 'Kecilkan Bilah Samping' : 'Perluas Bilah Samping')}
            aria-label="Toggle Sidebar"
          >
            {isOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={onToggle}
            className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            aria-label="Close Sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Card & Creator Protection Shield */}
        {isOpen && isAuthenticated && currentUser && (
          <div className="p-3 mx-3 my-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                {currentUser.fullName ? currentUser.fullName.charAt(0) : 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {currentUser.fullName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                    isCreator 
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                      : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                  }`}>
                    {currentUser.role}
                  </span>
                  {isCreator && (
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5" title={t('role.creator_protected_desc')}>
                      <ShieldCheck className="w-3 h-3 text-amber-500" />
                      <span>Protected</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
          
          {/* GROUP 1: UTAMA */}
          <div>
            {isOpen && (
              <p className="px-3 pb-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                {t('sidebar.group.main')}
              </p>
            )}
            <div className="space-y-1">
              <button
                onClick={() => handleNav('landing')}
                className={navItemClass('landing')}
                title={t('nav.home')}
              >
                <div className="flex items-center gap-2.5">
                  <Home className="w-4 h-4 shrink-0" />
                  {isOpen && <span>{t('nav.home')}</span>}
                </div>
              </button>

              {isPending ? (
                <button
                  onClick={() => handleNav('pending-approval')}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    currentView === 'pending-approval'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-amber-400 bg-amber-500/10 border border-amber-500/30'
                  }`}
                  title="Menunggu Persetujuan Akun"
                >
                  <div className="flex items-center gap-2.5">
                    <Clock className="w-4 h-4 shrink-0 text-amber-400 animate-pulse" />
                    {isOpen && <span>Status: Menunggu Persetujuan</span>}
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => handleNav('dashboard')}
                  className={navItemClass('dashboard')}
                  title={t('nav.dashboard')}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutDashboard className="w-4 h-4 shrink-0" />
                    {isOpen && <span>{t('nav.dashboard')}</span>}
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* GROUP 2: MODUL KARYAWAN (TAHAP 2) */}
          {isAuthenticated && !isPending && (
            <div>
              {isOpen ? (
                <button
                  onClick={() => setEmployeesOpen(!employeesOpen)}
                  className="w-full flex items-center justify-between px-3 pb-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  <span>{t('sidebar.group.employees')}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${employeesOpen ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
              )}

              {(employeesOpen || !isOpen) && (
                <div className="space-y-1">
                  <button
                    onClick={() => handleNav('employees-data')}
                    className={navItemClass('employees-data')}
                    title={t('menu.employees.data')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Users className="w-4 h-4 shrink-0 text-blue-500" />
                      {isOpen && <span>{t('menu.employees.data')}</span>}
                    </div>
                  </button>

                  <button
                    onClick={() => handleNav('employees-profile')}
                    className={navItemClass('employees-profile')}
                    title={t('menu.employees.profile')}
                  >
                    <div className="flex items-center gap-2.5">
                      <UserCheck className="w-4 h-4 shrink-0 text-indigo-500" />
                      {isOpen && <span>{t('menu.employees.profile')}</span>}
                    </div>
                  </button>

                  <button
                    onClick={() => handleNav('employees-photos')}
                    className={navItemClass('employees-photos')}
                    title={t('menu.employees.photos')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Camera className="w-4 h-4 shrink-0 text-emerald-500" />
                      {isOpen && <span>{t('menu.employees.photos')}</span>}
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* GROUP 3: MODUL PROYEK KAPAL (TAHAP 3) */}
          {isAuthenticated && !isPending && (
            <div>
              {isOpen ? (
                <button
                  onClick={() => setProjectsOpen(!projectsOpen)}
                  className="w-full flex items-center justify-between px-3 pb-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  <span>{t('sidebar.group.projects')}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${projectsOpen ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
              )}

              {(projectsOpen || !isOpen) && (
                <div className="space-y-1">
                  <button
                    onClick={() => handleNav('projects-list')}
                    className={navItemClass('projects-list')}
                    title={t('menu.projects.list')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Ship className="w-4 h-4 shrink-0 text-sky-500" />
                      {isOpen && <span>{t('menu.projects.list')}</span>}
                    </div>
                  </button>

                  <button
                    onClick={() => handleNav('projects-supervisors')}
                    className={navItemClass('projects-supervisors')}
                    title={t('menu.projects.supervisors')}
                  >
                    <div className="flex items-center gap-2.5">
                      <HardHat className="w-4 h-4 shrink-0 text-amber-500" />
                      {isOpen && <span>{t('menu.projects.supervisors')}</span>}
                    </div>
                  </button>

                  <button
                    onClick={() => handleNav('projects-progress')}
                    className={navItemClass('projects-progress')}
                    title={t('menu.projects.progress')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Activity className="w-4 h-4 shrink-0 text-emerald-500" />
                      {isOpen && <span>{t('menu.projects.progress')}</span>}
                    </div>
                  </button>

                  {/* BIAYA PROYEK - KHUSUS CREATOR */}
                  <button
                    onClick={() => handleNav('projects-cost')}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      currentView === 'projects-cost'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : isCreator
                        ? 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                        : 'text-slate-400 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                    title={isCreator ? t('menu.projects.cost') : 'Biaya Proyek'}
                  >
                    <div className="flex items-center gap-2.5">
                      <DollarSign className={`w-4 h-4 shrink-0 ${isCreator ? 'text-amber-500' : 'text-slate-400'}`} />
                      {isOpen && <span>{isCreator ? t('menu.projects.cost') : 'Biaya Proyek'}</span>}
                    </div>
                    {isOpen && !isCreator && (
                      <span title="Akses Terbatas: Memerlukan Otorisasi Khusus">
                        <Lock className="w-3.5 h-3.5 text-slate-400" />
                      </span>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* GROUP 4: MODUL GUDANG & MATERIAL (TAHAP 4) */}
          {isAuthenticated && !isPending && (
            <div>
              {isOpen ? (
                <button
                  onClick={() => setWarehouseOpen(!warehouseOpen)}
                  className="w-full flex items-center justify-between px-3 pb-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  <span>{t('sidebar.group.warehouse')}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${warehouseOpen ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
              )}

              {(warehouseOpen || !isOpen) && (
                <div className="space-y-1">
                  <button
                    onClick={() => handleNav('warehouse-stock')}
                    className={navItemClass('warehouse-stock')}
                    title={t('menu.warehouse.inventory')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Package className="w-4 h-4 shrink-0 text-sky-500" />
                      {isOpen && <span>{t('menu.warehouse.inventory')}</span>}
                    </div>
                  </button>

                  <button
                    onClick={() => handleNav('warehouse-order')}
                    className={navItemClass('warehouse-order')}
                    title={t('menu.warehouse.orders')}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 shrink-0 text-amber-500" />
                      {isOpen && <span>{t('menu.warehouse.orders')}</span>}
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* GROUP 5: MODUL PRESENSI & LEMBUR (TAHAP 5) */}
          {isAuthenticated && !isPending && (
            <div>
              {isOpen ? (
                <button
                  onClick={() => setAttendanceOpen(!attendanceOpen)}
                  className="w-full flex items-center justify-between px-3 pb-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  <span>{t('sidebar.group.attendance')}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${attendanceOpen ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
              )}

              {(attendanceOpen || !isOpen) && (
                <div className="space-y-1">
                  {/* 1. Form Time Sheet */}
                  <button
                    onClick={() => handleNav('attendance-timesheet')}
                    className={navItemClass('attendance-timesheet')}
                    title={t('menu.attendance.timesheet')}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet className="w-4 h-4 shrink-0 text-sky-500" />
                      {isOpen && <span>{t('menu.attendance.timesheet')}</span>}
                    </div>
                  </button>

                  {/* 2. Form Over time */}
                  <button
                    onClick={() => handleNav('attendance-overtime')}
                    className={navItemClass('attendance-overtime')}
                    title={t('menu.attendance.overtime')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 shrink-0 text-amber-500" />
                      {isOpen && <span>{t('menu.attendance.overtime')}</span>}
                    </div>
                  </button>

                  {/* 3. Form Night Shift */}
                  <button
                    onClick={() => handleNav('attendance-nightshift')}
                    className={navItemClass('attendance-nightshift')}
                    title={t('menu.attendance.nightshift')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Moon className="w-4 h-4 shrink-0 text-indigo-500" />
                      {isOpen && <span>{t('menu.attendance.nightshift')}</span>}
                    </div>
                  </button>

                  {/* 4. Kalkulasi Waktu */}
                  <button
                    onClick={() => handleNav('attendance-time-calc')}
                    className={navItemClass('attendance-time-calc')}
                    title={t('menu.attendance.time_calc')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Calculator className="w-4 h-4 shrink-0 text-emerald-500" />
                      {isOpen && <span>{t('menu.attendance.time_calc')}</span>}
                    </div>
                  </button>

                  {/* 5. Kalkulasi Proyek */}
                  <button
                    onClick={() => handleNav('attendance-project-calc')}
                    className={navItemClass('attendance-project-calc')}
                    title={t('menu.attendance.project_calc')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Ship className="w-4 h-4 shrink-0 text-teal-500" />
                      {isOpen && <span>{t('menu.attendance.project_calc')}</span>}
                    </div>
                  </button>

                  {/* 6. Summary */}
                  <button
                    onClick={() => handleNav('attendance-summary')}
                    className={navItemClass('attendance-summary')}
                    title={t('menu.attendance.summary')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Table className="w-4 h-4 shrink-0 text-sky-500" />
                      {isOpen && <span>{t('menu.attendance.summary')}</span>}
                    </div>
                  </button>

                  {/* 7. Biaya Pekerja */}
                  <button
                    onClick={() => handleNav('attendance-labor-cost')}
                    className={navItemClass('attendance-labor-cost')}
                    title={t('menu.attendance.labor_cost')}
                  >
                    <div className="flex items-center gap-2.5">
                      <DollarSign className="w-4 h-4 shrink-0 text-rose-500" />
                      {isOpen && <span>{t('menu.attendance.labor_cost')}</span>}
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* GROUP 6: MODUL KEUANGAN & KONTRAK GALANGAN (TAHAP 6) */}
          {isAuthenticated && !isPending && (
            <div>
              {isOpen ? (
                <button
                  onClick={() => setFinanceOpen(!financeOpen)}
                  className="w-full flex items-center justify-between px-3 pb-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  <span>{t('sidebar.group.finance', 'Modul Keuangan & Kontrak')}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${financeOpen ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
              )}

              {(financeOpen || !isOpen) && (
                <div className="space-y-1">
                  <button
                    onClick={() => handleNav('finance-contract')}
                    className={navItemClass('finance-contract')}
                    title={t('menu.finance.contracts', 'Kontrak & Termin')}
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="w-4 h-4 shrink-0 text-teal-500" />
                      {isOpen && <span>{t('menu.finance.contracts', 'Kontrak & Termin')}</span>}
                    </div>
                  </button>

                  <button
                    onClick={() => handleNav('finance-operational')}
                    className={navItemClass('finance-operational')}
                    title={t('menu.finance.operational', 'Biaya Operasional')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Receipt className="w-4 h-4 shrink-0 text-amber-500" />
                      {isOpen && <span>{t('menu.finance.operational', 'Biaya Operasional')}</span>}
                    </div>
                  </button>

                  <button
                    onClick={() => handleNav('finance-labor')}
                    className={navItemClass('finance-labor')}
                    title={t('menu.finance.cashflow', 'Arus Kas & Margin')}
                  >
                    <div className="flex items-center gap-2.5">
                      <TrendingUp className="w-4 h-4 shrink-0 text-indigo-500" />
                      {isOpen && <span>{t('menu.finance.cashflow', 'Arus Kas & Margin')}</span>}
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* GROUP 7: HSE & TUGAS LAPANGAN (TAHAP 7) */}
          {isAuthenticated && !isPending && (
            <div>
              {isOpen ? (
                <button
                  onClick={() => setHseOpen(!hseOpen)}
                  className="w-full flex items-center justify-between px-3 pb-1 text-[10px] uppercase font-bold tracking-wider text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                >
                  <span>{t('sidebar.group.hse', 'Modul HSE & Tugas')}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${hseOpen ? 'rotate-180' : ''}`} />
                </button>
              ) : (
                <div className="h-px bg-slate-200 dark:bg-slate-800 my-2" />
              )}

              {(hseOpen || !isOpen) && (
                <div className="space-y-1">
                  <button
                    onClick={() => handleNav('announcements')}
                    className={navItemClass('announcements')}
                    title={t('menu.announcements', 'Pengumuman & K3')}
                  >
                    <div className="flex items-center gap-2.5">
                      <Bell className="w-4 h-4 shrink-0 text-blue-500" />
                      {isOpen && <span>{t('menu.announcements', 'Pengumuman & K3')}</span>}
                    </div>
                  </button>

                  <button
                    onClick={() => handleNav('tasks')}
                    className={navItemClass('tasks')}
                    title={t('menu.tasks', 'Tugas Kerja Lapangan')}
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckSquare className="w-4 h-4 shrink-0 text-emerald-500" />
                      {isOpen && <span>{t('menu.tasks', 'Tugas Kerja Lapangan')}</span>}
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* GROUP 8: SISTEM & ADMINISTRASI */}
          <div>
            {isOpen && (
              <p className="px-3 pb-1 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                {t('sidebar.group.system')}
              </p>
            )}
            <div className="space-y-1">
              {isPrivileged && (
                <button
                  onClick={() => handleNav('settings-audit')}
                  className={navItemClass('settings-audit')}
                  title={t('menu.settings.audit', 'Jejak Audit & RBAC')}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-4 h-4 shrink-0 text-amber-500" />
                    {isOpen && <span>{t('menu.settings.audit', 'Jejak Audit & RBAC')}</span>}
                  </div>
                </button>
              )}

              {isPrivileged && isModuleVisible('settings-app') && (
                <button
                  onClick={() => handleNav('settings-app')}
                  className={navItemClass('settings-app')}
                  title={language === 'en' ? 'App Settings' : 'Pengaturan Aplikasi'}
                >
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 shrink-0 text-indigo-500" />
                    {isOpen && <span>{language === 'en' ? 'App Settings' : 'Pengaturan Aplikasi'}</span>}
                  </div>
                </button>
              )}

              {isPrivileged && (
                <button
                  onClick={() => handleNav('users-permissions')}
                  className={navItemClass('users-permissions')}
                  title={language === 'en' ? 'User Permissions' : 'Izin Akses Pengguna'}
                >
                  <div className="flex items-center gap-2.5">
                    <Key className="w-4 h-4 shrink-0 text-emerald-500" />
                    {isOpen && <span>{language === 'en' ? 'User Permissions' : 'Izin Akses Pengguna'}</span>}
                  </div>
                </button>
              )}

              {isPrivileged && (
                <button
                  onClick={() => handleNav('users-waitlist')}
                  className={navItemClass('users-waitlist')}
                  title={t('menu.waitlist')}
                >
                  <div className="flex items-center gap-2.5">
                    <ShieldCheck className="w-4 h-4 shrink-0 text-blue-500" />
                    {isOpen && <span>{t('menu.waitlist')}</span>}
                  </div>
                </button>
              )}

              <button
                onClick={() => handleNav('support')}
                className={navItemClass('support')}
                title={t('nav.support')}
              >
                <div className="flex items-center gap-2.5">
                  <HelpCircle className="w-4 h-4 shrink-0 text-slate-400" />
                  {isOpen && <span>{t('nav.support')}</span>}
                </div>
              </button>
            </div>
          </div>

        </div>

        {/* Footer Utilities */}
        <div className="p-3 border-t border-slate-200/90 dark:border-slate-800/90 space-y-2 shrink-0">
          
          {isOpen ? (
            <div className="space-y-2">
              
              {/* Language Switcher */}
              <div className="flex items-center justify-between text-xs px-2 py-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-[11px] font-medium text-slate-500">{t('lang.label')}:</span>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-700 p-0.5 rounded-lg border border-slate-200 dark:border-slate-600">
                  <button
                    onClick={() => setLanguage('id')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                      language === 'id' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    ID
                  </button>
                  <button
                    onClick={() => setLanguage('en')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                      language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    EN
                  </button>
                </div>
              </div>

              {/* Brightness Theme */}
              <div className="flex items-center justify-between text-xs px-2 py-1 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                <span className="text-[11px] font-medium text-slate-500">{t('theme.label')}:</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setTheme('terang')}
                    className={`p-1.5 rounded-lg transition ${theme === 'terang' ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                    title={t('theme.terang')}
                  >
                    <Sun className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setTheme('gelap')}
                    className={`p-1.5 rounded-lg transition ${theme === 'gelap' ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                    title={t('theme.gelap')}
                  >
                    <Moon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setTheme('redup')}
                    className={`p-1.5 rounded-lg transition ${theme === 'redup' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 font-bold' : 'text-slate-400 hover:text-slate-600'}`}
                    title={t('theme.redup')}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Online indicator */}
              <div className="flex items-center justify-between text-[11px] px-2 text-slate-500">
                <span>{language === 'en' ? 'Connection:' : 'Koneksi:'}</span>
                <span className={`font-bold flex items-center gap-1 ${isOnline ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>

              {/* PWA Install */}
              <div className="pt-1">
                <PWAInstallButton />
              </div>

              {/* Logout Button */}
              {isAuthenticated && (
                <button
                  onClick={() => {
                    logout();
                    handleNav('landing');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-950/40 rounded-xl transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('nav.logout')}</span>
                </button>
              )}

            </div>
          ) : (
            /* Icon-only mode footer */
            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 uppercase text-[10px] font-bold"
                title={`Bahasa: ${language.toUpperCase()}`}
              >
                {language}
              </button>
              <button
                onClick={() => setTheme(theme === 'terang' ? 'gelap' : theme === 'gelap' ? 'redup' : 'terang')}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                title={`Kecerahan: ${theme}`}
              >
                {theme === 'terang' && <Sun className="w-4 h-4 text-amber-500" />}
                {theme === 'gelap' && <Moon className="w-4 h-4 text-blue-400" />}
                {theme === 'redup' && <Eye className="w-4 h-4 text-emerald-400" />}
              </button>
              {isAuthenticated && (
                <button
                  onClick={() => {
                    logout();
                    handleNav('landing');
                  }}
                  className="p-2 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  title={t('nav.logout')}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

        </div>
      </aside>
    </>
  );
};
