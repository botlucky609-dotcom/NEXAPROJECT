import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Plus, 
  Download, 
  Ship, 
  Lock, 
  ShieldCheck, 
  Search, 
  ArrowRight, 
  PackageCheck, 
  Layers,
  X,
  CreditCard,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../hooks/useRBAC';
import { useTheme } from '../../context/ThemeContext';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { warehouseDb } from '../../services/warehouseDb';
import { projectDb } from '../../services/projectDb';
import { MaterialOrder, WarehouseItem, MaterialOrderItem } from '../../types/warehouse';
import { ShipProject } from '../../types/project';

export const MaterialOrdersPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { t, language } = useTheme();
  // Strict RBAC Hook: Creator has full authority; Admin & Karyawan strictly follow Izin Akses Pengguna
  const { isCreator, canCreate, canEdit, canDelete, canDownload } = useRBAC('warehouse-order');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orders, setOrders] = useState<MaterialOrder[]>([]);
  const [projects, setProjects] = useState<ShipProject[]>([]);
  const [inventory, setInventory] = useState<WarehouseItem[]>([]);
  
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [selectedOrderForAction, setSelectedOrderForAction] = useState<MaterialOrder | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // Form states for New Order
  const [selectedProjectId, setSelectedProjectId] = useState<string>('prj-001');
  const [orderDepartment, setOrderDepartment] = useState('STEEL WORK');
  const [orderPriority, setOrderPriority] = useState<'NORMAL' | 'URGENT' | 'EMERGENCY'>('URGENT');
  const [dateNeeded, setDateNeeded] = useState(
    new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [selectedItemId, setSelectedItemId] = useState<string>('mat-001');
  const [orderQty, setOrderQty] = useState<number>(5);

  const loadData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setOrders(warehouseDb.getOrders());
      setProjects(projectDb.getProjects());
      setInventory(warehouseDb.getInventory());
      setIsLoading(false);
    }, 350);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.shipName.toLowerCase().includes(search.toLowerCase()) ||
      o.requesterName.toLowerCase().includes(search.toLowerCase()) ||
      o.department.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = orders.filter((o) => o.status === 'PENDING').length;
  const approvedCount = orders.filter((o) => o.status === 'APPROVED').length;
  const receivedCount = orders.filter((o) => o.status === 'RECEIVED').length;

  const handleExport = async () => {
    const blob = await warehouseDb.exportOrdersToExcel();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LAPORAN_PERMINTAAN_MATERIAL_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Approval with Creator Defense
  const handleApprove = async (order: MaterialOrder) => {
    setPermissionError(null);
    if (order.isCreatorApprovalRequired && !isCreator) {
      setPermissionError(
        'Akses Ditolak: Permintaan material ini bernilai di atas Rp 50.000.000 (Otorisasi Anggaran Tinggi). Berdasarkan kebijakan keamanan sistem, pengesahan ini memerlukan otorisasi eksekutif khusus.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      await warehouseDb.approveOrder(
        order.id, 
        currentUser?.fullName || 'OPERATOR', 
        currentUser?.role
      );
      setOrders(warehouseDb.getOrders());
    } catch (err: any) {
      setPermissionError(err.message || 'Gagal menyetujui order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenReject = (order: MaterialOrder) => {
    setSelectedOrderForAction(order);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForAction || !rejectReason.trim()) return;

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      await warehouseDb.rejectOrder(
        selectedOrderForAction.id,
        rejectReason.trim(),
        currentUser?.fullName || 'OPERATOR'
      );
      setOrders(warehouseDb.getOrders());
      setIsRejectModalOpen(false);
      setSelectedOrderForAction(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFulfill = async (order: MaterialOrder) => {
    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 400));
      await warehouseDb.fulfillOrder(order.id, currentUser?.fullName || 'PETUGAS GUDANG');
      setOrders(warehouseDb.getOrders());
    } finally {
      setIsSubmitting(false);
    }
  };

  // Create Order
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const proj = projects.find((p) => p.id === selectedProjectId);
    const item = inventory.find((i) => i.id === selectedItemId);
    if (!proj || !item) return;

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 450));
      const qty = Number(orderQty) || 1;
      const totalPrice = item.unitPrice * qty;

      const newOrder: MaterialOrder = {
        id: `ord-${Date.now()}`,
        orderNumber: `WO-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        projectId: proj.id,
        projectCode: proj.projectCode,
        shipName: proj.shipName,
        requesterId: currentUser?.employeeId || 'EMP-001',
        requesterName: currentUser?.fullName || 'MUHAMMAD ANDRI',
        department: orderDepartment,
        items: [
          {
            itemId: item.id,
            itemCode: item.itemCode,
            itemName: item.itemName,
            qty,
            unit: item.unit,
            unitPrice: item.unitPrice,
            totalPrice,
          },
        ],
        totalEstimatedCost: totalPrice,
        priority: orderPriority,
        status: 'PENDING',
        isCreatorApprovalRequired: totalPrice > 50000000,
        dateNeeded,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await warehouseDb.createOrder(newOrder);
      setOrders(warehouseDb.getOrders());
      setIsCreateModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
              <span>{t('sidebar.group.warehouse')}</span>
              <span>/</span>
              <span>{t('menu.warehouse.orders')}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
              <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span>{t('wh.orders.title')}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('wh.orders.desc')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canDownload && (
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5 text-blue-500" />
                <span>{t('wh.btn.export_orders')}</span>
              </button>
            )}

            {(canCreate || canEdit) && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>{t('wh.btn.new_order')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Security Warning Alert for High-Budget Authorization */}
        {permissionError && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-start justify-between gap-3 shadow-sm animate-in fade-in duration-150">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-xs">Peringatan Keamanan Otorisasi Finansial:</p>
                <p className="text-xs mt-0.5">{permissionError}</p>
                {isCreator ? (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                    💡 Otorisasi ini terhubung dengan pertahanan Creator tingkat tinggi.
                  </p>
                ) : (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1">
                    💡 Otorisasi ini memerlukan persetujuan manajemen eksekutif sistem.
                  </p>
                )}
              </div>
            </div>
            <button onClick={() => setPermissionError(null)} className="text-rose-400 hover:text-rose-700">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Status KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{t('wh.stat.pending_orders')}</span>
              </span>
              <p className="font-mono text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {pendingCount} <span className="text-xs font-normal text-slate-400">Order</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Menunggu verifikasi & otorisasi</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Siap Pengadaan / Dikeluarkan</span>
              </span>
              <p className="font-mono text-2xl font-extrabold text-blue-600 dark:text-blue-400 mt-1">
                {approvedCount} <span className="text-xs font-normal text-slate-400">Disetujui</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Telah lolos otorisasi anggaran</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <PackageCheck className="w-3.5 h-3.5" />
                <span>Barang Diterima di Yard</span>
              </span>
              <p className="font-mono text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                {receivedCount} <span className="text-xs font-normal text-slate-400">Selesai</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Telah dialokasikan ke pengerjaan kapal</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <PackageCheck className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari no order, nama kapal, pemohon..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {['ALL', 'PENDING', 'APPROVED', 'RECEIVED', 'REJECTED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition shrink-0 ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {st === 'ALL' ? 'Semua Status' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Orders Card List */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="py-12 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-xs">
              <LoadingScreen
                variant="inline"
                compact
                text="Memuat Permintaan Material Proyek..."
                subtext="Menyinkronkan daftar purchase request, status otorisasi, dan kebutuhan proyek galangan..."
              />
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-500 shadow-xs">
              Tidak ada permintaan material yang sesuai dengan kriteria filter.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const isHighBudget = order.isCreatorApprovalRequired;
              return (
                <div 
                  key={order.id}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 hover:border-blue-500/50 transition"
                >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm font-extrabold text-blue-600 dark:text-blue-400">
                      {order.orderNumber}
                    </span>
                    <span className="text-slate-300 dark:text-slate-700">|</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Ship className="w-3.5 h-3.5 text-sky-500" />
                      <span>{order.shipName}</span>
                      <span className="text-[11px] font-mono text-slate-400">({order.projectCode})</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {isHighBudget && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-amber-600" />
                        <span>{isCreator ? 'Otorisasi Khusus Creator (> 50 Jt)' : 'Otorisasi Manajemen Puncak (> 50 Jt)'}</span>
                      </span>
                    )}

                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      order.status === 'PENDING' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' :
                      order.status === 'APPROVED' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' :
                      order.status === 'RECEIVED' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' :
                      'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Body Details */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Pemohon & Divisi</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{order.requesterName}</p>
                    <p className="text-[11px] text-slate-400">{order.department}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Prioritas & Batas Waktu</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      Prioritas: <strong className={order.priority === 'URGENT' ? 'text-amber-600' : 'text-slate-600'}>{order.priority}</strong>
                    </p>
                    <p className="text-[11px] text-slate-400">Dibutuhkan: {order.dateNeeded}</p>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Estimasi Biaya Material</span>
                    <p className="font-mono text-base font-extrabold text-slate-900 dark:text-white mt-0.5">
                      Rp {order.totalEstimatedCost.toLocaleString('id-ID')}
                    </p>
                    {isHighBudget && (
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold">Nilai Tinggi (&gt; Rp 50 Jt)</p>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Status Otorisasi</span>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5">
                      {order.approvedBy || 'Menunggu Persetujuan'}
                    </p>
                    {order.rejectionReason && (
                      <p className="text-[11px] text-rose-500 font-semibold mt-0.5">Alasan: {order.rejectionReason}</p>
                    )}
                  </div>
                </div>

                {/* Items Breakdown List */}
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[11px] font-bold text-slate-500 mb-2">Item Material yang Diajukan:</div>
                  <div className="space-y-1.5">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-blue-500">{it.itemCode}</span>
                          <span className="text-slate-800 dark:text-slate-200">{it.itemName}</span>
                        </div>
                        <div className="flex items-center gap-3 font-mono">
                          <span className="text-slate-600 dark:text-slate-400">{it.qty} {it.unit}</span>
                          <span className="text-slate-900 dark:text-white">Rp {it.totalPrice.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons (Guarded by canEdit, Creator always full access) */}
                {canEdit ? (
                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {order.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleOpenReject(order)}
                          className="px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition"
                        >
                          {t('wh.order.reject')}
                        </button>

                        <button
                          onClick={() => handleApprove(order)}
                          className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl text-white shadow-xs transition ${
                            isHighBudget 
                              ? isCreator ? 'bg-amber-600 hover:bg-amber-700' : 'bg-slate-600 hover:bg-slate-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                          title={isHighBudget && !isCreator ? 'Memerlukan otorisasi manajemen eksekutif untuk pengajuan > 50 Juta' : ''}
                        >
                          {isHighBudget && !isCreator ? <Lock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          <span>{t('wh.order.approve')}</span>
                        </button>
                      </>
                    )}

                    {order.status === 'APPROVED' && (
                      <button
                        onClick={() => handleFulfill(order)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
                      >
                        <PackageCheck className="w-3.5 h-3.5" />
                        <span>{t('wh.order.fulfill')}</span>
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
                    <span>Status Otorisasi: Dokumen Logistik Galangan</span>
                    <span className="font-semibold text-slate-500">Hanya Lihat</span>
                  </div>
                )}

              </div>
            );
          }))}
        </div>

        {/* Modal Buat Permintaan Barang Baru */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Buat Permintaan Barang Proyek (Warehouse Order)</span>
                </h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateOrder} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold mb-1">Pilih Proyek Kapal*</label>
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.projectCode} · {p.shipName} ({p.owner})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Departemen Pemohon*</label>
                    <select
                      value={orderDepartment}
                      onChange={(e) => setOrderDepartment(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="STEEL WORK">STEEL WORK (Fabrikasi Lambung)</option>
                      <option value="PIPING">PIPING (Perpipaan & Katup)</option>
                      <option value="COATING & BLASTING">COATING & BLASTING (Pengecatan)</option>
                      <option value="MACHINERY & DOCKING">MACHINERY & DOCKING</option>
                      <option value="ELECTRICAL">ELECTRICAL (Kelistrikan Kapal)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold mb-1">Tingkat Prioritas*</label>
                    <select
                      value={orderPriority}
                      onChange={(e) => setOrderPriority(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="NORMAL">NORMAL (Pengadaan Rutin)</option>
                      <option value="URGENT">URGENT (Pekerjaan Kritis Docking)</option>
                      <option value="EMERGENCY">EMERGENCY (Kendala Sea Trial)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Pilih Material dari Stok Gudang*</label>
                  <select
                    value={selectedItemId}
                    onChange={(e) => setSelectedItemId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-semibold"
                  >
                    {inventory.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.itemCode} · {i.itemName} (Stok: {i.stockQty} {i.unit} - Rp {i.unitPrice.toLocaleString('id-ID')})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Jumlah Kebutuhan*</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={orderQty}
                      onChange={(e) => setOrderQty(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Tanggal Dibutuhkan di Yard*</label>
                    <input
                      type="date"
                      required
                      value={dateNeeded}
                      onChange={(e) => setDateNeeded(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>

                {/* Cost Preview */}
                {(() => {
                  const it = inventory.find((i) => i.id === selectedItemId);
                  const cost = it ? it.unitPrice * (Number(orderQty) || 0) : 0;
                  return (
                    <div className="p-3 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-200 dark:border-blue-900/60 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">Estimasi Total Biaya:</span>
                        <div className="font-mono text-base font-extrabold text-blue-600 dark:text-blue-400">
                          Rp {cost.toLocaleString('id-ID')}
                        </div>
                      </div>
                      {cost > 50000000 && (
                        <div className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-950 px-2 py-1 rounded-lg flex items-center gap-1">
                          <Lock className="w-3 h-3" />
                          <span>Wajib Otorisasi Creator</span>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-sm disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Mengirimkan...</span>
                      </>
                    ) : (
                      <span>Kirim Permintaan Barang</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Tolak Pengajuan */}
        {isRejectModalOpen && selectedOrderForAction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Tolak Permintaan Barang {selectedOrderForAction.orderNumber}</span>
                </h3>
                <button 
                  disabled={isSubmitting}
                  onClick={() => setIsRejectModalOpen(false)} 
                  className="p-1 rounded-lg text-slate-400 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleConfirmReject} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold mb-1">Alasan Penolakan*</label>
                  <textarea
                    required
                    rows={3}
                    disabled={isSubmitting}
                    placeholder="Contoh: Stok cadangan pelat di Yard 2 masih mencukupi..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-60"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsRejectModalOpen(false)}
                    className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-rose-600 text-white font-bold rounded-xl hover:bg-rose-700 shadow-sm disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Memproses...</span>
                      </>
                    ) : (
                      <span>Konfirmasi Penolakan</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Submission Overlay */}
        {isSubmitting && (
          <LoadingScreen
            variant="overlay"
            text="Memproses Permintaan Material..."
            subtext="Menyinkronkan dokumen logistik dan otorisasi anggaran galangan..."
          />
        )}

      </div>
    </div>
  );
};
