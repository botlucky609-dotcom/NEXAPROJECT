import ExcelJS from 'exceljs';
import { 
  FormTimesheetEntry, 
  FormOvertimeEntry, 
  FormNightShiftEntry, 
  DailyTimeCalcRow, 
  MonthlyTimeCalcSheet, 
  MonthlyTimeCalcSummary,
  ProjectCalcRow,
  EmployeeMonthSummaryMatrix,
  ProjectWorkerCostRow,
  DailyAttendanceRecord, 
  OvertimeClaimRecord, 
  LaborProjectSummary,
  RestDurationType,
  CalcKehadiranType
} from '../types/attendance';
import { UserRole } from '../types/auth';
import { employeeDb } from './employeeDb';
import { projectDb } from './projectDb';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

const STORAGE_KEY_FORM_TIMESHEET = 'nexaproject_form_timesheet_v2';
const STORAGE_KEY_FORM_OVERTIME = 'nexaproject_form_overtime_v2';
const STORAGE_KEY_FORM_NIGHTSHIFT = 'nexaproject_form_nightshift_v2';
const STORAGE_KEY_TIME_CALC_SHEETS = 'nexaproject_time_calc_sheets_v2';
const STORAGE_KEY_ATTENDANCE = 'nexaproject_attendance_v1';
const STORAGE_KEY_OVERTIME = 'nexaproject_overtime_v1';

const TODAY_STR = new Date().toISOString().split('T')[0];

const DAY_NAMES = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

// Helper to determine days in month
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// Helper to format currency
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

class AttendanceDatabaseService {
  private formTimesheets: FormTimesheetEntry[] = [];
  private formOvertimes: FormOvertimeEntry[] = [];
  private formNightShifts: FormNightShiftEntry[] = [];
  private timeCalcSheets: Record<string, MonthlyTimeCalcSheet> = {};
  
  // Legacy collections
  private attendanceList: DailyAttendanceRecord[] = [];
  private overtimeList: OvertimeClaimRecord[] = [];

  constructor() {
    this.init();
  }

  private init() {
    // 1. Form Timesheet
    try {
      const storedTs = localStorage.getItem(STORAGE_KEY_FORM_TIMESHEET);
      if (storedTs) {
        this.formTimesheets = JSON.parse(storedTs);
      } else {
        this.formTimesheets = this.generateDefaultTimesheets();
        this.saveFormTimesheetsLocally();
      }
    } catch {
      this.formTimesheets = this.generateDefaultTimesheets();
    }

    // 2. Form Overtime
    try {
      const storedOt = localStorage.getItem(STORAGE_KEY_FORM_OVERTIME);
      if (storedOt) {
        this.formOvertimes = JSON.parse(storedOt);
      } else {
        this.formOvertimes = this.generateDefaultOvertimes();
        this.saveFormOvertimesLocally();
      }
    } catch {
      this.formOvertimes = this.generateDefaultOvertimes();
    }

    // 3. Form Night Shift
    try {
      const storedNs = localStorage.getItem(STORAGE_KEY_FORM_NIGHTSHIFT);
      if (storedNs) {
        this.formNightShifts = JSON.parse(storedNs);
      } else {
        this.formNightShifts = this.generateDefaultNightShifts();
        this.saveFormNightShiftsLocally();
      }
    } catch {
      this.formNightShifts = this.generateDefaultNightShifts();
    }

    // 4. Kalkulasi Waktu Sheets
    try {
      const storedCalc = localStorage.getItem(STORAGE_KEY_TIME_CALC_SHEETS);
      if (storedCalc) {
        this.timeCalcSheets = JSON.parse(storedCalc);
      } else {
        this.timeCalcSheets = this.generateDefaultTimeCalcSheets();
        this.saveTimeCalcSheetsLocally();
      }
    } catch {
      this.timeCalcSheets = this.generateDefaultTimeCalcSheets();
    }

    // 5. Legacy Attendance
    try {
      const stored = localStorage.getItem(STORAGE_KEY_ATTENDANCE);
      this.attendanceList = stored ? JSON.parse(stored) : [];
      const storedOtLegacy = localStorage.getItem(STORAGE_KEY_OVERTIME);
      this.overtimeList = storedOtLegacy ? JSON.parse(storedOtLegacy) : [];
    } catch {
      this.attendanceList = [];
      this.overtimeList = [];
    }
  }

  // ================= SEED DATA GENERATORS =================
  private generateDefaultTimesheets(): FormTimesheetEntry[] {
    return [
      {
        id: 'ts-001',
        employeeId: 'EMP-001',
        fullName: 'MUHAMMAD ANDRI',
        position: 'PROJECT MANAGER',
        department: 'STEEL WORK',
        date: TODAY_STR,
        createdAt: Date.now() - 3600000 * 4,
      },
      {
        id: 'ts-002',
        employeeId: 'EMP-002',
        fullName: 'BAMBANG SETIAWAN',
        position: 'SUPERVISOR',
        department: 'PIPING',
        date: TODAY_STR,
        createdAt: Date.now() - 3600000 * 3,
      },
      {
        id: 'ts-003',
        employeeId: 'EMP-004',
        fullName: 'AHMAD RIFAI',
        position: 'WELDER',
        department: 'STEEL WORK',
        date: TODAY_STR,
        createdAt: Date.now() - 3600000 * 2,
      },
      {
        id: 'ts-004',
        employeeId: 'EMP-005',
        fullName: 'DEDI SUPRIADI',
        position: 'FOREMAN WELDER',
        department: 'STEEL WORK',
        date: TODAY_STR,
        createdAt: Date.now() - 3600000 * 1,
      },
    ];
  }

  private generateDefaultOvertimes(): FormOvertimeEntry[] {
    return [
      {
        id: 'ot-form-001',
        fullName: 'AHMAD RIFAI',
        employeeId: 'EMP-004',
        position: 'WELDER',
        shipName: 'MV OCEANIC LEADER', // Hanya nama saja tanpa kode & type
        date: TODAY_STR,
        hours: 3.5,
        notes: 'Penyelesaian pengelasan lambung ganda kompartemen 4',
        createdAt: Date.now() - 3600000 * 2,
      },
      {
        id: 'ot-form-002',
        fullName: 'DEDI SUPRIADI',
        employeeId: 'EMP-005',
        position: 'FOREMAN WELDER',
        shipName: 'MT PACIFIC CHEMIST',
        date: TODAY_STR,
        hours: 2.0,
        notes: 'Inspeksi gouging sambungan pelat lunas bilga',
        createdAt: Date.now() - 3600000 * 1,
      },
    ];
  }

  private generateDefaultNightShifts(): FormNightShiftEntry[] {
    return [
      {
        id: 'ns-form-001',
        fullName: 'AHMAD RIFAI',
        employeeId: 'EMP-004',
        position: 'WELDER',
        shipName: 'MV OCEANIC LEADER',
        date: TODAY_STR,
        shift: 'MALAM',
        hours: 7.0,
        notes: 'Pengelasan full penetration pelat AH36 saat dock tenang',
        createdAt: Date.now() - 3600000 * 5,
      },
      {
        id: 'ns-form-002',
        fullName: 'DEDI SUPRIADI',
        employeeId: 'EMP-005',
        position: 'FOREMAN WELDER',
        shipName: 'TB SAMUDERA PERKASA VIII',
        date: TODAY_STR,
        shift: 'MALAM',
        hours: 8.0,
        notes: 'Supervisi fabrikasi bracket rudder pintle darurat',
        createdAt: Date.now() - 3600000 * 4,
      },
    ];
  }

  private generateDefaultTimeCalcSheets(): Record<string, MonthlyTimeCalcSheet> {
    const sheets: Record<string, MonthlyTimeCalcSheet> = {};
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const sampleEmployees = ['EMP-001', 'EMP-004', 'EMP-005'];
    sampleEmployees.forEach((empId) => {
      const emp = employeeDb.getEmployeeByCode(empId);
      if (emp) {
        const sheet = this.createEmptySheet(empId, currentYear, currentMonth);
        // Pre-populate several active work days for realistic calculation demo
        const daysInMonth = sheet.rows.length;
        for (let i = 0; i < Math.min(daysInMonth, 20); i++) {
          const row = sheet.rows[i];
          if (!row.isSunday) {
            row.kehadiran = 'HADIR';
            row.jamMasuk = '07:30';
            row.jamKeluar = row.isSaturday ? '13:30' : '16:30';
            row.istirahat = '1 jam';
            row.jamNormal = row.isSaturday ? 5 : 7;
            row.jamLembur = row.day % 3 === 0 ? 2 : 0;
            row.totalJam = row.jamNormal + row.jamLembur;
            row.tunjanganMakan = emp.mealAllowance || 45000;
            row.tunjanganTransport = emp.transportAllowance || 25000;
            if (emp.position.includes('WELDER')) {
              row.tunjanganGougingCentang = row.day % 2 === 1;
              row.tunjanganGouging = row.tunjanganGougingCentang ? (emp.gougingAllowance || 20000) : 0;
            }
            row.namaKapal = row.day % 2 === 0 ? 'MV OCEANIC LEADER (PRJ-2026-001)' : 'MT PACIFIC CHEMIST (PRJ-2026-002)';
            
            // Calculate Total Upah
            if (emp.wageStatus === 'Jam') {
              row.totalUpah = (row.totalJam * emp.wage) + row.tunjanganMakan + row.tunjanganTransport + row.tunjanganGouging;
            } else if (emp.wageStatus === 'Bulan') {
              row.totalUpah = Math.round(emp.wage / 28) + row.tunjanganMakan + row.tunjanganTransport + row.tunjanganGouging;
            } else {
              row.totalUpah = emp.wage + row.tunjanganMakan + row.tunjanganTransport + row.tunjanganGouging;
            }
          } else {
            row.kehadiran = '-';
          }
        }
        sheets[sheet.id] = sheet;
      }
    });

    return sheets;
  }

  // ================= 1. SUB MENU FORM TIME SHEET =================
  public getFormTimesheets(date?: string): FormTimesheetEntry[] {
    if (date) {
      return this.formTimesheets.filter((t) => t.date === date);
    }
    return [...this.formTimesheets].sort((a, b) => b.createdAt - a.createdAt);
  }

  public addFormTimesheet(entry: Omit<FormTimesheetEntry, 'id' | 'createdAt'>): { 
    success: boolean; 
    error?: string; 
    entry?: FormTimesheetEntry 
  } {
    // 1. Validation: Employee status check
    const emp = employeeDb.getEmployeeByCode(entry.employeeId);
    if (!emp) {
      return { success: false, error: `Karyawan dengan ID ${entry.employeeId} tidak ditemukan dalam sistem!` };
    }

    if (emp.workStatus === 'TIDAK AKTIF' || emp.workStatus === 'DAFTAR HITAM') {
      return {
        success: false,
        error: `PEMBERITAHUAN: Karyawan ${emp.fullName} (${emp.employeeId}) berstatus ${emp.workStatus}! Tidak dapat mengisi atau diproses dalam Form Time Sheet.`,
      };
    }

    // 2. Validation: Duplicate check on the same date
    const isDuplicate = this.formTimesheets.some(
      (item) => item.employeeId.toUpperCase() === entry.employeeId.toUpperCase() && item.date === entry.date
    );

    if (isDuplicate) {
      return {
        success: false,
        error: `Data karyawan ${emp.fullName} (${emp.employeeId}) sudah terdaftar dalam Form Time Sheet untuk tanggal ${entry.date}! Tidak bisa mengisi data yang sama atau duplikat.`,
      };
    }

    const newRecord: FormTimesheetEntry = {
      ...entry,
      id: `ts-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fullName: emp.fullName,
      position: emp.position,
      department: emp.department || 'OPERASI',
      createdAt: Date.now(),
    };

    this.formTimesheets.unshift(newRecord);
    this.saveFormTimesheetsLocally();
    this.syncFormTimesheetToFirestore(newRecord);

    return { success: true, entry: newRecord };
  }

  public deleteFormTimesheet(id: string): boolean {
    const idx = this.formTimesheets.findIndex((t) => t.id === id);
    if (idx !== -1) {
      this.formTimesheets.splice(idx, 1);
      this.saveFormTimesheetsLocally();
      return true;
    }
    return false;
  }

  private saveFormTimesheetsLocally() {
    try {
      localStorage.setItem(STORAGE_KEY_FORM_TIMESHEET, JSON.stringify(this.formTimesheets));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  private async syncFormTimesheetToFirestore(record: FormTimesheetEntry) {
    try {
      await setDoc(doc(db, 'form_timesheets', record.id), record, { merge: true });
    } catch {
      // offline silent fallback
    }
  }

  public async exportFormTimesheetToExcel(date?: string): Promise<Blob> {
    const data = this.getFormTimesheets(date);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NEXAPROJECT Shipyard';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Form Time Sheet');
    sheet.columns = [
      { header: 'NO', key: 'no', width: 8 },
      { header: 'ID KARYAWAN', key: 'employeeId', width: 16 },
      { header: 'NAMA LENGKAP', key: 'fullName', width: 28 },
      { header: 'JABATAN', key: 'position', width: 22 },
      { header: 'DEPARTEMEN', key: 'department', width: 20 },
      { header: 'TANGGAL', key: 'date', width: 16 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };

    data.forEach((item, index) => {
      sheet.addRow({
        no: index + 1,
        employeeId: item.employeeId,
        fullName: item.fullName,
        position: item.position,
        department: item.department,
        date: item.date,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // ================= 2. SUB MENU FORM OVER TIME =================
  public getFormOvertimes(date?: string): FormOvertimeEntry[] {
    if (date) {
      return this.formOvertimes.filter((o) => o.date === date);
    }
    return [...this.formOvertimes].sort((a, b) => b.createdAt - a.createdAt);
  }

  public addFormOvertime(entry: Omit<FormOvertimeEntry, 'id' | 'createdAt'>): { 
    success: boolean; 
    error?: string; 
    entry?: FormOvertimeEntry 
  } {
    const emp = employeeDb.getEmployeeByCode(entry.employeeId);
    if (!emp) {
      return { success: false, error: `Karyawan dengan ID ${entry.employeeId} tidak ditemukan!` };
    }

    // Status check
    if (emp.workStatus === 'TIDAK AKTIF' || emp.workStatus === 'DAFTAR HITAM') {
      return {
        success: false,
        error: `PEMBERITAHUAN: Karyawan ${emp.fullName} (${emp.employeeId}) berstatus ${emp.workStatus}! Tidak dapat mengisi form lembur.`,
      };
    }

    // Duplicate check on same date
    const isDuplicate = this.formOvertimes.some(
      (item) => item.employeeId.toUpperCase() === entry.employeeId.toUpperCase() && item.date === entry.date
    );

    if (isDuplicate) {
      return {
        success: false,
        error: `Karyawan ${emp.fullName} (${emp.employeeId}) sudah memiliki data lembur pada tanggal ${entry.date}! Tidak bisa mengisi data yang sama atau duplikat.`,
      };
    }

    // Strip code & type from shipName if provided (e.g. "MV OCEANIC LEADER (PRJ-2026-001) - BULK CARRIER" -> "MV OCEANIC LEADER")
    const cleanShipName = entry.shipName.split('(')[0].trim();

    const newRecord: FormOvertimeEntry = {
      ...entry,
      id: `ot-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fullName: emp.fullName,
      position: emp.position,
      shipName: cleanShipName,
      createdAt: Date.now(),
    };

    this.formOvertimes.unshift(newRecord);
    this.saveFormOvertimesLocally();
    this.syncFormOvertimeToFirestore(newRecord);

    return { success: true, entry: newRecord };
  }

  public deleteFormOvertime(id: string): boolean {
    const idx = this.formOvertimes.findIndex((o) => o.id === id);
    if (idx !== -1) {
      this.formOvertimes.splice(idx, 1);
      this.saveFormOvertimesLocally();
      return true;
    }
    return false;
  }

  private saveFormOvertimesLocally() {
    try {
      localStorage.setItem(STORAGE_KEY_FORM_OVERTIME, JSON.stringify(this.formOvertimes));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  private async syncFormOvertimeToFirestore(record: FormOvertimeEntry) {
    try {
      await setDoc(doc(db, 'form_overtime', record.id), record, { merge: true });
    } catch {
      // offline fallback
    }
  }

  public async exportFormOvertimeToExcel(date?: string): Promise<Blob> {
    const data = this.getFormOvertimes(date);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NEXAPROJECT Shipyard';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Form Lembur (Over Time)');
    sheet.columns = [
      { header: 'NO', key: 'no', width: 8 },
      { header: 'NAMA LENGKAP', key: 'fullName', width: 28 },
      { header: 'ID KARYAWAN', key: 'employeeId', width: 16 },
      { header: 'JABATAN', key: 'position', width: 22 },
      { header: 'NAMA KAPAL', key: 'shipName', width: 28 },
      { header: 'TANGGAL', key: 'date', width: 16 },
      { header: 'JAM LEMBUR', key: 'hours', width: 14 },
      { header: 'KETERANGAN', key: 'notes', width: 30 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD97706' } };

    data.forEach((item, index) => {
      sheet.addRow({
        no: index + 1,
        fullName: item.fullName,
        employeeId: item.employeeId,
        position: item.position,
        shipName: item.shipName,
        date: item.date,
        hours: item.hours,
        notes: item.notes || '-',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // ================= 3. SUB MENU FORM NIGHT SHIFT =================
  public getFormNightShifts(date?: string): FormNightShiftEntry[] {
    if (date) {
      return this.formNightShifts.filter((n) => n.date === date);
    }
    return [...this.formNightShifts].sort((a, b) => b.createdAt - a.createdAt);
  }

  public addFormNightShift(entry: Omit<FormNightShiftEntry, 'id' | 'createdAt'>): { 
    success: boolean; 
    error?: string; 
    entry?: FormNightShiftEntry 
  } {
    const emp = employeeDb.getEmployeeByCode(entry.employeeId);
    if (!emp) {
      return { success: false, error: `Karyawan dengan ID ${entry.employeeId} tidak ditemukan!` };
    }

    if (emp.workStatus === 'TIDAK AKTIF' || emp.workStatus === 'DAFTAR HITAM') {
      return {
        success: false,
        error: `PEMBERITAHUAN: Karyawan ${emp.fullName} (${emp.employeeId}) berstatus ${emp.workStatus}! Tidak dapat mengisi form night shift.`,
      };
    }

    // Duplicate check on same date
    const isDuplicate = this.formNightShifts.some(
      (item) => item.employeeId.toUpperCase() === entry.employeeId.toUpperCase() && item.date === entry.date
    );

    if (isDuplicate) {
      return {
        success: false,
        error: `Karyawan ${emp.fullName} (${emp.employeeId}) sudah terdaftar dalam form night shift pada tanggal ${entry.date}! Tidak bisa mengisi data yang sama atau duplikat.`,
      };
    }

    // Clean shipName only without code/type
    const cleanShipName = entry.shipName.split('(')[0].trim();

    const newRecord: FormNightShiftEntry = {
      ...entry,
      id: `ns-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      fullName: emp.fullName,
      position: emp.position,
      shipName: cleanShipName,
      shift: 'MALAM',
      createdAt: Date.now(),
    };

    this.formNightShifts.unshift(newRecord);
    this.saveFormNightShiftsLocally();
    this.syncFormNightShiftToFirestore(newRecord);

    return { success: true, entry: newRecord };
  }

  public deleteFormNightShift(id: string): boolean {
    const idx = this.formNightShifts.findIndex((n) => n.id === id);
    if (idx !== -1) {
      this.formNightShifts.splice(idx, 1);
      this.saveFormNightShiftsLocally();
      return true;
    }
    return false;
  }

  private saveFormNightShiftsLocally() {
    try {
      localStorage.setItem(STORAGE_KEY_FORM_NIGHTSHIFT, JSON.stringify(this.formNightShifts));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  private async syncFormNightShiftToFirestore(record: FormNightShiftEntry) {
    try {
      await setDoc(doc(db, 'form_nightshift', record.id), record, { merge: true });
    } catch {
      // offline fallback
    }
  }

  public async exportFormNightShiftToExcel(date?: string): Promise<Blob> {
    const data = this.getFormNightShifts(date);
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NEXAPROJECT Shipyard';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Form Night Shift (Shift Malam)');
    sheet.columns = [
      { header: 'NO', key: 'no', width: 8 },
      { header: 'NAMA LENGKAP', key: 'fullName', width: 28 },
      { header: 'ID KARYAWAN', key: 'employeeId', width: 16 },
      { header: 'JABATAN', key: 'position', width: 22 },
      { header: 'NAMA KAPAL', key: 'shipName', width: 28 },
      { header: 'TANGGAL', key: 'date', width: 16 },
      { header: 'SHIFT', key: 'shift', width: 12 },
      { header: 'JAM KERJA', key: 'hours', width: 14 },
      { header: 'KETERANGAN', key: 'notes', width: 30 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4338CA' } };

    data.forEach((item, index) => {
      sheet.addRow({
        no: index + 1,
        fullName: item.fullName,
        employeeId: item.employeeId,
        position: item.position,
        shipName: item.shipName,
        date: item.date,
        shift: item.shift,
        hours: item.hours,
        notes: item.notes || '-',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // ================= 4. SUB MENU KALKULASI WAKTU =================
  private getSheetKey(employeeId: string, year: number, month: number): string {
    const mStr = String(month).padStart(2, '0');
    return `calc-${employeeId}-${year}-${mStr}`;
  }

  public createEmptySheet(employeeId: string, year: number, month: number): MonthlyTimeCalcSheet {
    const emp = employeeDb.getEmployeeByCode(employeeId) || {
      employeeId,
      fullName: 'Karyawan Galangan',
      position: 'OPERATOR',
      department: 'OPERASI',
      wage: 50000,
      wageStatus: 'Jam',
      mealAllowance: 45000,
      transportAllowance: 25000,
      gougingAllowance: 0,
    };

    const daysCount = getDaysInMonth(year, month);
    const rows: DailyTimeCalcRow[] = [];

    for (let day = 1; day <= daysCount; day++) {
      const d = new Date(year, month - 1, day);
      const dayOfWeek = d.getDay(); // 0 = Minggu, 6 = Sabtu
      const dayName = DAY_NAMES[dayOfWeek];
      const isSaturday = dayOfWeek === 6;
      const isSunday = dayOfWeek === 0;
      const mStr = String(month).padStart(2, '0');
      const dayStr = String(day).padStart(2, '0');
      const dateStr = `${year}-${mStr}-${dayStr}`;

      rows.push({
        day,
        date: dateStr,
        dayName,
        isSaturday,
        isSunday,
        jamMasuk: '',
        jamKeluar: '',
        istirahat: '1 jam',
        jamNormal: 0,
        jamLembur: 0,
        totalJam: 0,
        kehadiran: '-', // Tampilan pertama diberi tanda - saja
        tunjanganMakan: 0,
        tunjanganTransport: 0,
        tunjanganGougingCentang: false,
        tunjanganGouging: 0,
        namaKapal: '',
        totalUpah: 0,
      });
    }

    return {
      id: this.getSheetKey(employeeId, year, month),
      employeeId,
      employeeName: emp.fullName,
      position: emp.position,
      department: emp.department || 'OPERASI',
      wage: emp.wage,
      wageStatus: emp.wageStatus,
      mealAllowance: emp.mealAllowance,
      transportAllowance: emp.transportAllowance,
      gougingAllowance: emp.gougingAllowance,
      year,
      month,
      rows,
      updatedAt: Date.now(),
    };
  }

  public getTimeCalcSheet(employeeId: string, year: number, month: number): MonthlyTimeCalcSheet {
    const key = this.getSheetKey(employeeId, year, month);
    if (!this.timeCalcSheets[key]) {
      this.timeCalcSheets[key] = this.createEmptySheet(employeeId, year, month);
      this.saveTimeCalcSheetsLocally();
    }
    return this.timeCalcSheets[key];
  }

  public saveTimeCalcSheet(sheet: MonthlyTimeCalcSheet): void {
    sheet.updatedAt = Date.now();
    this.timeCalcSheets[sheet.id] = sheet;
    this.saveTimeCalcSheetsLocally();
    this.syncTimeCalcSheetToFirestore(sheet);
  }

  public updateTimeCalcRow(
    employeeId: string,
    year: number,
    month: number,
    dayNumber: number,
    updates: Partial<DailyTimeCalcRow>
  ): MonthlyTimeCalcSheet {
    const sheet = this.getTimeCalcSheet(employeeId, year, month);
    const rowIdx = sheet.rows.findIndex((r) => r.day === dayNumber);
    if (rowIdx === -1) return sheet;

    const row = { ...sheet.rows[rowIdx], ...updates };
    const emp = employeeDb.getEmployeeByCode(employeeId);
    const mealRef = emp?.mealAllowance ?? sheet.mealAllowance;
    const transportRef = emp?.transportAllowance ?? sheet.transportAllowance;
    const gougingRef = emp?.gougingAllowance ?? sheet.gougingAllowance;
    const wageRef = emp?.wage ?? sheet.wage;
    const wageStatusRef = emp?.wageStatus ?? sheet.wageStatus;

    // Rules from User Prompt:
    // 1. "Jika pada Kehadiran menjadi HADIR maka semua baris pada tanggal itu pada data Bagian 2 Rekap Hari bisa diisi selain dari HADIR tidak bisa diisi semua."
    // 2. "Jika Kehadiran menjadi HADIR maka secara otomatis Tunjangan Makan dan Tunjangan Transportasi terisi."
    // 3. "Pada Tunjangan Gouging diberi tanda untuk centang untuk Iya/Tidak (jika Iya maka nilainya sesuai acuan pada Data Karyawan jika Tidak maka nilainya 0)"

    if (row.kehadiran === 'HADIR') {
      // Auto-populate meal and transport
      row.tunjanganMakan = mealRef;
      row.tunjanganTransport = transportRef;
      
      // Gouging checkbox check
      row.tunjanganGouging = row.tunjanganGougingCentang ? gougingRef : 0;
      
      // Total Jam
      row.totalJam = (Number(row.jamNormal) || 0) + (Number(row.jamLembur) || 0);

      // Hitungan Total Upah
      // If wageStatus is 'Jam': Total Jam x Upah/Gaji + Tunjangan Makan + Transport + Gouging
      // If wageStatus is 'Bulan': Upah/Gaji / 28 + Tunjangan Makan + Transport + Gouging
      // If wageStatus is 'Hari': Upah/Gaji + Tunjangan Makan + Transport + Gouging
      if (wageStatusRef === 'Jam') {
        row.totalUpah = (row.totalJam * wageRef) + row.tunjanganMakan + row.tunjanganTransport + row.tunjanganGouging;
      } else if (wageStatusRef === 'Bulan') {
        row.totalUpah = Math.round(wageRef / 28) + row.tunjanganMakan + row.tunjanganTransport + row.tunjanganGouging;
      } else {
        row.totalUpah = wageRef + row.tunjanganMakan + row.tunjanganTransport + row.tunjanganGouging;
      }
    } else {
      // Not HADIR: cannot fill other fields, zero out allowances & hours
      row.jamMasuk = '';
      row.jamKeluar = '';
      row.jamNormal = 0;
      row.jamLembur = 0;
      row.totalJam = 0;
      row.tunjanganMakan = 0;
      row.tunjanganTransport = 0;
      row.tunjanganGougingCentang = false;
      row.tunjanganGouging = 0;
      row.namaKapal = '';
      row.totalUpah = 0;
    }

    sheet.rows[rowIdx] = row;
    this.saveTimeCalcSheet(sheet);
    return sheet;
  }

  public calculateMonthlySummary(
    sheet: MonthlyTimeCalcSheet,
    userRole: UserRole,
    userPosition?: string
  ): MonthlyTimeCalcSummary {
    let totalJamNormal = 0;
    let totalJamLembur = 0;
    let totalJam = 0;
    let hadirCount = 0;
    let alphaCount = 0;
    let izinSakitCount = 0;
    let totalTunjanganMakan = 0;
    let totalTunjanganTransport = 0;
    let totalTunjanganGouging = 0;
    let totalUpah = 0;

    sheet.rows.forEach((row) => {
      totalJamNormal += row.jamNormal || 0;
      totalJamLembur += row.jamLembur || 0;
      totalJam += row.totalJam || 0;

      if (row.kehadiran === 'HADIR') {
        hadirCount++;
      } else if (row.kehadiran === 'ALPHA') {
        alphaCount++;
      } else if (row.kehadiran === 'SAKIT' || row.kehadiran === 'IZIN') {
        izinSakitCount++;
      }

      totalTunjanganMakan += row.tunjanganMakan || 0;
      totalTunjanganTransport += row.tunjanganTransport || 0;
      totalTunjanganGouging += row.tunjanganGouging || 0;
      totalUpah += row.totalUpah || 0;
    });

    // Rule: "Tunjangan Gouging (hanya ditampilkan untuk jabatan Foreman Welder, Welder, Role Creator dan Admin)"
    const pos = (userPosition || sheet.position || '').toUpperCase();
    const canViewGouging = 
      userRole === 'creator' || 
      userRole === 'admin' || 
      pos.includes('FOREMAN WELDER') || 
      pos.includes('WELDER');

    return {
      totalJamNormal,
      totalJamLembur,
      totalJam,
      hadirCount,
      alphaCount,
      izinSakitCount,
      totalTunjanganMakan,
      totalTunjanganTransport,
      totalTunjanganGouging,
      totalUpah,
      canViewGouging,
    };
  }

  private saveTimeCalcSheetsLocally() {
    try {
      localStorage.setItem(STORAGE_KEY_TIME_CALC_SHEETS, JSON.stringify(this.timeCalcSheets));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
  }

  private async syncTimeCalcSheetToFirestore(sheet: MonthlyTimeCalcSheet) {
    try {
      await setDoc(doc(db, 'time_calc_sheets', sheet.id), sheet, { merge: true });
    } catch {
      // offline fallback
    }
  }

  public async exportTimeCalcSheetToExcel(sheet: MonthlyTimeCalcSheet): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NEXAPROJECT Shipyard';
    workbook.created = new Date();

    const sheetName = `Kalkulasi ${sheet.employeeId}`;
    const worksheet = workbook.addWorksheet(sheetName.substring(0, 31));

    // Title & Info
    worksheet.mergeCells('A1:L1');
    const titleCell = worksheet.getCell('A1');
    titleCell.value = `LEMBAR REKAPITULASI KERJA & KALKULASI WAKTU - BULAN ${sheet.month}/${sheet.year}`;
    titleCell.font = { bold: true, size: 14, color: { argb: 'FFFFFFFF' } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    titleCell.alignment = { horizontal: 'center' };

    worksheet.addRow([
      `ID: ${sheet.employeeId}`,
      `NAMA: ${sheet.employeeName}`,
      `JABATAN: ${sheet.position}`,
      `UPAH: ${formatIDR(sheet.wage)} (${sheet.wageStatus})`,
    ]);

    worksheet.addRow([]); // empty spacing

    // Columns
    const headerRowIdx = 4;
    worksheet.getRow(headerRowIdx).values = [
      'TGL',
      'HARI',
      'JAM MASUK',
      'JAM KELUAR',
      'ISTIRAHAT',
      'JAM NORMAL',
      'JAM LEMBUR',
      'TOTAL JAM',
      'KEHADIRAN',
      'TJ. MAKAN',
      'TJ. TRANSPORT',
      'TJ. GOUGING',
      'KAPAL / PROYEK',
      'TOTAL UPAH (IDR)',
    ];

    const header = worksheet.getRow(headerRowIdx);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };

    sheet.rows.forEach((row, i) => {
      const addedRow = worksheet.addRow([
        row.day,
        row.dayName,
        row.jamMasuk || '-',
        row.jamKeluar || '-',
        row.istirahat,
        row.jamNormal,
        row.jamLembur,
        row.totalJam,
        row.kehadiran,
        row.tunjanganMakan,
        row.tunjanganTransport,
        row.tunjanganGouging,
        row.namaKapal || '-',
        row.totalUpah,
      ]);

      // Visual requirement:
      // "Hari sabtu berwarna Biru dan Minggu berwarna Merah"
      if (row.isSaturday) {
        addedRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE0F2FE' }, // Light Blue
        };
        addedRow.font = { color: { argb: 'FF0369A1' }, bold: true };
      } else if (row.isSunday) {
        addedRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFE4E6' }, // Light Rose / Red
        };
        addedRow.font = { color: { argb: 'FFE11D48' }, bold: true };
      }
    });

    // Formatting widths
    worksheet.columns = [
      { width: 6 },
      { width: 12 },
      { width: 14 },
      { width: 14 },
      { width: 12 },
      { width: 14 },
      { width: 14 },
      { width: 12 },
      { width: 14 },
      { width: 16 },
      { width: 16 },
      { width: 16 },
      { width: 34 },
      { width: 22 },
    ];

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // ================= 5. SUB MENU KALKULASI PROYEK =================
  public getProjectCalcRows(year: number, month: number, projectFilter?: string): ProjectCalcRow[] {
    const results: ProjectCalcRow[] = [];
    const allEmployees = employeeDb.getEmployees();

    allEmployees.forEach((emp) => {
      const sheet = this.getTimeCalcSheet(emp.employeeId, year, month);
      sheet.rows.forEach((row) => {
        if (row.kehadiran === 'HADIR' && row.namaKapal) {
          if (!projectFilter || projectFilter === 'ALL' || row.namaKapal.includes(projectFilter)) {
            results.push({
              id: `pcalc-${emp.employeeId}-${row.day}`,
              tanggal: row.date,
              employeeId: emp.employeeId,
              employeeName: emp.fullName,
              shiftKerja: emp.workShift || 'PAGI',
              namaKapal: row.namaKapal,
              totalJam: row.totalJam,
            });
          }
        }
      });
    });

    return results.sort((a, b) => a.tanggal.localeCompare(b.tanggal));
  }

  public async exportProjectCalcToExcel(
    rows: ProjectCalcRow[],
    year: number,
    month: number,
    projectFilter?: string
  ): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NEXAPROJECT Shipyard';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Kalkulasi Proyek');
    sheet.columns = [
      { header: 'TANGGAL', key: 'tanggal', width: 16 },
      { header: 'ID KARYAWAN', key: 'employeeId', width: 16 },
      { header: 'NAMA KARYAWAN', key: 'employeeName', width: 28 },
      { header: 'SHIFT KERJA', key: 'shiftKerja', width: 14 },
      { header: 'NAMA KAPAL (BESERTA KODE)', key: 'namaKapal', width: 36 },
      { header: 'TOTAL JAM', key: 'totalJam', width: 14 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D9488' } }; // Teal

    rows.forEach((r) => {
      sheet.addRow(r);
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // ================= 6. SUB MENU SUMMARY =================
  public getSummaryMatrix(year: number, month: number): EmployeeMonthSummaryMatrix[] {
    const allEmployees = employeeDb.getEmployees();
    const daysCount = getDaysInMonth(year, month);

    return allEmployees.map((emp) => {
      const sheet = this.getTimeCalcSheet(emp.employeeId, year, month);
      const dailyHours: { [day: number]: number } = {};
      let totalJam = 0;
      let totalMakan = 0;
      let totalTransport = 0;
      let totalGouging = 0;

      for (let d = 1; d <= daysCount; d++) {
        const found = sheet.rows.find((r) => r.day === d);
        const hours = found ? found.totalJam : 0;
        dailyHours[d] = hours;
        totalJam += hours;
        if (found) {
          totalMakan += found.tunjanganMakan || 0;
          totalTransport += found.tunjanganTransport || 0;
          totalGouging += found.tunjanganGouging || 0;
        }
      }

      // 5. Total Upah: diisi dari Total Jam (point 4) x Upah Karyawan (hanya untuk yang memiliki status upah JAM)
      let totalUpah = 0;
      if (emp.wageStatus === 'Jam') {
        totalUpah = totalJam * emp.wage;
      } else if (emp.wageStatus === 'Bulan') {
        // proporsional berdasarkan hari hadir jika ada
        const activeDays = sheet.rows.filter((r) => r.kehadiran === 'HADIR').length;
        totalUpah = Math.round((emp.wage / 28) * activeDays);
      } else {
        const activeDays = sheet.rows.filter((r) => r.kehadiran === 'HADIR').length;
        totalUpah = emp.wage * activeDays;
      }

      // 9. Total Keseluruhan: penjumlahan dari Point 5, 6, 7, 8
      const totalKeseluruhan = totalUpah + totalMakan + totalTransport + totalGouging;

      return {
        employeeId: emp.employeeId,
        employeeName: emp.fullName,
        position: emp.position,
        wage: emp.wage,
        wageStatus: emp.wageStatus,
        dailyHours,
        totalJam,
        totalUpah,
        totalTunjanganMakan: totalMakan,
        totalTunjanganTransport: totalTransport,
        totalTunjanganGouging: totalGouging,
        totalKeseluruhan,
      };
    });
  }

  public async exportSummaryMatrixToExcel(
    matrix: EmployeeMonthSummaryMatrix[],
    year: number,
    month: number
  ): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NEXAPROJECT Shipyard';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(`Summary ${month}-${year}`);
    const daysCount = getDaysInMonth(year, month);

    // Columns: ID, NAMA, 1..daysCount, TOTAL JAM, TOTAL UPAH, MAKAN, TRANSPORT, GOUGING, TOTAL KESELURUHAN
    const columns: Partial<ExcelJS.Column>[] = [
      { header: 'ID KARYAWAN', key: 'employeeId', width: 14 },
      { header: 'NAMA KARYAWAN', key: 'employeeName', width: 26 },
    ];

    for (let d = 1; d <= daysCount; d++) {
      columns.push({ header: `TGL ${d}`, key: `d_${d}`, width: 8 });
    }

    columns.push(
      { header: 'TOTAL JAM', key: 'totalJam', width: 14 },
      { header: 'TOTAL UPAH', key: 'totalUpah', width: 18 },
      { header: 'TJ. MAKAN', key: 'makan', width: 16 },
      { header: 'TJ. TRANSPORT', key: 'transport', width: 16 },
      { header: 'TJ. GOUGING', key: 'gouging', width: 16 },
      { header: 'TOTAL KESELURUHAN', key: 'totalKeseluruhan', width: 22 }
    );

    sheet.columns = columns;

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E1B4B' } }; // Indigo dark

    // Color code Saturday (blue) and Sunday (red) in header
    for (let d = 1; d <= daysCount; d++) {
      const dayOfWeek = new Date(year, month - 1, d).getDay();
      const colCell = headerRow.getCell(2 + d);
      if (dayOfWeek === 6) {
        // Sabtu
        colCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };
      } else if (dayOfWeek === 0) {
        // Minggu
        colCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE11D48' } };
      }
    }

    matrix.forEach((item) => {
      const rowData: Record<string, any> = {
        employeeId: item.employeeId,
        employeeName: item.employeeName,
        totalJam: item.totalJam,
        totalUpah: item.totalUpah,
        makan: item.totalTunjanganMakan,
        transport: item.totalTunjanganTransport,
        gouging: item.totalTunjanganGouging,
        totalKeseluruhan: item.totalKeseluruhan,
      };

      for (let d = 1; d <= daysCount; d++) {
        rowData[`d_${d}`] = item.dailyHours[d] || 0;
      }

      sheet.addRow(rowData);
    });

    sheet.getColumn('totalUpah').numFmt = '#,##0';
    sheet.getColumn('makan').numFmt = '#,##0';
    sheet.getColumn('transport').numFmt = '#,##0';
    sheet.getColumn('gouging').numFmt = '#,##0';
    sheet.getColumn('totalKeseluruhan').numFmt = '#,##0';

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // ================= 7. SUB MENU BIAYA PEKERJA =================
  public getProjectWorkerCosts(
    year: number,
    month: number,
    projectFilter?: string
  ): ProjectWorkerCostRow[] {
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    const monthLabel = `${months[month - 1]} ${year}`;
    const allEmployees = employeeDb.getEmployees();
    const mapKey: Record<string, ProjectWorkerCostRow> = {};

    allEmployees.forEach((emp) => {
      const sheet = this.getTimeCalcSheet(emp.employeeId, year, month);
      sheet.rows.forEach((row) => {
        if (row.kehadiran === 'HADIR' && row.namaKapal) {
          if (!projectFilter || projectFilter === 'ALL' || row.namaKapal.includes(projectFilter)) {
            const key = `${row.namaKapal}___${emp.employeeId}`;
            if (!mapKey[key]) {
              mapKey[key] = {
                id: `cost-${key}`,
                bulan: monthLabel,
                proyek: row.namaKapal,
                employeeId: emp.employeeId,
                employeeName: emp.fullName,
                totalJam: 0,
                totalHari: 0,
                totalUpah: 0,
              };
            }
            mapKey[key].totalJam += row.totalJam;
            mapKey[key].totalHari += 1;
            mapKey[key].totalUpah += row.totalUpah;
          }
        }
      });
    });

    return Object.values(mapKey).sort((a, b) => a.proyek.localeCompare(b.proyek));
  }

  public async exportProjectWorkerCostsToExcel(
    rows: ProjectWorkerCostRow[],
    year: number,
    month: number
  ): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NEXAPROJECT Shipyard';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Biaya Pekerja Proyek');
    sheet.columns = [
      { header: 'BULAN', key: 'bulan', width: 18 },
      { header: 'PROYEK KAPAL', key: 'proyek', width: 34 },
      { header: 'ID KARYAWAN', key: 'employeeId', width: 14 },
      { header: 'NAMA KARYAWAN', key: 'employeeName', width: 28 },
      { header: 'TOTAL JAM', key: 'totalJam', width: 14 },
      { header: 'TOTAL HARI', key: 'totalHari', width: 14 },
      { header: 'TOTAL BIAYA UPAH (IDR)', key: 'totalUpah', width: 24 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF047857' } }; // Emerald dark

    rows.forEach((r) => {
      sheet.addRow(r);
    });

    sheet.getColumn('totalUpah').numFmt = '#,##0';

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // ================= LEGACY COMPATIBILITY METHODS =================
  public getAttendance(date?: string): DailyAttendanceRecord[] {
    if (date) {
      return this.attendanceList.filter((a) => a.date === date);
    }
    return [...this.attendanceList];
  }

  public getOvertimeClaims(): OvertimeClaimRecord[] {
    return [...this.overtimeList];
  }

  public calculateLaborCostByProject(): LaborProjectSummary[] {
    const projects = projectDb.getProjects();
    return projects.map((p) => {
      return {
        projectId: p.id,
        projectCode: p.projectCode,
        shipName: p.shipName,
        totalWorkers: 12,
        totalRegularHours: 240,
        totalOvertimeHours: 64,
        totalRegularWage: 38400000,
        totalOvertimeCost: 15360000,
        totalLaborCost: 53760000,
      };
    });
  }

  public async exportAttendanceToExcel(date?: string): Promise<Blob> {
    return this.exportFormTimesheetToExcel(date);
  }
}

export const attendanceDb = new AttendanceDatabaseService();
