import React, { useState, useMemo } from 'react';
import { 
  AppState, 
  JournalEntry,
  ChartAccount
} from '../../types';
import { 
  addJournalEntry, 
  updateJournalEntry, 
  deleteJournalEntry, 
  getCurrencyConfig, 
  getChartOfAccounts
} from '../../services/dataStore';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Download, 
  Scale, 
  DollarSign, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  Trash2, 
  Edit3, 
  Layers, 
  FileSpreadsheet, 
  X, 
  HelpCircle,
  FileCheck2,
  Calendar,
  Sparkles,
  Printer,
  Building2,
  ListOrdered
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { MonthlyBatchModal } from './MonthlyBatchModal';
import { CatalogManager } from './CatalogManager';
import { FinancialStatementsView } from './FinancialStatementsView';
import { PrintableEntryModal } from './PrintableEntryModal';
import { formatCurrency, parseLocalDate } from '../../utils/numberToWords';

interface AccountingManagerProps {
  state: AppState;
}

type AccountingTab = 'entries' | 'ledger' | 'financials' | 'catalog';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const AccountingManager: React.FC<AccountingManagerProps> = ({ state }) => {
  const currency = getCurrencyConfig();
  const company = state.companyInfo;

  // Selected Tab & Period
  const [activeTab, setActiveTab] = useState<AccountingTab>('entries');
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | null>(null);
  const [deleteConfirmEntry, setDeleteConfirmEntry] = useState<JournalEntry | null>(null);
  const [viewingVoucherEntry, setViewingVoucherEntry] = useState<JournalEntry | null>(null);

  // New / Edit Entry Form State
  const [entryDate, setEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [entryConcept, setEntryConcept] = useState('');
  const [entrySourceType, setEntrySourceType] = useState<JournalEntry['sourceType']>('Ajuste');
  const [entryRefDoc, setEntryRefDoc] = useState('');
  const [entryLines, setEntryLines] = useState<{
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
  }[]>([
    { accountCode: '1101', accountName: 'Efectivo y Equivalentes de Efectivo (Caja General)', debit: 0, credit: 0 },
    { accountCode: '4101', accountName: 'Ingresos por Ventas Gravadas (Mercaderías Locales)', debit: 0, credit: 0 }
  ]);

  const accounts = useMemo(() => {
    return state.chartOfAccounts && state.chartOfAccounts.length > 0 
      ? state.chartOfAccounts 
      : getChartOfAccounts();
  }, [state.chartOfAccounts]);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Filtered Journal Entries by Month/Year & Search Term
  const filteredEntries = useMemo(() => {
    return state.journalEntries.filter(entry => {
      const d = parseLocalDate(entry.date);
      const matchYear = selectedYear === 0 || d.getFullYear() === selectedYear;
      const matchMonth = selectedMonth === 0 || (d.getMonth() + 1 === selectedMonth);
      
      const matchSearch = searchTerm === '' ||
        entry.concept.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.entryNumber.toString().includes(searchTerm) ||
        (entry.referenceDoc && entry.referenceDoc.toLowerCase().includes(searchTerm.toLowerCase())) ||
        entry.lines.some(l => l.accountCode.includes(searchTerm) || l.accountName.toLowerCase().includes(searchTerm.toLowerCase()));

      return matchYear && matchMonth && matchSearch;
    }).sort((a, b) => b.entryNumber - a.entryNumber);
  }, [state.journalEntries, selectedMonth, selectedYear, searchTerm]);

  // General Ledger Computation based on filtered entries of selected period
  const accountBalances = useMemo(() => {
    const map = new Map<string, { code: string; name: string; category: string; debitTotal: number; creditTotal: number }>();

    // Initialize with live chart
    accounts.forEach(acc => {
      map.set(acc.code, {
        code: acc.code,
        name: acc.name,
        category: acc.category,
        debitTotal: 0,
        creditTotal: 0
      });
    });

    // Accumulate from filtered period entries
    filteredEntries.forEach(entry => {
      entry.lines.forEach(line => {
        let acc = map.get(line.accountCode);
        if (!acc) {
          acc = {
            code: line.accountCode,
            name: line.accountName,
            category: 'Otros',
            debitTotal: 0,
            creditTotal: 0
          };
          map.set(line.accountCode, acc);
        }
        acc.debitTotal += (line.debit || 0);
        acc.creditTotal += (line.credit || 0);
      });
    });

    return Array.from(map.values()).map(acc => {
      let balance = 0;
      if (['Activo', 'Costos', 'Gastos'].includes(acc.category)) {
        balance = acc.debitTotal - acc.creditTotal;
      } else {
        balance = acc.creditTotal - acc.debitTotal;
      }
      return {
        ...acc,
        balance: Math.round(balance * 100) / 100
      };
    }).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  }, [accounts, filteredEntries]);

  // Trial Balance totals
  const totalPeriodDebits = filteredEntries.reduce((s, e) => s + e.totalDebit, 0);
  const totalPeriodCredits = filteredEntries.reduce((s, e) => s + e.totalCredit, 0);
  const isPeriodBalanced = Math.abs(totalPeriodDebits - totalPeriodCredits) < 0.01;

  // New / Edit Modal Line Handlers
  const handleAddLine = () => {
    setEntryLines([
      ...entryLines,
      { accountCode: accounts[0]?.code || '1101', accountName: accounts[0]?.name || 'Efectivo y Equivalentes', debit: 0, credit: 0 }
    ]);
  };

  const handleRemoveLine = (index: number) => {
    if (entryLines.length <= 2) return;
    setEntryLines(entryLines.filter((_, i) => i !== index));
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const updated = [...entryLines];
    if (field === 'accountCode') {
      const selected = accounts.find(a => a.code === value);
      updated[index].accountCode = value;
      if (selected) updated[index].accountName = selected.name;
    } else {
      (updated[index] as any)[field] = value;
    }
    setEntryLines(updated);
  };

  const totalModalDebit = entryLines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalModalCredit = entryLines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const isModalBalanced = Math.abs(totalModalDebit - totalModalCredit) < 0.001 && totalModalDebit > 0;

  const handleOpenNewEntryModal = () => {
    setEditingEntry(null);
    setEntryDate(new Date().toISOString().split('T')[0]);
    setEntryConcept('');
    setEntrySourceType('Ajuste');
    setEntryRefDoc('');
    setEntryLines([
      { accountCode: '1101', accountName: 'Efectivo y Equivalentes de Efectivo (Caja General)', debit: 0, credit: 0 },
      { accountCode: '4101', accountName: 'Ingresos por Ventas Gravadas (Mercaderías Locales)', debit: 0, credit: 0 }
    ]);
    setIsEntryModalOpen(true);
  };

  const handleOpenEditEntry = (entry: JournalEntry) => {
    setEditingEntry(entry);
    setEntryDate(entry.date);
    setEntryConcept(entry.concept);
    setEntrySourceType(entry.sourceType);
    setEntryRefDoc(entry.referenceDoc || '');
    setEntryLines(entry.lines.map(l => ({ ...l })));
    setIsEntryModalOpen(true);
  };

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isModalBalanced) return;

    if (editingEntry) {
      updateJournalEntry(editingEntry.id, {
        date: entryDate,
        concept: entryConcept,
        sourceType: entrySourceType,
        referenceDoc: entryRefDoc || undefined,
        lines: entryLines,
        totalDebit: Math.round(totalModalDebit * 100) / 100,
        totalCredit: Math.round(totalModalCredit * 100) / 100
      });
      showNotification(`Partida #${editingEntry.entryNumber} actualizada exitosamente.`);
    } else {
      const newEntry = addJournalEntry({
        date: entryDate,
        concept: entryConcept,
        sourceType: entrySourceType,
        referenceDoc: entryRefDoc || undefined,
        lines: entryLines,
        totalDebit: Math.round(totalModalDebit * 100) / 100,
        totalCredit: Math.round(totalModalCredit * 100) / 100
      });
      showNotification(`Partida #${newEntry.entryNumber} guardada exitosamente.`);
    }

    setIsEntryModalOpen(false);
    setEditingEntry(null);
  };

  // Export Journal to Excel
  const handleExportJournalExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows: any[] = [
      ['EMPRESA:', company.name || ''],
      ['NIT:', company.nit || '', 'NRC:', company.nrc || ''],
      ['LIBRO DIARIO DE CONTABILIDAD'],
      ['PERÍODO:', selectedMonth === 0 ? `Año ${selectedYear}` : `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`],
      [''],
      ['N° PARTIDA', 'FECHA', 'TIPO', 'DOC REF', 'CONCEPTO / GLOSA', 'CÓDIGO CUENTA', 'NOMBRE CUENTA', 'DEBE', 'HABER']
    ];

    filteredEntries.forEach(entry => {
      entry.lines.forEach((line, idx) => {
        rows.push([
          idx === 0 ? entry.entryNumber : '',
          idx === 0 ? entry.date : '',
          idx === 0 ? entry.sourceType : '',
          idx === 0 ? (entry.referenceDoc || '') : '',
          idx === 0 ? entry.concept : '',
          line.accountCode,
          line.accountName,
          line.debit,
          line.credit
        ]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'LIBRO_DIARIO');
    XLSX.writeFile(wb, `Libro_Diario_${selectedMonth}_${selectedYear}.xlsx`);
    showNotification('Libro Diario exportado a Excel.');
  };

  // Export Trial Balance to Excel
  const handleExportLedgerExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows: any[] = [
      ['EMPRESA:', company.name || ''],
      ['NIT:', company.nit || '', 'NRC:', company.nrc || ''],
      ['BALANZA DE COMPROBACIÓN Y SALDOS'],
      ['PERÍODO:', selectedMonth === 0 ? `Año ${selectedYear}` : `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`],
      [''],
      ['CÓDIGO', 'NOMBRE DE LA CUENTA', 'CATEGORÍA', 'TOTAL DEBE', 'TOTAL HABER', 'SALDO DEUDOR', 'SALDO ACREEDOR']
    ];

    accountBalances.filter(a => a.debitTotal > 0 || a.creditTotal > 0).forEach(a => {
      const isDeudora = ['Activo', 'Costos', 'Gastos'].includes(a.category);
      rows.push([
        a.code,
        a.name,
        a.category,
        a.debitTotal,
        a.creditTotal,
        isDeudora ? a.balance : 0,
        !isDeudora ? a.balance : 0
      ]);
    });

    rows.push([
      'TOTALES',
      '',
      '',
      totalPeriodDebits,
      totalPeriodCredits,
      totalPeriodDebits,
      totalPeriodCredits
    ]);

    const ws = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'BALANZA_COMPROBACION');
    XLSX.writeFile(wb, `Balanza_Comprobacion_${selectedMonth}_${selectedYear}.xlsx`);
    showNotification('Balanza de Comprobación exportada a Excel.');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-3">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP HEADER: Company Identity from Settings & Global Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 md:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider mb-1">
              <Building2 className="w-4 h-4" />
              <span>{company.tradeName || 'SISTEMA INTEGRAL DE CONTABILIDAD'}</span>
            </div>
            <h1 className="text-xl md:text-2xl font-black text-slate-950 tracking-tight">
              Módulo de Contabilidad General y Estados Financieros
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 mt-1">
              <span><strong>Razón Social:</strong> {company.name || 'DISTRIBUIDORA Y SERVICIOS INTEGRALES, S.A. DE C.V.'}</span>
              <span>•</span>
              <span><strong>NIT:</strong> {company.nit || '0614-150820-102-4'}</span>
              <span>•</span>
              <span><strong>NRC:</strong> {company.nrc || '284910-3'}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsBatchModalOpen(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              Generar Partidas por Mes
            </button>

            <button
              onClick={handleOpenNewEntryModal}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              Nueva Partida Manual
            </button>
          </div>
        </div>

        {/* Global Period Selector Banner & Tab Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          {/* Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('entries')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'entries'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Libro Diario ({state.journalEntries.length})
            </button>

            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'ledger'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              Balanza de Comprobación
            </button>

            <button
              onClick={() => setActiveTab('financials')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'financials'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Estados Financieros (P&L / Balance)
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'catalog'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Catálogo de Cuentas ({accounts.length})
            </button>
          </div>

          {/* Period Selector (Month & Year) */}
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-semibold text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>Período:</span>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
                className="bg-transparent font-bold text-slate-900 focus:outline-hidden"
              >
                <option value={0}>Todos los Meses</option>
                {MONTH_NAMES.map((mName, idx) => (
                  <option key={idx + 1} value={idx + 1}>{mName}</option>
                ))}
              </select>

              <input
                type="number"
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10) || 2025)}
                className="w-16 px-1 py-0.5 bg-white border border-slate-200 rounded font-bold text-slate-900 text-center"
              />
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: LIBRO DIARIO (JOURNAL ENTRIES) */}
      {activeTab === 'entries' && (
        <div className="space-y-4">
          {/* Summary & Search Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por concepto, N° de partida, documento ref o cuenta..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportJournalExcel}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                Exportar Libro Diario
              </button>
            </div>
          </div>

          {/* Entries Cards List */}
          {filteredEntries.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
              <h3 className="font-bold text-slate-800 text-base">No hay partidas contables para el período seleccionado</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No se encontraron asientos contables en {selectedMonth === 0 ? `el año ${selectedYear}` : `${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`}. Puede generar las partidas de ventas y compras automáticamente con un solo clic.
              </p>
              <button
                onClick={() => setIsBatchModalOpen(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles className="w-4 h-4" />
                Generar Partidas de este Mes Ahora
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map(entry => {
                const getSourceBadge = () => {
                  switch (entry.sourceType) {
                    case 'Venta': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    case 'Compra': return 'bg-blue-50 text-blue-700 border-blue-200';
                    case 'Cobro': return 'bg-teal-50 text-teal-700 border-teal-200';
                    case 'Pago': return 'bg-amber-50 text-amber-700 border-amber-200';
                    default: return 'bg-slate-100 text-slate-700 border-slate-200';
                  }
                };

                return (
                  <div 
                    key={entry.id}
                    id={`journal-entry-${entry.id}`}
                    className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow overflow-hidden"
                  >
                    {/* Entry Card Header */}
                    <div className="p-4 bg-slate-50/70 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-black flex items-center justify-center text-xs shadow-2xs">
                          #{entry.entryNumber}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">Fecha: {entry.date}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getSourceBadge()}`}>
                              {entry.sourceType}
                            </span>
                            {entry.referenceDoc && (
                              <span className="text-[11px] font-mono text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                Doc: {entry.referenceDoc}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 font-medium">{entry.concept}</p>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewingVoucherEntry(entry)}
                          className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                          title="Ver e Imprimir Comprobante Oficial"
                        >
                          <Printer className="w-3.5 h-3.5 text-indigo-600" />
                          Imprimir
                        </button>
                        <button
                          onClick={() => handleOpenEditEntry(entry)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Modificar Partida"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmEntry(entry)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Eliminar Partida"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Entry Lines Table */}
                    <div className="p-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50/50 text-slate-500 font-semibold uppercase text-[10px] border-b border-slate-100">
                            <tr>
                              <th className="py-2 px-3 w-28">Código</th>
                              <th className="py-2 px-3">Cuenta Contable</th>
                              <th className="py-2 px-3 text-right w-32">Debe ({currency.symbol})</th>
                              <th className="py-2 px-3 text-right w-32">Haber ({currency.symbol})</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100/60 font-mono">
                            {entry.lines.map((line, idx) => (
                              <tr key={idx} className={line.credit > 0 ? 'bg-slate-50/30' : ''}>
                                <td className="py-2 px-3 font-bold text-indigo-700">{line.accountCode}</td>
                                <td className={`py-2 px-3 font-sans ${line.credit > 0 ? 'pl-6 text-slate-700' : 'font-semibold text-slate-900'}`}>
                                  {line.accountName}
                                </td>
                                <td className="py-2 px-3 text-right font-medium text-slate-900">
                                  {line.debit > 0 ? formatCurrency(line.debit, currency) : '-'}
                                </td>
                                <td className="py-2 px-3 text-right font-medium text-slate-900">
                                  {line.credit > 0 ? formatCurrency(line.credit, currency) : '-'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-slate-50 font-bold text-slate-900 text-xs border-t border-slate-200">
                            <tr>
                              <td colSpan={2} className="py-2 px-3 text-right font-sans uppercase text-[11px]">
                                Sumas Iguales:
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-indigo-900">
                                {formatCurrency(entry.totalDebit, currency)}
                              </td>
                              <td className="py-2 px-3 text-right font-mono text-indigo-900">
                                {formatCurrency(entry.totalCredit, currency)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BALANZA DE COMPROBACIÓN & LIBRO MAYOR */}
      {activeTab === 'ledger' && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            {/* Header */}
            <div className="border-b pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Scale className="w-5 h-5 text-indigo-600" />
                  Balanza de Comprobación y Saldos de Cuentas de Mayor
                </h2>
                <p className="text-xs text-slate-500">
                  {selectedMonth === 0 ? `Movimientos correspondientes al Ejercicio ${selectedYear}` : `Movimientos de ${MONTH_NAMES[selectedMonth - 1]} de ${selectedYear}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportLedgerExcel}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Exportar Balanza
                </button>
              </div>
            </div>

            {/* Trial Balance Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-700 uppercase font-semibold text-[11px] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 w-28">Código</th>
                    <th className="px-4 py-3">Nombre de la Cuenta</th>
                    <th className="px-4 py-3 w-28">Rubro</th>
                    <th className="px-4 py-3 text-right w-32">Total Debe</th>
                    <th className="px-4 py-3 text-right w-32">Total Haber</th>
                    <th className="px-4 py-3 text-right w-32">Saldo Deudor</th>
                    <th className="px-4 py-3 text-right w-32">Saldo Acreedor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {accountBalances.filter(a => a.debitTotal > 0 || a.creditTotal > 0).map(acc => {
                    const isDeudor = ['Activo', 'Costos', 'Gastos'].includes(acc.category);
                    return (
                      <tr key={acc.code} className="hover:bg-slate-50">
                        <td className="px-4 py-2.5 font-bold text-indigo-700">{acc.code}</td>
                        <td className="px-4 py-2.5 font-sans font-medium text-slate-900">{acc.name}</td>
                        <td className="px-4 py-2.5 font-sans">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                            {acc.category}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-slate-800">
                          {acc.debitTotal > 0 ? formatCurrency(acc.debitTotal, currency) : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-medium text-slate-800">
                          {acc.creditTotal > 0 ? formatCurrency(acc.creditTotal, currency) : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-emerald-700">
                          {isDeudor && acc.balance > 0 ? formatCurrency(acc.balance, currency) : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-indigo-700">
                          {!isDeudor && acc.balance > 0 ? formatCurrency(acc.balance, currency) : '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 font-bold text-slate-950 border-t-2 border-slate-300">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 font-sans uppercase text-right">
                      Sumas Iguales de Comprobación:
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-indigo-900">
                      {formatCurrency(totalPeriodDebits, currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-indigo-900">
                      {formatCurrency(totalPeriodCredits, currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-emerald-900">
                      {formatCurrency(totalPeriodDebits, currency)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-indigo-900">
                      {formatCurrency(totalPeriodCredits, currency)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Cuadratura Indicator */}
            <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-bold ${
              isPeriodBalanced 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-center gap-2">
                {isPeriodBalanced ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
                <span>
                  {isPeriodBalanced 
                    ? 'Balanza de Comprobación perfectamente cuadrada (Total Debe = Total Haber)' 
                    : `Diferencia de Cuadratura: ${currency.symbol} ${Math.abs(totalPeriodDebits - totalPeriodCredits).toFixed(2)}`}
                </span>
              </div>
              <span className="font-mono">
                ${totalPeriodDebits.toFixed(2)} = ${totalPeriodCredits.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ESTADOS FINANCIEROS (P&L & BALANCE SHEET) */}
      {activeTab === 'financials' && (
        <FinancialStatementsView
          state={state}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
        />
      )}

      {/* TAB 4: CATÁLOGO DE CUENTAS */}
      {activeTab === 'catalog' && (
        <CatalogManager
          state={state}
          onNotification={showNotification}
        />
      )}

      {/* MONTHLY BATCH GENERATOR MODAL */}
      {isBatchModalOpen && (
        <MonthlyBatchModal
          state={state}
          selectedMonth={selectedMonth === 0 ? 1 : selectedMonth}
          selectedYear={selectedYear}
          onClose={() => setIsBatchModalOpen(false)}
          onSuccess={(msg) => {
            showNotification(msg);
            setIsBatchModalOpen(false);
          }}
        />
      )}

      {/* PRINTABLE VOUCHER MODAL */}
      {viewingVoucherEntry && (
        <PrintableEntryModal
          entry={viewingVoucherEntry}
          state={state}
          onClose={() => setViewingVoucherEntry(null)}
        />
      )}

      {/* DELETE CONFIRM JOURNAL ENTRY MODAL */}
      {deleteConfirmEntry && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-lg text-slate-900">Eliminar Partida Contable</h3>
            </div>
            <p className="text-sm text-slate-600 mb-2">
              ¿Está seguro de eliminar la <strong className="text-slate-900">Partida #{deleteConfirmEntry.entryNumber}</strong>?
            </p>
            <p className="text-xs text-slate-500 font-mono bg-slate-50 p-2.5 rounded-lg border border-slate-200 mb-4">
              {deleteConfirmEntry.concept}
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmEntry(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteJournalEntry(deleteConfirmEntry.id);
                  showNotification(`Partida #${deleteConfirmEntry.entryNumber} eliminada.`);
                  setDeleteConfirmEntry(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar Partida
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW / EDIT JOURNAL ENTRY MODAL */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {editingEntry ? <Edit3 className="w-5 h-5 text-indigo-600" /> : <Plus className="w-5 h-5 text-indigo-600" />}
                {editingEntry ? `Modificar Partida Contable #${editingEntry.entryNumber}` : 'Registrar Nueva Partida Contable'}
              </h2>
              <button
                onClick={() => {
                  setEditingEntry(null);
                  setIsEntryModalOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEntry} className="mt-4 space-y-4 text-xs flex-1 overflow-y-auto pr-1">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Fecha de la Partida</label>
                  <input
                    type="date"
                    required
                    value={entryDate}
                    onChange={(e) => setEntryDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Tipo de Asiento</label>
                  <select
                    value={entrySourceType}
                    onChange={(e) => setEntrySourceType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value="Ajuste">Ajuste de Operación</option>
                    <option value="Venta">Ventas / Facturación</option>
                    <option value="Compra">Compras e Insumos</option>
                    <option value="Cobro">Cobro a Clientes</option>
                    <option value="Pago">Pago a Proveedores / Nómina</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Doc. Referencia</label>
                  <input
                    type="text"
                    value={entryRefDoc}
                    onChange={(e) => setEntryRefDoc(e.target.value)}
                    placeholder="CCF #102, Planilla 01..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Concepto / Glosa de la Partida *</label>
                <input
                  type="text"
                  required
                  value={entryConcept}
                  onChange={(e) => setEntryConcept(e.target.value)}
                  placeholder="Por registro de venta / compra / amortización..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-sm"
                />
              </div>

              {/* Entry Lines */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-800">Cuentas y Movimientos (Debe / Haber)</label>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Cuenta
                  </button>
                </div>

                <div className="space-y-2">
                  {entryLines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200/70">
                      <div className="flex-1">
                        <select
                          value={line.accountCode}
                          onChange={(e) => handleLineChange(idx, 'accountCode', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs focus:ring-2 focus:ring-indigo-500"
                        >
                          {accounts.map(a => (
                            <option key={a.code} value={a.code}>
                              {a.code} - {a.name} ({a.category})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Debe $"
                          value={line.debit || ''}
                          onChange={(e) => handleLineChange(idx, 'debit', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-right font-mono font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      <div className="w-28">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="Haber $"
                          value={line.credit || ''}
                          onChange={(e) => handleLineChange(idx, 'credit', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-right font-mono font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>

                      {entryLines.length > 2 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(idx)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Totals & Balance indicator */}
                <div className="bg-slate-100 p-3 rounded-xl flex items-center justify-between font-bold text-xs mt-3">
                  <div className="flex items-center gap-2">
                    {isModalBalanced ? (
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" /> Partida Cuadrada
                      </span>
                    ) : (
                      <span className="text-rose-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" /> Diferencia: {currency.symbol} {Math.abs(totalModalDebit - totalModalCredit).toFixed(2)}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <span>Debe: <strong className="font-mono text-slate-900">${totalModalDebit.toFixed(2)}</strong></span>
                    <span>Haber: <strong className="font-mono text-slate-900">${totalModalCredit.toFixed(2)}</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setEditingEntry(null);
                    setIsEntryModalOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!isModalBalanced}
                  className={`px-5 py-2 text-xs font-semibold text-white rounded-lg transition-colors flex items-center gap-1.5 shadow-xs ${
                    isModalBalanced ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-300 cursor-not-allowed'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {editingEntry ? 'Actualizar Partida' : 'Guardar Partida'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
