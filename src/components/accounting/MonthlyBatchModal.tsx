import React, { useState, useMemo } from 'react';
import { 
  X, 
  Sparkles, 
  Calendar, 
  ShoppingCart, 
  Receipt, 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  Layers, 
  ArrowRight,
  Info
} from 'lucide-react';
import { AppState } from '../../types';
import { generateMonthlyJournalEntries } from '../../services/dataStore';
import { formatCurrency, parseLocalDate } from '../../utils/numberToWords';

interface MonthlyBatchModalProps {
  state: AppState;
  selectedMonth: number;
  selectedYear: number;
  onClose: () => void;
  onSuccess: (message: string) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const MonthlyBatchModal: React.FC<MonthlyBatchModalProps> = ({
  state,
  selectedMonth: initialMonth,
  selectedYear: initialYear,
  onClose,
  onSuccess
}) => {
  const [month, setMonth] = useState(initialMonth);
  const [year, setYear] = useState(initialYear);
  const [includeSales, setIncludeSales] = useState(true);
  const [includePurchases, setIncludePurchases] = useState(true);
  const [includeCostOfSales, setIncludeCostOfSales] = useState(true);
  const [overrideExisting, setOverrideExisting] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultSummary, setResultSummary] = useState<{ count: number; details: string[] } | null>(null);

  const currency = state.currencyConfig;

  // Filtered sales for the selected period
  const periodSales = useMemo(() => {
    return state.salesRecords.filter(s => {
      if (s.status === 'Anulada') return false;
      const d = parseLocalDate(s.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });
  }, [state.salesRecords, month, year]);

  // Filtered purchases for the selected period
  const periodPurchases = useMemo(() => {
    return state.purchaseRecords.filter(p => {
      if (p.status === 'Anulada') return false;
      const d = parseLocalDate(p.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year;
    });
  }, [state.purchaseRecords, month, year]);

  // Sales totals
  const totalSalesTaxable = periodSales.reduce((s, r) => s + (r.taxableAmount || 0), 0);
  const totalSalesExempt = periodSales.reduce((s, r) => s + (r.exemptAmount || 0) + (r.noSujetaAmount || 0), 0);
  const totalSalesIvaDebit = periodSales.reduce((s, r) => s + (r.ivaDebit || 0), 0);
  const totalSalesIvaRet = periodSales.reduce((s, r) => s + (r.ivaRetenido || 0), 0);
  const totalSalesAmount = periodSales.reduce((s, r) => s + (r.total || 0), 0);

  // Purchases totals
  const totalPurchasesTaxable = periodPurchases.reduce((s, r) => s + (r.taxableAmount || 0) + (r.importTaxableAmount || 0), 0);
  const totalPurchasesExempt = periodPurchases.reduce((s, r) => s + (r.exemptAmount || 0) + (r.importExemptAmount || 0) + (r.noSujetaAmount || 0), 0);
  const totalPurchasesIvaCredit = periodPurchases.reduce((s, r) => s + (r.ivaCredit || 0), 0);
  const totalPurchasesIvaWithheld = periodPurchases.reduce((s, r) => s + (r.ivaWithheld || 0), 0);
  const totalPurchasesAmount = periodPurchases.reduce((s, r) => s + (r.total || 0), 0);

  // Estimate cost of sales
  const estimatedCost = useMemo(() => {
    const productsMap = new Map<string, typeof state.products[0]>(state.products.map(p => [p.id, p]));
    let total = 0;
    for (const sale of periodSales) {
      if (Array.isArray(sale.items)) {
        for (const item of sale.items) {
          const prod = item.productId ? productsMap.get(item.productId) : null;
          if (prod && prod.cost > 0) {
            total += ((item.qty || 0) * prod.cost);
          }
        }
      }
    }
    return total;
  }, [periodSales, state.products]);

  const handleGenerate = () => {
    setIsGenerating(true);
    try {
      const res = generateMonthlyJournalEntries({
        month,
        year,
        includeSales,
        includePurchases,
        includeCostOfSales,
        overrideExisting
      });

      setResultSummary({
        count: res.createdCount,
        details: res.details
      });

      onSuccess(`Se generaron exitosamente ${res.createdCount} partidas contables para ${MONTH_NAMES[month - 1]} ${year}.`);
    } catch (e: any) {
      alert(`Error al generar partidas: ${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Generación Automática de Partidas por Mes</h2>
              <p className="text-xs text-slate-500">Centraliza ventas, compras e IVA del período fiscal en asientos contables cuadrados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-4 space-y-4 text-xs flex-1 overflow-y-auto pr-1">
          {/* Period Selector */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
            <div className="flex items-center gap-2 mb-2 font-semibold text-slate-800">
              <Calendar className="w-4 h-4 text-indigo-600" />
              <span>Seleccionar Período a Contabilizar</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 mb-1 font-medium">Mes del Ejercicio</label>
                <select
                  value={month}
                  onChange={(e) => {
                    setMonth(parseInt(e.target.value, 10));
                    setResultSummary(null);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                >
                  {MONTH_NAMES.map((mName, idx) => (
                    <option key={idx + 1} value={idx + 1}>{mName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 mb-1 font-medium">Año del Ejercicio</label>
                <input
                  type="number"
                  value={year}
                  onChange={(e) => {
                    setYear(parseInt(e.target.value, 10) || 2025);
                    setResultSummary(null);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Operational Data Preview */}
          <div className="grid grid-cols-2 gap-3">
            {/* Sales Preview Card */}
            <div className="p-3.5 rounded-xl border border-emerald-100 bg-emerald-50/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-bold text-emerald-800">
                  <Receipt className="w-4 h-4 text-emerald-600" />
                  <span>Ventas ({periodSales.length})</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {MONTH_NAMES[month - 1]}
                </span>
              </div>
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Gravadas:</span>
                  <span className="font-mono font-medium text-slate-800">{formatCurrency(totalSalesTaxable, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Exentas/No Suj:</span>
                  <span className="font-mono font-medium text-slate-800">{formatCurrency(totalSalesExempt, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>13% Débito IVA:</span>
                  <span className="font-mono font-medium text-slate-800">{formatCurrency(totalSalesIvaDebit, currency)}</span>
                </div>
                {totalSalesIvaRet > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>1% Retenido:</span>
                    <span className="font-mono font-medium">-{formatCurrency(totalSalesIvaRet, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-emerald-200 font-bold text-emerald-950">
                  <span>Total Facturado:</span>
                  <span className="font-mono">{formatCurrency(totalSalesAmount, currency)}</span>
                </div>
              </div>
            </div>

            {/* Purchases Preview Card */}
            <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 font-bold text-blue-800">
                  <ShoppingCart className="w-4 h-4 text-blue-600" />
                  <span>Compras ({periodPurchases.length})</span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {MONTH_NAMES[month - 1]}
                </span>
              </div>
              <div className="space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span>Gravadas:</span>
                  <span className="font-mono font-medium text-slate-800">{formatCurrency(totalPurchasesTaxable, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Exentas/Import:</span>
                  <span className="font-mono font-medium text-slate-800">{formatCurrency(totalPurchasesExempt, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span>13% Crédito IVA:</span>
                  <span className="font-mono font-medium text-slate-800">{formatCurrency(totalPurchasesIvaCredit, currency)}</span>
                </div>
                {totalPurchasesIvaWithheld > 0 && (
                  <div className="flex justify-between text-amber-700">
                    <span>1% Retenido:</span>
                    <span className="font-mono font-medium">-{formatCurrency(totalPurchasesIvaWithheld, currency)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-1 border-t border-blue-200 font-bold text-blue-950">
                  <span>Total Compras:</span>
                  <span className="font-mono">{formatCurrency(totalPurchasesAmount, currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Options Checklist */}
          <div className="space-y-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-bold text-slate-800 block">Partidas Contables a Generar:</span>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeSales}
                onChange={(e) => setIncludeSales(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-semibold text-slate-800">Partida Centralizadora de Ventas e IVA Débito</span>
                <p className="text-[11px] text-slate-500">
                  Carga a Cuentas por Cobrar Clientes (1103) / Caja (1101) y abona a Ventas Gravadas (4101), Ventas Exentas (4102) e IVA Débito Fiscal (2102).
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includePurchases}
                onChange={(e) => setIncludePurchases(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-semibold text-slate-800">Partida Centralizadora de Compras e IVA Crédito</span>
                <p className="text-[11px] text-slate-500">
                  Carga a Costo de Ventas/Compras (5101) e IVA Crédito Fiscal (1105), abonando a Proveedores por Pagar (2101) y Caja/Bancos (1101).
                </p>
              </div>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeCostOfSales}
                onChange={(e) => setIncludeCostOfSales(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <div>
                <span className="font-semibold text-slate-800">Partida de Costo de Ventas y Descarga de Inventarios</span>
                <p className="text-[11px] text-slate-500">
                  Calcula el costo valorado de productos vendidos ({formatCurrency(estimatedCost, currency)}) cargando a Costo de Ventas (5101) y acreditando a Inventario (1104).
                </p>
              </div>
            </label>

            <div className="pt-2 border-t border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overrideExisting}
                  onChange={(e) => setOverrideExisting(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-slate-700 font-medium">Reemplazar/sobrescribir partidas automáticas previas de este mismo mes si existiesen</span>
              </label>
            </div>
          </div>

          {/* Results feedback */}
          {resultSummary && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 space-y-1 animate-in fade-in">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Generación Completada: {resultSummary.count} partidas creadas</span>
              </div>
              <ul className="list-disc list-inside text-[11px] text-emerald-800 space-y-0.5 pl-1">
                {resultSummary.details.map((d, idx) => (
                  <li key={idx}>{d}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-2">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>Las partidas quedan registradas con estado cuadrado y fecha de cierre del mes.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
            >
              {resultSummary ? 'Cerrar' : 'Cancelar'}
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating || (!includeSales && !includePurchases && !includeCostOfSales)}
              className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? 'Generando...' : `Generar Partidas de ${MONTH_NAMES[month - 1]}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
