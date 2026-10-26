import React, { useState } from 'react';
import { 
  Palette, 
  Type, 
  Tag, 
  Image as ImageIcon, 
  Server, 
  Check, 
  Save, 
  RotateCcw, 
  Upload, 
  Sun, 
  Moon, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Ship, 
  Anchor, 
  Layers, 
  Shield, 
  Cog, 
  Building2, 
  Lock, 
  Sparkles,
  Sliders,
  Power,
  ImageUp,
  SlidersHorizontal,
  Trash2
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { 
  COLOR_PRESETS, 
  ColorPreset, 
  FontFamilyChoice, 
  FontScaleChoice, 
  PresetIconChoice, 
  LogoShape, 
  ServerStatus,
  SOLID_GRADIENT_PRESETS,
  WALLPAPER_PRESETS,
  DEFAULT_BACKGROUND,
  BackgroundConfig
} from '../../types/settings';
import { AppLogo } from '../../components/common/AppLogo';
import { AppView } from '../../types/navigation';

interface AppSettingsPageProps {
  onNavigate?: (view: AppView) => void;
}

export const AppSettingsPage: React.FC<AppSettingsPageProps> = ({ onNavigate }) => {
  const { 
    theme, 
    setTheme, 
    language, 
    appSettings, 
    updateSettings, 
    resetSettings, 
    setServerStatus 
  } = useTheme();
  
  const { currentUser } = useAuth();
  const isCreator = currentUser?.role === 'creator' || 
    currentUser?.email === 'muhammad.andri0605@gmail.com' || 
    currentUser?.email === 'creator@nexaproject.com';

  // Active Tab: color, font, name, logo, background, server (Creator only)
  const [activeTab, setActiveTab] = useState<'color' | 'font' | 'name' | 'logo' | 'background' | 'server'>('color');

  // Local Form Draft State
  const [selectedColorPreset, setSelectedColorPreset] = useState<ColorPreset>(appSettings.colorTheme.preset);
  const [customPrimaryHex, setCustomPrimaryHex] = useState(appSettings.colorTheme.primaryHex);
  const [customHoverHex, setCustomHoverHex] = useState(appSettings.colorTheme.primaryHoverHex);

  const [selectedFont, setSelectedFont] = useState<FontFamilyChoice>(appSettings.fontConfig.family);
  const [selectedScale, setSelectedScale] = useState<FontScaleChoice>(appSettings.fontConfig.scale);

  const [appNameInput, setAppNameInput] = useState(appSettings.appName);
  const [appSubtitleInput, setAppSubtitleInput] = useState(appSettings.appSubtitle);
  const [appTaglineInput, setAppTaglineInput] = useState(appSettings.appTagline);

  const [logoType, setLogoType] = useState(appSettings.appLogo.type);
  const [presetIcon, setPresetIcon] = useState<PresetIconChoice>(appSettings.appLogo.presetIcon);
  const [customLogoUrl, setCustomLogoUrl] = useState(appSettings.appLogo.customUrl);
  const [logoShape, setLogoShape] = useState<LogoShape>(appSettings.appLogo.shape);

  // Background customization state
  const [backgroundConfigDraft, setBackgroundConfigDraft] = useState<BackgroundConfig>(
    appSettings.backgroundConfig || DEFAULT_BACKGROUND
  );
  const [customSolidInput, setCustomSolidInput] = useState<string>('#020617');
  const [customUploadError, setCustomUploadError] = useState<string | null>(null);

  // Server maintenance state
  const [serverStatusChoice, setServerStatusChoice] = useState<ServerStatus>(appSettings.serverConfig.status);
  const [maintenanceMessage, setMaintenanceMessage] = useState(appSettings.serverConfig.message);
  const [estimatedEnd, setEstimatedEnd] = useState(appSettings.serverConfig.estimatedEnd || 'Segera');

  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Handle color preset selection
  const handleSelectColorPreset = (presetKey: ColorPreset) => {
    setSelectedColorPreset(presetKey);
    if (presetKey !== 'custom') {
      setCustomPrimaryHex(COLOR_PRESETS[presetKey].primaryHex);
      setCustomHoverHex(COLOR_PRESETS[presetKey].primaryHoverHex);
    }
  };

  // Handle Image Upload for Logo
  const handleLogoFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran berkas logo terlalu besar. Maksimal 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setCustomLogoUrl(base64);
      setLogoType('custom');
    };
    reader.readAsDataURL(file);
  };

  // Handle Image Upload for Custom Wallpaper
  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setCustomUploadError('Ukuran gambar latar belakang maksimal 5MB.');
      return;
    }

    setCustomUploadError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setBackgroundConfigDraft({
        mode: 'custom',
        id: `custom-${Date.now()}`,
        name: `Unggahan Kustom (${file.name.slice(0, 16)})`,
        value: base64,
        overlayOpacity: 0.75,
        blurAmount: 1,
      });
    };
    reader.readAsDataURL(file);
  };

  // Save Background specifically
  const handleSaveBackground = async () => {
    setIsSaving(true);
    try {
      await updateSettings({
        backgroundConfig: backgroundConfigDraft,
      });
      setSaveSuccess('Tema latar belakang (Background) berhasil disimpan dan diterapkan secara global!');
      setTimeout(() => setSaveSuccess(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Save All / Section
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const activeColor = selectedColorPreset === 'custom' 
        ? {
            preset: 'custom' as ColorPreset,
            primaryHex: customPrimaryHex,
            primaryHoverHex: customHoverHex,
            name: 'Warna Kustom',
          }
        : COLOR_PRESETS[selectedColorPreset];

      await updateSettings({
        colorTheme: activeColor,
        fontConfig: {
          family: selectedFont,
          scale: selectedScale,
        },
        appName: appNameInput.trim() || 'NEXAPROJECT',
        appSubtitle: appSubtitleInput.trim(),
        appTagline: appTaglineInput.trim(),
        appLogo: {
          type: logoType,
          presetIcon,
          customUrl: customLogoUrl,
          shape: logoShape,
        },
        backgroundConfig: backgroundConfigDraft,
      });

      // If Creator and tab is server, save server status
      if (isCreator && activeTab === 'server') {
        await setServerStatus(
          serverStatusChoice,
          maintenanceMessage.trim(),
          estimatedEnd.trim(),
          currentUser?.fullName || 'Creator'
        );
      }

      setSaveSuccess('Seluruh konfigurasi pengaturan aplikasi berhasil disimpan & diterapkan.');
      setTimeout(() => setSaveSuccess(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Quick Server Save for Tab 5
  const handleSaveServerStatus = async () => {
    if (!isCreator) return;
    setIsSaving(true);
    try {
      await setServerStatus(
        serverStatusChoice,
        maintenanceMessage.trim(),
        estimatedEnd.trim(),
        currentUser?.fullName || 'Creator'
      );
      setSaveSuccess(
        serverStatusChoice === 'active'
          ? 'Server berhasil DIAKTIFKAN. Seluruh pengguna dapat mengakses sistem kembali.'
          : 'Server berhasil DIUBAH KE MODE MAINTENANCE. Akses non-creator ditutup sementara.'
      );
      setTimeout(() => setSaveSuccess(null), 4000);
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default
  const handleResetToDefault = async () => {
    if (window.confirm('Kembalikan semua pengaturan warna, font, nama, logo, dan background aplikasi ke standar bawaan pabrik?')) {
      await resetSettings();
      setSelectedColorPreset('blue');
      setCustomPrimaryHex(COLOR_PRESETS.blue.primaryHex);
      setCustomHoverHex(COLOR_PRESETS.blue.primaryHoverHex);
      setSelectedFont('plus-jakarta');
      setSelectedScale('normal');
      setAppNameInput('NEXAPROJECT');
      setAppSubtitleInput('Shipyard Enterprise');
      setAppTaglineInput('Sistem Operasional Galangan Kapal & Manajemen Proyek Terintegrasi');
      setLogoType('preset');
      setPresetIcon('ship');
      setCustomLogoUrl('');
      setLogoShape('rounded');
      setBackgroundConfigDraft(DEFAULT_BACKGROUND);
      setSaveSuccess('Pengaturan berhasil dikembalikan ke standar awal.');
      setTimeout(() => setSaveSuccess(null), 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">
              <Sliders className="w-4 h-4" />
              <span>Sistem & Administrasi</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
              <span>Pengaturan Aplikasi</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Pusat kendali tema warna visual, tipografi font sistem, identitas merek, logo simbol galangan, kustomisasi wallpaper latar, dan status operasional server aplikasi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToDefault}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition flex items-center gap-1.5"
              title="Reset ke pengaturan awal"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Standar</span>
            </button>
            <button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-xl shadow-sm transition flex items-center gap-1.5 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {saveSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2.5 shadow-xs animate-in fade-in duration-150">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* Navigation Tabs (Sub Menus) */}
        <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-200/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <button
            onClick={() => setActiveTab('color')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'color'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>1. Tampilan Warna</span>
          </button>

          <button
            onClick={() => setActiveTab('font')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'font'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>2. Tipografi Font</span>
          </button>

          <button
            onClick={() => setActiveTab('name')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'name'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>3. Nama Aplikasi</span>
          </button>

          <button
            onClick={() => setActiveTab('logo')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'logo'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>4. Logo Aplikasi</span>
          </button>

          <button
            onClick={() => setActiveTab('background')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
              activeTab === 'background'
                ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>5. Background &amp; Wallpaper</span>
          </button>

          {/* CRITICAL: Tab Server HANYA BOLEH DI AKSES DAN DI TAMPILKAN OLEH ROLE CREATOR */}
          {isCreator && (
            <button
              onClick={() => setActiveTab('server')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeTab === 'server'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>6. Status Server &amp; Maintenance</span>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse ml-0.5" />
            </button>
          )}
        </div>

        {/* ================= TAB 1: PENGATURAN TAMPILAN WARNA ================= */}
        {activeTab === 'color' && (
          <div className="space-y-6">
            
            {/* Kecerahan Layar (Theme Mode) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Kecerahan Layar & Mode Suasana
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pilih mode kecerahan layar yang nyaman untuk pencahayaan ruang kontrol maupun galangan terbuka.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('terang')}
                  className={`p-4 rounded-xl border text-left transition flex items-center justify-between ${
                    theme === 'terang'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                      <Sun className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs">Mode Terang (Light)</p>
                      <p className="text-[11px] text-slate-500">Latar bersih putih</p>
                    </div>
                  </div>
                  {theme === 'terang' && <Check className="w-4 h-4 text-blue-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('gelap')}
                  className={`p-4 rounded-xl border text-left transition flex items-center justify-between ${
                    theme === 'gelap'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-800 text-blue-400 flex items-center justify-center">
                      <Moon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs">Mode Gelap (Dark)</p>
                      <p className="text-[11px] text-slate-500">Kontras tinggi hemat daya</p>
                    </div>
                  </div>
                  {theme === 'gelap' && <Check className="w-4 h-4 text-blue-600" />}
                </button>

                <button
                  type="button"
                  onClick={() => setTheme('redup')}
                  className={`p-4 rounded-xl border text-left transition flex items-center justify-between ${
                    theme === 'redup'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-emerald-950/60 text-emerald-400 flex items-center justify-center">
                      <Eye className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs">Mode Redup (Pelindung Mata)</p>
                      <p className="text-[11px] text-slate-500">Abu-abu lembut malam hari</p>
                    </div>
                  </div>
                  {theme === 'redup' && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              </div>
            </div>

            {/* Palet Warna Aksen Utama */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Palet Warna Aksen Sistem
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Warna aksen diterapkan pada tombol aksi, lencana status, highlight navigasi, dan indikator utama galangan.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {(['blue', 'emerald', 'amber', 'red', 'indigo', 'teal', 'slate'] as ColorPreset[]).map((presetKey) => {
                  const p = COLOR_PRESETS[presetKey];
                  const isSelected = selectedColorPreset === presetKey;
                  return (
                    <button
                      key={presetKey}
                      type="button"
                      onClick={() => handleSelectColorPreset(presetKey)}
                      className={`p-3 rounded-xl border text-left transition relative flex flex-col gap-2 ${
                        isSelected 
                          ? 'border-slate-900 dark:border-white ring-2 ring-offset-2 ring-slate-900 dark:ring-offset-slate-900' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div 
                          className="w-7 h-7 rounded-lg shadow-xs" 
                          style={{ backgroundColor: p.primaryHex }} 
                        />
                        {isSelected && <Check className="w-4 h-4 text-slate-900 dark:text-white font-bold" />}
                      </div>
                      <div>
                        <p className="font-bold text-xs">{p.name}</p>
                        <p className="text-[10px] font-mono text-slate-400">{p.primaryHex}</p>
                      </div>
                    </button>
                  );
                })}

                {/* Custom Color Picker */}
                <div className={`p-3 rounded-xl border flex flex-col justify-between gap-2 ${
                  selectedColorPreset === 'custom' 
                    ? 'border-slate-900 dark:border-white ring-2 ring-offset-2 ring-slate-900 dark:ring-offset-slate-900' 
                    : 'border-slate-200 dark:border-slate-800'
                }`}>
                  <div className="flex items-center justify-between">
                    <input
                      type="color"
                      value={customPrimaryHex}
                      onChange={(e) => {
                        setSelectedColorPreset('custom');
                        setCustomPrimaryHex(e.target.value);
                        setCustomHoverHex(e.target.value);
                      }}
                      className="w-7 h-7 rounded-lg cursor-pointer border-0 p-0"
                    />
                    {selectedColorPreset === 'custom' && <Check className="w-4 h-4 text-slate-900 dark:text-white" />}
                  </div>
                  <div>
                    <p className="font-bold text-xs">Pilih Warna Bebas (Hex)</p>
                    <input
                      type="text"
                      value={customPrimaryHex}
                      onChange={(e) => {
                        setSelectedColorPreset('custom');
                        setCustomPrimaryHex(e.target.value);
                      }}
                      placeholder="#2563eb"
                      className="w-full text-[10px] font-mono font-bold uppercase mt-1 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Live Preview Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Pratinjau Elemen dengan Warna Terpilih
              </h4>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  style={{ backgroundColor: customPrimaryHex }}
                  className="px-4 py-2 rounded-xl text-white font-bold text-xs shadow-xs"
                >
                  Tombol Aksi Utama
                </button>
                <span 
                  style={{ color: customPrimaryHex, borderColor: customPrimaryHex }} 
                  className="px-3 py-1.5 rounded-xl border text-xs font-bold bg-white dark:bg-slate-900"
                >
                  Lencana Status Proyek
                </span>
                <span 
                  style={{ backgroundColor: `${customPrimaryHex}20`, color: customPrimaryHex }}
                  className="px-3 py-1 rounded-full text-xs font-bold"
                >
                  Tag Informasi Galangan
                </span>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 2: PENGATURAN FONT ================= */}
        {activeTab === 'font' && (
          <div className="space-y-6">
            
            {/* Font Family Selection */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Pilihan Huruf Sistem (Font Family)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Pilih jenis huruf yang dioptimalkan untuk keterbacaan data tabel, spesifikasi kapal, dan laporan finansial.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  { id: 'plus-jakarta', name: 'Plus Jakarta Sans', desc: 'Standar Modern Indonesia (Default)', sample: 'NEXAPROJECT 2026' },
                  { id: 'inter', name: 'Inter UI', desc: 'Netral & Presisi Layar Digital', sample: 'NEXAPROJECT 2026' },
                  { id: 'roboto', name: 'Roboto', desc: 'Material Design Android', sample: 'NEXAPROJECT 2026' },
                  { id: 'montserrat', name: 'Montserrat', desc: 'Geometri Industri & Tegas', sample: 'NEXAPROJECT 2026' },
                  { id: 'poppins', name: 'Poppins', desc: 'Modern Bulat & Elegan', sample: 'NEXAPROJECT 2026' },
                  { id: 'outfit', name: 'Outfit', desc: 'Futuristik Galangan High-Tech', sample: 'NEXAPROJECT 2026' },
                  { id: 'jetbrains-mono', name: 'JetBrains Mono', desc: 'Monospace Rekayasa & Kode', sample: 'NEXAPROJECT 2026' },
                ].map((f) => {
                  const isSelected = selectedFont === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setSelectedFont(f.id as FontFamilyChoice)}
                      className={`p-4 rounded-xl border text-left transition flex flex-col justify-between gap-3 ${
                        isSelected 
                          ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/30' 
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-xs">{f.name}</p>
                          <p className="text-[10px] text-slate-400">{f.desc}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600 font-bold" />}
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-800 dark:text-slate-200">
                        {f.sample}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Font Scale Selection */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Skala Ukuran Huruf (Font Scale)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Sesuaikan kepadatan tampilan untuk perangkat desktop monitor lebar atau tablet portabel lapangan.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'compact', title: 'Kompak (92%)', desc: 'Tampilan padat data untuk kalkulasi & time sheet luas' },
                  { id: 'normal', title: 'Normal (100%)', desc: 'Ukuran ideal standar ergonomis mata' },
                  { id: 'large', title: 'Besar (108%)', desc: 'Tinggi keterbacaan untuk inspeksi lapangan luar ruangan' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedScale(s.id as FontScaleChoice)}
                    className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                      selectedScale === s.id
                        ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/30'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <p className="font-bold text-xs">{s.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{s.desc}</p>
                    </div>
                    {selectedScale === s.id && <Check className="w-4 h-4 text-blue-600 font-bold" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Typography Live Preview */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Pratinjau Dokumen & Angka Galangan
              </h4>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <p className="text-base font-extrabold text-slate-900 dark:text-white">
                  SURAT PERINTAH LEMBUR & REKAPITULASI BIAYA PROYEK KAPAL (SPL)
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Pekerjaan fabrikasi lambung kapal tugboat TB-SAMUDRA-01 pada dock basah nomor 2 telah diverifikasi oleh Superintendent Lapangan.
                </p>
                <div className="flex items-center gap-4 pt-1 font-mono text-xs">
                  <span className="font-bold text-blue-600 dark:text-blue-400">Total Upah: Rp 14.850.000</span>
                  <span className="text-slate-400">|</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">Jam Kerja: 42.5 Jam</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 3: PENGATURAN NAMA APLIKASI ================= */}
        {activeTab === 'name' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Identitas Merek & Nama Sistem
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Perubahan nama akan langsung ditampilkan pada bilah samping (sidebar), header navigasi atas, footer, halaman login, dan judul tab browser.
                </p>
              </div>

              <div className="space-y-4 max-w-xl text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Nama Utama Aplikasi*
                  </label>
                  <input
                    type="text"
                    value={appNameInput}
                    onChange={(e) => setAppNameInput(e.target.value.toUpperCase())}
                    placeholder="NEXAPROJECT"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold uppercase text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Nama singkat merek sistem (otomatis huruf kapital).
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Subjudul / Bidang Industri*
                  </label>
                  <input
                    type="text"
                    value={appSubtitleInput}
                    onChange={(e) => setAppSubtitleInput(e.target.value)}
                    placeholder="Shipyard Enterprise"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Tagline / Deskripsi Sistem
                  </label>
                  <textarea
                    rows={2}
                    value={appTaglineInput}
                    onChange={(e) => setAppTaglineInput(e.target.value)}
                    placeholder="Sistem Operasional Galangan Kapal & Manajemen Proyek Terintegrasi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Live Branding Preview */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Pratinjau Tampilan Header Navigasi
              </h4>
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white shadow-xs"
                    style={{ backgroundColor: customPrimaryHex }}
                  >
                    {appNameInput.trim().charAt(0) || 'N'}
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-none">
                      {appNameInput || 'NEXAPROJECT'}
                    </h2>
                    <p 
                      className="text-[11px] font-bold uppercase mt-1"
                      style={{ color: customPrimaryHex }}
                    >
                      {appSubtitleInput || 'Shipyard Enterprise'}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] text-slate-400 hidden sm:inline-block font-mono">
                  {appNameInput} v3.4 Enterprise
                </span>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 4: PENGATURAN LOGO / GAMBAR APLIKASI ================= */}
        {activeTab === 'logo' && (
          <div className="space-y-6">
            
            {/* Mode Pemilihan Logo */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Jenis Logo atau Gambar Aplikasi
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Gunakan simbol industri galangan bawaan, unggah logo perusahaan Anda sendiri, atau gunakan inisial huruf.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setLogoType('preset')}
                  className={`p-4 rounded-xl border text-left transition flex items-center justify-between ${
                    logoType === 'preset'
                      ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center">
                      <Ship className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs">Simbol Galangan Kapal</p>
                      <p className="text-[11px] text-slate-400">Pilihan preset maritim</p>
                    </div>
                  </div>
                  {logoType === 'preset' && <Check className="w-4 h-4 text-blue-600 font-bold" />}
                </button>

                <button
                  type="button"
                  onClick={() => setLogoType('custom')}
                  className={`p-4 rounded-xl border text-left transition flex items-center justify-between ${
                    logoType === 'custom'
                      ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/50 text-indigo-600 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-xs">Unggah Gambar Logo</p>
                      <p className="text-[11px] text-slate-400">Logo resmi perusahaan</p>
                    </div>
                  </div>
                  {logoType === 'custom' && <Check className="w-4 h-4 text-blue-600 font-bold" />}
                </button>

                <button
                  type="button"
                  onClick={() => setLogoType('initial')}
                  className={`p-4 rounded-xl border text-left transition flex items-center justify-between ${
                    logoType === 'initial'
                      ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/30'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center font-bold">
                      {appNameInput.charAt(0) || 'N'}
                    </div>
                    <div>
                      <p className="font-bold text-xs">Huruf Inisial Merek</p>
                      <p className="text-[11px] text-slate-400">Minimalis elegan</p>
                    </div>
                  </div>
                  {logoType === 'initial' && <Check className="w-4 h-4 text-blue-600 font-bold" />}
                </button>
              </div>

              {/* Preset Icon Options */}
              {logoType === 'preset' && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <p className="font-bold text-xs text-slate-700 dark:text-slate-300">
                    Pilih Ikon Simbol Industri:
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5">
                    {[
                      { id: 'ship', title: 'Kapal Galangan', icon: Ship },
                      { id: 'anchor', title: 'Jangkar Maritim', icon: Anchor },
                      { id: 'crane', title: 'Derek & Fabrikasi', icon: Layers },
                      { id: 'shield', title: 'Tameng Baja', icon: Shield },
                      { id: 'gear', title: 'Gear Presisi', icon: Cog },
                      { id: 'building', title: 'Fasilitas Galangan', icon: Building2 },
                    ].map((item) => {
                      const IconComp = item.icon;
                      const isSel = presetIcon === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => setPresetIcon(item.id as PresetIconChoice)}
                          className={`p-3 rounded-xl border text-center transition flex flex-col items-center gap-1.5 ${
                            isSel 
                              ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/30 font-bold' 
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                          }`}
                        >
                          <IconComp className={`w-5 h-5 ${isSel ? 'text-blue-600' : 'text-slate-500'}`} />
                          <span className="text-[11px] truncate w-full">{item.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Custom Image Upload & URL */}
              {logoType === 'custom' && (
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <p className="font-bold text-xs text-slate-700 dark:text-slate-300">
                    Unggah Berkas Gambar Logo (PNG / JPG / SVG / WebP):
                  </p>
                  
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300 transition">
                      <Upload className="w-4 h-4 text-blue-500" />
                      <span>Pilih Berkas dari Perangkat...</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleLogoFileUpload} 
                        className="hidden" 
                      />
                    </label>

                    {customLogoUrl && (
                      <div className="flex items-center gap-3">
                        <img 
                          src={customLogoUrl} 
                          alt="Preview logo" 
                          className="w-10 h-10 object-contain rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5" 
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setCustomLogoUrl('');
                            setLogoType('preset');
                          }}
                          className="text-xs text-rose-500 hover:underline"
                        >
                          Hapus Gambar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Shape selection */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <p className="font-bold text-xs text-slate-700 dark:text-slate-300">
                  Bentuk Bingkai Logo:
                </p>
                <div className="flex items-center gap-3">
                  {[
                    { id: 'rounded', label: 'Sudut Melengkung (Rounded)', class: 'rounded-xl' },
                    { id: 'circle', label: 'Lingkaran Penuh (Circle)', class: 'rounded-full' },
                    { id: 'square', label: 'Persegi Tegas (Square)', class: 'rounded-xs' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setLogoShape(s.id as LogoShape)}
                      className={`px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition flex items-center gap-2 ${
                        logoShape === s.id
                          ? 'border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 font-bold'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className={`w-3.5 h-3.5 bg-blue-600 ${s.class}`} />
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>

            {/* Logo Live Mockup Preview */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Pratinjau Nyata Logo pada Berbagai Ukuran
              </h4>
              <div className="p-5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-6">
                <div className="text-center space-y-1">
                  <div 
                    className={`w-8 h-8 ${logoShape === 'circle' ? 'rounded-full' : logoShape === 'square' ? 'rounded-xs' : 'rounded-lg'} flex items-center justify-center text-white mx-auto shadow-xs overflow-hidden`}
                    style={{ backgroundColor: customPrimaryHex }}
                  >
                    {logoType === 'custom' && customLogoUrl ? (
                      <img src={customLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : logoType === 'initial' ? (
                      <span className="font-black text-xs">{appNameInput.charAt(0) || 'N'}</span>
                    ) : (
                      <Ship className="w-4 h-4" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">Kecil (Navbar)</span>
                </div>

                <div className="text-center space-y-1">
                  <div 
                    className={`w-12 h-12 ${logoShape === 'circle' ? 'rounded-full' : logoShape === 'square' ? 'rounded-xs' : 'rounded-xl'} flex items-center justify-center text-white mx-auto shadow-xs overflow-hidden`}
                    style={{ backgroundColor: customPrimaryHex }}
                  >
                    {logoType === 'custom' && customLogoUrl ? (
                      <img src={customLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : logoType === 'initial' ? (
                      <span className="font-black text-base">{appNameInput.charAt(0) || 'N'}</span>
                    ) : (
                      <Ship className="w-6 h-6" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">Sedang (Sidebar)</span>
                </div>

                <div className="text-center space-y-1">
                  <div 
                    className={`w-16 h-16 ${logoShape === 'circle' ? 'rounded-full' : logoShape === 'square' ? 'rounded-xs' : 'rounded-2xl'} flex items-center justify-center text-white mx-auto shadow-md overflow-hidden`}
                    style={{ backgroundColor: customPrimaryHex }}
                  >
                    {logoType === 'custom' && customLogoUrl ? (
                      <img src={customLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : logoType === 'initial' ? (
                      <span className="font-black text-2xl">{appNameInput.charAt(0) || 'N'}</span>
                    ) : (
                      <Ship className="w-8 h-8" />
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">Besar (Login & Cetak)</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 5: KUSTOMISASI BACKGROUND & TEMA LATAR GLOBAL ================= */}
        {activeTab === 'background' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            
            {/* Header Description Card */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Kustomisasi Background &amp; Tema Latar Aplikasi
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pilihan latar belakang yang Anda atur akan diterapkan secara global ke seluruh halaman: <strong>Beranda (Landing)</strong>, <strong>Masuk (Login)</strong>, <strong>Pendaftaran (Register)</strong>, hingga modul proyek di dalam sistem.
                  </p>
                </div>
              </div>
            </div>

            {/* SECTION 1: WARNA SOLID & GRADIEN INDUSTRI */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Palette className="w-4 h-4 text-blue-600" />
                    <span>1. Pilihan Warna Solid &amp; Gradien Industri</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Warna datar dan gradasi baja industrial bernuansa maritim yang elegan dan nyaman untuk mata.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SOLID_GRADIENT_PRESETS.map((preset) => {
                  const isSelected = backgroundConfigDraft.id === preset.id;
                  const isGradient = preset.mode === 'gradient';
                  return (
                    <div
                      key={preset.id}
                      onClick={() => setBackgroundConfigDraft({
                        ...preset,
                        overlayOpacity: backgroundConfigDraft.overlayOpacity,
                        blurAmount: 0,
                      })}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg shadow-inner border border-white/20 shrink-0"
                          style={{
                            background: preset.value,
                          }}
                        />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {preset.name}
                          </p>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            {isGradient ? 'CSS Gradien' : preset.value}
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 font-bold" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Custom Solid Color Picker */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Warna Solid Bebas (Hex):
                </span>
                <input
                  type="color"
                  value={customSolidInput}
                  onChange={(e) => {
                    setCustomSolidInput(e.target.value);
                    setBackgroundConfigDraft({
                      mode: 'solid',
                      id: 'custom-solid-hex',
                      name: `Warna Kustom (${e.target.value})`,
                      value: e.target.value,
                      overlayOpacity: backgroundConfigDraft.overlayOpacity,
                      blurAmount: 0,
                    });
                  }}
                  className="w-9 h-9 p-0.5 rounded-lg border border-slate-300 dark:border-slate-700 cursor-pointer bg-transparent"
                />
                <input
                  type="text"
                  value={customSolidInput}
                  onChange={(e) => {
                    setCustomSolidInput(e.target.value);
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      setBackgroundConfigDraft({
                        mode: 'solid',
                        id: 'custom-solid-hex',
                        name: `Warna Kustom (${e.target.value})`,
                        value: e.target.value,
                        overlayOpacity: backgroundConfigDraft.overlayOpacity,
                        blurAmount: 0,
                      });
                    }
                  }}
                  placeholder="#020617"
                  className="w-28 px-2.5 py-1.5 text-xs font-mono rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => {
                    setBackgroundConfigDraft({
                      mode: 'solid',
                      id: 'custom-solid-hex',
                      name: `Warna Kustom (${customSolidInput})`,
                      value: customSolidInput,
                      overlayOpacity: backgroundConfigDraft.overlayOpacity,
                      blurAmount: 0,
                    });
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 rounded-lg transition"
                >
                  Pilih Warna Ini
                </button>
              </div>
            </div>

            {/* SECTION 2: WALLPAPER GALANGAN KAPAL BAWAAN */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Ship className="w-4 h-4 text-blue-600" />
                    <span>2. Gambar Latar / Wallpaper Galangan Kapal Modern</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Koleksi wallpaper resmi resolusi tinggi bernuansa industri galangan, dok perkapalan, dan pusat kontrol.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {WALLPAPER_PRESETS.map((wallpaper) => {
                  const isSelected = backgroundConfigDraft.id === wallpaper.id;
                  return (
                    <div
                      key={wallpaper.id}
                      onClick={() => setBackgroundConfigDraft({
                        ...wallpaper,
                        overlayOpacity: backgroundConfigDraft.overlayOpacity,
                        blurAmount: backgroundConfigDraft.blurAmount,
                      })}
                      className={`group relative rounded-2xl border-2 overflow-hidden cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'border-blue-600 dark:border-blue-500 ring-4 ring-blue-500/20 shadow-lg'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      {/* Thumbnail Container */}
                      <div className="h-36 w-full relative bg-slate-950 overflow-hidden">
                        <img
                          src={wallpaper.value}
                          alt={wallpaper.name}
                          className="w-full h-full object-cover transition duration-300 group-hover:scale-105 opacity-80"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                        
                        {/* Selected Indicator Badge */}
                        {isSelected && (
                          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-md bg-blue-600 text-white font-bold text-[10px] flex items-center gap-1 shadow-md">
                            <Check className="w-3 h-3" />
                            <span>AKTIF</span>
                          </div>
                        )}
                      </div>

                      {/* Card Caption */}
                      <div className="p-3.5 bg-white dark:bg-slate-900 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white">
                            {wallpaper.name}
                          </p>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">
                            Wallpaper Galangan Resmi
                          </span>
                        </div>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${
                          isSelected 
                            ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {isSelected ? 'Terpilih' : 'Pilih'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SECTION 3: UNGGAH GAMBAR SENDIRI (CUSTOM UPLOAD) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ImageUp className="w-4 h-4 text-blue-600" />
                    <span>3. Opsi Unggah Gambar Sendiri (Custom Upload)</span>
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Gunakan foto proyek galangan Anda sendiri, logo bengkel, atau wallpaper kustom dari perangkat (PNG, JPG, WebP).
                  </p>
                </div>
              </div>

              {customUploadError && (
                <div className="p-3 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-xs">
                  {customUploadError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                
                {/* Upload Action Box */}
                <div className="md:col-span-8">
                  <label className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-slate-50/50 dark:bg-slate-800/30 group">
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mb-3 group-hover:scale-110 transition">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      Klik atau Seret Berkas Gambar ke Sini
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Mendukung format PNG, JPG, JPEG, WebP (Maksimal 5MB)
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCustomBgUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Uploaded Image Status / Preview */}
                <div className="md:col-span-4">
                  {backgroundConfigDraft.mode === 'custom' ? (
                    <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-2">
                      <div className="h-28 rounded-lg overflow-hidden relative bg-slate-950 border border-slate-200 dark:border-slate-700">
                        <img
                          src={backgroundConfigDraft.value}
                          alt="Custom Background"
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-blue-600 text-[9px] font-bold text-white uppercase">
                          Kustom Aktif
                        </div>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                          {backgroundConfigDraft.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setBackgroundConfigDraft(DEFAULT_BACKGROUND)}
                          className="text-rose-600 hover:text-rose-700 dark:hover:text-rose-400 p-1 flex items-center gap-1 font-semibold text-[11px]"
                          title="Hapus gambar kustom"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="h-full min-h-[120px] rounded-xl border border-slate-200 dark:border-slate-800/80 p-4 flex flex-col items-center justify-center text-center text-xs text-slate-400">
                      <ImageIcon className="w-6 h-6 mb-1 opacity-40" />
                      <span>Belum ada gambar kustom yang diunggah.</span>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* SECTION 4: VISIBILITAS, OVERLAY & EFEK BLUR */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
              <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                  <span>4. Penyesuaian Visibilitas &amp; Kontras Teks (Legibility)</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Pastikan teks, formulir masuk (login), dan tabel data tetap terbaca jelas di atas gambar latar.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Control 1: Dark Overlay Opacity */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Tingkat Kegelapan Lapisan Overlay:
                    </label>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                      {Math.round(backgroundConfigDraft.overlayOpacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.30"
                    max="0.95"
                    step="0.05"
                    value={backgroundConfigDraft.overlayOpacity}
                    onChange={(e) => setBackgroundConfigDraft({
                      ...backgroundConfigDraft,
                      overlayOpacity: parseFloat(e.target.value),
                    })}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>30% (Gambar Terang)</span>
                    <span className="text-blue-500 font-bold">75% (Direkomendasikan)</span>
                    <span>95% (Maksimal Gelap)</span>
                  </div>
                </div>

                {/* Control 2: Background Blur */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <label className="font-bold text-slate-800 dark:text-slate-200">
                      Tingkat Efek Blur Gambar Latar:
                    </label>
                    <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">
                      {backgroundConfigDraft.blurAmount} px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="8"
                    step="1"
                    value={backgroundConfigDraft.blurAmount}
                    onChange={(e) => setBackgroundConfigDraft({
                      ...backgroundConfigDraft,
                      blurAmount: parseInt(e.target.value, 10),
                    })}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                    <span>0 px (Tajam Asli)</span>
                    <span className="text-blue-500 font-bold">1-2 px (Fokus Kartu)</span>
                    <span>8 px (Blur Halus)</span>
                  </div>
                </div>

              </div>
            </div>

            {/* SECTION 5: PRATINJAU LANGSUNG (LIVE PREVIEW SANDBOX) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
              <div className="pb-2 border-b border-slate-100 dark:border-slate-800">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  <span>5. Pratinjau Tampilan Langsung (Live Preview)</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Simulasi bagaimana kartu konten, tombol, dan teks terlihat di atas tema latar yang dipilih:
                </p>
              </div>

              {/* Sandbox Container */}
              <div className="relative rounded-2xl overflow-hidden min-h-[220px] p-6 flex items-center justify-center border border-slate-700 shadow-inner">
                
                {/* Background Layer inside Preview */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-all duration-300"
                  style={{
                    background: backgroundConfigDraft.mode === 'solid' || backgroundConfigDraft.mode === 'gradient'
                      ? backgroundConfigDraft.value
                      : `url('${backgroundConfigDraft.value}')`,
                    backgroundSize: 'cover',
                    filter: backgroundConfigDraft.blurAmount > 0 ? `blur(${backgroundConfigDraft.blurAmount}px)` : 'none',
                  }}
                />
                
                {/* Overlay inside Preview */}
                {(backgroundConfigDraft.mode === 'wallpaper' || backgroundConfigDraft.mode === 'custom') && (
                  <div 
                    className="absolute inset-0 bg-slate-950 transition-opacity"
                    style={{ opacity: backgroundConfigDraft.overlayOpacity }}
                  />
                )}

                {/* Simulated Glassmorphic UI Card */}
                <div className="relative z-10 w-full max-w-md bg-white/95 dark:bg-slate-900/90 backdrop-blur-md p-5 rounded-xl shadow-2xl border border-slate-200/90 dark:border-slate-800/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                        ⚓
                      </div>
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        NEXAPROJECT Enterprise
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 text-[10px] font-bold">
                      Kontras Jelas
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Teks dan formulir di halaman Login, Beranda, serta modul operasional galangan kapal tetap tajam dan terbaca secara optimal.
                  </p>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-xs"
                    >
                      Tombol Utama
                    </button>
                    <button
                      type="button"
                      className="px-3.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                    >
                      Batal
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* ACTION BAR: SIMPAN & TERAPKAN BACKGROUND */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900">
              <div className="flex items-center gap-2 text-xs text-blue-900 dark:text-blue-200">
                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                <span>
                  Latar terpilih: <strong>{backgroundConfigDraft.name}</strong> ({backgroundConfigDraft.mode.toUpperCase()})
                </span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setBackgroundConfigDraft(DEFAULT_BACKGROUND)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition"
                >
                  Batal / Reset
                </button>
                <button
                  type="button"
                  onClick={handleSaveBackground}
                  disabled={isSaving}
                  className="grow sm:grow-0 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-md active:scale-95"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Menyimpan...' : 'Terapkan & Simpan Background Global'}</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 6: PENGATURAN SERVER & MAINTENANCE (HANYA ROLE CREATOR) ================= */}
        {activeTab === 'server' && isCreator && (
          <div className="space-y-6">
            
            {/* Exclusive Creator Security Notice */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3 shadow-xs">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-black">
                👑
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  Otoritas Tertinggi Server (Akses Khusus Creator)
                </p>
                <p className="leading-relaxed">
                  Halaman ini <strong>HANYA DAPAT DILIHAT DAN DIAKSES OLEH PERAN CREATOR</strong>. Pengguna lain (Admin, Staff, Karyawan) tidak dapat melihat atau mengetahui keberadaan panel kendali server ini.
                </p>
              </div>
            </div>

            {/* Server Status Switch */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Server className="w-5 h-5 text-blue-600" />
                  <span>Status Operasional Server Aplikasi</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tentukan ketersediaan sistem secara global bagi seluruh pengguna aplikasi galangan kapal.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* OPTION 1: SERVER AKTIF */}
                <div 
                  onClick={() => setServerStatusChoice('active')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between gap-4 ${
                    serverStatusChoice === 'active'
                      ? 'border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                        <Power className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">
                          🟢 SERVER AKTIF (Normal Operational)
                        </h4>
                        <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide">
                          Aplikasi Siap Digunakan
                        </span>
                      </div>
                    </div>
                    {serverStatusChoice === 'active' && (
                      <span className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                        <Check className="w-4 h-4 font-bold" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Seluruh pengguna (Creator, Admin, Staff, Karyawan) dapat mengakses dashboard, mengisi form time sheet, memeriksa progres proyek, dan menginput laporan secara normal.
                  </p>
                </div>

                {/* OPTION 2: TIDAK AKTIF / MAINTENANCE */}
                <div 
                  onClick={() => setServerStatusChoice('maintenance')}
                  className={`p-5 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between gap-4 ${
                    serverStatusChoice === 'maintenance'
                      ? 'border-rose-500 bg-rose-50/40 dark:bg-rose-950/30 ring-2 ring-rose-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 flex items-center justify-center">
                        <Server className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-black text-sm text-slate-900 dark:text-white">
                          🔴 TIDAK AKTIF / MAINTENANCE MODE
                        </h4>
                        <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wide">
                          Akses Pengguna Lain Ditutup
                        </span>
                      </div>
                    </div>
                    {serverStatusChoice === 'maintenance' && (
                      <span className="w-6 h-6 rounded-full bg-rose-500 text-white flex items-center justify-center">
                        <Check className="w-4 h-4 font-bold" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Aplikasi <strong>tidak dapat dijalankan atau digunakan sama sekali</strong> oleh pengguna lain dan akan memunculkan layar pemberitahuan pemeliharaan. <strong>Hanya Role Creator yang dapat tetap mengakses sistem</strong> untuk perbaikan atau pembaruan.
                  </p>
                </div>

              </div>

              {/* Maintenance Form details (when maintenance selected) */}
              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Pemberitahuan Pesan Pemeliharaan (Ditampilkan ke Seluruh Pengguna)
                  </label>
                  <textarea
                    rows={3}
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    placeholder="Contoh: Sistem NEXAPROJECT sedang dalam pemeliharaan berkala dan perbaikan modul absensi oleh tim teknis..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    Pesan ini akan dibaca oleh Admin, Staff, Karyawan, dan pengunjung saat mereka membuka aplikasi.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Estimasi Waktu Selesai (Opsional)
                    </label>
                    <input
                      type="text"
                      value={estimatedEnd}
                      onChange={(e) => setEstimatedEnd(e.target.value)}
                      placeholder="Contoh: 14:00 WIB / 30 Menit"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Status Saat Ini di Database
                    </label>
                    <div className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono font-bold flex items-center justify-between">
                      <span>{appSettings.serverConfig.status.toUpperCase()}</span>
                      <span className="text-[10px] font-normal text-slate-400">
                        Oleh: {appSettings.serverConfig.updatedBy}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleSaveServerStatus}
                    disabled={isSaving}
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition flex items-center gap-2 shadow-md active:scale-95"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Menerapkan...' : 'Terapkan & Simpan Status Server'}</span>
                  </button>
                </div>

              </div>

            </div>

          </div>
        )}

      </div>
    </div>
  );
};
