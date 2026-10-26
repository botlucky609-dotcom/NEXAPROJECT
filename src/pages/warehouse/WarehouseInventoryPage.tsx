import React, { useState, useEffect } from 'react';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Download, 
  Search, 
  Filter, 
  ArrowDownLeft, 
  Layers, 
  DollarSign, 
  CheckCircle2, 
  MapPin, 
  Building2, 
  Boxes, 
  X,
  ShieldCheck,
  TrendingDown,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRBAC } from '../../hooks/useRBAC';
import { useTheme } from '../../context/ThemeContext';
import { LoadingScreen } from '../../components/common/LoadingScreen';
import { warehouseDb } from '../../services/warehouseDb';
import { WarehouseItem, WarehouseCategory } from '../../types/warehouse';

export const WarehouseInventoryPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { t, language } = useTheme();
  // Strict RBAC Hook: Creator has full authority; Admin & Karyawan adhere to Izin Akses Pengguna
  const { isCreator, canCreate, canEdit, canDelete, canDownload } = useRBAC('warehouse-stock');

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inventory, setInventory] = useState<WarehouseItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState<boolean>(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStockInModalOpen, setIsStockInModalOpen] = useState(false);
  const [selectedItemForStockIn, setSelectedItemForStockIn] = useState<WarehouseItem | null>(null);

  // Form states for Add Item
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<WarehouseCategory>('STEEL_PLATE');
  const [newSpec, setNewSpec] = useState('');
  const [newUnit, setNewUnit] = useState('Lbr');
  const [newStock, setNewStock] = useState(10);
  const [newMinStock, setNewMinStock] = useState(5);
  const [newRack, setNewRack] = useState('');
  const [newPrice, setNewPrice] = useState(1000000);
  const [newSupplier, setNewSupplier] = useState('');

  // Stock In Form
  const [stockInQty, setStockInQty] = useState<number>(10);
  const [stockInRef, setStockInRef] = useState<string>('');
  const [stockInNotes, setStockInNotes] = useState<string>('');

  const loadData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setInventory(warehouseDb.getInventory());
      setIsLoading(false);
    }, 350);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered Inventory
  const filtered = inventory.filter((item) => {
    const matchesSearch = 
      item.itemCode.toLowerCase().includes(search.toLowerCase()) ||
      item.itemName.toLowerCase().includes(search.toLowerCase()) ||
      item.specification.toLowerCase().includes(search.toLowerCase()) ||
      item.rackLocation.toLowerCase().includes(search.toLowerCase()) ||
      item.supplier.toLowerCase().includes(search.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesLowStock = !filterLowStockOnly || item.stockQty <= item.minStockQty;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  // KPI Calculations
  const totalItems = inventory.length;
  const lowStockCount = inventory.filter((i) => i.stockQty <= i.minStockQty).length;
  const totalValue = inventory.reduce((sum, i) => sum + i.stockQty * i.unitPrice, 0);

  const handleExport = async () => {
    if (!canDownload) {
      alert('Akses Ditolak: Anda tidak memiliki otoritas untuk mengekspor data inventaris.');
      return;
    }
    const blob = await warehouseDb.exportInventoryToExcel();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `INVENTARIS_MATERIAL_GUDANG_${new Date().toISOString().split('T')[0]}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate && !canEdit) {
      alert('Akses Ditolak: Anda tidak memiliki otoritas untuk menambah material baru.');
      return;
    }
    if (!newCode || !newName) return;

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 450));
      await warehouseDb.saveItem({
        id: `mat-${Date.now()}`,
        itemCode: newCode.trim().toUpperCase(),
        itemName: newName.trim(),
        category: newCategory,
        specification: newSpec.trim(),
        unit: newUnit.trim(),
        stockQty: Number(newStock) || 0,
        minStockQty: Number(newMinStock) || 0,
        rackLocation: newRack.trim() || 'Gudang Utama',
        unitPrice: Number(newPrice) || 0,
        isHighValue: Number(newPrice) >= 5000000,
        lastRestockedAt: new Date().toISOString().split('T')[0],
        supplier: newSupplier.trim() || 'Supplier Galangan',
      });

      setInventory(warehouseDb.getInventory());
      setIsAddModalOpen(false);
      // Reset
      setNewCode('');
      setNewName('');
      setNewSpec('');
      setNewRack('');
      setNewSupplier('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStockIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      alert('Akses Ditolak: Anda tidak memiliki otoritas untuk menambah stok material.');
      return;
    }
    if (!selectedItemForStockIn || stockInQty <= 0) return;

    setIsSubmitting(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 450));
      warehouseDb.recordStockIn(
        selectedItemForStockIn.id,
        Number(stockInQty),
        stockInRef.trim() || `PO-${Date.now().toString().slice(-4)}`,
        currentUser?.fullName || 'OPERATOR GUDANG',
        stockInNotes.trim() || 'Penerimaan stok material baru'
      );

      setInventory(warehouseDb.getInventory());
      setIsStockInModalOpen(false);
      setSelectedItemForStockIn(null);
      setStockInQty(10);
      setStockInRef('');
      setStockInNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryBadge = (cat: WarehouseCategory) => {
    switch (cat) {
      case 'STEEL_PLATE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200">Pelat Baja</span>;
      case 'WELDING_CONSUMABLE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">Kawat Las</span>;
      case 'PAINT_CHEMICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">Cat & Kimia</span>;
      case 'PIPING_VALVE':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">Pipa & Valve</span>;
      case 'ELECTRICAL':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300">Elektrikal</span>;
      case 'TOOLS_SAFETY':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300">Perkakas & APD</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">{cat}</span>;
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
              <span>{t('menu.warehouse.inventory')}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              <span>{t('wh.inv.title')}</span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t('wh.inv.desc')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {canDownload && (
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5 text-blue-500" />
                <span>{t('wh.btn.export')}</span>
              </button>
            )}

            {(canCreate || canEdit) && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition"
              >
                <Plus className="w-4 h-4" />
                <span>{t('wh.btn.add_item')}</span>
              </button>
            )}
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {t('wh.stat.total_items')}
              </span>
              <p className="font-mono text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
                {totalItems} <span className="text-xs font-normal text-slate-400">SKU</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Katalog material aktif galangan</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Boxes className="w-6 h-6" />
            </div>
          </div>

          <div className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 shadow-xs flex items-center justify-between ${
            lowStockCount > 0 ? 'border-amber-300 dark:border-amber-800/80 bg-amber-50/20' : 'border-slate-200 dark:border-slate-800'
          }`}>
            <div>
              <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{t('wh.stat.low_stock')}</span>
              </span>
              <p className="font-mono text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                {lowStockCount} <span className="text-xs font-normal text-slate-400">Item</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Stok di bawah batas aman minimum</p>
            </div>
            <button
              onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
              className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition ${
                filterLowStockOnly ? 'bg-amber-500 text-white border-amber-600' : 'border-amber-300 dark:border-amber-700 text-amber-600 hover:bg-amber-100'
              }`}
            >
              {filterLowStockOnly ? (language === 'en' ? 'Show All' : 'Lihat Semua') : (language === 'en' ? 'Filter Low' : 'Filter Kritis')}
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                {t('wh.stat.total_val')}
              </span>
              <p className="font-mono text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                Rp {totalValue.toLocaleString('id-ID')}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">Valuasi stok fisik dalam gudang</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Filter & Search Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari kode, nama material, lokasi, supplier..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shrink-0"
            >
              <option value="ALL">{t('wh.filter.category')}</option>
              <option value="STEEL_PLATE">Pelat Baja (Steel Plate)</option>
              <option value="WELDING_CONSUMABLE">Kawat Las & Flux</option>
              <option value="PAINT_CHEMICAL">Cat Marine & Kimia</option>
              <option value="PIPING_VALVE">Pipa & Valve</option>
              <option value="ELECTRICAL">Elektrikal</option>
              <option value="TOOLS_SAFETY">Perkakas & Safety</option>
            </select>
          </div>
        </div>

        {/* Inventory Items Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" />
              <span>Daftar Stok Fisik Gudang & Yard</span>
            </h3>
            <span className="text-xs font-mono font-bold text-slate-400">
              {filtered.length} Material Ditampilkan
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 font-bold border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
                <tr>
                  <th className="p-3">Kode Item</th>
                  <th className="p-3">Nama Material & Spesifikasi</th>
                  <th className="p-3">Kategori</th>
                  <th className="p-3 text-center">Stok Fisik</th>
                  <th className="p-3 text-center">Batas Aman</th>
                  <th className="p-3">Lokasi Gudang</th>
                  <th className="p-3 text-right">Harga Satuan</th>
                  <th className="p-3">Pemasok</th>
                  {canEdit && <th className="p-3 text-center">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={canEdit ? 9 : 8} className="py-12">
                      <LoadingScreen
                        variant="inline"
                        compact
                        text="Memuat Inventaris Logistik & Material..."
                        subtext="Menyinkronkan stok pelat baja, elektroda las, dan suku cadang galangan..."
                      />
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={canEdit ? 9 : 8} className="p-8 text-center text-slate-500">
                      Tidak ada material ditemukan dalam sistem inventaris.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const isLow = item.stockQty <= item.minStockQty;
                    return (
                      <tr key={item.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${
                        isLow ? 'bg-amber-50/30 dark:bg-amber-950/10' : ''
                      }`}>
                        <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                          {item.itemCode}
                        </td>
                        <td className="p-3 max-w-xs">
                          <div className="font-bold text-slate-900 dark:text-white">{item.itemName}</div>
                          <div className="text-[11px] text-slate-400 line-clamp-1">{item.specification}</div>
                        </td>
                        <td className="p-3 whitespace-nowrap">
                          {getCategoryBadge(item.category)}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className={`font-mono font-extrabold text-sm ${isLow ? 'text-amber-600 dark:text-amber-400' : 'text-slate-900 dark:text-white'}`}>
                              {item.stockQty}
                            </span>
                            <span className="text-[10px] text-slate-400">{item.unit}</span>
                            {isLow && (
                              <span title="Stok di bawah batas aman">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-center font-mono text-slate-500">
                          {item.minStockQty} {item.unit}
                        </td>
                        <td className="p-3 font-semibold text-slate-600 dark:text-slate-300 flex items-center gap-1.5 whitespace-nowrap">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.rackLocation}</span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          Rp {item.unitPrice.toLocaleString('id-ID')}
                        </td>
                        <td className="p-3 text-slate-500 text-[11px] whitespace-nowrap">
                          {item.supplier}
                        </td>
                        {canEdit && (
                          <td className="p-3 text-center whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedItemForStockIn(item);
                                setIsStockInModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 rounded-lg transition inline-flex items-center gap-1"
                              title="Tambah Stok Masuk"
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                              <span>+ Stok</span>
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Tambah Material Baru */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg p-5 space-y-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-600" />
                  <span>Tambah Material Baru ke Inventaris</span>
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg text-slate-400">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddItem} className="space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Kode Material*</label>
                    <input
                      type="text"
                      required
                      placeholder="MAT-STL-005"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Kategori*</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as WarehouseCategory)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    >
                      <option value="STEEL_PLATE">Pelat Baja (Steel Plate)</option>
                      <option value="WELDING_CONSUMABLE">Kawat Las & Flux</option>
                      <option value="PAINT_CHEMICAL">Cat Marine & Kimia</option>
                      <option value="PIPING_VALVE">Pipa & Valve</option>
                      <option value="ELECTRICAL">Elektrikal</option>
                      <option value="TOOLS_SAFETY">Perkakas & Safety</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Nama Barang / Material*</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Pelat Baja AH36 (20mm x 8ft x 30ft)"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Spesifikasi Teknis</label>
                  <input
                    type="text"
                    placeholder="Standard klasifikasi BKI / Mill Certificate"
                    value={newSpec}
                    onChange={(e) => setNewSpec(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Satuan*</label>
                    <input
                      type="text"
                      required
                      placeholder="Lbr / Pail / Dus"
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Stok Awal*</label>
                    <input
                      type="number"
                      required
                      value={newStock}
                      onChange={(e) => setNewStock(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Batas Aman Min*</label>
                    <input
                      type="number"
                      required
                      value={newMinStock}
                      onChange={(e) => setNewMinStock(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold mb-1">Lokasi Rak / Gudang*</label>
                    <input
                      type="text"
                      required
                      placeholder="Gudang Utama A - Rak 02"
                      value={newRack}
                      onChange={(e) => setNewRack(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Harga Satuan (IDR)*</label>
                    <input
                      type="number"
                      required
                      value={newPrice}
                      onChange={(e) => setNewPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold mb-1">Nama Pemasok (Supplier)</label>
                  <input
                    type="text"
                    placeholder="PT Krakatau Posco / Distributor"
                    value={newSupplier}
                    onChange={(e) => setNewSupplier(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsAddModalOpen(false)}
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
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <span>Simpan Material</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal Penerimaan Stok Masuk (Stock In) */}
        {isStockInModalOpen && selectedItemForStockIn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-md p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                  <span>Penerimaan Stok Masuk (Stock In)</span>
                </h3>
                <button 
                  disabled={isSubmitting}
                  onClick={() => setIsStockInModalOpen(false)} 
                  className="p-1 rounded-lg text-slate-400 disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs space-y-1">
                <div className="font-bold text-slate-900 dark:text-white">{selectedItemForStockIn.itemName}</div>
                <div className="text-slate-500 flex justify-between">
                  <span>Kode: <strong>{selectedItemForStockIn.itemCode}</strong></span>
                  <span>Stok Saat Ini: <strong>{selectedItemForStockIn.stockQty} {selectedItemForStockIn.unit}</strong></span>
                </div>
              </div>

              <form onSubmit={handleStockIn} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold mb-1">Jumlah Barang Diterima ({selectedItemForStockIn.unit})*</label>
                  <input
                    type="number"
                    min="1"
                    required
                    disabled={isSubmitting}
                    value={stockInQty}
                    onChange={(e) => setStockInQty(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 font-mono font-bold text-base disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">No. Surat Jalan / Purchase Order (PO)*</label>
                  <input
                    type="text"
                    required
                    disabled={isSubmitting}
                    placeholder="Contoh: PO-2026-095"
                    value={stockInRef}
                    onChange={(e) => setStockInRef(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block font-bold mb-1">Catatan Penerimaan</label>
                  <input
                    type="text"
                    disabled={isSubmitting}
                    placeholder="Kondisi barang baik, diterima di yard..."
                    value={stockInNotes}
                    onChange={(e) => setStockInNotes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-60"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsStockInModalOpen(false)}
                    className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-xl disabled:opacity-50"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-sm disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Mencatat...</span>
                      </>
                    ) : (
                      <span>Konfirmasi Penerimaan Stok</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Fullscreen Overlay when Submitting Data */}
        {isSubmitting && (
          <LoadingScreen
            variant="overlay"
            text="Menyimpan Pembaruan Material..."
            subtext="Mencatat transaksi logistik ke database gudang galangan..."
          />
        )}

      </div>
    </div>
  );
};
