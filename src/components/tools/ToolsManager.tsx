import React, { useState, useRef } from 'react';
import { 
  Wrench, 
  Upload, 
  Download, 
  FileCode2, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  Receipt, 
  ShoppingCart, 
  Layers, 
  FileText, 
  RefreshCw, 
  ArrowRight,
  Database,
  Users,
  Truck,
  Package,
  Eye,
  Check,
  X,
  Code
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { AppState, SaleRecord, PurchaseRecord } from '../../types';
import { 
  parseSalesFromJson,
  parsePurchasesFromJson,
  importSalesFromJsonData,
  importPurchasesFromJsonData,
  exportSalesJson,
  exportPurchasesJson,
  exportFullJson,
  exportFullExcel,
  downloadSampleSalesJson,
  downloadSamplePurchasesJson,
  generateTemplateXlsx,
  addClient,
  addSupplier,
  addProduct,
  importFullBackupJson
} from '../../services/dataStore';

interface ToolsManagerProps {
  state: AppState;
}

export const ToolsManager: React.FC<ToolsManagerProps> = ({ state }) => {
  const [activeTab, setActiveTab] = useState<'sales_json' | 'purchases_json' | 'excel_import' | 'exports'>('sales_json');

  // Notifications
  const [notification, setNotification] = useState<{ message: string; isError?: boolean } | null>(null);

  // Sales JSON state
  const [salesJsonText, setSalesJsonText] = useState('');
  const [salesImportMode, setSalesImportMode] = useState<'append' | 'replace'>('append');
  const [salesParsedData, setSalesParsedData] = useState<ReturnType<typeof parseSalesFromJson> | null>(null);
  const salesFileInputRef = useRef<HTMLInputElement>(null);

  // Purchases JSON state
  const [purchasesJsonText, setPurchasesJsonText] = useState('');
  const [purchasesImportMode, setPurchasesImportMode] = useState<'append' | 'replace'>('append');
  const [purchasesParsedData, setPurchasesParsedData] = useState<ReturnType<typeof parsePurchasesFromJson> | null>(null);
  const purchasesFileInputRef = useRef<HTMLInputElement>(null);

  // Full Backup JSON input ref
  const fullBackupFileInputRef = useRef<HTMLInputElement>(null);

  const showNotificationMsg = (message: string, isError = false) => {
    setNotification({ message, isError });
    setTimeout(() => setNotification(null), 6000);
  };

  // --- Handlers for Sales JSON ---
  const handleSalesFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = Array.from(files);
    const combinedValid: any[] = [];
    const allErrors: string[] = [];
    let combinedStats = { totalTaxable: 0, totalExempt: 0, totalIvaDebit: 0, totalAmount: 0 };
    let rawCount = 0;
    let lastContent = '';

    for (const file of fileList) {
      try {
        const text = await file.text();
        lastContent = text;
        const parsed = JSON.parse(text);
        const result = parseSalesFromJson(parsed);
        rawCount += result.rawCount;
        combinedValid.push(...result.valid);
        allErrors.push(...result.errors.map(err => `[${file.name}] ${err}`));
        combinedStats.totalTaxable += result.stats.totalTaxable;
        combinedStats.totalExempt += result.stats.totalExempt;
        combinedStats.totalIvaDebit += result.stats.totalIvaDebit;
        combinedStats.totalAmount += result.stats.totalAmount;
      } catch (err: any) {
        allErrors.push(`[${file.name}] Error de sintaxis JSON: ${err.message}`);
      }
    }

    if (fileList.length === 1) {
      setSalesJsonText(lastContent);
    } else {
      setSalesJsonText(JSON.stringify(combinedValid, null, 2));
    }

    setSalesParsedData({
      valid: combinedValid,
      errors: allErrors,
      rawCount,
      stats: combinedStats
    });

    if (combinedValid.length > 0) {
      showNotificationMsg(`Se leyeron ${fileList.length} archivo(s) JSON de Ventas: ${combinedValid.length} ventas válidas detectadas.`);
    } else {
      showNotificationMsg('No se detectaron registros válidos en los archivos JSON de ventas seleccionados.', true);
    }
    e.target.value = '';
  };

  const handleSalesTextChange = (text: string) => {
    setSalesJsonText(text);
    if (!text.trim()) {
      setSalesParsedData(null);
      return;
    }
    try {
      const parsed = JSON.parse(text);
      const result = parseSalesFromJson(parsed);
      setSalesParsedData(result);
    } catch {
      setSalesParsedData(null);
    }
  };

  const handleLoadDemoSalesJson = () => {
    const demo = [
      {
        documentType: "CCF",
        correlative: 106,
        dteCode: "DTE-03-000106",
        date: new Date().toISOString().substring(0, 10),
        clientNrc: "234567-8",
        clientNit: "0614-150892-101-3",
        clientName: "INDUSTRIAS METALMECÁNICAS DE CENTROAMÉRICA, S.A.",
        clientAddress: "Km 12.5 Carretera al Puerto de La Libertad",
        clientActivity: "Fabricación de estructuras metálicas",
        description: "Venta de rodamientos de alta precisión y lubricantes sintéticos",
        taxableAmount: 680.00,
        exemptAmount: 0.00,
        noSujetaAmount: 0.00,
        ivaDebit: 88.40,
        ivaRetenido: 6.80,
        total: 761.60,
        paymentMethod: "Crédito",
        paymentDays: 30,
        items: [
          { desc: "Rodamiento cónico de rodillos 60mm", qty: 4, price: 120.00, subtotal: 480.00, type: "gravada" },
          { desc: "Aceite sintético ultra protección (Balde 5 Gal)", qty: 2, price: 100.00, subtotal: 200.00, type: "gravada" }
        ]
      },
      {
        documentType: "CF",
        correlative: 205,
        dteCode: "DTE-01-000205",
        date: new Date().toISOString().substring(0, 10),
        clientName: "Consumidor Final Mostrador",
        clientDui: "02345678-9",
        description: "Venta de herramientas manuales de taller",
        taxableAmount: 65.00,
        exemptAmount: 0.00,
        ivaDebit: 8.45,
        total: 73.45,
        paymentMethod: "Contado",
        items: [
          { desc: "Juego de llaves combinadas métricas 12 piezas", qty: 1, price: 65.00, subtotal: 65.00, type: "gravada" }
        ]
      }
    ];
    const text = JSON.stringify(demo, null, 2);
    setSalesJsonText(text);
    const result = parseSalesFromJson(demo);
    setSalesParsedData(result);
    showNotificationMsg('JSON de demostración de Ventas cargado en el visor.');
  };

  const handleConfirmSalesImport = () => {
    if (!salesParsedData || salesParsedData.valid.length === 0) {
      showNotificationMsg('No hay registros de ventas válidos para importar.', true);
      return;
    }

    try {
      const count = importSalesFromJsonData(salesParsedData.valid, salesImportMode);
      showNotificationMsg(`¡Éxito! Se han importado ${count} ventas al Libro de Ventas.`);
      setSalesJsonText('');
      setSalesParsedData(null);
    } catch (err: any) {
      showNotificationMsg(`Error al importar ventas: ${err.message}`, true);
    }
  };

  // --- Handlers for Purchases JSON ---
  const handlePurchasesFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList: File[] = Array.from(files);
    const combinedValid: any[] = [];
    const allErrors: string[] = [];
    let combinedStats = { totalTaxable: 0, totalExempt: 0, totalIvaCredit: 0, totalAmount: 0 };
    let rawCount = 0;
    let lastContent = '';

    for (const file of fileList) {
      try {
        const text = await file.text();
        lastContent = text;
        const parsed = JSON.parse(text);
        const result = parsePurchasesFromJson(parsed);
        rawCount += result.rawCount;
        combinedValid.push(...result.valid);
        allErrors.push(...result.errors.map(err => `[${file.name}] ${err}`));
        combinedStats.totalTaxable += result.stats.totalTaxable;
        combinedStats.totalExempt += result.stats.totalExempt;
        combinedStats.totalIvaCredit += result.stats.totalIvaCredit;
        combinedStats.totalAmount += result.stats.totalAmount;
      } catch (err: any) {
        allErrors.push(`[${file.name}] Error de sintaxis JSON: ${err.message}`);
      }
    }

    if (fileList.length === 1) {
      setPurchasesJsonText(lastContent);
    } else {
      setPurchasesJsonText(JSON.stringify(combinedValid, null, 2));
    }

    setPurchasesParsedData({
      valid: combinedValid,
      errors: allErrors,
      rawCount,
      stats: combinedStats
    });

    if (combinedValid.length > 0) {
      showNotificationMsg(`Se leyeron ${fileList.length} archivo(s) JSON de Compras: ${combinedValid.length} compras válidas detectadas.`);
    } else {
      showNotificationMsg('No se detectaron registros válidos en los archivos JSON de compras seleccionados.', true);
    }
    e.target.value = '';
  };

  const handlePurchasesTextChange = (text: string) => {
    setPurchasesJsonText(text);
    if (!text.trim()) {
      setPurchasesParsedData(null);
      return;
    }
    try {
      const parsed = JSON.parse(text);
      const result = parsePurchasesFromJson(parsed);
      setPurchasesParsedData(result);
    } catch {
      setPurchasesParsedData(null);
    }
  };

  const handleLoadDemoPurchasesJson = () => {
    const demo = [
      {
        documentType: "CCF",
        documentNumber: "CCF-99410-B",
        date: new Date().toISOString().substring(0, 10),
        supplierNrc: "183920-8",
        supplierNit: "0614-120401-102-8",
        supplierName: "IMPORTADORA Y LOGÍSTICA GLOBAL, S.A. DE C.V.",
        description: "Adquisición de rodamientos industriales y empaques para reposición de stock",
        taxableAmount: 1150.00,
        importTaxableAmount: 0.00,
        exemptAmount: 0.00,
        ivaCredit: 149.50,
        ivaWithheld: 11.50,
        ivaPerceived: 0.00,
        total: 1288.00,
        paymentMethod: "Crédito",
        dueDate: "2025-03-25"
      },
      {
        documentType: "CCF",
        documentNumber: "CCF-77123",
        date: new Date().toISOString().substring(0, 10),
        supplierNrc: "349102-1",
        supplierNit: "0614-220795-101-9",
        supplierName: "SERVICIOS DE TELECOMUNICACIONES DE EL SALVADOR, S.A.",
        description: "Servicio mensual de internet corporativo y telefonía IP",
        taxableAmount: 180.00,
        importTaxableAmount: 0.00,
        exemptAmount: 0.00,
        ivaCredit: 23.40,
        ivaWithheld: 0.00,
        ivaPerceived: 0.00,
        total: 203.40,
        paymentMethod: "Contado"
      }
    ];
    const text = JSON.stringify(demo, null, 2);
    setPurchasesJsonText(text);
    const result = parsePurchasesFromJson(demo);
    setPurchasesParsedData(result);
    showNotificationMsg('JSON de demostración de Compras cargado en el visor.');
  };

  const handleConfirmPurchasesImport = () => {
    if (!purchasesParsedData || purchasesParsedData.valid.length === 0) {
      showNotificationMsg('No hay registros de compras válidos para importar.', true);
      return;
    }

    try {
      const count = importPurchasesFromJsonData(purchasesParsedData.valid, purchasesImportMode);
      showNotificationMsg(`¡Éxito! Se han importado ${count} compras al Libro de Compras.`);
      setPurchasesJsonText('');
      setPurchasesParsedData(null);
    } catch (err: any) {
      showNotificationMsg(`Error al importar compras: ${err.message}`, true);
    }
  };

  // --- Excel Import Handler ---
  const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>, entityType: 'clients' | 'suppliers' | 'products') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = wb.SheetNames[0];
      const sheet = wb.Sheets[firstSheetName];
      const json: any[] = XLSX.utils.sheet_to_json(sheet);

      if (!json || json.length === 0) {
        throw new Error('El archivo no contiene filas de datos para importar.');
      }

      let count = 0;
      if (entityType === 'clients') {
        json.forEach(row => {
          if (row.name || row['Nombre / Razón Social']) {
            addClient({
              name: row.name || row['Nombre / Razón Social'],
              nrc: String(row.nrc || row['NRC'] || ''),
              nit: String(row.nit || row['NIT'] || ''),
              dui: String(row.dui || row['DUI'] || ''),
              address: row.address || row['Dirección'] || '',
              activity: row.activity || row['Giro / Actividad'] || '',
              contact: row.contact || row['Contacto'] || '',
              phone: String(row.phone || row['Teléfono'] || ''),
              email: row.email || row['Correo'] || '',
              isGranContribuyente: String(row.isGranContribuyente || row['Gran Contribuyente']).toUpperCase() === 'SI'
            });
            count++;
          }
        });
      } else if (entityType === 'suppliers') {
        json.forEach(row => {
          if (row.name || row['Nombre / Razón Social']) {
            addSupplier({
              name: row.name || row['Nombre / Razón Social'],
              nrc: String(row.nrc || row['NRC'] || ''),
              nit: String(row.nit || row['NIT'] || ''),
              dui: String(row.dui || row['DUI'] || ''),
              address: row.address || row['Dirección'] || '',
              activity: row.activity || row['Giro / Actividad'] || '',
              contact: row.contact || row['Contacto'] || '',
              phone: String(row.phone || row['Teléfono'] || ''),
              email: row.email || row['Correo'] || '',
              isGranContribuyente: String(row.isGranContribuyente || row['Gran Contribuyente']).toUpperCase() === 'SI'
            });
            count++;
          }
        });
      } else if (entityType === 'products') {
        json.forEach(row => {
          if (row.name || row['Nombre Producto']) {
            addProduct({
              sku: String(row.sku || row['Código / SKU'] || `SKU-${Date.now().toString().slice(-4)}`),
              name: row.name || row['Nombre Producto'],
              category: row.category || row['Categoría'] || 'General',
              unit: row.unit || row['Unidad'] || 'Unidad',
              cost: parseFloat(row.cost || row['Costo Unitario'] || 0),
              price: parseFloat(row.price || row['Precio Venta (sin IVA)'] || 0),
              stock: parseInt(row.stock || row['Stock Inicial'] || 0),
              minStock: parseInt(row.minStock || row['Stock Mínimo'] || 5),
              taxType: (row.taxType || row['Tratamiento IVA'] || 'gravada').toLowerCase().includes('exent') ? 'exenta' : 'gravada',
              description: row.description || row['Descripción'] || ''
            });
            count++;
          }
        });
      }

      showNotificationMsg(`¡Importación exitosa! Se añadieron ${count} registros a ${entityType}.`);
      e.target.value = '';
    } catch (err: any) {
      showNotificationMsg(`Error al procesar archivo Excel: ${err.message}`, true);
    }
  };

  // Full backup JSON upload
  const handleFullBackupUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        importFullBackupJson(json);
        showNotificationMsg('¡Copia de seguridad JSON completa restaurada con éxito!');
        e.target.value = '';
      } catch (err: any) {
        showNotificationMsg(`Error al restaurar respaldo: ${err.message}`, true);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6" id="tools-manager-root">
      
      {/* Notification Banner */}
      {notification && (
        <div 
          id="tools-notification-banner"
          className={`p-4 rounded-xl flex items-center justify-between shadow-lg border text-sm font-semibold transition-all ${
          notification.isError
            ? 'bg-red-50 text-red-800 border-red-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
        }`}>
          <div className="flex items-center gap-2">
            {notification.isError ? <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" /> : <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
            <span>{notification.message}</span>
          </div>
          <button 
            id="close-tools-notification-btn"
            onClick={() => setNotification(null)}
            className="text-xs px-2 py-1 bg-white/60 hover:bg-white rounded transition"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Main Header & Tab Navigation */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Herramientas y Centro de Carga de Datos
              </h2>
              <p className="text-xs text-slate-500">
                Importación y procesamiento diferenciado de archivos JSON para Ventas y Compras, plantillas masivas y exportaciones.
              </p>
            </div>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-sm font-medium">
          <button
            id="tab-sales-json-btn"
            onClick={() => setActiveTab('sales_json')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeTab === 'sales_json' 
                ? 'bg-white text-indigo-700 shadow-xs font-bold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Receipt className="w-4 h-4 text-emerald-600" />
            <span>Carga JSON Ventas</span>
          </button>

          <button
            id="tab-purchases-json-btn"
            onClick={() => setActiveTab('purchases_json')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeTab === 'purchases_json' 
                ? 'bg-white text-indigo-700 shadow-xs font-bold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingCart className="w-4 h-4 text-blue-600" />
            <span>Carga JSON Compras</span>
          </button>

          <button
            id="tab-excel-import-btn"
            onClick={() => setActiveTab('excel_import')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeTab === 'excel_import' 
                ? 'bg-white text-indigo-700 shadow-xs font-bold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600" />
            <span>Catálogos Excel</span>
          </button>

          <button
            id="tab-exports-btn"
            onClick={() => setActiveTab('exports')}
            className={`px-3.5 py-2 rounded-lg flex items-center gap-2 transition-all ${
              activeTab === 'exports' 
                ? 'bg-white text-indigo-700 shadow-xs font-bold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Download className="w-4 h-4 text-amber-600" />
            <span>Exportador & Respaldos</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CARGA JSON DE VENTAS                                               */}
      {/* ========================================================================= */}
      {activeTab === 'sales_json' && (
        <div className="space-y-6" id="sales-json-module">
          
          {/* Top Actions & Download Template Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="md:col-span-2">
              <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full text-2xs font-bold uppercase tracking-wider">
                Módulo Exclusivo para Ventas
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                Cargador de Archivos JSON de Facturación Emitida
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Carga archivos JSON de ventas (Comprobantes de Crédito Fiscal CCF, Facturas Consumidor Final CF, Exportaciones o formato DTE de El Salvador).
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2 justify-end">
              <button
                id="download-sales-template-btn"
                onClick={downloadSampleSalesJson}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                Descargar Plantilla JSON Ventas
              </button>

              <button
                id="load-demo-sales-btn"
                onClick={handleLoadDemoSalesJson}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Code className="w-4 h-4" />
                Cargar Ejemplo en Editor
              </button>
            </div>
          </div>

          {/* Upload Area & Code Editor Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* File Dropzone & Editor (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-indigo-600" />
                  Seleccionar Archivo o Pegar Código JSON
                </h4>
                {salesParsedData && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    salesParsedData.valid.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {salesParsedData.valid.length} Registros Válidos
                  </span>
                )}
              </div>

              {/* Drag & Drop File Selector */}
              <input 
                ref={salesFileInputRef}
                id="sales-file-input"
                type="file" 
                multiple
                accept=".json,application/json" 
                onChange={handleSalesFileSelect}
                className="hidden" 
              />
              
              <div 
                onClick={() => salesFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-orange-500 bg-slate-50/70 hover:bg-orange-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Haz clic para seleccionar uno o varios archivos <span className="text-orange-600">.json de Ventas</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Admite selección múltiple por lotes, DTE individuales (códigoGeneración) o arreglos completos
                  </p>
                </div>
              </div>

              {/* Text Area for Direct JSON Paste */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                  <span>O pega el código JSON de ventas directamente:</span>
                  {salesJsonText && (
                    <button 
                      id="clear-sales-json-btn"
                      onClick={() => { setSalesJsonText(''); setSalesParsedData(null); }}
                      className="text-rose-600 hover:underline flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Limpiar
                    </button>
                  )}
                </div>
                <textarea
                  id="sales-json-textarea"
                  value={salesJsonText}
                  onChange={(e) => handleSalesTextChange(e.target.value)}
                  placeholder='[ { "documentType": "CCF", "date": "2025-02-18", "clientName": "Cliente S.A.", "taxableAmount": 100.00, ... } ]'
                  rows={8}
                  className="w-full p-3 font-mono text-xs bg-slate-900 text-emerald-300 rounded-xl border border-slate-700 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Import Mode Radio Options */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">Modo de Inserción:</span>
                  <span className="text-slate-500">Define cómo se integrarán los registros en el Libro de Ventas</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                    <input
                      type="radio"
                      name="salesMode"
                      value="append"
                      checked={salesImportMode === 'append'}
                      onChange={() => setSalesImportMode('append')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Agregar a existentes</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-rose-700">
                    <input
                      type="radio"
                      name="salesMode"
                      value="replace"
                      checked={salesImportMode === 'replace'}
                      onChange={() => setSalesImportMode('replace')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span>Reemplazar ventas</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Live Validator & Stats Panel (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  Validador y Resumen Fiscal de Carga
                </h4>

                {salesParsedData ? (
                  <div className="space-y-4">
                    {/* Key Stats Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                        <span className="text-2xs font-bold text-emerald-800 uppercase">Total Ventas Gravadas</span>
                        <p className="text-base font-bold text-emerald-950 mt-0.5">
                          ${salesParsedData.stats.totalTaxable.toFixed(2)}
                        </p>
                      </div>

                      <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                        <span className="text-2xs font-bold text-blue-800 uppercase">Débito Fiscal IVA 13%</span>
                        <p className="text-base font-bold text-blue-950 mt-0.5">
                          ${salesParsedData.stats.totalIvaDebit.toFixed(2)}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-2xs font-bold text-slate-600 uppercase">Comprobantes</span>
                        <p className="text-base font-bold text-slate-900 mt-0.5">
                          {salesParsedData.valid.length} de {salesParsedData.rawCount}
                        </p>
                      </div>

                      <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                        <span className="text-2xs font-bold text-indigo-800 uppercase">Total Facturado</span>
                        <p className="text-base font-bold text-indigo-950 mt-0.5">
                          ${salesParsedData.stats.totalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Validation Errors Warning if any */}
                    {salesParsedData.errors.length > 0 && (
                      <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 space-y-1">
                        <span className="font-bold flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                          Se detectaron advertencias en {salesParsedData.errors.length} filas:
                        </span>
                        <ul className="list-disc pl-4 space-y-0.5 text-2xs">
                          {salesParsedData.errors.slice(0, 3).map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Pre-visualization List */}
                    <div className="space-y-1.5">
                      <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">
                        Previsualización de Documentos a Ingresar:
                      </span>
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                        {salesParsedData.valid.map((s, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs flex items-center justify-between">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className={`px-1.5 py-0.5 rounded text-2xs font-bold ${
                                  s.documentType === 'CCF' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {s.documentType}
                                </span>
                                <span className="font-bold text-slate-800 truncate max-w-[140px]">{s.clientName}</span>
                              </div>
                              <p className="text-2xs text-slate-500">{s.date} • {s.description || 'Venta'}</p>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-slate-900 block">${(s.total || 0).toFixed(2)}</span>
                              <span className="text-2xs text-slate-400">Grav: ${(s.taxableAmount || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Confirm Import Button */}
                    <button
                      id="confirm-import-sales-btn"
                      onClick={handleConfirmSalesImport}
                      disabled={salesParsedData.valid.length === 0}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition"
                    >
                      <Check className="w-4 h-4" />
                      Confirmar e Importar {salesParsedData.valid.length} Ventas
                    </button>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <FileCode2 className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-xs">Selecciona un archivo o pega el JSON para ver la previsualización y validación fiscal.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CARGA JSON DE COMPRAS                                              */}
      {/* ========================================================================= */}
      {activeTab === 'purchases_json' && (
        <div className="space-y-6" id="purchases-json-module">
          
          {/* Top Actions & Download Template Card */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="md:col-span-2">
              <span className="px-2.5 py-1 bg-blue-100 text-blue-800 rounded-full text-2xs font-bold uppercase tracking-wider">
                Módulo Exclusivo para Compras
              </span>
              <h3 className="text-lg font-bold text-slate-900 mt-1 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-blue-600" />
                Cargador de Archivos JSON de Facturas Recibidas & Crédito Fiscal
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Carga archivos JSON de compras emitidos por proveedores (Créditos Fiscales CCF, Compras a Sujetos Excluidos DUI o facturas electrónicas).
              </p>
            </div>

            <div className="flex flex-col sm:flex-row md:flex-col gap-2 justify-end">
              <button
                id="download-purchases-template-btn"
                onClick={downloadSamplePurchasesJson}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4 h-4 text-blue-600" />
                Descargar Plantilla JSON Compras
              </button>

              <button
                id="load-demo-purchases-btn"
                onClick={handleLoadDemoPurchasesJson}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
              >
                <Code className="w-4 h-4" />
                Cargar Ejemplo en Editor
              </button>
            </div>
          </div>

          {/* Upload Area & Code Editor Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* File Dropzone & Editor (7 cols) */}
            <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <FileCode2 className="w-4 h-4 text-indigo-600" />
                  Seleccionar Archivo o Pegar Código JSON
                </h4>
                {purchasesParsedData && (
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                    purchasesParsedData.valid.length > 0 ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {purchasesParsedData.valid.length} Compras Válidas
                  </span>
                )}
              </div>

              {/* Drag & Drop File Selector */}
              <input 
                ref={purchasesFileInputRef}
                id="purchases-file-input"
                type="file" 
                multiple
                accept=".json,application/json" 
                onChange={handlePurchasesFileSelect}
                className="hidden" 
              />
              
              <div 
                onClick={() => purchasesFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/70 hover:bg-blue-50/30 rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
              >
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shadow-xs">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Haz clic para seleccionar uno o varios archivos <span className="text-blue-700">.json de Compras</span>
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Admite selección múltiple por lotes, DTE recibidos de proveedores, comprobantes CCF e insumos
                  </p>
                </div>
              </div>

              {/* Text Area for Direct JSON Paste */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
                  <span>O pega el código JSON de compras directamente:</span>
                  {purchasesJsonText && (
                    <button 
                      id="clear-purchases-json-btn"
                      onClick={() => { setPurchasesJsonText(''); setPurchasesParsedData(null); }}
                      className="text-rose-600 hover:underline flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" /> Limpiar
                    </button>
                  )}
                </div>
                <textarea
                  id="purchases-json-textarea"
                  value={purchasesJsonText}
                  onChange={(e) => handlePurchasesTextChange(e.target.value)}
                  placeholder='[ { "documentType": "CCF", "documentNumber": "CCF-89210", "supplierName": "Proveedor S.A.", "taxableAmount": 500.00, ... } ]'
                  rows={8}
                  className="w-full p-3 font-mono text-xs bg-slate-900 text-blue-300 rounded-xl border border-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              {/* Import Mode Radio Options */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="font-bold text-slate-800 block">Modo de Inserción:</span>
                  <span className="text-slate-500">Define cómo se integrarán los registros en el Libro de Compras</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <label className="flex items-center gap-1.5 cursor-pointer text-slate-700">
                    <input
                      type="radio"
                      name="purchasesMode"
                      value="append"
                      checked={purchasesImportMode === 'append'}
                      onChange={() => setPurchasesImportMode('append')}
                      className="text-blue-600 focus:ring-blue-500"
                    />
                    <span>Agregar a existentes</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-rose-700">
                    <input
                      type="radio"
                      name="purchasesMode"
                      value="replace"
                      checked={purchasesImportMode === 'replace'}
                      onChange={() => setPurchasesImportMode('replace')}
                      className="text-rose-600 focus:ring-rose-500"
                    />
                    <span>Reemplazar compras</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Live Validator & Stats Panel (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-blue-600" />
                  Validador y Resumen Fiscal de Compras
                </h4>

                {purchasesParsedData ? (
                  <div className="space-y-4">
                    {/* Key Stats Cards */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl">
                        <span className="text-2xs font-bold text-blue-800 uppercase">Compras Gravadas</span>
                        <p className="text-base font-bold text-blue-950 mt-0.5">
                          ${purchasesParsedData.stats.totalTaxable.toFixed(2)}
                        </p>
                      </div>

                      <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl">
                        <span className="text-2xs font-bold text-emerald-800 uppercase">Crédito Fiscal IVA 13%</span>
                        <p className="text-base font-bold text-emerald-950 mt-0.5">
                          ${purchasesParsedData.stats.totalIvaCredit.toFixed(2)}
                        </p>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <span className="text-2xs font-bold text-slate-600 uppercase">Documentos</span>
                        <p className="text-base font-bold text-slate-900 mt-0.5">
                          {purchasesParsedData.valid.length} de {purchasesParsedData.rawCount}
                        </p>
                      </div>

                      <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl">
                        <span className="text-2xs font-bold text-indigo-800 uppercase">Total Desembolsado</span>
                        <p className="text-base font-bold text-indigo-950 mt-0.5">
                          ${purchasesParsedData.stats.totalAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {/* Pre-visualization List */}
                    <div className="space-y-1.5">
                      <span className="text-2xs font-bold text-slate-500 uppercase tracking-wider">
                        Previsualización de Facturas de Proveedores:
                      </span>
                      <div className="max-h-48 overflow-y-auto space-y-2 pr-1">
                        {purchasesParsedData.valid.map((p, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 text-xs flex items-center justify-between">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <span className="px-1.5 py-0.5 rounded text-2xs font-bold bg-blue-100 text-blue-800">
                                  {p.documentType}
                                </span>
                                <span className="font-bold text-slate-800 truncate max-w-[140px]">{p.supplierName}</span>
                              </div>
                              <p className="text-2xs text-slate-500">Doc #{p.documentNumber} • {p.date}</p>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-slate-900 block">${(p.total || 0).toFixed(2)}</span>
                              <span className="text-2xs text-slate-400">IVA: ${(p.ivaCredit || 0).toFixed(2)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Confirm Import Button */}
                    <button
                      id="confirm-import-purchases-btn"
                      onClick={handleConfirmPurchasesImport}
                      disabled={purchasesParsedData.valid.length === 0}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition"
                    >
                      <Check className="w-4 h-4" />
                      Confirmar e Importar {purchasesParsedData.valid.length} Compras
                    </button>
                  </div>
                ) : (
                  <div className="py-12 text-center text-slate-400 space-y-2">
                    <FileCode2 className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="text-xs">Selecciona un archivo o pega el JSON para validar el crédito fiscal y previsualizar compras.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: IMPORTACIÓN DE CATÁLOGOS EXCEL                                     */}
      {/* ========================================================================= */}
      {activeTab === 'excel_import' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6" id="excel-catalogs-module">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-teal-600" />
              Importador Masivo de Catálogos desde Plantillas Excel (.xlsx / .csv)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Descarga las plantillas oficiales preformateadas, complétalas con tus registros y cárgalas directamente.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Clientes */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Directorio de Clientes</h4>
                <p className="text-xs text-slate-500">
                  Importa cartera con Nombre, NRC, NIT, DUI, Giro, Dirección, Teléfono y condición de Gran Contribuyente.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <button
                  id="download-clients-template-btn"
                  onClick={() => generateTemplateXlsx('clients')}
                  className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar Plantilla (.xlsx)
                </button>
                <label className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-xs">
                  <Upload className="w-3.5 h-3.5" /> Subir Archivo Excel
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => handleExcelUpload(e, 'clients')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Proveedores */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Directorio de Proveedores</h4>
                <p className="text-xs text-slate-500">
                  Importa proveedores con NRC, NIT, razón social y condiciones de retención del 1% de IVA.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <button
                  id="download-suppliers-template-btn"
                  onClick={() => generateTemplateXlsx('suppliers')}
                  className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar Plantilla (.xlsx)
                </button>
                <label className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-xs">
                  <Upload className="w-3.5 h-3.5" /> Subir Archivo Excel
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => handleExcelUpload(e, 'suppliers')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Productos & Inventario */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-4">
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">Productos & Kardex</h4>
                <p className="text-xs text-slate-500">
                  Importa artículos con SKU, nombre, categoría, unidad, costo, precio de venta, stock inicial y tratamiento de IVA.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-200">
                <button
                  id="download-products-template-btn"
                  onClick={() => generateTemplateXlsx('products')}
                  className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 flex items-center justify-center gap-2 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar Plantilla (.xlsx)
                </button>
                <label className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-xs">
                  <Upload className="w-3.5 h-3.5" /> Subir Archivo Excel
                  <input
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => handleExcelUpload(e, 'products')}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: EXPORTACIÓN & RESPALDOS ESPECÍFICOS                                 */}
      {/* ========================================================================= */}
      {activeTab === 'exports' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6" id="exports-module">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Download className="w-5 h-5 text-amber-600" />
              Exportación Segmentada y Copias de Seguridad
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Descarga archivos JSON o libros de Excel por módulo o exporta la base de datos completa.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Solo Ventas */}
            <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-emerald-700" />
                  <h4 className="text-sm font-bold text-emerald-950">Módulo de Ventas</h4>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Exporta exclusivamente el historial de ventas emitidas, DTEs, débitos de IVA y retenciones.
                </p>
              </div>
              <div className="pt-2">
                <button
                  id="export-sales-json-btn"
                  onClick={exportSalesJson}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exportar Ventas (.json)
                </button>
              </div>
            </div>

            {/* Solo Compras */}
            <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-5 h-5 text-blue-700" />
                  <h4 className="text-sm font-bold text-blue-950">Módulo de Compras</h4>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Exporta el libro de compras recibidas de proveedores con créditos de IVA y retenciones.
                </p>
              </div>
              <div className="pt-2">
                <button
                  id="export-purchases-json-btn"
                  onClick={exportPurchasesJson}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exportar Compras (.json)
                </button>
              </div>
            </div>

            {/* Respaldo Completo ERP */}
            <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-700" />
                  <h4 className="text-sm font-bold text-indigo-950">Copia de Seguridad Integral</h4>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Respaldo completo de la empresa: ventas, compras, clientes, proveedores, inventario y asientos.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <button
                  id="export-full-json-tool-btn"
                  onClick={exportFullJson}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exportar Todo (.json)
                </button>
                <button
                  id="export-full-excel-tool-btn"
                  onClick={exportFullExcel}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Exportar Todo (.xlsx)
                </button>
              </div>
            </div>

          </div>

          {/* Restore Full Backup */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-slate-900">Restaurar Copia de Seguridad JSON</h4>
              <p className="text-xs text-slate-500">Carga un archivo de respaldo previo para restaurar el sistema completo.</p>
            </div>
            <input 
              ref={fullBackupFileInputRef}
              type="file"
              accept=".json"
              onChange={handleFullBackupUpload}
              className="hidden"
            />
            <button
              id="restore-backup-btn"
              onClick={() => fullBackupFileInputRef.current?.click()}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold rounded-xl border border-slate-300 shadow-2xs flex items-center gap-2 transition"
            >
              <Upload className="w-4 h-4 text-indigo-600" />
              Seleccionar Archivo de Respaldo (.json)
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
