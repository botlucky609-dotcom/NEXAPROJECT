import { useAuth } from '../context/AuthContext';
import { permissionsDb } from '../services/permissionsDb';
import { PermissionAction } from '../types/permissions';

export interface RBACPermissions {
  /**
   * True if current user is the master Creator.
   * Creator ALWAYS has absolute authority (Full Access) across all pages, modules, and actions.
   */
  isCreator: boolean;
  /**
   * True if current user has 'admin' role.
   */
  isAdmin: boolean;
  /**
   * True if the user is authorized to open and view the page/module.
   */
  canAccess: boolean;
  /**
   * True if user can add/create new records in this module (Create).
   * For Creator: always true.
   * For Admin/Others: matches 'canEdit' permission from Izin Akses Pengguna.
   */
  canCreate: boolean;
  /**
   * True if user can modify/update existing records in this module (Update).
   * For Creator: always true.
   * For Admin/Others: matches 'canEdit' permission from Izin Akses Pengguna.
   */
  canEdit: boolean;
  /**
   * True if user can delete records in this module (Delete).
   * For Creator: always true.
   * For Admin/Others: matches 'canDelete' permission from Izin Akses Pengguna.
   */
  canDelete: boolean;
  /**
   * True if user can upload documents/images/files.
   * For Creator: always true.
   * For Admin/Others: matches 'canUpload' permission from Izin Akses Pengguna.
   */
  canUpload: boolean;
  /**
   * True if user can download/export reports to Excel/PDF.
   * For Creator: always true.
   * For Admin/Others: matches 'canDownload' permission from Izin Akses Pengguna.
   */
  canDownload: boolean;
  /**
   * Custom action checker for granular checks.
   */
  hasPermission: (action: PermissionAction) => boolean;
}

/**
 * Universal RBAC hook for NEXAPROJECT.
 * 
 * Rules:
 * 1. Creator (role === 'creator' or creator email) has absolute full authority across all
 *    actions: canAccess, canCreate, canEdit, canDelete, canUpload, canDownload are ALWAYS true.
 * 2. Admin and other roles (karyawan, supervisor, etc.) strictly adhere to the permission matrix
 *    configured in the "Izin Akses Pengguna" (User Permissions) database.
 * 
 * @param moduleKey - The key/ID of the module (e.g., 'employees-data', 'projects-list', 'warehouse-stock')
 */
export function useRBAC(moduleKey: string): RBACPermissions {
  const { currentUser, hasPermission: checkAuthPermission } = useAuth();

  const isCreator = permissionsDb.isCreator(currentUser);
  const isAdmin = currentUser?.role === 'admin';

  // 1. Hak Akses Penuh Creator (Full Access)
  if (isCreator) {
    return {
      isCreator: true,
      isAdmin: false,
      canAccess: true,
      canCreate: true,
      canEdit: true,
      canDelete: true,
      canUpload: true,
      canDownload: true,
      hasPermission: () => true,
    };
  }

  // 2. Hak Akses Admin & Peran Lain: Konsisten dengan halaman Izin Akses Pengguna
  const normalizedKey = permissionsDb.normalizeModuleKey(moduleKey);

  const canAccess = checkAuthPermission(normalizedKey, 'canAccess') || checkAuthPermission(normalizedKey, 'canView');
  const canEdit = checkAuthPermission(normalizedKey, 'canEdit');
  const canDelete = checkAuthPermission(normalizedKey, 'canDelete');
  const canUpload = checkAuthPermission(normalizedKey, 'canUpload');
  const canDownload = checkAuthPermission(normalizedKey, 'canDownload');

  return {
    isCreator: false,
    isAdmin,
    canAccess,
    canCreate: canEdit,
    canEdit,
    canDelete,
    canUpload,
    canDownload,
    hasPermission: (action: PermissionAction) => checkAuthPermission(normalizedKey, action),
  };
}
