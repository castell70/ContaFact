import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  ShoppingCart, 
  AlertCircle, 
  CheckCircle2, 
  ArrowUpRight, 
  ArrowDownRight, 
  PlusCircle, 
  BookOpenCheck,
  Users,
  Truck,
  FileSpreadsheet,
  Calendar,
  Sparkles,
  Printer,
  FileText
} from 'lucide-react';
import { AppState, SaleRecord, PurchaseRecord } from '../../types';
import { calculatePeriodSummary, getMonthlyHistory } from '../../services/taxEngine';
import { formatCurrency } from '../../utils/numberToWords';

interface DashboardProps {
  state: AppState;
  selectedMonth: number;
  selectedYear: number;
  onNavigate: (tab: 'sales' | 'purchases' | 'clients' | 'suppliers' | 'reports' | 'tools') => void;
  onSelectSaleForView: (sale: SaleRecord) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const Dashboard: React.FC<DashboardProps> = ({
  state,
  selectedMonth,
  selectedYear,
  onNavigate,
  onSelectSaleForView
}) => {
  const summary = calculatePeriodSummary(state, selectedMonth, selectedYear);
  const monthlyHistory = getMonthlyHistory(state, selectedYear);

  const isIvaToPay = summary.ivaToPay >= 0;
  const maxMonthValue = Math.max(...monthlyHistory.map(m => Math.max(m.sales, m.purchases)), 100);

  // Recent 5 sales & 5 purchases
  const recentSales = [...(state.salesRecords || [])]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const recentPurchases = [...(state.purchaseRecords || [])]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  // Tax distribution percentages
  const totalGravadas = summary.salesTaxable + summary.purchasesTaxable;
  const totalExentas = summary.salesExempt + summary.purchasesExempt;
  const totalOperaciones = totalGravadas + totalExentas || 1;
  const percentGeneral = Math.min(100, Math.round((totalGravadas / totalOperaciones) * 100));
  const percentExento = 100 - percentGeneral;

  return (
    <div className="space-y-6">
      
      {/* 4 Sleek Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: IVA Repercutido (Ventas) */}
        <div className="bg-white p-5 rounded-2xl border border-orange-200/80 shadow-xs hover:shadow-md transition-all">
          <p className="text-orange-700/80 text-xs font-bold uppercase tracking-wider mb-1">
            IVA Repercutido (Ventas 13%)
          </p>
          <p className="text-2xl font-bold text-orange-600 font-mono">
            {formatCurrency(summary.ivaDebit)}
          </p>
          <p className="text-xs text-orange-700 mt-2 font-medium flex items-center gap-1">
            <span className="text-orange-500 font-bold">↑</span>
            <span>{summary.salesCCFCount} CCF • {summary.salesCFCount} CF emitidos</span>
          </p>
        </div>

        {/* Card 2: IVA Soportado (Compras) */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all">
          <p className="text-blue-700/80 text-xs font-bold uppercase tracking-wider mb-1">
            IVA Soportado (Gastos/Compras)
          </p>
          <p className="text-2xl font-bold text-blue-900 font-mono">
            {formatCurrency(summary.ivaCredit)}
          </p>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {summary.purchasesCount} comprobantes deducibles
          </p>
        </div>

        {/* Card 3: Resultado a Liquidar */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            Resultado a Liquidar (F-07)
          </p>
          <p className={`text-2xl font-bold font-mono ${isIvaToPay ? 'text-rose-600' : 'text-emerald-600'}`}>
            {formatCurrency(Math.abs(summary.ivaToPay))}
          </p>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {isIvaToPay ? 'IVA Débito a enterar en Hacienda' : 'Remanente Crédito Fiscal a favor'}
          </p>
        </div>

        {/* Card 4: Base Imponible Total */}
        <div className="bg-white p-5 rounded-2xl border border-orange-100 shadow-xs hover:shadow-md transition-all">
          <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
            Base Imponible Total Ventas
          </p>
          <p className="text-2xl font-bold text-slate-900 font-mono">
            {formatCurrency(summary.salesTaxable)}
          </p>
          <p 
            onClick={() => onNavigate('reports')} 
            className="text-xs text-orange-600 mt-2 font-semibold underline cursor-pointer hover:text-orange-700"
          >
            Ver libros oficiales de IVA
          </p>
        </div>

      </div>

      {/* Main Row: Recent Table (2 cols) + Distribution & Action Sidebar (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Table of Recent IVA Transactions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div>
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">
                Últimos Registros de Facturación e IVA
              </h3>
              <span 
                onClick={() => onNavigate('sales')}
                className="text-xs text-indigo-600 font-medium cursor-pointer hover:underline"
              >
                Ver historial completo
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[11px] uppercase text-slate-500 font-bold">
                    <th className="px-6 py-3">Fecha</th>
                    <th className="px-6 py-3">Referencia / Cliente</th>
                    <th className="px-6 py-3">Base Imponible</th>
                    <th className="px-6 py-3 text-center">% IVA</th>
                    <th className="px-6 py-3 text-right">Cuota IVA</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-slate-50">
                  {recentSales.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-xs text-slate-400">
                        No hay registros en el período actual.
                      </td>
                    </tr>
                  ) : (
                    recentSales.map((sale) => (
                      <tr key={sale.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-slate-600">
                          {sale.date}
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-slate-900 text-xs">
                            {sale.documentType} #{sale.correlative}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate max-w-[180px]">
                            {sale.clientName || 'Consumidor Final'}
                          </p>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-700">
                          {formatCurrency(sale.taxableAmount)}
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-semibold text-slate-600">
                          13%
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-bold text-indigo-600 text-xs">
                          {formatCurrency(sale.ivaDebit)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Total ventas gravadas: {formatCurrency(summary.salesTaxable)}</span>
            <button
              onClick={() => onNavigate('sales')}
              className="text-orange-600 font-bold hover:underline"
            >
              Emitir nueva factura →
            </button>
          </div>
        </div>

        {/* Right 1 Col: Distribution & Sleek Dark Quick Action Card */}
        <div className="flex flex-col gap-6">
          
          {/* Card: IVA Breakdown by Type */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-800 text-sm mb-4">
              Distribución de Tipos de Operaciones
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">Tasa General Gravada (13%)</span>
                  <span className="text-orange-600 font-bold font-mono">{percentGeneral}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${percentGeneral}%` }} 
                    className="bg-gradient-to-r from-orange-500 to-amber-500 h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">Operaciones Exentas y No Sujetas</span>
                  <span className="text-blue-600 font-bold font-mono">{percentExento}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    style={{ width: `${percentExento}%` }} 
                    className="bg-gradient-to-r from-blue-500 to-slate-500 h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-600">
                <span>Margen Operativo Bruto:</span>
                <span className={`font-mono font-bold ${summary.utility >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {formatCurrency(summary.utility)}
                </span>
              </div>
            </div>
          </div>

          {/* Sleek Blue/Navy Accent Card: Direct Tax Sync & Books */}
          <div className="bg-[#0f172a] p-6 rounded-2xl text-white shadow-md flex-1 relative overflow-hidden flex flex-col justify-between border border-slate-800">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                <h3 className="font-bold text-sm">Libros Oficiales de IVA</h3>
              </div>
              <p className="text-xs text-slate-400 mb-4 leading-relaxed">
                Generación automática de Libros de Compras, Ventas a Contribuyentes (CCF) y Consumidor Final según Art. 141 Código Tributario.
              </p>
              <button
                onClick={() => onNavigate('reports')}
                className="w-full py-2.5 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer"
              >
                Consultar e Imprimir Libros
              </button>
            </div>
            
            {/* Ambient blur glow */}
            <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-orange-500/15 rounded-full blur-2xl pointer-events-none" />
          </div>

        </div>

      </div>

      {/* Monthly Comparative Chart Bar */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="font-bold text-sm text-slate-800">
              Evolución Mensual de Facturación vs Compras ({selectedYear})
            </h3>
            <p className="text-xs text-slate-500">
              Comparativa de volumen total facturado y compras registradas por mes.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-orange-500 inline-block" />
              <span className="text-slate-700">Ventas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-900 inline-block" />
              <span className="text-slate-700">Compras</span>
            </div>
          </div>
        </div>

        {/* 12 Months Bar Chart */}
        <div className="grid grid-cols-12 gap-1 sm:gap-2 items-end h-44 pt-4 border-b border-slate-100">
          {monthlyHistory.map((item) => {
            const isCurrent = item.month === selectedMonth;
            const salesHeight = Math.max(4, Math.round((item.sales / maxMonthValue) * 100));
            const purchasesHeight = Math.max(4, Math.round((item.purchases / maxMonthValue) * 100));

            return (
              <div key={item.month} className="flex flex-col items-center h-full justify-end group">
                <div className="w-full flex items-end justify-center gap-0.5 sm:gap-1 h-32 relative">
                  
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 z-20 hidden group-hover:flex flex-col items-center bg-[#0f172a] text-white text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap pointer-events-none">
                    <span>{item.monthName}: V: {formatCurrency(item.sales)}</span>
                    <span>C: {formatCurrency(item.purchases)}</span>
                  </div>

                  {/* Sales Bar */}
                  <div 
                    style={{ height: `${salesHeight}%` }} 
                    className={`w-2.5 sm:w-3.5 rounded-t transition-all ${
                      isCurrent ? 'bg-orange-500 shadow-xs' : 'bg-orange-400/70 group-hover:bg-orange-500'
                    }`}
                  />
                  {/* Purchases Bar */}
                  <div 
                    style={{ height: `${purchasesHeight}%` }} 
                    className={`w-2.5 sm:w-3.5 rounded-t transition-all ${
                      isCurrent ? 'bg-[#0f172a]' : 'bg-slate-400 group-hover:bg-blue-900'
                    }`}
                  />
                </div>
                <span className={`text-[10px] font-bold mt-2 truncate ${
                  isCurrent ? 'text-orange-600 font-extrabold' : 'text-slate-500'
                }`}>
                  {item.monthName.substring(0, 3)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
