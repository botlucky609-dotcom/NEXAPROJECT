import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppView } from './types/navigation';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './pages/LandingPage';
import { SupportPage } from './pages/SupportPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { WaitlistPage } from './pages/WaitlistPage';
import { DashboardPreviewPage } from './pages/DashboardPreviewPage';
import { EmployeeDataPage } from './pages/employees/EmployeeDataPage';
import { EmployeeProfilePage } from './pages/employees/EmployeeProfilePage';
import { EmployeePhotoStoragePage } from './pages/employees/EmployeePhotoStoragePage';
import { ProjectListPage } from './pages/projects/ProjectListPage';
import { ProjectSupervisorsPage } from './pages/projects/ProjectSupervisorsPage';
import { ProjectProgressPage } from './pages/projects/ProjectProgressPage';
import { ProjectCostPage } from './pages/projects/ProjectCostPage';
import { WarehouseInventoryPage } from './pages/warehouse/WarehouseInventoryPage';
import { MaterialOrdersPage } from './pages/warehouse/MaterialOrdersPage';
import { AttendanceTimesheetPage } from './pages/attendance/AttendanceTimesheetPage';
import { OvertimeManagementPage } from './pages/attendance/OvertimeManagementPage';
import { NightShiftFormPage } from './pages/attendance/NightShiftFormPage';
import { TimeCalculationPage } from './pages/attendance/TimeCalculationPage';
import { ProjectCalculationPage } from './pages/attendance/ProjectCalculationPage';
import { AttendanceSummaryPage } from './pages/attendance/AttendanceSummaryPage';
import { LaborCostCalculatorPage } from './pages/attendance/LaborCostCalculatorPage';
import { FinanceContractsPage } from './pages/finance/FinanceContractsPage';
import { FinanceOperationalPage } from './pages/finance/FinanceOperationalPage';
import { FinanceCashflowPage } from './pages/finance/FinanceCashflowPage';
import { AnnouncementsPage } from './pages/announcements/AnnouncementsPage';
import { FieldTasksPage } from './pages/tasks/FieldTasksPage';
import { SecurityAuditPage } from './pages/admin/SecurityAuditPage';
import { UserPermissionsPage } from './pages/admin/UserPermissionsPage';
import { AppSettingsPage } from './pages/settings/AppSettingsPage';
import { MaintenanceModeScreen } from './components/common/MaintenanceModeScreen';
import { LoadingScreen } from './components/common/LoadingScreen';
import { PendingApprovalPage } from './pages/PendingApprovalPage';
import { CreatorMaintenanceBanner } from './components/common/CreatorMaintenanceBanner';
import { AntiScreenshotBanner } from './components/auth/AntiScreenshotBanner';
import { SessionLockModal } from './components/auth/SessionLockModal';
import { WifiOff, AlertTriangle } from 'lucide-react';
import { useTheme } from './context/ThemeContext';
import { GlobalAppBackground } from './components/common/GlobalAppBackground';
import { DEFAULT_BACKGROUND } from './types/settings';

function AppContent() {
  const { isAuthenticated, currentUser, isScreenshotBlocked, isLoading: isAuthLoading } = useAuth();
  const { appSettings } = useTheme();
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    // Default open on desktop screen, closed on mobile
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024;
    }
    return true;
  });
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  // Track network connectivity
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync view when user logs out or signs in
  useEffect(() => {
    if (!isAuthenticated && currentView === 'dashboard') {
      setCurrentView('landing');
    }
  }, [isAuthenticated, currentView]);

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isCreator = currentUser?.role === 'creator' || 
    currentUser?.email === 'muhammad.andri0605@gmail.com' || 
    currentUser?.email === 'ronalpaman@gmail.com' || 
    currentUser?.email === 'creator@nexaproject.com';
  const isMaintenance = appSettings.serverConfig.status === 'maintenance';
  const isPending = !!currentUser && currentUser.status === 'pending' && !isCreator;
  const publicViews: AppView[] = ['landing', 'support', 'login', 'register', 'forgot-password'];

  // Strict Router Guard: If user status is pending, prevent access to dashboard and all operational modules
  useEffect(() => {
    if (isPending && !publicViews.includes(currentView) && currentView !== 'pending-approval') {
      setCurrentView('pending-approval');
    }
  }, [isPending, currentView]);

  // When user status is approved by Admin/Creator in Firestore (status becomes 'active'), auto-redirect to dashboard
  useEffect(() => {
    if (currentUser?.status === 'active' && currentView === 'pending-approval') {
      setCurrentView('dashboard');
    }
  }, [currentUser?.status, currentView]);

  // Fullscreen LoadingScreen during boot, auth verification, and pending/active check
  if (isAuthLoading) {
    return (
      <LoadingScreen
        fullScreen={true}
        text="Memuat Sesi Sistem..."
        subtext="Memverifikasi autentikasi akun, status otorisasi, dan menyinkronkan data..."
      />
    );
  }

  // If server is in maintenance mode and user is NOT Creator, intercept and block all navigation
  if (isMaintenance && !isCreator) {
    return <MaintenanceModeScreen onRefresh={() => window.location.reload()} />;
  }

  return (
    <div className={`min-h-screen flex flex-col relative text-slate-900 dark:text-slate-100 ${isScreenshotBlocked ? 'secure-screen-blur' : ''}`}>
      
      {/* Global Dynamic Background Layer (Supports Solid, Industrial Gradient, & Shipyard Wallpapers) */}
      <GlobalAppBackground config={appSettings.backgroundConfig || DEFAULT_BACKGROUND} />

      {/* Offline Toast Banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-sm z-50">
          <WifiOff className="w-4 h-4 animate-pulse" />
          <span>
            Mode Offline Aktif (PWA) — Perubahan data disimpan di memori lokal dan disinkronkan saat terhubung kembali.
          </span>
        </div>
      )}

      {/* Creator Maintenance Alert Banner */}
      {isMaintenance && isCreator && (
        <CreatorMaintenanceBanner onNavigate={handleNavigate} />
      )}

      {/* Sidebar Navigation (Sisi Samping) */}
      <Sidebar
        currentView={currentView}
        onNavigate={handleNavigate}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        isOnline={isOnline}
      />

      {/* Main App Container adjusted for Left Sidebar */}
      <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
        isSidebarOpen ? 'lg:pl-72' : 'lg:pl-20'
      }`}>
        
        {/* Top Navbar */}
        <Navbar 
          currentView={currentView} 
          onNavigate={handleNavigate} 
          isOnline={isOnline}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} 
        />

        {/* Main View Router */}
        <main className="flex-1">
          {currentView === 'landing' && <LandingPage onNavigate={handleNavigate} />}
          {currentView === 'support' && <SupportPage onNavigate={handleNavigate} />}
          {currentView === 'login' && <LoginPage onNavigate={handleNavigate} />}
          {currentView === 'register' && <RegisterPage onNavigate={handleNavigate} />}
          {currentView === 'forgot-password' && <ForgotPasswordPage onNavigate={handleNavigate} />}
          {currentView === 'pending-approval' && <PendingApprovalPage onNavigate={handleNavigate} />}

          {/* Strict Router Guard Fallback: If status is PENDING and attempting to view any protected module, show PendingApprovalPage */}
          {isPending && !publicViews.includes(currentView) && currentView !== 'pending-approval' && (
            <PendingApprovalPage onNavigate={handleNavigate} />
          )}

          {!isPending && currentView === 'dashboard' && <DashboardPreviewPage onNavigate={handleNavigate} />}
          
          {/* Tahap 2: Manajemen Karyawan */}
          {!isPending && currentView === 'employees-data' && <EmployeeDataPage />}
          {!isPending && currentView === 'employees-profile' && <EmployeeProfilePage />}
          {!isPending && currentView === 'employees-photos' && <EmployeePhotoStoragePage />}
          
          {/* Tahap 3: Manajemen Proyek Kapal */}
          {!isPending && currentView === 'projects-list' && <ProjectListPage />}
          {!isPending && currentView === 'projects-supervisors' && <ProjectSupervisorsPage />}
          {!isPending && currentView === 'projects-progress' && <ProjectProgressPage />}
          {!isPending && currentView === 'projects-cost' && <ProjectCostPage />}

          {/* Tahap 4: Manajemen Gudang & Logistik Material */}
          {!isPending && (currentView === 'warehouse-stock' || currentView === 'warehouse-storage' || currentView === 'warehouse-flow') && (
            <WarehouseInventoryPage />
          )}
          {!isPending && (currentView === 'warehouse-order' || currentView === 'warehouse-usage') && (
            <MaterialOrdersPage />
          )}

          {/* Halaman Absensi (7 Sub Menu Komprehensif) */}
          {!isPending && currentView === 'attendance-timesheet' && (
            <AttendanceTimesheetPage onNavigate={handleNavigate} />
          )}
          {!isPending && currentView === 'attendance-overtime' && (
            <OvertimeManagementPage onNavigate={handleNavigate} />
          )}
          {!isPending && currentView === 'attendance-nightshift' && (
            <NightShiftFormPage onNavigate={handleNavigate} />
          )}
          {!isPending && currentView === 'attendance-time-calc' && (
            <TimeCalculationPage onNavigate={handleNavigate} />
          )}
          {!isPending && currentView === 'attendance-project-calc' && (
            <ProjectCalculationPage onNavigate={handleNavigate} />
          )}
          {!isPending && currentView === 'attendance-summary' && (
            <AttendanceSummaryPage onNavigate={handleNavigate} />
          )}
          {!isPending && currentView === 'attendance-labor-cost' && (
            <LaborCostCalculatorPage onNavigate={handleNavigate} />
          )}

          {/* Tahap 6: Modul Keuangan & Kontrak Galangan */}
          {!isPending && currentView === 'finance-contract' && (
            <FinanceContractsPage />
          )}
          {!isPending && (currentView === 'finance-operational' || currentView === 'finance-claim-ot' || currentView === 'finance-claim-night' || currentView === 'finance-other') && (
            <FinanceOperationalPage />
          )}
          {!isPending && (currentView === 'finance-labor' || currentView === 'finance-material') && (
            <FinanceCashflowPage />
          )}

          {/* Tahap 7: HSE & Pengumuman, Tugas Lapangan, dan Administrasi Keamanan/Audit */}
          {!isPending && currentView === 'announcements' && (
            <AnnouncementsPage />
          )}
          {!isPending && currentView === 'tasks' && (
            <FieldTasksPage />
          )}
          {/* Pengaturan Aplikasi (5 Sub Menu) */}
          {!isPending && (currentView === 'settings-app' || currentView === 'settings-general' || currentView === 'settings-theme') && (
            <AppSettingsPage onNavigate={handleNavigate} />
          )}

          {/* Jejak Audit & RBAC */}
          {!isPending && (currentView === 'settings-audit' || currentView === 'users-access') && (
            <SecurityAuditPage />
          )}

          {/* Izin Akses Pengguna (Access Control Matrix) */}
          {!isPending && currentView === 'users-permissions' && (
            <UserPermissionsPage onNavigate={handleNavigate} />
          )}

          {/* User Management */}
          {!isPending && currentView === 'users-waitlist' && (
            <WaitlistPage onNavigateToDashboard={() => handleNavigate('dashboard')} />
          )}
        </main>

        {/* Footer */}
        <Footer onNavigate={handleNavigate} />
      </div>

      {/* Global Security Modals */}
      <AntiScreenshotBanner />
      <SessionLockModal />

    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider onRedirectToDashboard={() => window.location.hash = '#dashboard'}>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}
