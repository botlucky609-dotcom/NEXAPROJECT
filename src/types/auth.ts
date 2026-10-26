export type UserRole = 'creator' | 'admin' | 'staff' | 'karyawan';

export type UserStatus = 'active' | 'pending' | 'rejected' | 'blocked';

export type BrightnessTheme = 'terang' | 'gelap' | 'redup';

export type LanguageCode = 'id' | 'en';

export interface UserPermission {
  canView: boolean;
  canAccess?: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canUpload: boolean;
  canDownload: boolean;
}

export interface UserAccount {
  id: string;
  fullName: string;
  username: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  rejectionCount: number;
  blockedUntil?: number; // timestamp
  passwordHash: string; // SHA-256 simulation with salt
  salt: string;
  employeeId?: string;
  position?: string;
  department?: string;
  avatarUrl?: string;
  createdAt: number;
  lastLoginAt?: number;
  failedLoginAttempts: number;
  lockoutUntil?: number; // timestamp
}

export interface WaitlistApplicant {
  id: string;
  fullName: string;
  username: string;
  email: string;
  passwordHash: string;
  salt: string;
  status: 'pending' | 'rejected' | 'approved';
  rejectionCount: number;
  rejectionReason?: string;
  blockedUntil?: number;
  appliedAt: number;
  reviewedAt?: number;
  reviewedBy?: string;
}

export interface PasswordResetToken {
  id: string;
  email: string;
  username: string;
  code: string;
  expiresAt: number; // 3 minutes
  canResendAt: number; // 3 minutes
  used: boolean;
}

export interface AuditLogItem {
  id: string;
  timestamp: number;
  userId: string;
  username: string;
  role: UserRole;
  action: string;
  module: string;
  details: string;
  status: 'success' | 'warning' | 'danger';
}

export interface RolePermissionsMap {
  [moduleKey: string]: {
    creator: UserPermission;
    admin: UserPermission;
    staff: UserPermission;
    karyawan: UserPermission;
  };
}
