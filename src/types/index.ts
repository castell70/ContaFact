export type DocumentTypeSale = 'CCF' | 'CF' | 'EXP' | 'NC' | 'ND';
export type DocumentTypePurchase = 'CCF' | 'DUI' | 'NC' | 'ND' | 'Otros';
export type PaymentMethod = 'Contado' | 'Crédito' | 'Transferencia' | 'Cheque' | 'Tarjeta';
export type ActiveTab = 
  | 'dashboard' 
  | 'sales' 
  | 'purchases' 
  | 'inventory' 
  | 'payments' 
  | 'accounting' 
  | 'reports' 
  | 'clients' 
  | 'suppliers' 
  | 'tools'
  | 'settings';

export interface CurrencyConfig {
  code: string; // 'USD', 'EUR', 'GTQ', 'HNL', 'NIO', 'CRC', 'MXN', 'COP', etc.
  symbol: string; // '$', '€', 'Q', 'L', 'C$', '₡', etc.
  name: string; // 'Dólar Estadounidense', 'Euro', 'Quetzal', etc.
  decimalPlaces: number;
  thousandSeparator: string;
  decimalSeparator: string;
  exchangeRateToUSD: number; // Tasa respecto a 1 USD (e.g. USD = 1, EUR = 0.92, GTQ = 7.80, etc.)
  secondaryCurrencies: {
    code: string;
    symbol: string;
    name: string;
    rateToUSD: number;
  }[];
}

export interface CompanyInfo {
  name: string;
  tradeName?: string;
  nit: string;
  nrc: string;
  dui: string;
  activity: string;
  address: string;
  phone: string;
  email: string;
  resolutionNumber?: string;
  resolutionDate?: string;
  authorizedSeries?: string;
  isGranContribuyente?: boolean;
}

export interface Client {
  id: string;
  name: string;
  nrc: string;
  nit: string;
  dui?: string;
  address: string;
  activity: string;
  contact?: string;
  phone: string;
  email: string;
  isGranContribuyente?: boolean;
  creditLimit?: number;
  creditDays?: number;
  notes?: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  nrc: string;
  nit: string;
  dui?: string;
  address: string;
  activity: string;
  contact?: string;
  phone: string;
  email: string;
  isGranContribuyente?: boolean;
  notes?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string; // 'Unidad', 'Caja', 'Litro', 'Kg', 'Servicio', 'Hora'
  cost: number; // Costo unitario
  price: number; // Precio de venta sin IVA
  stock: number; // Existencia actual
  minStock: number; // Alerta de stock mínimo
  taxType: 'gravada' | 'exenta' | 'noSujeta';
  description?: string;
  createdAt: string;
}

export interface InventoryMovement {
  id: string;
  date: string;
  productId: string;
  productName: string;
  type: 'Entrada' | 'Salida' | 'Ajuste';
  reason: 'Compra' | 'Venta' | 'Ajuste Inicial' | 'Merma' | 'Devolución';
  qty: number;
  unitCost: number;
  totalCost: number;
  referenceDoc?: string;
  notes?: string;
  createdAt: string;
}

export interface SalesItem {
  id: string;
  productId?: string;
  qty: number;
  desc: string;
  price: number; // Precio unitario (sin IVA para CCF, con IVA para CF según modo)
  type: 'gravada' | 'exenta' | 'noSujeta';
  subtotal: number;
}

export interface SaleRecord {
  id: string;
  correlative: number;
  dteCode?: string;
  codigoGeneracion?: string;
  date: string; // YYYY-MM-DD
  documentType: DocumentTypeSale;
  clientNrc: string;
  clientId?: string;
  clientName?: string;
  clientNit?: string;
  clientDui?: string;
  clientAddress?: string;
  clientActivity?: string;
  description: string;
  items: SalesItem[];
  taxableAmount: number; // Gravadas locales
  exemptAmount: number;  // Exentas
  noSujetaAmount: number; // No sujetas
  ivaDebit: number;      // 13% IVA
  ivaRetenido: number;   // 1% Retención (si cliente es agente de retención)
  ivaPercibido: number;  // 1% Percepción
  total: number;
  paidAmount?: number;   // Monto cobrado a la fecha
  balancePending?: number; // Saldo deudor pendiente
  paymentStatus?: 'Pendiente' | 'Parcial' | 'Pagada';
  paymentMethod: PaymentMethod;
  paymentDays?: number;
  dueDate?: string;
  status: 'Emitida' | 'Anulada';
  notes?: string;
  createdAt: string;
}

export interface PurchaseRecord {
  id: string;
  correlative: number; // Correlativo interno
  codigoGeneracion?: string;
  date: string; // YYYY-MM-DD
  documentType: DocumentTypePurchase;
  supplierNrc: string;
  supplierId?: string;
  supplierName?: string;
  supplierNit?: string;
  supplierEmail?: string;
  documentNumber: string; // Número de documento del proveedor
  description?: string;
  taxableAmount: number;  // Compras gravadas locales
  importTaxableAmount?: number; // Compras gravadas importación
  exemptAmount: number;   // Compras exentas locales
  importExemptAmount?: number;  // Compras exentas importación
  noSujetaAmount: number; // No sujetas
  ivaCredit: number;      // IVA Crédito Fiscal 13%
  ivaWithheld: number;    // IVA Retenido (1% o 2%)
  ivaPerceived: number;   // IVA Percibido (1%)
  total: number;
  paidAmount?: number;   // Monto pagado al proveedor
  balancePending?: number; // Saldo por pagar pendiente
  paymentStatus?: 'Pendiente' | 'Parcial' | 'Pagada';
  paymentMethod: PaymentMethod;
  dueDate?: string;
  status: 'Registrada' | 'Anulada';
  notes?: string;
  createdAt: string;
}

export interface PaymentRecord {
  id: string;
  type: 'Cobro_Cliente' | 'Pago_Proveedor';
  referenceId: string; // sale.id or purchase.id
  documentNumber: string;
  entityName: string;
  date: string;
  amount: number;
  paymentMethod: PaymentMethod;
  bankOrAccount?: string;
  referenceNumber?: string;
  notes?: string;
  createdAt: string;
}

export interface ChartAccount {
  code: string;
  name: string;
  category: 'Activo' | 'Pasivo' | 'Patrimonio' | 'Ingresos' | 'Costos' | 'Gastos';
  level?: number; // 1: Rubro, 2: Mayor, 3: Subcuenta, 4: Auxiliar
  description?: string;
}

export interface AccountLedger {
  code: string;
  name: string;
  category: 'Activo' | 'Pasivo' | 'Patrimonio' | 'Ingresos' | 'Costos' | 'Gastos';
  balance: number;
}

export interface JournalEntry {
  id: string;
  entryNumber: number;
  date: string;
  concept: string;
  sourceType: 'Venta' | 'Compra' | 'Cobro' | 'Pago' | 'Ajuste';
  referenceDoc?: string;
  lines: {
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
  }[];
  totalDebit: number;
  totalCredit: number;
  createdAt: string;
}

export interface NextCorrelatives {
  salesCCF: number;
  salesCF: number;
  salesEXP: number;
  salesNC: number;
  purchases: number;
  journalEntries: number;
}

export interface AppState {
  companyInfo: CompanyInfo;
  currencyConfig: CurrencyConfig;
  products: Product[];
  inventoryMovements: InventoryMovement[];
  clients: Client[];
  suppliers: Supplier[];
  salesRecords: SaleRecord[];
  purchaseRecords: PurchaseRecord[];
  paymentRecords: PaymentRecord[];
  journalEntries: JournalEntry[];
  chartOfAccounts?: ChartAccount[];
  nextCorrelatives: NextCorrelatives;
}

export interface PeriodSummary {
  periodMonth: number;
  periodYear: number;
  
  // Ventas del mes
  totalSales: number;
  salesTaxable: number;
  salesExempt: number;
  salesNoSujeta: number;
  ivaDebit: number;
  salesCCFCount: number;
  salesCFCount: number;
  
  // Compras del mes
  totalPurchases: number;
  purchasesTaxable: number;
  purchasesExempt: number;
  purchasesNoSujeta: number;
  ivaCredit: number;
  purchasesCount: number;
  
  // Retenciones y percepciones
  ivaRetenidoVentas: number;
  ivaRetenidoCompras: number;
  ivaPercibidoCompras: number;
  
  // Balance IVA
  ivaToPay: number; // Positive = A pagar, Negative = Remanente
  utility: number; // Utilidad bruta estimada
  
  // Acumulados anuales
  annualSalesExcludingIva: number;
  annualSalesIncludingIva: number;
  annualPurchasesExcludingIva: number;
  annualPurchasesIncludingIva: number;
  annualIvaDebit: number;
  annualIvaCredit: number;
}
