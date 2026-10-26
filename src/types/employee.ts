export const EMPLOYEE_POSITIONS = [
  'PROJECT MANAGER',
  'ASST. PROJECT MANAGER',
  'PROJECT IN CHARGE',
  'ASST. PROJECT INCHARGE',
  'GENERAL AFFAIRS',
  'HUMAN RESOURCE',
  'ACCOUNTING',
  'ADMINISTRATION',
  'FINANCE',
  'PURCHASING',
  'SUPERVISOR',
  'ASST. SUPERVISOR',
  'TIME KEEPER',
  'STORY WRITER',
  'QUALITY CONTROL',
  'STOREMAN',
  'MATERIAL CONTROL',
  'MECHANIC',
  'ENGINEER',
  'RIGGER',
  'SAFETY',
  'FIRE WATCHMAN',
  'FOREMAN',
  'FOREMAN FITTER',
  'FOREMAN WELDER',
  'FOREMAN HELPER',
  'LEADER',
  'LEADER FITTER',
  'LEADER WELDER',
  'LEADER HELPER',
  'FITTER',
  'WELDER',
  'HELPER',
  'HELPER FITTER',
  'HELPER WELDER',
  'HELPER GRINDER',
] as const;

export type EmployeePosition = typeof EMPLOYEE_POSITIONS[number];

export const WORK_SHIFTS = ['PAGI', 'SIANG', 'MALAM'] as const;
export type WorkShift = typeof WORK_SHIFTS[number];

export const WORK_STATUSES = ['AKTIF', 'MENUNGGU', 'TIDAK AKTIF', 'DAFTAR HITAM'] as const;
export type WorkStatus = typeof WORK_STATUSES[number];

export const DEPARTMENTS = [
  'BLASTING',
  'CLEANING',
  'PAINTING',
  'PIPING',
  'SCAFFOLDING',
  'STEEL WORK',
] as const;
export type Department = typeof DEPARTMENTS[number];

export const PROJECT_TYPES = ['MODUL', 'NEW BUILDING', 'SHIP REPAIR', 'SUPPLY'] as const;
export type ProjectType = typeof PROJECT_TYPES[number];

export const WAGE_STATUSES = ['Bulan', 'Hari', 'Jam'] as const;
export type WageStatus = typeof WAGE_STATUSES[number];

export const RELIGIONS = [
  'Islam',
  'Kristen',
  'Katolik',
  'Hindu',
  'Budha',
  'Konghuchu',
] as const;
export type Religion = typeof RELIGIONS[number];

export const MARITAL_STATUSES = [
  'TK/0',
  'TK/1',
  'TK/2',
  'TK/3',
  'K/0',
  'K/1',
  'K/2',
  'K/3',
  'K/4',
  'K/5',
] as const;
export type MaritalStatus = typeof MARITAL_STATUSES[number];

export const BANK_LIST = [
  'BANK OCBC (OCBC NISP)',
  'BANK MANDIRI',
  'BANK CENTRAL ASIA (BCA)',
  'BANK RAKYAT INDONESIA (BRI)',
  'BANK NEGARA INDONESIA (BNI)',
  'BANK TABUNGAN NEGARA (BTN)',
  'BANK SYARIAH INDONESIA (BSI)',
  'BANK CIMB NIAGA',
  'BANK DANAMON',
  'BANK PERMATA',
  'BANK PANIN',
  'BANK BTPN / JENIUS',
  'BANK HSBC INDONESIA',
  'BANK UOB INDONESIA',
  'BANK MAYBANK INDONESIA',
  'BANK MEGA',
  'BANK JABAR BANTEN (BJB)',
  'BANK JATIM',
  'BANK RIAU KEPRI SYARIAH',
] as const;

export interface EmployeeDocumentPhotos {
  profilePhoto?: string;
  ktpPhoto?: string;
  kkPhoto?: string;
  npwpPhoto?: string;
  bpjsPhoto?: string;
  otherPhoto?: string;
}

export interface EmployeeRecord {
  id: string; // Document ID / UUID
  // 1. Data Utama
  employeeId: string; // Unique ID Karyawan (e.g. EMP-001)
  fullName: string;
  position: EmployeePosition;
  joinDate: string; // YYYY-MM-DD
  workShift: WorkShift;
  workStatus: WorkStatus;
  photoUrl?: string;

  // 2. Penempatan Kerja
  department: Department;
  projectType: ProjectType;
  workLocation: string;

  // 3. Penggajian
  wage: number;
  wageStatus: WageStatus;
  mealAllowance: number;
  transportAllowance: number;
  gougingAllowance: number; // Only for Foreman Welder & Welder

  // 4. Data Pribadi
  address: string;
  birthPlace: string;
  birthDate: string; // YYYY-MM-DD
  age: number; // Calculated dynamically from birthDate
  religion: Religion;
  maritalStatus: MaritalStatus;
  fatherName: string;
  motherName: string;

  // 5. Data Dokumen
  phone: string; // 10-13 digits with dashes every 4 chars e.g. 0812-3456-7890
  ktpNumber: string; // 16 digits
  kkNumber: string; // 16 digits
  npwpNumber: string;
  bpjsNumber: string;
  bankAccountNumber: string;
  bankName: string;

  // 6. Data Keluar
  exitDate?: string;
  exitNotes?: string;

  // 7. Status Akun
  email: string;
  accountRole: 'creator' | 'admin' | 'staff' | 'karyawan';

  // Dokumen Foto Terkait
  documents?: EmployeeDocumentPhotos;

  createdAt: number;
  updatedAt: number;
}
