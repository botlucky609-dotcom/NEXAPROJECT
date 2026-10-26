export type ContractBillingStatus = 'LUNAS' | 'PROSES_TERMIN' | 'TERTUNDA' | 'DRAFT';
export type ExpenseCategory = 
  | 'LABOR_PAYROLL'
  | 'MATERIAL_PURCHASE'
  | 'DOCK_RENTAL'
  | 'ELECTRICITY_WATER'
  | 'FUEL_GENSET'
  | 'NDT_CERTIFICATION'
  | 'SUB_CONTRACTOR'
  | 'SAFETY_CONSUMABLES'
  | 'OVERHEAD_OFFICE';

export interface ContractMilestoneTerm {
  termNumber: number;
  termName: string;
  percentage: number;
  amount: number;
  status: 'PENDING' | 'INVOICED' | 'PAID';
  invoiceNumber?: string;
  invoiceDate?: string;
  paidDate?: string;
  notes?: string;
}

export interface ShipyardContract {
  id: string;
  contractNumber: string; // e.g. CTR-2026-001
  projectId: string;
  projectCode: string;
  shipName: string;
  ownerName: string;
  vesselType: string;
  contractDate: string;
  completionTargetDate: string;
  totalContractValue: number; // e.g. Rp 4.200.000.000
  taxPercent: number; // 11% PPN
  taxAmount: number;
  grandTotalValue: number; // Value + Tax
  totalPaid: number;
  balanceRemaining: number;
  status: ContractBillingStatus;
  terms: ContractMilestoneTerm[];
  scopeOfWork: string;
  signedByClient: string;
  signedByYard: string; // Creator: MUHAMMAD ANDRI
  createdAt: number;
  updatedAt: number;
}

export interface OperationalExpense {
  id: string;
  voucherNumber: string; // e.g. VCH-2026-101
  date: string;
  projectId?: string;
  projectCode?: string;
  shipName?: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: 'TRANSFER_BANK' | 'PETTY_CASH' | 'GIRO';
  recipient: string;
  receiptNumber?: string;
  status: 'SUBMITTED' | 'VERIFIED' | 'APPROVED' | 'PAID' | 'REJECTED';
  submittedBy: string;
  verifiedBy?: string;
  approvedBy?: string; // High budget expenses require Creator
  rejectionReason?: string;
  createdAt: number;
  updatedAt: number;
}

export interface FinancialCashflowSummary {
  totalRevenueInvoiced: number;
  totalRevenueReceived: number;
  totalPendingReceivables: number;
  totalExpensesPaid: number;
  netOperatingProfit: number;
  overallProfitMargin: number;
}
