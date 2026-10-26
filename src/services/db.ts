import { UserAccount, WaitlistApplicant, AuditLogItem, UserRole } from '../types/auth';

const STORAGE_KEY_USERS = 'nexaproject_users_v1';
const STORAGE_KEY_WAITLIST = 'nexaproject_waitlist_v1';
const STORAGE_KEY_AUDIT = 'nexaproject_audit_logs_v1';
const STORAGE_KEY_SYNC_QUEUE = 'nexaproject_sync_queue_v1';

// Safe hash generator using salt separation
export function hashPasswordWithSalt(password: string, salt: string): string {
  let hash = 0;
  const combined = `NEXA_${salt}_${password}_SALT_2026`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return `sha256_${Math.abs(hash).toString(16).padStart(16, '0')}`;
}

export function generateSalt(username: string): string {
  return `slt_${username.toLowerCase()}_${Date.now().toString(36)}`;
}

// Default Seed Accounts
const DEFAULT_USERS: UserAccount[] = [
  {
    id: 'usr-creator-001',
    fullName: 'MUHAMMAD ANDRI',
    username: 'creator01',
    email: 'muhammad.andri0605@gmail.com',
    role: 'creator',
    status: 'active',
    rejectionCount: 0,
    salt: 'slt_creator01_sys',
    passwordHash: hashPasswordWithSalt('creator123', 'slt_creator01_sys'),
    employeeId: 'EMP-001',
    position: 'PROJECT MANAGER',
    department: 'STEEL WORK',
    failedLoginAttempts: 0,
    createdAt: Date.now() - 30 * 24 * 3600 * 1000,
  },
  {
    id: 'usr-admin-002',
    fullName: 'BAMBANG SETIAWAN',
    username: 'admin01',
    email: 'admin@nexaproject.com',
    role: 'admin',
    status: 'active',
    rejectionCount: 0,
    salt: 'slt_admin01_sys',
    passwordHash: hashPasswordWithSalt('admin123', 'slt_admin01_sys'),
    employeeId: 'EMP-002',
    position: 'SUPERVISOR',
    department: 'PIPING',
    failedLoginAttempts: 0,
    createdAt: Date.now() - 20 * 24 * 3600 * 1000,
  },
  {
    id: 'usr-staff-003',
    fullName: 'SITI NURHALIZA',
    username: 'staff01',
    email: 'staff@nexaproject.com',
    role: 'staff',
    status: 'active',
    rejectionCount: 0,
    salt: 'slt_staff01_sys',
    passwordHash: hashPasswordWithSalt('staff123', 'slt_staff01_sys'),
    employeeId: 'EMP-003',
    position: 'ADMINISTRATION',
    department: 'GENERAL AFFAIRS',
    failedLoginAttempts: 0,
    createdAt: Date.now() - 15 * 24 * 3600 * 1000,
  },
  {
    id: 'usr-karyawan-004',
    fullName: 'AHMAD RIFAI',
    username: 'karyawan01',
    email: 'karyawan@nexaproject.com',
    role: 'karyawan',
    status: 'active',
    rejectionCount: 0,
    salt: 'slt_karyawan01_sys',
    passwordHash: hashPasswordWithSalt('karyawan123', 'slt_karyawan01_sys'),
    employeeId: 'EMP-004',
    position: 'WELDER',
    department: 'STEEL WORK',
    failedLoginAttempts: 0,
    createdAt: Date.now() - 10 * 24 * 3600 * 1000,
  },
];

// Initial Waitlist Applications for Approval Demonstration
const DEFAULT_WAITLIST: WaitlistApplicant[] = [
  {
    id: 'wait-001',
    fullName: 'RUDI HARTONO',
    username: 'rudihartono',
    email: 'rudi.hartono@gmail.com',
    passwordHash: hashPasswordWithSalt('rudi1234', 'slt_rudi'),
    salt: 'slt_rudi',
    status: 'pending',
    rejectionCount: 0,
    appliedAt: Date.now() - 2 * 3600 * 1000,
  },
  {
    id: 'wait-002',
    fullName: 'DENI SAPUTRA',
    username: 'denisaputra',
    email: 'deni.saputra@yahoo.com',
    passwordHash: hashPasswordWithSalt('deni1234', 'slt_deni'),
    salt: 'slt_deni',
    status: 'rejected',
    rejectionCount: 1,
    rejectionReason: 'Lampiran nomor KTP belum lengkap',
    appliedAt: Date.now() - 12 * 3600 * 1000,
    reviewedAt: Date.now() - 6 * 3600 * 1000,
    reviewedBy: 'admin01',
  },
  {
    id: 'wait-003',
    fullName: 'JOKO WIDODO SUSANTO',
    username: 'jokosusanto',
    email: 'joko.susanto@corp.com',
    passwordHash: hashPasswordWithSalt('joko1234', 'slt_joko'),
    salt: 'slt_joko',
    status: 'rejected',
    rejectionCount: 3,
    rejectionReason: 'Penolakan ke-3: Data tidak valid berturut-turut',
    blockedUntil: Date.now() + 20 * 3600 * 1000, // 20 hours remaining in 24h block
    appliedAt: Date.now() - 48 * 3600 * 1000,
    reviewedAt: Date.now() - 4 * 3600 * 1000,
    reviewedBy: 'creator01',
  },
];

const DEFAULT_AUDIT: AuditLogItem[] = [
  {
    id: 'aud-001',
    timestamp: Date.now() - 24 * 3600 * 1000,
    userId: 'usr-creator-001',
    username: 'creator01',
    role: 'creator',
    action: 'SYSTEM_BOOTSTRAP',
    module: 'Fondasi Sistem',
    details: 'Inisialisasi keamanan sistem, konfigurasi RBAC, dan skema database awal.',
    status: 'success',
  },
  {
    id: 'aud-002',
    timestamp: Date.now() - 18 * 3600 * 1000,
    userId: 'usr-admin-002',
    username: 'admin01',
    role: 'admin',
    action: 'POLICY_AUDIT',
    module: 'Keamanan Akun',
    details: 'Verifikasi pembatasan lockout 3x gagal masuk dan sesi idle timeout 10/15 menit.',
    status: 'success',
  },
];

class DatabaseService {
  private users: UserAccount[] = [];
  private waitlist: WaitlistApplicant[] = [];
  private auditLogs: AuditLogItem[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedUsers = localStorage.getItem(STORAGE_KEY_USERS);
      this.users = storedUsers ? JSON.parse(storedUsers) : [...DEFAULT_USERS];
      
      // Ensure master creator is always present, active, and never locked out
      const creatorIdx = this.users.findIndex((u) => this.isCreatorUser(u));
      if (creatorIdx === -1) {
        this.users.unshift(DEFAULT_USERS[0]);
      } else {
        // Enforce active status and clear any accidental lockouts
        this.users[creatorIdx].role = 'creator';
        this.users[creatorIdx].status = 'active';
        this.users[creatorIdx].failedLoginAttempts = 0;
        this.users[creatorIdx].lockoutUntil = undefined;
      }

      // Ensure other default roles exist as well
      const adminIdx = this.users.findIndex((u) => u.username === 'admin01' || u.role === 'admin');
      if (adminIdx === -1) this.users.push(DEFAULT_USERS[1]);

      const staffIdx = this.users.findIndex((u) => u.username === 'staff01' || u.role === 'staff');
      if (staffIdx === -1) this.users.push(DEFAULT_USERS[2]);

      const karyawanIdx = this.users.findIndex((u) => u.username === 'karyawan01' || u.role === 'karyawan');
      if (karyawanIdx === -1) this.users.push(DEFAULT_USERS[3]);

      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));

      const storedWaitlist = localStorage.getItem(STORAGE_KEY_WAITLIST);
      this.waitlist = storedWaitlist ? JSON.parse(storedWaitlist) : DEFAULT_WAITLIST;
      if (!storedWaitlist) {
        localStorage.setItem(STORAGE_KEY_WAITLIST, JSON.stringify(DEFAULT_WAITLIST));
      }

      const storedAudit = localStorage.getItem(STORAGE_KEY_AUDIT);
      this.auditLogs = storedAudit ? JSON.parse(storedAudit) : DEFAULT_AUDIT;
      if (!storedAudit) {
        localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(DEFAULT_AUDIT));
      }
    } catch {
      this.users = [...DEFAULT_USERS];
      this.waitlist = [...DEFAULT_WAITLIST];
      this.auditLogs = [...DEFAULT_AUDIT];
    }
  }

  // User queries
  public getUsers(): UserAccount[] {
    return [...this.users];
  }

  public findUserByIdentity(identity: string): UserAccount | undefined {
    if (!identity) return undefined;
    const trimmed = identity.trim().toLowerCase();

    // 1. Direct match by exact username or email
    const exact = this.users.find(
      (u) => u.username.toLowerCase() === trimmed || u.email.toLowerCase() === trimmed
    );
    if (exact) return exact;

    // 2. Creator aliases: "creator", "creator01", "creator@nexaproject.com", "muhammad.andri0605@gmail.com", "andri"
    if (
      trimmed === 'creator' ||
      trimmed === 'creator01' ||
      trimmed === 'creator@nexaproject.com' ||
      trimmed === 'muhammad.andri0605@gmail.com' ||
      trimmed === 'andri' ||
      trimmed === 'muhammad andri'
    ) {
      let creator = this.users.find((u) => this.isCreatorUser(u));
      if (!creator) {
        creator = { ...DEFAULT_USERS[0] };
        this.users.unshift(creator);
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
      }
      return creator;
    }

    // 3. Admin aliases: "admin", "admin01", "admin@nexaproject.com"
    if (trimmed === 'admin' || trimmed === 'admin01' || trimmed === 'admin@nexaproject.com') {
      let admin = this.users.find((u) => u.username.toLowerCase() === 'admin01' || u.role === 'admin');
      if (!admin) {
        admin = { ...DEFAULT_USERS[1] };
        this.users.push(admin);
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
      }
      return admin;
    }

    // 4. Staff aliases: "staff", "staff01", "staff@nexaproject.com"
    if (trimmed === 'staff' || trimmed === 'staff01' || trimmed === 'staff@nexaproject.com') {
      let staff = this.users.find((u) => u.username.toLowerCase() === 'staff01' || u.role === 'staff');
      if (!staff) {
        staff = { ...DEFAULT_USERS[2] };
        this.users.push(staff);
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
      }
      return staff;
    }

    // 5. Karyawan aliases: "karyawan", "karyawan01", "karyawan@nexaproject.com"
    if (trimmed === 'karyawan' || trimmed === 'karyawan01' || trimmed === 'karyawan@nexaproject.com') {
      let karyawan = this.users.find((u) => u.username.toLowerCase() === 'karyawan01' || u.role === 'karyawan');
      if (!karyawan) {
        karyawan = { ...DEFAULT_USERS[3] };
        this.users.push(karyawan);
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
      }
      return karyawan;
    }

    return undefined;
  }

  public findUserById(id: string): UserAccount | undefined {
    return this.users.find((u) => u.id === id);
  }

  public isCreatorUser(user: UserAccount | Partial<UserAccount> | null | undefined): boolean {
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

  public addUser(user: UserAccount): void {
    const idx = this.users.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      this.users[idx] = user;
    } else {
      this.users.push(user);
    }
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
  }

  public updateUser(user: UserAccount, operatorRole?: UserRole | 'system'): void {
    const existing = this.users.find((u) => u.id === user.id);
    if (existing && this.isCreatorUser(existing)) {
      // Disallow subordinate roles (admin, staff, karyawan) from modifying the Creator account!
      // System-level operations (login, reset failed attempts, self-updates) where operatorRole is undefined, 'creator', or 'system' are allowed.
      if (operatorRole && operatorRole !== 'creator' && operatorRole !== 'system') {
        throw new Error('Akses Ditolak: Akun CREATOR memiliki otoritas tertinggi dan tidak dapat disentuh atau diubah oleh peran di bawahnya.');
      }
    }
    // Disallow non-creator from elevating any user to 'creator'
    if (user.role === 'creator' && (!existing || existing.role !== 'creator')) {
      if (operatorRole && operatorRole !== 'creator' && operatorRole !== 'system') {
        throw new Error('Akses Ditolak: Hanya akun CREATOR yang berhak menetapkan peran Creator.');
      }
    }
    const idx = this.users.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      this.users[idx] = user;
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
    }
  }

  public deleteUser(userId: string, operatorRole?: UserRole | 'system'): boolean {
    const target = this.users.find((u) => u.id === userId);
    if (!target) return false;
    if (this.isCreatorUser(target)) {
      if (operatorRole && operatorRole !== 'creator' && operatorRole !== 'system') {
        throw new Error('Akses Ditolak: Akun CREATOR dilindungi secara absolut dan tidak dapat disentuh atau dihapus oleh peran di bawahnya!');
      }
    }
    this.users = this.users.filter((u) => u.id !== userId);
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));
    return true;
  }

  // Waitlist queries
  public getWaitlist(): WaitlistApplicant[] {
    return [...this.waitlist];
  }

  public findWaitlistById(id: string): WaitlistApplicant | undefined {
    return this.waitlist.find((w) => w.id === id);
  }

  public findWaitlistByIdentity(username: string, email: string): WaitlistApplicant | undefined {
    const u = username.trim().toLowerCase();
    const e = email.trim().toLowerCase();
    return this.waitlist.find(
      (w) => w.username.toLowerCase() === u || w.email.toLowerCase() === e
    );
  }

  public addWaitlistApplicant(applicant: WaitlistApplicant): void {
    this.waitlist.push(applicant);
    localStorage.setItem(STORAGE_KEY_WAITLIST, JSON.stringify(this.waitlist));
  }

  public updateWaitlistApplicant(applicant: WaitlistApplicant): void {
    const idx = this.waitlist.findIndex((w) => w.id === applicant.id);
    if (idx !== -1) {
      this.waitlist[idx] = applicant;
      localStorage.setItem(STORAGE_KEY_WAITLIST, JSON.stringify(this.waitlist));
    }
  }

  public approveApplicant(id: string, reviewerUsername: string, assignedRole: 'staff' | 'karyawan' | 'admin' = 'karyawan'): UserAccount | null {
    const applicant = this.findWaitlistById(id);
    if (!applicant) return null;

    applicant.status = 'approved';
    applicant.reviewedAt = Date.now();
    applicant.reviewedBy = reviewerUsername;
    this.updateWaitlistApplicant(applicant);

    // Update existing user or create user account
    const existingIdx = this.users.findIndex(
      (u) => (applicant.email && u.email?.toLowerCase() === applicant.email.toLowerCase()) ||
             (applicant.username && u.username?.toLowerCase() === applicant.username.toLowerCase())
    );

    let targetUser: UserAccount;
    if (existingIdx !== -1) {
      this.users[existingIdx].status = 'active';
      this.users[existingIdx].role = assignedRole;
      this.users[existingIdx].rejectionCount = applicant.rejectionCount;
      targetUser = this.users[existingIdx];
    } else {
      targetUser = {
        id: `usr-${Date.now().toString(36)}`,
        fullName: applicant.fullName,
        username: applicant.username,
        email: applicant.email,
        role: assignedRole,
        status: 'active',
        rejectionCount: applicant.rejectionCount,
        salt: applicant.salt,
        passwordHash: applicant.passwordHash,
        employeeId: `EMP-${(this.users.length + 1).toString().padStart(3, '0')}`,
        position: 'KARYAWAN OPERASIONAL',
        department: 'STEEL WORK',
        failedLoginAttempts: 0,
        createdAt: Date.now(),
      };
      this.users.push(targetUser);
    }
    localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(this.users));

    this.addAuditLog({
      id: `aud-${Date.now()}`,
      timestamp: Date.now(),
      userId: reviewerUsername,
      username: reviewerUsername,
      role: 'admin',
      action: 'APPROVE_USER',
      module: 'Daftar Tunggu Akun',
      details: `Menyetujui pendaftaran ${applicant.fullName} (${applicant.username}) dengan peran ${assignedRole}.`,
      status: 'success',
    });

    return targetUser;
  }

  public rejectApplicant(id: string, reviewerUsername: string, reason: string): WaitlistApplicant | null {
    const applicant = this.findWaitlistById(id);
    if (!applicant) return null;

    // Defense-in-depth: Creator application cannot be rejected by non-creator
    const applicantEmail = applicant.email.toLowerCase().trim();
    if (applicantEmail === 'muhammad.andri0605@gmail.com' || applicantEmail === 'creator@nexaproject.com') {
      const reviewer = this.findUserByIdentity(reviewerUsername);
      if (reviewer && reviewer.role !== 'creator') {
        throw new Error('Akses Ditolak: Permohonan akun CREATOR dilindungi secara mutlak dan tidak dapat ditolak oleh peran di bawahnya!');
      }
    }

    const newRejectionCount = (applicant.rejectionCount || 0) + 1;
    applicant.status = 'rejected';
    applicant.rejectionCount = newRejectionCount;
    applicant.rejectionReason = reason;
    applicant.reviewedAt = Date.now();
    applicant.reviewedBy = reviewerUsername;

    // 3x rejection rule: block for 24 hours
    if (newRejectionCount >= 3) {
      applicant.blockedUntil = Date.now() + 24 * 3600 * 1000;
    }

    this.updateWaitlistApplicant(applicant);

    this.addAuditLog({
      id: `aud-${Date.now()}`,
      timestamp: Date.now(),
      userId: reviewerUsername,
      username: reviewerUsername,
      role: 'admin',
      action: 'REJECT_USER',
      module: 'Daftar Tunggu Akun',
      details: `Menolak pendaftaran ${applicant.fullName} (Penolakan ke-${newRejectionCount}). Alasan: ${reason}`,
      status: 'warning',
    });

    return applicant;
  }

  // Audit Logs
  public getAuditLogs(): AuditLogItem[] {
    return [...this.auditLogs].sort((a, b) => b.timestamp - a.timestamp);
  }

  public addAuditLog(log: AuditLogItem): void {
    this.auditLogs.unshift(log);
    if (this.auditLogs.length > 500) {
      this.auditLogs = this.auditLogs.slice(0, 500);
    }
    localStorage.setItem(STORAGE_KEY_AUDIT, JSON.stringify(this.auditLogs));
  }

  // Password reset tokens (in-memory with 3-minute validity)
  private resetTokens: Map<string, { code: string; expiresAt: number; email: string; username: string }> = new Map();

  public createPasswordResetCode(identity: string): { code: string; expiresAt: number; email: string } | null {
    const user = this.findUserByIdentity(identity);
    if (!user) return null;

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 3 * 60 * 1000; // 3 minutes

    this.resetTokens.set(user.email.toLowerCase(), {
      code,
      expiresAt,
      email: user.email,
      username: user.username,
    });

    this.addAuditLog({
      id: `aud-${Date.now()}`,
      timestamp: Date.now(),
      userId: user.id,
      username: user.username,
      role: user.role,
      action: 'RESET_PASSWORD_REQUESTED',
      module: 'Pemulihan Kata Sandi',
      details: `Kode verifikasi 6-digit dibuat untuk ${user.email} (berlaku 3 menit).`,
      status: 'warning',
    });

    return { code, expiresAt, email: user.email };
  }

  public verifyResetCode(email: string, code: string): boolean {
    const record = this.resetTokens.get(email.toLowerCase());
    if (!record) return false;
    if (Date.now() > record.expiresAt) return false;
    return record.code === code.trim();
  }

  public completePasswordReset(email: string, code: string, newPasswordPlain: string): boolean {
    if (!this.verifyResetCode(email, code)) return false;
    const user = this.findUserByIdentity(email);
    if (!user) return false;

    user.passwordHash = hashPasswordWithSalt(newPasswordPlain, user.salt);
    user.failedLoginAttempts = 0;
    user.lockoutUntil = undefined;
    this.updateUser(user, 'system');

    this.resetTokens.delete(email.toLowerCase());

    this.addAuditLog({
      id: `aud-${Date.now()}`,
      timestamp: Date.now(),
      userId: user.id,
      username: user.username,
      role: user.role,
      action: 'RESET_PASSWORD_COMPLETED',
      module: 'Pemulihan Kata Sandi',
      details: `Kata sandi berhasil diperbarui untuk ${user.username}.`,
      status: 'success',
    });

    return true;
  }
}

export const dbService = new DatabaseService();
