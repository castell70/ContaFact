import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  Printer, 
  FileSpreadsheet, 
  Calendar, 
  TrendingUp, 
  Scale, 
  CheckCircle2, 
  AlertCircle,
  FileCheck2,
  DollarSign,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { AppState, JournalEntry, ChartAccount } from '../../types';
import { formatCurrency, parseLocalDate } from '../../utils/numberToWords';
import { getChartOfAccounts } from '../../services/dataStore';

interface FinancialStatementsViewProps {
  state: AppState;
  selectedMonth: number; // 1-12 or 0 for all
  selectedYear: number;
  onMonthChange: (m: number) => void;
  onYearChange: (y: number) => void;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const FinancialStatementsView: React.FC<FinancialStatementsViewProps> = ({
  state,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange
}) => {
  const [activeStatement, setActiveStatement] = useState<'pnl' | 'balanceSheet'>('pnl');

  const currency = state.currencyConfig;
  const company = state.companyInfo;
  const accounts = state.chartOfAccounts && state.chartOfAccounts.length > 0 
    ? state.chartOfAccounts 
    : getChartOfAccounts();

  // Filter journal entries by selected month and year
  const filteredEntries = useMemo(() => {
    return state.journalEntries.filter(entry => {
      const d = parseLocalDate(entry.date);
      const yearMatch = d.getFullYear() === selectedYear;
      const monthMatch = selectedMonth === 0 || (d.getMonth() + 1 === selectedMonth);
      return yearMatch && monthMatch;
    });
  }, [state.journalEntries, selectedMonth, selectedYear]);

  // All entries up to selected period (for cumulative balance sheet)
  const cumulativeEntries = useMemo(() => {
    return state.journalEntries.filter(entry => {
      const d = parseLocalDate(entry.date);
      const yearMatch = d.getFullYear() <= selectedYear;
      if (d.getFullYear() < selectedYear) return true;
      const monthMatch = selectedMonth === 0 || (d.getMonth() + 1 <= selectedMonth);
      return yearMatch && monthMatch;
    });
  }, [state.journalEntries, selectedMonth, selectedYear]);

  // Compute period balances for P&L
  const periodAccountBalances = useMemo(() => {
    const map = new Map<string, { code: string; name: string; category: ChartAccount['category']; debit: number; credit: number; balance: number }>();

    accounts.forEach(acc => {
      map.set(acc.code, {
        code: acc.code,
        name: acc.name,
        category: acc.category,
        debit: 0,
        credit: 0,
        balance: 0
      });
    });

    filteredEntries.forEach(entry => {
      entry.lines.forEach(line => {
        let acc = map.get(line.accountCode);
        if (!acc) {
          acc = {
            code: line.accountCode,
            name: line.accountName,
            category: 'Gastos',
            debit: 0,
            credit: 0,
            balance: 0
          };
          map.set(line.accountCode, acc);
        }
        acc.debit += (line.debit || 0);
        acc.credit += (line.credit || 0);
      });
    });

    return Array.from(map.values()).map(acc => {
      let balance = 0;
      if (['Activo', 'Costos', 'Gastos'].includes(acc.category)) {
        balance = acc.debit - acc.credit;
      } else {
        balance = acc.credit - acc.debit;
      }
      return {
        ...acc,
        balance: Math.round(balance * 100) / 100
      };
    });
  }, [accounts, filteredEntries]);

  // Compute cumulative balances for Balance Sheet
  const cumulativeAccountBalances = useMemo(() => {
    const map = new Map<string, { code: string; name: string; category: ChartAccount['category']; debit: number; credit: number; balance: number }>();

    accounts.forEach(acc => {
      map.set(acc.code, {
        code: acc.code,
        name: acc.name,
        category: acc.category,
        debit: 0,
        credit: 0,
        balance: 0
      });
    });

    cumulativeEntries.forEach(entry => {
      entry.lines.forEach(line => {
        let acc = map.get(line.accountCode);
        if (!acc) {
          acc = {
            code: line.accountCode,
            name: line.accountName,
            category: 'Activo',
            debit: 0,
            credit: 0,
            balance: 0
          };
          map.set(line.accountCode, acc);
        }
        acc.debit += (line.debit || 0);
        acc.credit += (line.credit || 0);
      });
    });

    return Array.from(map.values()).map(acc => {
      let balance = 0;
      if (['Activo', 'Costos', 'Gastos'].includes(acc.category)) {
        balance = acc.debit - acc.credit;
      } else {
        balance = acc.credit - acc.debit;
      }
      return {
        ...acc,
        balance: Math.round(balance * 100) / 100
      };
    });
  }, [accounts, cumulativeEntries]);

  // P&L Accounts & Totals
  const incomeAccounts = useMemo(() => periodAccountBalances.filter(a => a.category === 'Ingresos' && Math.abs(a.balance) > 0), [periodAccountBalances]);
  const costAccounts = useMemo(() => periodAccountBalances.filter(a => a.category === 'Costos' && Math.abs(a.balance) > 0), [periodAccountBalances]);
  const expenseAccounts = useMemo(() => periodAccountBalances.filter(a => a.category === 'Gastos' && Math.abs(a.balance) > 0), [periodAccountBalances]);

  const totalIncome = incomeAccounts.reduce((s, a) => s + a.balance, 0);
  const totalCosts = costAccounts.reduce((s, a) => s + a.balance, 0);
  const grossProfit = totalIncome - totalCosts;
  const totalExpenses = expenseAccounts.reduce((s, a) => s + a.balance, 0);
  const netIncome = grossProfit - totalExpenses;

  // Balance Sheet Accounts & Totals
  const assetAccounts = useMemo(() => cumulativeAccountBalances.filter(a => a.category === 'Activo' && Math.abs(a.balance) > 0), [cumulativeAccountBalances]);
  const liabilityAccounts = useMemo(() => cumulativeAccountBalances.filter(a => a.category === 'Pasivo' && Math.abs(a.balance) > 0), [cumulativeAccountBalances]);
  const equityAccounts = useMemo(() => cumulativeAccountBalances.filter(a => a.category === 'Patrimonio' && Math.abs(a.balance) > 0), [cumulativeAccountBalances]);

  const totalAssets = assetAccounts.reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = liabilityAccounts.reduce((s, a) => s + a.balance, 0);
  const totalBaseEquity = equityAccounts.reduce((s, a) => s + a.balance, 0);
  const totalEquity = totalBaseEquity + netIncome;
  const totalLiabilitiesAndEquity = totalLiabilities + totalEquity;

  const isBalanceSheetBalanced = Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.05;

  const lastDayOfMonth = selectedMonth > 0 ? new Date(selectedYear, selectedMonth, 0).getDate() : 31;
  const periodText = selectedMonth === 0 
    ? `Ejercicio Anual ${selectedYear} (Acumulado)` 
    : `Del 01 al ${lastDayOfMonth} de ${MONTH_NAMES[selectedMonth - 1]} de ${selectedYear}`;

  const asOfDateText = selectedMonth === 0
    ? `Al 31 de Diciembre de ${selectedYear}`
    : `Al ${lastDayOfMonth} de ${MONTH_NAMES[selectedMonth - 1]} de ${selectedYear}`;

  const handlePrint = () => {
    window.print();
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    if (activeStatement === 'pnl') {
      const rows: any[] = [
        ['EMPRESA:', company.name || ''],
        ['NOMBRE COMERCIAL:', company.tradeName || ''],
        ['NIT:', company.nit || '', 'NRC:', company.nrc || ''],
        ['GIRO / ACTIVIDAD:', company.activity || ''],
        ['ESTADO FINANCIERO:', 'ESTADO DE RESULTADOS (PÉRDIDAS Y GANANCIAS)'],
        ['PERÍODO:', periodText],
        ['MONEDA:', `Expresado en ${currency.name} (${currency.code})`],
        [''],
        ['CÓDIGO', 'CUENTA / RUBRO', 'INGRESOS', 'EGRESOS', 'SALDO TOTAL'],
        ['--- INGRESOS DE OPERACIÓN ---'],
        ...incomeAccounts.map(a => [a.code, a.name, a.credit, a.debit, a.balance]),
        ['', 'TOTAL INGRESOS', '', '', totalIncome],
        [''],
        ['--- COSTO DE VENTAS ---'],
        ...costAccounts.map(a => [a.code, a.name, '', a.debit, a.balance]),
        ['', 'TOTAL COSTO DE VENTAS', '', '', totalCosts],
        ['', 'UTILIDAD BRUTA', '', '', grossProfit],
        [''],
        ['--- GASTOS DE OPERACIÓN ---'],
        ...expenseAccounts.map(a => [a.code, a.name, '', a.debit, a.balance]),
        ['', 'TOTAL GASTOS DE OPERACIÓN', '', '', totalExpenses],
        [''],
        ['', netIncome >= 0 ? 'UTILIDAD NETA DEL EJERCICIO' : 'PÉRDIDA NETA DEL EJERCICIO', '', '', netIncome]
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'ESTADO_RESULTADOS');
      XLSX.writeFile(wb, `Estado_Resultados_${selectedMonth}_${selectedYear}.xlsx`);
    } else {
      const rows: any[] = [
        ['EMPRESA:', company.name || ''],
        ['NIT:', company.nit || '', 'NRC:', company.nrc || ''],
        ['ESTADO FINANCIERO:', 'BALANCE GENERAL (ESTADO DE SITUACIÓN FINANCIERA)'],
        ['FECHA:', asOfDateText],
        ['MONEDA:', `Expresado en ${currency.name} (${currency.code})`],
        [''],
        ['CÓDIGO', 'CUENTA DE ACTIVO', 'SALDO'],
        ...assetAccounts.map(a => [a.code, a.name, a.balance]),
        ['', 'TOTAL ACTIVOS', totalAssets],
        [''],
        ['CÓDIGO', 'CUENTA DE PASIVO', 'SALDO'],
        ...liabilityAccounts.map(a => [a.code, a.name, a.balance]),
        ['', 'TOTAL PASIVOS', totalLiabilities],
        [''],
        ['CÓDIGO', 'CUENTA DE PATRIMONIO', 'SALDO'],
        ...equityAccounts.map(a => [a.code, a.name, a.balance]),
        ['', 'Resultado / Utilidad del Período', netIncome],
        ['', 'TOTAL PATRIMONIO', totalEquity],
        [''],
        ['', 'TOTAL PASIVO + PATRIMONIO', totalLiabilitiesAndEquity]
      ];
      const ws = XLSX.utils.aoa_to_sheet(rows);
      XLSX.utils.book_append_sheet(wb, ws, 'BALANCE_GENERAL');
      XLSX.writeFile(wb, `Balance_General_${selectedMonth}_${selectedYear}.xlsx`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Controls & Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs print:hidden">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveStatement('pnl')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeStatement === 'pnl'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Estado de Resultados (P&L)
          </button>

          <button
            onClick={() => setActiveStatement('balanceSheet')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
              activeStatement === 'balanceSheet'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Scale className="w-4 h-4" />
            Balance General (Situación Financiera)
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedMonth}
              onChange={(e) => onMonthChange(parseInt(e.target.value, 10))}
              className="bg-transparent font-semibold text-slate-800 focus:outline-hidden"
            >
              <option value={0}>Todo el Año / Acumulado</option>
              {MONTH_NAMES.map((mName, idx) => (
                <option key={idx + 1} value={idx + 1}>{mName}</option>
              ))}
            </select>

            <input
              type="number"
              value={selectedYear}
              onChange={(e) => onYearChange(parseInt(e.target.value, 10) || 2025)}
              className="w-16 px-1.5 py-0.5 bg-white border border-slate-200 rounded font-semibold text-slate-800 text-center"
            />
          </div>

          <button
            onClick={handleExportExcel}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Excel
          </button>

          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir
          </button>
        </div>
      </div>

      {/* Main Printable Financial Document Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8 space-y-6">
        {/* Formal Institutional Header powered by state.companyInfo */}
        <div className="border-b-2 border-slate-900 pb-5 text-center space-y-1">
          <div className="flex items-center justify-center gap-2 text-indigo-700 font-bold tracking-wider text-xs uppercase mb-1">
            <Building2 className="w-4 h-4" />
            <span>{company.tradeName || 'SISTEMA INTEGRAL DE CONTABILIDAD'}</span>
          </div>

          <h1 className="text-lg md:text-xl font-black text-slate-950 uppercase tracking-tight">
            {company.name || 'DISTRIBUIDORA Y SERVICIOS INTEGRALES, S.A. DE C.V.'}
          </h1>

          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-slate-600 font-medium pt-1">
            <span><strong>NIT:</strong> {company.nit || '0614-150820-102-4'}</span>
            <span>•</span>
            <span><strong>NRC:</strong> {company.nrc || '284910-3'}</span>
            {company.activity && (
              <>
                <span>•</span>
                <span><strong>Giro:</strong> {company.activity}</span>
              </>
            )}
          </div>

          {company.address && (
            <p className="text-[11px] text-slate-500 max-w-2xl mx-auto">
              {company.address}
            </p>
          )}

          <div className="pt-3">
            <div className="inline-block px-4 py-1 rounded-full bg-slate-100 border border-slate-200">
              <h2 className="text-xs md:text-sm font-bold text-slate-900 uppercase tracking-wide">
                {activeStatement === 'pnl' 
                  ? 'ESTADO DE RESULTADOS (PÉRDIDAS Y GANANCIAS)' 
                  : 'BALANCE GENERAL (ESTADO DE SITUACIÓN FINANCIERA)'}
              </h2>
            </div>
            <p className="text-xs text-slate-600 mt-1 font-semibold">
              {activeStatement === 'pnl' ? periodText : asOfDateText}
            </p>
            <p className="text-[11px] text-slate-400 italic">
              (Cifras expresadas en Dólares de los Estados Unidos de América - USD)
            </p>
          </div>
        </div>

        {/* STATEMENT 1: ESTADO DE RESULTADOS (P&L) */}
        {activeStatement === 'pnl' && (
          <div className="space-y-6 text-xs max-w-4xl mx-auto">
            {/* Section I: Ingresos de Operación */}
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-100 px-3 py-2 rounded-lg font-bold text-slate-900 border-l-4 border-emerald-500">
                <span>I. INGRESOS DE OPERACIÓN / VENTAS</span>
                <span className="font-mono text-sm">{formatCurrency(totalIncome, currency)}</span>
              </div>
              <div className="pl-4 pr-2 space-y-1.5">
                {incomeAccounts.length === 0 ? (
                  <p className="text-slate-400 italic py-1">Sin movimientos de ingresos registrados en este período.</p>
                ) : (
                  incomeAccounts.map(acc => (
                    <div key={acc.code} className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-700">
                        <strong className="font-mono text-slate-900 mr-2">{acc.code}</strong> {acc.name}
                      </span>
                      <span className="font-mono font-medium text-slate-900">{formatCurrency(acc.balance, currency)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Section II: Costo de Ventas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-100 px-3 py-2 rounded-lg font-bold text-slate-900 border-l-4 border-amber-500">
                <span>II. MENOS: COSTO DE VENTAS Y MERCADERÍAS</span>
                <span className="font-mono text-sm text-amber-900">({formatCurrency(totalCosts, currency)})</span>
              </div>
              <div className="pl-4 pr-2 space-y-1.5">
                {costAccounts.length === 0 ? (
                  <p className="text-slate-400 italic py-1">Sin costos de ventas registrados en este período.</p>
                ) : (
                  costAccounts.map(acc => (
                    <div key={acc.code} className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-700">
                        <strong className="font-mono text-slate-900 mr-2">{acc.code}</strong> {acc.name}
                      </span>
                      <span className="font-mono font-medium text-slate-900">{formatCurrency(acc.balance, currency)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Gross Profit Subtotal */}
            <div className="flex items-center justify-between bg-emerald-50/80 border border-emerald-200 px-4 py-2.5 rounded-xl font-bold text-emerald-950 text-sm shadow-2xs">
              <span>(=) UTILIDAD BRUTA EN VENTAS</span>
              <span className="font-mono text-base">{formatCurrency(grossProfit, currency)}</span>
            </div>

            {/* Section III: Gastos de Operación */}
            <div className="space-y-2">
              <div className="flex items-center justify-between bg-slate-100 px-3 py-2 rounded-lg font-bold text-slate-900 border-l-4 border-rose-500">
                <span>III. MENOS: GASTOS DE OPERACIÓN (ADMINISTRACIÓN / VENTAS / FINANCIEROS)</span>
                <span className="font-mono text-sm text-rose-900">({formatCurrency(totalExpenses, currency)})</span>
              </div>
              <div className="pl-4 pr-2 space-y-1.5">
                {expenseAccounts.length === 0 ? (
                  <p className="text-slate-400 italic py-1">Sin gastos de operación registrados en este período.</p>
                ) : (
                  expenseAccounts.map(acc => (
                    <div key={acc.code} className="flex items-center justify-between py-1 border-b border-slate-100">
                      <span className="text-slate-700">
                        <strong className="font-mono text-slate-900 mr-2">{acc.code}</strong> {acc.name}
                      </span>
                      <span className="font-mono font-medium text-slate-900">{formatCurrency(acc.balance, currency)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Net Income Final Result */}
            <div className={`flex items-center justify-between px-5 py-4 rounded-xl border-2 font-bold text-sm md:text-base shadow-sm ${
              netIncome >= 0 
                ? 'bg-emerald-600 text-white border-emerald-700' 
                : 'bg-rose-600 text-white border-rose-700'
            }`}>
              <div>
                <span className="block uppercase tracking-wider text-xs text-white/80">Resultado Económico Final</span>
                <span>{netIncome >= 0 ? '(=) UTILIDAD NETA DEL EJERCICIO' : '(=) PÉRDIDA NETA DEL EJERCICIO'}</span>
              </div>
              <span className="font-mono text-xl md:text-2xl font-black">
                {formatCurrency(netIncome, currency)}
              </span>
            </div>
          </div>
        )}

        {/* STATEMENT 2: BALANCE GENERAL */}
        {activeStatement === 'balanceSheet' && (
          <div className="space-y-6 text-xs max-w-4xl mx-auto">
            {/* Activos vs Pasivos + Patrimonio Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* LADO IZQUIERDO: ACTIVOS */}
              <div className="space-y-4">
                <div className="bg-slate-900 text-white px-3.5 py-2 rounded-lg font-bold flex items-center justify-between">
                  <span>ACTIVO</span>
                  <span className="font-mono">{formatCurrency(totalAssets, currency)}</span>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-slate-800 uppercase text-[11px] block border-b border-slate-200 pb-1">
                    Activo Corriente y No Corriente
                  </span>
                  <div className="space-y-1.5">
                    {assetAccounts.length === 0 ? (
                      <p className="text-slate-400 italic">Sin cuentas de activo con saldo.</p>
                    ) : (
                      assetAccounts.map(acc => (
                        <div key={acc.code} className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-700 truncate pr-2">
                            <strong className="font-mono text-slate-900">{acc.code}</strong> {acc.name}
                          </span>
                          <span className="font-mono font-medium text-slate-900">{formatCurrency(acc.balance, currency)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-lg font-bold text-emerald-950">
                  <span>TOTAL ACTIVOS</span>
                  <span className="font-mono text-sm">{formatCurrency(totalAssets, currency)}</span>
                </div>
              </div>

              {/* LADO DERECHO: PASIVOS Y PATRIMONIO */}
              <div className="space-y-4">
                {/* Pasivos */}
                <div className="bg-slate-900 text-white px-3.5 py-2 rounded-lg font-bold flex items-center justify-between">
                  <span>PASIVO</span>
                  <span className="font-mono">{formatCurrency(totalLiabilities, currency)}</span>
                </div>

                <div className="space-y-2">
                  <span className="font-bold text-slate-800 uppercase text-[11px] block border-b border-slate-200 pb-1">
                    Pasivo Corriente y Obligaciones
                  </span>
                  <div className="space-y-1.5">
                    {liabilityAccounts.length === 0 ? (
                      <p className="text-slate-400 italic">Sin cuentas de pasivo con saldo.</p>
                    ) : (
                      liabilityAccounts.map(acc => (
                        <div key={acc.code} className="flex justify-between py-1 border-b border-slate-100">
                          <span className="text-slate-700 truncate pr-2">
                            <strong className="font-mono text-slate-900">{acc.code}</strong> {acc.name}
                          </span>
                          <span className="font-mono font-medium text-slate-900">{formatCurrency(acc.balance, currency)}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Patrimonio */}
                <div className="pt-2">
                  <div className="bg-slate-800 text-white px-3.5 py-2 rounded-lg font-bold flex items-center justify-between">
                    <span>PATRIMONIO NETO</span>
                    <span className="font-mono">{formatCurrency(totalEquity, currency)}</span>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    {equityAccounts.map(acc => (
                      <div key={acc.code} className="flex justify-between py-1 border-b border-slate-100">
                        <span className="text-slate-700 truncate pr-2">
                          <strong className="font-mono text-slate-900">{acc.code}</strong> {acc.name}
                        </span>
                        <span className="font-mono font-medium text-slate-900">{formatCurrency(acc.balance, currency)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between py-1 border-b border-slate-100 text-indigo-700 font-semibold">
                      <span>Resultado / Utilidad Neta del Ejercicio</span>
                      <span className="font-mono">{formatCurrency(netIncome, currency)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between bg-slate-100 border border-slate-300 px-3.5 py-2 rounded-lg font-bold text-slate-900">
                  <span>TOTAL PASIVO + PATRIMONIO</span>
                  <span className="font-mono text-sm">{formatCurrency(totalLiabilitiesAndEquity, currency)}</span>
                </div>
              </div>
            </div>

            {/* Verification Balance Check */}
            <div className={`p-3 rounded-xl border flex items-center justify-between font-bold ${
              isBalanceSheetBalanced 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-center gap-2">
                {isBalanceSheetBalanced ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
                <span>
                  {isBalanceSheetBalanced 
                    ? 'Ecuación Patrimonial Cuadrada (Activo = Pasivo + Patrimonio)' 
                    : `Diferencia de Cuadratura: ${formatCurrency(Math.abs(totalAssets - totalLiabilitiesAndEquity), currency)}`}
                </span>
              </div>
              <span className="font-mono">
                ${totalAssets.toFixed(2)} = ${totalLiabilitiesAndEquity.toFixed(2)}
              </span>
            </div>
          </div>
        )}

        {/* Legal and Accounting Signatures Footer for Print/Audit */}
        <div className="pt-10 border-t border-slate-200 grid grid-cols-2 gap-8 text-center text-xs">
          <div className="space-y-1">
            <div className="w-48 border-b border-slate-400 mx-auto mb-2" />
            <p className="font-bold text-slate-900">Contador General</p>
            <p className="text-[11px] text-slate-500">Reg. N° 45892-CV</p>
          </div>
          <div className="space-y-1">
            <div className="w-48 border-b border-slate-400 mx-auto mb-2" />
            <p className="font-bold text-slate-900">Representante Legal</p>
            <p className="text-[11px] text-slate-500">{company.name || 'Empresa S.A. de C.V.'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
