import React, { useState, useMemo, useRef } from 'react';
import { 
  Plus, 
  Search, 
  Upload, 
  Download, 
  RefreshCw, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  FileSpreadsheet, 
  BookOpen,
  Filter,
  FileText,
  HelpCircle,
  X
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { ChartAccount, AppState } from '../../types';
import { 
  getChartOfAccounts, 
  addChartAccount, 
  updateChartAccount, 
  deleteChartAccount, 
  setChartOfAccounts, 
  resetChartOfAccounts,
  defaultChartOfAccounts
} from '../../services/dataStore';

interface CatalogManagerProps {
  state: AppState;
  onNotification: (msg: string) => void;
}

const CATEGORIES: ChartAccount['category'][] = [
  'Activo', 
  'Pasivo', 
  'Patrimonio', 
  'Ingresos', 
  'Costos', 
  'Gastos'
];

export const CatalogManager: React.FC<CatalogManagerProps> = ({ state, onNotification }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<ChartAccount | null>(null);
  const [deleteConfirmAccount, setDeleteConfirmAccount] = useState<ChartAccount | null>(null);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState(false);
  const [isResetConfirmModalOpen, setIsResetConfirmModalOpen] = useState(false);

  // Form fields
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ChartAccount['category']>('Activo');
  const [formLevel, setFormLevel] = useState<number>(2);
  const [formDescription, setFormDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Bulk Import State
  const [pasteData, setPasteData] = useState('');
  const [importParsedAccounts, setImportParsedAccounts] = useState<ChartAccount[]>([]);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const accounts = useMemo(() => {
    return state.chartOfAccounts && state.chartOfAccounts.length > 0 
      ? state.chartOfAccounts 
      : getChartOfAccounts();
  }, [state.chartOfAccounts]);

  // Filtered Accounts
  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchCategory = selectedCategory === 'all' || acc.category === selectedCategory;
      const matchSearch = acc.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (acc.description && acc.description.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [accounts, selectedCategory, searchTerm]);

  // Counts by category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: accounts.length };
    CATEGORIES.forEach(cat => {
      counts[cat] = accounts.filter(a => a.category === cat).length;
    });
    return counts;
  }, [accounts]);

  // Open modal to add
  const handleOpenAdd = () => {
    setEditingAccount(null);
    setFormCode('');
    setFormName('');
    setFormCategory('Activo');
    setFormLevel(2);
    setFormDescription('');
    setFormError(null);
    setIsAddEditModalOpen(true);
  };

  // Open modal to edit
  const handleOpenEdit = (acc: ChartAccount) => {
    setEditingAccount(acc);
    setFormCode(acc.code);
    setFormName(acc.name);
    setFormCategory(acc.category);
    setFormLevel(acc.level || 2);
    setFormDescription(acc.description || '');
    setFormError(null);
    setIsAddEditModalOpen(true);
  };

  // Save Account
  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formCode.trim() || !formName.trim()) {
      setFormError('El código y el nombre de la cuenta son obligatorios.');
      return;
    }

    try {
      if (editingAccount) {
        updateChartAccount(editingAccount.code, {
          code: formCode.trim(),
          name: formName.trim(),
          category: formCategory,
          level: formLevel,
          description: formDescription.trim() || undefined
        });
        onNotification(`Cuenta ${formCode} actualizada exitosamente.`);
      } else {
        addChartAccount({
          code: formCode.trim(),
          name: formName.trim(),
          category: formCategory,
          level: formLevel,
          description: formDescription.trim() || undefined
        });
        onNotification(`Cuenta ${formCode} agregada al catálogo.`);
      }
      setIsAddEditModalOpen(false);
    } catch (err: any) {
      setFormError(err.message || 'Error al guardar la cuenta');
    }
  };

  // Delete Account
  const handleDeleteAccount = () => {
    if (!deleteConfirmAccount) return;
    try {
      deleteChartAccount(deleteConfirmAccount.code);
      onNotification(`Cuenta ${deleteConfirmAccount.code} eliminada del catálogo.`);
      setDeleteConfirmAccount(null);
    } catch (err: any) {
      alert(`No se pudo eliminar: ${err.message}`);
    }
  };

  // Reset to default standard
  const handleResetCatalog = () => {
    resetChartOfAccounts();
    setIsResetConfirmModalOpen(false);
    onNotification('Catálogo restaurado a la versión estándar comercial de El Salvador (NIIF PYMES).');
  };

  // Export current catalog to Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const data = accounts.map(a => ({
      'Código': a.code,
      'Nombre de la Cuenta': a.name,
      'Rubro / Categoría': a.category,
      'Nivel': a.level || 2,
      'Descripción / Detalle': a.description || ''
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'CATALOGO_CUENTAS');
    XLSX.writeFile(wb, `Catalogo_Cuentas_${state.companyInfo.tradeName || 'Empresa'}.xlsx`);
    onNotification('Catálogo de cuentas exportado a Excel.');
  };

  // Download template CSV
  const handleDownloadTemplate = () => {
    const headers = 'Código,Nombre de la Cuenta,Categoría (Activo|Pasivo|Patrimonio|Ingresos|Costos|Gastos),Nivel,Descripción\n';
    const sampleRows = [
      '1101,Caja General y Efectivo,Activo,2,Fondos disponibles en caja',
      '1102,Bancos Cuentas Corrientes,Activo,2,Fondos bancarios',
      '2101,Cuentas por Pagar Proveedores,Pasivo,2,Deudas con proveedores',
      '3101,Capital Social Pagado,Patrimonio,2,Aporte de accionistas',
      '4101,Ingresos por Ventas Gravadas,Ingresos,2,Ventas gravadas con 13% IVA',
      '5101,Costo de Ventas y Compras,Costos,2,Costo de mercaderías',
      '6101,Gastos de Administración,Gastos,2,Gastos operativos administrativos'
    ].join('\n');

    const blob = new Blob([headers + sampleRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'Plantilla_Carga_Catalogo_Cuentas.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Parse file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rows.length < 2) {
          throw new Error('El archivo no contiene filas de datos suficientes.');
        }

        // Detect header row or map columns
        const parsed: ChartAccount[] = [];
        const startIndex = typeof rows[0][0] === 'string' && isNaN(Number(rows[0][0])) ? 1 : 0;

        for (let i = startIndex; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length < 2) continue;
          const code = String(row[0] || '').trim();
          const name = String(row[1] || '').trim();
          let category = String(row[2] || 'Activo').trim();

          // Standardize category name
          const catLower = category.toLowerCase();
          let cleanCat: ChartAccount['category'] = 'Activo';
          if (catLower.includes('pasiv')) cleanCat = 'Pasivo';
          else if (catLower.includes('patrimon') || catLower.includes('capital')) cleanCat = 'Patrimonio';
          else if (catLower.includes('ingres') || catLower.includes('venta')) cleanCat = 'Ingresos';
          else if (catLower.includes('cost')) cleanCat = 'Costos';
          else if (catLower.includes('gast')) cleanCat = 'Gastos';

          const level = parseInt(row[3], 10) || (code.length <= 2 ? 1 : code.length <= 4 ? 2 : 3);
          const description = row[4] ? String(row[4]).trim() : undefined;

          if (code && name) {
            parsed.push({
              code,
              name,
              category: cleanCat,
              level,
              description
            });
          }
        }

        if (parsed.length === 0) {
          throw new Error('No se encontraron cuentas válidas en el archivo.');
        }

        setImportParsedAccounts(parsed);
      } catch (err: any) {
        setImportError(`Error al procesar archivo: ${err.message}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  // Parse pasted text
  const handleParsePasteText = () => {
    setImportError(null);
    if (!pasteData.trim()) {
      setImportError('Por favor pegue los datos de las cuentas en el área de texto.');
      return;
    }

    const lines = pasteData.trim().split('\n');
    const parsed: ChartAccount[] = [];

    lines.forEach(line => {
      const parts = line.split(/[,\t;|]/).map(p => p.trim());
      if (parts.length >= 2) {
        const code = parts[0];
        const name = parts[1];
        let categoryStr = parts[2] || 'Activo';
        
        const catLower = categoryStr.toLowerCase();
        let cleanCat: ChartAccount['category'] = 'Activo';
        if (catLower.includes('pasiv')) cleanCat = 'Pasivo';
        else if (catLower.includes('patrimon') || catLower.includes('capital')) cleanCat = 'Patrimonio';
        else if (catLower.includes('ingres') || catLower.includes('venta')) cleanCat = 'Ingresos';
        else if (catLower.includes('cost')) cleanCat = 'Costos';
        else if (catLower.includes('gast')) cleanCat = 'Gastos';

        const description = parts[3] || undefined;

        if (code && name && !isNaN(Number(code[0]))) {
          parsed.push({
            code,
            name,
            category: cleanCat,
            level: code.length <= 2 ? 1 : code.length <= 4 ? 2 : 3,
            description
          });
        }
      }
    });

    if (parsed.length === 0) {
      setImportError('No se pudieron extraer cuentas válidas del texto pegado. Formato esperado: Código, Nombre, Rubro');
      return;
    }

    setImportParsedAccounts(parsed);
  };

  // Execute Full Load
  const handleExecuteBulkLoad = () => {
    if (importParsedAccounts.length === 0) {
      setImportError('No hay cuentas preparadas para importar.');
      return;
    }

    try {
      setChartOfAccounts(importParsedAccounts);
      onNotification(`Carga completa finalizada: ${importParsedAccounts.length} cuentas cargadas al catálogo.`);
      setIsBulkImportModalOpen(false);
      setImportParsedAccounts([]);
      setPasteData('');
    } catch (err: any) {
      setImportError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Action Buttons */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            Catálogo de Cuentas Contables ({accounts.length} Cuentas)
          </h2>
          <p className="text-xs text-slate-500">
            Administre, agregue o actualice la estructura contable de la empresa según el Código de Comercio de El Salvador
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nueva Cuenta
          </button>

          <button
            onClick={() => {
              setImportParsedAccounts([]);
              setPasteData('');
              setImportError(null);
              setIsBulkImportModalOpen(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Upload className="w-4 h-4" />
            Carga Completa / Importar
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Exportar Excel
          </button>

          <button
            onClick={() => setIsResetConfirmModalOpen(true)}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Restaurar catálogo estándar de El Salvador"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
            Restaurar Estándar
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por código, nombre de cuenta o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Todos ({categoryCounts.all})
          </button>

          {CATEGORIES.map(cat => {
            const count = categoryCounts[cat] || 0;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-semibold text-[11px]">
              <tr>
                <th className="px-4 py-3 w-28">Código</th>
                <th className="px-4 py-3">Nombre de la Cuenta</th>
                <th className="px-4 py-3 w-32">Rubro / Categoría</th>
                <th className="px-4 py-3 w-20 text-center">Nivel</th>
                <th className="px-4 py-3">Descripción / Notas</th>
                <th className="px-4 py-3 w-24 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    No se encontraron cuentas contables con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredAccounts.map(acc => {
                  const getBadgeColor = () => {
                    switch (acc.category) {
                      case 'Activo': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
                      case 'Pasivo': return 'bg-rose-50 text-rose-700 border-rose-200';
                      case 'Patrimonio': return 'bg-purple-50 text-purple-700 border-purple-200';
                      case 'Ingresos': return 'bg-blue-50 text-blue-700 border-blue-200';
                      case 'Costos': return 'bg-amber-50 text-amber-700 border-amber-200';
                      case 'Gastos': return 'bg-red-50 text-red-700 border-red-200';
                      default: return 'bg-slate-50 text-slate-700 border-slate-200';
                    }
                  };

                  return (
                    <tr key={acc.code} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-indigo-700">
                        {acc.code}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-900">
                        {acc.name}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${getBadgeColor()}`}>
                          {acc.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-500">
                        {acc.level || 2}
                      </td>
                      <td className="px-4 py-3 text-slate-500 max-w-xs truncate">
                        {acc.description || '-'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(acc)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                            title="Modificar Cuenta"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmAccount(acc)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Eliminar Cuenta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD / EDIT ACCOUNT MODAL */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                {editingAccount ? <Edit3 className="w-5 h-5 text-indigo-600" /> : <Plus className="w-5 h-5 text-indigo-600" />}
                {editingAccount ? `Modificar Cuenta ${editingAccount.code}` : 'Nueva Cuenta Contable'}
              </h3>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="mt-4 space-y-3.5 text-xs">
              {formError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Código de Cuenta *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 1101, 210101..."
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-mono font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Rubro / Categoría *</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg font-semibold focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nombre Oficial de la Cuenta *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Cuentas por Cobrar Clientes Locales..."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-hidden text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Nivel Estructural</label>
                  <select
                    value={formLevel}
                    onChange={(e) => setFormLevel(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  >
                    <option value={1}>1 - Rubro / Clase</option>
                    <option value={2}>2 - Cuenta de Mayor</option>
                    <option value={3}>3 - Subcuenta</option>
                    <option value={4}>4 - Cuenta Auxiliar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Naturaleza</label>
                  <div className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-600">
                    {['Activo', 'Costos', 'Gastos'].includes(formCategory) ? 'Deudora (Carga / Saldo Debe)' : 'Acreedora (Abona / Saldo Haber)'}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Descripción / Uso</label>
                <textarea
                  rows={2}
                  placeholder="Descripción detallada de los conceptos que se cargan y abonan..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {editingAccount ? 'Actualizar Cuenta' : 'Guardar Cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK IMPORT MODAL */}
      {isBulkImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Carga Completa del Catálogo de Cuentas</h3>
                  <p className="text-xs text-slate-500">Importe su catálogo corporativo desde Excel, CSV o pegando texto estructurado</p>
                </div>
              </div>
              <button
                onClick={() => setIsBulkImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs flex-1 overflow-y-auto pr-1">
              {importError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Step 1: Upload options */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-2">
                  <FileSpreadsheet className="w-8 h-8 text-emerald-600 mx-auto" />
                  <span className="font-bold text-slate-800 block">Subir Archivo Excel o CSV</span>
                  <p className="text-[11px] text-slate-500">Seleccione un archivo .xlsx o .csv con sus cuentas</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".xlsx, .xls, .csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 font-semibold rounded-lg hover:bg-slate-100 transition-colors shadow-2xs"
                  >
                    Examinar Archivo...
                  </button>
                </div>

                <div className="p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 space-y-2">
                  <Download className="w-7 h-7 text-indigo-600" />
                  <span className="font-bold text-indigo-900 block">Descargar Plantilla Modelo</span>
                  <p className="text-[11px] text-indigo-700">Utilice nuestro formato oficial para armar su catálogo rápidamente</p>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-3.5 py-1.5 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors shadow-2xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar CSV
                  </button>
                </div>
              </div>

              {/* Paste Text Area */}
              <div>
                <label className="block text-slate-700 font-semibold mb-1">O Pegar Cuentas Directamente (Código, Nombre, Categoría):</label>
                <textarea
                  rows={4}
                  placeholder="1101, Efectivo y Equivalentes, Activo&#10;2101, Cuentas por Pagar Proveedores, Pasivo&#10;4101, Ingresos por Ventas, Ingresos"
                  value={pasteData}
                  onChange={(e) => setPasteData(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-lg font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={handleParsePasteText}
                  className="mt-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold"
                >
                  Procesar Texto Pegado
                </button>
              </div>

              {/* Parsed Preview */}
              {importParsedAccounts.length > 0 && (
                <div className="space-y-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center justify-between font-bold text-emerald-900">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      {importParsedAccounts.length} Cuentas listas para cargar
                    </span>
                  </div>
                  <div className="max-h-40 overflow-y-auto bg-white rounded-lg border border-emerald-100 p-2 divide-y divide-slate-100 text-xs">
                    {importParsedAccounts.slice(0, 15).map(acc => (
                      <div key={acc.code} className="py-1 flex items-center justify-between">
                        <span className="font-mono font-bold text-indigo-700">{acc.code}</span>
                        <span className="font-medium text-slate-800 flex-1 px-3 truncate">{acc.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">{acc.category}</span>
                      </div>
                    ))}
                    {importParsedAccounts.length > 15 && (
                      <div className="py-1 text-center text-slate-400 text-[11px]">
                        ...y {importParsedAccounts.length - 15} cuentas más
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={() => setIsBulkImportModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleExecuteBulkLoad}
                disabled={importParsedAccounts.length === 0}
                className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                Cargar {importParsedAccounts.length} Cuentas al Catálogo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM MODAL */}
      {deleteConfirmAccount && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-lg text-slate-900">Eliminar Cuenta Contable</h3>
            </div>
            <p className="text-sm text-slate-600 mb-2">
              ¿Está seguro de eliminar la cuenta <strong className="text-slate-900">{deleteConfirmAccount.code} - {deleteConfirmAccount.name}</strong>?
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmAccount(null)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar Cuenta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESET CONFIRM MODAL */}
      {isResetConfirmModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <RefreshCw className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-lg text-slate-900">Restaurar Catálogo Estándar</h3>
            </div>
            <p className="text-sm text-slate-600 mb-3">
              Esta acción restaurará el catálogo con el listado oficial de cuentas comerciales para El Salvador (NIIF para PYMES).
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleResetCatalog}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <RefreshCw className="w-4 h-4" />
                Restaurar Estándar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
