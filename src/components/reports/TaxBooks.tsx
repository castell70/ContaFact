import React, { useState, useMemo } from 'react';
import { 
  BookOpenCheck, 
  Printer, 
  FileSpreadsheet, 
  Download, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Receipt, 
  ShoppingCart,
  Percent,
  Package,
  Clock,
  TrendingUp
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { AppState, SaleRecord, PurchaseRecord } from '../../types';
import { calculatePeriodSummary } from '../../services/taxEngine';
import { formatCurrency, parseLocalDate } from '../../utils/numberToWords';

interface TaxBooksProps {
  state: AppState;
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (m: number) => void;
  onYearChange: (y: number) => void;
}

type BookTab = 'salesCCF' | 'salesCF' | 'purchases' | 'f07Summary' | 'retentions' | 'inventoryValuation' | 'agingCxC' | 'plStatement';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const TaxBooks: React.FC<TaxBooksProps> = ({
  state,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange
}) => {
  const [activeBook, setActiveBook] = useState<BookTab>('salesCCF');

  const summary = calculatePeriodSummary(state, selectedMonth, selectedYear);
  const company = state.companyInfo;

  // Filtered period sales & purchases
  const periodSales = useMemo(() => {
    return state.salesRecords.filter(s => {
      const d = parseLocalDate(s.date);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear && s.status !== 'Anulada';
    }).sort((a, b) => a.correlative - b.correlative);
  }, [state.salesRecords, selectedMonth, selectedYear]);

  const ccfSales = useMemo(() => periodSales.filter(s => s.documentType === 'CCF'), [periodSales]);
  const cfSales = useMemo(() => periodSales.filter(s => s.documentType === 'CF'), [periodSales]);

  const periodPurchases = useMemo(() => {
    return state.purchaseRecords.filter(p => {
      const d = parseLocalDate(p.date);
      return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear && p.status !== 'Anulada';
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [state.purchaseRecords, selectedMonth, selectedYear]);

  // Retentions & Perceptions items
  const salesWithRet = useMemo(() => ccfSales.filter(s => s.ivaRetenido > 0), [ccfSales]);
  const purchasesWithRet = useMemo(() => periodPurchases.filter(p => p.ivaWithheld > 0 || p.ivaPerceived > 0), [periodPurchases]);

  // Inventory valuation
  const inventoryTotalValuation = useMemo(() => {
    return state.products.reduce((acc, p) => acc + (p.stock * p.cost), 0);
  }, [state.products]);
  const inventoryTotalSaleValue = useMemo(() => {
    return state.products.reduce((acc, p) => acc + (p.stock * p.price), 0);
  }, [state.products]);

  // CxC and CxP pending
  const pendingSales = useMemo(() => {
    return state.salesRecords.filter(s => s.paymentStatus !== 'Pagada' && s.status !== 'Anulada');
  }, [state.salesRecords]);
  const pendingPurchases = useMemo(() => {
    return state.purchaseRecords.filter(p => p.paymentStatus !== 'Pagada' && p.status !== 'Anulada');
  }, [state.purchaseRecords]);

  // Totals for CCF
  const totalCcfTaxable = ccfSales.reduce((s, r) => s + r.taxableAmount, 0);
  const totalCcfExempt = ccfSales.reduce((s, r) => s + r.exemptAmount, 0);
  const totalCcfNoSujeta = ccfSales.reduce((s, r) => s + r.noSujetaAmount, 0);
  const totalCcfIva = ccfSales.reduce((s, r) => s + r.ivaDebit, 0);
  const totalCcfRet = ccfSales.reduce((s, r) => s + r.ivaRetenido, 0);
  const totalCcfTotal = ccfSales.reduce((s, r) => s + r.total, 0);

  // Totals for CF
  const totalCfTaxable = cfSales.reduce((s, r) => s + r.taxableAmount, 0);
  const totalCfExempt = cfSales.reduce((s, r) => s + r.exemptAmount, 0);
  const totalCfIva = cfSales.reduce((s, r) => s + r.ivaDebit, 0);
  const totalCfTotal = cfSales.reduce((s, r) => s + r.total, 0);

  // Totals for Purchases
  const totalPurTaxable = periodPurchases.reduce((s, r) => s + r.taxableAmount, 0);
  const totalPurImportTax = periodPurchases.reduce((s, r) => s + (r.importTaxableAmount || 0), 0);
  const totalPurExempt = periodPurchases.reduce((s, r) => s + r.exemptAmount, 0);
  const totalPurIvaCredit = periodPurchases.reduce((s, r) => s + r.ivaCredit, 0);
  const totalPurRet = periodPurchases.reduce((s, r) => s + r.ivaWithheld, 0);
  const totalPurPerc = periodPurchases.reduce((s, r) => s + r.ivaPerceived, 0);
  const totalPurGrand = periodPurchases.reduce((s, r) => s + r.total, 0);

  // P&L calculation
  const totalIngresos = totalCcfTaxable + totalCfTaxable + totalCcfExempt + totalCfExempt;
  const totalCostos = totalPurTaxable + totalPurImportTax;
  const utilidadBruta = totalIngresos - totalCostos;

  const handlePrint = () => {
    window.print();
  };

  const exportCurrentBookToExcel = () => {
    const wb = XLSX.utils.book_new();

    if (activeBook === 'salesCCF') {
      const data = ccfSales.map((s, idx) => ({
        'N°': idx + 1,
        'Fecha': s.date,
        'N° Correlativo': s.correlative,
        'Código DTE': s.dteCode || '',
        'NRC Cliente': s.clientNrc,
        'NIT Cliente': s.clientNit || '',
        'Nombre del Cliente': s.clientName || '',
        'Ventas Exentas': s.exemptAmount,
        'Ventas No Sujetas': s.noSujetaAmount,
        'Ventas Gravadas': s.taxableAmount,
        '13% IVA Débito': s.ivaDebit,
        '1% Retención IVA': s.ivaRetenido,
        'Total Facturado': s.total
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'LIBRO_VENTAS_CCF');
    } else if (activeBook === 'salesCF') {
      const data = cfSales.map((s, idx) => ({
        'N°': idx + 1,
        'Fecha': s.date,
        'N° Correlativo': s.correlative,
        'Código DTE': s.dteCode || '',
        'Descripción / Detalle': s.description,
        'Ventas Exentas': s.exemptAmount,
        'Ventas Gravadas': s.taxableAmount,
        'IVA Débito': s.ivaDebit,
        'Total Consumidor Final': s.total
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'LIBRO_VENTAS_CF');
    } else if (activeBook === 'purchases') {
      const data = periodPurchases.map((p, idx) => ({
        'N°': idx + 1,
        'Fecha': p.date,
        'Tipo Doc': p.documentType,
        'N° Documento': p.documentNumber,
        'NRC Proveedor': p.supplierNrc,
        'NIT Proveedor': p.supplierNit || '',
        'Nombre del Proveedor': p.supplierName || '',
        'Compras Exentas Locales': p.exemptAmount,
        'Compras Gravadas Locales': p.taxableAmount,
        'Compras Gravadas Importación': p.importTaxableAmount || 0,
        '13% Crédito Fiscal': p.ivaCredit,
        'Retención IVA': p.ivaWithheld,
        'Percepción IVA': p.ivaPerceived,
        'Total Compra': p.total
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'LIBRO_COMPRAS');
    } else if (activeBook === 'inventoryValuation') {
      const data = state.products.map((p, idx) => ({
        'N°': idx + 1,
        'SKU': p.sku,
        'Nombre Producto': p.name,
        'Categoría': p.category,
        'Unidad': p.unit,
        'Stock Actual': p.stock,
        'Costo Unitario': p.cost,
        'Precio Venta': p.price,
        'Valuación Costo': p.stock * p.cost,
        'Valuación Venta': p.stock * p.price,
        'Margen Potencial ($)': (p.stock * p.price) - (p.stock * p.cost)
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'VALUACION_INVENTARIO');
    } else if (activeBook === 'agingCxC') {
      const data = pendingSales.map((s, idx) => ({
        'N°': idx + 1,
        'Fecha Emisión': s.date,
        'Comprobante': `${s.documentType} #${s.correlative}`,
        'Cliente': s.clientName,
        'Total Facturado': s.total,
        'Monto Cobrado': s.paidAmount || 0,
        'Saldo Pendiente': s.balancePending ?? s.total,
        'Estado': s.paymentStatus || 'Pendiente'
      }));
      const ws = XLSX.utils.json_to_sheet(data);
      XLSX.utils.book_append_sheet(wb, ws, 'CARTERA_CXC');
    } else {
      const f07Data = [
        ['RESUMEN DECLARACIÓN MENSUAL DE IVA (F-07)', ''],
        ['Empresa', company.name],
        ['NRC', company.nrc],
        ['NIT', company.nit],
        ['Período', `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`],
        ['', ''],
        ['RUBRO', 'MONTO ($)'],
        ['Total Ventas Gravadas (CCF)', totalCcfTaxable],
        ['Total Ventas Gravadas (CF)', totalCfTaxable],
        ['Total Ventas Exentas y No Sujetas', totalCcfExempt + totalCcfNoSujeta + totalCfExempt],
        ['Total IVA Débito Fiscal (CCF + CF)', summary.ivaDebit],
        ['Total Compras Gravadas Locales e Importación', totalPurTaxable + totalPurImportTax],
        ['Total Compras Exentas', totalPurExempt],
        ['Total IVA Crédito Fiscal', summary.ivaCredit],
        ['', ''],
        ['BALANCE FISCAL:', ''],
        [summary.ivaToPay >= 0 ? 'IVA DÉBITO A PAGAR' : 'REMANENTE CRÉDITO FISCAL', Math.abs(summary.ivaToPay)]
      ];
      const ws = XLSX.utils.aoa_to_sheet(f07Data);
      XLSX.utils.book_append_sheet(wb, ws, 'RESUMEN_F07');
    }

    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte_erp_${activeBook}_${selectedMonth}_${selectedYear}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header / Book Selector */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                Centro de Informes & Libros ERP
              </span>
              <span className="text-xs text-slate-500 font-semibold">
                Normativa Tributaria y Financiera SV
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">
              Generación de Informes y Libros Oficiales
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Empresa: <strong className="text-slate-800">{company.name}</strong> (NRC: {company.nrc} • NIT: {company.nit})
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={exportCurrentBookToExcel}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Exportar Excel (.xlsx)</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Informe Oficial</span>
            </button>
          </div>

        </div>

        {/* Book Navigation Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-200">
          <button
            onClick={() => setActiveBook('salesCCF')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeBook === 'salesCCF'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>1. Libro Ventas CCF</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {ccfSales.length}
            </span>
          </button>

          <button
            onClick={() => setActiveBook('salesCF')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeBook === 'salesCF'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>2. Libro Ventas CF</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {cfSales.length}
            </span>
          </button>

          <button
            onClick={() => setActiveBook('purchases')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeBook === 'purchases'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>3. Libro de Compras</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
              {periodPurchases.length}
            </span>
          </button>

          <button
            onClick={() => setActiveBook('f07Summary')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeBook === 'f07Summary'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BookOpenCheck className="w-3.5 h-3.5" />
            <span>4. Declaración F-07</span>
          </button>

          <button
            onClick={() => setActiveBook('retentions')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeBook === 'retentions'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            <span>5. Retenciones & Percepciones 1%</span>
          </button>

          <button
            onClick={() => setActiveBook('inventoryValuation')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeBook === 'inventoryValuation'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>6. Valuación de Inventario</span>
          </button>

          <button
            onClick={() => setActiveBook('agingCxC')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeBook === 'agingCxC'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>7. Cartera CxC & Pendientes</span>
          </button>

          <button
            onClick={() => setActiveBook('plStatement')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeBook === 'plStatement'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>8. Estado de Resultados (P&L)</span>
          </button>
        </div>
      </div>

      {/* Book Content Container (Print friendly) */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 print:border-0 print:p-0 print:shadow-none">
        
        {/* Printable Official Header */}
        <div className="text-center pb-4 mb-4 border-b border-slate-300 space-y-0.5">
          <h2 className="text-sm sm:text-base font-extrabold uppercase text-slate-900 tracking-tight">
            {company.name}
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            NRC: {company.nrc} • NIT: {company.nit} • GIRO: {company.activity}
          </p>
          <p className="text-xs font-bold uppercase text-indigo-800 pt-1">
            {activeBook === 'salesCCF' && 'LIBRO DE VENTAS A CONTRIBUYENTES (CRÉDITO FISCAL)'}
            {activeBook === 'salesCF' && 'LIBRO DE VENTAS A CONSUMIDOR FINAL (FACTURAS)'}
            {activeBook === 'purchases' && 'LIBRO DE COMPRAS Y CRÉDITO FISCAL'}
            {activeBook === 'f07Summary' && 'RESUMEN FISCAL DE OPERACIONES Y DECLARACIÓN DE IVA (F-07)'}
            {activeBook === 'retentions' && 'INFORME DE CONTROL DE RETENCIONES Y PERCEPCIONES DEL 1% IVA'}
            {activeBook === 'inventoryValuation' && 'INFORME OFICIAL DE EXISTENCIAS Y VALUACIÓN DE INVENTARIO'}
            {activeBook === 'agingCxC' && 'INFORME DE CARTERA DE CLIENTES Y CUENTAS POR COBRAR'}
            {activeBook === 'plStatement' && 'ESTADO DE RESULTADOS INTEGRAL (PÉRDIDAS Y GANANCIAS)'}
          </p>
          <p className="text-xs font-semibold text-slate-700">
            MES: {MONTH_NAMES[selectedMonth - 1].toUpperCase()} {selectedYear} • MONEDA: {state.currencyConfig?.code || 'USD'} ({state.currencyConfig?.symbol || '$'})
          </p>
        </div>

        {/* 1. CCF SALES BOOK */}
        {activeBook === 'salesCCF' && (
          <div className="space-y-4">
            {ccfSales.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-500">
                No se registraron ventas con Crédito Fiscal (CCF) en este período.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left border-collapse border border-slate-300">
                  <thead className="bg-[#0f172a] text-white font-semibold">
                    <tr>
                      <th className="border border-slate-700 px-2 py-1.5 text-center w-8">#</th>
                      <th className="border border-slate-700 px-2 py-1.5 w-20">FECHA</th>
                      <th className="border border-slate-700 px-2 py-1.5 w-16">CORREL.</th>
                      <th className="border border-slate-700 px-2 py-1.5 w-24">NRC</th>
                      <th className="border border-slate-700 px-2 py-1.5 w-28">NIT</th>
                      <th className="border border-slate-700 px-3 py-1.5">NOMBRE CLIENTE</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-right w-20">EXENTAS</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-right w-20">NO SUJETAS</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-right w-24">GRAVADAS</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-right w-20">DÉBITO 13%</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-right w-20">RET. 1%</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-right w-24">TOTAL CCF</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {ccfSales.map((sale, idx) => (
                      <tr key={sale.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="border border-slate-300 px-2 py-1 text-center font-mono">{idx + 1}</td>
                        <td className="border border-slate-300 px-2 py-1 font-mono">{sale.date}</td>
                        <td className="border border-slate-300 px-2 py-1 font-mono font-bold">{sale.correlative}</td>
                        <td className="border border-slate-300 px-2 py-1 font-mono">{sale.clientNrc}</td>
                        <td className="border border-slate-300 px-2 py-1 font-mono">{sale.clientNit || 'N/D'}</td>
                        <td className="border border-slate-300 px-3 py-1 truncate max-w-[200px]" title={sale.clientName}>
                          {sale.clientName}
                        </td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono">{formatCurrency(sale.exemptAmount, false)}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono">{formatCurrency(sale.noSujetaAmount, false)}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono font-medium">{formatCurrency(sale.taxableAmount, false)}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono text-indigo-700 font-semibold">{formatCurrency(sale.ivaDebit, false)}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono text-rose-600">{sale.ivaRetenido > 0 ? `-${formatCurrency(sale.ivaRetenido, false)}` : '0.00'}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono font-bold text-slate-900">{formatCurrency(sale.total, false)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#0f172a] text-white font-bold">
                    <tr>
                      <td colSpan={6} className="border border-slate-800 px-3 py-2 text-right text-xs uppercase">
                        TOTALES LIBRO DE VENTAS CCF:
                      </td>
                      <td className="border border-slate-800 px-2 py-2 text-right font-mono">{formatCurrency(totalCcfExempt, false)}</td>
                      <td className="border border-slate-800 px-2 py-2 text-right font-mono">{formatCurrency(totalCcfNoSujeta, false)}</td>
                      <td className="border border-slate-800 px-2 py-2 text-right font-mono">{formatCurrency(totalCcfTaxable, false)}</td>
                      <td className="border border-slate-800 px-2 py-2 text-right font-mono text-indigo-300">{formatCurrency(totalCcfIva, false)}</td>
                      <td className="border border-slate-800 px-2 py-2 text-right font-mono text-rose-300">-{formatCurrency(totalCcfRet, false)}</td>
                      <td className="border border-slate-800 px-2 py-2 text-right font-mono text-sm text-indigo-400">{formatCurrency(totalCcfTotal, false)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 2. CF SALES BOOK */}
        {activeBook === 'salesCF' && (
          <div className="space-y-4">
            {cfSales.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-500">
                No se registraron ventas a Consumidor Final (CF) en este período.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left border-collapse border border-slate-300">
                  <thead className="bg-[#0f172a] text-white font-semibold">
                    <tr>
                      <th className="border border-slate-700 px-2 py-1.5 text-center w-8">#</th>
                      <th className="border border-slate-700 px-2 py-1.5 w-24">FECHA</th>
                      <th className="border border-slate-700 px-2 py-1.5 w-20">CORREL.</th>
                      <th className="border border-slate-700 px-3 py-1.5">DETALLE DE LA VENTA</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-right w-24">EXENTAS</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-right w-28">GRAVADAS (BASE)</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-right w-24">DÉBITO 13%</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-right w-28">TOTAL VENTA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {cfSales.map((sale, idx) => (
                      <tr key={sale.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="border border-slate-300 px-2 py-1 text-center font-mono">{idx + 1}</td>
                        <td className="border border-slate-300 px-2 py-1 font-mono">{sale.date}</td>
                        <td className="border border-slate-300 px-2 py-1 font-mono font-bold">{sale.correlative}</td>
                        <td className="border border-slate-300 px-3 py-1 truncate max-w-[260px]" title={sale.description}>
                          {sale.description}
                        </td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono">{formatCurrency(sale.exemptAmount, false)}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono font-medium">{formatCurrency(sale.taxableAmount, false)}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono text-indigo-700 font-semibold">{formatCurrency(sale.ivaDebit, false)}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono font-bold text-slate-900">{formatCurrency(sale.total, false)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#0f172a] text-white font-bold">
                    <tr>
                      <td colSpan={4} className="border border-slate-800 px-3 py-2 text-right text-xs uppercase">
                        TOTALES LIBRO CONSUMIDOR FINAL:
                      </td>
                      <td className="border border-slate-800 px-2 py-2 text-right font-mono">{formatCurrency(totalCfExempt, false)}</td>
                      <td className="border border-slate-800 px-2 py-2 text-right font-mono">{formatCurrency(totalCfTaxable, false)}</td>
                      <td className="border border-slate-800 px-2 py-2 text-right font-mono text-indigo-300">{formatCurrency(totalCfIva, false)}</td>
                      <td className="border border-slate-800 px-2 py-2 text-right font-mono text-sm text-indigo-400">{formatCurrency(totalCfTotal, false)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. PURCHASES BOOK */}
        {activeBook === 'purchases' && (
          <div className="space-y-4">
            {periodPurchases.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-500">
                No se registraron compras en este período.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-left border-collapse border border-slate-300">
                  <thead className="bg-[#0f172a] text-white font-semibold">
                    <tr>
                      <th className="border border-slate-700 px-2 py-1.5 text-center w-8">#</th>
                      <th className="border border-slate-700 px-2 py-1.5 w-20">FECHA</th>
                      <th className="border border-slate-700 px-2 py-1.5 w-16">TIPO</th>
                      <th className="border border-slate-700 px-2 py-1.5 w-24">DOC. N°</th>
                      <th className="border border-slate-700 px-2 py-1.5 w-20">NRC PROV.</th>
                      <th className="border border-slate-700 px-3 py-1.5">PROVEEDOR</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-right w-20">EXENTAS</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-right w-24">GRAV. LOCAL</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-right w-20">IMPORT.</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-right w-20">CRÉDITO 13%</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-right w-16">RET.</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-right w-24">TOTAL COMPRA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {periodPurchases.map((pur, idx) => (
                      <tr key={pur.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="border border-slate-300 px-2 py-1 text-center font-mono">{idx + 1}</td>
                        <td className="border border-slate-300 px-2 py-1 font-mono">{pur.date}</td>
                        <td className="border border-slate-300 px-2 py-1 font-bold">{pur.documentType}</td>
                        <td className="border border-slate-300 px-2 py-1 font-mono font-semibold">{pur.documentNumber}</td>
                        <td className="border border-slate-300 px-2 py-1 font-mono">{pur.supplierNrc}</td>
                        <td className="border border-slate-300 px-3 py-1 truncate max-w-[180px]" title={pur.supplierName}>
                          {pur.supplierName}
                        </td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono">{formatCurrency(pur.exemptAmount, false)}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono font-medium">{formatCurrency(pur.taxableAmount, false)}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono">{formatCurrency(pur.importTaxableAmount || 0, false)}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono text-indigo-700 font-semibold">{formatCurrency(pur.ivaCredit, false)}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono text-rose-600">{pur.ivaWithheld > 0 ? `-${formatCurrency(pur.ivaWithheld, false)}` : '0.00'}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono font-bold text-slate-900">{formatCurrency(pur.total, false)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-[#0f172a] text-white font-bold">
                    <tr>
                      <td colSpan={6} className="border border-slate-800 px-3 py-2 text-right text-xs uppercase">
                        TOTALES LIBRO DE COMPRAS:
                      </td>
                      <td className="border border-slate-800 px-2 py-2 text-right font-mono">{formatCurrency(totalPurExempt, false)}</td>
                      <td className="border border-slate-800 px-2 py-2 text-right font-mono">{formatCurrency(totalPurTaxable, false)}</td>
                      <td className="border border-slate-800 px-2 py-2 text-right font-mono">{formatCurrency(totalPurImportTax, false)}</td>
                      <td className="border border-slate-800 px-2 py-2 text-right font-mono text-indigo-300">{formatCurrency(totalPurIvaCredit, false)}</td>
                      <td className="border border-slate-800 px-2 py-2 text-right font-mono text-rose-300">-{formatCurrency(totalPurRet, false)}</td>
                      <td className="border border-slate-800 px-2 py-2 text-right font-mono text-sm text-indigo-400">{formatCurrency(totalPurGrand, false)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 4. F-07 SUMMARY */}
        {activeBook === 'f07Summary' && (
          <div className="max-w-2xl mx-auto space-y-6">
            
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-300 space-y-4">
              <h3 className="font-extrabold text-sm uppercase text-slate-900 border-b border-slate-300 pb-2">
                I. Liquidación del Débito y Crédito Fiscal
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-700">Ventas Gravadas a Contribuyentes (CCF):</span>
                  <span className="font-mono font-semibold">{formatCurrency(totalCcfTaxable)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-700">Ventas Gravadas a Consumidor Final (CF):</span>
                  <span className="font-mono font-semibold">{formatCurrency(totalCfTaxable)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-700">Total Ventas Exentas y No Sujetas:</span>
                  <span className="font-mono font-semibold">{formatCurrency(totalCcfExempt + totalCcfNoSujeta + totalCfExempt)}</span>
                </div>
                <div className="flex justify-between py-2 bg-indigo-50 px-3 rounded text-indigo-950 font-bold">
                  <span>(A) TOTAL DÉBITO FISCAL IVA GENERADO (13%):</span>
                  <span className="font-mono text-sm text-indigo-700">{formatCurrency(summary.ivaDebit)}</span>
                </div>

                <div className="pt-2" />

                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-700">Compras Gravadas Locales e Importación:</span>
                  <span className="font-mono font-semibold">{formatCurrency(totalPurTaxable + totalPurImportTax)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200">
                  <span className="text-slate-700">Compras Exentas:</span>
                  <span className="font-mono font-semibold">{formatCurrency(totalPurExempt)}</span>
                </div>
                <div className="flex justify-between py-2 bg-slate-200/70 px-3 rounded text-slate-900 font-bold">
                  <span>(B) TOTAL CRÉDITO FISCAL IVA DEDUCIBLE (13%):</span>
                  <span className="font-mono text-sm text-indigo-700">{formatCurrency(summary.ivaCredit)}</span>
                </div>

                <div className="pt-2" />

                {summary.ivaToPay >= 0 ? (
                  <div className="p-4 bg-indigo-50 border-2 border-indigo-400 rounded-xl space-y-1">
                    <div className="flex justify-between text-indigo-950 font-extrabold text-sm">
                      <span>RESULTADO: IVA A PAGAR AL FISCO (A - B):</span>
                      <span className="font-mono text-lg text-indigo-700">{formatCurrency(summary.ivaToPay)}</span>
                    </div>
                    <p className="text-[11px] text-indigo-800">
                      Monto a liquidar y enterar en formulario F-07 del Ministerio de Hacienda.
                    </p>
                  </div>
                ) : (
                  <div className="p-4 bg-emerald-50 border-2 border-emerald-400 rounded-xl space-y-1">
                    <div className="flex justify-between text-emerald-900 font-extrabold text-sm">
                      <span>RESULTADO: REMANENTE DE CRÉDITO FISCAL (B - A):</span>
                      <span className="font-mono text-lg text-emerald-700">{formatCurrency(Math.abs(summary.ivaToPay))}</span>
                    </div>
                    <p className="text-[11px] text-emerald-700">
                      Saldo a favor de la empresa para trasladar al período tributario siguiente.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Signature box */}
            <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs text-slate-700">
              <div className="border-t border-slate-400 pt-2">
                <p className="font-bold">Contador / Responsable Tributario</p>
                <p className="text-[10px] text-slate-500">Firma y N° de Registro Profesional</p>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <p className="font-bold">Representante Legal</p>
                <p className="text-[10px] text-slate-500">{company.name}</p>
              </div>
            </div>

          </div>
        )}

        {/* 5. RETENTIONS 1% REPORT */}
        {activeBook === 'retentions' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-xs uppercase text-slate-800 mb-2">
                Retenciones Aplicadas por Grandes Contribuyentes a Nuestras Ventas (1% IVA)
              </h3>
              {salesWithRet.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-3 bg-slate-50 rounded-lg p-3">
                  No hubo retenciones recibidas en ventas durante este período.
                </p>
              ) : (
                <table className="w-full text-[11px] text-left border-collapse border border-slate-300">
                  <thead className="bg-slate-800 text-white font-semibold">
                    <tr>
                      <th className="border border-slate-700 px-2 py-1.5">Fecha</th>
                      <th className="border border-slate-700 px-2 py-1.5">CCF #</th>
                      <th className="border border-slate-700 px-2 py-1.5">Gran Contribuyente</th>
                      <th className="border border-slate-700 px-2 py-1.5">NRC</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-right">Venta Gravada</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-right">1% Retenido</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salesWithRet.map((s, i) => (
                      <tr key={s.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="border border-slate-300 px-2 py-1 font-mono">{s.date}</td>
                        <td className="border border-slate-300 px-2 py-1 font-mono font-bold">#{s.correlative}</td>
                        <td className="border border-slate-300 px-2 py-1">{s.clientName}</td>
                        <td className="border border-slate-300 px-2 py-1 font-mono">{s.clientNrc}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono">{formatCurrency(s.taxableAmount)}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono font-bold text-rose-600">-{formatCurrency(s.ivaRetenido)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold">
                    <tr>
                      <td colSpan={5} className="border border-slate-300 px-2 py-1.5 text-right text-xs">Total Retenciones en Ventas:</td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-rose-700">-{formatCurrency(totalCcfRet)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>

            <div>
              <h3 className="font-bold text-xs uppercase text-slate-800 mb-2">
                Retenciones y Percepciones Efectuadas en Compras
              </h3>
              {purchasesWithRet.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-3 bg-slate-50 rounded-lg p-3">
                  No hubo retenciones o percepciones aplicadas en compras durante este período.
                </p>
              ) : (
                <table className="w-full text-[11px] text-left border-collapse border border-slate-300">
                  <thead className="bg-slate-800 text-white font-semibold">
                    <tr>
                      <th className="border border-slate-700 px-2 py-1.5">Fecha</th>
                      <th className="border border-slate-700 px-2 py-1.5">Doc #</th>
                      <th className="border border-slate-700 px-2 py-1.5">Proveedor</th>
                      <th className="border border-slate-700 px-2 py-1.5">NRC</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-right">Compra Gravada</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-right">Retención Efectuada</th>
                      <th className="border border-slate-700 px-2 py-1.5 text-right">Percepción Recibida</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchasesWithRet.map((p, i) => (
                      <tr key={p.id} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="border border-slate-300 px-2 py-1 font-mono">{p.date}</td>
                        <td className="border border-slate-300 px-2 py-1 font-mono font-bold">{p.documentNumber}</td>
                        <td className="border border-slate-300 px-2 py-1">{p.supplierName}</td>
                        <td className="border border-slate-300 px-2 py-1 font-mono">{p.supplierNrc}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono">{formatCurrency(p.taxableAmount)}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono text-rose-600">{p.ivaWithheld > 0 ? formatCurrency(p.ivaWithheld) : '0.00'}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono text-amber-600">{p.ivaPerceived > 0 ? formatCurrency(p.ivaPerceived) : '0.00'}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold">
                    <tr>
                      <td colSpan={5} className="border border-slate-300 px-2 py-1.5 text-right text-xs">Totales:</td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-rose-700">{formatCurrency(totalPurRet)}</td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono text-amber-700">{formatCurrency(totalPurPerc)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
          </div>
        )}

        {/* 6. INVENTORY VALUATION REPORT */}
        {activeBook === 'inventoryValuation' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Total Ítems en Catálogo</p>
                <p className="text-xl font-extrabold text-slate-900">{state.products.length} productos</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Valuación Total (Costo)</p>
                <p className="text-xl font-extrabold text-indigo-700 font-mono">{formatCurrency(inventoryTotalValuation)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-500">Valuación Comercial (Venta)</p>
                <p className="text-xl font-extrabold text-emerald-700 font-mono">{formatCurrency(inventoryTotalSaleValue)}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left border-collapse border border-slate-300">
                <thead className="bg-[#0f172a] text-white font-semibold">
                  <tr>
                    <th className="border border-slate-700 px-2 py-1.5 text-center w-8">#</th>
                    <th className="border border-slate-700 px-2 py-1.5 w-24">SKU / CÓDIGO</th>
                    <th className="border border-slate-700 px-3 py-1.5">NOMBRE PRODUCTO</th>
                    <th className="border border-slate-700 px-2 py-1.5 w-24">CATEGORÍA</th>
                    <th className="border border-slate-700 px-2 py-1.5 text-center w-16">UNIDAD</th>
                    <th className="border border-slate-700 px-2 py-1.5 text-right w-20">EXISTENCIA</th>
                    <th className="border border-slate-700 px-2 py-1.5 text-right w-24">COSTO UNIT.</th>
                    <th className="border border-slate-700 px-2 py-1.5 text-right w-24">PRECIO VTA.</th>
                    <th className="border border-slate-700 px-2 py-1.5 text-right w-28">VALUACIÓN TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {state.products.map((p, idx) => (
                    <tr key={p.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="border border-slate-300 px-2 py-1 text-center font-mono">{idx + 1}</td>
                      <td className="border border-slate-300 px-2 py-1 font-mono font-bold text-indigo-700">{p.sku}</td>
                      <td className="border border-slate-300 px-3 py-1 font-medium">{p.name}</td>
                      <td className="border border-slate-300 px-2 py-1">{p.category}</td>
                      <td className="border border-slate-300 px-2 py-1 text-center text-slate-500">{p.unit}</td>
                      <td className={`border border-slate-300 px-2 py-1 text-right font-mono font-bold ${p.stock <= p.minStock ? 'text-amber-600' : 'text-slate-800'}`}>
                        {p.stock}
                      </td>
                      <td className="border border-slate-300 px-2 py-1 text-right font-mono">{formatCurrency(p.cost)}</td>
                      <td className="border border-slate-300 px-2 py-1 text-right font-mono">{formatCurrency(p.price)}</td>
                      <td className="border border-slate-300 px-2 py-1 text-right font-mono font-bold text-slate-900">{formatCurrency(p.stock * p.cost)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#0f172a] text-white font-bold">
                  <tr>
                    <td colSpan={8} className="border border-slate-800 px-3 py-2 text-right text-xs uppercase">
                      TOTAL VALORIZACIÓN EXISTENCIAS DE INVENTARIO:
                    </td>
                    <td className="border border-slate-800 px-2 py-2 text-right font-mono text-sm text-indigo-400">
                      {formatCurrency(inventoryTotalValuation)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* 7. AGING CXC REPORT */}
        {activeBook === 'agingCxC' && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-slate-900 uppercase">Cuentas por Cobrar Pendientes (Cartera CxC)</p>
                <p className="text-[11px] text-slate-500">Documentos emitidos con saldo pendiente de liquidación.</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-500">Saldo Total por Cobrar</p>
                <p className="text-lg font-bold text-rose-700 font-mono">
                  {formatCurrency(pendingSales.reduce((acc, s) => acc + (s.balancePending ?? s.total), 0))}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left border-collapse border border-slate-300">
                <thead className="bg-[#0f172a] text-white font-semibold">
                  <tr>
                    <th className="border border-slate-700 px-2 py-1.5">Fecha</th>
                    <th className="border border-slate-700 px-2 py-1.5">Tipo</th>
                    <th className="border border-slate-700 px-2 py-1.5">Correl.</th>
                    <th className="border border-slate-700 px-3 py-1.5">Cliente</th>
                    <th className="border border-slate-700 px-2 py-1.5 text-right">Total</th>
                    <th className="border border-slate-700 px-2 py-1.5 text-right">Cobrado</th>
                    <th className="border border-slate-700 px-2 py-1.5 text-right">Saldo Deudor</th>
                    <th className="border border-slate-700 px-2 py-1.5 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {pendingSales.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-xs text-slate-500">
                        ¡Excelente! No existen facturas con saldo pendiente de cobro.
                      </td>
                    </tr>
                  ) : (
                    pendingSales.map((s, idx) => (
                      <tr key={s.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="border border-slate-300 px-2 py-1 font-mono">{s.date}</td>
                        <td className="border border-slate-300 px-2 py-1 font-bold">{s.documentType}</td>
                        <td className="border border-slate-300 px-2 py-1 font-mono font-bold">#{s.correlative}</td>
                        <td className="border border-slate-300 px-3 py-1">{s.clientName}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono">{formatCurrency(s.total)}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono text-emerald-600">{formatCurrency(s.paidAmount || 0)}</td>
                        <td className="border border-slate-300 px-2 py-1 text-right font-mono font-bold text-rose-700">{formatCurrency(s.balancePending ?? s.total)}</td>
                        <td className="border border-slate-300 px-2 py-1 text-center font-semibold">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] ${s.paymentStatus === 'Parcial' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                            {s.paymentStatus || 'Pendiente'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 8. P&L STATEMENT */}
        {activeBook === 'plStatement' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-slate-50 p-6 rounded-xl border border-slate-300 space-y-4">
              <h3 className="font-extrabold text-sm uppercase text-slate-900 border-b border-slate-300 pb-2">
                Estado de Rendimiento del Período ({MONTH_NAMES[selectedMonth - 1]} {selectedYear})
              </h3>

              <div className="space-y-3 text-xs">
                <div className="space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-900 border-b border-slate-200 pb-1">
                    <span>1. INGRESOS POR VENTAS OPERACIONALES</span>
                    <span className="font-mono text-indigo-700">{formatCurrency(totalIngresos)}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-600">
                    <span>• Ventas Gravadas Contribuyentes (CCF):</span>
                    <span className="font-mono">{formatCurrency(totalCcfTaxable)}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-600">
                    <span>• Ventas Gravadas Consumidor Final (CF):</span>
                    <span className="font-mono">{formatCurrency(totalCfTaxable)}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-600">
                    <span>• Ventas Exentas y No Sujetas:</span>
                    <span className="font-mono">{formatCurrency(totalCcfExempt + totalCcfNoSujeta + totalCfExempt)}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between font-bold text-slate-900 border-b border-slate-200 pb-1">
                    <span>2. COSTO DE VENTAS / COMPRAS OPERATIVAS</span>
                    <span className="font-mono text-rose-700">-{formatCurrency(totalCostos)}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-600">
                    <span>• Compras Gravadas Locales e Insumos:</span>
                    <span className="font-mono">{formatCurrency(totalPurTaxable)}</span>
                  </div>
                  <div className="flex justify-between pl-4 text-slate-600">
                    <span>• Compras Gravadas de Importación:</span>
                    <span className="font-mono">{formatCurrency(totalPurImportTax)}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <div className={`p-4 rounded-xl border-2 flex justify-between items-center ${
                    utilidadBruta >= 0 
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-950'
                      : 'bg-rose-50 border-rose-400 text-rose-950'
                  }`}>
                    <div>
                      <p className="font-extrabold text-sm uppercase">UTILIDAD BRUTA OPERACIONAL (1 - 2)</p>
                      <p className="text-[11px] opacity-80">Margen bruto antes de gastos de administración y tributos.</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xl font-extrabold">
                        {formatCurrency(utilidadBruta)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

