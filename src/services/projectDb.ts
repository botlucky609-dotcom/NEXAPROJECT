import ExcelJS from 'exceljs';
import { ShipProject, ProjectSupervisor, ProgressMilestone, ProjectCostItem } from '../types/project';
import { db } from './firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

const STORAGE_KEY_PROJECTS = 'nexaproject_ship_projects_v1';
const STORAGE_KEY_SUPERVISORS = 'nexaproject_supervisors_v1';
const STORAGE_KEY_MILESTONES = 'nexaproject_milestones_v1';
const STORAGE_KEY_COSTS = 'nexaproject_costs_v1';

// Seed Projects
const DEFAULT_PROJECTS: ShipProject[] = [
  {
    id: 'prj-001',
    projectCode: 'PRJ-2026-001',
    shipName: 'MV OCEANIC LEADER',
    vesselType: 'Bulk Carrier',
    deadweightTonnage: 55000,
    lengthOverall: 189.9,
    beam: 32.2,
    owner: 'PT Samudera Bahtera Lines Tbk',
    flag: 'Indonesia',
    classificationSociety: 'BKI (Biro Klasifikasi Indonesia)',
    projectType: 'Annual Docking (SS/DS)',
    location: 'Graving Drydock 1',
    startDate: '2026-09-25',
    targetDate: '2026-10-30',
    status: 'in_progress',
    progressPercentage: 78,
    budgetTotal: 4200000000, // Rp 4.2 Miliar
    actualCost: 3150000000,
    estimatedMargin: 25.0, // 25% margin
    assignedSupervisors: ['MUHAMMAD ANDRI', 'BAMBANG SETIAWAN', 'DEDI SUPRIADI'],
    description: 'Pekerjaan annual docking kapal bulk carrier: cut and renew bottom plate 45 ton, overhaul sea chest, hydroblasting SA 2.5, coating antifouling 3 lapis, dan overhaul propeller shaft.',
    createdAt: Date.now() - 25 * 24 * 3600 * 1000,
    updatedAt: Date.now(),
  },
  {
    id: 'prj-002',
    projectCode: 'PRJ-2026-002',
    shipName: 'MT PACIFIC CHEMIST',
    vesselType: 'Oil / Chemical Tanker',
    deadweightTonnage: 28000,
    lengthOverall: 168.0,
    beam: 27.5,
    owner: 'Pacific Maritime Corp Ltd',
    flag: 'Singapore',
    classificationSociety: 'ABS (American Bureau of Shipping)',
    projectType: 'Ship Repair',
    location: 'Berth 3 & Bengkel Pipa',
    startDate: '2026-10-02',
    targetDate: '2026-11-15',
    status: 'in_progress',
    progressPercentage: 45,
    budgetTotal: 5800000000,
    actualCost: 2450000000,
    estimatedMargin: 28.5,
    assignedSupervisors: ['BAMBANG SETIAWAN', 'AHMAD RIFAI'],
    description: 'Special piping renewal stainless steel SUS316L cargo lines, tank internal epoxy lining inspection, dan penggantian valve butterfly otomatis 12 inch.',
    createdAt: Date.now() - 15 * 24 * 3600 * 1000,
    updatedAt: Date.now(),
  },
  {
    id: 'prj-003',
    projectCode: 'PRJ-2026-003',
    shipName: 'TB SAMUDERA PERKASA VIII',
    vesselType: 'Ocean Tugboat',
    deadweightTonnage: 850,
    lengthOverall: 34.5,
    beam: 11.0,
    owner: 'PT Pelayaran Perkasa Maritim',
    flag: 'Indonesia',
    classificationSociety: 'BKI',
    projectType: 'Ship Repair',
    location: 'Slipway Rel A',
    startDate: '2026-09-10',
    targetDate: '2026-10-22',
    status: 'in_progress',
    progressPercentage: 92,
    budgetTotal: 1250000000,
    actualCost: 980000000,
    estimatedMargin: 21.6,
    assignedSupervisors: ['DEDI SUPRIADI', 'HENDRA KURNIAWAN'],
    description: 'Pekerjaan ganti rudder pintle bush, align stern tube, instalasi zinc anode katodik lambung, dan sea trial kesiapan mesin kemudi twin engine 3200 BHP.',
    createdAt: Date.now() - 35 * 24 * 3600 * 1000,
    updatedAt: Date.now(),
  },
  {
    id: 'prj-004',
    projectCode: 'PRJ-2026-004',
    shipName: 'KM NUSANTARA BAHARI 09',
    vesselType: 'Container Ship',
    deadweightTonnage: 18500,
    lengthOverall: 154.0,
    beam: 25.0,
    owner: 'PT Nusantara Logistik Laut',
    flag: 'Indonesia',
    classificationSociety: 'BKI',
    projectType: 'Special Survey',
    location: 'Graving Drydock 2',
    startDate: '2026-08-01',
    targetDate: '2026-09-15',
    completionDate: '2026-09-14',
    status: 'completed',
    progressPercentage: 100,
    budgetTotal: 3400000000,
    actualCost: 2850000000,
    estimatedMargin: 16.2,
    assignedSupervisors: ['MUHAMMAD ANDRI', 'BAMBANG SETIAWAN'],
    description: 'Pekerjaan Special Survey 5 tahunan: cell guide hold alignment, hatch cover rubber seal renewal, NDT ultrasonic gauging plates, dan sea trial serah terima sukses.',
    createdAt: Date.now() - 75 * 24 * 3600 * 1000,
    updatedAt: Date.now() - 30 * 24 * 3600 * 1000,
  },
];

// Seed Supervisors
const DEFAULT_SUPERVISORS: ProjectSupervisor[] = [
  {
    id: 'spv-001',
    employeeId: 'EMP-001',
    fullName: 'MUHAMMAD ANDRI',
    role: 'SUPERINTENDENT',
    phone: '0812-3456-7890',
    email: 'muhammad.andri0605@gmail.com',
    assignedProjectCode: 'PRJ-2026-001',
    assignedShipName: 'MV OCEANIC LEADER',
    status: 'ON_DUTY',
    lastInspectionDate: '2026-10-17 08:30',
    certifications: 'Senior Marine Superintendent, NDT Level III, Welding Inspector (CSWIP 3.1)',
  },
  {
    id: 'spv-002',
    employeeId: 'EMP-002',
    fullName: 'BAMBANG SETIAWAN',
    role: 'HULL & STEEL SUPERVISOR',
    phone: '0813-8821-9901',
    email: 'admin@nexaproject.com',
    assignedProjectCode: 'PRJ-2026-001',
    assignedShipName: 'MV OCEANIC LEADER',
    status: 'ON_DUTY',
    lastInspectionDate: '2026-10-17 09:15',
    certifications: 'Naval Architect certified, Steel Structure Expert (BKI Certified)',
  },
  {
    id: 'spv-003',
    employeeId: 'EMP-005',
    fullName: 'DEDI SUPRIADI',
    role: 'WELDING INSPECTOR (WI)',
    phone: '0811-7788-2233',
    email: 'dedi.supriadi@nexaproject.com',
    assignedProjectCode: 'PRJ-2026-003',
    assignedShipName: 'TB SAMUDERA PERKASA VIII',
    status: 'ON_DUTY',
    lastInspectionDate: '2026-10-17 10:00',
    certifications: 'Certified Welding Inspector (BKI & AWS CWI), Ultrasonic Testing',
  },
  {
    id: 'spv-004',
    employeeId: 'EMP-006',
    fullName: 'HENDRA KURNIAWAN',
    role: 'PAINTING & BLASTING QC',
    phone: '0822-4455-6677',
    email: 'hendra.qc@nexaproject.com',
    assignedProjectCode: 'PRJ-2026-001',
    assignedShipName: 'MV OCEANIC LEADER',
    status: 'STANDBY',
    lastInspectionDate: '2026-10-16 16:45',
    certifications: 'NACE / FROSIO Level II Inspector Coating',
  },
  {
    id: 'spv-005',
    employeeId: 'EMP-007',
    fullName: 'REZA ANUGRAH',
    role: 'HSE SAFETY OFFICER',
    phone: '0819-3322-1100',
    email: 'reza.hse@nexaproject.com',
    assignedProjectCode: 'PRJ-2026-002',
    assignedShipName: 'MT PACIFIC CHEMIST',
    status: 'ON_DUTY',
    lastInspectionDate: '2026-10-17 07:45',
    certifications: 'AK3 Umum Kemnaker, Confined Space Inspector, Hot Work Assessor',
  },
];

// Seed Milestones for PRJ-2026-001
const DEFAULT_MILESTONES: ProgressMilestone[] = [
  {
    id: 'mls-001',
    projectId: 'prj-001',
    milestoneOrder: 1,
    phaseName: '1. Docking In, Berthing, & High-Pressure Hull Washing (500 Bar)',
    plannedPercent: 10,
    actualPercent: 10,
    status: 'done',
    targetDate: '2026-09-28',
    completedDate: '2026-09-27',
    notes: 'Kapal duduk tepat di atas keel blocks graving drydock. Pencucian teritip tuntas.',
  },
  {
    id: 'mls-002',
    projectId: 'prj-001',
    milestoneOrder: 2,
    phaseName: '2. NDT Ultrasonic Thickness Gauging & Plate Cropping',
    plannedPercent: 25,
    actualPercent: 25,
    status: 'done',
    targetDate: '2026-10-06',
    completedDate: '2026-10-05',
    notes: 'Pelat dasar teridentifikasi 45 ton terdegradasi < 75%. Pemotongan gouging selesai.',
  },
  {
    id: 'mls-003',
    projectId: 'prj-001',
    milestoneOrder: 3,
    phaseName: '3. Fit-up, Tacking, & Full Penetration Welding Plate Renew',
    plannedPercent: 30,
    actualPercent: 28,
    status: 'in_progress',
    targetDate: '2026-10-18',
    notes: 'Welder 1G, 2G, 3G, 4G bekerja shift pagi dan malam. Radiography Test (RT) 85% passed.',
  },
  {
    id: 'mls-004',
    projectId: 'prj-001',
    milestoneOrder: 4,
    phaseName: '4. Sea Chest Overhaul, Zinc Anode Installation & Valve Hydrotest',
    plannedPercent: 15,
    actualPercent: 10,
    status: 'in_progress',
    targetDate: '2026-10-22',
    notes: 'Katup laut utama diganti packing dan digerinda dudukannya.',
  },
  {
    id: 'mls-005',
    projectId: 'prj-001',
    milestoneOrder: 5,
    phaseName: '5. Sandblasting Spot SA 2.5 & Full Antifouling Paint System (3 Coats)',
    plannedPercent: 15,
    actualPercent: 5,
    status: 'pending',
    targetDate: '2026-10-27',
    notes: 'Menunggu penuntasan inspeksi las lambung kapal.',
  },
  {
    id: 'mls-006',
    projectId: 'prj-001',
    milestoneOrder: 6,
    phaseName: '6. Flood Drydock, Undocking, Mooring & Sea Trial Run',
    plannedPercent: 5,
    actualPercent: 0,
    status: 'pending',
    targetDate: '2026-10-30',
    notes: 'Jadwal undocking dikoordinasikan dengan pandu pelabuhan Batam.',
  },
];

// Seed Costs for PRJ-2026-001 (Creator Access)
const DEFAULT_COSTS: ProjectCostItem[] = [
  {
    id: 'cst-001',
    projectId: 'prj-001',
    category: 'MATERIAL',
    description: 'Pelat Baja Kapal Grade A AH36 (45 Ton) & Kawat Las LB-52U / FabCO',
    budgetAmount: 1450000000,
    actualAmount: 1380000000,
    variance: 70000000,
    approvedBy: 'MUHAMMAD ANDRI',
    date: '2026-10-02',
  },
  {
    id: 'cst-002',
    projectId: 'prj-001',
    category: 'LABOR',
    description: 'Upah Tenaga Kerja Welder, Fitter, Gouger, & Rigger (25 Hari Kerja)',
    budgetAmount: 950000000,
    actualAmount: 890000000,
    variance: 60000000,
    approvedBy: 'MUHAMMAD ANDRI',
    date: '2026-10-15',
  },
  {
    id: 'cst-003',
    projectId: 'prj-001',
    category: 'DOCK_RENTAL',
    description: 'Sewa Graving Drydock 1 (35 Hari) & Suplai Listrik Kapal Shore Power',
    budgetAmount: 850000000,
    actualAmount: 850000000,
    variance: 0,
    approvedBy: 'MUHAMMAD ANDRI',
    date: '2026-09-25',
  },
  {
    id: 'cst-004',
    projectId: 'prj-001',
    category: 'SUBCONTRACTOR',
    description: 'Subkontraktor Uji Tanpa Rusak (NDT Radiography & Magnetic Particle)',
    budgetAmount: 220000000,
    actualAmount: 195000000,
    variance: 25000000,
    approvedBy: 'MUHAMMAD ANDRI',
    date: '2026-10-10',
  },
  {
    id: 'cst-005',
    projectId: 'prj-001',
    category: 'EQUIPMENT',
    description: 'Rental Mobile Crane 50 Ton, Kompresor Sandblasting 750 CFM',
    budgetAmount: 380000000,
    actualAmount: 320000000,
    variance: 60000000,
    approvedBy: 'MUHAMMAD ANDRI',
    date: '2026-10-05',
  },
  {
    id: 'cst-006',
    projectId: 'prj-001',
    category: 'OVERHEAD',
    description: 'Biaya Izin BKI/Klasifikasi, Keamanan Pelabuhan, & Konsumsi Lapangan',
    budgetAmount: 350000000,
    actualAmount: 295000000,
    variance: 55000000,
    approvedBy: 'MUHAMMAD ANDRI',
    date: '2026-10-16',
  },
];

class ProjectDatabaseService {
  private projects: ShipProject[] = [];
  private supervisors: ProjectSupervisor[] = [];
  private milestones: ProgressMilestone[] = [];
  private costs: ProjectCostItem[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedPrj = localStorage.getItem(STORAGE_KEY_PROJECTS);
      this.projects = storedPrj ? JSON.parse(storedPrj) : DEFAULT_PROJECTS;
      if (!storedPrj) localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(DEFAULT_PROJECTS));

      const storedSpv = localStorage.getItem(STORAGE_KEY_SUPERVISORS);
      this.supervisors = storedSpv ? JSON.parse(storedSpv) : DEFAULT_SUPERVISORS;
      if (!storedSpv) localStorage.setItem(STORAGE_KEY_SUPERVISORS, JSON.stringify(DEFAULT_SUPERVISORS));

      const storedMls = localStorage.getItem(STORAGE_KEY_MILESTONES);
      this.milestones = storedMls ? JSON.parse(storedMls) : DEFAULT_MILESTONES;
      if (!storedMls) localStorage.setItem(STORAGE_KEY_MILESTONES, JSON.stringify(DEFAULT_MILESTONES));

      const storedCst = localStorage.getItem(STORAGE_KEY_COSTS);
      this.costs = storedCst ? JSON.parse(storedCst) : DEFAULT_COSTS;
      if (!storedCst) localStorage.setItem(STORAGE_KEY_COSTS, JSON.stringify(DEFAULT_COSTS));
    } catch {
      this.projects = DEFAULT_PROJECTS;
      this.supervisors = DEFAULT_SUPERVISORS;
      this.milestones = DEFAULT_MILESTONES;
      this.costs = DEFAULT_COSTS;
    }
  }

  // Projects CRUD
  public getProjects(): ShipProject[] {
    return [...this.projects];
  }

  public getProjectById(id: string): ShipProject | undefined {
    return this.projects.find((p) => p.id === id || p.projectCode === id);
  }

  public async saveProject(project: ShipProject): Promise<ShipProject> {
    const now = Date.now();
    project.updatedAt = now;
    const idx = this.projects.findIndex((p) => p.id === project.id);
    if (idx !== -1) {
      this.projects[idx] = project;
    } else {
      project.createdAt = now;
      this.projects.push(project);
    }
    localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(this.projects));

    try {
      await setDoc(doc(db, 'projects', project.id), project, { merge: true });
    } catch (err) {
      console.warn('Firestore sync project error:', err);
    }
    return project;
  }

  public async deleteProject(id: string): Promise<boolean> {
    const idx = this.projects.findIndex((p) => p.id === id);
    if (idx !== -1) {
      this.projects.splice(idx, 1);
      localStorage.setItem(STORAGE_KEY_PROJECTS, JSON.stringify(this.projects));
      try {
        await deleteDoc(doc(db, 'projects', id));
      } catch (err) {
        console.warn('Firestore delete project error:', err);
      }
      return true;
    }
    return false;
  }

  // Supervisors
  public getSupervisors(): ProjectSupervisor[] {
    return [...this.supervisors];
  }

  public saveSupervisor(spv: ProjectSupervisor): void {
    const idx = this.supervisors.findIndex((s) => s.id === spv.id);
    if (idx !== -1) {
      this.supervisors[idx] = spv;
    } else {
      this.supervisors.push(spv);
    }
    localStorage.setItem(STORAGE_KEY_SUPERVISORS, JSON.stringify(this.supervisors));
  }

  // Milestones
  public getMilestones(projectId?: string): ProgressMilestone[] {
    if (projectId) {
      return this.milestones.filter((m) => m.projectId === projectId).sort((a, b) => a.milestoneOrder - b.milestoneOrder);
    }
    return [...this.milestones];
  }

  public saveMilestone(mls: ProgressMilestone): void {
    const idx = this.milestones.findIndex((m) => m.id === mls.id);
    if (idx !== -1) {
      this.milestones[idx] = mls;
    } else {
      this.milestones.push(mls);
    }
    localStorage.setItem(STORAGE_KEY_MILESTONES, JSON.stringify(this.milestones));
  }

  // Costs (Protected Creator Only)
  public getCosts(projectId?: string): ProjectCostItem[] {
    if (projectId) {
      return this.costs.filter((c) => c.projectId === projectId);
    }
    return [...this.costs];
  }

  public saveCost(cost: ProjectCostItem): void {
    const idx = this.costs.findIndex((c) => c.id === cost.id);
    if (idx !== -1) {
      this.costs[idx] = cost;
    } else {
      this.costs.push(cost);
    }
    localStorage.setItem(STORAGE_KEY_COSTS, JSON.stringify(this.costs));
  }

  // Export Projects to Excel
  public async exportProjectsToExcel(): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NEXAPROJECT Ship Management';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Daftar Proyek Kapal');
    sheet.columns = [
      { header: 'KODE PROYEK', key: 'projectCode', width: 16 },
      { header: 'NAMA KAPAL', key: 'shipName', width: 25 },
      { header: 'JENIS KAPAL', key: 'vesselType', width: 20 },
      { header: 'DWT (TON)', key: 'deadweightTonnage', width: 14 },
      { header: 'PEMILIK / OWNER', key: 'owner', width: 28 },
      { header: 'TIPE PEKERJAAN', key: 'projectType', width: 22 },
      { header: 'LOKASI DRYDOCK', key: 'location', width: 20 },
      { header: 'MULAI', key: 'startDate', width: 14 },
      { header: 'TARGET', key: 'targetDate', width: 14 },
      { header: 'PROGRES (%)', key: 'progressPercentage', width: 14 },
      { header: 'STATUS', key: 'status', width: 16 },
    ];

    // Style Header
    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E40AF' } };

    this.projects.forEach((p) => {
      sheet.addRow({
        projectCode: p.projectCode,
        shipName: p.shipName,
        vesselType: p.vesselType,
        deadweightTonnage: p.deadweightTonnage,
        owner: p.owner,
        projectType: p.projectType,
        location: p.location,
        startDate: p.startDate,
        targetDate: p.targetDate,
        progressPercentage: `${p.progressPercentage}%`,
        status: p.status === 'completed' ? 'SELESAI' : p.status === 'in_progress' ? 'BERJALAN' : 'TERTUNDA',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // Export Costs to Excel (Creator Report)
  public async exportCostsToExcel(projectId?: string): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NEXAPROJECT Financial Control';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('RAB & Realisasi Biaya Proyek');
    sheet.columns = [
      { header: 'NO', key: 'no', width: 6 },
      { header: 'KATEGORI BIAYA', key: 'category', width: 18 },
      { header: 'DESKRIPSI RINCIAN', key: 'description', width: 36 },
      { header: 'ANGGARAN / BUDGET (IDR)', key: 'budgetAmount', width: 25 },
      { header: 'REALISASI BIAYA (IDR)', key: 'actualAmount', width: 25 },
      { header: 'SELISIH / SAVING (IDR)', key: 'variance', width: 22 },
      { header: 'DISETUJUI OLEH', key: 'approvedBy', width: 22 },
      { header: 'TANGGAL', key: 'date', width: 14 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };

    const items = this.getCosts(projectId);
    items.forEach((c, i) => {
      sheet.addRow({
        no: i + 1,
        category: c.category,
        description: c.description,
        budgetAmount: c.budgetAmount,
        actualAmount: c.actualAmount,
        variance: c.variance,
        approvedBy: c.approvedBy,
        date: c.date,
      });
    });

    sheet.getColumn('budgetAmount').numFmt = '#,##0';
    sheet.getColumn('actualAmount').numFmt = '#,##0';
    sheet.getColumn('variance').numFmt = '#,##0';

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
}

export const projectDb = new ProjectDatabaseService();
