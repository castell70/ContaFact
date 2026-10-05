import React, { useState, useMemo } from 'react';
import { 
  AppState, 
  SaleRecord, 
  PurchaseRecord, 
  PaymentRecord, 
  PaymentMethod 
} from '../../types';
import { 
  addPayment, 
  getCurrencyConfig 
} from '../../services/dataStore';
import { 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  DollarSign, 
  Search, 
  Filter, 
  FileText, 
  UserCheck, 
  Building2, 
  Plus, 
  History, 
  X, 
  Receipt 
} from 'lucide-react';

interface PaymentsManagerProps {
  state: AppState;
}

export const PaymentsManager: React.FC<PaymentsManagerProps> = ({ state }) => {
  const currency = getCurrencyConfig();
  const [activeTab, setActiveTab] = useState<'cxc' | 'cxp' | 'history'>('cxc');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'overdue' | 'paid'>('pending');

  // Modal State for Recording Payment
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<{
    type: 'Cobro_Cliente' | 'Pago_Proveedor';
    referenceId: string;
    documentNumber: string;
    entityName: string;
    totalAmount: number;
    pendingAmount: number;
  } | null>(null);

  // Form State
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Transferencia');
  const [bankOrAccount, setBankOrAccount] = useState('Banco Agrícola - Cta Corriente');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Accounts Receivable (CxC) data
  const cxcList = useMemo(() => {
    return state.salesRecords.map(sale => {
      const paid = sale.paidAmount || 0;
      const balance = Math.max(0, Math.round((sale.total - paid) * 100) / 100);
      const isPaid = balance === 0;
      const isOverdue = !isPaid && sale.dueDate ? sale.dueDate < todayStr : false;

      return {
        ...sale,
        paid,
        balance,
        isPaid,
        isOverdue
      };
    });
  }, [state.salesRecords, todayStr]);

  // Accounts Payable (CxP) data
  const cxpList = useMemo(() => {
    return state.purchaseRecords.map(purchase => {
      const paid = purchase.paidAmount || 0;
      const balance = Math.max(0, Math.round((purchase.total - paid) * 100) / 100);
      const isPaid = balance === 0;
      const isOverdue = !isPaid && purchase.dueDate ? purchase.dueDate < todayStr : false;

      return {
        ...purchase,
        paid,
        balance,
        isPaid,
        isOverdue
      };
    });
  }, [state.purchaseRecords, todayStr]);

  // Metrics
  const totalCxCPending = cxcList.filter(s => s.status !== 'Anulada').reduce((s, c) => s + c.balance, 0);
  const totalCxCOverdue = cxcList.filter(s => s.status !== 'Anulada' && s.isOverdue).reduce((s, c) => s + c.balance, 0);
  const totalCxPPending = cxpList.filter(p => p.status !== 'Anulada').reduce((s, c) => s + c.balance, 0);
  const totalCxPOverdue = cxpList.filter(p => p.status !== 'Anulada' && p.isOverdue).reduce((s, c) => s + c.balance, 0);

  // Filtered CxC
  const filteredCxC = useMemo(() => {
    return cxcList.filter(item => {
      if (item.status === 'Anulada') return false;
      const matchSearch = (item.clientName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.correlative.toString().includes(searchTerm) ||
                          (item.clientNrc || '').includes(searchTerm);
      let matchStatus = true;
      if (statusFilter === 'pending') matchStatus = item.balance > 0;
      if (statusFilter === 'overdue') matchStatus = item.isOverdue;
      if (statusFilter === 'paid') matchStatus = item.isPaid;

      return matchSearch && matchStatus;
    });
  }, [cxcList, searchTerm, statusFilter]);

  // Filtered CxP
  const filteredCxP = useMemo(() => {
    return cxpList.filter(item => {
      if (item.status === 'Anulada') return false;
      const matchSearch = (item.supplierName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.documentNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.supplierNrc || '').includes(searchTerm);
      let matchStatus = true;
      if (statusFilter === 'pending') matchStatus = item.balance > 0;
      if (statusFilter === 'overdue') matchStatus = item.isOverdue;
      if (statusFilter === 'paid') matchStatus = item.isPaid;

      return matchSearch && matchStatus;
    });
  }, [cxpList, searchTerm, statusFilter]);

  // Open Payment Modal
  const handleOpenPaymentModal = (
    type: 'Cobro_Cliente' | 'Pago_Proveedor',
    refId: string,
    docNum: string,
    entity: string,
    total: number,
    pending: number
  ) => {
    setPaymentTarget({
      type,
      referenceId: refId,
      documentNumber: docNum,
      entityName: entity,
      totalAmount: total,
      pendingAmount: pending
    });
    setPaymentAmount(pending);
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setPaymentMethod('Transferencia');
    setReferenceNumber(`REF-${Math.floor(100000 + Math.random() * 900000)}`);
    setPaymentNotes('');
    setIsPaymentModalOpen(true);
  };

  // Submit Payment
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTarget || paymentAmount <= 0) return;

    addPayment({
      type: paymentTarget.type,
      referenceId: paymentTarget.referenceId,
      documentNumber: paymentTarget.documentNumber,
      entityName: paymentTarget.entityName,
      date: paymentDate,
      amount: Number(paymentAmount),
      paymentMethod,
      bankOrAccount,
      referenceNumber,
      notes: paymentNotes
    });

    setIsPaymentModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-indigo-600" />
            Cuentas por Cobrar y Pagar (CxC / CxP)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Control de cartera de clientes, pagos a proveedores, vencimientos de crédito y conciliación de saldos.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">CxC Pendiente (Clientes)</p>
            <p className="text-2xl font-bold text-indigo-600 mt-1">
              {currency.symbol} {totalCxCPending.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Cartera total por cobrar</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
            <ArrowDownLeft className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">CxC Vencida / En Mora</p>
            <p className="text-2xl font-bold text-rose-600 mt-1">
              {currency.symbol} {totalCxCOverdue.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-rose-500 mt-0.5">Requiere gestión de cobro</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">CxP Pendiente (Proveedores)</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">
              {currency.symbol} {totalCxPPending.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">Compromisos comerciales</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700">
            <ArrowUpRight className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">CxP Vencida a Pagar</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">
              {currency.symbol} {totalCxPOverdue.toLocaleString('es-SV', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-amber-600/80 mt-0.5">Facturas fuera de plazo</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setActiveTab('cxc')}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'cxc'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          Cuentas por Cobrar ({filteredCxC.filter(c => c.balance > 0).length} pendientes)
        </button>

        <button
          onClick={() => setActiveTab('cxp')}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'cxp'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Cuentas por Pagar ({filteredCxP.filter(c => c.balance > 0).length} pendientes)
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <History className="w-4 h-4" />
          Historial de Cobros y Pagos ({state.paymentRecords.length})
        </button>
      </div>

      {/* TAB 1: CUENTAS POR COBRAR */}
      {activeTab === 'cxc' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/50">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por cliente, documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Estado:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="pending">Con Saldo Pendiente</option>
                <option value="overdue">Solo Vencidas</option>
                <option value="paid">Totalmente Pagadas</option>
                <option value="all">Todas las Facturas</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Doc / N°</th>
                  <th className="py-3 px-4">Fecha Emisión</th>
                  <th className="py-3 px-4">Cliente / Razón Social</th>
                  <th className="py-3 px-4">Vencimiento</th>
                  <th className="py-3 px-4 text-right">Monto Total</th>
                  <th className="py-3 px-4 text-right">Cobrado</th>
                  <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCxC.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400">
                      No hay registros de cuentas por cobrar según el filtro.
                    </td>
                  </tr>
                ) : (
                  filteredCxC.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        <span className="font-bold text-indigo-600">{sale.documentType}</span> #{sale.correlative}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{sale.date}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {sale.clientName || 'Consumidor Final'}
                        {sale.clientNrc && <span className="text-[11px] font-normal text-slate-400 block">NRC: {sale.clientNrc}</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {sale.dueDate || 'Contado'}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        {currency.symbol} {sale.total.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-600">
                        {currency.symbol} {sale.paid.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-indigo-700 text-sm">
                        {currency.symbol} {sale.balance.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {sale.isPaid ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold">PAGADA</span>
                        ) : sale.isOverdue ? (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded text-[10px] font-bold">VENCIDA</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold">AL DÍA</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {sale.balance > 0 && (
                          <button
                            onClick={() => handleOpenPaymentModal(
                              'Cobro_Cliente',
                              sale.id,
                              `${sale.documentType} #${sale.correlative}`,
                              sale.clientName || 'Cliente',
                              sale.total,
                              sale.balance
                            )}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded transition-colors flex items-center gap-1 shadow-2xs mx-auto"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            Abonar
                          </button>
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

      {/* TAB 2: CUENTAS POR PAGAR */}
      {activeTab === 'cxp' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/50">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por proveedor, N° documento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Estado:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="pending">Con Saldo Pendiente</option>
                <option value="overdue">Solo Vencidas</option>
                <option value="paid">Totalmente Pagadas</option>
                <option value="all">Todas las Facturas</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">N° Factura Proveedor</th>
                  <th className="py-3 px-4">Fecha Emisión</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-4">Vencimiento</th>
                  <th className="py-3 px-4 text-right">Total Factura</th>
                  <th className="py-3 px-4 text-right">Pagado</th>
                  <th className="py-3 px-4 text-right">Saldo a Pagar</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCxP.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-10 text-slate-400">
                      No hay registros de cuentas por pagar según el filtro.
                    </td>
                  </tr>
                ) : (
                  filteredCxP.map(purchase => (
                    <tr key={purchase.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-medium text-slate-700">
                        {purchase.documentNumber}
                      </td>
                      <td className="py-3 px-4 text-slate-600">{purchase.date}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {purchase.supplierName}
                        {purchase.supplierNrc && <span className="text-[11px] font-normal text-slate-400 block">NRC: {purchase.supplierNrc}</span>}
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {purchase.dueDate || 'Contado'}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-800">
                        {currency.symbol} {purchase.total.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-emerald-600">
                        {currency.symbol} {purchase.paid.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 text-sm">
                        {currency.symbol} {purchase.balance.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {purchase.isPaid ? (
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold">PAGADA</span>
                        ) : purchase.isOverdue ? (
                          <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded text-[10px] font-bold">VENCIDA</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-[10px] font-bold">PENDIENTE</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {purchase.balance > 0 && (
                          <button
                            onClick={() => handleOpenPaymentModal(
                              'Pago_Proveedor',
                              purchase.id,
                              purchase.documentNumber,
                              purchase.supplierName || 'Proveedor',
                              purchase.total,
                              purchase.balance
                            )}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-900 rounded transition-colors flex items-center gap-1 shadow-2xs mx-auto"
                          >
                            <DollarSign className="w-3.5 h-3.5" />
                            Pagar
                          </button>
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

      {/* TAB 3: HISTORIAL DE PAGOS Y COBROS */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Receipt className="w-4 h-4 text-indigo-600" />
              Libro Auxiliar de Cobros y Desembolsos
            </h3>
            <span className="text-xs text-slate-500">
              Total recibos y pagos: {state.paymentRecords.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Tipo</th>
                  <th className="py-3 px-4">Tercero / Razón Social</th>
                  <th className="py-3 px-4">Doc. Aplicado</th>
                  <th className="py-3 px-4">Forma de Pago</th>
                  <th className="py-3 px-4">Banco / Referencia</th>
                  <th className="py-3 px-4 text-right">Monto</th>
                  <th className="py-3 px-4">Notas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {state.paymentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-slate-400">
                      Aún no se han registrado abonos o cancelaciones en el sistema.
                    </td>
                  </tr>
                ) : (
                  state.paymentRecords.map(pay => (
                    <tr key={pay.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono text-slate-600">{pay.date}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          pay.type === 'Cobro_Cliente' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-800'
                        }`}>
                          {pay.type === 'Cobro_Cliente' ? 'COBRO (+)' : 'PAGO (-)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-900">{pay.entityName}</td>
                      <td className="py-3 px-4 font-mono text-slate-700">{pay.documentNumber}</td>
                      <td className="py-3 px-4 text-slate-600">{pay.paymentMethod}</td>
                      <td className="py-3 px-4 text-slate-600">
                        <span>{pay.bankOrAccount}</span>
                        {pay.referenceNumber && <span className="text-[11px] font-mono text-slate-400 block">{pay.referenceNumber}</span>}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${
                        pay.type === 'Cobro_Cliente' ? 'text-emerald-600' : 'text-slate-900'
                      }`}>
                        {currency.symbol} {pay.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px]">{pay.notes || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* REGISTRATION PAYMENT MODAL */}
      {isPaymentModalOpen && paymentTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-600" />
                {paymentTarget.type === 'Cobro_Cliente' ? 'Registrar Cobro de Cliente' : 'Registrar Pago a Proveedor'}
              </h2>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="mt-4 space-y-4 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div className="flex justify-between items-center text-slate-600 mb-1">
                  <span>Documento:</span>
                  <span className="font-mono font-bold text-slate-900">{paymentTarget.documentNumber}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 mb-1">
                  <span>Tercero:</span>
                  <span className="font-semibold text-slate-900">{paymentTarget.entityName}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600 pt-2 border-t border-slate-200">
                  <span>Saldo Pendiente:</span>
                  <span className="text-base font-bold text-indigo-600">
                    {currency.symbol} {paymentTarget.pendingAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Monto del Abono / Pago *</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  max={paymentTarget.pendingAmount}
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono text-base font-bold text-emerald-600 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Fecha de Pago</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Forma de Pago</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="Transferencia">Transferencia Bancaria</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Tarjeta">Tarjeta Débito/Crédito</option>
                    <option value="Contado">Efectivo / Caja General</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Cuenta / Banco</label>
                  <input
                    type="text"
                    value={bankOrAccount}
                    onChange={(e) => setBankOrAccount(e.target.value)}
                    placeholder="Banco Agrícola, Cuscatlán..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">N° Comprobante / Ref</label>
                  <input
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="N° Depósito o Cheque"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Notas / Observaciones</label>
                <textarea
                  rows={2}
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="Detalles sobre el pago o confirmación bancaria..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Aplicar Transacción
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
