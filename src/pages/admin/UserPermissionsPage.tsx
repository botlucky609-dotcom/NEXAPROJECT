import React, { useState, useEffect, useMemo } from 'react';
import { 
  Key, 
  ShieldCheck, 
  ShieldAlert, 
  Search, 
  Users, 
  Check, 
  CheckSquare, 
  Square, 
  Save, 
  RotateCcw, 
  Eye, 
  EyeOff, 
  Edit3, 
  Trash2, 
  UploadCloud, 
  Download, 
  Lock, 
  AlertTriangle, 
  Sparkles,
  LayoutDashboard,
  Ship,
  Anchor,
  Activity,
  DollarSign,
  Package,
  TrendingUp,
  ShoppingCart,
  Clock,
  Calendar,
  Moon,
  Calculator,
  Table,
  CreditCard,
  FileText,
  Receipt,
  Bell,
  Sliders,
  Camera,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { dbService } from '../../services/db';
import { permissionsDb } from '../../services/permissionsDb';
import { UserAccount, UserRole } from '../../types/auth';
import { 
  ALL_PERMISSION_MODULES, 
  CATEGORIES_LIST, 
  ModulePermission, 
  getDefaultPermissionsForRole,
  AppPermissionModule
} from '../../types/permissions';
import { AppView } from '../../types/navigation';

export const UserPermissionsPage: React.FC<{ onNavigate?: (view: AppView) => void }> = ({ onNavigate }) => {
  const { currentUser } = useAuth();
  const { t } = useTheme();

  // Access validation: ONLY Creator and Admin can access this page
  const isCreator = currentUser?.role === 'creator' || permissionsDb.isCreator(currentUser);
  const isAdmin = currentUser?.role === 'admin';
  const hasAccess = isCreator || isAdmin;

  // State
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [permissions, setPermissions] = useState<Record<string, ModulePermission>>({});
  const [originalPermissions, setOriginalPermissions] = useState<Record<string, ModulePermission>>({});
  
  // Search & Filter state
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [moduleCategoryFilter, setModuleCategoryFilter] = useState<string>('Semua Kategori');
  const [moduleSearchQuery, setModuleSearchQuery] = useState('');

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Load and filter users based on operator permissions
  useEffect(() => {
    if (!currentUser) return;
    const allUsers = dbService.getUsers();
    // STRICT RULE: Admin cannot see or manage Creator!
    const visible = permissionsDb.getVisibleUsersForOperator(currentUser, allUsers);
    setUsers(visible);

    if (visible.length > 0 && !selectedUser) {
      setSelectedUser(visible[0]);
    }
  }, [currentUser]);

  // When selected user changes, load their permissions
  useEffect(() => {
    if (!selectedUser) return;
    const userPerms = permissionsDb.getPermissionsForUser(selectedUser);
    setPermissions(userPerms);
    setOriginalPermissions(JSON.parse(JSON.stringify(userPerms)));
  }, [selectedUser]);

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(permissions) !== JSON.stringify(originalPermissions);
  }, [permissions, originalPermissions]);

  // Filtered users for left sidebar
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = 
        u.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        (u.department || '').toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        (u.employeeId || '').toLowerCase().includes(userSearchQuery.toLowerCase());
      
      const matchRole = userRoleFilter === 'all' || u.role === userRoleFilter;
      return matchSearch && matchRole;
    });
  }, [users, userSearchQuery, userRoleFilter]);

  // Filtered modules for permission matrix
  const filteredModules = useMemo(() => {
    return ALL_PERMISSION_MODULES.filter((mod) => {
      const matchCategory = 
        moduleCategoryFilter === 'Semua Kategori' || mod.category === moduleCategoryFilter;
      const matchSearch = 
        mod.name.toLowerCase().includes(moduleSearchQuery.toLowerCase()) ||
        mod.description.toLowerCase().includes(moduleSearchQuery.toLowerCase()) ||
        mod.id.toLowerCase().includes(moduleSearchQuery.toLowerCase());
      return matchCategory && matchSearch;
    });
  }, [moduleCategoryFilter, moduleSearchQuery]);

  // Summary statistics for selected user
  const stats = useMemo(() => {
    let totalAccessible = 0;
    let totalEdit = 0;
    let totalDelete = 0;
    let totalUpload = 0;
    let totalDownload = 0;

    for (const modId of Object.keys(permissions)) {
      const p = permissions[modId];
      if (!p) continue;
      if (p.canAccess) totalAccessible++;
      if (p.canEdit) totalEdit++;
      if (p.canDelete) totalDelete++;
      if (p.canUpload) totalUpload++;
      if (p.canDownload) totalDownload++;
    }

    return {
      totalModules: ALL_PERMISSION_MODULES.length,
      totalAccessible,
      totalEdit,
      totalDelete,
      totalUpload,
      totalDownload
    };
  }, [permissions]);

  // Target user is protected creator?
  const isTargetCreator = selectedUser ? permissionsDb.isCreator(selectedUser) : false;

  // Toggle single cell permission
  const handleToggle = (moduleId: string, action: keyof ModulePermission) => {
    if (isTargetCreator) return; // Creator is immutable

    setPermissions((prev) => {
      const current = prev[moduleId] || {
        canAccess: false,
        canEdit: false,
        canDelete: false,
        canUpload: false,
        canDownload: false,
      };

      const updated = {
        ...current,
        [action]: !current[action],
      };

      // If user enables edit/delete/upload/download, auto-enable canAccess (show icon/access page)
      if (action !== 'canAccess' && updated[action] && !updated.canAccess) {
        updated.canAccess = true;
      }

      // If user turns off canAccess, auto-disable actions
      if (action === 'canAccess' && !updated.canAccess) {
        updated.canEdit = false;
        updated.canDelete = false;
        updated.canUpload = false;
        updated.canDownload = false;
      }

      return {
        ...prev,
        [moduleId]: updated,
      };
    });
  };

  // Toggle entire column across filtered modules
  const handleToggleColumn = (action: keyof ModulePermission) => {
    if (isTargetCreator) return;

    // Check if all filtered modules already have this action checked
    const allChecked = filteredModules.every(
      (mod) => permissions[mod.id]?.[action] ?? false
    );

    const targetVal = !allChecked;

    setPermissions((prev) => {
      const next = { ...prev };
      for (const mod of filteredModules) {
        const cur = next[mod.id] || {
          canAccess: false,
          canEdit: false,
          canDelete: false,
          canUpload: false,
          canDownload: false,
        };

        const updated = { ...cur, [action]: targetVal };
        if (action !== 'canAccess' && targetVal) {
          updated.canAccess = true;
        }
        if (action === 'canAccess' && !targetVal) {
          updated.canEdit = false;
          updated.canDelete = false;
          updated.canUpload = false;
          updated.canDownload = false;
        }
        next[mod.id] = updated;
      }
      return next;
    });
  };

  // Toggle entire row (give all or clear row)
  const handleToggleRow = (moduleId: string) => {
    if (isTargetCreator) return;

    setPermissions((prev) => {
      const cur = prev[moduleId] || {
        canAccess: false,
        canEdit: false,
        canDelete: false,
        canUpload: false,
        canDownload: false,
      };

      const hasAny = cur.canAccess || cur.canEdit || cur.canDelete || cur.canUpload || cur.canDownload;
      const targetVal = !hasAny;

      return {
        ...prev,
        [moduleId]: {
          canAccess: targetVal,
          canEdit: targetVal,
          canDelete: targetVal,
          canUpload: targetVal,
          canDownload: targetVal,
        },
      };
    });
  };

  // Preset: Grant Full Access
  const handlePresetFullAccess = () => {
    if (isTargetCreator) return;
    const full: Record<string, ModulePermission> = {};
    for (const mod of ALL_PERMISSION_MODULES) {
      full[mod.id] = {
        canAccess: true,
        canEdit: true,
        canDelete: true,
        canUpload: true,
        canDownload: true,
      };
    }
    setPermissions(full);
  };

  // Preset: Read Only & Download
  const handlePresetReadOnly = () => {
    if (isTargetCreator) return;
    const ro: Record<string, ModulePermission> = {};
    for (const mod of ALL_PERMISSION_MODULES) {
      ro[mod.id] = {
        canAccess: true,
        canEdit: false,
        canDelete: false,
        canUpload: false,
        canDownload: true,
      };
    }
    setPermissions(ro);
  };

  // Preset: Reset to Role Default
  const handlePresetRoleDefault = () => {
    if (!selectedUser || isTargetCreator) return;
    const defaults = getDefaultPermissionsForRole(selectedUser.role);
    setPermissions(defaults);
  };

  // Preset: Clear All
  const handlePresetClearAll = () => {
    if (isTargetCreator) return;
    const cleared: Record<string, ModulePermission> = {};
    for (const mod of ALL_PERMISSION_MODULES) {
      cleared[mod.id] = {
        canAccess: false,
        canEdit: false,
        canDelete: false,
        canUpload: false,
        canDownload: false,
      };
    }
    setPermissions(cleared);
  };

  // Save changes
  const handleSave = async () => {
    if (!currentUser || !selectedUser) return;
    setIsSaving(true);
    try {
      const res = await permissionsDb.savePermissionsForUser(currentUser, selectedUser, permissions);
      setOriginalPermissions(JSON.parse(JSON.stringify(permissions)));
      setToastMessage({ type: 'success', text: res.message });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (e) {
      const err = e instanceof Error ? e.message : 'Gagal menyimpan izin pengguna.';
      setToastMessage({ type: 'error', text: err });
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setIsSaving(false);
    }
  };

  // Helper icon renderer
  const renderModuleIcon = (iconName: string) => {
    switch (iconName) {
      case 'LayoutDashboard': return <LayoutDashboard className="w-4 h-4 text-blue-500" />;
      case 'Users': return <Users className="w-4 h-4 text-blue-600" />;
      case 'UserCheck': return <UserCheck className="w-4 h-4 text-indigo-500" />;
      case 'Camera': return <Camera className="w-4 h-4 text-emerald-500" />;
      case 'Ship': return <Ship className="w-4 h-4 text-cyan-600" />;
      case 'Anchor': return <Anchor className="w-4 h-4 text-indigo-600" />;
      case 'Activity': return <Activity className="w-4 h-4 text-teal-500" />;
      case 'DollarSign': return <DollarSign className="w-4 h-4 text-rose-500" />;
      case 'Package': return <Package className="w-4 h-4 text-amber-600" />;
      case 'TrendingUp': return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'ShoppingCart': return <ShoppingCart className="w-4 h-4 text-violet-500" />;
      case 'Clock': return <Clock className="w-4 h-4 text-sky-500" />;
      case 'Calendar': return <Calendar className="w-4 h-4 text-orange-500" />;
      case 'Moon': return <Moon className="w-4 h-4 text-purple-500" />;
      case 'Calculator': return <Calculator className="w-4 h-4 text-teal-600" />;
      case 'Table': return <Table className="w-4 h-4 text-blue-500" />;
      case 'CreditCard': return <CreditCard className="w-4 h-4 text-rose-600" />;
      case 'FileText': return <FileText className="w-4 h-4 text-cyan-600" />;
      case 'Receipt': return <Receipt className="w-4 h-4 text-amber-500" />;
      case 'Bell': return <Bell className="w-4 h-4 text-blue-500" />;
      case 'CheckSquare': return <CheckSquare className="w-4 h-4 text-emerald-500" />;
      case 'ShieldAlert': return <ShieldAlert className="w-4 h-4 text-amber-500" />;
      case 'Sliders': return <Sliders className="w-4 h-4 text-indigo-500" />;
      case 'Key': return <Key className="w-4 h-4 text-blue-500" />;
      case 'ShieldCheck': return <ShieldCheck className="w-4 h-4 text-blue-600" />;
      default: return <Key className="w-4 h-4 text-slate-500" />;
    }
  };

  // If unauthorized role visits this page:
  if (!hasAccess) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/60 p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Akses Ditolak
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Halaman pengaturan izin akses pengguna hanya dapat diakses oleh <span className="font-bold text-amber-600 dark:text-amber-400">Creator</span> dan <span className="font-bold text-blue-600 dark:text-blue-400">Administrator</span> sistem.
          </p>
          <div className="mt-6">
            <button
              onClick={() => onNavigate && onNavigate('dashboard')}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs hover:bg-slate-800 transition"
            >
              Kembali ke Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div 
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-200 border ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-50 dark:bg-emerald-950/90 text-emerald-800 dark:text-emerald-200 border-emerald-300 dark:border-emerald-800'
              : 'bg-rose-50 dark:bg-rose-950/90 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Izin Akses Pengguna</span>
                <span className="text-xs px-2 py-0.5 rounded-md font-bold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                  Access Control Matrix
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Tentukan hak akses halaman, visibilitas ikon navigasi, dan aksi spesifik (EDIT, DELETE, UPLOAD, UNDUH) untuk pengguna terdaftar yang telah disetujui.
              </p>
            </div>
          </div>
        </div>

        {/* Operator Badge & Security State */}
        <div className="flex items-center gap-3 shrink-0">
          {isCreator ? (
            <div className="px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-800 dark:text-amber-300 text-xs flex items-center gap-2 font-bold shadow-xs">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Otoritas Penuh Creator</span>
            </div>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-700/60 text-blue-800 dark:text-blue-300 text-xs flex items-center gap-2 font-bold shadow-xs">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Administrator (Creator Dilindungi & Tersembunyi)</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: User Selector & Summary (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Pengguna Terdaftar ({filteredUsers.length})</span>
              </h2>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Status Disetujui
              </span>
            </div>

            {/* User Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Cari nama, username, jabatan..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Role Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
              {[
                { id: 'all', label: 'Semua' },
                { id: 'admin', label: 'Admin' },
                { id: 'staff', label: 'Staff' },
                { id: 'karyawan', label: 'Karyawan' }
              ].map((rf) => (
                <button
                  key={rf.id}
                  onClick={() => setUserRoleFilter(rf.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                    userRoleFilter === rf.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {rf.label}
                </button>
              ))}
            </div>

            {/* User List Scrollable */}
            <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
              {filteredUsers.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  Tidak ada pengguna aktif ditemukan.
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedUser?.id === user.id;
                  const isUserCreator = permissionsDb.isCreator(user);

                  return (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`w-full text-left p-3 rounded-2xl transition flex items-center justify-between border ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700/80 shadow-xs ring-1 ring-blue-500/30'
                          : 'bg-white dark:bg-slate-900/60 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${
                          isUserCreator 
                            ? 'bg-amber-500 text-white shadow-xs' 
                            : user.role === 'admin'
                            ? 'bg-blue-600 text-white'
                            : user.role === 'staff'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-700 text-white'
                        }`}>
                          {user.fullName ? user.fullName.charAt(0) : 'U'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {user.fullName}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400">
                            <span>@{user.username}</span>
                            {user.employeeId && (
                              <>
                                <span>•</span>
                                <span>{user.employeeId}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0 text-right pl-2">
                        <span className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded ${
                          isUserCreator
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300'
                            : user.role === 'admin'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : user.role === 'staff'
                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {user.role}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Selected User Summary & Presets Card */}
          {selectedUser && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Pengguna Terpilih
                  </span>
                  <h3 className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                    {selectedUser.fullName}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedUser.position || 'Staf Operasional'} • {selectedUser.department || 'Galangan Kapal'}
                  </p>
                </div>

                {isTargetCreator && (
                  <span className="px-2 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 text-[10px] font-black border border-amber-300">
                    👑 CREATOR
                  </span>
                )}
              </div>

              {/* Creator Protection Alert */}
              {isTargetCreator && (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 text-amber-800 dark:text-amber-200 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-bold">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Akun Creator Memiliki Hak Mutlak</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-300/80">
                    Seluruh izin akses, visibilitas modul, EDIT, DELETE, UPLOAD, dan UNDUH selalu aktif secara permanen dan dilindungi dari perubahan.
                  </p>
                </div>
              )}

              {/* Live Permission Counters */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-medium">Modul Dapat Diakses</span>
                  <span className="text-sm font-black text-blue-600 dark:text-blue-400">
                    {stats.totalAccessible} <span className="text-[10px] text-slate-400 font-normal">/ {stats.totalModules}</span>
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-medium">Izin EDIT Aktif</span>
                  <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                    {stats.totalEdit} <span className="text-[10px] text-slate-400 font-normal">modul</span>
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-medium">Izin DELETE Aktif</span>
                  <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                    {stats.totalDelete} <span className="text-[10px] text-slate-400 font-normal">modul</span>
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-medium">Izin UPLOAD / UNDUH</span>
                  <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">
                    {stats.totalUpload} / {stats.totalDownload}
                  </span>
                </div>
              </div>

              {/* Quick Presets (Only if target is not Creator) */}
              {!isTargetCreator && (
                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Template Aksi Cepat
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={handlePresetFullAccess}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition text-left"
                    >
                      ⚡ Beri Semua Izin
                    </button>
                    <button
                      type="button"
                      onClick={handlePresetReadOnly}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition text-left"
                    >
                      👁️ Hanya Lihat & Unduh
                    </button>
                    <button
                      type="button"
                      onClick={handlePresetRoleDefault}
                      className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 font-bold text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition text-left"
                    >
                      🔄 Standar Peran
                    </button>
                    <button
                      type="button"
                      onClick={handlePresetClearAll}
                      className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-bold text-rose-600 dark:text-rose-400 transition text-left"
                    >
                      🚫 Hapus Semua Izin
                    </button>
                  </div>
                </div>
              )}

              {/* Save Button */}
              {!isTargetCreator && (
                <div className="pt-2">
                  <button
                    onClick={handleSave}
                    disabled={isSaving || !hasUnsavedChanges}
                    className={`w-full py-3 px-4 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-md transition ${
                      hasUnsavedChanges
                        ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer ring-2 ring-blue-500/50'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Menyimpan...' : hasUnsavedChanges ? 'Simpan Perubahan Izin' : 'Izin Tersimpan'}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: The Checkbox Matrix Table (8 Cols) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* Table Header Filter Toolbar */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            
            {/* Category Filter Dropdown */}
            <div className="w-full sm:w-auto flex items-center gap-2">
              <select
                value={moduleCategoryFilter}
                onChange={(e) => setModuleCategoryFilter(e.target.value)}
                className="py-2 px-3 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIES_LIST.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              <span className="text-xs text-slate-400 hidden sm:inline">
                ({filteredModules.length} modul)
              </span>
            </div>

            {/* Module Search Input */}
            <div className="w-full sm:w-64 relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={moduleSearchQuery}
                onChange={(e) => setModuleSearchQuery(e.target.value)}
                placeholder="Cari modul atau halaman..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Matrix Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            
            {/* Instructions Bar */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <CheckSquare className="w-4 h-4 text-blue-600" />
                <span className="font-medium">
                  Berikan tanda centang pada kolom yang ingin diizinkan. Klik judul kolom untuk centang/hapus semua.
                </span>
              </div>

              {hasUnsavedChanges && (
                <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold text-[10px] animate-pulse">
                  Ada perubahan belum disimpan
                </span>
              )}
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-extrabold select-none">
                    
                    {/* Modul Column */}
                    <th className="py-3.5 px-4 min-w-[200px]">
                      Halaman & Modul
                    </th>

                    {/* Akses / Ikon Column */}
                    <th className="py-3.5 px-2.5 text-center min-w-[100px]">
                      <button
                        type="button"
                        onClick={() => handleToggleColumn('canAccess')}
                        disabled={isTargetCreator}
                        className="inline-flex flex-col items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                        title="Klik untuk centang / hapus semua visibilitas ikon dan akses modul"
                      >
                        <div className="flex items-center gap-1">
                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                          <span>Akses/Ikon</span>
                        </div>
                        <span className="text-[9px] font-normal text-slate-400">Tampil Menu</span>
                      </button>
                    </th>

                    {/* EDIT Column */}
                    <th className="py-3.5 px-2.5 text-center min-w-[85px]">
                      <button
                        type="button"
                        onClick={() => handleToggleColumn('canEdit')}
                        disabled={isTargetCreator}
                        className="inline-flex flex-col items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                        title="Klik untuk centang / hapus semua izin EDIT"
                      >
                        <div className="flex items-center gap-1">
                          <Edit3 className="w-3.5 h-3.5 text-emerald-500" />
                          <span>EDIT</span>
                        </div>
                        <span className="text-[9px] font-normal text-slate-400">Ubah Data</span>
                      </button>
                    </th>

                    {/* DELETE Column */}
                    <th className="py-3.5 px-2.5 text-center min-w-[85px]">
                      <button
                        type="button"
                        onClick={() => handleToggleColumn('canDelete')}
                        disabled={isTargetCreator}
                        className="inline-flex flex-col items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                        title="Klik untuk centang / hapus semua izin DELETE"
                      >
                        <div className="flex items-center gap-1">
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                          <span>DELETE</span>
                        </div>
                        <span className="text-[9px] font-normal text-slate-400">Hapus Data</span>
                      </button>
                    </th>

                    {/* UPLOAD Column */}
                    <th className="py-3.5 px-2.5 text-center min-w-[85px]">
                      <button
                        type="button"
                        onClick={() => handleToggleColumn('canUpload')}
                        disabled={isTargetCreator}
                        className="inline-flex flex-col items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                        title="Klik untuk centang / hapus semua izin UPLOAD"
                      >
                        <div className="flex items-center gap-1">
                          <UploadCloud className="w-3.5 h-3.5 text-indigo-500" />
                          <span>UPLOAD</span>
                        </div>
                        <span className="text-[9px] font-normal text-slate-400">Unggah File</span>
                      </button>
                    </th>

                    {/* UNDUH Column */}
                    <th className="py-3.5 px-2.5 text-center min-w-[85px]">
                      <button
                        type="button"
                        onClick={() => handleToggleColumn('canDownload')}
                        disabled={isTargetCreator}
                        className="inline-flex flex-col items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition cursor-pointer"
                        title="Klik untuk centang / hapus semua izin UNDUH"
                      >
                        <div className="flex items-center gap-1">
                          <Download className="w-3.5 h-3.5 text-amber-500" />
                          <span>UNDUH</span>
                        </div>
                        <span className="text-[9px] font-normal text-slate-400">Ekspor Data</span>
                      </button>
                    </th>

                    {/* Baris Toggle Action */}
                    <th className="py-3.5 px-3 text-center min-w-[80px]">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredModules.map((mod, index) => {
                    const modPerm = permissions[mod.id] || {
                      canAccess: false,
                      canEdit: false,
                      canDelete: false,
                      canUpload: false,
                      canDownload: false,
                    };

                    const isRowActive = modPerm.canAccess;

                    return (
                      <tr 
                        key={mod.id} 
                        className={`transition ${
                          isRowActive 
                            ? 'hover:bg-blue-50/40 dark:hover:bg-blue-950/20' 
                            : 'bg-slate-50/50 dark:bg-slate-900/40 opacity-70 hover:opacity-100'
                        }`}
                      >
                        {/* Module Info */}
                        <td className="py-3 px-4">
                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 shrink-0">
                              {renderModuleIcon(mod.iconName)}
                            </div>
                            <div className="min-w-0">
                              <p className={`font-bold text-xs truncate ${isRowActive ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                {mod.name}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.2 rounded">
                                  {mod.category}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Checkbox: Tampilkan Ikon & Akses Halaman */}
                        <td className="py-3 px-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggle(mod.id, 'canAccess')}
                            disabled={isTargetCreator}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition border ${
                              modPerm.canAccess
                                ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-transparent hover:border-blue-400'
                            } ${isTargetCreator ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                            title={modPerm.canAccess ? 'Ikon tampil & halaman dapat diakses' : 'Ikon disembunyikan & halaman dikunci'}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>
                        </td>

                        {/* Checkbox: EDIT */}
                        <td className="py-3 px-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggle(mod.id, 'canEdit')}
                            disabled={isTargetCreator}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition border ${
                              modPerm.canEdit
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-transparent hover:border-emerald-400'
                            } ${isTargetCreator ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                            title={modPerm.canEdit ? 'Izin EDIT aktif' : 'Izin EDIT tidak aktif'}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>
                        </td>

                        {/* Checkbox: DELETE */}
                        <td className="py-3 px-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggle(mod.id, 'canDelete')}
                            disabled={isTargetCreator}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition border ${
                              modPerm.canDelete
                                ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-transparent hover:border-rose-400'
                            } ${isTargetCreator ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                            title={modPerm.canDelete ? 'Izin DELETE aktif' : 'Izin DELETE tidak aktif'}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>
                        </td>

                        {/* Checkbox: UPLOAD */}
                        <td className="py-3 px-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggle(mod.id, 'canUpload')}
                            disabled={isTargetCreator}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition border ${
                              modPerm.canUpload
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-transparent hover:border-indigo-400'
                            } ${isTargetCreator ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                            title={modPerm.canUpload ? 'Izin UPLOAD aktif' : 'Izin UPLOAD tidak aktif'}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>
                        </td>

                        {/* Checkbox: UNDUH */}
                        <td className="py-3 px-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggle(mod.id, 'canDownload')}
                            disabled={isTargetCreator}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition border ${
                              modPerm.canDownload
                                ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                                : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-transparent hover:border-amber-400'
                            } ${isTargetCreator ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'}`}
                            title={modPerm.canDownload ? 'Izin UNDUH aktif' : 'Izin UNDUH tidak aktif'}
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                          </button>
                        </td>

                        {/* Quick Row Toggle */}
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleRow(mod.id)}
                            disabled={isTargetCreator}
                            className={`text-[11px] font-bold px-2 py-1 rounded-lg border transition ${
                              isRowActive
                                ? 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300'
                                : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                            } ${isTargetCreator ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                            title={isRowActive ? 'Kosongkan baris' : 'Pilih semua baris'}
                          >
                            {isRowActive ? 'Reset' : 'Pilih'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Bottom Footer Toolbar */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="font-bold text-slate-700 dark:text-slate-300">Keterangan Kolom:</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-600"></span> Akses/Ikon</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-600"></span> EDIT</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-600"></span> DELETE</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-600"></span> UPLOAD</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-600"></span> UNDUH</span>
              </div>

              {!isTargetCreator && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedUser) {
                        setPermissions(JSON.parse(JSON.stringify(originalPermissions)));
                      }
                    }}
                    disabled={!hasUnsavedChanges || isSaving}
                    className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition disabled:opacity-50"
                  >
                    Batal
                  </button>

                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={!hasUnsavedChanges || isSaving}
                    className="py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Menyimpan...' : 'Simpan Izin'}</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
