import ExcelJS from 'exceljs';
import { 
  ShipyardContract, 
  OperationalExpense, 
  FinancialCashflowSummary, 
  ExpenseCategory,
  ContractMilestoneTerm 
} from '../types/finance';
import { UserRole } from '../types/auth';
import { db } from './firebase';
import { doc, setDoc } from 'firebase/firestore';

const STORAGE_KEY_CONTRACTS = 'nexaproject_finance_contracts_v1';
const STORAGE_KEY_EXPENSES = 'nexaproject_finance_expenses_v1';

// Seed Shipyard Commercial Contracts
const DEFAULT_CONTRACTS: ShipyardContract[] = [
  {
    id: 'ctr-001',
    contractNumber: 'CTR-2026-001',
    projectId: 'prj-001',
    projectCode: 'PRJ-2026-001',
    shipName: 'MV OCEANIC LEADER',
    ownerName: 'PT Samudera Bahtera Lines Tbk',
    vesselType: 'Bulk Carrier',
    contractDate: '2026-09-20',
    completionTargetDate: '2026-10-30',
    totalContractValue: 4200000000,
    taxPercent: 11,
    taxAmount: 462000000,
    grandTotalValue: 4662000000,
    totalPaid: 1260000000,
    balanceRemaining: 3402000000,
    status: 'PROSES_TERMIN',
    terms: [
      {
        termNumber: 1,
        termName: 'Termin 1 (30%): Down Payment & Docking-in Graving Dock 1',
        percentage: 30,
        amount: 1260000000,
        status: 'PAID',
        invoiceNumber: 'INV-2026-091',
        invoiceDate: '2026-09-22',
        paidDate: '2026-09-25',
        notes: 'Pembayaran DP telah kliring melalui rekening giro Mandiri galangan.'
      },
      {
        termNumber: 2,
        termName: 'Termin 2 (40%): Penyelesaian Pemotongan & Penggantian Pelat Baja Lambung 45 Ton',
        percentage: 40,
        amount: 1680000000,
        status: 'INVOICED',
        invoiceNumber: 'INV-2026-104',
        invoiceDate: '2026-10-18',
        notes: 'Faktur penagihan telah diterima owner, jatuh tempo 14 hari kerja.'
      },
      {
        termNumber: 3,
        termName: 'Termin 3 (25%): Undocking, Overhaul Propeller Shaft, & Sea Trial',
        percentage: 25,
        amount: 1050000000,
        status: 'PENDING',
        notes: 'Diajukan saat uji coba berlayar (sea trial) selesai dengan BKI.'
      },
      {
        termNumber: 4,
        termName: 'Termin 4 (5%): Retensi Garansi Pemeliharaan Galangan (90 Hari)',
        percentage: 5,
        amount: 210000000,
        status: 'PENDING',
        notes: 'Pencairan retensi pasca masa garansi 3 bulan beroperasi lancar.'
      }
    ],
    scopeOfWork: 'Annual Special Survey docking: Penggantian pelat lambung A36 45 ton, overhaul sea chest, blasting SA 2.5, coating antifouling 3 lapis, pengetesan MPI/UT, dan overhaul propeller shaft.',
    signedByClient: 'Capt. Herman Sutrisno (Fleet Director PT SBL)',
    signedByYard: 'MUHAMMAD ANDRI (Creator - Project Director)',
    createdAt: Date.now() - 30 * 24 * 3600 * 1000,
    updatedAt: Date.now()
  },
  {
    id: 'ctr-002',
    contractNumber: 'CTR-2026-002',
    projectId: 'prj-002',
    projectCode: 'PRJ-2026-002',
    shipName: 'MT PACIFIC CHEMIST',
    ownerName: 'Pacific Maritime Corp Ltd',
    vesselType: 'Oil / Chemical Tanker',
    contractDate: '2026-09-28',
    completionTargetDate: '2026-11-15',
    totalContractValue: 5800000000,
    taxPercent: 11,
    taxAmount: 638000000,
    grandTotalValue: 6438000000,
    totalPaid: 1740000000,
    balanceRemaining: 4698000000,
    status: 'PROSES_TERMIN',
    terms: [
      {
        termNumber: 1,
        termName: 'Termin 1 (30%): Mobilisasi, Gas Freeing Tank Clearance, & Berthing',
        percentage: 30,
        amount: 1740000000,
        status: 'PAID',
        invoiceNumber: 'INV-2026-095',
        invoiceDate: '2026-09-30',
        paidDate: '2026-10-02',
        notes: 'Transfer valuta USD ekuivalen IDR dari OCBC Singapore.'
      },
      {
        termNumber: 2,
        termName: 'Termin 2 (35%): Fabrikasi Pipa Cargo Stainless SUS316L 12 Inch 50%',
        percentage: 35,
        amount: 2030000000,
        status: 'INVOICED',
        invoiceNumber: 'INV-2026-112',
        invoiceDate: '2026-10-15',
        notes: 'Verifikasi inspektur ABS telah selesai disahkan.'
      },
      {
        termNumber: 3,
        termName: 'Termin 3 (30%): Hydrotest Jalur Cargo & Tank Internal Epoxy Coating',
        percentage: 30,
        amount: 1740000000,
        status: 'PENDING',
        notes: 'Menunggu penyelesaian instalasi katup hidrolik kargo.'
      },
      {
        termNumber: 4,
        termName: 'Termin 4 (5%): Serah Terima Surat Bebas Gas & Sertifikat ABS',
        percentage: 5,
        amount: 290000000,
        status: 'PENDING',
        notes: 'Jaminan retensi 60 hari pasca serah terima kapal.'
      }
    ],
    scopeOfWork: 'Pemugaran sistem perpipaan kargo kimia stainless steel SUS316L, penggantian 18 unit butterfly valve hidrolik, epoxy coating tanki muatan grade IMO 2, dan NDT radiography 100% butt weld.',
    signedByClient: 'Robert Tan (VP Technical Pacific Maritime Corp)',
    signedByYard: 'MUHAMMAD ANDRI (Creator - Project Director)',
    createdAt: Date.now() - 22 * 24 * 3600 * 1000,
    updatedAt: Date.now()
  },
  {
    id: 'ctr-003',
    contractNumber: 'CTR-2026-003',
    projectId: 'prj-003',
    projectCode: 'PRJ-2026-003',
    shipName: 'TB SAMUDERA PERKASA VIII',
    ownerName: 'PT Pelayaran Samudera Jaya',
    vesselType: 'Tugboat / Kapal Tunda',
    contractDate: '2026-09-01',
    completionTargetDate: '2026-10-10',
    totalContractValue: 1250000000,
    taxPercent: 11,
    taxAmount: 137500000,
    grandTotalValue: 1387500000,
    totalPaid: 1250000000,
    balanceRemaining: 0,
    status: 'LUNAS',
    terms: [
      {
        termNumber: 1,
        termName: 'Termin 1 (30%): Naik Slipway Incline & Pembersihan Lambung',
        percentage: 30,
        amount: 375000000,
        status: 'PAID',
        invoiceNumber: 'INV-2026-088',
        invoiceDate: '2026-09-02',
        paidDate: '2026-09-04',
        notes: 'Lunas transfer Bank BCA.'
      },
      {
        termNumber: 2,
        termName: 'Termin 2 (40%): Overhaul Mesin Induk Yanmar 2x1000 HP & Alignment',
        percentage: 40,
        amount: 500000000,
        status: 'PAID',
        invoiceNumber: 'INV-2026-101',
        invoiceDate: '2026-09-18',
        paidDate: '2026-09-21',
        notes: 'Lunas transfer Bank BCA.'
      },
      {
        termNumber: 3,
        termName: 'Termin 3 (25%): Sea Trial, Bollard Pull Test, & Turun Slipway',
        percentage: 25,
        amount: 312500000,
        status: 'PAID',
        invoiceNumber: 'INV-2026-115',
        invoiceDate: '2026-10-05',
        paidDate: '2026-10-08',
        notes: 'Lunas transfer Bank BCA.'
      },
      {
        termNumber: 4,
        termName: 'Termin 4 (5%): Retensi Garansi Handover Tugboat',
        percentage: 5,
        amount: 62500000,
        status: 'PAID',
        invoiceNumber: 'INV-2026-120',
        invoiceDate: '2026-10-10',
        paidDate: '2026-10-12',
        notes: 'Penyelesaian penuh dan penandatanganan berita acara serah terima.'
      }
    ],
    scopeOfWork: 'Overhaul total 2x Main Engine Yanmar 1000 HP, pengukuran kelurusan poros baling-baling, kalibrasi kemudi flap rudder, dan uji bollard pull bersertifikat BKI.',
    signedByClient: 'Hendra Kusuma (Direktur Utama PT PSJ)',
    signedByYard: 'MUHAMMAD ANDRI (Creator - Project Director)',
    createdAt: Date.now() - 50 * 24 * 3600 * 1000,
    updatedAt: Date.now()
  }
];

// Seed Operational Expenses
const DEFAULT_EXPENSES: OperationalExpense[] = [
  {
    id: 'vch-001',
    voucherNumber: 'VCH-2026-001',
    date: '2026-10-01',
    projectId: 'prj-001',
    projectCode: 'PRJ-2026-001',
    shipName: 'MV OCEANIC LEADER',
    category: 'DOCK_RENTAL',
    description: 'Sewa Graving Drydock 1 Periode Tahap Pertama (30 Hari Kerja)',
    amount: 180000000,
    paymentMethod: 'TRANSFER_BANK',
    recipient: 'PT Pengelola Graving Dock Nusantara',
    receiptNumber: 'KWT-GD-88219',
    status: 'PAID',
    submittedBy: 'BAMBANG SETIAWAN',
    verifiedBy: 'Siti Rahma (Staff Finance)',
    approvedBy: 'MUHAMMAD ANDRI',
    createdAt: Date.now() - 20 * 24 * 3600 * 1000,
    updatedAt: Date.now() - 19 * 24 * 3600 * 1000
  },
  {
    id: 'vch-002',
    voucherNumber: 'VCH-2026-002',
    date: '2026-10-05',
    projectId: 'prj-001',
    projectCode: 'PRJ-2026-001',
    shipName: 'MV OCEANIC LEADER',
    category: 'ELECTRICITY_WATER',
    description: 'Beban Listrik Shore Power 380V 3-Fasa & Pasokan Air Tawar Dermaga',
    amount: 42500000,
    paymentMethod: 'TRANSFER_BANK',
    recipient: 'PT Pelindo Daya Utama',
    receiptNumber: 'INV-PLN-10029',
    status: 'PAID',
    submittedBy: 'DEDI SUPRIADI',
    verifiedBy: 'Siti Rahma (Staff Finance)',
    approvedBy: 'BAMBANG SETIAWAN',
    createdAt: Date.now() - 16 * 24 * 3600 * 1000,
    updatedAt: Date.now() - 15 * 24 * 3600 * 1000
  },
  {
    id: 'vch-003',
    voucherNumber: 'VCH-2026-003',
    date: '2026-10-08',
    projectId: 'prj-001',
    projectCode: 'PRJ-2026-001',
    shipName: 'MV OCEANIC LEADER',
    category: 'FUEL_GENSET',
    description: 'Pengisian Bahan Bakar Solar Industri (HSD) 10.000 Liter Crane & Genset Cadangan',
    amount: 135000000,
    paymentMethod: 'TRANSFER_BANK',
    recipient: 'PT Pertamina Patra Niaga',
    receiptNumber: 'DO-SOLAR-7718',
    status: 'APPROVED',
    submittedBy: 'BAMBANG SETIAWAN',
    verifiedBy: 'Siti Rahma (Staff Finance)',
    approvedBy: 'MUHAMMAD ANDRI',
    createdAt: Date.now() - 13 * 24 * 3600 * 1000,
    updatedAt: Date.now() - 12 * 24 * 3600 * 1000
  },
  {
    id: 'vch-004',
    voucherNumber: 'VCH-2026-004',
    date: '2026-10-10',
    projectId: 'prj-002',
    projectCode: 'PRJ-2026-002',
    shipName: 'MT PACIFIC CHEMIST',
    category: 'NDT_CERTIFICATION',
    description: 'Pengujian Non-Destructive Testing (NDT) Ultrasonic & Radiography Jalur Pipa SUS316L oleh BKI/ABS',
    amount: 38000000,
    paymentMethod: 'TRANSFER_BANK',
    recipient: 'PT Biro Klasifikasi Indonesia (Persero)',
    receiptNumber: 'BKI-NDT-3391',
    status: 'PAID',
    submittedBy: 'AHMAD RIFAI',
    verifiedBy: 'Siti Rahma (Staff Finance)',
    approvedBy: 'BAMBANG SETIAWAN',
    createdAt: Date.now() - 11 * 24 * 3600 * 1000,
    updatedAt: Date.now() - 10 * 24 * 3600 * 1000
  },
  {
    id: 'vch-005',
    voucherNumber: 'VCH-2026-005',
    date: '2026-10-12',
    projectId: 'prj-001',
    projectCode: 'PRJ-2026-001',
    shipName: 'MV OCEANIC LEADER',
    category: 'SUB_CONTRACTOR',
    description: 'Termin 1 Pembayaran Jasa Subkontraktor Sandblasting SA 2.5 Lambung Kiri-Kanan',
    amount: 95000000,
    paymentMethod: 'GIRO',
    recipient: 'CV Bahtera Jaya Blasting',
    receiptNumber: 'KWT-BJB-441',
    status: 'APPROVED',
    submittedBy: 'BAMBANG SETIAWAN',
    verifiedBy: 'Siti Rahma (Staff Finance)',
    approvedBy: 'MUHAMMAD ANDRI',
    createdAt: Date.now() - 9 * 24 * 3600 * 1000,
    updatedAt: Date.now() - 8 * 24 * 3600 * 1000
  },
  {
    id: 'vch-006',
    voucherNumber: 'VCH-2026-006',
    date: '2026-10-14',
    category: 'SAFETY_CONSUMABLES',
    description: 'Pengadaan Kelengkapan APD K3: Helm Safety, Kedok Las Otomatis, Sarung Tangan Kulit & Masker Karbon',
    amount: 18500000,
    paymentMethod: 'PETTY_CASH',
    recipient: 'Toko Teknik Samudera Safety',
    receiptNumber: 'NOTA-TSS-902',
    status: 'PAID',
    submittedBy: 'DEDI SUPRIADI',
    verifiedBy: 'Siti Rahma (Staff Finance)',
    approvedBy: 'BAMBANG SETIAWAN',
    createdAt: Date.now() - 7 * 24 * 3600 * 1000,
    updatedAt: Date.now() - 6 * 24 * 3600 * 1000
  },
  {
    id: 'vch-007',
    voucherNumber: 'VCH-2026-007',
    date: '2026-10-16',
    projectId: 'prj-002',
    projectCode: 'PRJ-2026-002',
    shipName: 'MT PACIFIC CHEMIST',
    category: 'MATERIAL_PURCHASE',
    description: 'Pengadaan Darurat Sambungan Flange Stainless Steel SUS316L 150 lbs & Gasket PTFE',
    amount: 48000000,
    paymentMethod: 'TRANSFER_BANK',
    recipient: 'PT Metalindo Pipa Pratama',
    receiptNumber: 'PO-MPP-1092',
    status: 'VERIFIED',
    submittedBy: 'AHMAD RIFAI',
    verifiedBy: 'Siti Rahma (Staff Finance)',
    createdAt: Date.now() - 5 * 24 * 3600 * 1000,
    updatedAt: Date.now() - 4 * 24 * 3600 * 1000
  },
  {
    id: 'vch-008',
    voucherNumber: 'VCH-2026-008',
    date: '2026-10-18',
    category: 'OVERHEAD_OFFICE',
    description: 'Penggantian Komponen Rotor & Oli Kompresor Udara Bertekanan Tinggi (Screw Compressor 75 kW)',
    amount: 65000000,
    paymentMethod: 'TRANSFER_BANK',
    recipient: 'PT Atlas Power Compressor',
    receiptNumber: 'QUO-ATC-552',
    status: 'SUBMITTED',
    submittedBy: 'DEDI SUPRIADI',
    createdAt: Date.now() - 3 * 24 * 3600 * 1000,
    updatedAt: Date.now() - 3 * 24 * 3600 * 1000
  }
];

class FinanceDatabase {
  private contracts: ShipyardContract[] = [];
  private expenses: OperationalExpense[] = [];

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    try {
      const savedContracts = localStorage.getItem(STORAGE_KEY_CONTRACTS);
      if (savedContracts) {
        this.contracts = JSON.parse(savedContracts);
      } else {
        this.contracts = [...DEFAULT_CONTRACTS];
        this.saveContractsToStorage();
      }

      const savedExpenses = localStorage.getItem(STORAGE_KEY_EXPENSES);
      if (savedExpenses) {
        this.expenses = JSON.parse(savedExpenses);
      } else {
        this.expenses = [...DEFAULT_EXPENSES];
        this.saveExpensesToStorage();
      }
    } catch {
      this.contracts = [...DEFAULT_CONTRACTS];
      this.expenses = [...DEFAULT_EXPENSES];
    }
  }

  private saveContractsToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY_CONTRACTS, JSON.stringify(this.contracts));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  private saveExpensesToStorage(): void {
    try {
      localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(this.expenses));
    } catch (e) {
      console.warn('Storage save failed:', e);
    }
  }

  private isCreatorAccount(email?: string, role?: UserRole): boolean {
    if (!email) return false;
    const lower = email.toLowerCase().trim();
    return lower === 'muhammad.andri0605@gmail.com' || lower === 'creator@nexaproject.com' || role === 'creator';
  }

  // --- CONTRACT METHODS ---
  public getContracts(): ShipyardContract[] {
    return [...this.contracts];
  }

  public getContractById(id: string): ShipyardContract | undefined {
    return this.contracts.find(c => c.id === id);
  }

  public saveContract(
    contractData: Partial<ShipyardContract>, 
    userRole: UserRole, 
    userEmail: string
  ): { success: boolean; message: string; contract?: ShipyardContract } {
    const isCreator = this.isCreatorAccount(userEmail, userRole);

    // If editing existing contract
    if (contractData.id) {
      const idx = this.contracts.findIndex(c => c.id === contractData.id);
      if (idx === -1) {
        return { success: false, message: 'Kontrak galangan tidak ditemukan.' };
      }

      const existing = this.contracts[idx];

      // Subordinates cannot change contract total value or signed status if signed by Creator
      if (
        !isCreator && 
        contractData.totalContractValue !== undefined && 
        contractData.totalContractValue !== existing.totalContractValue
      ) {
        return { 
          success: false, 
          message: 'Hak Akses Ditolak: Perubahan nilai kontrak resmi galangan memiliki proteksi Creator mutlak.' 
        };
      }

      const updated: ShipyardContract = {
        ...existing,
        ...contractData,
        updatedAt: Date.now()
      };

      // Recalculate taxes and balance
      if (contractData.totalContractValue !== undefined) {
        updated.taxAmount = (updated.totalContractValue * (updated.taxPercent || 11)) / 100;
        updated.grandTotalValue = updated.totalContractValue + updated.taxAmount;
      }
      if (updated.terms) {
        updated.totalPaid = updated.terms
          .filter(t => t.status === 'PAID')
          .reduce((sum, t) => sum + t.amount, 0);
        updated.balanceRemaining = updated.grandTotalValue - updated.totalPaid;
        if (updated.balanceRemaining <= 0) {
          updated.status = 'LUNAS';
        } else if (updated.totalPaid > 0) {
          updated.status = 'PROSES_TERMIN';
        }
      }

      this.contracts[idx] = updated;
      this.saveContractsToStorage();

      // Cloud sync
      try {
        setDoc(doc(db, 'contracts', updated.id), updated, { merge: true }).catch(() => {});
      } catch {}

      return { success: true, message: 'Kontrak berhasil diperbarui.', contract: updated };
    }

    // Creating new contract
    const totalVal = contractData.totalContractValue || 0;
    const taxPct = contractData.taxPercent || 11;
    const taxAmt = (totalVal * taxPct) / 100;
    const grandVal = totalVal + taxAmt;

    const defaultTerms: ContractMilestoneTerm[] = contractData.terms || [
      {
        termNumber: 1,
        termName: 'Termin 1 (30%): Uang Muka (DP) & Docking Kapal',
        percentage: 30,
        amount: (grandVal * 30) / 100,
        status: 'PENDING'
      },
      {
        termNumber: 2,
        termName: 'Termin 2 (40%): Progres 50% Fabrikasi Baja / Lambung',
        percentage: 40,
        amount: (grandVal * 40) / 100,
        status: 'PENDING'
      },
      {
        termNumber: 3,
        termName: 'Termin 3 (25%): Undocking & Pelaksanaan Sea Trial',
        percentage: 25,
        amount: (grandVal * 25) / 100,
        status: 'PENDING'
      },
      {
        termNumber: 4,
        termName: 'Termin 4 (5%): Retensi Garansi Pemeliharaan',
        percentage: 5,
        amount: (grandVal * 5) / 100,
        status: 'PENDING'
      }
    ];

    const newContract: ShipyardContract = {
      id: `ctr-${Date.now().toString().slice(-6)}`,
      contractNumber: contractData.contractNumber || `CTR-${new Date().getFullYear()}-${String(this.contracts.length + 1).padStart(3, '0')}`,
      projectId: contractData.projectId || '',
      projectCode: contractData.projectCode || '',
      shipName: contractData.shipName || 'KAPAL TANPA NAMA',
      ownerName: contractData.ownerName || 'OWNER UMUM',
      vesselType: contractData.vesselType || 'General Cargo',
      contractDate: contractData.contractDate || new Date().toISOString().split('T')[0],
      completionTargetDate: contractData.completionTargetDate || new Date().toISOString().split('T')[0],
      totalContractValue: totalVal,
      taxPercent: taxPct,
      taxAmount: taxAmt,
      grandTotalValue: grandVal,
      totalPaid: 0,
      balanceRemaining: grandVal,
      status: 'DRAFT',
      terms: defaultTerms,
      scopeOfWork: contractData.scopeOfWork || '',
      signedByClient: contractData.signedByClient || '',
      signedByYard: isCreator ? 'MUHAMMAD ANDRI (Creator - Project Director)' : (contractData.signedByYard || ''),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.contracts.unshift(newContract);
    this.saveContractsToStorage();

    // Cloud sync
    try {
      setDoc(doc(db, 'contracts', newContract.id), newContract).catch(() => {});
    } catch {}

    return { success: true, message: 'Kontrak galangan baru berhasil didaftarkan.', contract: newContract };
  }

  public updateMilestoneStatus(
    contractId: string, 
    termNumber: number, 
    newStatus: 'PENDING' | 'INVOICED' | 'PAID',
    invoiceNumber?: string,
    paidDate?: string,
    notes?: string
  ): boolean {
    const idx = this.contracts.findIndex(c => c.id === contractId);
    if (idx === -1) return false;

    const contract = this.contracts[idx];
    const term = contract.terms.find(t => t.termNumber === termNumber);
    if (!term) return false;

    term.status = newStatus;
    if (invoiceNumber) term.invoiceNumber = invoiceNumber;
    if (invoiceNumber && !term.invoiceDate) term.invoiceDate = new Date().toISOString().split('T')[0];
    if (newStatus === 'PAID') {
      term.paidDate = paidDate || new Date().toISOString().split('T')[0];
    }
    if (notes) term.notes = notes;

    // Recalculate totals
    contract.totalPaid = contract.terms
      .filter(t => t.status === 'PAID')
      .reduce((sum, t) => sum + t.amount, 0);
    contract.balanceRemaining = contract.grandTotalValue - contract.totalPaid;
    
    if (contract.balanceRemaining <= 0) {
      contract.status = 'LUNAS';
    } else if (contract.totalPaid > 0) {
      contract.status = 'PROSES_TERMIN';
    } else {
      contract.status = 'DRAFT';
    }

    contract.updatedAt = Date.now();
    this.saveContractsToStorage();

    try {
      setDoc(doc(db, 'contracts', contract.id), contract, { merge: true }).catch(() => {});
    } catch {}

    return true;
  }

  public deleteContract(id: string, userRole: UserRole, userEmail: string): { success: boolean; message: string } {
    const isCreator = this.isCreatorAccount(userEmail, userRole);
    if (!isCreator) {
      return { 
        success: false, 
        message: 'Akses Ditolak: Penghapusan kontrak komersial galangan dilindungi secara permanen oleh Creator.' 
      };
    }

    this.contracts = this.contracts.filter(c => c.id !== id);
    this.saveContractsToStorage();
    return { success: true, message: 'Kontrak berhasil dihapus dari sistem.' };
  }

  // --- OPERATIONAL EXPENSES METHODS ---
  public getExpenses(filterCategory?: ExpenseCategory, filterProjectId?: string): OperationalExpense[] {
    let list = [...this.expenses];
    if (filterCategory) {
      list = list.filter(e => e.category === filterCategory);
    }
    if (filterProjectId) {
      list = list.filter(e => e.projectId === filterProjectId);
    }
    return list.sort((a, b) => b.createdAt - a.createdAt);
  }

  public submitExpense(
    expenseData: Omit<OperationalExpense, 'id' | 'voucherNumber' | 'createdAt' | 'updatedAt' | 'status' | 'submittedBy'>,
    submittedBy: string
  ): OperationalExpense {
    const count = this.expenses.length + 1;
    const newExpense: OperationalExpense = {
      ...expenseData,
      id: `vch-${Date.now().toString().slice(-6)}`,
      voucherNumber: `VCH-${new Date().getFullYear()}-${String(count).padStart(3, '0')}`,
      status: 'SUBMITTED',
      submittedBy,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.expenses.unshift(newExpense);
    this.saveExpensesToStorage();

    try {
      setDoc(doc(db, 'financial_expenses', newExpense.id), newExpense).catch(() => {});
    } catch {}

    return newExpense;
  }

  public verifyExpense(id: string, verifierName: string): boolean {
    const idx = this.expenses.findIndex(e => e.id === id);
    if (idx === -1) return false;

    this.expenses[idx].status = 'VERIFIED';
    this.expenses[idx].verifiedBy = verifierName;
    this.expenses[idx].updatedAt = Date.now();
    this.saveExpensesToStorage();

    try {
      setDoc(doc(db, 'financial_expenses', id), this.expenses[idx], { merge: true }).catch(() => {});
    } catch {}

    return true;
  }

  public approveExpense(
    id: string, 
    userRole: UserRole, 
    userEmail: string, 
    approverName: string
  ): { success: boolean; message: string } {
    const idx = this.expenses.findIndex(e => e.id === id);
    if (idx === -1) return { success: false, message: 'Voucher pengeluaran tidak ditemukan.' };

    const exp = this.expenses[idx];
    const isCreator = this.isCreatorAccount(userEmail, userRole);

    // Defense: Expenses above Rp 50.000.000 strictly require Creator sign-off
    if (exp.amount > 50000000 && !isCreator) {
      return {
        success: false,
        message: 'Akses Ditolak: Pengeluaran bernilai tinggi (> Rp 50.000.000) strictly memerlukan persetujuan langsung dari CREATOR (Muhammad Andri).'
      };
    }

    exp.status = 'APPROVED';
    exp.approvedBy = approverName;
    exp.updatedAt = Date.now();
    this.saveExpensesToStorage();

    try {
      setDoc(doc(db, 'financial_expenses', id), exp, { merge: true }).catch(() => {});
    } catch {}

    return { success: true, message: 'Pengeluaran berhasil disetujui untuk pencairan kas.' };
  }

  public markExpensePaid(id: string, userRole: UserRole): { success: boolean; message: string } {
    if (userRole === 'karyawan') {
      return { success: false, message: 'Karyawan tidak memiliki wewenang kasir pencairan voucher kas.' };
    }

    const idx = this.expenses.findIndex(e => e.id === id);
    if (idx === -1) return { success: false, message: 'Voucher pengeluaran tidak ditemukan.' };

    this.expenses[idx].status = 'PAID';
    this.expenses[idx].updatedAt = Date.now();
    this.saveExpensesToStorage();

    try {
      setDoc(doc(db, 'financial_expenses', id), this.expenses[idx], { merge: true }).catch(() => {});
    } catch {}

    return { success: true, message: 'Voucher telah dicairkan dan dicatat pada buku kas lunas.' };
  }

  public rejectExpense(
    id: string, 
    reason: string, 
    userRole: UserRole, 
    userEmail: string
  ): { success: boolean; message: string } {
    if (userRole === 'karyawan') {
      return { success: false, message: 'Karyawan tidak dapat menolak voucher resmi.' };
    }

    const idx = this.expenses.findIndex(e => e.id === id);
    if (idx === -1) return { success: false, message: 'Voucher pengeluaran tidak ditemukan.' };

    this.expenses[idx].status = 'REJECTED';
    this.expenses[idx].rejectionReason = reason;
    this.expenses[idx].updatedAt = Date.now();
    this.saveExpensesToStorage();

    try {
      setDoc(doc(db, 'financial_expenses', id), this.expenses[idx], { merge: true }).catch(() => {});
    } catch {}

    return { success: true, message: 'Pengeluaran berhasil ditolak dengan catatan evaluasi.' };
  }

  // --- CASHFLOW & FINANCIAL SUMMARY ---
  public getCashflowSummary(): FinancialCashflowSummary {
    // Total Revenue Invoiced: sum of all terms that are INVOICED or PAID
    let totalInvoiced = 0;
    let totalReceived = 0;

    this.contracts.forEach(ctr => {
      ctr.terms.forEach(term => {
        if (term.status === 'INVOICED' || term.status === 'PAID') {
          totalInvoiced += term.amount;
        }
        if (term.status === 'PAID') {
          totalReceived += term.amount;
        }
      });
    });

    const totalPendingReceivables = totalInvoiced - totalReceived;

    // Total expenses paid
    const totalExpensesPaid = this.expenses
      .filter(e => e.status === 'PAID' || e.status === 'APPROVED')
      .reduce((sum, e) => sum + e.amount, 0);

    const netOperatingProfit = totalReceived - totalExpensesPaid;
    const overallProfitMargin = totalReceived > 0 
      ? Number(((netOperatingProfit / totalReceived) * 100).toFixed(1))
      : 0;

    return {
      totalRevenueInvoiced: totalInvoiced,
      totalRevenueReceived: totalReceived,
      totalPendingReceivables: totalPendingReceivables,
      totalExpensesPaid: totalExpensesPaid,
      netOperatingProfit: netOperatingProfit,
      overallProfitMargin: overallProfitMargin
    };
  }

  // --- EXCEL EXPORTS ---
  public async exportContractsToExcel(): Promise<Blob> {
    const list = this.getContracts();
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NEXAPROJECT Shipyard Commercial Finance';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Daftar Kontrak Galangan');
    sheet.columns = [
      { header: 'NO KONTRAK', key: 'contractNumber', width: 16 },
      { header: 'KODE PROYEK', key: 'projectCode', width: 16 },
      { header: 'NAMA KAPAL', key: 'shipName', width: 24 },
      { header: 'PEMILIK (OWNER)', key: 'ownerName', width: 28 },
      { header: 'TIPE KAPAL', key: 'vesselType', width: 20 },
      { header: 'TGL KONTRAK', key: 'contractDate', width: 14 },
      { header: 'TARGET SELESAI', key: 'completionTargetDate', width: 14 },
      { header: 'NILAI KONTRAK (RP)', key: 'totalContractValue', width: 20 },
      { header: 'PPN 11% (RP)', key: 'taxAmount', width: 18 },
      { header: 'TOTAL KONTRAK + PPN (RP)', key: 'grandTotalValue', width: 22 },
      { header: 'TOTAL DIBAYAR (RP)', key: 'totalPaid', width: 20 },
      { header: 'SISA PIUTANG (RP)', key: 'balanceRemaining', width: 20 },
      { header: 'STATUS PENAGIHAN', key: 'status', width: 16 },
      { header: 'PENANDATANGAN GALANGAN', key: 'signedByYard', width: 26 },
      { header: 'PENANDATANGAN OWNER', key: 'signedByClient', width: 26 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };

    list.forEach(c => {
      sheet.addRow({
        contractNumber: c.contractNumber,
        projectCode: c.projectCode,
        shipName: c.shipName,
        ownerName: c.ownerName,
        vesselType: c.vesselType,
        contractDate: c.contractDate,
        completionTargetDate: c.completionTargetDate,
        totalContractValue: c.totalContractValue,
        taxAmount: c.taxAmount,
        grandTotalValue: c.grandTotalValue,
        totalPaid: c.totalPaid,
        balanceRemaining: c.balanceRemaining,
        status: c.status,
        signedByYard: c.signedByYard,
        signedByClient: c.signedByClient,
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  public async exportExpensesToExcel(): Promise<Blob> {
    const list = this.getExpenses();
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NEXAPROJECT Shipyard Operational Finance';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Buku Kas Pengeluaran');
    sheet.columns = [
      { header: 'NO VOUCHER', key: 'voucherNumber', width: 16 },
      { header: 'TANGGAL', key: 'date', width: 14 },
      { header: 'KATEGORI', key: 'category', width: 22 },
      { header: 'KAPAL / PROYEK', key: 'shipName', width: 22 },
      { header: 'URAIAN PENGELUARAN', key: 'description', width: 36 },
      { header: 'JUMLAH (RP)', key: 'amount', width: 18 },
      { header: 'METODE BAYAR', key: 'paymentMethod', width: 16 },
      { header: 'PENERIMA / VENDOR', key: 'recipient', width: 28 },
      { header: 'NO KUITANSI / NOTA', key: 'receiptNumber', width: 18 },
      { header: 'STATUS', key: 'status', width: 14 },
      { header: 'DIAJUKAN OLEH', key: 'submittedBy', width: 20 },
      { header: 'DIVERIFIKASI OLEH', key: 'verifiedBy', width: 20 },
      { header: 'DISETUJUI OLEH', key: 'approvedBy', width: 22 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFB45309' } };

    list.forEach(e => {
      sheet.addRow({
        voucherNumber: e.voucherNumber,
        date: e.date,
        category: e.category,
        shipName: e.shipName || 'Beban Umum Galangan',
        description: e.description,
        amount: e.amount,
        paymentMethod: e.paymentMethod,
        recipient: e.recipient,
        receiptNumber: e.receiptNumber || '-',
        status: e.status,
        submittedBy: e.submittedBy,
        verifiedBy: e.verifiedBy || '-',
        approvedBy: e.approvedBy || '-',
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
}

export const financeDb = new FinanceDatabase();
