import React, { useState, useEffect } from 'react';
import { 
  AppState, 
  ActiveTab, 
  SaleRecord, 
  Client 
} from './types';
import { 
  getAppData, 
  subscribeToDataStore, 
  exportFullExcel 
} from './services/dataStore';

// Layout Components
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';

// View Components
import { Dashboard } from './components/dashboard/Dashboard';
import { SalesManager } from './components/sales/SalesManager';
import { PurchasesManager } from './components/purchases/PurchasesManager';
import { InventoryManager } from './components/inventory/InventoryManager';
import { PaymentsManager } from './components/payments/PaymentsManager';
import { AccountingManager } from './components/accounting/AccountingManager';
import { TaxBooks } from './components/reports/TaxBooks';
import { EntitiesManager } from './components/entities/EntitiesManager';
import { ToolsManager } from './components/tools/ToolsManager';
import { SettingsManager } from './components/settings/SettingsManager';

// Modals
import { InvoiceModal } from './components/sales/InvoiceModal';
import { HelpModal } from './components/help/HelpModal';

const TAB_TITLES: Record<ActiveTab, string> = {
  dashboard: 'Panel de Control ERP & Tributario',
  sales: 'Facturación Emitida (Ventas CCF/CF)',
  purchases: 'Facturas Recibidas (Compras e Insumos)',
  inventory: 'Control de Inventarios & Kardex',
  payments: 'Gestión de Tesorería (CxC / CxP / Pagos)',
  accounting: 'Contabilidad General & Asientos',
  reports: 'Centro de Informes & Libros Oficiales',
  clients: 'Cartera y Registro de Clientes',
  suppliers: 'Directorio de Proveedores',
  tools: 'Herramientas y Carga de Archivos JSON',
  settings: 'Configuración de Empresa, Monedas y Parámetros'
};

export const App: React.FC = () => {
  const [state, setState] = useState<AppState>(getAppData());
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  
  // Date filter for period (Current month & year by default)
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  // Mobile sidebar drawer state
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Modal states
  const [viewingInvoice, setViewingInvoice] = useState<SaleRecord | null>(null);
  const [helpOpen, setHelpOpen] = useState<boolean>(false);

  // Subscribe to real-time changes in dataStore
  useEffect(() => {
    const unsubscribe = subscribeToDataStore((newState) => {
      setState({ ...newState });
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const handleOpenHelp = () => {
    setHelpOpen(true);
  };

  const handleViewInvoice = (sale: SaleRecord) => {
    setViewingInvoice(sale);
  };

  const handleQuickExport = () => {
    exportFullExcel();
  };

  return (
    <div className="flex h-screen w-full bg-[#f8fafc] text-[#1e293b] font-sans antialiased overflow-hidden">
      
      {/* Sleek Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={{
          sales: state.salesRecords.length,
          purchases: state.purchaseRecords.length,
          products: state.products?.length || 0,
          clients: state.clients.length,
          suppliers: state.suppliers.length
        }}
        companyInfo={state.companyInfo}
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
        onOpenHelp={handleOpenHelp}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-hidden">
        
        {/* Sleek Top Header */}
        <Header
          companyInfo={state.companyInfo}
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          onOpenHelp={handleOpenHelp}
          onQuickExport={handleQuickExport}
          onNewSaleClick={() => setActiveTab('sales')}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(true)}
          activeTabTitle={TAB_TITLES[activeTab] || 'Sistema FinanzIVA'}
        />

        {/* Scrollable View Container */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
          
          {activeTab === 'dashboard' && (
            <Dashboard
              state={state}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onNavigate={(tab) => setActiveTab(tab)}
              onSelectSaleForView={handleViewInvoice}
            />
          )}

          {activeTab === 'sales' && (
            <SalesManager
              state={state}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onViewInvoice={handleViewInvoice}
            />
          )}

          {activeTab === 'purchases' && (
            <PurchasesManager
              state={state}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryManager
              state={state}
            />
          )}

          {activeTab === 'payments' && (
            <PaymentsManager
              state={state}
            />
          )}

          {activeTab === 'accounting' && (
            <AccountingManager
              state={state}
            />
          )}

          {activeTab === 'reports' && (
            <TaxBooks
              state={state}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setSelectedMonth}
              onYearChange={setSelectedYear}
            />
          )}

          {activeTab === 'clients' && (
            <EntitiesManager
              type="clients"
              state={state}
            />
          )}

          {activeTab === 'suppliers' && (
            <EntitiesManager
              type="suppliers"
              state={state}
            />
          )}

          {activeTab === 'tools' && (
            <ToolsManager
              state={state}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsManager
              state={state}
            />
          )}

          {/* App Footer */}
          <footer className="mt-12 pt-6 pb-4 border-t border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
              <span className="font-semibold text-slate-700">ITCPO - ERP</span>
              <span className="text-slate-400">|</span>
              <span>Sistema de Gestión Contable y Tributaria</span>
            </div>
            <div className="font-medium text-slate-600">
              © Carlos Alfredo Castillo Flores - ITCPO - 2026
            </div>
          </footer>

        </main>

      </div>

      {/* Invoice Viewer & Printing Modal */}
      {viewingInvoice && (
        <InvoiceModal
          sale={viewingInvoice}
          company={state.companyInfo}
          onClose={() => setViewingInvoice(null)}
        />
      )}

      {/* Tax Guide / Help Modal */}
      {helpOpen && (
        <HelpModal
          onClose={() => setHelpOpen(false)}
        />
      )}

    </div>
  );
};

export default App;
