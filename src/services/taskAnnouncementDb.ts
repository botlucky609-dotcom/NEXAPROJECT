import ExcelJS from 'exceljs';
import { 
  ShipyardAnnouncement, 
  FieldWorkTask, 
  TaskStatus, 
  TaskPriority, 
  AnnouncementPriority 
} from '../types/taskAnnouncement';
import { UserRole } from '../types/auth';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

const STORAGE_KEY_ANNOUNCEMENTS = 'nexaproject_announcements_v1';
const STORAGE_KEY_TASKS = 'nexaproject_field_tasks_v1';

// Seed Announcements
const DEFAULT_ANNOUNCEMENTS: ShipyardAnnouncement[] = [
  {
    id: 'ann-001',
    title: 'Instruksi Keselamatan Kerja & Surat Izin Kerja Panas (Hot Work Permit) Drydock 1',
    content: 'Seluruh tim Steel Work, Welder, dan Fitter yang bertugas pada pemotongan pelat bawah lambung MV OCEANIC LEADER wajib melampirkan Hot Work Permit dan memastikan penempatan tabung APAR powder 6kg dalam radius 3 meter.',
    category: 'SAFETY_HSE',
    priority: 'CRITICAL',
    targetDepartment: 'STEEL WORK & WELDING',
    issuedBy: 'MUHAMMAD ANDRI (Creator - Project Director)',
    validUntil: '2026-10-31',
    isPinned: true,
    acknowledgmentsCount: 42,
    createdAt: Date.now() - 5 * 24 * 3600 * 1000,
    updatedAt: Date.now()
  },
  {
    id: 'ann-002',
    title: 'Pelaksanaan Uji Hidrostatik (Hydrotest) 15 Bar Jalur Pipa Kargo Stainless SUS316L',
    content: 'Uji tekanan hydrotest jalur pipa muatan kargo MT PACIFIC CHEMIST dijadwalkan bersama inspektur kelas ABS. Area Berth 3 disterilkan dari personil non-teknis selama proses penekanan pipa.',
    category: 'TECHNICAL',
    priority: 'HIGH',
    targetDepartment: 'PIPING & QC',
    issuedBy: 'BAMBANG SETIAWAN (Supervisor Piping)',
    validUntil: '2026-10-28',
    isPinned: false,
    acknowledgmentsCount: 28,
    createdAt: Date.now() - 3 * 24 * 3600 * 1000,
    updatedAt: Date.now()
  },
  {
    id: 'ann-003',
    title: 'Pemeriksaan Rutin APD K3 & Kedok Las Otomatis Periode Mingguan',
    content: 'Divisi HSE Safety Officer akan melakukan razia kepatuhan APD di seluruh area dermaga dan graving dock. Pelanggaran tanpa kacamata safety, helm bersertifikat ANSI, dan sepatu safety boots akan dikenakan sanksi peringatan.',
    category: 'SAFETY_HSE',
    priority: 'NORMAL',
    targetDepartment: 'SELURUH PERSONIL GALANGAN',
    issuedBy: 'DEDI SUPRIADI (Safety Officer)',
    validUntil: '2026-11-05',
    isPinned: false,
    acknowledgmentsCount: 65,
    createdAt: Date.now() - 2 * 24 * 3600 * 1000,
    updatedAt: Date.now()
  },
  {
    id: 'ann-004',
    title: 'Peringatan Dini Cuaca Ekstrem BMKG: Kecepatan Angin > 28 Knot di Selat Malaka',
    content: 'Operasional Crane gantry dan crawler crane kapasitas 50 ton dihentikan sementara apabila hembusan angin melebihi 25 knot. Pastikan jangkar pengaman rel crane terpasang kuat.',
    category: 'OPERATIONAL',
    priority: 'HIGH',
    targetDepartment: 'CRANE & RIGGER',
    issuedBy: 'MUHAMMAD ANDRI (Creator - Project Director)',
    validUntil: '2026-10-26',
    isPinned: true,
    acknowledgmentsCount: 19,
    createdAt: Date.now() - 1 * 24 * 3600 * 1000,
    updatedAt: Date.now()
  }
];

// Seed Field Tasks
const DEFAULT_TASKS: FieldWorkTask[] = [
  {
    id: 'tsk-001',
    taskNumber: 'TSK-2026-001',
    title: 'Cut & Renew Bottom Plate Baja A36 45 Ton',
    description: 'Pemotongan pelat dasar lambung yang menipis (< 8mm) dan penggantian dengan pelat baja marine grade A36 tebal 14mm bersertifikat uji tarik BKI.',
    projectId: 'prj-001',
    projectCode: 'PRJ-2026-001',
    shipName: 'MV OCEANIC LEADER',
    department: 'STEEL WORK',
    location: 'Graving Drydock 1 (Frame 45-85)',
    priority: 'URGENT',
    status: 'IN_PROGRESS',
    assignedTo: ['MUHAMMAD ANDRI', 'AHMAD RIFAI', 'SURYA KENCANA'],
    assignedEmployeeIds: ['EMP-001', 'EMP-004', 'EMP-006'],
    supervisorName: 'MUHAMMAD ANDRI',
    qcInspectorName: 'Ir. Agus Wijaya (BKI Surveyor)',
    startDate: '2026-09-28',
    dueDate: '2026-10-25',
    progressPercentage: 78,
    safetyPermitsRequired: ['Hot Work Permit', 'Confined Space Entry', 'Gas Free Clearance'],
    materialsRequired: 'Pelat Baja Grade A 14mm (45 Ton), Kawat Las LB-52 3.2mm (15 Box)',
    notes: 'NDT Ultrasonic test awal menunjukkan pengelasan butt joint 100% bebas crack.',
    createdAt: Date.now() - 24 * 24 * 3600 * 1000,
    updatedAt: Date.now()
  },
  {
    id: 'tsk-002',
    taskNumber: 'TSK-2026-002',
    title: 'Fabrikasi & Pemasangan Pipa Cargo Stainless SUS316L 12"',
    description: 'Pemasangan pipa stainless grade muatan kimia 12 inch sch 40 bersama 18 unit katup butterfly hidrolik remote control.',
    projectId: 'prj-002',
    projectCode: 'PRJ-2026-002',
    shipName: 'MT PACIFIC CHEMIST',
    department: 'PIPING',
    location: 'Berth 3 & Tank Cargo No. 2 Starboard',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assignedTo: ['BAMBANG SETIAWAN', 'HENDRA WIJAYA'],
    assignedEmployeeIds: ['EMP-002', 'EMP-007'],
    supervisorName: 'BAMBANG SETIAWAN',
    qcInspectorName: 'Michael Chang (ABS Surveyor)',
    startDate: '2026-10-05',
    dueDate: '2026-11-10',
    progressPercentage: 45,
    safetyPermitsRequired: ['Hot Work Permit', 'Confined Space Entry'],
    materialsRequired: 'Pipa SUS316L 12" (120 meter), Flange ANSI 150# (36 pcs), Gasket PTFE',
    notes: 'Telah selesai spooling 12 section di bengkel fabrikasi pipa.',
    createdAt: Date.now() - 17 * 24 * 3600 * 1000,
    updatedAt: Date.now()
  },
  {
    id: 'tsk-003',
    taskNumber: 'TSK-2026-003',
    title: 'Pengujian NDT Radiography (X-Ray) & Ultrasonic Test Las Lambung',
    description: 'Pemeriksaan uji tanpa rusak (NDT) 100% sambungan las pelat lambung baru untuk pemenuhan verifikasi klasifikasi BKI.',
    projectId: 'prj-001',
    projectCode: 'PRJ-2026-001',
    shipName: 'MV OCEANIC LEADER',
    department: 'STEEL WORK',
    location: 'Graving Drydock 1',
    priority: 'HIGH',
    status: 'QC_INSPECTION',
    assignedTo: ['DEDI SUPRIADI', 'JOKO PRASETYO'],
    assignedEmployeeIds: ['EMP-003', 'EMP-005'],
    supervisorName: 'DEDI SUPRIADI',
    qcInspectorName: 'Ir. Agus Wijaya (BKI Surveyor)',
    startDate: '2026-10-18',
    dueDate: '2026-10-23',
    progressPercentage: 90,
    safetyPermitsRequired: ['Radiation Safety Exclusion Zone', 'Night Work Permit'],
    materialsRequired: 'Film Radiography AGFA D7, UT Gel Couplant, UT Flaw Detector Krautkramer',
    notes: '22 film x-ray telah di-develop, hasil 100% accepted grade A.',
    createdAt: Date.now() - 5 * 24 * 3600 * 1000,
    updatedAt: Date.now()
  },
  {
    id: 'tsk-004',
    taskNumber: 'TSK-2026-004',
    title: 'Overhaul Total Mesin Induk Yanmar 2x1000 HP & Sea Trial Bollard Pull',
    description: 'Overhaul cylinder head, penggantian piston ring, kalibrasi injector pompa bahan bakar, dan pengujian tarikan tambat (bollard pull 35 ton).',
    projectId: 'prj-003',
    projectCode: 'PRJ-2026-003',
    shipName: 'TB SAMUDERA PERKASA VIII',
    department: 'MACHINERY',
    location: 'Slipway Incline & Kolam Pelabuhan',
    priority: 'MEDIUM',
    status: 'COMPLETED',
    assignedTo: ['AGUS PRASETYO', 'EKO WAHYUDI'],
    assignedEmployeeIds: ['EMP-005', 'EMP-008'],
    supervisorName: 'BAMBANG SETIAWAN',
    qcInspectorName: 'Hendra Kusuma (Owner Tech Rep)',
    startDate: '2026-09-05',
    dueDate: '2026-10-08',
    progressPercentage: 100,
    safetyPermitsRequired: ['Heavy Lifting Permit', 'Hot Work Permit'],
    materialsRequired: 'Sparepart Kit Yanmar 6EY17W, Pelumas Mesin Shell Gadinia 40',
    notes: 'Sea trial sukses tercapai bollard pull 36.2 ton. Kapal serah terima lunas.',
    createdAt: Date.now() - 40 * 24 * 3600 * 1000,
    updatedAt: Date.now() - 12 * 24 * 3600 * 1000
  },
  {
    id: 'tsk-005',
    taskNumber: 'TSK-2026-005',
    title: 'Grit Blasting SA 2.5 & Marine Coating Antifouling 3 Lapis',
    description: 'Pembersihan kerak karat pelat lambung menggunakan copper slag blasting hingga standar SA 2.5, dilanjutkan primer epoxy dan antifouling coating.',
    projectId: 'prj-001',
    projectCode: 'PRJ-2026-001',
    shipName: 'MV OCEANIC LEADER',
    department: 'COATING',
    location: 'Graving Drydock 1 (Portside & Starboard)',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    assignedTo: ['SUBKONTRAKTOR BJB', 'DEDI SUPRIADI'],
    assignedEmployeeIds: ['EMP-003'],
    supervisorName: 'DEDI SUPRIADI',
    qcInspectorName: 'Hempel Coating Inspector NACE Level 2',
    startDate: '2026-10-12',
    dueDate: '2026-10-27',
    progressPercentage: 60,
    safetyPermitsRequired: ['Blasting Air Pressure Permit', 'Respiratory Mask Full Face'],
    materialsRequired: 'Copper Slag 25 Ton, Jotun SeaQuantum Ultra AF (45 Drum)',
    notes: 'Kondisi kelembapan udara (RH) 68%, aman untuk aplikasi primer lapis kedua.',
    createdAt: Date.now() - 10 * 24 * 3600 * 1000,
    updatedAt: Date.now()
  }
];

class TaskAnnouncementDatabase {
  private announcements: ShipyardAnnouncement[] = [];
  private tasks: FieldWorkTask[] = [];

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    try {
      const savedAnn = localStorage.getItem(STORAGE_KEY_ANNOUNCEMENTS);
      if (savedAnn) {
        this.announcements = JSON.parse(savedAnn);
      } else {
        this.announcements = [...DEFAULT_ANNOUNCEMENTS];
        this.saveAnnouncementsToStorage();
      }

      const savedTasks = localStorage.getItem(STORAGE_KEY_TASKS);
      if (savedTasks) {
        this.tasks = JSON.parse(savedTasks);
      } else {
        this.tasks = [...DEFAULT_TASKS];
        this.saveTasksToStorage();
      }
    } catch {
      this.announcements = [...DEFAULT_ANNOUNCEMENTS];
      this.tasks = [...DEFAULT_TASKS];
    }
  }

  private saveAnnouncementsToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY_ANNOUNCEMENTS, JSON.stringify(this.announcements));
    } catch (e) {
      console.warn('Announcement storage error:', e);
    }
  }

  private saveTasksToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(this.tasks));
    } catch (e) {
      console.warn('Tasks storage error:', e);
    }
  }

  private isCreatorAccount(email?: string, role?: UserRole): boolean {
    if (!email) return false;
    const lower = email.toLowerCase().trim();
    return lower === 'muhammad.andri0605@gmail.com' || lower === 'creator@nexaproject.com' || role === 'creator';
  }

  // --- ANNOUNCEMENT METHODS ---
  public getAnnouncements(): ShipyardAnnouncement[] {
    return [...this.announcements].sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.createdAt - a.createdAt;
    });
  }

  public getActiveAnnouncements(): ShipyardAnnouncement[] {
    return this.getAnnouncements().slice(0, 4);
  }

  public saveAnnouncement(
    annData: Partial<ShipyardAnnouncement>,
    userRole: UserRole,
    userEmail: string,
    authorName: string
  ): { success: boolean; message: string; announcement?: ShipyardAnnouncement } {
    const isCreator = this.isCreatorAccount(userEmail, userRole);

    if (annData.id) {
      const idx = this.announcements.findIndex(a => a.id === annData.id);
      if (idx === -1) {
        return { success: false, message: 'Pengumuman tidak ditemukan.' };
      }

      const existing = this.announcements[idx];
      // If issued by Creator, subordinates cannot edit
      if (existing.issuedBy.includes('Creator') && !isCreator) {
        return { 
          success: false, 
          message: 'Akses Ditolak: Pengumuman berstatus resmi dari Creator dilindungi secara mutlak.' 
        };
      }

      const updated: ShipyardAnnouncement = {
        ...existing,
        ...annData,
        updatedAt: Date.now()
      };

      this.announcements[idx] = updated;
      this.saveAnnouncementsToStorage();

      try {
        setDoc(doc(db, 'announcements', updated.id), updated, { merge: true }).catch(() => {});
      } catch {}

      return { success: true, message: 'Pengumuman resmi berhasil diperbarui.', announcement: updated };
    }

    // Creating new announcement
    const newAnn: ShipyardAnnouncement = {
      id: `ann-${Date.now().toString().slice(-6)}`,
      title: annData.title || 'Pengumuman Resmi Galangan',
      content: annData.content || '',
      category: annData.category || 'SAFETY_HSE',
      priority: annData.priority || 'NORMAL',
      targetDepartment: annData.targetDepartment || 'SELURUH PERSONIL GALANGAN',
      issuedBy: isCreator ? 'MUHAMMAD ANDRI (Creator - Project Director)' : authorName,
      validUntil: annData.validUntil || new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString().split('T')[0],
      isPinned: annData.isPinned || false,
      acknowledgmentsCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.announcements.unshift(newAnn);
    this.saveAnnouncementsToStorage();

    try {
      setDoc(doc(db, 'announcements', newAnn.id), newAnn).catch(() => {});
    } catch {}

    return { success: true, message: 'Pengumuman resmi galangan berhasil disiarkan.', announcement: newAnn };
  }

  public acknowledgeAnnouncement(id: string): boolean {
    const idx = this.announcements.findIndex(a => a.id === id);
    if (idx === -1) return false;

    this.announcements[idx].acknowledgmentsCount = (this.announcements[idx].acknowledgmentsCount || 0) + 1;
    this.saveAnnouncementsToStorage();
    return true;
  }

  public deleteAnnouncement(id: string, userRole: UserRole, userEmail: string): { success: boolean; message: string } {
    const isCreator = this.isCreatorAccount(userEmail, userRole);
    const ann = this.announcements.find(a => a.id === id);
    if (!ann) return { success: false, message: 'Pengumuman tidak ditemukan.' };

    if (ann.issuedBy.includes('Creator') && !isCreator) {
      return { 
        success: false, 
        message: 'Akses Ditolak: Instruksi keselamatan kerja dari Creator tidak dapat dihapus oleh peran bawahan.' 
      };
    }

    this.announcements = this.announcements.filter(a => a.id !== id);
    this.saveAnnouncementsToStorage();
    return { success: true, message: 'Pengumuman berhasil diarsipkan dan dihapus.' };
  }

  // --- FIELD TASK METHODS ---
  public getTasks(filterProjectId?: string, filterDepartment?: string, filterStatus?: TaskStatus): FieldWorkTask[] {
    let list = [...this.tasks];
    if (filterProjectId && filterProjectId !== 'ALL') {
      list = list.filter(t => t.projectId === filterProjectId || t.projectCode === filterProjectId);
    }
    if (filterDepartment && filterDepartment !== 'ALL') {
      list = list.filter(t => t.department === filterDepartment);
    }
    if (filterStatus) {
      list = list.filter(t => t.status === filterStatus);
    }
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }

  public saveTask(
    taskData: Partial<FieldWorkTask>,
    userRole: UserRole,
    userEmail: string,
    authorName: string
  ): { success: boolean; message: string; task?: FieldWorkTask } {
    const isCreator = this.isCreatorAccount(userEmail, userRole);

    if (taskData.id) {
      const idx = this.tasks.findIndex(t => t.id === taskData.id);
      if (idx === -1) return { success: false, message: 'Tugas kerja lapangan tidak ditemukan.' };

      const existing = this.tasks[idx];
      const updated: FieldWorkTask = {
        ...existing,
        ...taskData,
        updatedAt: Date.now()
      };

      if (updated.progressPercentage >= 100) {
        updated.status = 'COMPLETED';
      }

      this.tasks[idx] = updated;
      this.saveTasksToStorage();

      try {
        setDoc(doc(db, 'field_tasks', updated.id), updated, { merge: true }).catch(() => {});
      } catch {}

      return { success: true, message: 'Surat tugas lapangan berhasil diperbarui.', task: updated };
    }

    // New task
    const count = this.tasks.length + 1;
    const newTask: FieldWorkTask = {
      id: `tsk-${Date.now().toString().slice(-6)}`,
      taskNumber: `TSK-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`,
      title: taskData.title || 'Tugas Baru Lapangan',
      description: taskData.description || '',
      projectId: taskData.projectId || 'prj-001',
      projectCode: taskData.projectCode || 'PRJ-2026-001',
      shipName: taskData.shipName || 'MV OCEANIC LEADER',
      department: taskData.department || 'STEEL WORK',
      location: taskData.location || 'Graving Drydock 1',
      priority: taskData.priority || 'HIGH',
      status: 'PENDING',
      assignedTo: taskData.assignedTo || ['TIM LAPANGAN'],
      assignedEmployeeIds: taskData.assignedEmployeeIds || [],
      supervisorName: isCreator ? 'MUHAMMAD ANDRI (Creator)' : authorName,
      qcInspectorName: taskData.qcInspectorName,
      startDate: taskData.startDate || new Date().toISOString().split('T')[0],
      dueDate: taskData.dueDate || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0],
      progressPercentage: 0,
      safetyPermitsRequired: taskData.safetyPermitsRequired || ['Hot Work Permit'],
      materialsRequired: taskData.materialsRequired,
      notes: taskData.notes,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.tasks.unshift(newTask);
    this.saveTasksToStorage();

    try {
      setDoc(doc(db, 'field_tasks', newTask.id), newTask).catch(() => {});
    } catch {}

    return { success: true, message: 'Surat perintah tugas lapangan berhasil diterbitkan.', task: newTask };
  }

  public updateTaskProgress(
    taskId: string, 
    progress: number, 
    status: TaskStatus, 
    qcInspector?: string, 
    notes?: string
  ): boolean {
    const idx = this.tasks.findIndex(t => t.id === taskId);
    if (idx === -1) return false;

    this.tasks[idx].progressPercentage = Math.min(100, Math.max(0, progress));
    this.tasks[idx].status = this.tasks[idx].progressPercentage >= 100 ? 'COMPLETED' : status;
    if (qcInspector) this.tasks[idx].qcInspectorName = qcInspector;
    if (notes) this.tasks[idx].notes = notes;
    this.tasks[idx].updatedAt = Date.now();

    this.saveTasksToStorage();

    try {
      setDoc(doc(db, 'field_tasks', taskId), this.tasks[idx], { merge: true }).catch(() => {});
    } catch {}

    return true;
  }

  public deleteTask(id: string, userRole: UserRole, userEmail: string): { success: boolean; message: string } {
    const isCreator = this.isCreatorAccount(userEmail, userRole);
    if (!isCreator && userRole === 'karyawan') {
      return { success: false, message: 'Akses Ditolak: Hanya Pengawas atau Creator yang dapat menghapus tugas kerja.' };
    }

    this.tasks = this.tasks.filter(t => t.id !== id);
    this.saveTasksToStorage();
    return { success: true, message: 'Surat tugas lapangan berhasil dihapus.' };
  }

  // --- EXCEL EXPORT ---
  public async exportTasksToExcel(): Promise<Blob> {
    const list = this.getTasks();
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NEXAPROJECT Shipyard Field Task Dispatcher';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Daftar Tugas Kerja Lapangan');
    sheet.columns = [
      { header: 'NO TUGAS', key: 'taskNumber', width: 16 },
      { header: 'KODE PROYEK', key: 'projectCode', width: 16 },
      { header: 'KAPAL', key: 'shipName', width: 24 },
      { header: 'JUDUL PEKERJAAN', key: 'title', width: 34 },
      { header: 'DEPARTEMEN', key: 'department', width: 18 },
      { header: 'LOKASI KERJA', key: 'location', width: 24 },
      { header: 'PRIORITAS', key: 'priority', width: 14 },
      { header: 'STATUS', key: 'status', width: 16 },
      { header: 'PROGRES (%)', key: 'progressPercentage', width: 14 },
      { header: 'PENGAWAS (SPV)', key: 'supervisorName', width: 22 },
      { header: 'INSPEKTUR QC', key: 'qcInspectorName', width: 22 },
      { header: 'PERSONIL TUGAS', key: 'assignedTo', width: 30 },
      { header: 'IZIN K3 DIPERLUKAN', key: 'safetyPermitsRequired', width: 32 },
      { header: 'TARGET SELESAI', key: 'dueDate', width: 14 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };

    list.forEach(t => {
      sheet.addRow({
        taskNumber: t.taskNumber,
        projectCode: t.projectCode,
        shipName: t.shipName,
        title: t.title,
        department: t.department,
        location: t.location,
        priority: t.priority,
        status: t.status,
        progressPercentage: `${t.progressPercentage}%`,
        supervisorName: t.supervisorName,
        qcInspectorName: t.qcInspectorName || '-',
        assignedTo: t.assignedTo.join(', '),
        safetyPermitsRequired: t.safetyPermitsRequired.join(', '),
        dueDate: t.dueDate,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  public async exportAnnouncementsToExcel(): Promise<Blob> {
    const list = this.getAnnouncements();
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NEXAPROJECT Shipyard HSE & Announcements';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Rekap Pengumuman Resmi');
    sheet.columns = [
      { header: 'JUDUL PENGUMUMAN', key: 'title', width: 36 },
      { header: 'KATEGORI', key: 'category', width: 18 },
      { header: 'PRIORITAS', key: 'priority', width: 14 },
      { header: 'TARGET DIVISI', key: 'targetDepartment', width: 26 },
      { header: 'DITERBITKAN OLEH', key: 'issuedBy', width: 26 },
      { header: 'BERLAKU HINGGA', key: 'validUntil', width: 16 },
      { header: 'PINNED', key: 'isPinned', width: 12 },
      { header: 'TOTAL RESPON', key: 'acknowledgmentsCount', width: 14 },
      { header: 'ISI INSTRUKSI', key: 'content', width: 50 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } };

    list.forEach(a => {
      sheet.addRow({
        title: a.title,
        category: a.category,
        priority: a.priority,
        targetDepartment: a.targetDepartment,
        issuedBy: a.issuedBy,
        validUntil: a.validUntil,
        isPinned: a.isPinned ? 'YA' : 'TIDAK',
        acknowledgmentsCount: a.acknowledgmentsCount || 0,
        content: a.content,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
}

export const taskAnnouncementDb = new TaskAnnouncementDatabase();
