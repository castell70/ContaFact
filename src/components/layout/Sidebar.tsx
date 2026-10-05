import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  ShoppingCart, 
  BookOpenCheck, 
  Users, 
  Truck, 
  Wrench,
  Settings, 
  HelpCircle,
  X,
  Package,
  CreditCard,
  Landmark,
  FileSpreadsheet
} from 'lucide-react';
import { ActiveTab, CompanyInfo } from '../../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  counts: {
    sales: number;
    purchases: number;
    clients: number;
    suppliers: number;
    products?: number;
  };
  companyInfo: CompanyInfo;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenHelp: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  counts,
  companyInfo,
  isOpenMobile,
  onCloseMobile,
  onOpenHelp
}) => {
  const mainNavItems = [
    { id: 'dashboard' as ActiveTab, label: 'Panel Principal', icon: LayoutDashboard },
    { id: 'sales' as ActiveTab, label: 'Facturación Emitida', icon: Receipt, badge: counts.sales },
    { id: 'purchases' as ActiveTab, label: 'Facturas Recibidas', icon: ShoppingCart, badge: counts.purchases },
    { id: 'inventory' as ActiveTab, label: 'Inventario & Kardex', icon: Package, badge: counts.products },
    { id: 'payments' as ActiveTab, label: 'Cobros & Pagos (CxC/P)', icon: CreditCard },
    { id: 'accounting' as ActiveTab, label: 'Contabilidad & Balances', icon: Landmark },
    { id: 'reports' as ActiveTab, label: 'Reportes e Informes', icon: BookOpenCheck },
  ];

  const directoryNavItems = [
    { id: 'clients' as ActiveTab, label: 'Cartera Clientes', icon: Users, badge: counts.clients },
    { id: 'suppliers' as ActiveTab, label: 'Proveedores', icon: Truck, badge: counts.suppliers },
    { id: 'tools' as ActiveTab, label: 'Herramientas (Carga JSON)', icon: Wrench },
    { id: 'settings' as ActiveTab, label: 'Configuración & Moneda', icon: Settings },
  ];

  const handleSelect = (tab: ActiveTab) => {
    onTabChange(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:static top-0 left-0 bottom-0 z-50
        w-64 bg-[#0f172a] text-white flex flex-col justify-between shrink-0
        transition-transform duration-300 ease-in-out border-r border-slate-800/80
        ${isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        
        {/* Top Branding Section */}
        <div className="p-5 overflow-y-auto flex-1 custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center font-black text-lg text-white shadow-lg shadow-orange-500/40 select-none animate-slow-glow">
                IT
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-white leading-none flex items-center gap-1.5">
                  <span className="text-orange-500 animate-slow-neon">ITCPO</span>
                  <span className="text-slate-300 text-sm font-semibold">- ERP</span>
                </span>
                <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping"></span>
                  Gestión & Fiscal SV
                </span>
              </div>
            </div>

            {/* Mobile close button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links - Operaciones */}
          <div className="mb-2 px-2">
            <span className="text-[10px] font-bold text-orange-400/90 uppercase tracking-wider">
              Módulos ERP
            </span>
          </div>
          <nav className="space-y-1 mb-6">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/30 font-bold border-l-2 border-orange-300'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/90'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-orange-400/80'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-orange-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Directorio y Configuración */}
          <div className="mb-2 px-2">
            <span className="text-[10px] font-bold text-orange-400/90 uppercase tracking-wider">
              Catálogos & Ajustes
            </span>
          </div>
          <nav className="space-y-1">
            {directoryNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/30 font-bold border-l-2 border-orange-300'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/90'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-orange-400/80'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {typeof item.badge === 'number' && item.badge > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-orange-400'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Company Info / Profile Pill */}
        <div className="p-4 border-t border-slate-800 bg-[#0b1120] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-sm min-w-0">
              <div className="w-8 h-8 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                {companyInfo.name ? companyInfo.name.substring(0, 2) : 'IT'}
              </div>
              <div className="truncate">
                <p className="font-semibold text-white truncate text-xs">
                  {companyInfo.tradeName || companyInfo.name}
                </p>
                <p className="text-[10px] text-slate-400 font-mono truncate">
                  NRC: {companyInfo.nrc}
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onOpenHelp();
                onCloseMobile();
              }}
              className="p-1.5 text-slate-400 hover:text-orange-400 rounded transition-colors"
              title="Guía Tributaria & Manual"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

      </aside>
    </>
  );
};
