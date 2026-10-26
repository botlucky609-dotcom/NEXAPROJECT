export type WarehouseCategory = 
  | 'STEEL_PLATE'
  | 'WELDING_CONSUMABLE'
  | 'PAINT_CHEMICAL'
  | 'PIPING_VALVE'
  | 'ELECTRICAL'
  | 'TOOLS_SAFETY';

export interface WarehouseItem {
  id: string;
  itemCode: string;
  itemName: string;
  category: WarehouseCategory;
  specification: string;
  unit: string;
  stockQty: number;
  minStockQty: number;
  rackLocation: string;
  unitPrice: number;
  isHighValue: boolean;
  lastRestockedAt: string;
  supplier: string;
}

export interface MaterialOrderItem {
  itemId: string;
  itemCode: string;
  itemName: string;
  qty: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
}

export interface MaterialOrder {
  id: string;
  orderNumber: string;
  projectId: string;
  projectCode: string;
  shipName: string;
  requesterId: string;
  requesterName: string;
  department: string;
  items: MaterialOrderItem[];
  totalEstimatedCost: number;
  priority: 'NORMAL' | 'URGENT' | 'EMERGENCY';
  status: 'PENDING' | 'APPROVED' | 'IN_PROCUREMENT' | 'RECEIVED' | 'REJECTED';
  rejectionReason?: string;
  isCreatorApprovalRequired: boolean; // Required if totalEstimatedCost > 50,000,000
  approvedBy?: string;
  approvedAt?: string;
  dateNeeded: string;
  createdAt: number;
  updatedAt: number;
}

export interface StockMovement {
  id: string;
  movementType: 'IN' | 'OUT' | 'ADJUSTMENT';
  itemId: string;
  itemCode: string;
  itemName: string;
  qty: number;
  unit: string;
  referenceNumber: string;
  projectId?: string;
  shipName?: string;
  operatorName: string;
  date: string;
  notes: string;
}
