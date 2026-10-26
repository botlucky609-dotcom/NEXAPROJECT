export type AnnouncementPriority = 'CRITICAL' | 'HIGH' | 'NORMAL' | 'INFO';

export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'QC_INSPECTION' | 'COMPLETED' | 'BLOCKED';
export type TaskPriority = 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface ShipyardAnnouncement {
  id: string;
  title: string;
  content: string;
  category: 'SAFETY_HSE' | 'OPERATIONAL' | 'TECHNICAL' | 'MANAGEMENT';
  priority: AnnouncementPriority;
  targetDepartment: string;
  issuedBy: string;
  validUntil: string;
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  acknowledgmentsCount?: number;
}

export interface FieldWorkTask {
  id: string;
  taskNumber: string; // e.g. TSK-2026-001
  title: string;
  description: string;
  projectId: string;
  projectCode: string;
  shipName: string;
  department: string; // 'STEEL WORK' | 'PIPING' | 'ELECTRICAL' | 'COATING' | 'MACHINERY'
  location: string; // e.g. 'Graving Drydock 1', 'Engine Room', 'Berth 3'
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo: string[]; // Employee names
  assignedEmployeeIds: string[]; // EMP-001, EMP-002, etc.
  supervisorName: string;
  qcInspectorName?: string;
  startDate: string;
  dueDate: string;
  progressPercentage: number;
  safetyPermitsRequired: string[]; // e.g. ['Hot Work Permit', 'Confined Space Entry', 'Working at Height']
  materialsRequired?: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}
