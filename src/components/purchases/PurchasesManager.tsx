import React, { useState, useMemo, useRef } from 'react';
import { 
  PlusCircle, 
  ShoppingCart, 
  Search, 
  Edit3, 
  Trash2, 
  Truck, 
  Save, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  FileText,
  Upload
} from 'lucide-react';
import { AppState, PurchaseRecord, DocumentTypePurchase, PaymentMethod } from '../../types';
import { addPurchase, updatePurchase, deletePurchase, calculateVat, VAT_RATE, parsePurchasesFromJson, importPurchasesFromJsonData } from '../../services/dataStore';
import { formatCurrency, parseLocalDate } from '../../utils/numberToWords';

interface PurchasesManagerProps {
  state: AppState;
  selectedMonth: number;
  selectedYear: number;
}

export const PurchasesManager: React.FC<PurchasesManagerProps> = ({
  state,
  selectedMonth,
  selectedYear
}) => {
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [docType, setDocType] = useState<DocumentTypePurchase>('CCF');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [supplierNrc, setSupplierNrc] = useState<string>('');
  const [supplierName, setSupplierName] = useState<string>('');
  const [supplierNit, setSupplierNit] = useState<string>('');
  const [supplierEmail, setSupplierEmail] = useState<string>('');
  const [documentNumber, setDocumentNumber] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  
  // Amounts
  const [taxableAmount, setTaxableAmount] = useState<number>(0);
  const [exemptAmount, setExemptAmount] = useState<number>(0);
  const [noSujetaAmount, setNoSujetaAmount] = useState<number>(0);
  const [ivaCredit, setIvaCredit] = useState<number>(0);
  const [isManualIva, setIsManualIva] = useState<boolean>(false);
  const [ivaWithheld, setIvaWithheld] = useState<number>(0);
  const [ivaPerceived, setIvaPerceived] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Contado');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [editingPurchase, setEditingPurchase] = useState<PurchaseRecord | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; isError?: boolean } | null>(null);

  // Quick JSON Upload (supports single or multiple / bulk files)
  const quickJsonInputRef = useRef<HTMLInputElement>(null);
  const handleQuickJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray: File[] = Array.from(files);
    const allValidPurchases: Partial<PurchaseRecord>[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        const parsed = parsePurchasesFromJson(json);
        if (parsed.valid.length > 0) {
          allValidPurchases.push(...parsed.valid);
        } else {
          errors.push(`${file.name}: sin compras válidas`);
        }
      } catch (err: any) {
        errors.push(`${file.name}: ${err.message}`);
      }
    }

    if (allValidPurchases.length > 0) {
      const count = importPurchasesFromJsonData(allValidPurchases, 'append');
      showNotificationMsg(`¡Éxito! Se importaron ${count} compras desde ${fileArray.length} archivo(s) JSON.`);
    } else {
      showNotificationMsg(`No se detectaron compras válidas en los archivos seleccionados. ${errors.join(', ')}`, true);
    }
    e.target.value = '';
  };

  // Handle supplier select
  const handleSupplierChange = (supId: string) => {
    setSelectedSupplierId(supId);
    if (!supId) {
      setSupplierNrc('');
      setSupplierName('');
      setSupplierNit('');
      setSupplierEmail('');
      return;
    }

    const sup = state.suppliers.find(s => s.id === supId);
    if (sup) {
      setSupplierNrc(sup.nrc || '');
      setSupplierName(sup.name);
      setSupplierNit(sup.nit || '');
      setSupplierEmail(sup.email || '');
    }
  };

  // Auto calculate 13% IVA if not manual
  const handleTaxableChange = (val: number) => {
    setTaxableAmount(val);
    if (!isManualIva) {
      setIvaCredit(calculateVat(val));
    }
  };

  // Grand total
  const calculatedTotal = useMemo(() => {
    return Math.round((taxableAmount + exemptAmount + noSujetaAmount + ivaCredit - ivaWithheld + ivaPerceived) * 100) / 100;
  }, [taxableAmount, exemptAmount, noSujetaAmount, ivaCredit, ivaWithheld, ivaPerceived]);

  const showNotificationMsg = (message: string, isError = false) => {
    setNotification({ message, isError });
    setTimeout(() => setNotification(null), 5000);
  };

  const resetForm = () => {
    setDate(new Date().toISOString().substring(0, 10));
    setDocType('CCF');
    setSelectedSupplierId('');
    setSupplierNrc('');
    setSupplierName('');
    setSupplierNit('');
    setSupplierEmail('');
    setDocumentNumber('');
    setDescription('');
    setTaxableAmount(0);
    setExemptAmount(0);
    setNoSujetaAmount(0);
    setIvaCredit(0);
    setIsManualIva(false);
    setIvaWithheld(0);
    setIvaPerceived(0);
    setPaymentMethod('Contado');
    setEditingPurchase(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!supplierNrc && docType === 'CCF') {
        throw new Error('El NRC del proveedor es obligatorio para registrar un Crédito Fiscal de compras.');
      }
      if (!documentNumber.trim()) {
        throw new Error('Debe ingresar el número de documento / comprobante del proveedor.');
      }
      if (calculatedTotal <= 0) {
        throw new Error('El monto total del documento debe ser mayor a $0.00.');
      }

      if (editingPurchase) {
        updatePurchase(editingPurchase.id, {
          date,
          documentType: docType,
          supplierId: selectedSupplierId || undefined,
          supplierNrc,
          supplierName: supplierName || 'Proveedor',
          supplierNit,
          supplierEmail,
          documentNumber: documentNumber.trim(),
          description: description.trim() || 'Compra de insumos / mercadería',
          taxableAmount,
          exemptAmount,
          noSujetaAmount,
          ivaCredit,
          ivaWithheld,
          ivaPerceived,
          total: calculatedTotal,
          paidAmount: paymentMethod === 'Contado' ? calculatedTotal : (editingPurchase.paidAmount || 0),
          paymentMethod
        });
        showNotificationMsg(`Compra #${editingPurchase.correlative} actualizada exitosamente.`);
      } else {
        const newRecord = addPurchase({
          date,
          documentType: docType,
          supplierId: selectedSupplierId || undefined,
          supplierNrc,
          supplierName: supplierName || 'Proveedor',
          supplierNit,
          supplierEmail,
          documentNumber: documentNumber.trim(),
          description: description.trim() || 'Compra de insumos / mercadería',
          taxableAmount,
          exemptAmount,
          noSujetaAmount,
          ivaCredit,
          ivaWithheld,
          ivaPerceived,
          total: calculatedTotal,
          paymentMethod,
          status: 'Registrada'
        });
        showNotificationMsg(`Compra registrada exitosamente. Correlativo interno #${newRecord.correlative}`);
      }

      resetForm();
    } catch (err: any) {
      showNotificationMsg(err.message || 'Error al procesar la compra.', true);
    }
  };

  const handleStartEdit = (p: PurchaseRecord) => {
    setEditingPurchase(p);
    setDate(p.date);
    setDocType(p.documentType);
    setSelectedSupplierId(p.supplierId || '');
    setSupplierNrc(p.supplierNrc);
    setSupplierName(p.supplierName || '');
    setSupplierNit(p.supplierNit || '');
    setSupplierEmail(p.supplierEmail || '');
    setDocumentNumber(p.documentNumber);
    setDescription(p.description || '');
    setTaxableAmount(p.taxableAmount);
    setExemptAmount(p.exemptAmount);
    setNoSujetaAmount(p.noSujetaAmount || 0);
    setIvaCredit(p.ivaCredit);
    setIsManualIva(true);
    setIvaWithheld(p.ivaWithheld || 0);
    setIvaPerceived(p.ivaPerceived || 0);
    setPaymentMethod(p.paymentMethod || 'Contado');

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmId) return;
    deletePurchase(deleteConfirmId);
    showNotificationMsg('Registro de compra eliminado.');
    setDeleteConfirmId(null);
  };

  const filteredPurchases = useMemo(() => {
    return [...state.purchaseRecords]
      .filter(p => {
        if (filterMonth !== 'all') {
          const d = parseLocalDate(p.date);
          if (d.getMonth() + 1 !== Number(filterMonth)) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchSup = (p.supplierName || '').toLowerCase().includes(q);
          const matchNrc = (p.supplierNrc || '').toLowerCase().includes(q);
          const matchDoc = p.documentNumber.toLowerCase().includes(q);
          const matchDesc = (p.description || '').toLowerCase().includes(q);
          return matchSup || matchNrc || matchDoc || matchDesc;
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [state.purchaseRecords, filterMonth, searchQuery]);

  return (
    <div className="space-y-6">
      
      {/* Notifications */}
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

      {/* Delete Confirmation */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-lg text-slate-900">Confirmar Eliminación</h3>
            </div>
            <p className="text-sm text-slate-600 mb-5">
              ¿Desea eliminar este registro de compra? Se actualizará el Libro de Compras y el cálculo del Crédito Fiscal.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700"
              >
                Eliminar Compra
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Purchase Entry Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        <div className="px-6 py-4 bg-[#0f172a] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">
                {editingPurchase ? `Modificando Compra #${editingPurchase.correlative}` : 'Registro de Compras e Insumos'}
              </h2>
              <p className="text-xs text-slate-400">
                Ingreso de comprobantes de crédito fiscal de proveedores para el Libro de Compras.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={quickJsonInputRef}
              type="file"
              multiple
              accept=".json,application/json"
              onChange={handleQuickJsonUpload}
              className="hidden"
            />
            <button
              type="button"
              id="purchases-quick-upload-json-btn"
              onClick={() => quickJsonInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 border border-blue-500/30 flex items-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>Cargar JSON Compras</span>
            </button>

            {editingPurchase && (
              <button
                onClick={resetForm}
                className="px-3 py-1 text-xs font-semibold rounded bg-slate-800 text-slate-300 hover:text-white"
              >
                Cancelar Edición
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {editingPurchase && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-amber-900 text-xs font-semibold shadow-xs animate-pulse">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Modo Edición:</strong> Modificando Compra #{editingPurchase.correlative} - Documento: <span className="font-mono">{editingPurchase.documentNumber}</span> ({editingPurchase.supplierName})
                </span>
              </div>
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-lg text-xs font-bold transition-colors"
              >
                Cancelar Edición
              </button>
            </div>
          )}
          
          {/* Row 1: Date, Doc Type, Doc Number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Fecha del Documento *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tipo de Comprobante *
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentTypePurchase)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="CCF">Crédito Fiscal (CCF Proveedor)</option>
                <option value="DUI">Documento Único de Importación (DUI)</option>
                <option value="NC">Nota de Crédito Recibida</option>
                <option value="Otros">Otros Documentos Fiscales</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                N° Documento Proveedor *
              </label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="Ej. CCF-84920"
                required
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 font-mono font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Row 2: Supplier Selection Box */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-200 pb-2">
              <Truck className="w-4 h-4 text-indigo-600" />
              Datos del Proveedor Emisor
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Seleccionar Proveedor Registrado
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => handleSupplierChange(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  <option value="">-- Proveedor Nuevo / Manual --</option>
                  {state.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} (NRC: {s.nrc})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nombre / Razón Social del Proveedor *
                </label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  placeholder="Nombre de la empresa proveedora"
                  required
                  className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    NRC Proveedor *
                  </label>
                  <input
                    type="text"
                    value={supplierNrc}
                    onChange={(e) => setSupplierNrc(e.target.value)}
                    placeholder="123456-7"
                    required
                    className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 font-mono focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    NIT Proveedor
                  </label>
                  <input
                    type="text"
                    value={supplierNit}
                    onChange={(e) => setSupplierNit(e.target.value)}
                    placeholder="0614-..."
                    className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 font-mono focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: Taxable Amounts Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Compra Gravada ($ Base) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={taxableAmount || ''}
                onChange={(e) => handleTaxableChange(Number(e.target.value))}
                placeholder="0.00"
                className="w-full text-sm font-mono font-bold rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Compra Exenta ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={exemptAmount || ''}
                onChange={(e) => setExemptAmount(Number(e.target.value))}
                placeholder="0.00"
                className="w-full text-sm font-mono rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Compra No Sujeta ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={noSujetaAmount || ''}
                onChange={(e) => setNoSujetaAmount(Number(e.target.value))}
                placeholder="0.00"
                className="w-full text-sm font-mono rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          {/* Row 4: Tax Adjustments (IVA Crédito, Retención, Percepción) */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-indigo-700 uppercase">
                  IVA Crédito (13%)
                </label>
                <button
                  type="button"
                  onClick={() => setIsManualIva(!isManualIva)}
                  className="text-[10px] text-indigo-700 underline font-medium"
                >
                  {isManualIva ? 'Auto (13%)' : 'Manual'}
                </button>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                value={ivaCredit || ''}
                onChange={(e) => {
                  setIsManualIva(true);
                  setIvaCredit(Number(e.target.value));
                }}
                disabled={!isManualIva}
                className={`w-full text-sm font-mono font-bold rounded-lg border px-3 py-2 ${
                  isManualIva ? 'bg-white border-indigo-400 text-indigo-800' : 'bg-slate-100 border-slate-300 text-indigo-700'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                (-) Retención IVA (1% / 2%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={ivaWithheld || ''}
                onChange={(e) => setIvaWithheld(Number(e.target.value))}
                placeholder="0.00"
                className="w-full text-sm font-mono rounded-lg border border-slate-300 px-3 py-2 bg-white text-rose-600 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                (+) Percepción IVA (1%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={ivaPerceived || ''}
                onChange={(e) => setIvaPerceived(Number(e.target.value))}
                placeholder="0.00"
                className="w-full text-sm font-mono rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-700 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-900 uppercase mb-1">
                TOTAL DOCUMENTO ($)
              </label>
              <div className="text-base font-black font-mono text-indigo-700 bg-white border-2 border-indigo-600 rounded-lg px-3 py-1.5 text-right">
                {formatCurrency(calculatedTotal)}
              </div>
            </div>
          </div>

          {/* Row 5: Notes & Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Concepto / Descripción del Gasto o Compra
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej. Suministro de papelería, combustible, repuestos..."
                className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Condición de Pago
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none"
              >
                <option value="Contado">Contado</option>
                <option value="Crédito">Crédito</option>
                <option value="Transferencia">Transferencia</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
            >
              Limpiar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{editingPurchase ? 'Guardar Cambios' : 'Registrar Compra'}</span>
            </button>
          </div>

        </form>
      </div>

      {/* Purchases Registry Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-slate-900">
              Registro de Compras
            </h3>
            <p className="text-xs text-slate-500">
              Historial de comprobantes de crédito fiscal e importaciones para deducción de IVA.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar proveedor, doc o NRC..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-slate-700 outline-none"
            >
              <option value="all">Todos los Meses</option>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  Mes {i + 1}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredPurchases.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <ShoppingCart className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">No hay compras registradas con los filtros actuales.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0f172a] text-white font-semibold uppercase">
                <tr>
                  <th className="px-3 py-2.5">Corr. Int</th>
                  <th className="px-3 py-2.5">Fecha</th>
                  <th className="px-3 py-2.5">Proveedor</th>
                  <th className="px-3 py-2.5">NRC</th>
                  <th className="px-3 py-2.5">Doc. N°</th>
                  <th className="px-3 py-2.5 text-right">Gravado</th>
                  <th className="px-3 py-2.5 text-right">IVA Crédito</th>
                  <th className="px-3 py-2.5 text-right">Total</th>
                  <th className="px-3 py-2.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredPurchases.map((purchase) => (
                  <tr key={purchase.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2.5 font-mono font-bold text-slate-900">
                      {purchase.correlative}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-600">
                      {purchase.date}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-slate-900 max-w-[200px] truncate" title={purchase.supplierName}>
                      {purchase.supplierName || 'Proveedor'}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-600">
                      {purchase.supplierNrc}
                    </td>
                    <td className="px-3 py-2.5 font-mono font-bold text-indigo-700">
                      {purchase.documentNumber}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                      {formatCurrency(purchase.taxableAmount, false)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-indigo-600 font-semibold">
                      {formatCurrency(purchase.ivaCredit, false)}
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                      {formatCurrency(purchase.total)}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleStartEdit(purchase)}
                          className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                          title="Editar Compra"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(purchase.id)}
                          className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
