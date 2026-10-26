import { AppSettings, DEFAULT_SETTINGS, ServerStatus } from '../types/settings';
import { db } from './firebase';
import { doc, getDoc, getDocFromServer, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';

const STORAGE_KEY = 'nexaproject_app_settings_v2';
const FIRESTORE_DOC = 'app_config';
const FIRESTORE_COLLECTION = 'system_settings';
const FIRESTORE_SYSTEM_SETTINGS_DOC = 'system';
const FIRESTORE_SETTINGS_COLLECTION = 'settings';

class SettingsDbService {
  private currentSettings: AppSettings = DEFAULT_SETTINGS;
  private activeListeners: Unsubscribe[] = [];

  constructor() {
    this.loadFromLocalStorage();
    this.syncFromFirestore();
  }

  public getSettings(): AppSettings {
    return this.currentSettings;
  }

  public loadFromLocalStorage(): AppSettings {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.currentSettings = {
          ...DEFAULT_SETTINGS,
          ...parsed,
          colorTheme: { ...DEFAULT_SETTINGS.colorTheme, ...(parsed.colorTheme || {}) },
          fontConfig: { ...DEFAULT_SETTINGS.fontConfig, ...(parsed.fontConfig || {}) },
          appLogo: { ...DEFAULT_SETTINGS.appLogo, ...(parsed.appLogo || {}) },
          serverConfig: { ...DEFAULT_SETTINGS.serverConfig, ...(parsed.serverConfig || {}) },
          backgroundConfig: { ...DEFAULT_SETTINGS.backgroundConfig, ...(parsed.backgroundConfig || {}) },
        };
      }
    } catch (e) {
      console.warn('Error reading settings from localStorage:', e);
      this.currentSettings = DEFAULT_SETTINGS;
    }
    return this.currentSettings;
  }

  public async syncFromFirestore(): Promise<AppSettings> {
    try {
      const snap = await getDoc(doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC));
      if (snap.exists()) {
        const data = snap.data() as Partial<AppSettings>;
        this.applyRemoteData(data);
      }
    } catch (e) {
      console.warn('Firestore settings sync skipped / offline:', e);
    }
    return this.currentSettings;
  }

  /**
   * Real-time listener for maintenance & app settings
   * Listens to both /system_settings/app_config and /settings/system
   */
  public subscribeToSettings(callback: (settings: AppSettings) => void): () => void {
    try {
      // Primary listener: /system_settings/app_config
      const unsubPrimary = onSnapshot(
        doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as Partial<AppSettings>;
            this.applyRemoteData(data);
            callback(this.currentSettings);
          }
        },
        (error) => {
          console.warn('Real-time settings listener warning (primary):', error);
        }
      );

      // Secondary/Alternative listener: /settings/system
      const unsubSecondary = onSnapshot(
        doc(db, FIRESTORE_SETTINGS_COLLECTION, FIRESTORE_SYSTEM_SETTINGS_DOC),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data && (data.serverConfig || data.status)) {
              const serverConfigUpdate = data.serverConfig || {
                status: data.status,
                message: data.message || '',
                estimatedEnd: data.estimatedEnd || '',
                updatedAt: data.updatedAt || Date.now(),
                updatedBy: data.updatedBy || 'System',
              };
              this.currentSettings = {
                ...this.currentSettings,
                serverConfig: {
                  ...this.currentSettings.serverConfig,
                  ...serverConfigUpdate,
                },
              };
              try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentSettings));
              } catch {}
              callback(this.currentSettings);
            }
          }
        },
        (error) => {
          console.warn('Real-time settings listener warning (secondary):', error);
        }
      );

      const unsubCombined = () => {
        unsubPrimary();
        unsubSecondary();
      };

      this.activeListeners.push(unsubCombined);
      return unsubCombined;
    } catch (err) {
      console.warn('Error setting up settings subscriptions:', err);
      return () => {};
    }
  }

  /**
   * Direct server check bypassing local Firestore & browser cache (Network First)
   */
  public async fetchServerStatusDirectly(): Promise<AppSettings> {
    try {
      // Force fetch directly from Firebase servers over network
      let remoteData: Partial<AppSettings> | null = null;
      try {
        const snap = await getDocFromServer(doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC));
        if (snap.exists()) {
          remoteData = snap.data() as Partial<AppSettings>;
        }
      } catch {
        // Fallback if getDocFromServer is rejected by environment
        const snap = await getDoc(doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC));
        if (snap.exists()) {
          remoteData = snap.data() as Partial<AppSettings>;
        }
      }

      if (remoteData) {
        this.applyRemoteData(remoteData);
      } else {
        // Check secondary doc /settings/system
        try {
          const secSnap = await getDocFromServer(doc(db, FIRESTORE_SETTINGS_COLLECTION, FIRESTORE_SYSTEM_SETTINGS_DOC));
          if (secSnap.exists()) {
            const data = secSnap.data();
            if (data?.serverConfig || data?.status) {
              this.currentSettings = {
                ...this.currentSettings,
                serverConfig: {
                  ...this.currentSettings.serverConfig,
                  status: data.status || data.serverConfig?.status || this.currentSettings.serverConfig.status,
                  message: data.message || data.serverConfig?.message || this.currentSettings.serverConfig.message,
                  estimatedEnd: data.estimatedEnd || data.serverConfig?.estimatedEnd || this.currentSettings.serverConfig.estimatedEnd,
                  updatedAt: data.updatedAt || Date.now(),
                },
              };
              localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentSettings));
            }
          }
        } catch {}
      }
    } catch (e) {
      console.warn('Direct server check failed / offline:', e);
    }
    return this.currentSettings;
  }

  private applyRemoteData(data: Partial<AppSettings>) {
    this.currentSettings = {
      ...this.currentSettings,
      ...data,
      colorTheme: { ...this.currentSettings.colorTheme, ...(data.colorTheme || {}) },
      fontConfig: { ...this.currentSettings.fontConfig, ...(data.fontConfig || {}) },
      appLogo: { ...this.currentSettings.appLogo, ...(data.appLogo || {}) },
      serverConfig: { ...this.currentSettings.serverConfig, ...(data.serverConfig || {}) },
      backgroundConfig: { ...this.currentSettings.backgroundConfig, ...(data.backgroundConfig || {}) },
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentSettings));
    } catch {}
  }

  public async saveSettings(newSettings: AppSettings): Promise<AppSettings> {
    this.currentSettings = { ...newSettings };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentSettings));
    } catch {}

    try {
      await Promise.all([
        setDoc(doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC), this.currentSettings, { merge: true }),
        setDoc(doc(db, FIRESTORE_SETTINGS_COLLECTION, FIRESTORE_SYSTEM_SETTINGS_DOC), {
          status: this.currentSettings.serverConfig.status,
          serverConfig: this.currentSettings.serverConfig,
          appName: this.currentSettings.appName,
          updatedAt: Date.now(),
        }, { merge: true }).catch(() => {}),
      ]);
    } catch (e) {
      console.warn('Firestore settings write warning:', e);
    }
    return this.currentSettings;
  }

  public async setServerStatus(
    status: ServerStatus, 
    message?: string, 
    estimatedEnd?: string, 
    updatedBy?: string
  ): Promise<AppSettings> {
    const updated: AppSettings = {
      ...this.currentSettings,
      serverConfig: {
        ...this.currentSettings.serverConfig,
        status,
        message: message !== undefined ? message : this.currentSettings.serverConfig.message,
        estimatedEnd: estimatedEnd !== undefined ? estimatedEnd : this.currentSettings.serverConfig.estimatedEnd,
        updatedAt: Date.now(),
        updatedBy: updatedBy || 'Creator',
      },
    };
    return this.saveSettings(updated);
  }

  public async resetToDefault(): Promise<AppSettings> {
    this.currentSettings = { ...DEFAULT_SETTINGS };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.currentSettings));
    } catch {}
    try {
      await Promise.all([
        setDoc(doc(db, FIRESTORE_COLLECTION, FIRESTORE_DOC), DEFAULT_SETTINGS, { merge: true }),
        setDoc(doc(db, FIRESTORE_SETTINGS_COLLECTION, FIRESTORE_SYSTEM_SETTINGS_DOC), {
          status: DEFAULT_SETTINGS.serverConfig.status,
          serverConfig: DEFAULT_SETTINGS.serverConfig,
          updatedAt: Date.now(),
        }, { merge: true }).catch(() => {}),
      ]);
    } catch (e) {
      console.warn('Firestore reset warning:', e);
    }
    return this.currentSettings;
  }
}

export const settingsDb = new SettingsDbService();
