import React from 'react';
import { 
  X, 
  Printer, 
  Building2, 
  CheckCircle2, 
  Calendar, 
  Receipt,
  FileText
} from 'lucide-react';
import { JournalEntry, AppState } from '../../types';
import { formatCurrency } from '../../utils/numberToWords';

interface PrintableEntryModalProps {
  entry: JournalEntry;
  state: AppState;
  onClose: () => void;
}

export const PrintableEntryModal: React.FC<PrintableEntryModalProps> = ({
  entry,
  state,
  onClose
}) => {
  const company = state.companyInfo;
  const currency = state.currencyConfig;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 print:hidden">
          <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            Comprobante de Asiento de Diario #{entry.entryNumber}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Partida
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Content */}
        <div className="mt-4 text-xs flex-1 overflow-y-auto pr-1 space-y-5 p-4 border border-slate-200 rounded-xl bg-white">
          {/* Institutional Header */}
          <div className="border-b-2 border-slate-900 pb-3 text-center space-y-1">
            <h2 className="text-base font-black text-slate-950 uppercase">
              {company.name || 'DISTRIBUIDORA Y SERVICIOS INTEGRALES, S.A. DE C.V.'}
            </h2>
            <div className="flex items-center justify-center gap-3 text-slate-600 text-[11px]">
              <span>NIT: {company.nit}</span>
              <span>•</span>
              <span>NRC: {company.nrc}</span>
              {company.activity && (
                <>
                  <span>•</span>
                  <span>Giro: {company.activity}</span>
                </>
              )}
            </div>
            <div className="pt-2">
              <span className="inline-block px-3 py-0.5 rounded-full bg-slate-900 text-white text-xs font-bold uppercase tracking-wider">
                COMPROBANTE DE DIARIO / PARTIDA CONTABLE N° {entry.entryNumber}
              </span>
            </div>
          </div>

          {/* Entry Info Grid */}
          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Fecha de Asiento:</span>
              <span className="font-semibold text-slate-900">{entry.date}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Tipo de Operación:</span>
              <span className="font-semibold text-indigo-700">{entry.sourceType}</span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Documento Ref:</span>
              <span className="font-semibold text-slate-900 font-mono">{entry.referenceDoc || 'N/A'}</span>
            </div>
            <div className="col-span-3 pt-1 border-t border-slate-200">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Concepto / Glosa:</span>
              <p className="font-medium text-slate-800">{entry.concept}</p>
            </div>
          </div>

          {/* Lines Table */}
          <table className="w-full text-left border border-slate-200 rounded-lg overflow-hidden">
            <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-2 w-24">Código</th>
                <th className="p-2">Descripción de la Cuenta</th>
                <th className="p-2 text-right w-28">Debe ({currency.symbol})</th>
                <th className="p-2 text-right w-28">Haber ({currency.symbol})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {entry.lines.map((line, idx) => (
                <tr key={idx} className={line.debit > 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="p-2 font-bold text-slate-900">{line.accountCode}</td>
                  <td className={`p-2 font-sans ${line.credit > 0 ? 'pl-6 text-slate-700' : 'font-semibold text-slate-900'}`}>
                    {line.accountName}
                  </td>
                  <td className="p-2 text-right font-semibold text-slate-900">
                    {line.debit > 0 ? formatCurrency(line.debit, currency) : '-'}
                  </td>
                  <td className="p-2 text-right font-semibold text-slate-900">
                    {line.credit > 0 ? formatCurrency(line.credit, currency) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
              <tr>
                <td colSpan={2} className="p-2.5 text-right font-sans uppercase text-[11px]">
                  Sumas Iguales:
                </td>
                <td className="p-2.5 text-right font-mono">
                  {formatCurrency(entry.totalDebit, currency)}
                </td>
                <td className="p-2.5 text-right font-mono">
                  {formatCurrency(entry.totalCredit, currency)}
                </td>
              </tr>
            </tfoot>
          </table>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-4 pt-10 text-center text-[11px]">
            <div>
              <div className="w-32 border-b border-slate-400 mx-auto mb-1" />
              <p className="font-semibold text-slate-700">Hecho Por</p>
            </div>
            <div>
              <div className="w-32 border-b border-slate-400 mx-auto mb-1" />
              <p className="font-semibold text-slate-700">Revisado / Contador</p>
            </div>
            <div>
              <div className="w-32 border-b border-slate-400 mx-auto mb-1" />
              <p className="font-semibold text-slate-700">Autorizado</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
