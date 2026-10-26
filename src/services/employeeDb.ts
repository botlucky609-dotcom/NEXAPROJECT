import ExcelJS from 'exceljs';
import { EmployeeRecord } from '../types/employee';
import { UserRole } from '../types/auth';
import { db } from './firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { dbService } from './db';

const STORAGE_KEY_EMPLOYEES = 'nexaproject_employees_v1';

// Initial seed employees reflecting shipyard operation roles
const DEFAULT_EMPLOYEES: EmployeeRecord[] = [
  {
    id: 'emp-rec-001',
    employeeId: 'EMP-001',
    fullName: 'MUHAMMAD ANDRI',
    position: 'PROJECT MANAGER',
    joinDate: '2023-01-15',
    workShift: 'PAGI',
    workStatus: 'AKTIF',
    department: 'STEEL WORK',
    projectType: 'SHIP REPAIR',
    workLocation: 'Drydock 1 - Galangan Utama',
    wage: 25000000,
    wageStatus: 'Bulan',
    mealAllowance: 1500000,
    transportAllowance: 1200000,
    gougingAllowance: 0,
    address: 'Jl. Galangan Samudera No. 42, Batam',
    birthPlace: 'Batam',
    birthDate: '1990-06-05',
    age: 36,
    religion: 'Islam',
    maritalStatus: 'K/2',
    fatherName: 'Syamsudin',
    motherName: 'Rohana',
    phone: '0812-3456-7890',
    ktpNumber: '2171010506900001',
    kkNumber: '2171012004120005',
    npwpNumber: '81.423.512.4-215.000',
    bpjsNumber: '0001428591024',
    bankAccountNumber: '9012384721',
    bankName: 'BANK OCBC (OCBC NISP)',
    email: 'muhammad.andri0605@gmail.com',
    accountRole: 'creator',
    createdAt: Date.now() - 60 * 24 * 3600 * 1000,
    updatedAt: Date.now(),
  },
  {
    id: 'emp-rec-002',
    employeeId: 'EMP-002',
    fullName: 'BAMBANG SETIAWAN',
    position: 'SUPERVISOR',
    joinDate: '2023-03-01',
    workShift: 'PAGI',
    workStatus: 'AKTIF',
    department: 'PIPING',
    projectType: 'NEW BUILDING',
    workLocation: 'Berth 3 & Fabrikasi Pipa',
    wage: 14500000,
    wageStatus: 'Bulan',
    mealAllowance: 1200000,
    transportAllowance: 800000,
    gougingAllowance: 0,
    address: 'Komp. Marina Permai Blok B No. 12, Batam',
    birthPlace: 'Surabaya',
    birthDate: '1988-11-20',
    age: 37,
    religion: 'Islam',
    maritalStatus: 'K/1',
    fatherName: 'Sudaryo',
    motherName: 'Sutini',
    phone: '0813-8821-9901',
    ktpNumber: '2171022011880002',
    kkNumber: '2171021105150003',
    npwpNumber: '75.210.998.1-215.000',
    bpjsNumber: '0001992837411',
    bankAccountNumber: '123000881920',
    bankName: 'BANK MANDIRI',
    email: 'admin@nexaproject.com',
    accountRole: 'admin',
    createdAt: Date.now() - 50 * 24 * 3600 * 1000,
    updatedAt: Date.now(),
  },
  {
    id: 'emp-rec-003',
    employeeId: 'EMP-003',
    fullName: 'SITI NURHALIZA',
    position: 'ADMINISTRATION',
    joinDate: '2023-06-10',
    workShift: 'PAGI',
    workStatus: 'AKTIF',
    department: 'STEEL WORK',
    projectType: 'SHIP REPAIR',
    workLocation: 'Kantor Administrasi Lapangan',
    wage: 8500000,
    wageStatus: 'Bulan',
    mealAllowance: 900000,
    transportAllowance: 600000,
    gougingAllowance: 0,
    address: 'Komp. Tiban Indah Asri Blok C-8, Batam',
    birthPlace: 'Medan',
    birthDate: '1995-04-14',
    age: 31,
    religion: 'Islam',
    maritalStatus: 'TK/0',
    fatherName: 'Hasibuan',
    motherName: 'Nurlela',
    phone: '0821-7788-9912',
    ktpNumber: '2171031404950004',
    kkNumber: '2171030908180001',
    npwpNumber: '89.112.334.5-215.000',
    bpjsNumber: '0002551982736',
    bankAccountNumber: '8210398211',
    bankName: 'BANK CENTRAL ASIA (BCA)',
    email: 'staff@nexaproject.com',
    accountRole: 'staff',
    createdAt: Date.now() - 40 * 24 * 3600 * 1000,
    updatedAt: Date.now(),
  },
  {
    id: 'emp-rec-004',
    employeeId: 'EMP-004',
    fullName: 'AHMAD RIFAI',
    position: 'WELDER',
    joinDate: '2023-08-01',
    workShift: 'PAGI',
    workStatus: 'AKTIF',
    department: 'STEEL WORK',
    projectType: 'SHIP REPAIR',
    workLocation: 'Drydock 1 - Lambung Kanan',
    wage: 52000,
    wageStatus: 'Jam',
    mealAllowance: 45000,
    transportAllowance: 25000,
    gougingAllowance: 20000, // Foreman Welder / Welder allowance
    address: 'Kavling Sagulung Mandiri Blok D No. 2, Batam',
    birthPlace: 'Semarang',
    birthDate: '1992-09-18',
    age: 34,
    religion: 'Islam',
    maritalStatus: 'K/2',
    fatherName: 'Marzuki',
    motherName: 'Sumarni',
    phone: '0852-6633-1189',
    ktpNumber: '2171041809920003',
    kkNumber: '2171042302160002',
    npwpNumber: '92.331.445.6-215.000',
    bpjsNumber: '0003119824512',
    bankAccountNumber: '028192837482',
    bankName: 'BANK OCBC (OCBC NISP)',
    email: 'karyawan@nexaproject.com',
    accountRole: 'karyawan',
    createdAt: Date.now() - 30 * 24 * 3600 * 1000,
    updatedAt: Date.now(),
  },
  {
    id: 'emp-rec-005',
    employeeId: 'EMP-005',
    fullName: 'DEDI SUPRIADI',
    position: 'FOREMAN WELDER',
    joinDate: '2023-05-15',
    workShift: 'PAGI',
    workStatus: 'AKTIF',
    department: 'STEEL WORK',
    projectType: 'MODUL',
    workLocation: 'Bengkel Fabrikasi Modul 2',
    wage: 65000,
    wageStatus: 'Jam',
    mealAllowance: 50000,
    transportAllowance: 30000,
    gougingAllowance: 25000, // Foreman Welder
    address: 'Perumahan Fanindo Blok F No. 19, Tanjung Uncang',
    birthPlace: 'Cilacap',
    birthDate: '1987-03-25',
    age: 39,
    religion: 'Islam',
    maritalStatus: 'K/3',
    fatherName: 'Wagimin',
    motherName: 'Suryati',
    phone: '0811-7788-2233',
    ktpNumber: '2171052503870001',
    kkNumber: '2171051210130008',
    npwpNumber: '68.441.229.0-215.000',
    bpjsNumber: '0001776528190',
    bankAccountNumber: '00392817281',
    bankName: 'BANK OCBC (OCBC NISP)',
    email: 'dedi.supriadi@nexaproject.com',
    accountRole: 'karyawan',
    createdAt: Date.now() - 25 * 24 * 3600 * 1000,
    updatedAt: Date.now(),
  },
  {
    id: 'emp-rec-006',
    employeeId: 'EMP-006',
    fullName: 'HENDRA WIJAYA',
    position: 'FITTER',
    joinDate: '2022-11-10',
    workShift: 'PAGI',
    workStatus: 'TIDAK AKTIF', // Inactive employee for testing validation
    department: 'STEEL WORK',
    projectType: 'SHIP REPAIR',
    workLocation: 'Graving Dock 2',
    wage: 48000,
    wageStatus: 'Jam',
    mealAllowance: 40000,
    transportAllowance: 25000,
    gougingAllowance: 0,
    address: 'Kavling Baru Sagulung Blok C No. 12',
    birthPlace: 'Batam',
    birthDate: '1990-11-11',
    age: 36,
    religion: 'Islam',
    maritalStatus: 'K/1',
    fatherName: 'Wijaya',
    motherName: 'Siti Aminah',
    phone: '0813-9988-1122',
    ktpNumber: '2171061111900002',
    kkNumber: '2171062001150003',
    npwpNumber: '75.221.998.1-215.000',
    bpjsNumber: '0001889922114',
    bankAccountNumber: '1122334455',
    bankName: 'BANK MANDIRI',
    email: 'hendra.wijaya@example.com',
    accountRole: 'karyawan',
    createdAt: Date.now() - 100 * 24 * 3600 * 1000,
    updatedAt: Date.now(),
  },
  {
    id: 'emp-rec-007',
    employeeId: 'EMP-007',
    fullName: 'RUDI HERMAWAN',
    position: 'HELPER',
    joinDate: '2023-02-01',
    workShift: 'PAGI',
    workStatus: 'DAFTAR HITAM', // Blacklisted employee for testing validation
    department: 'CLEANING',
    projectType: 'SHIP REPAIR',
    workLocation: 'Slipway Rel B',
    wage: 42000,
    wageStatus: 'Jam',
    mealAllowance: 35000,
    transportAllowance: 20000,
    gougingAllowance: 0,
    address: 'Jl. Dapur 12 No. 8, Batu Aji',
    birthPlace: 'Palembang',
    birthDate: '1994-02-02',
    age: 32,
    religion: 'Islam',
    maritalStatus: 'TK/0',
    fatherName: 'Hermawan',
    motherName: 'Rohani',
    phone: '0856-7788-9900',
    ktpNumber: '2171070202940005',
    kkNumber: '2171071203170001',
    npwpNumber: '88.332.114.9-215.000',
    bpjsNumber: '0001990033221',
    bankAccountNumber: '5544332211',
    bankName: 'BANK BRI',
    email: 'rudi.hermawan@example.com',
    accountRole: 'karyawan',
    createdAt: Date.now() - 90 * 24 * 3600 * 1000,
    updatedAt: Date.now(),
  },
];

class EmployeeDatabaseService {
  private employees: EmployeeRecord[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_EMPLOYEES);
      if (stored) {
        this.employees = JSON.parse(stored);
      } else {
        this.employees = DEFAULT_EMPLOYEES;
        localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(DEFAULT_EMPLOYEES));
      }
    } catch {
      this.employees = DEFAULT_EMPLOYEES;
    }
  }

  // Get all employees sorted by employeeId or name
  public getEmployees(sortBy: 'id' | 'name' = 'id'): EmployeeRecord[] {
    const list = [...this.employees];
    if (sortBy === 'name') {
      return list.sort((a, b) => a.fullName.localeCompare(b.fullName));
    }
    return list.sort((a, b) => a.employeeId.localeCompare(b.employeeId));
  }

  public getEmployeeById(id: string): EmployeeRecord | undefined {
    return this.employees.find((e) => e.id === id || e.employeeId === id);
  }

  public getEmployeeByCode(employeeId: string): EmployeeRecord | undefined {
    return this.employees.find((e) => e.employeeId === employeeId || e.id === employeeId);
  }

  public getEmployeeByEmail(email: string): EmployeeRecord | undefined {
    return this.employees.find((e) => e.email.toLowerCase() === email.trim().toLowerCase());
  }

  // Check unique ID
  public isEmployeeIdTaken(employeeId: string, currentId?: string): boolean {
    const cleanId = employeeId.trim().toUpperCase();
    return this.employees.some((e) => e.employeeId.toUpperCase() === cleanId && e.id !== currentId);
  }

  // Calculate age from birth date
  public calculateAge(birthDate: string): number {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return Math.max(0, age);
  }

  // Check if an employee is a Creator account
  public isCreatorAccount(record: EmployeeRecord | Partial<EmployeeRecord>): boolean {
    const email = (record.email || '').toLowerCase().trim();
    return (
      record.accountRole === 'creator' ||
      email === 'muhammad.andri0605@gmail.com' ||
      email === 'ronalpaman@gmail.com' ||
      email === 'creator@nexaproject.com' ||
      record.employeeId === 'EMP-001'
    );
  }

  // ==============================================================
  // REAL-TIME FIRESTORE DATA SYNCHRONIZATION (Requirement 1 & 2)
  // ==============================================================

  /**
   * Seed default shipyard workforce to Firestore if cloud collection is empty
   */
  public async seedDefaultEmployeesToFirestore(): Promise<void> {
    try {
      const snap = await getDocs(collection(db, 'employees'));
      if (snap.empty) {
        for (const emp of DEFAULT_EMPLOYEES) {
          await setDoc(doc(db, 'employees', emp.id), emp, { merge: true });
        }
      }
    } catch (err) {
      console.warn('Failed to seed default employees to Firestore:', err);
    }
  }

  /**
   * Fetch employees once from Firestore (fallback or initialization)
   */
  public async fetchEmployeesFromFirestore(): Promise<EmployeeRecord[]> {
    try {
      const snap = await getDocs(collection(db, 'employees'));
      if (snap.empty) {
        await this.seedDefaultEmployeesToFirestore();
        return this.getEmployees('id');
      }
      const records: EmployeeRecord[] = [];
      snap.forEach((d) => {
        records.push(d.data() as EmployeeRecord);
      });
      records.sort((a, b) => a.employeeId.localeCompare(b.employeeId));
      this.employees = records;
      localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(records));
      return records;
    } catch (err) {
      console.warn('Firestore getDocs warning, using local cache:', err);
      return this.getEmployees('id');
    }
  }

  /**
   * Subscribe to real-time updates from Firestore 'employees' collection
   * All logged in devices receive synchronous updates instantaneously
   */
  public subscribeEmployees(
    onUpdate: (employees: EmployeeRecord[]) => void,
    onError?: (err: unknown) => void
  ): Unsubscribe {
    // 1. Immediately emit current memory/cached data so UI renders instantly
    onUpdate(this.getEmployees('id'));

    // 2. Attach live real-time Firestore listener
    const unsubscribe = onSnapshot(
      collection(db, 'employees'),
      async (snapshot) => {
        if (snapshot.empty) {
          // If remote database is completely fresh, seed default employees
          await this.seedDefaultEmployeesToFirestore();
          return;
        }

        const liveRecords: EmployeeRecord[] = [];
        snapshot.forEach((docSnap) => {
          liveRecords.push(docSnap.data() as EmployeeRecord);
        });

        liveRecords.sort((a, b) => a.employeeId.localeCompare(b.employeeId));
        this.employees = liveRecords;
        try {
          localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(liveRecords));
        } catch {
          // ignore quota error
        }

        onUpdate(liveRecords);
      },
      (error) => {
        console.warn('Real-time Firestore listener notice (running in cache/offline mode):', error);
        onError?.(error);
        onUpdate(this.getEmployees('id'));
      }
    );

    return unsubscribe;
  }

  // Save / Update employee with Creator Protection & Strict RBAC
  public async saveEmployee(record: EmployeeRecord, operatorRole?: UserRole): Promise<EmployeeRecord> {
    // RBAC: Only Admin or Creator can write/modify employee records
    if (operatorRole && operatorRole !== 'creator' && operatorRole !== 'admin') {
      throw new Error('Akses Ditolak: Hanya pengguna dengan peran Admin atau Creator yang berhak menambah atau mengubah data pegawai.');
    }

    const existing = this.employees.find((e) => e.id === record.id);
    
    // STRICT CREATOR PROTECTION RULE:
    // If existing record is a creator and operator is not creator, disallow alteration!
    if (existing && this.isCreatorAccount(existing)) {
      if (operatorRole !== 'creator') {
        throw new Error(
          'Akses Ditolak: Data akun ini dilindungi oleh kebijakan otorisasi sistem tingkat tinggi.'
        );
      }
    }

    // Disallow non-creator from elevating anyone to creator
    if (record.accountRole === 'creator' && (!existing || existing.accountRole !== 'creator')) {
      if (operatorRole !== 'creator') {
        throw new Error('Akses Ditolak: Anda tidak memiliki wewenang untuk menetapkan hak istimewa ini.');
      }
    }

    const now = Date.now();
    record.updatedAt = now;
    record.age = this.calculateAge(record.birthDate);

    // If exitDate is set, workStatus must be TIDAK AKTIF
    if (record.exitDate && record.exitDate.trim()) {
      record.workStatus = 'TIDAK AKTIF';
    }

    const idx = this.employees.findIndex((e) => e.id === record.id);
    const isNew = idx === -1;
    if (!isNew) {
      this.employees[idx] = record;
    } else {
      record.createdAt = now;
      this.employees.push(record);
    }

    localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(this.employees));

    // Direct write to shared Firestore Database
    try {
      await setDoc(doc(db, 'employees', record.id), record, { merge: true });
    } catch (err) {
      console.warn('Firestore sync warning:', err);
      // If permission error from Firestore, inform user
      if (err instanceof Error && err.message.includes('permission')) {
        throw new Error('Akses Ditolak oleh Firestore Security Rules: Operasi tulis hanya diizinkan untuk Admin dan Creator.');
      }
    }

    // Audit Log recording
    dbService.addAuditLog({
      id: `aud-${now}`,
      timestamp: now,
      userId: record.id,
      username: record.fullName,
      role: operatorRole || 'karyawan',
      action: isNew ? 'EMPLOYEE_CREATED' : 'EMPLOYEE_UPDATED',
      module: 'Data Pegawai',
      details: `${isNew ? 'Menambahkan' : 'Memperbarui'} data pegawai ${record.fullName} (${record.employeeId}) dengan jabatan ${record.position}.`,
      status: 'success',
    });

    return record;
  }

  // Delete employee with Creator Protection & Strict RBAC
  public async deleteEmployee(id: string, operatorRole?: UserRole): Promise<boolean> {
    // RBAC: Only Admin or Creator can delete employee records
    if (operatorRole && operatorRole !== 'creator' && operatorRole !== 'admin') {
      throw new Error('Akses Ditolak: Hanya pengguna dengan peran Admin atau Creator yang berhak menghapus data pegawai.');
    }

    const target = this.employees.find((e) => e.id === id);
    if (!target) return false;

    // STRICT CREATOR PROTECTION RULE:
    // Creator accounts CANNOT be deleted by lower roles (Admin, Staff, Karyawan)
    if (this.isCreatorAccount(target)) {
      if (operatorRole !== 'creator') {
        throw new Error(
          'Akses Ditolak: Akun ini dilindungi oleh kebijakan keamanan sistem dan tidak dapat dihapus.'
        );
      }
    }

    const idx = this.employees.findIndex((e) => e.id === id);
    if (idx !== -1) {
      this.employees.splice(idx, 1);
      localStorage.setItem(STORAGE_KEY_EMPLOYEES, JSON.stringify(this.employees));

      try {
        await deleteDoc(doc(db, 'employees', id));
      } catch (err) {
        console.warn('Firestore delete warning:', err);
        if (err instanceof Error && err.message.includes('permission')) {
          throw new Error('Akses Ditolak oleh Firestore Security Rules: Operasi hapus hanya diizinkan untuk Admin dan Creator.');
        }
      }

      // Audit Log recording
      dbService.addAuditLog({
        id: `aud-${Date.now()}`,
        timestamp: Date.now(),
        userId: target.id,
        username: target.fullName,
        role: operatorRole || 'karyawan',
        action: 'EMPLOYEE_DELETED',
        module: 'Data Pegawai',
        details: `Menghapus data pegawai ${target.fullName} (${target.employeeId}).`,
        status: 'danger',
      });

      return true;
    }
    return false;
  }

  // ==============================================================
  // EXCEL EXPORT ENGINE (Standard Format .xlsx with ExcelJS)
  // ==============================================================
  public async exportToExcel(filteredList?: EmployeeRecord[]): Promise<Blob> {
    const listToExport = filteredList || this.getEmployees('id');
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NEXAPROJECT Management System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Data Karyawan', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }], // Freeze pane at row 1
    });

    // Columns specification matching the 7 tabs of Employee data
    worksheet.columns = [
      { header: 'NO', key: 'no', width: 6 },
      { header: 'ID KARYAWAN', key: 'employeeId', width: 16 },
      { header: 'NAMA LENGKAP', key: 'fullName', width: 26 },
      { header: 'JABATAN', key: 'position', width: 24 },
      { header: 'TANGGAL MASUK', key: 'joinDate', width: 16 },
      { header: 'SHIFT KERJA', key: 'workShift', width: 14 },
      { header: 'STATUS KERJA', key: 'workStatus', width: 16 },
      { header: 'DEPARTEMEN', key: 'department', width: 18 },
      { header: 'PROYEK KERJA', key: 'projectType', width: 18 },
      { header: 'LOKASI KERJA', key: 'workLocation', width: 26 },
      { header: 'UPAH/GAJI (RP)', key: 'wage', width: 18 },
      { header: 'STATUS UPAH', key: 'wageStatus', width: 14 },
      { header: 'TUNJANGAN MAKAN (RP)', key: 'mealAllowance', width: 22 },
      { header: 'TUNJANGAN TRANSPORT (RP)', key: 'transportAllowance', width: 24 },
      { header: 'TUNJANGAN GOUGING (RP)', key: 'gougingAllowance', width: 24 },
      { header: 'ALAMAT LENGKAP', key: 'address', width: 32 },
      { header: 'TEMPAT LAHIR', key: 'birthPlace', width: 18 },
      { header: 'TANGGAL LAHIR', key: 'birthDate', width: 16 },
      { header: 'USIA', key: 'age', width: 8 },
      { header: 'AGAMA', key: 'religion', width: 14 },
      { header: 'STATUS NIKAH', key: 'maritalStatus', width: 14 },
      { header: 'NAMA AYAH', key: 'fatherName', width: 20 },
      { header: 'NAMA IBU', key: 'motherName', width: 20 },
      { header: 'NOMOR HP', key: 'phone', width: 18 },
      { header: 'NOMOR KTP', key: 'ktpNumber', width: 20 },
      { header: 'NOMOR KK', key: 'kkNumber', width: 20 },
      { header: 'NOMOR NPWP', key: 'npwpNumber', width: 22 },
      { header: 'NOMOR BPJS-TK', key: 'bpjsNumber', width: 20 },
      { header: 'NOMOR REKENING', key: 'bankAccountNumber', width: 22 },
      { header: 'NAMA BANK', key: 'bankName', width: 24 },
      { header: 'TANGGAL KELUAR', key: 'exitDate', width: 16 },
      { header: 'KETERANGAN KELUAR', key: 'exitNotes', width: 26 },
      { header: 'EMAIL AKUN', key: 'email', width: 26 },
      { header: 'ROLE AKUN', key: 'accountRole', width: 16 },
    ];

    // Style Header Row
    const headerRow = worksheet.getRow(1);
    headerRow.height = 28;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1E293B' }, // Dark slate
      };
      cell.font = {
        name: 'Segoe UI',
        size: 11,
        bold: true,
        color: { argb: 'FFFFFFFF' },
      };
      cell.alignment = {
        vertical: 'middle',
        horizontal: 'center',
        wrapText: true,
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF94A3B8' } },
        left: { style: 'thin', color: { argb: 'FF94A3B8' } },
        bottom: { style: 'medium', color: { argb: 'FF3B82F6' } },
        right: { style: 'thin', color: { argb: 'FF94A3B8' } },
      };
    });

    // Formula Injection Sanitizer
    const sanitizeFormula = (val: string | undefined): string => {
      if (!val) return '';
      const str = String(val).trim();
      if (['=', '+', '-', '@'].includes(str.charAt(0))) {
        return `'${str}`;
      }
      return str;
    };

    // Add Data Rows
    listToExport.forEach((emp, index) => {
      const row = worksheet.addRow({
        no: index + 1,
        employeeId: sanitizeFormula(emp.employeeId),
        fullName: sanitizeFormula(emp.fullName),
        position: sanitizeFormula(emp.position),
        joinDate: emp.joinDate,
        workShift: emp.workShift,
        workStatus: emp.workStatus,
        department: emp.department,
        projectType: emp.projectType,
        workLocation: sanitizeFormula(emp.workLocation),
        wage: emp.wage,
        wageStatus: emp.wageStatus,
        mealAllowance: emp.mealAllowance,
        transportAllowance: emp.transportAllowance,
        gougingAllowance: emp.gougingAllowance,
        address: sanitizeFormula(emp.address),
        birthPlace: sanitizeFormula(emp.birthPlace),
        birthDate: emp.birthDate,
        age: emp.age,
        religion: emp.religion,
        maritalStatus: emp.maritalStatus,
        fatherName: sanitizeFormula(emp.fatherName),
        motherName: sanitizeFormula(emp.motherName),
        phone: sanitizeFormula(emp.phone),
        ktpNumber: sanitizeFormula(emp.ktpNumber),
        kkNumber: sanitizeFormula(emp.kkNumber),
        npwpNumber: sanitizeFormula(emp.npwpNumber),
        bpjsNumber: sanitizeFormula(emp.bpjsNumber),
        bankAccountNumber: sanitizeFormula(emp.bankAccountNumber),
        bankName: sanitizeFormula(emp.bankName),
        exitDate: emp.exitDate || '-',
        exitNotes: sanitizeFormula(emp.exitNotes || '-'),
        email: sanitizeFormula(emp.email),
        accountRole: emp.accountRole.toUpperCase(),
      });

      row.height = 22;
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Segoe UI', size: 10 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
          right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        };
        cell.alignment = { vertical: 'middle' };

        // Currency formatting for wages & allowances
        if ([11, 13, 14, 15].includes(colNumber)) {
          cell.numFmt = '#,##0';
          cell.alignment = { vertical: 'middle', horizontal: 'right' };
        }
        // Center alignment for code and dates
        if ([1, 2, 5, 6, 7, 12, 18, 19, 20, 21].includes(colNumber)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // ==============================================================
  // EXCEL TEMPLATE GENERATOR (.xlsx format for Employee Data)
  // ==============================================================
  public async downloadTemplate(): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NEXAPROJECT';
    const worksheet = workbook.addWorksheet('Template Input Karyawan', {
      views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
    });

    worksheet.columns = [
      { header: 'ID KARYAWAN*', key: 'employeeId', width: 16 },
      { header: 'NAMA LENGKAP*', key: 'fullName', width: 26 },
      { header: 'JABATAN*', key: 'position', width: 24 },
      { header: 'TANGGAL MASUK (YYYY-MM-DD)*', key: 'joinDate', width: 24 },
      { header: 'SHIFT KERJA (PAGI/SIANG/MALAM)*', key: 'workShift', width: 24 },
      { header: 'STATUS KERJA (AKTIF/MENUNGGU/TIDAK AKTIF/DAFTAR HITAM)*', key: 'workStatus', width: 28 },
      { header: 'DEPARTEMEN*', key: 'department', width: 20 },
      { header: 'PROYEK KERJA (MODUL/NEW BUILDING/SHIP REPAIR/SUPPLY)*', key: 'projectType', width: 28 },
      { header: 'LOKASI KERJA*', key: 'workLocation', width: 26 },
      { header: 'UPAH GAJI ANGKA*', key: 'wage', width: 18 },
      { header: 'STATUS UPAH (Bulan/Hari/Jam)*', key: 'wageStatus', width: 22 },
      { header: 'TUNJANGAN MAKAN ANGKA', key: 'mealAllowance', width: 24 },
      { header: 'TUNJANGAN TRANSPORT ANGKA', key: 'transportAllowance', width: 26 },
      { header: 'TUNJANGAN GOUGING ANGKA', key: 'gougingAllowance', width: 26 },
      { header: 'ALAMAT LENGKAP', key: 'address', width: 32 },
      { header: 'TEMPAT LAHIR', key: 'birthPlace', width: 18 },
      { header: 'TANGGAL LAHIR (YYYY-MM-DD)', key: 'birthDate', width: 24 },
      { header: 'AGAMA (Islam/Kristen/Katolik/Hindu/Budha/Konghuchu)', key: 'religion', width: 22 },
      { header: 'STATUS NIKAH (TK/0 s/d K/5)', key: 'maritalStatus', width: 20 },
      { header: 'NAMA AYAH', key: 'fatherName', width: 20 },
      { header: 'NAMA IBU', key: 'motherName', width: 20 },
      { header: 'NOMOR HP (10-13 digit)', key: 'phone', width: 22 },
      { header: 'NOMOR KTP (16 digit)', key: 'ktpNumber', width: 22 },
      { header: 'NOMOR KK (16 digit)', key: 'kkNumber', width: 22 },
      { header: 'NOMOR NPWP', key: 'npwpNumber', width: 22 },
      { header: 'NOMOR BPJS', key: 'bpjsNumber', width: 20 },
      { header: 'NOMOR REKENING', key: 'bankAccountNumber', width: 22 },
      { header: 'NAMA BANK (contoh: BANK OCBC)', key: 'bankName', width: 24 },
      { header: 'EMAIL AKUN RESMI*', key: 'email', width: 26 },
      { header: 'ROLE AKUN (creator/admin/staff/karyawan)*', key: 'accountRole', width: 22 },
    ];

    // Style Header
    const headerRow = worksheet.getRow(1);
    headerRow.height = 30;
    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0284C7' }, // Sky blue
      };
      cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'medium' },
        right: { style: 'thin' },
      };
    });

    // Example row
    const exampleRow = worksheet.addRow({
      employeeId: 'EMP-999',
      fullName: 'CONTOH NAMA KARYAWAN',
      position: 'WELDER',
      joinDate: '2026-01-01',
      workShift: 'PAGI',
      workStatus: 'AKTIF',
      department: 'STEEL WORK',
      projectType: 'SHIP REPAIR',
      workLocation: 'Drydock 1',
      wage: 55000,
      wageStatus: 'Jam',
      mealAllowance: 45000,
      transportAllowance: 25000,
      gougingAllowance: 20000,
      address: 'Jl. Contoh Alamat No. 10, Batam',
      birthPlace: 'Batam',
      birthDate: '1995-05-15',
      religion: 'Islam',
      maritalStatus: 'K/1',
      fatherName: 'Ayah Contoh',
      motherName: 'Ibu Contoh',
      phone: '0812-3456-7890',
      ktpNumber: '2171011505950001',
      kkNumber: '2171012005180002',
      npwpNumber: '81.234.567.8-215.000',
      bpjsNumber: '0001234567890',
      bankAccountNumber: '9012384721',
      bankName: 'BANK OCBC (OCBC NISP)',
      email: 'contoh.karyawan@nexaproject.com',
      accountRole: 'karyawan',
    });

    exampleRow.eachCell((cell) => {
      cell.font = { name: 'Segoe UI', size: 9, italic: true };
      cell.alignment = { vertical: 'middle' };
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // ==============================================================
  // EXCEL IMPORT CENTER VALIDATION & PARSING ENGINE
  // ==============================================================
  public async parseAndValidateExcel(file: File): Promise<{
    validRows: Partial<EmployeeRecord>[];
    duplicateRows: { rowNumber: number; id: string; reason: string }[];
    invalidRows: { rowNumber: number; reason: string; data: Record<string, unknown> }[];
    totalRows: number;
  }> {
    const workbook = new ExcelJS.Workbook();
    const arrayBuffer = await file.arrayBuffer();
    await workbook.xlsx.load(arrayBuffer);

    const worksheet = workbook.worksheets[0];
    if (!worksheet) {
      throw new Error('File Excel tidak memiliki lembar kerja (worksheet).');
    }

    const validRows: Partial<EmployeeRecord>[] = [];
    const duplicateRows: { rowNumber: number; id: string; reason: string }[] = [];
    const invalidRows: { rowNumber: number; reason: string; data: Record<string, unknown> }[] = [];

    const existingIds = new Set(this.employees.map((e) => e.employeeId.toUpperCase()));
    const existingEmails = new Set(this.employees.map((e) => e.email.toLowerCase()));
    const parsedIdsInBatch = new Set<string>();

    let totalRows = 0;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip Header

      const rowValues: Record<string, unknown> = {};
      const getVal = (colIdx: number) => {
        const c = row.getCell(colIdx).value;
        if (c === null || c === undefined) return '';
        if (typeof c === 'object' && 'text' in c) return String(c.text).trim();
        return String(c).trim();
      };

      const employeeId = getVal(1).toUpperCase();
      const fullName = getVal(2).toUpperCase();
      const position = getVal(3).toUpperCase();
      const joinDate = getVal(4);
      const workShift = getVal(5).toUpperCase();
      const workStatus = getVal(6).toUpperCase();
      const department = getVal(7).toUpperCase();
      const projectType = getVal(8).toUpperCase();
      const workLocation = getVal(9);
      const wage = parseFloat(getVal(10)) || 0;
      const wageStatus = getVal(11);
      const email = getVal(29).toLowerCase();
      const role = getVal(30).toLowerCase();

      totalRows++;

      // Check empty required fields
      if (!employeeId || !fullName || !position || !email) {
        invalidRows.push({
          rowNumber,
          reason: 'Kolom Wajib kosong (ID Karyawan, Nama, Jabatan, atau Email).',
          data: { employeeId, fullName, position, email },
        });
        return;
      }

      // Check duplicate in current system or within batch
      if (existingIds.has(employeeId) || parsedIdsInBatch.has(employeeId)) {
        duplicateRows.push({
          rowNumber,
          id: employeeId,
          reason: `ID Karyawan ${employeeId} sudah terdaftar atau duplikat dalam file.`,
        });
        return;
      }

      parsedIdsInBatch.add(employeeId);

      // Validate email format
      if (!email.includes('@')) {
        invalidRows.push({
          rowNumber,
          reason: `Format email '${email}' tidak valid.`,
          data: { email },
        });
        return;
      }

      const birthDate = getVal(17);
      const age = this.calculateAge(birthDate);

      const record: Partial<EmployeeRecord> = {
        id: `emp-imp-${Date.now()}-${rowNumber}`,
        employeeId,
        fullName,
        position: position as any,
        joinDate: joinDate || new Date().toISOString().split('T')[0],
        workShift: (['PAGI', 'SIANG', 'MALAM'].includes(workShift) ? workShift : 'PAGI') as any,
        workStatus: (['AKTIF', 'MENUNGGU', 'TIDAK AKTIF', 'DAFTAR HITAM'].includes(workStatus) ? workStatus : 'AKTIF') as any,
        department: department as any || 'STEEL WORK',
        projectType: projectType as any || 'SHIP REPAIR',
        workLocation: workLocation || 'Galangan Utama',
        wage,
        wageStatus: (['Bulan', 'Hari', 'Jam'].includes(wageStatus) ? wageStatus : 'Bulan') as any,
        mealAllowance: parseFloat(getVal(12)) || 0,
        transportAllowance: parseFloat(getVal(13)) || 0,
        gougingAllowance: parseFloat(getVal(14)) || 0,
        address: getVal(15),
        birthPlace: getVal(16),
        birthDate: birthDate || '1995-01-01',
        age,
        religion: (getVal(18) || 'Islam') as any,
        maritalStatus: (getVal(19) || 'TK/0') as any,
        fatherName: getVal(20),
        motherName: getVal(21),
        phone: getVal(22) || '0812-0000-0000',
        ktpNumber: getVal(23) || '2171000000000000',
        kkNumber: getVal(24) || '2171000000000000',
        npwpNumber: getVal(25),
        bpjsNumber: getVal(26),
        bankAccountNumber: getVal(27),
        bankName: getVal(28) || 'BANK OCBC',
        email,
        accountRole: (['creator', 'admin', 'staff', 'karyawan'].includes(role) ? role : 'karyawan') as any,
      };

      validRows.push(record);
    });

    return { validRows, duplicateRows, invalidRows, totalRows };
  }

  // Commit imported rows
  public async commitImportedRows(rows: Partial<EmployeeRecord>[], operatorRole?: UserRole): Promise<number> {
    let count = 0;
    for (const r of rows) {
      if (r.employeeId && r.fullName) {
        await this.saveEmployee(r as EmployeeRecord, operatorRole);
        count++;
      }
    }
    return count;
  }
}

export const employeeDb = new EmployeeDatabaseService();
