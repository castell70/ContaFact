import React, { useState, useMemo } from 'react';
import { 
  AppState, 
  Product, 
  InventoryMovement 
} from '../../types';
import { 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  adjustProductStock, 
  getCurrencyConfig,
  generateTemplateXlsx 
} from '../../services/dataStore';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpDown, 
  History, 
  Edit, 
  Trash2, 
  Download, 
  Boxes, 
  Layers, 
  DollarSign, 
  CheckCircle2, 
  X, 
  RefreshCw 
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface InventoryManagerProps {
  state: AppState;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ state }) => {
  const currency = getCurrencyConfig();
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'movements'>('catalog');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<Product | null>(null);
  const [notification, setNotification] = useState<{ message: string; isError?: boolean } | null>(null);

  const showNotificationMsg = (message: string, isError = false) => {
    setNotification({ message, isError });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  // Form states - Product
  const [formSku, setFormSku] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('General');
  const [formUnit, setFormUnit] = useState('Unidad');
  const [formCost, setFormCost] = useState<number>(0);
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formStock, setFormStock] = useState<number>(0);
  const [formMinStock, setFormMinStock] = useState<number>(5);
  const [formTaxType, setFormTaxType] = useState<'gravada' | 'exenta' | 'noSujeta'>('gravada');
  const [formDescription, setFormDescription] = useState('');

  // Form states - Adjustment
  const [adjType, setAdjType] = useState<'Entrada' | 'Salida' | 'Ajuste'>('Entrada');
  const [adjReason, setAdjReason] = useState<InventoryMovement['reason']>('Compra');
  const [adjQty, setAdjQty] = useState<number>(1);
  const [adjNotes, setAdjNotes] = useState('');

  const categories = useMemo(() => {
    const set = new Set<string>();
    state.products.forEach(p => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [state.products]);

  // Metrics
  const totalProducts = state.products.length;
  const totalStockUnits = state.products.reduce((acc, p) => acc + p.stock, 0);
  const totalInventoryValue = state.products.reduce((acc, p) => acc + (p.stock * p.cost), 0);
  const lowStockProducts = state.products.filter(p => p.stock <= p.minStock && p.stock > 0);
  const outOfStockProducts = state.products.filter(p => p.stock === 0);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return state.products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;
      let matchStock = true;
      if (stockFilter === 'low') matchStock = p.stock <= p.minStock && p.stock > 0;
      if (stockFilter === 'out') matchStock = p.stock === 0;

      return matchSearch && matchCategory && matchStock;
    });
  }, [state.products, searchTerm, categoryFilter, stockFilter]);

  // Open create modal
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormSku(`SKU-${(state.products.length + 1).toString().padStart(4, '0')}`);
    setFormName('');
    setFormCategory('General');
    setFormUnit('Unidad');
    setFormCost(0);
    setFormPrice(0);
    setFormStock(0);
    setFormMinStock(5);
    setFormTaxType('gravada');
    setFormDescription('');
    setIsProductModalOpen(true);
  };

  // Open edit modal
  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setFormSku(prod.sku);
    setFormName(prod.name);
    setFormCategory(prod.category || 'General');
    setFormUnit(prod.unit || 'Unidad');
    setFormCost(prod.cost);
    setFormPrice(prod.price);
    setFormStock(prod.stock);
    setFormMinStock(prod.minStock);
    setFormTaxType(prod.taxType);
    setFormDescription(prod.description || '');
    setIsProductModalOpen(true);
  };

  // Save product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (editingProduct) {
      updateProduct(editingProduct.id, {
        sku: formSku.trim(),
        name: formName.trim(),
        category: formCategory.trim(),
        unit: formUnit,
        cost: Number(formCost),
        price: Number(formPrice),
        stock: Number(formStock),
        minStock: Number(formMinStock),
        taxType: formTaxType,
        description: formDescription.trim()
      });
    } else {
      addProduct({
        sku: formSku.trim(),
        name: formName.trim(),
        category: formCategory.trim(),
        unit: formUnit,
        cost: Number(formCost),
        price: Number(formPrice),
        stock: Number(formStock),
        minStock: Number(formMinStock),
        taxType: formTaxType,
        description: formDescription.trim()
      });
      showNotificationMsg('Producto creado exitosamente en el catálogo.');
    }
    setIsProductModalOpen(false);
  };

  // Handle delete
  const handleDeleteProduct = (prod: Product) => {
    setDeleteConfirmProduct(prod);
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmProduct) return;
    const prodName = deleteConfirmProduct.name;
    const deleted = deleteProduct(deleteConfirmProduct.id);
    if (deleted) {
      showNotificationMsg(`Producto "${prodName}" eliminado correctamente del catálogo.`);
    } else {
      showNotificationMsg('No se pudo eliminar el producto.', true);
    }
    setDeleteConfirmProduct(null);
  };

  // Open adjustment modal
  const handleOpenAdjustmentModal = (prod: Product) => {
    setAdjustingProduct(prod);
    setAdjType('Entrada');
    setAdjReason('Compra');
    setAdjQty(1);
    setAdjNotes('');
    setIsAdjustmentModalOpen(true);
  };

  // Save adjustment
  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct || adjQty <= 0) return;

    adjustProductStock(
      adjustingProduct.id, 
      Number(adjQty), 
      adjType, 
      adjReason, 
      adjNotes
    );
    setIsAdjustmentModalOpen(false);
  };

  // Export products to Excel
  const handleExportProductsExcel = () => {
    const data = state.products.map(p => ({
      'SKU / Código': p.sku,
      'Nombre de Producto': p.name,
      'Categoría': p.category,
      'Unidad': p.unit,
      'Costo ($)': p.cost,
      'Precio Venta ($)': p.price,
      'Margen Bruto (%)': p.cost > 0 ? Math.round(((p.price - p.cost) / p.cost) * 100) : 100,
      'Existencia Actual': p.stock,
      'Stock Mínimo': p.minStock,
      'Valor Inventario ($)': Math.round((p.stock * p.cost) * 100) / 100,
      'Tratamiento IVA': p.taxType.toUpperCase(),
      'Descripción': p.description || ''
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Catálogo de Inventario');
    XLSX.writeFile(wb, `Inventario_Productos_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div className={`p-4 rounded-xl flex items-center justify-between shadow-lg border text-sm font-semibold transition-all ${
          notification.isError
            ? 'bg-red-50 text-red-800 border-red-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.isError ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-lg text-slate-900">Confirmar Eliminación de Producto</h3>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              ¿Está seguro de eliminar el producto <strong className="text-slate-900">{deleteConfirmProduct.name}</strong> (SKU: <span className="font-mono text-xs font-bold text-indigo-700">{deleteConfirmProduct.sku}</span>) del catálogo?
            </p>
            {deleteConfirmProduct.stock > 0 && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Advertencia: Este producto tiene actualmente <strong>{deleteConfirmProduct.stock} {deleteConfirmProduct.unit}(s)</strong> en inventario físico.</span>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmProduct(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar Producto
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Section / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] flex items-center gap-2">
            <Package className="w-7 h-7 text-indigo-600" />
            Gestión de Inventario y Existencias
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Catálogo unificado de productos, control de stock en tiempo real, costeo y trazabilidad de movimientos.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => generateTemplateXlsx('products')}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Descargar Plantilla
          </button>

          <button
            onClick={handleExportProductsExcel}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            Exportar Excel
          </button>

          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Productos (SKUs)</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalProducts}</p>
            <p className="text-xs text-slate-400 mt-0.5">{totalStockUnits.toLocaleString()} unidades totales</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Valorización de Inventario</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">
              {currency.symbol} {totalInventoryValue.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Al costo promedio</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Alerta Stock Bajo</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{lowStockProducts.length}</p>
            <p className="text-xs text-amber-600/80 mt-0.5">Por debajo del mínimo</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Agotados / Sin Stock</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">{outOfStockProducts.length}</p>
            <p className="text-xs text-rose-500 mt-0.5">Requieren reposición</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <TrendingDown className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Catalog vs Movements */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveSubTab('catalog')}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeSubTab === 'catalog'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          Catálogo y Existencias ({state.products.length})
        </button>

        <button
          onClick={() => setActiveSubTab('movements')}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeSubTab === 'movements'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" />
          Kardex y Movimientos ({state.inventoryMovements.length})
        </button>
      </div>

      {/* SUBTAB 1: CATALOG */}
      {activeSubTab === 'catalog' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3 items-center justify-between bg-slate-50/50">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por SKU, nombre, descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-600">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Categoría:</span>
              </div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Todas las categorías</option>
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>

              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Todo el stock</option>
                <option value="low">Stock Bajo</option>
                <option value="out">Sin Stock</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">SKU / Código</th>
                  <th className="py-3 px-4">Producto y Categoría</th>
                  <th className="py-3 px-4 text-center">Unidad</th>
                  <th className="py-3 px-4 text-right">Costo Unit.</th>
                  <th className="py-3 px-4 text-right">Precio Vta.</th>
                  <th className="py-3 px-4 text-center">Trat. IVA</th>
                  <th className="py-3 px-4 text-center">Existencias</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400">
                      No se encontraron productos con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredProducts.map(p => {
                    const isLow = p.stock <= p.minStock && p.stock > 0;
                    const isOut = p.stock === 0;
                    const totalVal = p.stock * p.cost;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">
                          {p.sku}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-900">{p.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                              {p.category}
                            </span>
                            {p.description && (
                              <span className="text-[11px] text-slate-400 truncate max-w-xs">
                                {p.description}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center text-slate-600">
                          {p.unit}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-slate-700">
                          {currency.symbol} {p.cost.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-indigo-600">
                          {currency.symbol} {p.price.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            p.taxType === 'gravada' ? 'bg-indigo-50 text-indigo-700' :
                            p.taxType === 'exenta' ? 'bg-emerald-50 text-emerald-700' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {p.taxType.toUpperCase()}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className={`font-bold text-sm ${
                              isOut ? 'text-rose-600' : isLow ? 'text-amber-600' : 'text-slate-800'
                            }`}>
                              {p.stock}
                            </span>
                            {isOut ? (
                              <span className="text-[9px] font-semibold text-rose-500">AGOTADO</span>
                            ) : isLow ? (
                              <span className="text-[9px] font-semibold text-amber-500">MÍN: {p.minStock}</span>
                            ) : (
                              <span className="text-[9px] text-slate-400">Óptimo</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-slate-900">
                          {currency.symbol} {totalVal.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenAdjustmentModal(p)}
                              title="Ajustar Stock (Entrada/Salida)"
                              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            >
                              <ArrowUpDown className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              title="Editar Producto"
                              className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(p)}
                              title="Eliminar Producto"
                              className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: MOVEMENTS / KARDEX */}
      {activeSubTab === 'movements' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              Historial de Entradas, Salidas y Ajustes de Kardex
            </h3>
            <span className="text-xs text-slate-500">
              Total movimientos registrados: {state.inventoryMovements.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4 text-center">Tipo</th>
                  <th className="py-3 px-4">Concepto / Motivo</th>
                  <th className="py-3 px-4 text-center">Cantidad</th>
                  <th className="py-3 px-4 text-right">Costo Unit.</th>
                  <th className="py-3 px-4 text-right">Costo Total</th>
                  <th className="py-3 px-4">Doc. Referencia / Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.inventoryMovements.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      No hay movimientos de inventario registrados aún.
                    </td>
                  </tr>
                ) : (
                  state.inventoryMovements.map(m => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600">
                        {m.date}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {m.productName}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.type === 'Entrada' ? 'bg-emerald-50 text-emerald-700' :
                          m.type === 'Salida' ? 'bg-rose-50 text-rose-700' :
                          'bg-indigo-50 text-indigo-700'
                        }`}>
                          {m.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        {m.reason}
                      </td>
                      <td className={`py-3 px-4 text-center font-bold ${
                        m.type === 'Entrada' ? 'text-emerald-600' :
                        m.type === 'Salida' ? 'text-rose-600' :
                        'text-indigo-600'
                      }`}>
                        {m.type === 'Entrada' ? `+${m.qty}` : m.type === 'Salida' ? `-${m.qty}` : `${m.qty}`}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {currency.symbol} {m.unitCost.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        {currency.symbol} {m.totalCost.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {m.referenceDoc && (
                          <span className="font-mono text-slate-700 block">{m.referenceDoc}</span>
                        )}
                        {m.notes && (
                          <span className="text-[11px] text-slate-400 block">{m.notes}</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CREATE / EDIT PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                {editingProduct ? 'Editar Producto / Artículo' : 'Nuevo Producto / SKU'}
              </h2>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Código / SKU *</label>
                  <input
                    type="text"
                    required
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value)}
                    placeholder="PROD-001"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Categoría</label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="Ferretería, Alimentos, Servicios..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nombre del Producto / Servicio *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ej: Tornillo galvanizado de 2 pulgadas"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Unidad Medida</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="Unidad">Unidad</option>
                    <option value="Caja">Caja</option>
                    <option value="Paquete">Paquete</option>
                    <option value="Kg">Kilogramo (Kg)</option>
                    <option value="Litro">Litro</option>
                    <option value="Metro">Metro</option>
                    <option value="Servicio">Servicio</option>
                    <option value="Hora">Hora</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Costo Unitario ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formCost}
                    onChange={(e) => setFormCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Precio Venta ($ sin IVA)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formPrice}
                    onChange={(e) => setFormPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-indigo-600 font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {!editingProduct && (
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1">Stock Inicial</label>
                    <input
                      type="number"
                      min="0"
                      value={formStock}
                      onChange={(e) => setFormStock(parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Alerta Stock Mínimo</label>
                  <input
                    type="number"
                    min="0"
                    value={formMinStock}
                    onChange={(e) => setFormMinStock(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tratamiento Tributario</label>
                  <select
                    value={formTaxType}
                    onChange={(e) => setFormTaxType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="gravada">Gravada (13% IVA)</option>
                    <option value="exenta">Exenta</option>
                    <option value="noSujeta">No Sujeta</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Descripción / Ficha Técnica</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Detalles adicionales, especificaciones, ubicación en almacén..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {editingProduct ? 'Actualizar Producto' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADJUSTMENT MODAL */}
      {isAdjustmentModalOpen && adjustingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <ArrowUpDown className="w-5 h-5 text-indigo-600" />
                Ajuste de Stock: {adjustingProduct.sku}
              </h2>
              <button
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="mt-4 space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-800">{adjustingProduct.name}</p>
                  <p className="text-[11px] text-slate-500">Costo unitario: ${adjustingProduct.cost.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Stock Actual</span>
                  <span className="text-base font-bold text-slate-900">{adjustingProduct.stock} {adjustingProduct.unit}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tipo de Operación</label>
                  <select
                    value={adjType}
                    onChange={(e) => {
                      const val = e.target.value as any;
                      setAdjType(val);
                      if (val === 'Entrada') setAdjReason('Compra');
                      if (val === 'Salida') setAdjReason('Venta');
                      if (val === 'Ajuste') setAdjReason('Ajuste Inicial');
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="Entrada">Entrada (Aumentar)</option>
                    <option value="Salida">Salida (Disminuir)</option>
                    <option value="Ajuste">Reajuste Físico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Motivo / Causa</label>
                  <select
                    value={adjReason}
                    onChange={(e) => setAdjReason(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    {adjType === 'Entrada' && (
                      <>
                        <option value="Compra">Compra a Proveedor</option>
                        <option value="Devolución">Devolución de Cliente</option>
                        <option value="Ajuste Inicial">Ajuste / Sobrante</option>
                      </>
                    )}
                    {adjType === 'Salida' && (
                      <>
                        <option value="Venta">Venta a Cliente</option>
                        <option value="Merma">Merma / Daño</option>
                        <option value="Devolución">Devolución a Proveedor</option>
                      </>
                    )}
                    {adjType === 'Ajuste' && (
                      <>
                        <option value="Ajuste Inicial">Inventario Físico / Conteo</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {adjType === 'Ajuste' ? 'Nueva Cantidad Total Fija' : 'Cantidad a Movilizar'}
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={adjQty}
                  onChange={(e) => setAdjQty(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-base font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Observaciones / Justificación</label>
                <textarea
                  rows={2}
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  placeholder="Número de acta, motivo de merma o lote..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustmentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className="w-4 h-4" />
                  Aplicar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
