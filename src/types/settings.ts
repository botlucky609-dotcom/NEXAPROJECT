export type ColorPreset = 'blue' | 'emerald' | 'amber' | 'red' | 'indigo' | 'teal' | 'slate' | 'custom';

export interface ColorThemeConfig {
  preset: ColorPreset;
  primaryHex: string;
  primaryHoverHex: string;
  name: string;
}

export type FontFamilyChoice = 
  | 'plus-jakarta' 
  | 'inter' 
  | 'roboto' 
  | 'montserrat' 
  | 'poppins' 
  | 'outfit' 
  | 'jetbrains-mono';

export type FontScaleChoice = 'compact' | 'normal' | 'large';

export interface FontConfig {
  family: FontFamilyChoice;
  scale: FontScaleChoice;
}

export type LogoType = 'preset' | 'custom' | 'initial';
export type PresetIconChoice = 'ship' | 'anchor' | 'crane' | 'shield' | 'gear' | 'building';
export type LogoShape = 'rounded' | 'circle' | 'square';

export interface AppLogoConfig {
  type: LogoType;
  presetIcon: PresetIconChoice;
  customUrl: string; // base64 or URL
  shape: LogoShape;
}

export type ServerStatus = 'active' | 'maintenance';

export interface ServerConfig {
  status: ServerStatus;
  message: string;
  estimatedEnd?: string;
  updatedAt: number;
  updatedBy: string;
}

export type BackgroundMode = 'solid' | 'gradient' | 'wallpaper' | 'custom';

export interface BackgroundConfig {
  mode: BackgroundMode;
  id: string;
  name: string;
  value: string; // color hex, CSS gradient string, or image URL/base64
  overlayOpacity: number; // 0.1 to 0.9 (e.g. 0.75 default for wallpapers to ensure high contrast)
  blurAmount: number; // 0 to 8 px
}

export const SOLID_GRADIENT_PRESETS: BackgroundConfig[] = [
  {
    mode: 'solid',
    id: 'navy-default',
    name: 'Dark Navy Standar',
    value: '#020617',
    overlayOpacity: 0.7,
    blurAmount: 0,
  },
  {
    mode: 'solid',
    id: 'deep-blue',
    name: 'Deep Ocean Blue',
    value: '#07152f',
    overlayOpacity: 0.7,
    blurAmount: 0,
  },
  {
    mode: 'solid',
    id: 'dark-slate',
    name: 'Dark Slate Steel',
    value: '#0f172a',
    overlayOpacity: 0.7,
    blurAmount: 0,
  },
  {
    mode: 'gradient',
    id: 'industrial-gradient',
    name: 'Gradien Industrial Steel',
    value: 'linear-gradient(135deg, #090d16 0%, #111c30 50%, #0c1424 100%)',
    overlayOpacity: 0.7,
    blurAmount: 0,
  },
  {
    mode: 'gradient',
    id: 'ocean-abyss',
    name: 'Gradien Ocean Abyss',
    value: 'linear-gradient(180deg, #030712 0%, #071936 50%, #030b18 100%)',
    overlayOpacity: 0.7,
    blurAmount: 0,
  },
  {
    mode: 'gradient',
    id: 'dockside-cyan',
    name: 'Gradien Dockside Cyan',
    value: 'linear-gradient(135deg, #061826 0%, #0d2838 50%, #041019 100%)',
    overlayOpacity: 0.7,
    blurAmount: 0,
  },
];

export const WALLPAPER_PRESETS: BackgroundConfig[] = [
  {
    mode: 'wallpaper',
    id: 'shipyard-dock',
    name: 'Galangan Kering & Crane Raksasa',
    value: '/backgrounds/shipyard_dock.jpg',
    overlayOpacity: 0.78,
    blurAmount: 1,
  },
  {
    mode: 'wallpaper',
    id: 'shipyard-control',
    name: 'Pusat Kontrol Operasi Maritim',
    value: '/backgrounds/shipyard_control.jpg',
    overlayOpacity: 0.80,
    blurAmount: 1,
  },
  {
    mode: 'wallpaper',
    id: 'shipyard-blueprint',
    name: 'Cetak Biru Arsitektur Kapal',
    value: '/backgrounds/shipyard_blueprint.svg',
    overlayOpacity: 0.65,
    blurAmount: 0,
  },
  {
    mode: 'wallpaper',
    id: 'shipyard-night',
    name: 'Pelabuhan & Galangan Malam Hari',
    value: '/backgrounds/shipyard_night.svg',
    overlayOpacity: 0.72,
    blurAmount: 0,
  },
];

export const DEFAULT_BACKGROUND: BackgroundConfig = SOLID_GRADIENT_PRESETS[0];

export interface AppSettings {
  colorTheme: ColorThemeConfig;
  fontConfig: FontConfig;
  appName: string;
  appSubtitle: string;
  appTagline: string;
  appLogo: AppLogoConfig;
  serverConfig: ServerConfig;
  backgroundConfig: BackgroundConfig;
}

export const COLOR_PRESETS: Record<ColorPreset, ColorThemeConfig> = {
  blue: {
    preset: 'blue',
    primaryHex: '#2563eb',
    primaryHoverHex: '#1d4ed8',
    name: 'Nexa Ocean Blue (Standar)',
  },
  emerald: {
    preset: 'emerald',
    primaryHex: '#059669',
    primaryHoverHex: '#047857',
    name: 'Emerald Maritime',
  },
  amber: {
    preset: 'amber',
    primaryHex: '#d97706',
    primaryHoverHex: '#b45309',
    name: 'Industrial Amber / Gold',
  },
  red: {
    preset: 'red',
    primaryHex: '#dc2626',
    primaryHoverHex: '#b91c1c',
    name: 'Crimson Steel',
  },
  indigo: {
    preset: 'indigo',
    primaryHex: '#4f46e5',
    primaryHoverHex: '#4338ca',
    name: 'Deep Indigo',
  },
  teal: {
    preset: 'teal',
    primaryHex: '#0d9488',
    primaryHoverHex: '#0f766e',
    name: 'Cyber Teal Marine',
  },
  slate: {
    preset: 'slate',
    primaryHex: '#475569',
    primaryHoverHex: '#334155',
    name: 'Slate Monochrome',
  },
  custom: {
    preset: 'custom',
    primaryHex: '#2563eb',
    primaryHoverHex: '#1d4ed8',
    name: 'Warna Kustom',
  },
};

export const DEFAULT_SETTINGS: AppSettings = {
  colorTheme: COLOR_PRESETS.blue,
  fontConfig: {
    family: 'plus-jakarta',
    scale: 'normal',
  },
  appName: 'NEXAPROJECT',
  appSubtitle: 'Shipyard Enterprise',
  appTagline: 'Sistem Operasional Galangan Kapal & Manajemen Proyek Terintegrasi',
  appLogo: {
    type: 'preset',
    presetIcon: 'ship',
    customUrl: '',
    shape: 'rounded',
  },
  serverConfig: {
    status: 'active',
    message: 'Sistem sedang dalam perawatan terjadwal dan pembaruan arsitektur sistem oleh tim teknis.',
    estimatedEnd: 'Segera',
    updatedAt: Date.now(),
    updatedBy: 'Sistem',
  },
  backgroundConfig: DEFAULT_BACKGROUND,
};
