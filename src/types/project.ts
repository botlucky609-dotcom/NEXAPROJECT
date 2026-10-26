export type ProjectStatus = 'in_progress' | 'completed' | 'on_hold';

export type VesselType = 
  | 'Bulk Carrier'
  | 'Oil / Chemical Tanker'
  | 'Container Ship'
  | 'Ocean Tugboat'
  | 'Cargo Vessel'
  | 'Offshore Barge'
  | 'Passenger Ferry';

export type ProjectScope = 
  | 'Ship Repair'
  | 'Annual Docking (SS/DS)'
  | 'Special Survey'
  | 'New Building'
  | 'Conversion / Retrofit'
  | 'Emergency Repair';

export interface ShipProject {
  id: string;
  projectCode: string; // e.g. PRJ-2026-001
  shipName: string; // e.g. MV OCEANIC LEADER
  vesselType: VesselType;
  deadweightTonnage: number; // DWT
  lengthOverall: number; // LOA (meter)
  beam: number; // Lebar (meter)
  owner: string; // Pemilik kapal / Shipping Company
  flag: string; // Bendera kapal (Indonesia, Panama, Singapore, etc.)
  classificationSociety: string; // BKI, ABS, LR, NK, DNV
  projectType: ProjectScope;
  location: string; // Drydock 1, Slipway A, Berth 2, etc.
  startDate: string;
  targetDate: string;
  completionDate?: string;
  status: ProjectStatus;
  progressPercentage: number;
  // Financial Budget (Protected)
  budgetTotal: number;
  actualCost: number;
  estimatedMargin: number;
  assignedSupervisors: string[]; // Supervisor names
  description: string;
  createdAt: number;
  updatedAt: number;
}

export interface ProjectSupervisor {
  id: string;
  employeeId: string;
  fullName: string;
  role: 'SUPERINTENDENT' | 'HULL & STEEL SUPERVISOR' | 'PIPING SUPERVISOR' | 'WELDING INSPECTOR (WI)' | 'PAINTING & BLASTING QC' | 'HSE SAFETY OFFICER';
  phone: string;
  email: string;
  assignedProjectCode: string;
  assignedShipName: string;
  status: 'ON_DUTY' | 'STANDBY' | 'OFF_DUTY';
  lastInspectionDate: string;
  certifications: string;
}

export interface ProgressMilestone {
  id: string;
  projectId: string;
  milestoneOrder: number;
  phaseName: string;
  plannedPercent: number;
  actualPercent: number;
  status: 'done' | 'in_progress' | 'pending';
  targetDate: string;
  completedDate?: string;
  notes: string;
}

export interface ProjectCostItem {
  id: string;
  projectId: string;
  category: 'MATERIAL' | 'LABOR' | 'DOCK_RENTAL' | 'SUBCONTRACTOR' | 'EQUIPMENT' | 'OVERHEAD';
  description: string;
  budgetAmount: number;
  actualAmount: number;
  variance: number;
  approvedBy: string;
  date: string;
}
