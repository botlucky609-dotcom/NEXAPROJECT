export type AttendanceStatus = 'HADIR' | 'SAKIT' | 'IZIN' | 'ALFA' | 'CUTI';
export type WorkShiftType = 'PAGI' | 'SIANG' | 'MALAM';
export type RestDurationType = '0 mnt' | '30 mnt' | '1 jam' | '1.30 jam' | '2 jam' | '2.30 jam' | '3 jam' | '3.30 jam' | '4 jam';
export type CalcKehadiranType = '-' | 'HADIR' | 'ALPHA' | 'SAKIT' | 'IZIN';

// 1. Form Time Sheet Entry
export interface FormTimesheetEntry {
  id: string;
  employeeId: string;
  fullName: string;
  position: string;
  department: string;
  date: string; // YYYY-MM-DD
  createdAt: number;
}

// 2. Form Over time Entry
export interface FormOvertimeEntry {
  id: string;
  fullName: string;
  employeeId: string;
  position: string;
  shipName: string; // Hanya nama saja tanpa kode & type (misal: "MV OCEANIC LEADER")
  date: string;
  hours: number;
  notes?: string;
  createdAt: number;
}

// 3. Form Night Shift Entry
export interface FormNightShiftEntry {
  id: string;
  fullName: string;
  employeeId: string;
  position: string;
  shipName: string; // Hanya nama saja tanpa kode & type
  date: string;
  shift: 'MALAM';
  hours: number;
  notes?: string;
  createdAt: number;
}

// 4. Baris Rekap Harian untuk Kalkulasi Waktu (Inline Real-time per hari dalam 1 bulan)
export interface DailyTimeCalcRow {
  day: number; // 1..31
  date: string; // YYYY-MM-DD
  dayName: string; // 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'
  isSaturday: boolean; // Sabtu berwarna Biru
  isSunday: boolean; // Minggu berwarna Merah
  jamMasuk: string; // manual dengan pemisah :, contoh: "07:30"
  jamKeluar: string; // manual dengan pemisah :, contoh: "15:30"
  istirahat: RestDurationType; // dropdown: 0 mnt, 30 mnt, 1 jam, 1.30 jam, 2 jam, 2.30 jam, 3 jam, 3.30 jam, 4 jam
  jamNormal: number; // angka manual
  jamLembur: number; // angka manual
  totalJam: number; // Jam Normal + Jam Lembur
  kehadiran: CalcKehadiranType; // Tampilan awal: '-'
  tunjanganMakan: number; // otomatis dari data karyawan jika HADIR, selain itu 0
  tunjanganTransport: number; // otomatis dari data karyawan jika HADIR, selain itu 0
  tunjanganGougingCentang: boolean; // Checkbox centang Iya / Tidak
  tunjanganGouging: number; // jika Iya -> nilai data karyawan; jika Tidak -> 0
  namaKapal: string; // Beserta kode proyek (contoh: "MV OCEANIC LEADER (PRJ-2026-001)")
  totalUpah: number; // Dihitung sesuai status upah (JAM / BULAN / HARI)
}

// Rekapitulasi 1 Bulan Lembar Kalkulasi Waktu per Karyawan
export interface MonthlyTimeCalcSheet {
  id: string; // e.g. "calc-EMP-001-2026-10"
  employeeId: string;
  employeeName: string;
  position: string;
  department: string;
  wage: number;
  wageStatus: 'Jam' | 'Bulan' | 'Hari';
  mealAllowance: number;
  transportAllowance: number;
  gougingAllowance: number;
  year: number;
  month: number; // 1..12
  rows: DailyTimeCalcRow[];
  updatedAt: number;
}

// Ringkasan Bulanan (Bagian 3)
export interface MonthlyTimeCalcSummary {
  totalJamNormal: number;
  totalJamLembur: number;
  totalJam: number;
  hadirCount: number;
  alphaCount: number;
  izinSakitCount: number;
  totalTunjanganMakan: number;
  totalTunjanganTransport: number;
  totalTunjanganGouging: number;
  totalUpah: number;
  canViewGouging: boolean; // Khusus Foreman Welder, Welder, Creator & Admin
}

// 5. Kalkulasi Proyek Row
export interface ProjectCalcRow {
  id: string;
  tanggal: string;
  employeeId: string;
  employeeName: string;
  shiftKerja: WorkShiftType;
  namaKapal: string; // Cantumkan kodenya juga
  totalJam: number; // Acuan dari data kalkulasi waktu
}

// 6. Summary Matrix Ala Excel
export interface EmployeeMonthSummaryMatrix {
  employeeId: string;
  employeeName: string;
  position: string;
  wage: number;
  wageStatus: 'Jam' | 'Bulan' | 'Hari';
  dailyHours: { [day: number]: number }; // total jam per tanggal 1..31
  totalJam: number;
  totalUpah: number;
  totalTunjanganMakan: number;
  totalTunjanganTransport: number;
  totalTunjanganGouging: number;
  totalKeseluruhan: number;
}

// 7. Biaya Pekerja per Proyek
export interface ProjectWorkerCostRow {
  id: string;
  bulan: string; // e.g. "Oktober 2026"
  proyek: string; // e.g. "MV OCEANIC LEADER (PRJ-2026-001)"
  employeeId: string;
  employeeName: string;
  totalJam: number;
  totalHari: number;
  totalUpah: number;
}

// Legacy compatibility
export interface DailyAttendanceRecord {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  shift: WorkShiftType;
  checkInTime: string;
  checkOutTime?: string;
  workHours: number;
  status: AttendanceStatus;
  projectId: string;
  projectCode: string;
  shipName: string;
  workLocation: string;
  verifiedBy?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}

export interface OvertimeClaimRecord {
  id: string;
  claimNumber: string;
  date: string;
  employeeId: string;
  employeeName: string;
  department: string;
  position: string;
  projectId: string;
  projectCode: string;
  shipName: string;
  startTime: string;
  endTime: string;
  overtimeHours: number;
  rateType: string;
  multiplier: number;
  baseHourlyWage: number;
  gougingAllowance: number;
  mealAllowance: number;
  totalEstimatedClaim: number;
  taskDescription: string;
  status: 'PENDING' | 'VERIFIED' | 'APPROVED' | 'REJECTED';
  verifiedBy?: string;
  approvedBy?: string;
  createdAt: number;
  updatedAt: number;
}

export interface LaborProjectSummary {
  projectId: string;
  projectCode: string;
  shipName: string;
  totalWorkers: number;
  totalRegularHours: number;
  totalOvertimeHours: number;
  totalRegularWage: number;
  totalOvertimeCost: number;
  totalLaborCost: number;
}
