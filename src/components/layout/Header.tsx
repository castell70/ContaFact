import React from 'react';
import { 
  Calendar, 
  FileSpreadsheet, 
  PlusCircle, 
  HelpCircle, 
  Menu,
  Download,
  Building2,
  CheckCircle2
} from 'lucide-react';
import { CompanyInfo } from '../../types';

interface HeaderProps {
  companyInfo: CompanyInfo;
  selectedMonth: number;
  selectedYear: number;
  onMonthChange: (m: number) => void;
  onYearChange: (y: number) => void;
  onOpenHelp: () => void;
  onQuickExport: () => void;
  onNewSaleClick: () => void;
  onToggleMobileSidebar: () => void;
  activeTabTitle: string;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const Header: React.FC<HeaderProps> = ({
  companyInfo,
  selectedMonth,
  selectedYear,
  onMonthChange,
  onYearChange,
  onOpenHelp,
  onQuickExport,
  onNewSaleClick,
  onToggleMobileSidebar,
  activeTabTitle
}) => {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 6 }, (_, i) => currentYear - i + 1);

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 flex items-center justify-between px-4 sm:px-8 shrink-0 z-30 sticky top-0">
      
      {/* Left side: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <h1 className="text-base sm:text-lg font-semibold text-[#1e293b] tracking-tight">
            {activeTabTitle}
          </h1>
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-[11px] font-bold rounded-md uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Ejercicio Abierto • {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
          </span>
        </div>
      </div>

      {/* Right side: Period selector & Sleek buttons */}
      <div className="flex items-center gap-2 sm:gap-3">
        
        {/* Period Selector */}
        <div className="flex items-center bg-slate-50 rounded-lg border border-slate-200 px-2.5 py-1.5 gap-1.5 text-xs text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-orange-600 shrink-0 hidden sm:inline" />
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(Number(e.target.value))}
            className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs"
          >
            {MONTH_NAMES.map((name, idx) => (
              <option key={idx + 1} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>

          <span className="text-slate-300">/</span>

          <select
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer text-xs"
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Excel Export */}
        <button
          onClick={onQuickExport}
          className="hidden md:inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-medium rounded-lg shadow-xs transition-all cursor-pointer"
          title="Descargar respaldo en Excel"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span>Exportar Excel</span>
        </button>

        {/* Primary Action: Nueva Factura / Emitir */}
        <button
          onClick={onNewSaleClick}
          className="flex items-center gap-1.5 px-3.5 sm:px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white text-xs sm:text-sm font-bold rounded-lg shadow-sm shadow-orange-600/25 transition-all cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ Nueva Venta</span>
        </button>

      </div>

    </header>
  );
};
