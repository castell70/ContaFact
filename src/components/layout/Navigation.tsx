import React from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  ShoppingCart, 
  Users, 
  Truck, 
  BookOpenCheck, 
  Wrench
} from 'lucide-react';

export type ActiveTab = 'dashboard' | 'sales' | 'purchases' | 'clients' | 'suppliers' | 'reports' | 'tools';

interface NavigationProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  counts: {
    sales: number;
    purchases: number;
    clients: number;
    suppliers: number;
  };
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, counts }) => {
  const tabs = [
    { id: 'dashboard' as ActiveTab, label: 'Inicio', icon: LayoutDashboard },
    { id: 'sales' as ActiveTab, label: 'Ventas (CCF/CF)', icon: Receipt, badge: counts.sales },
    { id: 'purchases' as ActiveTab, label: 'Compras', icon: ShoppingCart, badge: counts.purchases },
    { id: 'clients' as ActiveTab, label: 'Clientes', icon: Users, badge: counts.clients },
    { id: 'suppliers' as ActiveTab, label: 'Proveedores', icon: Truck, badge: counts.suppliers },
    { id: 'reports' as ActiveTab, label: 'Libros de IVA', icon: BookOpenCheck },
    { id: 'tools' as ActiveTab, label: 'Herramientas y Empresa', icon: Wrench },
  ];

  return (
    <nav className="bg-white border-b border-slate-200 shadow-sm sticky top-[61px] md:top-[65px] z-30">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto py-2 scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
