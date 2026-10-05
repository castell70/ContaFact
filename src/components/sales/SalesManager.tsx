import React, { useState, useMemo, useRef } from 'react';
import { 
  PlusCircle, 
  Receipt, 
  Search, 
  Printer, 
  Edit3, 
  FileEdit,
  Trash2, 
  FileText, 
  UserCheck, 
  DollarSign, 
  Calendar,
  Layers,
  Save,
  X,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Upload
} from 'lucide-react';
import { AppState, SaleRecord, SalesItem, DocumentTypeSale, PaymentMethod, Client } from '../../types';
import { addSale, updateSale, deleteSale, calculateVat, VAT_RATE, getNextCorrelatives, RETENTION_RATE, parseSalesFromJson, importSalesFromJsonData } from '../../services/dataStore';
import { formatCurrency, parseLocalDate } from '../../utils/numberToWords';

interface SalesManagerProps {
  state: AppState;
  selectedMonth: number;
  selectedYear: number;
  onViewInvoice: (sale: SaleRecord) => void;
}

export const SalesManager: React.FC<SalesManagerProps> = ({
  state,
  selectedMonth,
  selectedYear,
  onViewInvoice
}) => {
  const [docType, setDocType] = useState<DocumentTypeSale>('CCF');
  const [date, setDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [clientNrc, setClientNrc] = useState<string>('');
  const [clientName, setClientName] = useState<string>('');
  const [clientNit, setClientNit] = useState<string>('');
  const [clientAddress, setClientAddress] = useState<string>('');
  const [clientActivity, setClientActivity] = useState<string>('');
  const [isGranContribuyenteClient, setIsGranContribuyenteClient] = useState<boolean>(false);
  const [dteCode, setDteCode] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Contado');
  const [paymentDays, setPaymentDays] = useState<number>(30);
  
  // Dynamic Items for CCF / CF
  const [items, setItems] = useState<SalesItem[]>([
    { id: '1', qty: 1, desc: '', price: 0, type: 'gravada', subtotal: 0 }
  ]);

  // Direct CF input (gross total)
  const [cfGrossTotal, setCfGrossTotal] = useState<number>(0);
  const [cfQuantity, setCfQuantity] = useState<number>(1);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterDocType, setFilterDocType] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');

  // Inline editing state
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);

  // Deletion confirmation modal
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; isError?: boolean } | null>(null);

  // Quick JSON Upload (supports single or multiple / bulk files)
  const quickJsonInputRef = useRef<HTMLInputElement>(null);
  const handleQuickJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray: File[] = Array.from(files);
    const allValidSales: Partial<SaleRecord>[] = [];
    const errors: string[] = [];

    for (const file of fileArray) {
      try {
        const text = await file.text();
        const json = JSON.parse(text);
        const parsed = parseSalesFromJson(json);
        if (parsed.valid.length > 0) {
          allValidSales.push(...parsed.valid);
        } else {
          errors.push(`${file.name}: sin ventas válidas`);
        }
      } catch (err: any) {
        errors.push(`${file.name}: ${err.message}`);
      }
    }

    if (allValidSales.length > 0) {
      const count = importSalesFromJsonData(allValidSales, 'append');
      showNotificationMsg(`¡Éxito! Se importaron ${count} ventas desde ${fileArray.length} archivo(s) JSON.`);
    } else {
      showNotificationMsg(`No se detectaron ventas válidas en los archivos seleccionados. ${errors.join(', ')}`, true);
    }
    e.target.value = '';
  };

  const nextCorrelatives = getNextCorrelatives();
  const currentNextNumber = docType === 'CCF' ? nextCorrelatives.salesCCF : nextCorrelatives.salesCF;

  // Handle Client selection
  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    if (!clientId) {
      setClientNrc('');
      setClientName('');
      setClientNit('');
      setClientAddress('');
      setClientActivity('');
      setIsGranContribuyenteClient(false);
      return;
    }

    const client = state.clients.find(c => c.id === clientId);
    if (client) {
      setClientNrc(client.nrc || '');
      setClientName(client.name);
      setClientNit(client.nit || '');
      setClientAddress(client.address || '');
      setClientActivity(client.activity || '');
      setIsGranContribuyenteClient(!!client.isGranContribuyente);
    }
  };

  // Item handlers
  const handleAddItem = () => {
    setItems([
      ...items,
      { id: Date.now().toString(), qty: 1, desc: '', price: 0, type: 'gravada', subtotal: 0 }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    const next = [...items];
    next.splice(index, 1);
    setItems(next);
  };

  const handleItemChange = (index: number, field: keyof SalesItem, value: any) => {
    const next = [...items];
    const item = { ...next[index], [field]: value };
    if (field === 'qty' || field === 'price') {
      item.subtotal = Math.round((Number(item.qty || 0) * Number(item.price || 0)) * 100) / 100;
    }
    next[index] = item;
    setItems(next);
  };

  // Calculated subtotals for CCF
  const calculatedTaxable = useMemo(() => {
    return items
      .filter(it => it.type === 'gravada')
      .reduce((sum, it) => sum + (Number(it.qty || 0) * Number(it.price || 0)), 0);
  }, [items]);

  const calculatedExempt = useMemo(() => {
    return items
      .filter(it => it.type === 'exenta')
      .reduce((sum, it) => sum + (Number(it.qty || 0) * Number(it.price || 0)), 0);
  }, [items]);

  const calculatedNoSujeta = useMemo(() => {
    return items
      .filter(it => it.type === 'noSujeta')
      .reduce((sum, it) => sum + (Number(it.qty || 0) * Number(it.price || 0)), 0);
  }, [items]);

  const calculatedIvaDebit = useMemo(() => {
    if (docType === 'CCF') {
      return calculateVat(calculatedTaxable);
    } else {
      if (cfGrossTotal > 0) {
        const base = Math.round((cfGrossTotal / (1 + VAT_RATE)) * 100) / 100;
        return Math.round((cfGrossTotal - base) * 100) / 100;
      }
      return calculateVat(calculatedTaxable);
    }
  }, [docType, calculatedTaxable, cfGrossTotal]);

  // Retención 1% si el cliente es Gran Contribuyente y es CCF mayor a $100
  const calculatedRetention = useMemo(() => {
    if (docType === 'CCF' && isGranContribuyenteClient && calculatedTaxable >= 100) {
      return Math.round(calculatedTaxable * RETENTION_RATE * 100) / 100;
    }
    return 0;
  }, [docType, isGranContribuyenteClient, calculatedTaxable]);

  const calculatedGrandTotal = useMemo(() => {
    if (docType === 'CCF') {
      return Math.round((calculatedTaxable + calculatedExempt + calculatedNoSujeta + calculatedIvaDebit - calculatedRetention) * 100) / 100;
    } else {
      return cfGrossTotal > 0 ? cfGrossTotal : Math.round((calculatedTaxable + calculatedExempt + calculatedNoSujeta + calculatedIvaDebit) * 100) / 100;
    }
  }, [docType, calculatedTaxable, calculatedExempt, calculatedNoSujeta, calculatedIvaDebit, calculatedRetention, cfGrossTotal]);

  // Reset form
  const resetForm = () => {
    setDocType('CCF');
    setDate(new Date().toISOString().substring(0, 10));
    setSelectedClientId('');
    setClientNrc('');
    setClientName('');
    setClientNit('');
    setClientAddress('');
    setClientActivity('');
    setIsGranContribuyenteClient(false);
    setDteCode('');
    setDescription('');
    setPaymentMethod('Contado');
    setPaymentDays(30);
    setItems([{ id: '1', qty: 1, desc: '', price: 0, type: 'gravada', subtotal: 0 }]);
    setCfGrossTotal(0);
    setCfQuantity(1);
    setEditingSale(null);
  };

  const showNotificationMsg = (message: string, isError = false) => {
    setNotification({ message, isError });
    setTimeout(() => setNotification(null), 5000);
  };

  // Submit new or updated Sale
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (docType === 'CCF' && !clientNrc) {
        throw new Error('El Comprobante de Crédito Fiscal (CCF) requiere obligatoriamente el NRC del cliente.');
      }

      if (docType === 'CCF' && calculatedGrandTotal <= 0) {
        throw new Error('Debe ingresar al menos un ítem con valor mayor a $0.00 para emitir la factura CCF.');
      }

      if (docType === 'CF' && calculatedGrandTotal <= 0) {
        throw new Error('Debe especificar el monto total de la venta a Consumidor Final.');
      }

      const desc = description.trim() || (items[0]?.desc ? items[0].desc : 'Venta de productos / servicios comerciales');

      // Prepared items
      let validItems = items.filter(it => it.desc.trim() !== '' || it.price > 0);
      if (docType === 'CF' && validItems.length === 0) {
        const base = Math.round((calculatedGrandTotal / (1 + VAT_RATE)) * 100) / 100;
        validItems = [{
          id: '1',
          qty: cfQuantity || 1,
          desc,
          price: Math.round((base / (cfQuantity || 1)) * 100) / 100,
          type: 'gravada',
          subtotal: base
        }];
      }

      if (editingSale) {
        updateSale(editingSale.id, {
          date,
          documentType: docType,
          clientId: selectedClientId || undefined,
          clientNrc,
          clientName: clientName || (docType === 'CF' ? 'Consumidor Final' : 'Cliente'),
          clientNit,
          clientAddress,
          clientActivity,
          dteCode: dteCode || editingSale.dteCode,
          description: desc,
          items: validItems,
          taxableAmount: docType === 'CCF' ? calculatedTaxable : Math.round((calculatedGrandTotal / (1 + VAT_RATE)) * 100) / 100,
          exemptAmount: docType === 'CCF' ? calculatedExempt : 0,
          noSujetaAmount: docType === 'CCF' ? calculatedNoSujeta : 0,
          ivaDebit: calculatedIvaDebit,
          ivaRetenido: calculatedRetention,
          total: calculatedGrandTotal,
          paidAmount: paymentMethod === 'Contado' || paymentMethod === 'Tarjeta' ? calculatedGrandTotal : editingSale.paidAmount,
          paymentMethod,
          paymentDays: paymentMethod === 'Crédito' ? paymentDays : undefined
        });
        showNotificationMsg(`Venta #${editingSale.correlative} actualizada exitosamente.`);
      } else {
        const newRecord = addSale({
          date,
          documentType: docType,
          clientId: selectedClientId || undefined,
          clientNrc,
          clientName: clientName || (docType === 'CF' ? 'Consumidor Final' : 'Cliente'),
          clientNit,
          clientAddress,
          clientActivity,
          dteCode: dteCode || `DTE-${docType === 'CCF' ? '03' : '01'}-${currentNextNumber}`,
          description: desc,
          items: validItems,
          taxableAmount: docType === 'CCF' ? calculatedTaxable : Math.round((calculatedGrandTotal / (1 + VAT_RATE)) * 100) / 100,
          exemptAmount: docType === 'CCF' ? calculatedExempt : 0,
          noSujetaAmount: docType === 'CCF' ? calculatedNoSujeta : 0,
          ivaRetenido: calculatedRetention,
          total: calculatedGrandTotal,
          paymentMethod,
          paymentDays: paymentMethod === 'Crédito' ? paymentDays : undefined,
          status: 'Emitida'
        });
        showNotificationMsg(`Venta registrada exitosamente. ${docType} Correlativo #${newRecord.correlative}`);
      }

      resetForm();
    } catch (err: any) {
      showNotificationMsg(err.message || 'Error al procesar la venta.', true);
    }
  };

  // Start Editing
  const handleStartEdit = (sale: SaleRecord) => {
    setEditingSale(sale);
    setDocType(sale.documentType);
    setDate(sale.date);
    setSelectedClientId(sale.clientId || '');
    setClientNrc(sale.clientNrc || '');
    setClientName(sale.clientName || '');
    setClientNit(sale.clientNit || '');
    setClientAddress(sale.clientAddress || '');
    setClientActivity(sale.clientActivity || '');
    setDteCode(sale.dteCode || '');
    setDescription(sale.description || '');
    setPaymentMethod(sale.paymentMethod || 'Contado');
    setPaymentDays(sale.paymentDays || 30);
    
    if (sale.items && sale.items.length > 0) {
      setItems(sale.items);
    } else {
      setItems([{
        id: '1',
        qty: 1,
        desc: sale.description,
        price: sale.taxableAmount,
        type: 'gravada',
        subtotal: sale.taxableAmount
      }]);
    }
    setCfGrossTotal(sale.total);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Delete execution
  const handleConfirmDelete = () => {
    if (!deleteConfirmId) return;
    deleteSale(deleteConfirmId);
    showNotificationMsg('Venta eliminada exitosamente.');
    setDeleteConfirmId(null);
  };

  // Filtered Sales Table
  const filteredSales = useMemo(() => {
    return [...state.salesRecords]
      .filter(s => {
        // Doc type filter
        if (filterDocType !== 'all' && s.documentType !== filterDocType) return false;
        // Month filter
        if (filterMonth !== 'all') {
          const d = parseLocalDate(s.date);
          if (d.getMonth() + 1 !== Number(filterMonth)) return false;
        }
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchClient = (s.clientName || '').toLowerCase().includes(q);
          const matchNrc = (s.clientNrc || '').toLowerCase().includes(q);
          const matchDesc = (s.description || '').toLowerCase().includes(q);
          const matchCorr = s.correlative.toString().includes(q);
          const matchDte = (s.dteCode || '').toLowerCase().includes(q);
          return matchClient || matchNrc || matchDesc || matchCorr || matchDte;
        }
        return true;
      })
      .sort((a, b) => b.correlative - a.correlative);
  }, [state.salesRecords, filterDocType, filterMonth, searchQuery]);

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
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="font-bold text-lg text-slate-900">Confirmar Eliminación</h3>
            </div>
            <p className="text-sm text-slate-600 mb-5">
              ¿Está seguro de eliminar esta venta? Esta acción recalculará los libros oficiales de IVA y no se puede deshacer.
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
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 shadow-sm"
              >
                Sí, Eliminar Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sales Emission Form Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Form Title & Top Controls */}
        <div className="px-6 py-4 bg-[#0f172a] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">
                {editingSale ? `Modificando Venta #${editingSale.correlative}` : 'Emisión y Registro de Ventas'}
              </h2>
              <p className="text-xs text-slate-400">
                {docType === 'CCF' ? 'Comprobante de Crédito Fiscal (Requiere NRC)' : 'Factura a Consumidor Final (CF)'}
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
              id="sales-quick-upload-json-btn"
              onClick={() => quickJsonInputRef.current?.click()}
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 flex items-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cargar JSON Ventas</span>
            </button>

            {editingSale && (
              <button
                onClick={resetForm}
                className="px-3 py-1 text-xs font-semibold rounded bg-slate-800 text-slate-300 hover:text-white"
              >
                Cancelar Edición
              </button>
            )}
            <span className="px-3 py-1 rounded bg-slate-800 text-indigo-400 font-mono text-xs font-bold border border-slate-700">
              Siguiente N° {currentNextNumber}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {editingSale && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-amber-900 text-xs font-semibold shadow-xs animate-pulse">
              <div className="flex items-center gap-2">
                <FileEdit className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Modo Edición:</strong> Modificando {editingSale.documentType} #{editingSale.correlative} - Código Generación: <span className="font-mono">{editingSale.dteCode}</span>
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
          
          {/* Row 1: Document Type, Date, Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Tipo de Comprobante *
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentTypeSale)}
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              >
                <option value="CCF">Crédito Fiscal (CCF - B2B)</option>
                <option value="CF">Consumidor Final (CF - B2C)</option>
                <option value="EXP">Factura de Exportación (EXP)</option>
                <option value="NC">Nota de Crédito (NC)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Fecha de Emisión *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
              >
              </input>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Forma de Pago
              </label>
              <div className="flex gap-2">
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="flex-1 text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="Contado">Contado</option>
                  <option value="Crédito">Crédito</option>
                  <option value="Transferencia">Transferencia Bancaria</option>
                  <option value="Cheque">Cheque</option>
                  <option value="Tarjeta">Tarjeta</option>
                </select>
                {paymentMethod === 'Crédito' && (
                  <input
                    type="number"
                    min="1"
                    value={paymentDays}
                    onChange={(e) => setPaymentDays(Number(e.target.value))}
                    placeholder="Días"
                    className="w-20 text-sm rounded-lg border border-slate-300 px-2 py-2 text-center"
                    title="Plazo en días"
                  />
                )}
              </div>
            </div>

          </div>

          {/* Row 2: Client Selector & Details (Expanded for CCF) */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-indigo-600" />
                Datos del Cliente
              </span>
              {docType === 'CCF' && (
                <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded">
                  NRC Obligatorio para CCF
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Select Registered Client */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Seleccionar Cliente Frecuente
                </label>
                <select
                  value={selectedClientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none"
                >
                  <option value="">-- Cliente Manual / Consumidor --</option>
                  {state.clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.nrc ? `(NRC: ${c.nrc})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Client Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Nombre o Razón Social {docType === 'CCF' ? '*' : ''}
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder={docType === 'CF' ? 'Cliente General / Consumidor Final' : 'Nombre de la empresa cliente'}
                  required={docType === 'CCF'}
                  className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>

              {/* NRC & NIT */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    NRC {docType === 'CCF' ? '*' : ''}
                  </label>
                  <input
                    type="text"
                    value={clientNrc}
                    onChange={(e) => setClientNrc(e.target.value)}
                    placeholder="Ej. 123456-7"
                    required={docType === 'CCF'}
                    className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    NIT / DUI
                  </label>
                  <input
                    type="text"
                    value={clientNit}
                    onChange={(e) => setClientNit(e.target.value)}
                    placeholder="0614-010190..."
                    className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 px-3 py-2 bg-white text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                  />
                </div>
              </div>

            </div>

            {/* Address & DTE Code (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Dirección y Giro del Cliente
                </label>
                <input
                  type="text"
                  value={clientAddress}
                  onChange={(e) => setClientAddress(e.target.value)}
                  placeholder="Dirección completa del cliente..."
                  className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  Código DTE Electrónico (Opcional)
                </label>
                <input
                  type="text"
                  value={dteCode}
                  onChange={(e) => setDteCode(e.target.value)}
                  placeholder="Ej. DTE-03-VTA-2025-001"
                  className="w-full text-xs sm:text-sm rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-slate-900 focus:ring-1 focus:ring-indigo-500 outline-none font-mono"
                />
              </div>
            </div>

          </div>

          {/* Dynamic Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" />
                Detalle e Ítems de la Factura
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer border border-indigo-100"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Agregar Ítem</span>
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden shadow-inner">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 w-16 text-center">Cant.</th>
                    <th className="px-3 py-2">Descripción del Producto / Servicio</th>
                    <th className="px-3 py-2 w-28 text-center">Tipo</th>
                    <th className="px-3 py-2 w-28 text-right">P. Unitario ($)</th>
                    <th className="px-3 py-2 w-28 text-right">Subtotal ($)</th>
                    <th className="px-2 py-2 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {items.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="p-2 text-center">
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={item.qty}
                          onChange={(e) => handleItemChange(idx, 'qty', Number(e.target.value))}
                          className="w-14 text-center font-mono font-semibold rounded border border-slate-300 px-1 py-1 text-xs"
                        />
                      </td>
                      <td className="p-2">
                        <input
                          type="text"
                          value={item.desc}
                          onChange={(e) => handleItemChange(idx, 'desc', e.target.value)}
                          placeholder="Descripción detallada del producto o servicio..."
                          className="w-full rounded border border-slate-300 px-2 py-1 text-xs text-slate-900"
                        />
                      </td>
                      <td className="p-2 text-center">
                        <select
                          value={item.type}
                          onChange={(e) => handleItemChange(idx, 'type', e.target.value)}
                          className="w-full text-[11px] font-semibold rounded border border-slate-300 px-1 py-1 bg-white text-slate-700"
                        >
                          <option value="gravada">Gravada (13%)</option>
                          <option value="exenta">Exenta (0%)</option>
                          <option value="noSujeta">No Sujeta</option>
                        </select>
                      </td>
                      <td className="p-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.price}
                          onChange={(e) => handleItemChange(idx, 'price', Number(e.target.value))}
                          className="w-24 text-right font-mono font-semibold rounded border border-slate-300 px-2 py-1 text-xs"
                        />
                      </td>
                      <td className="p-2 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(item.qty * item.price, false)}
                      </td>
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          disabled={items.length <= 1}
                          className="p-1 text-slate-400 hover:text-red-600 disabled:opacity-30 disabled:pointer-events-none"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Calculation Breakdown & Action Bar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-2 border-t border-slate-200">
            
            {/* Left: Optional General Notes */}
            <div className="lg:col-span-6 space-y-2">
              <label className="block text-xs font-semibold text-slate-600">
                Observaciones / Notas Adicionales del Comprobante
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Detalles adicionales, número de orden de compra, lugar de entrega, etc..."
                className="w-full text-xs rounded-lg border border-slate-300 p-2.5 bg-white text-slate-900 focus:ring-1 focus:ring-orange-500 outline-none"
              />
            </div>

            {/* Right: Tax Breakdown Summary Table */}
            <div className="lg:col-span-6 bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span className="text-slate-600 font-semibold">Subtotal Ventas Gravadas:</span>
                <span className="font-mono font-bold text-slate-900">{formatCurrency(calculatedTaxable)}</span>
              </div>
              
              {calculatedExempt > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600 font-semibold">Ventas Exentas:</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(calculatedExempt)}</span>
                </div>
              )}

              {calculatedNoSujeta > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-600 font-semibold">Ventas No Sujetas:</span>
                  <span className="font-mono font-bold text-slate-900">{formatCurrency(calculatedNoSujeta)}</span>
                </div>
              )}

              <div className="flex justify-between py-1 border-b border-slate-200 text-indigo-700">
                <span className="font-semibold">13% IVA Débito Fiscal:</span>
                <span className="font-mono font-bold">{formatCurrency(calculatedIvaDebit)}</span>
              </div>

              {calculatedRetention > 0 && (
                <div className="flex justify-between py-1 border-b border-slate-200 text-rose-600">
                  <span className="font-semibold">(-) 1% Retención Gran Contribuyente:</span>
                  <span className="font-mono font-bold">-{formatCurrency(calculatedRetention)}</span>
                </div>
              )}

              <div className="flex justify-between py-2 bg-[#0f172a] text-white px-3 rounded-lg font-black text-sm">
                <span>TOTAL A COBRAR:</span>
                <span className="font-mono text-base text-indigo-400">{formatCurrency(calculatedGrandTotal)}</span>
              </div>
            </div>

          </div>

          {/* Action Submit Buttons */}
          <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
            >
              Limpiar Formulario
            </button>

            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>{editingSale ? 'Actualizar Factura' : 'Guardar y Emitir Factura'}</span>
            </button>
          </div>

        </form>

      </div>

      {/* Sales Registry & Filter Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
        
        {/* Table Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-slate-900">
              Registro Histórico de Ventas
            </h3>
            <p className="text-xs text-slate-500">
              Comprobantes emitidos ordenados correlativamente.
            </p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por cliente, NRC o N°..."
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Doc Type Filter */}
            <select
              value={filterDocType}
              onChange={(e) => setFilterDocType(e.target.value)}
              className="text-xs font-semibold rounded-lg border border-slate-300 px-3 py-1.5 bg-white text-slate-700 outline-none"
            >
              <option value="all">Todos los Comprobantes</option>
              <option value="CCF">Solo CCF (Crédito Fiscal)</option>
              <option value="CF">Solo CF (Consumidor Final)</option>
              <option value="EXP">Solo Exportación</option>
            </select>

            {/* Month Filter */}
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

        {/* Table Content */}
        {filteredSales.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Receipt className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">No se encontraron ventas con los filtros actuales.</p>
            <p className="text-xs text-slate-400 mt-1">Utilice el formulario superior para emitir un nuevo comprobante.</p>
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#0f172a] text-white font-semibold uppercase">
                <tr>
                  <th className="px-3 py-2.5" title="Código de Generación DTE / Correlativo">CodigoGeneracion</th>
                  <th className="px-3 py-2.5">Fecha</th>
                  <th className="px-3 py-2.5">Tipo</th>
                  <th className="px-3 py-2.5">Cliente</th>
                  <th className="px-3 py-2.5">NRC</th>
                  <th className="px-3 py-2.5 text-right">Gravada</th>
                  <th className="px-3 py-2.5 text-right">IVA (13%)</th>
                  <th className="px-3 py-2.5 text-right">Total</th>
                  <th className="px-3 py-2.5 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {filteredSales.map((sale) => {
                  const isCCF = sale.documentType === 'CCF';
                  const displayCode = sale.codigoGeneracion || sale.dteCode || sale.correlative;
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-3 py-2.5 font-bold font-mono text-slate-900 max-w-[170px] truncate" title={String(displayCode)}>
                        {displayCode}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 font-mono">
                        {sale.date}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isCCF ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {sale.documentType}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 font-medium text-slate-900 max-w-[200px] truncate" title={sale.clientName}>
                        {sale.clientName || 'Consumidor Final'}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-slate-600">
                        {sale.clientNrc || 'N/A'}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-slate-700">
                        {formatCurrency(sale.taxableAmount, false)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-indigo-600 font-bold">
                        {formatCurrency(sale.ivaDebit, false)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(sale.total)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onViewInvoice(sale)}
                            className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                            title="Imprimir / Ver Comprobante"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleStartEdit(sale)}
                            className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(sale.id)}
                            className="p-1.5 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

      </div>

    </div>
  );
};
