import { UserAccount, UserRole } from '../types/auth';
import { ModulePermission, getDefaultPermissionsForRole, ALL_PERMISSION_MODULES } from '../types/permissions';
import { dbService } from './db';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const STORAGE_KEY_PERMISSIONS = 'nexaproject_user_permissions_v2';
const FIRESTORE_COLLECTION = 'user_permissions';

export interface UserPermissionRecord {
  userId: string;
  username: string;
  role: UserRole;
  updatedAt: number;
  updatedBy: string;
  permissions: Record<string, ModulePermission>;
}

class PermissionsDbService {
  private permissionsMap: Record<string, Record<string, ModulePermission>> = {};

  constructor() {
    this.init();
  }

  private init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PERMISSIONS);
      if (stored) {
        this.permissionsMap = JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse stored user permissions:', e);
      this.permissionsMap = {};
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY_PERMISSIONS, JSON.stringify(this.permissionsMap));
    } catch (e) {
      console.error('Failed to persist user permissions to localStorage:', e);
    }
  }

  /**
   * Check if a given user is the absolute Creator.
   */
  public isCreator(user: UserAccount | null | undefined): boolean {
    if (!user) return false;
    const email = (user.email || '').toLowerCase().trim();
    const username = (user.username || '').toLowerCase().trim();
    return (
      user.role === 'creator' ||
      user.id === 'usr-creator-001' ||
      username === 'creator01' ||
      username === 'creator' ||
      email === 'muhammad.andri0605@gmail.com' ||
      email === 'ronalpaman@gmail.com' ||
      email === 'creator@nexaproject.com'
    );
  }

  /**
   * Filter which users can be viewed by the current operator.
   * STRICT REQUIREMENT:
   * "dan yang bisa mengakses halaman ini hanya creator dan admin,
   * dan admin tidak bisa menentukan hak atau izin kepada creator dan jika bisa admin tidak bisa melihat creator"
   */
  public getVisibleUsersForOperator(operator: UserAccount, users: UserAccount[]): UserAccount[] {
    // Only approved/active users can have permissions managed
    const activeUsers = users.filter((u) => u.status === 'active');

    // If operator is Admin, completely hide the Creator!
    if (operator.role === 'admin') {
      return activeUsers.filter((u) => !this.isCreator(u));
    }

    // If operator is Creator, they can see everyone
    return activeUsers;
  }

  /**
   * Get permissions for a specific user.
   * Creator ALWAYS gets 100% full authority across every single module and action.
   */
  public getPermissionsForUser(user: UserAccount): Record<string, ModulePermission> {
    // Creator immunity: absolute full access
    if (this.isCreator(user)) {
      return getDefaultPermissionsForRole('creator');
    }

    const saved = this.permissionsMap[user.id];
    const defaultRolePerms = getDefaultPermissionsForRole(user.role);

    if (!saved) {
      return defaultRolePerms;
    }

    // Merge saved permissions with any newly added modules
    const merged: Record<string, ModulePermission> = { ...defaultRolePerms };
    for (const mod of ALL_PERMISSION_MODULES) {
      if (saved[mod.id]) {
        merged[mod.id] = {
          canAccess: Boolean(saved[mod.id].canAccess),
          canEdit: Boolean(saved[mod.id].canEdit),
          canDelete: Boolean(saved[mod.id].canDelete),
          canUpload: Boolean(saved[mod.id].canUpload),
          canDownload: Boolean(saved[mod.id].canDownload),
        };
      }
    }
    return merged;
  }

  /**
   * Save customized permissions for a user.
   * Admin CANNOT modify Creator permissions.
   */
  public async savePermissionsForUser(
    operator: UserAccount,
    targetUser: UserAccount,
    permissions: Record<string, ModulePermission>
  ): Promise<{ success: boolean; message: string }> {
    // Security check: If target is Creator, reject if operator is not Creator
    if (this.isCreator(targetUser)) {
      if (!this.isCreator(operator)) {
        throw new Error('Akses Ditolak: Administrator tidak diizinkan untuk mengubah atau menentukan izin akses Akun Creator!');
      }
    }

    // Security check: Only Creator or Admin can save permissions
    if (operator.role !== 'creator' && operator.role !== 'admin') {
      throw new Error('Akses Ditolak: Anda tidak memiliki otoritas untuk mengelola izin akses pengguna.');
    }

    // Save in memory and localStorage
    this.permissionsMap[targetUser.id] = permissions;
    this.persist();

    // Log the audit event
    dbService.addAuditLog({
      id: `aud-${Date.now()}`,
      timestamp: Date.now(),
      userId: operator.id,
      username: operator.username,
      role: operator.role,
      action: 'UPDATE_USER_PERMISSIONS',
      module: 'Izin Akses Pengguna',
      details: `Memperbarui matriks izin akses untuk pengguna ${targetUser.fullName} (${targetUser.username} / ${targetUser.role.toUpperCase()}).`,
      status: 'success',
    });

    // Sync to Firestore in the background
    try {
      const record: UserPermissionRecord = {
        userId: targetUser.id,
        username: targetUser.username,
        role: targetUser.role,
        updatedAt: Date.now(),
        updatedBy: operator.username,
        permissions,
      };
      await setDoc(doc(db, FIRESTORE_COLLECTION, targetUser.id), record, { merge: true });
    } catch (e) {
      console.warn('Firestore user permissions background sync skipped / offline:', e);
    }

    return {
      success: true,
      message: `Izin akses untuk pengguna ${targetUser.fullName} berhasil diperbarui.`,
    };
  }

  /**
   * Reset user's permissions back to their default role preset.
   */
  public async resetToRoleDefault(
    operator: UserAccount,
    targetUser: UserAccount
  ): Promise<Record<string, ModulePermission>> {
    if (this.isCreator(targetUser) && !this.isCreator(operator)) {
      throw new Error('Akses Ditolak: Administrator tidak diizinkan mengubah akun Creator.');
    }

    const defaultPerms = getDefaultPermissionsForRole(targetUser.role);
    await this.savePermissionsForUser(operator, targetUser, defaultPerms);
    return defaultPerms;
  }

  /**
   * Normalize view keys or module aliases to matching ID in ALL_PERMISSION_MODULES
   */
  public normalizeModuleKey(key: string): string {
    const map: Record<string, string> = {
      'warehouse-inventory': 'warehouse-stock',
      'warehouse-orders': 'warehouse-order',
      'warehouse-order': 'warehouse-order',
      'attendance-project-calc': 'attendance-proj-calc',
      'attendance-proj-calc': 'attendance-proj-calc',
      'users-access': 'users-permissions',
      'finance-operational': 'finance-operational',
      'finance-contracts': 'finance-contract',
      'finance-contract': 'finance-contract',
      'finance-cashflow': 'finance-labor',
      'finance-labor': 'finance-labor',
      'projects': 'projects-list',
      'projects-list': 'projects-list',
      'employees': 'employees-data',
      'employees-data': 'employees-data',
    };
    return map[key] || key;
  }

  /**
   * Quick check if a user can access a specific module/page
   */
  public canUserAccessModule(user: UserAccount | null, moduleId: string): boolean {
    if (!user) return false;
    if (this.isCreator(user)) return true;
    const perms = this.getPermissionsForUser(user);
    const key = this.normalizeModuleKey(moduleId);
    return perms[key]?.canAccess ?? perms[moduleId]?.canAccess ?? false;
  }

  /**
   * Quick check if a user has a specific action permission in a module
   */
  public hasUserActionPermission(
    user: UserAccount | null,
    moduleId: string,
    action: 'canAccess' | 'canEdit' | 'canDelete' | 'canUpload' | 'canDownload'
  ): boolean {
    if (!user) return false;
    if (this.isCreator(user)) return true;
    const perms = this.getPermissionsForUser(user);
    const key = this.normalizeModuleKey(moduleId);
    return perms[key]?.[action] ?? perms[moduleId]?.[action] ?? false;
  }

  /**
   * Fetch from Firestore on initial load
   */
  public async syncUserPermissionsFromFirestore(userId: string): Promise<Record<string, ModulePermission> | null> {
    try {
      const snap = await getDoc(doc(db, FIRESTORE_COLLECTION, userId));
      if (snap.exists()) {
        const data = snap.data() as UserPermissionRecord;
        if (data.permissions) {
          this.permissionsMap[userId] = data.permissions;
          this.persist();
          return data.permissions;
        }
      }
    } catch (e) {
      console.warn('Firestore permissions load skipped / offline:', e);
    }
    return null;
  }
}

export const permissionsDb = new PermissionsDbService();
