import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  writeBatch, 
  deleteDoc,
  WriteBatch
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { employeeDb } from './employeeDb';
import { projectDb } from './projectDb';
import { warehouseDb } from './warehouseDb';
import { financeDb } from './financeDb';
import { attendanceDb } from './attendanceDb';
import { taskAnnouncementDb } from './taskAnnouncementDb';
import { dbService } from './db';
import { permissionsDb } from './permissionsDb';
import { UserRole } from '../types/auth';

/**
 * Result of a cascade deletion operation
 */
export interface CascadeDeleteResult {
  success: boolean;
  itemType: string;
  itemId: string;
  deletedPrimary: string;
  deletedRelationsCount: number;
  details: string[];
  error?: string;
}

/**
 * Safely commit a Firestore batch with auto-chunking (max 450 ops per batch to stay well below 500 limit)
 */
async function commitBatchOperations(operations: Array<(batch: WriteBatch) => void>): Promise<number> {
  const CHUNK_SIZE = 450;
  let totalCommitted = 0;

  for (let i = 0; i < operations.length; i += CHUNK_SIZE) {
    const chunk = operations.slice(i, i + CHUNK_SIZE);
    const batch = writeBatch(db);
    for (const op of chunk) {
      op(batch);
    }
    await batch.commit();
    totalCommitted += chunk.length;
  }

  return totalCommitted;
}

export class CascadeDeleteService {
  /**
   * Helper to verify if user has Creator authority
   */
  public isCreator(role?: UserRole | string, email?: string): boolean {
    if (role === 'creator') return true;
    if (email) {
      const em = email.toLowerCase().trim();
      return (
        em === 'muhammad.andri0605@gmail.com' ||
        em === 'ronalpaman@gmail.com' ||
        em === 'creator@nexaproject.com'
      );
    }
    return false;
  }

  // ==============================================================
  // 1. CASCADE DELETE: EMPLOYEE (Pegawai & Dokumen Terkait)
  // ==============================================================
  public async deleteEmployeeCascade(
    employeeIdOrDocId: string,
    operatorRole: UserRole,
    operatorEmail?: string
  ): Promise<CascadeDeleteResult> {
    if (!this.isCreator(operatorRole, operatorEmail)) {
      throw new Error('Akses Ditolak: Penghapusan universal dan cascade hanya diizinkan untuk peran Creator.');
    }

    const employee = employeeDb.getEmployeeByCode(employeeIdOrDocId) || 
      employeeDb.getEmployees('id').find(e => e.id === employeeIdOrDocId);

    const empCode = employee?.employeeId || employeeIdOrDocId;
    const docId = employee?.id || employeeIdOrDocId;
    const empEmail = (employee?.email || '').toLowerCase().trim();
    const empName = employee?.fullName || empCode;

    const details: string[] = [];
    const batchOps: Array<(batch: WriteBatch) => void> = [];

    try {
      // 1. Primary: employees/{docId}
      batchOps.push((batch) => batch.delete(doc(db, 'employees', docId)));
      details.push(`Dokumen Master Pegawai (${docId})`);

      // 2. Cascade Users collection: users where employeeId == empCode OR email == empEmail OR doc.id == docId
      try {
        const usersSnap = await getDocs(query(collection(db, 'users'), where('employeeId', '==', empCode)));
        usersSnap.forEach((uDoc) => {
          batchOps.push((batch) => batch.delete(uDoc.ref));
          details.push(`Akun Pengguna (${uDoc.id})`);
        });

        if (empEmail) {
          const emailUsersSnap = await getDocs(query(collection(db, 'users'), where('email', '==', empEmail)));
          emailUsersSnap.forEach((uDoc) => {
            batchOps.push((batch) => batch.delete(uDoc.ref));
            details.push(`Akun Pengguna Email (${uDoc.id})`);
          });
        }
      } catch (e) {
        console.warn('Cascade user lookup warning:', e);
      }

      // 3. Cascade User Permissions: user_permissions/{docId} or by userId
      try {
        batchOps.push((batch) => batch.delete(doc(db, 'user_permissions', docId)));
        details.push(`Hak Akses Matriks Pegawai`);
      } catch (e) {
        console.warn('Cascade permission warning:', e);
      }

      // 4. Cascade Attendance Records: attendance where employeeId == empCode
      try {
        const attSnap = await getDocs(query(collection(db, 'attendance'), where('employeeId', '==', empCode)));
        attSnap.forEach((aDoc) => {
          batchOps.push((batch) => batch.delete(aDoc.ref));
        });
        if (!attSnap.empty) {
          details.push(`${attSnap.size} Rekam Kehadiran Harian`);
        }
      } catch (e) {
        console.warn('Cascade attendance lookup warning:', e);
      }

      // 5. Cascade Form Timesheet: form_timesheets where employeeId == empCode
      try {
        const tsSnap = await getDocs(query(collection(db, 'form_timesheets'), where('employeeId', '==', empCode)));
        tsSnap.forEach((tDoc) => {
          batchOps.push((batch) => batch.delete(tDoc.ref));
        });
        if (!tsSnap.empty) {
          details.push(`${tsSnap.size} Lembar Form Time Sheet`);
        }
      } catch (e) {
        console.warn('Cascade timesheet lookup warning:', e);
      }

      // 6. Cascade Form Overtime: form_overtime where employeeId == empCode
      try {
        const otSnap = await getDocs(query(collection(db, 'form_overtime'), where('employeeId', '==', empCode)));
        otSnap.forEach((oDoc) => {
          batchOps.push((batch) => batch.delete(oDoc.ref));
        });
        if (!otSnap.empty) {
          details.push(`${otSnap.size} Lembar Form Lembur`);
        }
      } catch (e) {
        console.warn('Cascade overtime lookup warning:', e);
      }

      // 7. Cascade Form Night Shift: form_nightshift where employeeId == empCode
      try {
        const nsSnap = await getDocs(query(collection(db, 'form_nightshift'), where('employeeId', '==', empCode)));
        nsSnap.forEach((nDoc) => {
          batchOps.push((batch) => batch.delete(nDoc.ref));
        });
        if (!nsSnap.empty) {
          details.push(`${nsSnap.size} Lembar Form Night Shift`);
        }
      } catch (e) {
        console.warn('Cascade night shift lookup warning:', e);
      }

      // 8. Cascade Overtime Claims: overtime_claims where employeeId == empCode
      try {
        const claimSnap = await getDocs(query(collection(db, 'overtime_claims'), where('employeeId', '==', empCode)));
        claimSnap.forEach((cDoc) => {
          batchOps.push((batch) => batch.delete(cDoc.ref));
        });
        if (!claimSnap.empty) {
          details.push(`${claimSnap.size} Pengajuan Klaim Lembur`);
        }
      } catch (e) {
        console.warn('Cascade claim lookup warning:', e);
      }

      // 9. Cascade Time Calc Sheets: time_calc_sheets where employeeId == empCode
      try {
        const sheetSnap = await getDocs(query(collection(db, 'time_calc_sheets'), where('employeeId', '==', empCode)));
        sheetSnap.forEach((sDoc) => {
          batchOps.push((batch) => batch.delete(sDoc.ref));
        });
        if (!sheetSnap.empty) {
          details.push(`${sheetSnap.size} Lembar Kalkulasi Waktu Bulanan`);
        }
      } catch (e) {
        console.warn('Cascade time calc lookup warning:', e);
      }

      // Execute all batch deletions atomically in Firestore
      const totalDeletedInFirestore = await commitBatchOperations(batchOps);

      // Clean in-memory and local cache stores
      await employeeDb.deleteEmployee(docId, 'creator');
      
      // Clean attendance in-memory items
      const allTs = attendanceDb.getFormTimesheets().filter(t => t.employeeId !== empCode);
      const allOt = attendanceDb.getFormOvertimes().filter(o => o.employeeId !== empCode);
      const allNs = attendanceDb.getFormNightShifts().filter(n => n.employeeId !== empCode);
      try {
        localStorage.setItem('nexaproject_form_timesheet_v2', JSON.stringify(allTs));
        localStorage.setItem('nexaproject_form_overtime_v2', JSON.stringify(allOt));
        localStorage.setItem('nexaproject_form_nightshift_v2', JSON.stringify(allNs));
      } catch {}

      // Clean user accounts in local dbService
      const userMatch = dbService.getUsers().find(u => u.employeeId === empCode || u.id === docId || (empEmail && u.email.toLowerCase() === empEmail));
      if (userMatch) {
        dbService.deleteUser(userMatch.id, 'creator');
      }

      // Audit Log
      dbService.addAuditLog({
        id: `aud-casc-${Date.now()}`,
        timestamp: Date.now(),
        userId: docId,
        username: empName,
        role: 'creator',
        action: 'CASCADE_DELETE_EMPLOYEE',
        module: 'Manajemen Pegawai',
        details: `PENGHAPUSAN UNIVERSAL CREATOR: Data pegawai ${empName} (${empCode}) beserta seluruh turunan (${totalDeletedInFirestore} dokumen) telah dibersihkan secara permanen dari Firestore.`,
        status: 'danger',
      });

      return {
        success: true,
        itemType: 'Pegawai',
        itemId: empCode,
        deletedPrimary: docId,
        deletedRelationsCount: totalDeletedInFirestore - 1,
        details,
      };
    } catch (error) {
      console.error('Error during employee cascade deletion:', error);
      handleFirestoreError(error, OperationType.DELETE, `employees/${docId}`);
      return {
        success: false,
        itemType: 'Pegawai',
        itemId: empCode,
        deletedPrimary: docId,
        deletedRelationsCount: 0,
        details,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==============================================================
  // 2. CASCADE DELETE: PROJECT (Proyek Kapal & Dokumen Terkait)
  // ==============================================================
  public async deleteProjectCascade(
    projectIdOrCode: string,
    operatorRole: UserRole,
    operatorEmail?: string
  ): Promise<CascadeDeleteResult> {
    if (!this.isCreator(operatorRole, operatorEmail)) {
      throw new Error('Akses Ditolak: Penghapusan universal dan cascade hanya diizinkan untuk peran Creator.');
    }

    const project = projectDb.getProjects().find(p => p.id === projectIdOrCode || p.projectCode === projectIdOrCode);
    const projId = project?.id || projectIdOrCode;
    const projCode = project?.projectCode || projectIdOrCode;
    const shipName = project?.shipName || projCode;

    const details: string[] = [];
    const batchOps: Array<(batch: WriteBatch) => void> = [];

    try {
      // 1. Primary: projects/{projId}
      batchOps.push((batch) => batch.delete(doc(db, 'projects', projId)));
      details.push(`Dokumen Master Proyek (${projCode})`);

      // 2. Cascade Contracts: contracts where projectId == projId or projectCode == projCode
      try {
        const c1Snap = await getDocs(query(collection(db, 'contracts'), where('projectId', '==', projId)));
        c1Snap.forEach(cDoc => batchOps.push(b => b.delete(cDoc.ref)));
        if (!c1Snap.empty) details.push(`${c1Snap.size} Kontrak Komersial Proyek`);
      } catch (e) {
        console.warn('Contracts cascade query warning:', e);
      }

      // 3. Cascade Material Orders: material_orders where projectId == projId or shipName == shipName
      try {
        const m1Snap = await getDocs(query(collection(db, 'material_orders'), where('projectId', '==', projId)));
        m1Snap.forEach(mDoc => batchOps.push(b => b.delete(mDoc.ref)));
        if (!m1Snap.empty) details.push(`${m1Snap.size} Pengajuan Material Order`);
      } catch (e) {
        console.warn('Material orders cascade query warning:', e);
      }

      // 4. Cascade Field Tasks: field_tasks where projectId == projId or projectCode == projCode
      try {
        const t1Snap = await getDocs(query(collection(db, 'field_tasks'), where('projectId', '==', projId)));
        t1Snap.forEach(tDoc => batchOps.push(b => b.delete(tDoc.ref)));
        if (!t1Snap.empty) details.push(`${t1Snap.size} Tugas Lapangan`);
      } catch (e) {
        console.warn('Field tasks cascade query warning:', e);
      }

      // 5. Cascade Project Costs: project_costs where projectId == projId
      try {
        const costSnap = await getDocs(query(collection(db, 'project_costs'), where('projectId', '==', projId)));
        costSnap.forEach(costDoc => batchOps.push(b => b.delete(costDoc.ref)));
        if (!costSnap.empty) details.push(`${costSnap.size} Catatan Biaya & Margin Proyek`);
      } catch (e) {
        console.warn('Project costs cascade query warning:', e);
      }

      // Commit batch
      const totalDeletedInFirestore = await commitBatchOperations(batchOps);

      // Clean in-memory and local cache
      await projectDb.deleteProject(projId);

      // Audit Log
      dbService.addAuditLog({
        id: `aud-casc-${Date.now()}`,
        timestamp: Date.now(),
        userId: projId,
        username: shipName,
        role: 'creator',
        action: 'CASCADE_DELETE_PROJECT',
        module: 'Daftar Proyek',
        details: `PENGHAPUSAN UNIVERSAL CREATOR: Proyek kapal ${shipName} (${projCode}) beserta kontrak, material order, dan biaya terkait (${totalDeletedInFirestore} dokumen) telah dibersihkan secara permanen.`,
        status: 'danger',
      });

      return {
        success: true,
        itemType: 'Proyek Kapal',
        itemId: projCode,
        deletedPrimary: projId,
        deletedRelationsCount: totalDeletedInFirestore - 1,
        details,
      };
    } catch (error) {
      console.error('Error during project cascade deletion:', error);
      handleFirestoreError(error, OperationType.DELETE, `projects/${projId}`);
      return {
        success: false,
        itemType: 'Proyek Kapal',
        itemId: projCode,
        deletedPrimary: projId,
        deletedRelationsCount: 0,
        details,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==============================================================
  // 3. CASCADE DELETE: WAREHOUSE ITEM (Barang Gudang & Stok)
  // ==============================================================
  public async deleteWarehouseItemCascade(
    itemIdOrCode: string,
    operatorRole: UserRole,
    operatorEmail?: string
  ): Promise<CascadeDeleteResult> {
    if (!this.isCreator(operatorRole, operatorEmail)) {
      throw new Error('Akses Ditolak: Penghapusan universal dan cascade hanya diizinkan untuk peran Creator.');
    }

    const item = warehouseDb.getItemById(itemIdOrCode) || 
      warehouseDb.getInventory().find(i => i.itemCode === itemIdOrCode);
    
    const itemId = item?.id || itemIdOrCode;
    const itemCode = item?.itemCode || itemIdOrCode;
    const itemName = item?.itemName || itemCode;

    const details: string[] = [];
    const batchOps: Array<(batch: WriteBatch) => void> = [];

    try {
      // 1. Primary: warehouse_inventory/{itemId}
      batchOps.push((batch) => batch.delete(doc(db, 'warehouse_inventory', itemId)));
      details.push(`Item Gudang: ${itemName} (${itemCode})`);

      // 2. Cascade Stock Movements
      try {
        const smSnap = await getDocs(query(collection(db, 'stock_movements'), where('itemId', '==', itemId)));
        smSnap.forEach(sDoc => batchOps.push(b => b.delete(sDoc.ref)));
        if (!smSnap.empty) details.push(`${smSnap.size} Catatan Mutasi Keluar/Masuk Stok`);
      } catch (e) {
        console.warn('Stock movement query warning:', e);
      }

      const totalDeletedInFirestore = await commitBatchOperations(batchOps);

      // Clean in-memory
      await warehouseDb.deleteItem(itemId, 'creator');

      dbService.addAuditLog({
        id: `aud-casc-${Date.now()}`,
        timestamp: Date.now(),
        userId: itemId,
        username: itemName,
        role: 'creator',
        action: 'CASCADE_DELETE_WAREHOUSE_ITEM',
        module: 'Gudang & Inventaris',
        details: `PENGHAPUSAN UNIVERSAL CREATOR: Item gudang ${itemName} (${itemCode}) dan mutasi stok terkait (${totalDeletedInFirestore} dokumen) telah dibersihkan secara permanen.`,
        status: 'danger',
      });

      return {
        success: true,
        itemType: 'Item Gudang',
        itemId: itemCode,
        deletedPrimary: itemId,
        deletedRelationsCount: totalDeletedInFirestore - 1,
        details,
      };
    } catch (error) {
      console.error('Error during warehouse item cascade deletion:', error);
      handleFirestoreError(error, OperationType.DELETE, `warehouse_inventory/${itemId}`);
      return {
        success: false,
        itemType: 'Item Gudang',
        itemId: itemCode,
        deletedPrimary: itemId,
        deletedRelationsCount: 0,
        details,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==============================================================
  // 4. CASCADE DELETE: MATERIAL ORDER (Pengajuan Material)
  // ==============================================================
  public async deleteMaterialOrderCascade(
    orderIdOrNumber: string,
    operatorRole: UserRole,
    operatorEmail?: string
  ): Promise<CascadeDeleteResult> {
    if (!this.isCreator(operatorRole, operatorEmail)) {
      throw new Error('Akses Ditolak: Penghapusan universal dan cascade hanya diizinkan untuk peran Creator.');
    }

    const order = warehouseDb.getOrderById(orderIdOrNumber) || 
      warehouseDb.getOrders().find(o => o.orderNumber === orderIdOrNumber);

    const orderId = order?.id || orderIdOrNumber;
    const orderNum = order?.orderNumber || orderIdOrNumber;

    const details: string[] = [];
    const batchOps: Array<(batch: WriteBatch) => void> = [];

    try {
      // 1. Primary: material_orders/{orderId}
      batchOps.push((batch) => batch.delete(doc(db, 'material_orders', orderId)));
      details.push(`Dokumen Order Material (${orderNum})`);

      // 2. Cascade stock movements linked to order
      try {
        const smSnap = await getDocs(query(collection(db, 'stock_movements'), where('referenceNumber', '==', orderNum)));
        smSnap.forEach(sDoc => batchOps.push(b => b.delete(sDoc.ref)));
        if (!smSnap.empty) details.push(`${smSnap.size} Log Pengeluaran Stok Material`);
      } catch (e) {
        console.warn('Stock movement linked query warning:', e);
      }

      const totalDeletedInFirestore = await commitBatchOperations(batchOps);

      // Clean in-memory
      const allOrders = warehouseDb.getOrders().filter(o => o.id !== orderId && o.orderNumber !== orderNum);
      try {
        localStorage.setItem('nexaproject_orders_v1', JSON.stringify(allOrders));
      } catch {}

      dbService.addAuditLog({
        id: `aud-casc-${Date.now()}`,
        timestamp: Date.now(),
        userId: orderId,
        username: orderNum,
        role: 'creator',
        action: 'CASCADE_DELETE_MATERIAL_ORDER',
        module: 'Permintaan Material',
        details: `PENGHAPUSAN UNIVERSAL CREATOR: Permintaan order material ${orderNum} beserta catatan mutasi (${totalDeletedInFirestore} dokumen) telah dibersihkan secara permanen.`,
        status: 'danger',
      });

      return {
        success: true,
        itemType: 'Order Material',
        itemId: orderNum,
        deletedPrimary: orderId,
        deletedRelationsCount: totalDeletedInFirestore - 1,
        details,
      };
    } catch (error) {
      console.error('Error during material order cascade deletion:', error);
      handleFirestoreError(error, OperationType.DELETE, `material_orders/${orderId}`);
      return {
        success: false,
        itemType: 'Order Material',
        itemId: orderNum,
        deletedPrimary: orderId,
        deletedRelationsCount: 0,
        details,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==============================================================
  // 5. CASCADE DELETE: OPERATIONAL EXPENSE (Voucher / Biaya Operasional)
  // ==============================================================
  public async deleteOperationalExpenseCascade(
    expenseIdOrVoucher: string,
    operatorRole: UserRole,
    operatorEmail?: string
  ): Promise<CascadeDeleteResult> {
    if (!this.isCreator(operatorRole, operatorEmail)) {
      throw new Error('Akses Ditolak: Penghapusan universal dan cascade hanya diizinkan untuk peran Creator.');
    }

    const expense = financeDb.getExpenses().find(e => e.id === expenseIdOrVoucher || e.voucherNumber === expenseIdOrVoucher);
    const expenseId = expense?.id || expenseIdOrVoucher;
    const voucherNum = expense?.voucherNumber || expenseIdOrVoucher;
    const desc = expense?.description || voucherNum;

    const details: string[] = [];
    const batchOps: Array<(batch: WriteBatch) => void> = [];

    try {
      // 1. Primary: financial_expenses/{expenseId}
      batchOps.push((batch) => batch.delete(doc(db, 'financial_expenses', expenseId)));
      details.push(`Voucher Biaya: ${voucherNum} - ${desc.slice(0, 40)}`);

      const totalDeletedInFirestore = await commitBatchOperations(batchOps);

      // Clean in-memory
      const allExpenses = financeDb.getExpenses().filter(e => e.id !== expenseId && e.voucherNumber !== voucherNum);
      try {
        localStorage.setItem('nexaproject_finance_expenses_v1', JSON.stringify(allExpenses));
      } catch {}

      dbService.addAuditLog({
        id: `aud-casc-${Date.now()}`,
        timestamp: Date.now(),
        userId: expenseId,
        username: voucherNum,
        role: 'creator',
        action: 'CASCADE_DELETE_EXPENSE',
        module: 'Keuangan & Biaya Operasional',
        details: `PENGHAPUSAN UNIVERSAL CREATOR: Pengajuan voucher biaya ${voucherNum} telah dihapus secara permanen dari sistem dan Firestore.`,
        status: 'danger',
      });

      return {
        success: true,
        itemType: 'Voucher Biaya Operasional',
        itemId: voucherNum,
        deletedPrimary: expenseId,
        deletedRelationsCount: totalDeletedInFirestore - 1,
        details,
      };
    } catch (error) {
      console.error('Error during operational expense cascade deletion:', error);
      handleFirestoreError(error, OperationType.DELETE, `financial_expenses/${expenseId}`);
      return {
        success: false,
        itemType: 'Voucher Biaya Operasional',
        itemId: voucherNum,
        deletedPrimary: expenseId,
        deletedRelationsCount: 0,
        details,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==============================================================
  // 6. CASCADE DELETE: CONTRACT (Kontrak Komersial Galangan)
  // ==============================================================
  public async deleteContractCascade(
    contractIdOrNumber: string,
    operatorRole: UserRole,
    operatorEmail?: string
  ): Promise<CascadeDeleteResult> {
    if (!this.isCreator(operatorRole, operatorEmail)) {
      throw new Error('Akses Ditolak: Penghapusan universal dan cascade hanya diizinkan untuk peran Creator.');
    }

    const contract = financeDb.getContractById(contractIdOrNumber) || 
      financeDb.getContracts().find(c => c.contractNumber === contractIdOrNumber);

    const contractId = contract?.id || contractIdOrNumber;
    const contractNum = contract?.contractNumber || contractIdOrNumber;
    const clientName = contract?.clientName || contractNum;

    const details: string[] = [];
    const batchOps: Array<(batch: WriteBatch) => void> = [];

    try {
      // 1. Primary: contracts/{contractId}
      batchOps.push((batch) => batch.delete(doc(db, 'contracts', contractId)));
      details.push(`Dokumen Kontrak ${contractNum} (${clientName})`);

      const totalDeletedInFirestore = await commitBatchOperations(batchOps);

      // Clean in-memory
      financeDb.deleteContract(contractId, 'creator', operatorEmail || 'creator@nexaproject.com');

      dbService.addAuditLog({
        id: `aud-casc-${Date.now()}`,
        timestamp: Date.now(),
        userId: contractId,
        username: contractNum,
        role: 'creator',
        action: 'CASCADE_DELETE_CONTRACT',
        module: 'Kontrak Galangan',
        details: `PENGHAPUSAN UNIVERSAL CREATOR: Dokumen kontrak galangan ${contractNum} (${clientName}) telah dihapus permanen dari Firestore.`,
        status: 'danger',
      });

      return {
        success: true,
        itemType: 'Kontrak Galangan',
        itemId: contractNum,
        deletedPrimary: contractId,
        deletedRelationsCount: totalDeletedInFirestore - 1,
        details,
      };
    } catch (error) {
      console.error('Error during contract cascade deletion:', error);
      handleFirestoreError(error, OperationType.DELETE, `contracts/${contractId}`);
      return {
        success: false,
        itemType: 'Kontrak Galangan',
        itemId: contractNum,
        deletedPrimary: contractId,
        deletedRelationsCount: 0,
        details,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==============================================================
  // 7. CASCADE DELETE: ATTENDANCE & TIMESHEET ENTRIES
  // ==============================================================
  public async deleteAttendanceEntryCascade(
    entryId: string,
    type: 'timesheet' | 'overtime' | 'nightshift' | 'daily' | 'timecalc',
    operatorRole: UserRole,
    operatorEmail?: string
  ): Promise<CascadeDeleteResult> {
    if (!this.isCreator(operatorRole, operatorEmail)) {
      throw new Error('Akses Ditolak: Penghapusan universal dan cascade hanya diizinkan untuk peran Creator.');
    }

    const details: string[] = [];
    const batchOps: Array<(batch: WriteBatch) => void> = [];
    let collectionName = 'attendance';
    let label = 'Presensi';

    if (type === 'timesheet') {
      collectionName = 'form_timesheets';
      label = 'Form Time Sheet';
    } else if (type === 'overtime') {
      collectionName = 'form_overtime';
      label = 'Form Lembur';
    } else if (type === 'nightshift') {
      collectionName = 'form_nightshift';
      label = 'Form Night Shift';
    } else if (type === 'timecalc') {
      collectionName = 'time_calc_sheets';
      label = 'Lembar Kalkulasi Waktu';
    }

    try {
      batchOps.push((batch) => batch.delete(doc(db, collectionName, entryId)));
      details.push(`Dokumen ${label} (${entryId})`);

      const totalDeletedInFirestore = await commitBatchOperations(batchOps);

      // Clean in-memory
      if (type === 'timesheet') attendanceDb.deleteFormTimesheet(entryId);
      else if (type === 'overtime') attendanceDb.deleteFormOvertime(entryId);
      else if (type === 'nightshift') attendanceDb.deleteFormNightShift(entryId);

      dbService.addAuditLog({
        id: `aud-casc-${Date.now()}`,
        timestamp: Date.now(),
        userId: entryId,
        username: label,
        role: 'creator',
        action: `DELETE_${type.toUpperCase()}`,
        module: 'Presensi & Waktu Kerja',
        details: `PENGHAPUSAN UNIVERSAL CREATOR: Dokumen ${label} #${entryId} telah dihapus permanen.`,
        status: 'danger',
      });

      return {
        success: true,
        itemType: label,
        itemId: entryId,
        deletedPrimary: entryId,
        deletedRelationsCount: totalDeletedInFirestore - 1,
        details,
      };
    } catch (error) {
      console.error(`Error during ${type} cascade deletion:`, error);
      handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${entryId}`);
      return {
        success: false,
        itemType: label,
        itemId: entryId,
        deletedPrimary: entryId,
        deletedRelationsCount: 0,
        details,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==============================================================
  // 8. CASCADE DELETE: FIELD TASK (Tugas Lapangan)
  // ==============================================================
  public async deleteFieldTaskCascade(
    taskIdOrCode: string,
    operatorRole: UserRole,
    operatorEmail?: string
  ): Promise<CascadeDeleteResult> {
    if (!this.isCreator(operatorRole, operatorEmail)) {
      throw new Error('Akses Ditolak: Penghapusan universal dan cascade hanya diizinkan untuk peran Creator.');
    }

    const task = taskAnnouncementDb.getTasks().find(t => t.id === taskIdOrCode || t.taskCode === taskIdOrCode);
    const taskId = task?.id || taskIdOrCode;
    const taskCode = task?.taskCode || taskIdOrCode;
    const title = task?.title || taskCode;

    const details: string[] = [];
    const batchOps: Array<(batch: WriteBatch) => void> = [];

    try {
      batchOps.push((batch) => batch.delete(doc(db, 'field_tasks', taskId)));
      details.push(`Tugas Lapangan: ${taskCode} - ${title}`);

      const totalDeletedInFirestore = await commitBatchOperations(batchOps);

      // Clean in-memory
      taskAnnouncementDb.deleteTask(taskId, 'creator', operatorEmail || 'creator@nexaproject.com');

      dbService.addAuditLog({
        id: `aud-casc-${Date.now()}`,
        timestamp: Date.now(),
        userId: taskId,
        username: taskCode,
        role: 'creator',
        action: 'CASCADE_DELETE_FIELD_TASK',
        module: 'Tugas Lapangan',
        details: `PENGHAPUSAN UNIVERSAL CREATOR: Tugas lapangan ${taskCode} (${title}) telah dihapus permanen.`,
        status: 'danger',
      });

      return {
        success: true,
        itemType: 'Tugas Lapangan',
        itemId: taskCode,
        deletedPrimary: taskId,
        deletedRelationsCount: totalDeletedInFirestore - 1,
        details,
      };
    } catch (error) {
      console.error('Error during field task cascade deletion:', error);
      handleFirestoreError(error, OperationType.DELETE, `field_tasks/${taskId}`);
      return {
        success: false,
        itemType: 'Tugas Lapangan',
        itemId: taskCode,
        deletedPrimary: taskId,
        deletedRelationsCount: 0,
        details,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==============================================================
  // 9. CASCADE DELETE: ANNOUNCEMENT (Pengumuman / Bulletin K3)
  // ==============================================================
  public async deleteAnnouncementCascade(
    annId: string,
    operatorRole: UserRole,
    operatorEmail?: string
  ): Promise<CascadeDeleteResult> {
    if (!this.isCreator(operatorRole, operatorEmail)) {
      throw new Error('Akses Ditolak: Penghapusan universal dan cascade hanya diizinkan untuk peran Creator.');
    }

    const ann = taskAnnouncementDb.getAnnouncements().find(a => a.id === annId);
    const title = ann?.title || annId;

    const details: string[] = [];
    const batchOps: Array<(batch: WriteBatch) => void> = [];

    try {
      batchOps.push((batch) => batch.delete(doc(db, 'announcements', annId)));
      details.push(`Pengumuman: ${title}`);

      const totalDeletedInFirestore = await commitBatchOperations(batchOps);

      // Clean in-memory
      taskAnnouncementDb.deleteAnnouncement(annId, 'creator', operatorEmail || 'creator@nexaproject.com');

      dbService.addAuditLog({
        id: `aud-casc-${Date.now()}`,
        timestamp: Date.now(),
        userId: annId,
        username: title,
        role: 'creator',
        action: 'CASCADE_DELETE_ANNOUNCEMENT',
        module: 'Papan Pengumuman',
        details: `PENGHAPUSAN UNIVERSAL CREATOR: Pengumuman "${title}" telah dihapus permanen.`,
        status: 'danger',
      });

      return {
        success: true,
        itemType: 'Pengumuman',
        itemId: annId,
        deletedPrimary: annId,
        deletedRelationsCount: totalDeletedInFirestore - 1,
        details,
      };
    } catch (error) {
      console.error('Error during announcement cascade deletion:', error);
      handleFirestoreError(error, OperationType.DELETE, `announcements/${annId}`);
      return {
        success: false,
        itemType: 'Pengumuman',
        itemId: annId,
        deletedPrimary: annId,
        deletedRelationsCount: 0,
        details,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==============================================================
  // 10. CASCADE DELETE: WAITLIST APPLICANT & USER ACCOUNT
  // ==============================================================
  public async deleteWaitlistApplicantCascade(
    applicantId: string,
    operatorRole: UserRole,
    operatorEmail?: string
  ): Promise<CascadeDeleteResult> {
    if (!this.isCreator(operatorRole, operatorEmail)) {
      throw new Error('Akses Ditolak: Penghapusan universal dan cascade hanya diizinkan untuk peran Creator.');
    }

    const applicant = dbService.findWaitlistById(applicantId);
    const name = applicant?.fullName || applicantId;

    const details: string[] = [];
    const batchOps: Array<(batch: WriteBatch) => void> = [];

    try {
      batchOps.push((batch) => batch.delete(doc(db, 'registration_waitlist', applicantId)));
      details.push(`Antrean Pendaftaran: ${name}`);

      const totalDeletedInFirestore = await commitBatchOperations(batchOps);

      // Clean in-memory
      const allWaitlist = dbService.getWaitlist().filter(w => w.id !== applicantId);
      try {
        localStorage.setItem('nexaproject_waitlist_v1', JSON.stringify(allWaitlist));
      } catch {}

      dbService.addAuditLog({
        id: `aud-casc-${Date.now()}`,
        timestamp: Date.now(),
        userId: applicantId,
        username: name,
        role: 'creator',
        action: 'CASCADE_DELETE_WAITLIST',
        module: 'Antrean Registrasi',
        details: `PENGHAPUSAN UNIVERSAL CREATOR: Antrean pendaftaran calon user ${name} telah dihapus permanen.`,
        status: 'danger',
      });

      return {
        success: true,
        itemType: 'Antrean Registrasi',
        itemId: applicantId,
        deletedPrimary: applicantId,
        deletedRelationsCount: totalDeletedInFirestore - 1,
        details,
      };
    } catch (error) {
      console.error('Error during waitlist cascade deletion:', error);
      handleFirestoreError(error, OperationType.DELETE, `registration_waitlist/${applicantId}`);
      return {
        success: false,
        itemType: 'Antrean Registrasi',
        itemId: applicantId,
        deletedPrimary: applicantId,
        deletedRelationsCount: 0,
        details,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==============================================================
  // 11. CASCADE DELETE: USER PERMISSION / ACCOUNT OVERRIDE
  // ==============================================================
  public async deleteUserAccountCascade(
    userId: string,
    operatorRole: UserRole,
    operatorEmail?: string
  ): Promise<CascadeDeleteResult> {
    if (!this.isCreator(operatorRole, operatorEmail)) {
      throw new Error('Akses Ditolak: Penghapusan universal dan cascade hanya diizinkan untuk peran Creator.');
    }

    const user = dbService.findUserById(userId);
    const username = user?.username || userId;

    const details: string[] = [];
    const batchOps: Array<(batch: WriteBatch) => void> = [];

    try {
      // 1. users/{userId}
      batchOps.push((batch) => batch.delete(doc(db, 'users', userId)));
      details.push(`Profil Akun Pengguna (${username})`);

      // 2. user_permissions/{userId}
      batchOps.push((batch) => batch.delete(doc(db, 'user_permissions', userId)));
      details.push(`Matriks Izin Modul (${username})`);

      const totalDeletedInFirestore = await commitBatchOperations(batchOps);

      // Clean local
      dbService.deleteUser(userId, 'creator');

      dbService.addAuditLog({
        id: `aud-casc-${Date.now()}`,
        timestamp: Date.now(),
        userId: userId,
        username: username,
        role: 'creator',
        action: 'CASCADE_DELETE_USER',
        module: 'Hak Akses Pengguna',
        details: `PENGHAPUSAN UNIVERSAL CREATOR: Akun ${username} beserta seluruh hak izinnya telah dihapus permanen.`,
        status: 'danger',
      });

      return {
        success: true,
        itemType: 'Akun Pengguna',
        itemId: username,
        deletedPrimary: userId,
        deletedRelationsCount: totalDeletedInFirestore - 1,
        details,
      };
    } catch (error) {
      console.error('Error during user account cascade deletion:', error);
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
      return {
        success: false,
        itemType: 'Akun Pengguna',
        itemId: username,
        deletedPrimary: userId,
        deletedRelationsCount: 0,
        details,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==============================================================
  // 12. AUDIT LOG DELETION
  // ==============================================================
  public async deleteAuditLogCascade(
    logId: string,
    operatorRole: UserRole,
    operatorEmail?: string
  ): Promise<CascadeDeleteResult> {
    if (!this.isCreator(operatorRole, operatorEmail)) {
      throw new Error('Akses Ditolak: Penghapusan universal hanya diizinkan untuk peran Creator.');
    }

    try {
      await deleteDoc(doc(db, 'audit_logs', logId));

      // Clean local storage
      const allLogs = dbService.getAuditLogs().filter(l => l.id !== logId);
      try {
        localStorage.setItem('nexaproject_audit_logs_v1', JSON.stringify(allLogs));
      } catch {}

      return {
        success: true,
        itemType: 'Log Audit Keamanan',
        itemId: logId,
        deletedPrimary: logId,
        deletedRelationsCount: 0,
        details: [`Log Audit Event #${logId}`],
      };
    } catch (error) {
      console.error('Error during audit log deletion:', error);
      handleFirestoreError(error, OperationType.DELETE, `audit_logs/${logId}`);
      return {
        success: false,
        itemType: 'Log Audit Keamanan',
        itemId: logId,
        deletedPrimary: logId,
        deletedRelationsCount: 0,
        details: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  // ==============================================================
  // 13. SYSTEM SETTINGS RESET / CLEANUP
  // ==============================================================
  public async resetSystemSettingCascade(
    settingKey: string,
    operatorRole: UserRole,
    operatorEmail?: string
  ): Promise<CascadeDeleteResult> {
    if (!this.isCreator(operatorRole, operatorEmail)) {
      throw new Error('Akses Ditolak: Reset pengaturan sistem hanya diizinkan untuk peran Creator.');
    }

    try {
      await deleteDoc(doc(db, 'system_settings', settingKey));

      return {
        success: true,
        itemType: 'Konfigurasi Sistem',
        itemId: settingKey,
        deletedPrimary: settingKey,
        deletedRelationsCount: 0,
        details: [`Pengaturan Sistem: ${settingKey}`],
      };
    } catch (error) {
      console.error('Error during settings reset:', error);
      handleFirestoreError(error, OperationType.DELETE, `system_settings/${settingKey}`);
      return {
        success: false,
        itemType: 'Konfigurasi Sistem',
        itemId: settingKey,
        deletedPrimary: settingKey,
        deletedRelationsCount: 0,
        details: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}

export const cascadeDeleteService = new CascadeDeleteService();
