import React, { useState } from 'react';
import { 
  Building2, 
  Settings, 
  Coins, 
  Layers, 
  Database, 
  Trash2, 
  RotateCcw, 
  Save, 
  CheckCircle2, 
  AlertTriangle,
  FileSpreadsheet,
  Download,
  Info
} from 'lucide-react';
import { AppState, CompanyInfo, NextCorrelatives, CurrencyConfig } from '../../types';
import { 
  updateCompanyInfo, 
  updateNextCorrelatives, 
  updateCurrencyConfig,
  resetData, 
  clearAllData,
  exportFullJson,
  exportFullExcel
} from '../../services/dataStore';

interface SettingsManagerProps {
  state: AppState;
}

export const SettingsManager: React.FC<SettingsManagerProps> = ({ state }) => {
  const [activeSubTab, setActiveSubTab] = useState<'company' | 'currency' | 'correlatives' | 'system'>('company');

  // Company state
  const [company, setCompany] = useState<CompanyInfo>({ ...state.companyInfo });

  // Currency state
  const [currency, setCurrency] = useState<CurrencyConfig>({ 
    code: state.currencyConfig?.code || 'USD',
    symbol: state.currencyConfig?.symbol || '$',
    name: state.currencyConfig?.name || 'Dólar Estadounidense',
    decimalPlaces: state.currencyConfig?.decimalPlaces ?? 2,
    thousandSeparator: state.currencyConfig?.thousandSeparator || ',',
    decimalSeparator: state.currencyConfig?.decimalSeparator || '.',
    exchangeRateToUSD: state.currencyConfig?.exchangeRateToUSD || 1.0,
    secondaryCurrencies: state.currencyConfig?.secondaryCurrencies || []
  });

  // Correlatives state
  const [correlatives, setCorrelatives] = useState<NextCorrelatives>({ ...state.nextCorrelatives });

  // Notifications & Modals
  const [notification, setNotification] = useState<{ message: string; isError?: boolean } | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

  const showNotificationMsg = (message: string, isError = false) => {
    setNotification({ message, isError });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!company.name.trim()) throw new Error('El nombre de la empresa es obligatorio.');
      if (!company.nit.trim()) throw new Error('El NIT de la empresa es obligatorio.');

      updateCompanyInfo(company);
      showNotificationMsg('Información fiscal y comercial de la empresa guardada exitosamente.');
    } catch (err: any) {
      showNotificationMsg(err.message || 'Error al guardar empresa.', true);
    }
  };

  const handleCurrencySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!currency.code.trim()) throw new Error('El código de moneda es obligatorio.');
      if (!currency.symbol.trim()) throw new Error('El símbolo de moneda es obligatorio.');

      updateCurrencyConfig(currency);
      showNotificationMsg('Configuración de moneda y tipo de cambio guardada exitosamente.');
    } catch (err: any) {
      showNotificationMsg(err.message || 'Error al guardar configuración de moneda.', true);
    }
  };

  const handleCorrelativesSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      updateNextCorrelatives(correlatives);
      showNotificationMsg('Correlativos oficiales de emisión actualizados exitosamente.');
    } catch (err: any) {
      showNotificationMsg(err.message || 'Error al actualizar correlativos.', true);
    }
  };

  return (
    <div className="space-y-6" id="settings-manager-root">
      {/* Notifications */}
      {notification && (
        <div 
          id="settings-notification-banner"
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
            id="close-notification-btn"
            onClick={() => setNotification(null)}
            className="text-xs px-2 py-1 bg-white/60 hover:bg-white rounded transition"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Header & Sub-Tabs */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Settings className="w-6 h-6 text-indigo-600" />
            Configuración del Sistema ERP & Facturación
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Administra los datos fiscales de la empresa, divisas y tipos de cambio, correlativos de emisión y estado de base de datos.
          </p>
        </div>

        {/* Sub-tab pills */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1.5 rounded-xl border border-slate-200 text-sm font-medium">
          <button
            id="subtab-company-btn"
            onClick={() => setActiveSubTab('company')}
            className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
              activeSubTab === 'company' 
                ? 'bg-white text-indigo-700 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Empresa & IVA
          </button>
          <button
            id="subtab-currency-btn"
            onClick={() => setActiveSubTab('currency')}
            className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
              activeSubTab === 'currency' 
                ? 'bg-white text-indigo-700 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Coins className="w-4 h-4" />
            Moneda & Divisas
          </button>
          <button
            id="subtab-correlatives-btn"
            onClick={() => setActiveSubTab('correlatives')}
            className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
              activeSubTab === 'correlatives' 
                ? 'bg-white text-indigo-700 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            Correlativos
          </button>
          <button
            id="subtab-system-btn"
            onClick={() => setActiveSubTab('system')}
            className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-all ${
              activeSubTab === 'system' 
                ? 'bg-white text-indigo-700 shadow-xs font-semibold' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Database className="w-4 h-4" />
            Mantenimiento
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: Empresa & IVA */}
      {activeSubTab === 'company' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-600" />
                Datos Generales y Tributarios del Emisor
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Esta información se imprimirá en los Libros de IVA (Ventas y Compras), DTEs, Facturas y Balances.
              </p>
            </div>
            <span className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-semibold border border-indigo-100">
              Régimen General IVA (13%)
            </span>
          </div>

          <form onSubmit={handleCompanySubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Razón Social / Nombre Comercial *
                </label>
                <input
                  id="company-name-input"
                  type="text"
                  required
                  value={company.name}
                  onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  placeholder="Ej: DISTRIBUIDORA INDUSTRIAL SALVADOREÑA S.A. DE C.V."
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre Comercial / Sucursal
                </label>
                <input
                  id="company-tradename-input"
                  type="text"
                  value={company.tradeName || ''}
                  onChange={(e) => setCompany({ ...company, tradeName: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  placeholder="Ej: Central San Salvador"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  NIT (Número de Identificación Tributaria) *
                </label>
                <input
                  id="company-nit-input"
                  type="text"
                  required
                  value={company.nit}
                  onChange={(e) => setCompany({ ...company, nit: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  placeholder="0614-010120-101-5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  NRC (Número de Registro de Contribuyente) *
                </label>
                <input
                  id="company-nrc-input"
                  type="text"
                  required
                  value={company.nrc}
                  onChange={(e) => setCompany({ ...company, nrc: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  placeholder="345678-9"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  DUI (Representante Legal)
                </label>
                <input
                  id="company-dui-input"
                  type="text"
                  value={company.dui || ''}
                  onChange={(e) => setCompany({ ...company, dui: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  placeholder="01234567-8"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Giro Comercial / Actividad Económica
                </label>
                <input
                  id="company-activity-input"
                  type="text"
                  value={company.activity}
                  onChange={(e) => setCompany({ ...company, activity: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  placeholder="Venta al por mayor de repuestos industriales y servicios técnicos"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Teléfono de Contacto
                </label>
                <input
                  id="company-phone-input"
                  type="text"
                  value={company.phone}
                  onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  placeholder="2250-0000"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Dirección del Establecimiento
                </label>
                <input
                  id="company-address-input"
                  type="text"
                  value={company.address}
                  onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  placeholder="Alameda Roosevelt y 55 Av. Sur, Edificio Centro, San Salvador"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Correo Electrónico de Facturación
                </label>
                <input
                  id="company-email-input"
                  type="email"
                  value={company.email || ''}
                  onChange={(e) => setCompany({ ...company, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                  placeholder="facturacion@empresa.com.sv"
                />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                id="save-company-btn"
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs flex items-center gap-2 transition"
              >
                <Save className="w-4 h-4" />
                Guardar Datos de la Empresa
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sub-Tab 2: Moneda & Divisas */}
      {activeSubTab === 'currency' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Coins className="w-5 h-5 text-indigo-600" />
                Configuración de Moneda Principal & Multimoneda
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Personaliza la moneda de presentación, el símbolo, los formatos de números y tasas de cambio para conversiones.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Moneda Actual:</span>
              <span className="px-3 py-1 bg-amber-50 text-amber-800 rounded-lg text-xs font-bold border border-amber-200">
                {currency.code} ({currency.symbol}) - {currency.name}
              </span>
            </div>
          </div>

          <form onSubmit={handleCurrencySubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Código ISO de Moneda *
                </label>
                <select
                  id="currency-code-select"
                  value={currency.code}
                  onChange={(e) => {
                    const code = e.target.value;
                    let symbol = '$';
                    let name = 'Dólar Estadounidense';
                    let rate = 1.0;

                    if (code === 'USD') { symbol = '$'; name = 'Dólar Estadounidense'; rate = 1.0; }
                    else if (code === 'EUR') { symbol = '€'; name = 'Euro'; rate = 0.92; }
                    else if (code === 'GTQ') { symbol = 'Q'; name = 'Quetzal Guatemalteco'; rate = 7.80; }
                    else if (code === 'HNL') { symbol = 'L'; name = 'Lempira Hondureño'; rate = 24.70; }
                    else if (code === 'NIO') { symbol = 'C$'; name = 'Córdoba Nicaragüense'; rate = 36.80; }
                    else if (code === 'CRC') { symbol = '₡'; name = 'Colón Costarricense'; rate = 520.0; }
                    else if (code === 'MXN') { symbol = 'MX$'; name = 'Peso Mexicano'; rate = 18.50; }
                    else if (code === 'COP') { symbol = 'COL$'; name = 'Peso Colombiano'; rate = 4100.0; }

                    setCurrency({
                      ...currency,
                      code,
                      symbol,
                      name,
                      exchangeRateToUSD: rate
                    });
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                >
                  <option value="USD">USD ($) - Dólar Estadounidense (Oficial El Salvador)</option>
                  <option value="EUR">EUR (€) - Euro</option>
                  <option value="GTQ">GTQ (Q) - Quetzal Guatemalteco</option>
                  <option value="HNL">HNL (L) - Lempira Hondureño</option>
                  <option value="NIO">NIO (C$) - Córdoba Nicaragüense</option>
                  <option value="CRC">CRC (₡) - Colón Costarricense</option>
                  <option value="MXN">MXN (MX$) - Peso Mexicano</option>
                  <option value="COP">COP (COL$) - Peso Colombiano</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Símbolo de Moneda *
                </label>
                <input
                  id="currency-symbol-input"
                  type="text"
                  required
                  value={currency.symbol}
                  onChange={(e) => setCurrency({ ...currency, symbol: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-center"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nombre Completo
                </label>
                <input
                  id="currency-name-input"
                  type="text"
                  required
                  value={currency.name}
                  onChange={(e) => setCurrency({ ...currency, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Tasa de Cambio (1 USD = X {currency.code})
                </label>
                <input
                  id="currency-exchange-rate-input"
                  type="number"
                  step="0.0001"
                  min="0.0001"
                  value={currency.exchangeRateToUSD}
                  onChange={(e) => setCurrency({ ...currency, exchangeRateToUSD: parseFloat(e.target.value) || 1.0 })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition text-right"
                />
              </div>
            </div>

            {/* Formatting options & preview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Decimales para Montos
                </label>
                <select
                  id="currency-decimals-select"
                  value={currency.decimalPlaces}
                  onChange={(e) => setCurrency({ ...currency, decimalPlaces: parseInt(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                >
                  <option value={2}>2 Decimales (Estándar $1,250.50)</option>
                  <option value={4}>4 Decimales (Costos unitarios $1,250.5042)</option>
                  <option value={0}>0 Decimales ($1,251)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Separador de Miles
                </label>
                <select
                  id="currency-thousand-sep-select"
                  value={currency.thousandSeparator}
                  onChange={(e) => setCurrency({ ...currency, thousandSeparator: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                >
                  <option value=",">Coma ( , ) Ej: 1,000.00</option>
                  <option value=".">Punto ( . ) Ej: 1.000,00</option>
                  <option value=" ">Espacio ( ) Ej: 1 000.00</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Separador Decimal
                </label>
                <select
                  id="currency-decimal-sep-select"
                  value={currency.decimalSeparator}
                  onChange={(e) => setCurrency({ ...currency, decimalSeparator: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none transition"
                >
                  <option value=".">Punto ( . ) Ej: 1,000.50</option>
                  <option value=",">Coma ( , ) Ej: 1.000,50</option>
                </select>
              </div>
            </div>

            {/* Live formatting preview */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <Info className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>Ejemplo de visualización monetaria en facturas e informes:</span>
              </div>
              <div className="px-4 py-2 bg-white rounded-lg border border-slate-200 shadow-2xs font-mono font-bold text-base text-indigo-900">
                {currency.symbol} 12{currency.thousandSeparator}450{currency.decimalSeparator}75 {currency.code}
              </div>
            </div>

            <div className="flex justify-end">
              <button
                id="save-currency-btn"
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs flex items-center gap-2 transition"
              >
                <Save className="w-4 h-4" />
                Guardar Configuración Monetaria
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sub-Tab 3: Correlativos */}
      {activeSubTab === 'correlatives' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600" />
              Control de Correlativos Oficiales de Facturación
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Define los próximos números de correlativo a emitir para cada tipo de documento fiscal.
            </p>
          </div>

          <form onSubmit={handleCorrelativesSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase">Comprobantes de Crédito Fiscal (CCF)</span>
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-2xs font-bold">Tipo 03</span>
                </div>
                <input
                  id="correlative-ccf-input"
                  type="number"
                  min="1"
                  value={correlatives.salesCCF}
                  onChange={(e) => setCorrelatives({ ...correlatives, salesCCF: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-base font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-2xs text-slate-500">Próximo CCF a emitir: #{correlatives.salesCCF}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase">Facturas Consumidor Final (CF)</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded text-2xs font-bold">Tipo 01</span>
                </div>
                <input
                  id="correlative-cf-input"
                  type="number"
                  min="1"
                  value={correlatives.salesCF}
                  onChange={(e) => setCorrelatives({ ...correlatives, salesCF: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-base font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-2xs text-slate-500">Próxima Factura CF: #{correlatives.salesCF}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase">Facturas de Exportación (EXP)</span>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded text-2xs font-bold">Tipo 11</span>
                </div>
                <input
                  id="correlative-exp-input"
                  type="number"
                  min="1"
                  value={correlatives.salesEXP}
                  onChange={(e) => setCorrelatives({ ...correlatives, salesEXP: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-base font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-2xs text-slate-500">Próxima Exportación: #{correlatives.salesEXP}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase">Notas de Crédito (NC)</span>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded text-2xs font-bold">Tipo 05</span>
                </div>
                <input
                  id="correlative-nc-input"
                  type="number"
                  min="1"
                  value={correlatives.salesNC}
                  onChange={(e) => setCorrelatives({ ...correlatives, salesNC: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-base font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-2xs text-slate-500">Próxima NC: #{correlatives.salesNC}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase">Correlativo Interno Compras</span>
                  <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded text-2xs font-bold">Libro Compras</span>
                </div>
                <input
                  id="correlative-purchases-input"
                  type="number"
                  min="1"
                  value={correlatives.purchases}
                  onChange={(e) => setCorrelatives({ ...correlatives, purchases: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-base font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-2xs text-slate-500">Próxima Compra: #{correlatives.purchases}</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase">Asientos Libro Diario</span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded text-2xs font-bold">Contabilidad</span>
                </div>
                <input
                  id="correlative-journal-input"
                  type="number"
                  min="1"
                  value={correlatives.journalEntries || 1}
                  onChange={(e) => setCorrelatives({ ...correlatives, journalEntries: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-base font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-2xs text-slate-500">Próxima Partida: #{correlatives.journalEntries || 1}</p>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                id="save-correlatives-btn"
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-xs flex items-center gap-2 transition"
              >
                <Save className="w-4 h-4" />
                Actualizar Correlativos
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sub-Tab 4: Mantenimiento del Sistema */}
      {activeSubTab === 'system' && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-indigo-600" />
              Mantenimiento & Respaldos Globales
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Descarga copias de seguridad de toda la base de datos o restablece los datos iniciales de demostración.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full ERP Backup */}
            <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Respaldo Integral ERP (JSON / Excel)</h4>
                    <p className="text-xs text-slate-500">Exporta la totalidad de ventas, compras, clientes, proveedores, inventario y asientos.</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  id="export-full-json-btn"
                  onClick={exportFullJson}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  Descargar Respaldo JSON
                </button>
                <button
                  id="export-full-excel-btn"
                  onClick={exportFullExcel}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  Exportar Todo en Excel (.xlsx)
                </button>
              </div>
            </div>

            {/* Reset / Clear Data */}
            <div className="p-5 bg-rose-50/50 rounded-2xl border border-rose-100 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-rose-950">Zona de Restablecimiento</h4>
                    <p className="text-xs text-rose-600">Restablece la base de datos a los valores de ejemplo o límpiala para iniciar en blanco.</p>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  id="open-reset-modal-btn"
                  onClick={() => setResetConfirmOpen(true)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                  Restablecer Datos Demo
                </button>
                <button
                  id="open-clear-modal-btn"
                  onClick={() => setClearConfirmOpen(true)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Vaciar Todo (Iniciar en Blanco)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {resetConfirmOpen && (
        <div 
          id="reset-confirm-modal"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">¿Restablecer datos de demostración?</h3>
              <p className="text-xs text-slate-500">
                Esta acción reemplazará las ventas, compras, productos y clientes actuales con el catálogo inicial de prueba de El Salvador.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                id="cancel-reset-btn"
                onClick={() => setResetConfirmOpen(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                id="confirm-reset-btn"
                onClick={() => {
                  resetData();
                  setResetConfirmOpen(false);
                  showNotificationMsg('¡Datos de demostración restablecidos con éxito!');
                }}
                className="flex-1 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                Sí, Restablecer Demo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Confirmation Modal */}
      {clearConfirmOpen && (
        <div 
          id="clear-confirm-modal"
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
        >
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold text-slate-900">¿Vaciar toda la base de datos?</h3>
              <p className="text-xs text-slate-500">
                Se eliminarán permanentemente todos los registros de ventas, compras, inventario, clientes y proveedores para iniciar tu empresa desde cero.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                id="cancel-clear-btn"
                onClick={() => setClearConfirmOpen(false)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                id="confirm-clear-btn"
                onClick={() => {
                  clearAllData();
                  setClearConfirmOpen(false);
                  showNotificationMsg('Base de datos vaciada. El sistema está listo para operar.');
                }}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                Sí, Vaciar Todo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
