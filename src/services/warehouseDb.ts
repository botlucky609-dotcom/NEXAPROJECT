import ExcelJS from 'exceljs';
import { WarehouseItem, MaterialOrder, StockMovement, WarehouseCategory } from '../types/warehouse';
import { UserRole } from '../types/auth';
import { db } from './firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';

const STORAGE_KEY_INVENTORY = 'nexaproject_warehouse_inventory_v1';
const STORAGE_KEY_ORDERS = 'nexaproject_warehouse_orders_v1';
const STORAGE_KEY_MOVEMENTS = 'nexaproject_warehouse_movements_v1';

// Seed Warehouse Inventory
const DEFAULT_INVENTORY: WarehouseItem[] = [
  {
    id: 'mat-001',
    itemCode: 'MAT-STL-001',
    itemName: 'Pelat Baja Marine AH36 (12mm x 5ft x 20ft)',
    category: 'STEEL_PLATE',
    specification: 'High Tensile Shipbuilding Steel AH36 BKI/LR Certified, Mill Cert Enclosed',
    unit: 'Lbr',
    stockQty: 42,
    minStockQty: 15,
    rackLocation: 'Steel Stockyard Blok A1',
    unitPrice: 12500000,
    isHighValue: true,
    lastRestockedAt: '2026-10-10',
    supplier: 'PT Krakatau Posco',
  },
  {
    id: 'mat-002',
    itemCode: 'MAT-STL-002',
    itemName: 'Pelat Baja Marine Grade A (16mm x 6ft x 20ft)',
    category: 'STEEL_PLATE',
    specification: 'Mild Steel Marine Grade A, Tensile 400-520 MPa',
    unit: 'Lbr',
    stockQty: 8, // Below minStockQty
    minStockQty: 12,
    rackLocation: 'Steel Stockyard Blok A2',
    unitPrice: 18200000,
    isHighValue: true,
    lastRestockedAt: '2026-09-28',
    supplier: 'PT Gunawan Dianjaya Steel',
  },
  {
    id: 'mat-003',
    itemCode: 'MAT-WLD-001',
    itemName: 'Kawat Las Kobelco LB-52 dia 3.2mm (E7016)',
    category: 'WELDING_CONSUMABLE',
    specification: 'Low Hydrogen Electrode for Mild & 490MPa High Tensile Steel',
    unit: 'Dus (20kg)',
    stockQty: 85,
    minStockQty: 25,
    rackLocation: 'Gudang Utama A - Rak W1',
    unitPrice: 780000,
    isHighValue: false,
    lastRestockedAt: '2026-10-15',
    supplier: 'PT Kobe Welding Indonesia',
  },
  {
    id: 'mat-004',
    itemCode: 'MAT-WLD-002',
    itemName: 'Kawat Las Flux Cored Dual Shield 7100 Ultra dia 1.2mm',
    category: 'WELDING_CONSUMABLE',
    specification: 'AWS A5.20 E71T-1C / All Position FCAW Wire (15kg spool)',
    unit: 'Roll (15kg)',
    stockQty: 14, // Below minStockQty
    minStockQty: 20,
    rackLocation: 'Gudang Utama A - Rak W2',
    unitPrice: 890000,
    isHighValue: false,
    lastRestockedAt: '2026-10-02',
    supplier: 'PT ESABindo Pratama',
  },
  {
    id: 'mat-005',
    itemCode: 'MAT-PNT-001',
    itemName: 'Cat Primer Jotun Penguard Primer Grey (20L Comp A+B)',
    category: 'PAINT_CHEMICAL',
    specification: 'Two-pack polyamide cured epoxy primer for steel structures',
    unit: 'Pail (20L)',
    stockQty: 34,
    minStockQty: 10,
    rackLocation: 'Gudang Kimia & Cat B - Rak 01',
    unitPrice: 2850000,
    isHighValue: false,
    lastRestockedAt: '2026-10-12',
    supplier: 'PT Jotun Indonesia Marine',
  },
  {
    id: 'mat-006',
    itemCode: 'MAT-PNT-002',
    itemName: 'Cat Antifouling Jotun SeaForce Active Red (20L)',
    category: 'PAINT_CHEMICAL',
    specification: 'Self-polishing silyl acrylate antifouling coating for ocean-going vessels',
    unit: 'Pail (20L)',
    stockQty: 28,
    minStockQty: 15,
    rackLocation: 'Gudang Kimia & Cat B - Rak 02',
    unitPrice: 3400000,
    isHighValue: true,
    lastRestockedAt: '2026-10-08',
    supplier: 'PT Jotun Indonesia Marine',
  },
  {
    id: 'mat-007',
    itemCode: 'MAT-PIP-001',
    itemName: 'Pipa Seamless ASTM A106 Gr. B 4" Sch 40 (6m)',
    category: 'PIPING_VALVE',
    specification: 'Carbon Steel High Temperature Service Seamless Pipe',
    unit: 'Btg (6m)',
    stockQty: 45,
    minStockQty: 20,
    rackLocation: 'Piping Yard Blok C',
    unitPrice: 2100000,
    isHighValue: false,
    lastRestockedAt: '2026-10-05',
    supplier: 'PT Bakrie Pipe Industries',
  },
  {
    id: 'mat-008',
    itemCode: 'MAT-VLV-001',
    itemName: 'Marine Butterfly Valve Wafer Type JIS 10K 6" Cast Iron',
    category: 'PIPING_VALVE',
    specification: 'Rubber Lined NBR with Stainless Steel Disc 316, Lever Operated',
    unit: 'Unit',
    stockQty: 16,
    minStockQty: 8,
    rackLocation: 'Gudang Utama A - Rak V1',
    unitPrice: 4200000,
    isHighValue: true,
    lastRestockedAt: '2026-09-20',
    supplier: 'PT KITZ Valve Indonesia',
  },
  {
    id: 'mat-009',
    itemCode: 'MAT-TLS-001',
    itemName: 'Batu Gerinda Pemotong Resibon 4" (105 x 1.2 x 16mm)',
    category: 'TOOLS_SAFETY',
    specification: 'Abrasive Cutting Disc Max RPM 14500 (1 Box isi 50 Pcs)',
    unit: 'Dus (50 Pcs)',
    stockQty: 110,
    minStockQty: 30,
    rackLocation: 'Gudang Perkakas C - Rak 04',
    unitPrice: 450000,
    isHighValue: false,
    lastRestockedAt: '2026-10-14',
    supplier: 'PT Nippon Resibon Indonesia',
  },
  {
    id: 'mat-010',
    itemCode: 'MAT-ELC-001',
    itemName: 'Kabel Marine JIS C 3410 DPYC-2.5 mm² (100m Roll)',
    category: 'ELECTRICAL',
    specification: 'Shipboard Double Core PVC Insulated Armored Cable',
    unit: 'Roll (100m)',
    stockQty: 9, // Below minStockQty
    minStockQty: 12,
    rackLocation: 'Gudang Elektrikal D - Rak E2',
    unitPrice: 5600000,
    isHighValue: true,
    lastRestockedAt: '2026-09-15',
    supplier: 'PT Supreme Cable Mfg',
  },
];

// Seed Material Requisition Orders (Directly fulfilling Dashboard Block 5)
const DEFAULT_ORDERS: MaterialOrder[] = [
  {
    id: 'ord-001',
    orderNumber: 'WO-2026-091',
    projectId: 'prj-001',
    projectCode: 'PRJ-2026-001',
    shipName: 'MV OCEANIC LEADER',
    requesterId: 'EMP-005',
    requesterName: 'DEDI SUPRIADI',
    department: 'STEEL WORK',
    items: [
      {
        itemId: 'mat-001',
        itemCode: 'MAT-STL-001',
        itemName: 'Pelat Baja Marine AH36 (12mm x 5ft x 20ft)',
        qty: 6,
        unit: 'Lbr',
        unitPrice: 12500000,
        totalPrice: 75000000, // > 50 Juta -> Needs Creator Approval!
      },
      {
        itemId: 'mat-003',
        itemCode: 'MAT-WLD-001',
        itemName: 'Kawat Las Kobelco LB-52 dia 3.2mm (E7016)',
        qty: 10,
        unit: 'Dus (20kg)',
        unitPrice: 780000,
        totalPrice: 7800000,
      },
    ],
    totalEstimatedCost: 82800000,
    priority: 'URGENT',
    status: 'PENDING',
    isCreatorApprovalRequired: true,
    dateNeeded: '2026-10-24',
    createdAt: Date.now() - 4 * 3600 * 1000,
    updatedAt: Date.now() - 4 * 3600 * 1000,
  },
  {
    id: 'ord-002',
    orderNumber: 'WO-2026-092',
    projectId: 'prj-002',
    projectCode: 'PRJ-2026-002',
    shipName: 'MT PACIFIC CHEMIST',
    requesterId: 'EMP-002',
    requesterName: 'BAMBANG SETIAWAN',
    department: 'PIPING',
    items: [
      {
        itemId: 'mat-008',
        itemCode: 'MAT-VLV-001',
        itemName: 'Marine Butterfly Valve Wafer Type JIS 10K 6" Cast Iron',
        qty: 4,
        unit: 'Unit',
        unitPrice: 4200000,
        totalPrice: 16800000,
      },
      {
        itemId: 'mat-007',
        itemCode: 'MAT-PIP-001',
        itemName: 'Pipa Seamless ASTM A106 Gr. B 4" Sch 40 (6m)',
        qty: 8,
        unit: 'Btg (6m)',
        unitPrice: 2100000,
        totalPrice: 16800000,
      },
    ],
    totalEstimatedCost: 33600000,
    priority: 'NORMAL',
    status: 'PENDING',
    isCreatorApprovalRequired: false,
    dateNeeded: '2026-10-26',
    createdAt: Date.now() - 8 * 3600 * 1000,
    updatedAt: Date.now() - 8 * 3600 * 1000,
  },
  {
    id: 'ord-003',
    orderNumber: 'WO-2026-093',
    projectId: 'prj-003',
    projectCode: 'PRJ-2026-003',
    shipName: 'TB SAMUDERA PERKASA VIII',
    requesterId: 'EMP-006',
    requesterName: 'HENDRA KURNIAWAN',
    department: 'COATING & BLASTING',
    items: [
      {
        itemId: 'mat-005',
        itemCode: 'MAT-PNT-001',
        itemName: 'Cat Primer Jotun Penguard Primer Grey (20L Comp A+B)',
        qty: 12,
        unit: 'Pail (20L)',
        unitPrice: 2850000,
        totalPrice: 34200000,
      },
      {
        itemId: 'mat-006',
        itemCode: 'MAT-PNT-002',
        itemName: 'Cat Antifouling Jotun SeaForce Active Red (20L)',
        qty: 10,
        unit: 'Pail (20L)',
        unitPrice: 3400000,
        totalPrice: 34000000,
      },
    ],
    totalEstimatedCost: 68200000,
    priority: 'URGENT',
    status: 'APPROVED',
    isCreatorApprovalRequired: true,
    approvedBy: 'MUHAMMAD ANDRI (CREATOR)',
    approvedAt: '2026-10-16 11:20',
    dateNeeded: '2026-10-22',
    createdAt: Date.now() - 24 * 3600 * 1000,
    updatedAt: Date.now() - 18 * 3600 * 1000,
  },
  {
    id: 'ord-004',
    orderNumber: 'WO-2026-088',
    projectId: 'prj-001',
    projectCode: 'PRJ-2026-001',
    shipName: 'MV OCEANIC LEADER',
    requesterId: 'EMP-004',
    requesterName: 'AHMAD RIFAI',
    department: 'STEEL WORK',
    items: [
      {
        itemId: 'mat-009',
        itemCode: 'MAT-TLS-001',
        itemName: 'Batu Gerinda Pemotong Resibon 4" (105 x 1.2 x 16mm)',
        qty: 15,
        unit: 'Dus (50 Pcs)',
        unitPrice: 450000,
        totalPrice: 6750000,
      },
    ],
    totalEstimatedCost: 6750000,
    priority: 'NORMAL',
    status: 'RECEIVED',
    isCreatorApprovalRequired: false,
    approvedBy: 'SITI NURHALIZA (STAFF)',
    approvedAt: '2026-10-12 09:10',
    dateNeeded: '2026-10-14',
    createdAt: Date.now() - 72 * 3600 * 1000,
    updatedAt: Date.now() - 48 * 3600 * 1000,
  },
];

// Seed Stock Movements
const DEFAULT_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov-001',
    movementType: 'IN',
    itemId: 'mat-001',
    itemCode: 'MAT-STL-001',
    itemName: 'Pelat Baja Marine AH36 (12mm x 5ft x 20ft)',
    qty: 20,
    unit: 'Lbr',
    referenceNumber: 'PO-2026-088',
    operatorName: 'SITI NURHALIZA',
    date: '2026-10-10 14:00',
    notes: 'Penerimaan suplai batch dari Krakatau Posco via Tongkang',
  },
  {
    id: 'mov-002',
    movementType: 'OUT',
    itemId: 'mat-009',
    itemCode: 'MAT-TLS-001',
    itemName: 'Batu Gerinda Pemotong Resibon 4" (105 x 1.2 x 16mm)',
    qty: 15,
    unit: 'Dus (50 Pcs)',
    referenceNumber: 'WO-2026-088',
    projectId: 'prj-001',
    shipName: 'MV OCEANIC LEADER',
    operatorName: 'AHMAD RIFAI',
    date: '2026-10-13 08:30',
    notes: 'Pengeluaran perkakas gerinda untuk tim pemotongan pelat lambung',
  },
];

class WarehouseDatabaseService {
  private inventory: WarehouseItem[] = [];
  private orders: MaterialOrder[] = [];
  private movements: StockMovement[] = [];

  constructor() {
    this.init();
  }

  private init() {
    try {
      const storedInv = localStorage.getItem(STORAGE_KEY_INVENTORY);
      this.inventory = storedInv ? JSON.parse(storedInv) : DEFAULT_INVENTORY;
      if (!storedInv) localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(DEFAULT_INVENTORY));

      const storedOrd = localStorage.getItem(STORAGE_KEY_ORDERS);
      this.orders = storedOrd ? JSON.parse(storedOrd) : DEFAULT_ORDERS;
      if (!storedOrd) localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(DEFAULT_ORDERS));

      const storedMov = localStorage.getItem(STORAGE_KEY_MOVEMENTS);
      this.movements = storedMov ? JSON.parse(storedMov) : DEFAULT_MOVEMENTS;
      if (!storedMov) localStorage.setItem(STORAGE_KEY_MOVEMENTS, JSON.stringify(DEFAULT_MOVEMENTS));
    } catch {
      this.inventory = DEFAULT_INVENTORY;
      this.orders = DEFAULT_ORDERS;
      this.movements = DEFAULT_MOVEMENTS;
    }
  }

  // Inventory CRUD
  public getInventory(): WarehouseItem[] {
    return [...this.inventory];
  }

  public getLowStockItems(): WarehouseItem[] {
    return this.inventory.filter((item) => item.stockQty <= item.minStockQty);
  }

  public getItemById(id: string): WarehouseItem | undefined {
    return this.inventory.find((i) => i.id === id || i.itemCode === id);
  }

  public async saveItem(item: WarehouseItem): Promise<WarehouseItem> {
    const idx = this.inventory.findIndex((i) => i.id === item.id);
    if (idx !== -1) {
      this.inventory[idx] = item;
    } else {
      this.inventory.push(item);
    }
    localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(this.inventory));

    try {
      await setDoc(doc(db, 'warehouse_inventory', item.id), item, { merge: true });
    } catch (err) {
      console.warn('Firestore sync warehouse item error:', err);
    }
    return item;
  }

  public async deleteItem(id: string, operatorRole?: UserRole): Promise<boolean> {
    if (operatorRole !== 'creator' && operatorRole !== 'admin') {
      throw new Error('Akses Ditolak: Hanya Creator atau Administrator yang dapat menghapus item inventaris gudang.');
    }
    const idx = this.inventory.findIndex((i) => i.id === id);
    if (idx !== -1) {
      this.inventory.splice(idx, 1);
      localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(this.inventory));
      try {
        await deleteDoc(doc(db, 'warehouse_inventory', id));
      } catch (err) {
        console.warn('Firestore delete warehouse item error:', err);
      }
      return true;
    }
    return false;
  }

  // Material Orders CRUD
  public getOrders(): MaterialOrder[] {
    return [...this.orders].sort((a, b) => b.createdAt - a.createdAt);
  }

  public getPendingOrders(): MaterialOrder[] {
    return this.orders.filter((o) => o.status === 'PENDING');
  }

  public getOrderById(id: string): MaterialOrder | undefined {
    return this.orders.find((o) => o.id === id || o.orderNumber === id);
  }

  public async createOrder(order: MaterialOrder): Promise<MaterialOrder> {
    const now = Date.now();
    order.createdAt = now;
    order.updatedAt = now;
    order.isCreatorApprovalRequired = order.totalEstimatedCost > 50000000;
    this.orders.unshift(order);
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(this.orders));

    try {
      await setDoc(doc(db, 'material_orders', order.id), order, { merge: true });
    } catch (err) {
      console.warn('Firestore sync order error:', err);
    }
    return order;
  }

  // Multi-tier approval logic
  public async approveOrder(
    orderId: string, 
    operatorName: string, 
    operatorRole?: UserRole
  ): Promise<MaterialOrder> {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order permintaan barang tidak ditemukan.');

    // High budget protection (> Rp 50.000.000)
    if (order.isCreatorApprovalRequired && operatorRole !== 'creator') {
      throw new Error(
        'Akses Ditolak: Permintaan material bernilai di atas Rp 50.000.000 memerlukan otorisasi langsung dari peran CREATOR!'
      );
    }

    order.status = 'APPROVED';
    order.approvedBy = `${operatorName} (${(operatorRole || 'USER').toUpperCase()})`;
    order.approvedAt = new Date().toISOString().replace('T', ' ').slice(0, 16);
    order.updatedAt = Date.now();

    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(this.orders));

    try {
      await setDoc(doc(db, 'material_orders', order.id), order, { merge: true });
    } catch (err) {
      console.warn('Firestore sync approved order error:', err);
    }
    return order;
  }

  public async rejectOrder(
    orderId: string, 
    reason: string, 
    operatorName: string
  ): Promise<MaterialOrder> {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order permintaan barang tidak ditemukan.');

    order.status = 'REJECTED';
    order.rejectionReason = reason;
    order.approvedBy = `Ditolak oleh ${operatorName}`;
    order.updatedAt = Date.now();

    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(this.orders));

    try {
      await setDoc(doc(db, 'material_orders', order.id), order, { merge: true });
    } catch (err) {
      console.warn('Firestore sync reject order error:', err);
    }
    return order;
  }

  // Update order status (e.g. IN_PROCUREMENT -> RECEIVED)
  public async fulfillOrder(orderId: string, operatorName: string): Promise<MaterialOrder> {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) throw new Error('Order tidak ditemukan.');

    order.status = 'RECEIVED';
    order.updatedAt = Date.now();

    // Auto record stock out for project
    for (const item of order.items) {
      const invItem = this.inventory.find((i) => i.id === item.itemId || i.itemCode === item.itemCode);
      if (invItem) {
        invItem.stockQty = Math.max(0, invItem.stockQty - item.qty);
      }
      this.movements.unshift({
        id: `mov-${Date.now()}-${item.itemId}`,
        movementType: 'OUT',
        itemId: item.itemId,
        itemCode: item.itemCode,
        itemName: item.itemName,
        qty: item.qty,
        unit: item.unit,
        referenceNumber: order.orderNumber,
        projectId: order.projectId,
        shipName: order.shipName,
        operatorName,
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        notes: `Pengeluaran material otomatis untuk kapal ${order.shipName}`,
      });
    }

    localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(this.inventory));
    localStorage.setItem(STORAGE_KEY_ORDERS, JSON.stringify(this.orders));
    localStorage.setItem(STORAGE_KEY_MOVEMENTS, JSON.stringify(this.movements));

    return order;
  }

  // Stock Movements
  public getMovements(): StockMovement[] {
    return [...this.movements];
  }

  public recordStockIn(
    itemId: string, 
    qty: number, 
    referenceNumber: string, 
    operatorName: string, 
    notes: string
  ): WarehouseItem {
    const item = this.inventory.find((i) => i.id === itemId);
    if (!item) throw new Error('Item tidak ditemukan.');

    item.stockQty += qty;
    item.lastRestockedAt = new Date().toISOString().split('T')[0];

    this.movements.unshift({
      id: `mov-${Date.now()}`,
      movementType: 'IN',
      itemId: item.id,
      itemCode: item.itemCode,
      itemName: item.itemName,
      qty,
      unit: item.unit,
      referenceNumber,
      operatorName,
      date: new Date().toISOString().replace('T', ' ').slice(0, 16),
      notes,
    });

    localStorage.setItem(STORAGE_KEY_INVENTORY, JSON.stringify(this.inventory));
    localStorage.setItem(STORAGE_KEY_MOVEMENTS, JSON.stringify(this.movements));

    return item;
  }

  // Export Inventory to Excel
  public async exportInventoryToExcel(): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NEXAPROJECT Shipyard Warehouse';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Daftar Stok Material Gudang');
    sheet.columns = [
      { header: 'KODE ITEM', key: 'itemCode', width: 16 },
      { header: 'NAMA BARANG / MATERIAL', key: 'itemName', width: 32 },
      { header: 'KATEGORI', key: 'category', width: 22 },
      { header: 'SPESIFIKASI TEKNIS', key: 'specification', width: 38 },
      { header: 'SATUAN', key: 'unit', width: 14 },
      { header: 'STOK SAAT INI', key: 'stockQty', width: 16 },
      { header: 'BATAS AMAN (MIN)', key: 'minStockQty', width: 16 },
      { header: 'LOKASI RAK / GUDANG', key: 'rackLocation', width: 26 },
      { header: 'HARGA SATUAN (IDR)', key: 'unitPrice', width: 22 },
      { header: 'STATUS STOK', key: 'status', width: 18 },
      { header: 'TERAKHIR RESTOCK', key: 'lastRestockedAt', width: 18 },
      { header: 'SUPPLIER', key: 'supplier', width: 26 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };

    this.inventory.forEach((item) => {
      sheet.addRow({
        itemCode: item.itemCode,
        itemName: item.itemName,
        category: item.category,
        specification: item.specification,
        unit: item.unit,
        stockQty: item.stockQty,
        minStockQty: item.minStockQty,
        rackLocation: item.rackLocation,
        unitPrice: item.unitPrice,
        status: item.stockQty <= item.minStockQty ? 'STOK RENDAH / WARNING' : 'AMAN',
        lastRestockedAt: item.lastRestockedAt,
        supplier: item.supplier,
      });
    });

    sheet.getColumn('unitPrice').numFmt = '#,##0';
    sheet.getColumn('stockQty').numFmt = '#,##0';
    sheet.getColumn('minStockQty').numFmt = '#,##0';

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }

  // Export Material Orders to Excel
  public async exportOrdersToExcel(): Promise<Blob> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'NEXAPROJECT Shipyard Logistics';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Daftar Permintaan Material');
    sheet.columns = [
      { header: 'NO PERMINTAAN', key: 'orderNumber', width: 18 },
      { header: 'KODE PROYEK', key: 'projectCode', width: 16 },
      { header: 'NAMA KAPAL', key: 'shipName', width: 26 },
      { header: 'PEMOHON', key: 'requesterName', width: 22 },
      { header: 'DEPARTEMEN', key: 'department', width: 18 },
      { header: 'ESTIMASI TOTAL BIAYA (IDR)', key: 'totalEstimatedCost', width: 26 },
      { header: 'PRIORITAS', key: 'priority', width: 14 },
      { header: 'STATUS', key: 'status', width: 18 },
      { header: 'PERSETUJUAN CREATOR', key: 'creatorApproval', width: 22 },
      { header: 'DISETUJUI OLEH', key: 'approvedBy', width: 26 },
      { header: 'TANGGAL DIBUTUHKAN', key: 'dateNeeded', width: 20 },
    ];

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };

    this.orders.forEach((o) => {
      sheet.addRow({
        orderNumber: o.orderNumber,
        projectCode: o.projectCode,
        shipName: o.shipName,
        requesterName: o.requesterName,
        department: o.department,
        totalEstimatedCost: o.totalEstimatedCost,
        priority: o.priority,
        status: o.status,
        creatorApproval: o.isCreatorApprovalRequired ? 'WAJIB (> 50 Jt)' : 'STANDAR',
        approvedBy: o.approvedBy || '-',
        dateNeeded: o.dateNeeded,
      });
    });

    sheet.getColumn('totalEstimatedCost').numFmt = '#,##0';

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  }
}

export const warehouseDb = new WarehouseDatabaseService();
