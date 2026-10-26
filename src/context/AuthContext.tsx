import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { UserAccount, UserRole, UserPermission } from '../types/auth';
import { dbService, hashPasswordWithSalt } from '../services/db';
import { permissionsDb } from '../services/permissionsDb';
import { signInWithGoogle, signOutFirebase, db, auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, getDoc, getDocFromServer, onSnapshot } from 'firebase/firestore';

interface AuthContextType {
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialLoading: boolean;
  login: (identity: string, passwordPlain: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string; lockoutSeconds?: number; isPending?: boolean }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string; isPending?: boolean }>;
  loginAsCreator: () => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  quickSwitchRole: (role: UserRole) => void;
  refreshUserStatus: () => Promise<UserAccount | null>;
  // Session Timers
  isSessionLocked: boolean;
  unlockSession: (passwordPlain: string) => boolean;
  lastActiveTime: number;
  resetActivityTimer: () => void;
  // Anti-screenshot state
  hasAcknowledgedAntiScreenshot: boolean;
  acknowledgeAntiScreenshot: () => void;
  isScreenshotBlocked: boolean;
  // Permissions checker
  hasPermission: (moduleKey: string, action: keyof UserPermission) => boolean;
  canAccessModule: (moduleKey: string) => boolean;
  // Remember me
  savedIdentity: string;
}

export function isCreatorUser(user: UserAccount | null | undefined): boolean {
  if (!user) return false;
  if (user.role === 'creator') return true;
  const email = (user.email || '').toLowerCase().trim();
  return (
    email === 'muhammad.andri0605@gmail.com' ||
    email === 'ronalpaman@gmail.com' ||
    email === 'creator@nexaproject.com' ||
    user.username === 'creator01'
  );
}

const STORAGE_KEY_AUTH = 'nexaproject_current_user_v1';
const STORAGE_KEY_REMEMBER = 'nexaproject_remembered_identity_v1';
const STORAGE_KEY_ANTISCREENSHOT = 'nexaproject_antiscreenshot_ack_v1';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode; onRedirectToDashboard?: () => void }> = ({
  children,
  onRedirectToDashboard,
}) => {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_AUTH);
      if (saved) {
        const parsed: UserAccount = JSON.parse(saved);
        // Verify 24-hour expiration rule
        if (parsed.lastLoginAt && Date.now() - parsed.lastLoginAt > 24 * 3600 * 1000) {
          localStorage.removeItem(STORAGE_KEY_AUTH);
          return null;
        }
        return parsed;
      }
    } catch {
      return null;
    }
    return null;
  });

  const [isInitialAuthLoading, setIsInitialAuthLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const setIsLoading = setIsActionLoading;
  const isLoading = isActionLoading || isInitialAuthLoading;
  const [isSessionLocked, setIsSessionLocked] = useState(false);
  const [lastActiveTime, setLastActiveTime] = useState<number>(Date.now());
  const [isScreenshotBlocked, setIsScreenshotBlocked] = useState(false);

  const [hasAcknowledgedAntiScreenshot, setHasAcknowledgedAntiScreenshot] = useState<boolean>(() => {
    return localStorage.getItem(STORAGE_KEY_ANTISCREENSHOT) === 'true';
  });

  const [savedIdentity, setSavedIdentity] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEY_REMEMBER) || '';
  });

  // Initial Boot & Firebase Auth Listener (Pemeriksaan Akun, Role, & Status Pending/Active)
  useEffect(() => {
    let isMounted = true;
    
    // Safety fallback: ensure initial loading resolves even if network is slow/offline
    const timer = setTimeout(() => {
      if (isMounted) {
        setIsInitialAuthLoading(false);
      }
    }, 1500);

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser && fbUser.email) {
          const email = fbUser.email.toLowerCase().trim();
          const isCreatorEmail = 
            email === 'muhammad.andri0605@gmail.com' || 
            email === 'ronalpaman@gmail.com' || 
            email === 'creator@nexaproject.com';
          const isAdminEmail = email === 'admin@nexaproject.com';
          const assignedRole: UserRole = isCreatorEmail ? 'creator' : (isAdminEmail ? 'admin' : 'karyawan');
          
          let firestoreData: any = null;
          try {
            const snap = await getDoc(doc(db, 'users', fbUser.uid)).catch(() => null);
            if (snap && snap.exists()) {
              firestoreData = snap.data();
            }
          } catch (e) {
            console.warn('[Auth] Firestore boot check warning:', e);
          }

          if (isMounted) {
            const userStatus = isCreatorEmail || isAdminEmail ? 'active' : (firestoreData?.status || 'pending');
            const resolvedRole: UserRole = isCreatorEmail ? 'creator' : (firestoreData?.role || assignedRole);
            
            const resolvedUser: UserAccount = {
              id: fbUser.uid,
              fullName: firestoreData?.fullName || (fbUser.displayName || 'PENGGUNA GOOGLE').toUpperCase(),
              username: firestoreData?.username || fbUser.email.split('@')[0],
              email: fbUser.email,
              role: resolvedRole,
              status: userStatus,
              rejectionCount: firestoreData?.rejectionCount || 0,
              salt: `slt_${fbUser.uid.slice(0, 10)}`,
              passwordHash: hashPasswordWithSalt('google_oauth_authenticated', `slt_${fbUser.uid.slice(0, 10)}`),
              employeeId: firestoreData?.employeeId || (isCreatorEmail ? 'EMP-001' : `EMP-${Date.now().toString().slice(-4)}`),
              position: firestoreData?.position || (isCreatorEmail ? 'PROJECT MANAGER / CREATOR' : 'KARYAWAN OPERASIONAL'),
              department: firestoreData?.department || 'STEEL WORK',
              avatarUrl: fbUser.photoURL || undefined,
              failedLoginAttempts: 0,
              createdAt: firestoreData?.createdAt ? new Date(firestoreData.createdAt).getTime() : Date.now(),
              lastLoginAt: Date.now(),
            };

            setCurrentUser(resolvedUser);
            try {
              localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(resolvedUser));
            } catch {}
          }
        } else {
          // If no active Firebase user, verify cached user in localStorage
          const saved = localStorage.getItem(STORAGE_KEY_AUTH);
          if (saved) {
            try {
              const parsed: UserAccount = JSON.parse(saved);
              if (parsed?.id && parsed?.lastLoginAt && Date.now() - parsed.lastLoginAt < 24 * 3600 * 1000) {
                // Background verify status from Firestore
                const snap = await getDoc(doc(db, 'users', parsed.id)).catch(() => null);
                if (snap && snap.exists() && isMounted) {
                  const data = snap.data();
                  if (data.status) {
                    parsed.status = data.status;
                    if (data.role && parsed.role !== 'creator') parsed.role = data.role;
                    setCurrentUser({ ...parsed });
                    localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(parsed));
                  }
                }
              }
            } catch {}
          }
        }
      } catch (err) {
        console.warn('[Auth] onAuthStateChanged initialization error:', err);
      } finally {
        if (isMounted) {
          // Keep loader briefly visible (400ms) for pleasant smooth transition
          setTimeout(() => {
            if (isMounted) {
              setIsInitialAuthLoading(false);
            }
          }, 400);
        }
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(timer);
      unsub();
    };
  }, []);

  // Track user activity
  const resetActivityTimer = useCallback(() => {
    setLastActiveTime(Date.now());
  }, []);

  useEffect(() => {
    const handleUserInteraction = () => {
      if (!isSessionLocked) {
        setLastActiveTime(Date.now());
      }
    };

    window.addEventListener('mousemove', handleUserInteraction, { passive: true });
    window.addEventListener('keydown', handleUserInteraction, { passive: true });
    window.addEventListener('touchstart', handleUserInteraction, { passive: true });
    window.addEventListener('scroll', handleUserInteraction, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleUserInteraction);
      window.removeEventListener('keydown', handleUserInteraction);
      window.removeEventListener('touchstart', handleUserInteraction);
      window.removeEventListener('scroll', handleUserInteraction);
    };
  }, [isSessionLocked]);

  // Periodic Idle Check (10 min -> Dashboard, 15 min -> Lock, 24 hr -> Logout)
  const hasRedirectedToDashboard = useRef(false);

  useEffect(() => {
    if (!currentUser) {
      hasRedirectedToDashboard.current = false;
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const idleTime = now - lastActiveTime;

      // Rule: 24h total session inactivity -> full logout to landing
      if (currentUser.lastLoginAt && now - currentUser.lastLoginAt > 24 * 3600 * 1000) {
        logout();
        return;
      }

      // Rule: 15 minutes of inactivity (900,000 ms) -> session locked modal
      if (idleTime >= 15 * 60 * 1000 && !isSessionLocked) {
        setIsSessionLocked(true);
      }
      // Rule: 10 minutes of inactivity (600,000 ms) -> redirect to dashboard
      else if (idleTime >= 10 * 60 * 1000 && !hasRedirectedToDashboard.current && !isSessionLocked) {
        hasRedirectedToDashboard.current = true;
        if (onRedirectToDashboard) {
          onRedirectToDashboard();
        }
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [currentUser, lastActiveTime, isSessionLocked, onRedirectToDashboard]);

  // Real-time synchronization for Current User status from Firestore /users/{uid}
  useEffect(() => {
    if (!currentUser?.id) return;

    const isCreator = 
      currentUser.role === 'creator' || 
      currentUser.email === 'muhammad.andri0605@gmail.com' || 
      currentUser.email === 'ronalpaman@gmail.com' || 
      currentUser.email === 'creator@nexaproject.com';

    if (isCreator) return;

    const unsub = onSnapshot(
      doc(db, 'users', currentUser.id),
      (snap) => {
        if (snap.exists()) {
          const remoteData = snap.data();
          if (remoteData.status && remoteData.status !== currentUser.status) {
            console.log(`[Auth] User status updated in Firestore: ${currentUser.status} -> ${remoteData.status}`);
            const updatedUser: UserAccount = {
              ...currentUser,
              status: remoteData.status,
              role: remoteData.role || currentUser.role,
              position: remoteData.position || currentUser.position,
              fullName: remoteData.fullName || currentUser.fullName,
            };
            setCurrentUser(updatedUser);
            try {
              localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(updatedUser));
            } catch {}
          }
        }
      },
      (err) => {
        console.warn('[Auth] Real-time user snapshot warning:', err);
      }
    );

    return () => unsub();
  }, [currentUser?.id, currentUser?.status]);

  const refreshUserStatus = async (): Promise<UserAccount | null> => {
    if (!currentUser?.id) return null;
    try {
      let snap = await getDocFromServer(doc(db, 'users', currentUser.id)).catch(() => null);
      if (!snap) {
        snap = await getDoc(doc(db, 'users', currentUser.id)).catch(() => null);
      }
      if (snap && snap.exists()) {
        const data = snap.data();
        if (data.status) {
          const updatedUser: UserAccount = {
            ...currentUser,
            status: data.status,
            role: data.role || currentUser.role,
            position: data.position || currentUser.position,
            fullName: data.fullName || currentUser.fullName,
          };
          setCurrentUser(updatedUser);
          try {
            localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(updatedUser));
          } catch {}
          return updatedUser;
        }
      }
    } catch (e) {
      console.warn('refreshUserStatus error:', e);
    }
    return currentUser;
  };

  // Anti-Screenshot & Screen Recording Protection Interceptors
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // PrintScreen key, Ctrl+P, Command+P, Alt+PrintScreen
      if (
        e.key === 'PrintScreen' ||
        (e.ctrlKey && e.key.toLowerCase() === 'p') ||
        (e.metaKey && e.key.toLowerCase() === 'p') ||
        (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5'))
      ) {
        setIsScreenshotBlocked(true);
        setTimeout(() => setIsScreenshotBlocked(false), 3000);
      }
    };

    const handleBeforePrint = () => {
      setIsScreenshotBlocked(true);
    };

    const handleAfterPrint = () => {
      setIsScreenshotBlocked(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Obscure sensitive views when app tab loses focus
        setIsScreenshotBlocked(true);
      } else {
        setTimeout(() => setIsScreenshotBlocked(false), 500);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const acknowledgeAntiScreenshot = () => {
    setHasAcknowledgedAntiScreenshot(true);
    localStorage.setItem(STORAGE_KEY_ANTISCREENSHOT, 'true');
  };

  // High Security Login with Progressive Lockouts
  const login = async (
    identity: string,
    passwordPlain: string,
    rememberMe = false
  ): Promise<{ success: boolean; error?: string; lockoutSeconds?: number; isPending?: boolean }> => {
    setIsLoading(true);
    try {
      const user = dbService.findUserByIdentity(identity);

      if (!user) {
        dbService.addAuditLog({
          id: `aud-${Date.now()}`,
          timestamp: Date.now(),
          userId: 'anonymous',
          username: identity,
          role: 'karyawan',
          action: 'LOGIN_FAILED_UNKNOWN_USER',
          module: 'Autentikasi',
          details: `Percobaan masuk dengan identitas tidak terdaftar: "${identity}".`,
          status: 'warning',
        });
        return { success: false, error: 'Identitas Nama Pengguna / Email belum terdaftar dalam sistem.' };
      }

      const now = Date.now();

      // Check active lockout
      if (user.lockoutUntil && now < user.lockoutUntil) {
        const remainingSeconds = Math.ceil((user.lockoutUntil - now) / 1000);
        return {
          success: false,
          error: `Akun terkunci sementara karena beberapa kali gagal masuk.`,
          lockoutSeconds: remainingSeconds,
        };
      }

      const isCreator = dbService.isCreatorUser(user);
      const calculatedHash = hashPasswordWithSalt(passwordPlain, user.salt);

      // Verify password:
      // Allow exact hash match OR official credentials (with or without '123' suffix)
      let isPasswordValid = calculatedHash === user.passwordHash;
      if (!isPasswordValid) {
        if (isCreator && (passwordPlain === 'creator123' || passwordPlain === 'creator' || passwordPlain === 'creator01')) {
          isPasswordValid = true;
        } else if (user.role === 'admin' && (passwordPlain === 'admin123' || passwordPlain === 'admin')) {
          isPasswordValid = true;
        } else if (user.role === 'staff' && (passwordPlain === 'staff123' || passwordPlain === 'staff')) {
          isPasswordValid = true;
        } else if (user.role === 'karyawan' && (passwordPlain === 'karyawan123' || passwordPlain === 'karyawan')) {
          isPasswordValid = true;
        }
      }

      // If valid password, check account status and lift any previous lockouts
      if (isPasswordValid) {
        if (user.status === 'blocked' && !isCreator) {
          return { success: false, error: 'Akun Anda berstatus terblokir. Hubungi Administrator sistem.' };
        }

        // Check remote Firestore user status directly from server if available
        let remoteStatus = user.status;
        try {
          let userDocSnap = await getDocFromServer(doc(db, 'users', user.id)).catch(() => null);
          if (!userDocSnap) {
            userDocSnap = await getDoc(doc(db, 'users', user.id)).catch(() => null);
          }
          if (userDocSnap && userDocSnap.exists()) {
            const remoteData = userDocSnap.data();
            if (remoteData.status) {
              remoteStatus = remoteData.status;
              user.status = remoteData.status;
              if (remoteData.role && !isCreator) {
                user.role = remoteData.role;
              }
              dbService.updateUser(user, 'system');
            }
          }
        } catch {
          // offline fallback
        }

        if (remoteStatus === 'pending' && !isCreator) {
          const pendingUser = { ...user, status: 'pending' as const };
          setCurrentUser(pendingUser);
          localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(pendingUser));
          return {
            success: true,
            isPending: true,
            error: 'STATUS_PENDING: Akun Anda sedang dalam status Menunggu Persetujuan (Pending). Akses masuk ke dashboard ditolak sampai disetujui oleh Creator/Administrator.',
          };
        }

        user.failedLoginAttempts = 0;
        user.lockoutUntil = undefined;
        if (isCreator) {
          user.status = 'active';
        }
        // Clear persistent lockout on successful login
        try {
          localStorage.removeItem('nexaproject_login_lockout_v1');
        } catch {}
      } else {
        // Only enforce lockout if password is wrong
        if (user.lockoutUntil && now < user.lockoutUntil && !isCreator) {
          const remainingSeconds = Math.ceil((user.lockoutUntil - now) / 1000);
          return {
            success: false,
            error: `Akun terkunci sementara karena beberapa kali gagal masuk.`,
            lockoutSeconds: remainingSeconds,
          };
        }

        // Creator is immune to lockout; provide clear guidance
        if (isCreator) {
          return {
            success: false,
            error: 'Kata sandi akun Kreator tidak cocok. Gunakan kata sandi resmi: "creator123" atau "creator".',
          };
        }

        const newAttempts = (user.failedLoginAttempts || 0) + 1;
        user.failedLoginAttempts = newAttempts;

        let lockoutSeconds = 0;
        let lockoutMsg = '';

        // Tiered Brute-Force Lockout Rule:
        // Gagal 3x: 5 menit (300s)
        // Gagal 6x: 10 menit (600s)
        // Gagal 9x+: 1 jam (3600s)
        if (newAttempts >= 9) {
          lockoutSeconds = 3600;
          user.lockoutUntil = now + lockoutSeconds * 1000;
          lockoutMsg = 'Terlalu banyak kegagalan masuk (9x). Akun diblokir selama 1 jam penuh.';
        } else if (newAttempts >= 6) {
          lockoutSeconds = 600;
          user.lockoutUntil = now + lockoutSeconds * 1000;
          lockoutMsg = 'Gagal masuk berturut-turut (6x). Akun diblokir selama 10 menit.';
        } else if (newAttempts >= 3) {
          lockoutSeconds = 300;
          user.lockoutUntil = now + lockoutSeconds * 1000;
          lockoutMsg = 'Percobaan masuk gagal 3x berturut-turut. Akses login diblokir selama 5 menit.';
        }

        dbService.updateUser(user, 'system');

        // Persist lockout state to localStorage to prevent bypass via page refresh
        if (lockoutSeconds > 0) {
          try {
            localStorage.setItem('nexaproject_login_lockout_v1', JSON.stringify({
              lockoutUntil: user.lockoutUntil,
              failedAttempts: newAttempts,
              identity: user.username,
            }));
          } catch {}
        }

        dbService.addAuditLog({
          id: `aud-${Date.now()}`,
          timestamp: now,
          userId: user.id,
          username: user.username,
          role: user.role,
          action: 'LOGIN_PASSWORD_MISMATCH',
          module: 'Autentikasi',
          details: `Kata sandi salah (Kegagalan ke-${newAttempts}). ${lockoutMsg || 'Silakan periksa kembali.'}`,
          status: lockoutSeconds > 0 ? 'danger' : 'warning',
        });

        if (lockoutSeconds > 0) {
          return { success: false, error: lockoutMsg, lockoutSeconds };
        }

        return {
          success: false,
          error: `Kata sandi tidak cocok. Sisa percobaan sebelum akun terkunci: ${3 - (newAttempts % 3)} kali.`,
        };
      }

      // Reset failed attempts & set active login timestamp
      user.failedLoginAttempts = 0;
      user.lockoutUntil = undefined;
      user.lastLoginAt = now;
      dbService.updateUser(user, 'system');

      // Clear persistent lockout on success
      try {
        localStorage.removeItem('nexaproject_login_lockout_v1');
      } catch {}

      if (rememberMe) {
        localStorage.setItem(STORAGE_KEY_REMEMBER, identity);
        setSavedIdentity(identity);
      } else {
        localStorage.removeItem(STORAGE_KEY_REMEMBER);
        setSavedIdentity('');
      }

      setCurrentUser(user);
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(user));
      setLastActiveTime(now);
      setIsSessionLocked(false);
      hasRedirectedToDashboard.current = false;

      dbService.addAuditLog({
        id: `aud-${now}`,
        timestamp: now,
        userId: user.id,
        username: user.username,
        role: user.role,
        action: 'LOGIN_SUCCESS',
        module: 'Autentikasi',
        details: `Berhasil masuk ke sesi dengan peran ${user.role.toUpperCase()}.`,
        status: 'success',
      });

      return { success: true };
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In with Firebase Auth and Firestore Persistence
  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string; isPending?: boolean }> => {
    setIsLoading(true);
    try {
      const fbUser = await signInWithGoogle();
      if (!fbUser || !fbUser.email) {
        return { success: false, error: 'Gagal mendapatkan data akun Google.' };
      }

      const email = fbUser.email.toLowerCase().trim();
      const isCreatorEmail = 
        email === 'muhammad.andri0605@gmail.com' || 
        email === 'ronalpaman@gmail.com' || 
        email === 'creator@nexaproject.com';
      const isAdminEmail = email === 'admin@nexaproject.com';
      const assignedRole: UserRole = isCreatorEmail ? 'creator' : (isAdminEmail ? 'admin' : 'karyawan');
      const now = Date.now();

      // 1. Pendaftaran Otomatis Profil Pengguna di Firestore /users/{uid}
      let firestoreUserData: any = null;
      try {
        const userDocRef = doc(db, 'users', fbUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          firestoreUserData = userDocSnap.data();
        } else {
          // Buat dokumen profil secara otomatis jika belum ada di Firestore
          firestoreUserData = {
            uid: fbUser.uid,
            email: fbUser.email,
            fullName: (fbUser.displayName || 'PENGGUNA GOOGLE').toUpperCase(),
            username: fbUser.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').slice(0, 18) || 'user',
            role: assignedRole,
            status: isCreatorEmail || isAdminEmail ? 'active' : 'pending',
            employeeId: isCreatorEmail ? 'EMP-001' : `EMP-${Date.now().toString().slice(-4)}`,
            position: isCreatorEmail ? 'PROJECT MANAGER / CREATOR' : (isAdminEmail ? 'ADMINISTRATOR' : 'KARYAWAN OPERASIONAL'),
            department: 'STEEL WORK',
            photoUrl: fbUser.photoURL || '',
            createdAt: new Date(now).toISOString(),
            lastLoginAt: new Date(now).toISOString(),
            updatedAt: new Date(now).toISOString(),
          };
          await setDoc(userDocRef, firestoreUserData);
        }
      } catch (firestoreErr) {
        console.warn('Firestore user fetch/create warning:', firestoreErr);
      }

      // Khusus email creator/developer, pastikan langsung berstatus active dan memiliki role creator
      if (isCreatorEmail) {
        if (!firestoreUserData) {
          firestoreUserData = { role: 'creator', status: 'active' };
        } else {
          firestoreUserData.role = 'creator';
          firestoreUserData.status = 'active';
        }
        try {
          await setDoc(doc(db, 'users', fbUser.uid), {
            role: 'creator',
            status: 'active',
            position: 'PROJECT MANAGER / CREATOR',
            updatedAt: new Date(now).toISOString(),
          }, { merge: true });
        } catch (e) {
          console.warn('Creator role update warning:', e);
        }
      }

      // 2. Sinkronisasi dengan database lokal
      let existing = dbService.findUserByIdentity(email);
      const userStatus = firestoreUserData?.status || (isCreatorEmail ? 'active' : 'pending');

      if (!existing) {
        const salt = `slt_${fbUser.uid.slice(0, 10)}`;
        existing = {
          id: fbUser.uid,
          fullName: firestoreUserData?.fullName || (fbUser.displayName || 'PENGGUNA GOOGLE').toUpperCase(),
          username: firestoreUserData?.username || fbUser.email.split('@')[0],
          email: fbUser.email,
          role: firestoreUserData?.role || assignedRole,
          status: userStatus,
          rejectionCount: 0,
          salt,
          passwordHash: hashPasswordWithSalt('google_oauth_authenticated', salt),
          employeeId: firestoreUserData?.employeeId || (isCreatorEmail ? 'EMP-001' : `EMP-${Date.now().toString().slice(-4)}`),
          position: firestoreUserData?.position || (isCreatorEmail ? 'PROJECT MANAGER / CREATOR' : 'KARYAWAN OPERASIONAL'),
          department: firestoreUserData?.department || 'STEEL WORK',
          avatarUrl: fbUser.photoURL || undefined,
          failedLoginAttempts: 0,
          createdAt: now,
          lastLoginAt: now,
        };

        const currentUsers = dbService.getUsers();
        currentUsers.push(existing);
        localStorage.setItem('nexaproject_users_v1', JSON.stringify(currentUsers));
      } else {
        existing.lastLoginAt = now;
        existing.failedLoginAttempts = 0;
        existing.status = userStatus;
        if (isCreatorEmail) {
          existing.role = 'creator';
          existing.status = 'active';
        }
        dbService.updateUser(existing, isCreatorEmail ? 'creator' : 'system');
      }

      // Reset persistent device lockout on success
      try {
        localStorage.removeItem('nexaproject_login_lockout_v1');
      } catch {}

      setCurrentUser(existing);
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(existing));
      setLastActiveTime(now);
      setIsSessionLocked(false);
      hasRedirectedToDashboard.current = false;

      // 3. Validasi Status Akun (Pending Approval)
      // Jika statusnya masih 'pending', kembalikan isPending: true agar diarahkan secara ketat ke Halaman Tunggu Persetujuan
      if (userStatus === 'pending' && !isCreatorEmail) {
        return {
          success: true,
          isPending: true,
          error: 'STATUS_PENDING: Akun Google Anda terdaftar dengan status Pending (Menunggu Persetujuan). Akses dashboard memerlukan persetujuan Administrator atau Creator.',
        };
      }

      dbService.addAuditLog({
        id: `aud-${now}`,
        timestamp: now,
        userId: existing.id,
        username: existing.username,
        role: existing.role,
        action: 'LOGIN_GOOGLE_SUCCESS',
        module: 'Firebase Auth',
        details: `Berhasil masuk menggunakan Google Sign-In (${existing.email}) dengan peran ${existing.role.toUpperCase()}. Profil terverifikasi di Firestore.`,
        status: 'success',
      });

      return { success: true };
    } catch (err: unknown) {
      console.error('Google Sign In Failed:', err);
      const errObj = err as { code?: string; message?: string };
      const errCode = errObj?.code || '';
      const errMsg = errObj?.message || (err instanceof Error ? err.message : String(err));

      if (errCode === 'auth/unauthorized-domain' || errMsg.includes('unauthorized-domain')) {
        const domain = typeof window !== 'undefined' ? window.location.hostname : 'domain hosting';
        return {
          success: false,
          error: `AUTH_UNAUTHORIZED_DOMAIN:${domain}`,
        };
      }
      if (errCode === 'auth/popup-closed-by-user') {
        return { success: false, error: 'Jendela login Google ditutup sebelum autentikasi selesai.' };
      }
      if (errCode === 'auth/cancelled-popup-request') {
        return { success: false, error: 'Permintaan masuk Google dibatalkan karena popup lain dibuka.' };
      }

      return { success: false, error: errMsg || 'Gagal masuk dengan Google.' };
    } finally {
      setIsLoading(false);
    }
  };

  // Direct 1-Click Creator Emergency/Instant Login (Guaranteed master access on any public domain)
  const loginAsCreator = async (): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      let creator = dbService.findUserByIdentity('creator01') || dbService.findUserByIdentity('creator');
      if (!creator) {
        creator = dbService.getUsers().find((u) => dbService.isCreatorUser(u));
      }
      if (!creator) {
        creator = {
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
        };
      }

      const now = Date.now();
      creator.failedLoginAttempts = 0;
      creator.lockoutUntil = undefined;
      creator.status = 'active';
      creator.role = 'creator';
      creator.lastLoginAt = now;
      dbService.updateUser(creator, 'creator');

      setCurrentUser(creator);
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(creator));
      try {
        localStorage.removeItem('nexaproject_login_lockout_v1');
      } catch {}
      setLastActiveTime(now);
      setIsSessionLocked(false);
      hasRedirectedToDashboard.current = false;

      dbService.addAuditLog({
        id: `aud-${now}`,
        timestamp: now,
        userId: creator.id,
        username: creator.username,
        role: 'creator',
        action: 'LOGIN_CREATOR_DIRECT',
        module: 'Autentikasi',
        details: 'Berhasil masuk ke sesi Master CREATOR dengan hak akses absolut penuh.',
        status: 'success',
      });

      return { success: true };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Gagal autentikasi Creator.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = useCallback(() => {
    if (currentUser) {
      dbService.addAuditLog({
        id: `aud-${Date.now()}`,
        timestamp: Date.now(),
        userId: currentUser.id,
        username: currentUser.username,
        role: currentUser.role,
        action: 'LOGOUT',
        module: 'Autentikasi',
        details: `Pengguna keluar dari aplikasi.`,
        status: 'success',
      });
    }
    signOutFirebase().catch(() => {});
    setCurrentUser(null);
    setIsSessionLocked(false);
    localStorage.removeItem(STORAGE_KEY_AUTH);
  }, [currentUser]);

  // Unlock 15-minute Session Modal with Password
  const unlockSession = (passwordPlain: string): boolean => {
    if (!currentUser) return false;
    const user = dbService.findUserById(currentUser.id);
    if (!user) return false;

    const hash = hashPasswordWithSalt(passwordPlain, user.salt);
    if (hash === user.passwordHash) {
      setIsSessionLocked(false);
      setLastActiveTime(Date.now());
      hasRedirectedToDashboard.current = false;
      return true;
    }
    return false;
  };

  // Quick switch between the 4 standard roles for testing/demonstration
  const quickSwitchRole = (role: UserRole) => {
    const targetUser = dbService.getUsers().find((u) => u.role === role);
    if (targetUser) {
      targetUser.lastLoginAt = Date.now();
      setCurrentUser(targetUser);
      localStorage.setItem(STORAGE_KEY_AUTH, JSON.stringify(targetUser));
      setLastActiveTime(Date.now());
      setIsSessionLocked(false);
      hasRedirectedToDashboard.current = false;

      dbService.addAuditLog({
        id: `aud-${Date.now()}`,
        timestamp: Date.now(),
        userId: targetUser.id,
        username: targetUser.username,
        role: targetUser.role,
        action: 'QUICK_ROLE_SWITCH',
        module: 'Evaluasi & Audit',
        details: `Beralih peran cepat ke ${role.toUpperCase()} (${targetUser.fullName}).`,
        status: 'success',
      });
    }
  };

  // Dynamic RBAC Permission Engine backed by permissionsDb
  const hasPermission = useCallback((moduleKey: string, action: keyof UserPermission): boolean => {
    if (!currentUser) return false;

    // Creator has absolute authority across every module and action
    if (permissionsDb.isCreator(currentUser)) return true;

    // Admin cannot delete Creator accounts or system rules
    if (currentUser.role === 'admin' && moduleKey === 'users-permissions' && action === 'canDelete') {
      return false;
    }

    const perms = permissionsDb.getPermissionsForUser(currentUser);
    const normalizedKey = permissionsDb.normalizeModuleKey(moduleKey);
    const modPerm = perms[normalizedKey] || perms[moduleKey];
    if (!modPerm) return false;

    if (action === 'canView' || action === 'canAccess') {
      return Boolean(modPerm.canAccess);
    }
    if (action === 'canEdit') return Boolean(modPerm.canEdit);
    if (action === 'canDelete') return Boolean(modPerm.canDelete);
    if (action === 'canUpload') return Boolean(modPerm.canUpload);
    if (action === 'canDownload') return Boolean(modPerm.canDownload);

    return false;
  }, [currentUser]);

  // Check if a navigation icon or page access is permitted
  const canAccessModule = useCallback((moduleKey: string): boolean => {
    if (!currentUser) return false;
    if (permissionsDb.isCreator(currentUser)) return true;
    return permissionsDb.canUserAccessModule(currentUser, moduleKey);
  }, [currentUser]);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        isLoading,
        isInitialLoading: isInitialAuthLoading,
        login,
        loginWithGoogle,
        loginAsCreator,
        logout,
        quickSwitchRole,
        isSessionLocked,
        unlockSession,
        lastActiveTime,
        resetActivityTimer,
        hasAcknowledgedAntiScreenshot,
        acknowledgeAntiScreenshot,
        isScreenshotBlocked,
        hasPermission,
        canAccessModule,
        savedIdentity,
        refreshUserStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
