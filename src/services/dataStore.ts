import * as XLSX from 'xlsx';
import { 
  AppState, 
  Client, 
  Supplier, 
  SaleRecord, 
  PurchaseRecord, 
  CompanyInfo, 
  NextCorrelatives, 
  SalesItem,
  CurrencyConfig,
  Product,
  InventoryMovement,
  PaymentRecord,
  JournalEntry,
  ChartAccount,
  DocumentTypeSale,
  DocumentTypePurchase
} from '../types';
import { DEFAULT_CURRENCY_CONFIG } from '../utils/numberToWords';

export const STORAGE_KEY = 'iva_sv_erp_data_v3';
export const VAT_RATE = 0.13; // 13% El Salvador standard rate
export const RETENTION_RATE = 0.01; // 1% Gran Contribuyente agente de retención

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

const defaultCompanyInfo: CompanyInfo = {
  name: 'DISTRIBUIDORA Y SERVICIOS INTEGRALES, S.A. DE C.V.',
  tradeName: 'DISTRIBUIDORA INTEGRAL ERP',
  nit: '0614-150820-102-4',
  nrc: '284910-3',
  dui: '02345678-9',
  activity: 'Venta al por mayor y menor de suministros comerciales y servicios técnicos',
  address: 'Calle Los Sisimiles #142, Col. Miramonte, San Salvador, El Salvador',
  phone: '2275-8900',
  email: 'administracion@distribuidoraintegral.com.sv',
  resolutionNumber: 'RES-DGG-2023-09412',
  resolutionDate: '2023-01-15',
  authorizedSeries: 'DTE-03-VTA',
  isGranContribuyente: false
};

const defaultProducts: Product[] = [
  {
    id: 'prod-1',
    sku: 'ROD-50MM',
    name: 'Set de rodamientos industriales 50mm',
    category: 'Repuestos & Rodamientos',
    unit: 'Unidad',
    cost: 28.00,
    price: 45.00,
    stock: 45,
    minStock: 10,
    taxType: 'gravada',
    description: 'Rodamiento de precisión en acero templado para maquinaria pesada',
    createdAt: '2025-01-01T08:00:00Z'
  },
  {
    id: 'prod-2',
    sku: 'LUB-SYN-GAL',
    name: 'Aceite sintético lubricante alta viscosidad (Galón)',
    category: 'Lubricantes & Químicos',
    unit: 'Galón',
    cost: 21.50,
    price: 35.00,
    stock: 28,
    minStock: 8,
    taxType: 'gravada',
    description: 'Lubricante sintético multiusos grado ISO 68',
    createdAt: '2025-01-01T08:00:00Z'
  },
  {
    id: 'prod-3',
    sku: 'TORN-GALV-2IN',
    name: 'Caja tornillería galvanizada 2 pulgadas (100u)',
    category: 'Ferretería & Sujeción',
    unit: 'Caja',
    cost: 7.20,
    price: 12.50,
    stock: 85,
    minStock: 20,
    taxType: 'gravada',
    description: 'Tornillos estructurales grado 5 con tuerca y arandela',
    createdAt: '2025-01-02T08:00:00Z'
  },
  {
    id: 'prod-4',
    sku: 'CINT-MET-8M',
    name: 'Cinta métrica profesional 8m anti-impacto',
    category: 'Herramientas Manuales',
    unit: 'Unidad',
    cost: 4.50,
    price: 8.00,
    stock: 32,
    minStock: 15,
    taxType: 'gravada',
    description: 'Flexómetro de alta resistencia con freno magnético',
    createdAt: '2025-01-02T08:00:00Z'
  },
  {
    id: 'prod-5',
    sku: 'MAN-TEC-SEG',
    name: 'Manual técnico de seguridad industrial y normas OSHA',
    category: 'Publicaciones & Normativas',
    unit: 'Unidad',
    cost: 15.00,
    price: 25.00,
    stock: 12,
    minStock: 5,
    taxType: 'exenta',
    description: 'Guía y manual técnico certificado (Libro Exento de IVA)',
    createdAt: '2025-01-03T08:00:00Z'
  },
  {
    id: 'prod-6',
    sku: 'SERV-MANT-PREV',
    name: 'Servicio técnico preventivo especializado por hora',
    category: 'Servicios Profesionales',
    unit: 'Hora',
    cost: 35.00,
    price: 85.00,
    stock: 999,
    minStock: 0,
    taxType: 'gravada',
    description: 'Mantenimiento preventivo en instalaciones y calibración',
    createdAt: '2025-01-03T08:00:00Z'
  }
];

const defaultInventoryMovements: InventoryMovement[] = [
  {
    id: 'mov-1',
    date: '2025-01-02',
    productId: 'prod-1',
    productName: 'Set de rodamientos industriales 50mm',
    type: 'Entrada',
    reason: 'Compra',
    qty: 50,
    unitCost: 28.00,
    totalCost: 1400.00,
    referenceDoc: 'CCF-44910',
    notes: 'Ingreso inicial por compra de importación',
    createdAt: '2025-01-02T09:00:00Z'
  },
  {
    id: 'mov-2',
    date: '2025-01-05',
    productId: 'prod-1',
    productName: 'Set de rodamientos industriales 50mm',
    type: 'Salida',
    reason: 'Venta',
    qty: 10,
    unitCost: 28.00,
    totalCost: 280.00,
    referenceDoc: 'CCF #1001',
    notes: 'Despacho a Corporación Industrial Centroamericana',
    createdAt: '2025-01-05T10:30:00Z'
  },
  {
    id: 'mov-3',
    date: '2025-01-02',
    productId: 'prod-3',
    productName: 'Caja tornillería galvanizada 2 pulgadas (100u)',
    type: 'Entrada',
    reason: 'Ajuste Inicial',
    qty: 100,
    unitCost: 7.20,
    totalCost: 720.00,
    notes: 'Carga inicial de inventario',
    createdAt: '2025-01-02T08:00:00Z'
  }
];

const defaultClients: Client[] = [
  {
    id: 'cli-1',
    name: 'CORPORACIÓN INDUSTRIAL CENTROAMERICANA, S.A. DE C.V.',
    nrc: '194820-1',
    nit: '0614-230595-101-2',
    address: 'Boulevard del Ejército Km 4.5, Soyapango, San Salvador',
    activity: 'Fabricación de productos metálicos y estructuras',
    contact: 'Ing. Carlos Mendoza (Gerente de Compras)',
    phone: '2299-4400',
    email: 'compras@corpindustrial.com.sv',
    isGranContribuyente: true,
    creditLimit: 10000,
    creditDays: 30,
    notes: 'Agente de Retención designado por el Ministerio de Hacienda (1%)',
    createdAt: '2025-01-10T10:00:00Z'
  },
  {
    id: 'cli-2',
    name: 'COMERCIAL LA POPULAR DE OCCIDENTE, S.A. DE C.V.',
    nrc: '238194-5',
    nit: '0210-140288-103-7',
    address: 'Av. Independencia Sur #45, Santa Ana',
    activity: 'Venta de artículos de ferretería y hogar',
    contact: 'Licda. Sofia Ramos',
    phone: '2440-1234',
    email: 'administracion@lapopular.com.sv',
    isGranContribuyente: false,
    creditLimit: 5000,
    creditDays: 15,
    createdAt: '2025-01-15T11:30:00Z'
  },
  {
    id: 'cli-3',
    name: 'SUPERMERCADOS Y TIENDAS DEL SUR, S.A. DE C.V.',
    nrc: '304918-2',
    nit: '0614-081105-104-9',
    address: 'Calle Roosevelt Poniente #120, San Miguel',
    activity: 'Comercio al por menor en almacenes no especializados',
    contact: 'Roberto Gómez (Jefe de Facturación)',
    phone: '2661-8899',
    email: 'cuentasporpagar@tiendasdelsur.sv',
    isGranContribuyente: true,
    creditLimit: 8000,
    creditDays: 30,
    createdAt: '2025-02-01T09:15:00Z'
  }
];

const defaultSuppliers: Supplier[] = [
  {
    id: 'sup-1',
    name: 'IMPORTADORA Y LOGÍSTICA GLOBAL, S.A. DE C.V.',
    nrc: '183920-8',
    nit: '0614-120401-102-8',
    address: 'Zona Franca San Bartolo, Ilopango, San Salvador',
    activity: 'Importación y distribución de insumos y equipos',
    contact: 'Lic. Fernando Ortiz',
    phone: '2295-6000',
    email: 'ventas@logaglobal.sv',
    isGranContribuyente: true,
    notes: 'Proveedor principal de rodamientos y lubricantes',
    createdAt: '2025-01-05T08:00:00Z'
  },
  {
    id: 'sup-2',
    name: 'PAPELERÍA Y SUMINISTROS DE EL SALVADOR, LTDA. DE C.V.',
    nrc: '219402-4',
    nit: '0614-290998-101-5',
    address: 'Alameda Juan Pablo II #320, San Salvador',
    activity: 'Venta al por mayor de papel, cartón y artículos de oficina',
    contact: 'Claudia Morales',
    phone: '2260-3322',
    email: 'pedidos@papeleriaelsalvador.com',
    isGranContribuyente: false,
    createdAt: '2025-01-08T14:20:00Z'
  },
  {
    id: 'sup-3',
    name: 'TELECOMUNICACIONES Y TECNOLOGÍA SV, S.A. DE C.V.',
    nrc: '312940-1',
    nit: '0614-180712-106-3',
    address: 'Centro Financiero Gigante, Torre B, San Salvador',
    activity: 'Servicios de Internet, telefonía y enlaces de datos',
    contact: 'Atención Corporativa',
    phone: '2280-9900',
    email: 'facturas@tecnologiasv.com',
    isGranContribuyente: true,
    createdAt: '2025-01-12T16:45:00Z'
  }
];

// Helper to get current and recent ISO dates
const today = new Date();
const pad = (n: number) => n.toString().padStart(2, '0');
const curY = today.getFullYear();
const curM = pad(today.getMonth() + 1);

const defaultSales: SaleRecord[] = [
  {
    id: 'sale-1',
    correlative: 1001,
    dteCode: `DTE-03-VTA-${curY}${curM}-0001`,
    date: `${curY}-${curM}-05`,
    documentType: 'CCF',
    clientNrc: '194820-1',
    clientId: 'cli-1',
    clientName: 'CORPORACIÓN INDUSTRIAL CENTROAMERICANA, S.A. DE C.V.',
    clientNit: '0614-230595-101-2',
    clientAddress: 'Boulevard del Ejército Km 4.5, Soyapango, San Salvador',
    clientActivity: 'Fabricación de productos metálicos y estructuras',
    description: 'Suministro de consumibles industriales de alta resistencia y mantenimiento',
    items: [
      { id: 'it-1', productId: 'prod-1', qty: 10, desc: 'Set de rodamientos industriales 50mm', price: 45.00, type: 'gravada', subtotal: 450.00 },
      { id: 'it-2', productId: 'prod-2', qty: 5, desc: 'Aceite sintético lubricante de alta viscosidad (galón)', price: 35.00, type: 'gravada', subtotal: 175.00 },
      { id: 'it-3', productId: 'prod-5', qty: 2, desc: 'Manual técnico de seguridad industrial (Exento)', price: 25.00, type: 'exenta', subtotal: 50.00 }
    ],
    taxableAmount: 625.00,
    exemptAmount: 50.00,
    noSujetaAmount: 0.00,
    ivaDebit: 81.25, // 13% of 625.00
    ivaRetenido: 6.25, // 1% retención por Gran Contribuyente
    ivaPercibido: 0.00,
    total: 750.00, // 625 + 50 + 81.25 - 6.25 = 750.00
    paidAmount: 250.00, // Pago parcial registrado
    paymentMethod: 'Crédito',
    paymentDays: 30,
    dueDate: `${curY}-${pad(Number(curM) + 1)}-05`,
    status: 'Emitida',
    notes: 'Entrega en planta Soyapango con orden de compra #OC-8841',
    createdAt: `${curY}-${curM}-05T10:30:00Z`
  },
  {
    id: 'sale-2',
    correlative: 1002,
    dteCode: `DTE-03-VTA-${curY}${curM}-0002`,
    date: `${curY}-${curM}-08`,
    documentType: 'CCF',
    clientNrc: '238194-5',
    clientId: 'cli-2',
    clientName: 'COMERCIAL LA POPULAR DE OCCIDENTE, S.A. DE C.V.',
    clientNit: '0210-140288-103-7',
    clientAddress: 'Av. Independencia Sur #45, Santa Ana',
    clientActivity: 'Venta de artículos de ferretería y hogar',
    description: 'Lote de herramientas y accesorios de ferretería',
    items: [
      { id: 'it-4', productId: 'prod-3', qty: 20, desc: 'Cajas de tornillería galvanizada 2 pulgadas', price: 12.50, type: 'gravada', subtotal: 250.00 },
      { id: 'it-5', productId: 'prod-4', qty: 15, desc: 'Cintas métricas profesionales 8m', price: 8.00, type: 'gravada', subtotal: 120.00 }
    ],
    taxableAmount: 370.00,
    exemptAmount: 0.00,
    noSujetaAmount: 0.00,
    ivaDebit: 48.10, // 13% of 370.00
    ivaRetenido: 0.00,
    ivaPercibido: 0.00,
    total: 418.10, // 370 + 48.10
    paidAmount: 418.10,
    paymentMethod: 'Contado',
    status: 'Emitida',
    notes: 'Pago recibido mediante transferencia bancaria',
    createdAt: `${curY}-${curM}-08T15:00:00Z`
  },
  {
    id: 'sale-3',
    correlative: 501,
    dteCode: `DTE-01-CF-${curY}${curM}-0501`,
    date: `${curY}-${curM}-10`,
    documentType: 'CF',
    clientNrc: '',
    clientName: 'Cliente General / Consumidor Final',
    description: 'Ventas de mostrador del día (Lote de suministros menores)',
    items: [
      { id: 'it-6', qty: 4, desc: 'Pack de accesorios y adaptadores varios', price: 30.00, type: 'gravada', subtotal: 120.00 }
    ],
    taxableAmount: 106.19, // 120 / 1.13
    exemptAmount: 0.00,
    noSujetaAmount: 0.00,
    ivaDebit: 13.81, // 120 - 106.19
    ivaRetenido: 0.00,
    ivaPercibido: 0.00,
    total: 120.00,
    paidAmount: 120.00,
    paymentMethod: 'Contado',
    status: 'Emitida',
    notes: 'Comprobante de venta consumidor final de contado',
    createdAt: `${curY}-${curM}-10T17:00:00Z`
  },
  {
    id: 'sale-4',
    correlative: 502,
    dteCode: `DTE-01-CF-${curY}${curM}-0502`,
    date: `${curY}-${curM}-14`,
    documentType: 'CF',
    clientNrc: '',
    clientName: 'Juan Carlos Menjívar (Consumidor)',
    description: 'Servicio de mantenimiento preventivo de equipos',
    items: [
      { id: 'it-7', productId: 'prod-6', qty: 1, desc: 'Servicio técnico preventivo especializado', price: 85.00, type: 'gravada', subtotal: 85.00 }
    ],
    taxableAmount: 75.22,
    exemptAmount: 0.00,
    noSujetaAmount: 0.00,
    ivaDebit: 9.78,
    ivaRetenido: 0.00,
    ivaPercibido: 0.00,
    total: 85.00,
    paidAmount: 85.00,
    paymentMethod: 'Tarjeta',
    status: 'Emitida',
    createdAt: `${curY}-${curM}-14T11:20:00Z`
  }
];

const defaultPurchases: PurchaseRecord[] = [
  {
    id: 'pur-1',
    correlative: 2001,
    date: `${curY}-${curM}-03`,
    documentType: 'CCF',
    supplierNrc: '183920-8',
    supplierId: 'sup-1',
    supplierName: 'IMPORTADORA Y LOGÍSTICA GLOBAL, S.A. DE C.V.',
    supplierNit: '0614-120401-102-8',
    supplierEmail: 'ventas@logaglobal.sv',
    documentNumber: 'CCF-44910',
    description: 'Compra de inventario de repuestos y rodamientos para distribución',
    taxableAmount: 480.00,
    importTaxableAmount: 0,
    exemptAmount: 0.00,
    importExemptAmount: 0,
    noSujetaAmount: 0.00,
    ivaCredit: 62.40, // 13% of 480.00
    ivaWithheld: 0.00,
    ivaPerceived: 4.80, // 1% percepción
    total: 547.20, // 480 + 62.40 + 4.80
    paidAmount: 200.00, // Abono inicial
    paymentMethod: 'Crédito',
    dueDate: `${curY}-${pad(Number(curM) + 1)}-03`,
    status: 'Registrada',
    createdAt: `${curY}-${curM}-03T09:00:00Z`
  },
  {
    id: 'pur-2',
    correlative: 2002,
    date: `${curY}-${curM}-07`,
    documentType: 'CCF',
    supplierNrc: '219402-4',
    supplierId: 'sup-2',
    supplierName: 'PAPELERÍA Y SUMINISTROS DE EL SALVADOR, LTDA. DE C.V.',
    supplierNit: '0614-290998-101-5',
    supplierEmail: 'pedidos@papeleriaelsalvador.com',
    documentNumber: 'CCF-10294',
    description: 'Resmas de papel bond, tinta para impresión y artículos de oficina',
    taxableAmount: 110.00,
    importTaxableAmount: 0,
    exemptAmount: 15.00,
    importExemptAmount: 0,
    noSujetaAmount: 0.00,
    ivaCredit: 14.30, // 13% of 110.00
    ivaWithheld: 0.00,
    ivaPerceived: 0.00,
    total: 139.30, // 110 + 15 + 14.30
    paidAmount: 139.30,
    paymentMethod: 'Contado',
    status: 'Registrada',
    createdAt: `${curY}-${curM}-07T14:30:00Z`
  },
  {
    id: 'pur-3',
    correlative: 2003,
    date: `${curY}-${curM}-12`,
    documentType: 'CCF',
    supplierNrc: '312940-1',
    supplierId: 'sup-3',
    supplierName: 'TELECOMUNICACIONES Y TECNOLOGÍA SV, S.A. DE C.V.',
    supplierNit: '0614-180712-106-3',
    supplierEmail: 'facturas@tecnologiasv.com',
    documentNumber: 'CCF-88712',
    description: 'Servicio corporativo de enlace de fibra óptica y telefonía IP',
    taxableAmount: 95.00,
    importTaxableAmount: 0,
    exemptAmount: 0.00,
    importExemptAmount: 0,
    noSujetaAmount: 0.00,
    ivaCredit: 12.35, // 13% of 95.00
    ivaWithheld: 0.00,
    ivaPerceived: 0.00,
    total: 107.35,
    paidAmount: 107.35,
    paymentMethod: 'Transferencia',
    status: 'Registrada',
    createdAt: `${curY}-${curM}-12T16:00:00Z`
  }
];

const defaultPayments: PaymentRecord[] = [
  {
    id: 'pay-1',
    type: 'Cobro_Cliente',
    referenceId: 'sale-1',
    documentNumber: 'CCF-1001',
    entityName: 'CORPORACIÓN INDUSTRIAL CENTROAMERICANA, S.A. DE C.V.',
    date: `${curY}-${curM}-10`,
    amount: 250.00,
    paymentMethod: 'Transferencia',
    bankOrAccount: 'Banco Agrícola Cta #110-0982-1',
    referenceNumber: 'TRANSF-98214',
    notes: 'Abono 1/2 a CCF #1001',
    createdAt: `${curY}-${curM}-10T11:00:00Z`
  },
  {
    id: 'pay-2',
    type: 'Pago_Proveedor',
    referenceId: 'pur-1',
    documentNumber: 'CCF-44910',
    entityName: 'IMPORTADORA Y LOGÍSTICA GLOBAL, S.A. DE C.V.',
    date: `${curY}-${curM}-11`,
    amount: 200.00,
    paymentMethod: 'Transferencia',
    bankOrAccount: 'Banco Cuscatlán Cta #022-441-00',
    referenceNumber: 'CHQ-004412',
    notes: 'Anticipo por orden de repuestos',
    createdAt: `${curY}-${curM}-11T14:30:00Z`
  }
];

const defaultJournalEntries: JournalEntry[] = [
  {
    id: 'je-1',
    entryNumber: 1,
    date: `${curY}-${curM}-01`,
    concept: 'Asiento de apertura y saldos iniciales del período',
    sourceType: 'Ajuste',
    lines: [
      { accountCode: '110101', accountName: 'Caja General y Bancos', debit: 15400.00, credit: 0 },
      { accountCode: '110301', accountName: 'Inventarios de Mercaderías', debit: 8200.00, credit: 0 },
      { accountCode: '110201', accountName: 'Cuentas por Cobrar Comerciales', debit: 3500.00, credit: 0 },
      { accountCode: '210101', accountName: 'Cuentas por Pagar Proveedores', debit: 0, credit: 4100.00 },
      { accountCode: '310101', accountName: 'Capital Social / Patrimonio', debit: 0, credit: 23000.00 }
    ],
    totalDebit: 27100.00,
    totalCredit: 27100.00,
    createdAt: `${curY}-${curM}-01T08:00:00Z`
  },
  {
    id: 'je-2',
    entryNumber: 2,
    date: `${curY}-${curM}-05`,
    concept: 'Venta con Crédito Fiscal CCF #1001 a Corp Industrial',
    sourceType: 'Venta',
    referenceDoc: 'CCF-1001',
    lines: [
      { accountCode: '110201', accountName: 'Cuentas por Cobrar Clientes', debit: 750.00, credit: 0 },
      { accountCode: '110402', accountName: 'Retención IVA 1% por Cobrar', debit: 6.25, credit: 0 },
      { accountCode: '410101', accountName: 'Ingresos por Ventas Gravadas', debit: 0, credit: 625.00 },
      { accountCode: '410102', accountName: 'Ingresos por Ventas Exentas', debit: 0, credit: 50.00 },
      { accountCode: '210201', accountName: 'IVA Débito Fiscal por Pagar', debit: 0, credit: 81.25 }
    ],
    totalDebit: 756.25,
    totalCredit: 756.25,
    createdAt: `${curY}-${curM}-05T10:35:00Z`
  }
];

export const defaultChartOfAccounts: ChartAccount[] = [
  { code: '1101', name: 'Efectivo y Equivalentes de Efectivo (Caja General)', category: 'Activo', level: 2, description: 'Fondos en caja general y chica' },
  { code: '1102', name: 'Bancos Locales (Cuentas Corrientes y Ahorros)', category: 'Activo', level: 2, description: 'Depósitos en instituciones financieras' },
  { code: '1103', name: 'Cuentas por Cobrar Clientes (CxC Comerciales)', category: 'Activo', level: 2, description: 'Derechos de cobro por ventas a crédito' },
  { code: '1104', name: 'Inventario de Mercaderías para la Venta', category: 'Activo', level: 2, description: 'Existencias físicas valoradas al costo' },
  { code: '1105', name: 'IVA Crédito Fiscal (13% en Compras)', category: 'Activo', level: 2, description: 'Impuesto pagado recuperable en compras de bienes y servicios' },
  { code: '1106', name: 'IVA Retenido a Favor (1% Retenciones Recibidas)', category: 'Activo', level: 2, description: 'Anticipos de IVA retenidos por Grandes Contribuyentes' },
  { code: '1107', name: 'Pagos a Cuenta de Impuesto sobre la Renta (1.75%)', category: 'Activo', level: 2, description: 'Anticipo mensual de impuesto a la renta' },
  { code: '1201', name: 'Propiedad, Planta y Equipo (Mobiliario, Equipos y Vehículos)', category: 'Activo', level: 2, description: 'Activos fijos tangibles de la empresa' },
  { code: '1202', name: 'Depreciación Acumulada de Propiedad, Planta y Equipo', category: 'Activo', level: 2, description: 'Cuenta compensatoria de activo fijo' },
  { code: '2101', name: 'Cuentas por Pagar Comerciales (Proveedores CxP)', category: 'Pasivo', level: 2, description: 'Obligaciones por compras de mercadería e insumos a crédito' },
  { code: '2102', name: 'IVA Débito Fiscal por Pagar (13% en Ventas)', category: 'Pasivo', level: 2, description: 'Impuesto cobrado a clientes por liquidar al Ministerio de Hacienda' },
  { code: '2103', name: 'Retenciones de IVA por Enterar (1% a Proveedores)', category: 'Pasivo', level: 2, description: 'Retenciones efectuadas a terceros pendientes de enterar' },
  { code: '2104', name: 'Retenciones de Renta por Pagar (Sueldos y Servicios 10%)', category: 'Pasivo', level: 2, description: 'Retenciones de renta sobre salarios y servicios profesionales' },
  { code: '2105', name: 'Planilla e Imposiciones por Pagar (ISSS / AFP)', category: 'Pasivo', level: 2, description: 'Cuotas patronales y laborales de seguridad social y previsión' },
  { code: '2201', name: 'Préstamos y Obligaciones Financieras a Largo Plazo', category: 'Pasivo', level: 2, description: 'Deudas bancarias e hipotecarias' },
  { code: '3101', name: 'Capital Social Suscrito y Pagado', category: 'Patrimonio', level: 2, description: 'Aportes de los socios o accionistas' },
  { code: '3102', name: 'Reserva Legal Acumulada', category: 'Patrimonio', level: 2, description: 'Reserva del 7% sobre utilidades netas (Código de Comercio)' },
  { code: '3103', name: 'Resultados Acumulados de Ejercicios Anteriores', category: 'Patrimonio', level: 2, description: 'Utilidades o pérdidas retenidas de períodos previos' },
  { code: '3104', name: 'Utilidad o Pérdida del Presente Ejercicio', category: 'Patrimonio', level: 2, description: 'Resultado económico del período actual' },
  { code: '4101', name: 'Ingresos por Ventas Gravadas (Mercaderías Locales)', category: 'Ingresos', level: 2, description: 'Ventas de productos afectas al 13% IVA' },
  { code: '4102', name: 'Ingresos por Ventas Exentas y No Sujetas', category: 'Ingresos', level: 2, description: 'Ventas de bienes y servicios exentos de IVA' },
  { code: '4103', name: 'Ingresos por Servicios y Asesorías Técnicas', category: 'Ingresos', level: 2, description: 'Ingresos ordinarios por prestación de servicios' },
  { code: '4104', name: 'Otros Ingresos no Operacionales y Financieros', category: 'Ingresos', level: 2, description: 'Intereses ganados, descuentos y otros' },
  { code: '5101', name: 'Costo de Ventas y Compras de Mercaderías', category: 'Costos', level: 2, description: 'Costo directo de los bienes y productos vendidos' },
  { code: '6101', name: 'Gastos de Administración (Sueldos, Alquileres y Servicios)', category: 'Gastos', level: 2, description: 'Erogaciones operativas del área administrativa' },
  { code: '6102', name: 'Gastos de Venta y Distribución (Comisiones y Publicidad)', category: 'Gastos', level: 2, description: 'Gastos asociados a la comercialización y despacho' },
  { code: '6103', name: 'Gastos Financieros y Comisiones Bancarias', category: 'Gastos', level: 2, description: 'Intereses, transferencias y comisiones de tarjetas' }
];

const defaultNextCorrelatives: NextCorrelatives = {
  salesCCF: 1003,
  salesCF: 503,
  salesEXP: 101,
  salesNC: 51,
  purchases: 2004,
  journalEntries: 3
};

const defaultData: AppState = {
  companyInfo: defaultCompanyInfo,
  currencyConfig: DEFAULT_CURRENCY_CONFIG,
  products: defaultProducts,
  inventoryMovements: defaultInventoryMovements,
  clients: defaultClients,
  suppliers: defaultSuppliers,
  salesRecords: defaultSales,
  purchaseRecords: defaultPurchases,
  paymentRecords: defaultPayments,
  journalEntries: defaultJournalEntries,
  chartOfAccounts: defaultChartOfAccounts,
  nextCorrelatives: defaultNextCorrelatives
};

// Global Store State
let appData: AppState = loadData();
const listeners: Array<(state: AppState) => void> = [];

export function subscribe(listener: () => void): () => void {
  const handler = () => listener();
  listeners.push(handler);
  return () => {
    const idx = listeners.indexOf(handler);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export function subscribeToDataStore(listener: (state: AppState) => void): () => void {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

export const getAppData = getAppState;

function notify(): void {
  const fresh = getAppState();
  for (const listener of listeners) {
    listener(fresh);
  }
}

export function loadData(): AppState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        companyInfo: { ...defaultData.companyInfo, ...(parsed.companyInfo || {}) },
        currencyConfig: { ...defaultData.currencyConfig, ...(parsed.currencyConfig || {}) },
        products: Array.isArray(parsed.products) && parsed.products.length > 0 ? parsed.products : defaultData.products,
        inventoryMovements: Array.isArray(parsed.inventoryMovements) && parsed.inventoryMovements.length > 0 ? parsed.inventoryMovements : defaultData.inventoryMovements,
        clients: Array.isArray(parsed.clients) && parsed.clients.length > 0 ? parsed.clients : defaultData.clients,
        suppliers: Array.isArray(parsed.suppliers) && parsed.suppliers.length > 0 ? parsed.suppliers : defaultData.suppliers,
        salesRecords: Array.isArray(parsed.salesRecords) && parsed.salesRecords.length > 0 ? parsed.salesRecords : defaultData.salesRecords,
        purchaseRecords: Array.isArray(parsed.purchaseRecords) && parsed.purchaseRecords.length > 0 ? parsed.purchaseRecords : defaultData.purchaseRecords,
        paymentRecords: Array.isArray(parsed.paymentRecords) && parsed.paymentRecords.length > 0 ? parsed.paymentRecords : defaultData.paymentRecords,
        journalEntries: Array.isArray(parsed.journalEntries) && parsed.journalEntries.length > 0 ? parsed.journalEntries : defaultData.journalEntries,
        chartOfAccounts: Array.isArray(parsed.chartOfAccounts) && parsed.chartOfAccounts.length > 0 ? parsed.chartOfAccounts : defaultData.chartOfAccounts,
        nextCorrelatives: { ...defaultData.nextCorrelatives, ...(parsed.nextCorrelatives || {}) }
      };
    }
  } catch (e) {
    console.error('Error loading data from localStorage', e);
  }
  return JSON.parse(JSON.stringify(defaultData));
}

export function saveData(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
    notify();
  } catch (e) {
    console.error('Error saving data to localStorage', e);
  }
}

export function resetData(): void {
  appData = JSON.parse(JSON.stringify(defaultData));
  saveData();
}

export function clearAllData(): void {
  appData = {
    companyInfo: { ...defaultCompanyInfo },
    currencyConfig: { ...DEFAULT_CURRENCY_CONFIG },
    products: [],
    inventoryMovements: [],
    clients: [],
    suppliers: [],
    salesRecords: [],
    purchaseRecords: [],
    paymentRecords: [],
    journalEntries: [],
    chartOfAccounts: [...defaultChartOfAccounts],
    nextCorrelatives: { salesCCF: 1, salesCF: 1, salesEXP: 1, salesNC: 1, purchases: 1, journalEntries: 1 }
  };
  saveData();
}

export function getAppState(): AppState {
  return {
    companyInfo: { ...appData.companyInfo },
    currencyConfig: { ...appData.currencyConfig },
    products: [...(appData.products || [])],
    inventoryMovements: [...(appData.inventoryMovements || [])],
    clients: [...(appData.clients || [])],
    suppliers: [...(appData.suppliers || [])],
    salesRecords: [...(appData.salesRecords || [])],
    purchaseRecords: [...(appData.purchaseRecords || [])],
    paymentRecords: [...(appData.paymentRecords || [])],
    journalEntries: [...(appData.journalEntries || [])],
    chartOfAccounts: [...(appData.chartOfAccounts || defaultChartOfAccounts)],
    nextCorrelatives: { ...appData.nextCorrelatives }
  };
}

export function getCompanyInfo(): CompanyInfo {
  return appData.companyInfo;
}

export function updateCompanyInfo(info: Partial<CompanyInfo>): CompanyInfo {
  appData.companyInfo = { ...appData.companyInfo, ...info };
  saveData();
  return appData.companyInfo;
}

// Currency Config operations
export function getCurrencyConfig(): CurrencyConfig {
  return appData.currencyConfig || DEFAULT_CURRENCY_CONFIG;
}

export function updateCurrencyConfig(config: Partial<CurrencyConfig>): CurrencyConfig {
  appData.currencyConfig = { ...appData.currencyConfig, ...config };
  saveData();
  return appData.currencyConfig;
}

// Products & Inventory operations
export function getProducts(): Product[] {
  return appData.products || [];
}

export function addProduct(productData: Omit<Product, 'id' | 'createdAt'>): Product {
  const newProduct: Product = {
    ...productData,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  if (!appData.products) appData.products = [];
  appData.products.push(newProduct);
  
  // Register initial movement if stock > 0
  if (newProduct.stock > 0) {
    addInventoryMovement({
      date: new Date().toISOString().split('T')[0],
      productId: newProduct.id,
      productName: newProduct.name,
      type: 'Entrada',
      reason: 'Ajuste Inicial',
      qty: newProduct.stock,
      unitCost: newProduct.cost,
      totalCost: newProduct.stock * newProduct.cost,
      notes: 'Inventario inicial de creación de producto'
    });
  }

  saveData();
  return newProduct;
}

export function updateProduct(id: string, productData: Partial<Product>): Product {
  const index = appData.products.findIndex(p => p.id === id);
  if (index === -1) throw new Error('Producto no encontrado');
  appData.products[index] = { ...appData.products[index], ...productData };
  appData.products = [...appData.products];
  saveData();
  return appData.products[index];
}

export function deleteProduct(id: string): boolean {
  const initialLen = appData.products.length;
  appData.products = appData.products.filter(p => p.id !== id);
  if (appData.products.length < initialLen) {
    saveData();
    return true;
  }
  return false;
}

export function adjustProductStock(productId: string, qty: number, type: 'Entrada' | 'Salida' | 'Ajuste', reason: InventoryMovement['reason'], notes?: string): void {
  const product = appData.products.find(p => p.id === productId);
  if (!product) return;

  if (type === 'Entrada') {
    product.stock += qty;
  } else if (type === 'Salida') {
    product.stock = Math.max(0, product.stock - qty);
  } else {
    product.stock = Math.max(0, qty);
  }

  appData.products = [...appData.products];

  addInventoryMovement({
    date: new Date().toISOString().split('T')[0],
    productId: product.id,
    productName: product.name,
    type,
    reason,
    qty,
    unitCost: product.cost,
    totalCost: qty * product.cost,
    notes
  });

  saveData();
}

export function getInventoryMovements(): InventoryMovement[] {
  return appData.inventoryMovements || [];
}

export function addInventoryMovement(movData: Omit<InventoryMovement, 'id' | 'createdAt'>): InventoryMovement {
  const newMov: InventoryMovement = {
    ...movData,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  if (!appData.inventoryMovements) appData.inventoryMovements = [];
  appData.inventoryMovements = [newMov, ...appData.inventoryMovements];
  saveData();
  return newMov;
}

// Correlatives operations
export function getNextCorrelatives(): NextCorrelatives {
  return appData.nextCorrelatives;
}

export function updateNextCorrelatives(correlatives: Partial<NextCorrelatives>): void {
  appData.nextCorrelatives = { ...appData.nextCorrelatives, ...correlatives };
  saveData();
}

// Entity operations
export function getClients(): Client[] {
  return appData.clients;
}

export function addClient(clientData: Omit<Client, 'id' | 'createdAt'>): Client {
  const newClient: Client = {
    ...clientData,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  appData.clients = [...appData.clients, newClient];
  saveData();
  return newClient;
}

export function updateClient(id: string, clientData: Partial<Client>): Client {
  const index = appData.clients.findIndex(c => c.id === id);
  if (index === -1) throw new Error('Cliente no encontrado');
  appData.clients[index] = { ...appData.clients[index], ...clientData };
  appData.clients = [...appData.clients];
  saveData();
  return appData.clients[index];
}

export function deleteClient(id: string): boolean {
  const len = appData.clients.length;
  appData.clients = appData.clients.filter(c => c.id !== id);
  if (appData.clients.length < len) {
    saveData();
    return true;
  }
  return false;
}

export function getSuppliers(): Supplier[] {
  return appData.suppliers;
}

export function addSupplier(supplierData: Omit<Supplier, 'id' | 'createdAt'>): Supplier {
  const newSupplier: Supplier = {
    ...supplierData,
    id: generateId(),
    createdAt: new Date().toISOString()
  };
  appData.suppliers = [...appData.suppliers, newSupplier];
  saveData();
  return newSupplier;
}

export function updateSupplier(id: string, supplierData: Partial<Supplier>): Supplier {
  const index = appData.suppliers.findIndex(s => s.id === id);
  if (index === -1) throw new Error('Proveedor no encontrado');
  appData.suppliers[index] = { ...appData.suppliers[index], ...supplierData };
  appData.suppliers = [...appData.suppliers];
  saveData();
  return appData.suppliers[index];
}

export function deleteSupplier(id: string): boolean {
  const len = appData.suppliers.length;
  appData.suppliers = appData.suppliers.filter(s => s.id !== id);
  if (appData.suppliers.length < len) {
    saveData();
    return true;
  }
  return false;
}

// Sales operations
export function calculateVat(base: number): number {
  const b = parseFloat(base as unknown as string) || 0;
  return Math.round(b * VAT_RATE * 100) / 100;
}

export function getSales(): SaleRecord[] {
  return appData.salesRecords;
}

export function addSale(saleData: Partial<SaleRecord>): SaleRecord {
  const docType = saleData.documentType || 'CCF';
  let correlative = saleData.correlative;
  if (!correlative) {
    if (docType === 'CCF') {
      correlative = appData.nextCorrelatives.salesCCF++;
    } else if (docType === 'CF') {
      correlative = appData.nextCorrelatives.salesCF++;
    } else if (docType === 'EXP') {
      correlative = appData.nextCorrelatives.salesEXP++;
    } else {
      correlative = appData.nextCorrelatives.salesNC++;
    }
  }

  const items: SalesItem[] = Array.isArray(saleData.items) ? saleData.items : [];
  let taxable = parseFloat(saleData.taxableAmount as unknown as string) || 0;
  let exempt = parseFloat(saleData.exemptAmount as unknown as string) || 0;
  let noSujeta = parseFloat(saleData.noSujetaAmount as unknown as string) || 0;
  let ivaDebit = parseFloat(saleData.ivaDebit as unknown as string) || 0;
  let total = parseFloat(saleData.total as unknown as string) || 0;
  let ivaRetenido = parseFloat(saleData.ivaRetenido as unknown as string) || 0;
  let ivaPercibido = parseFloat(saleData.ivaPercibido as unknown as string) || 0;

  if (items.length > 0) {
    taxable = items.filter(it => it.type === 'gravada').reduce((s, it) => s + (it.qty * it.price), 0);
    exempt = items.filter(it => it.type === 'exenta').reduce((s, it) => s + (it.qty * it.price), 0);
    noSujeta = items.filter(it => it.type === 'noSujeta').reduce((s, it) => s + (it.qty * it.price), 0);
  }

  if (docType === 'CCF') {
    if (ivaDebit === 0 && taxable > 0) ivaDebit = calculateVat(taxable);
    if (total === 0) total = Math.round((taxable + exempt + noSujeta + ivaDebit - ivaRetenido + ivaPercibido) * 100) / 100;
  } else if (docType === 'CF') {
    if (total > 0 && taxable === 0) {
      taxable = Math.round((total / (1 + VAT_RATE)) * 100) / 100;
      ivaDebit = Math.round((total - taxable) * 100) / 100;
    } else if (total === 0) {
      ivaDebit = calculateVat(taxable);
      total = Math.round((taxable + exempt + noSujeta + ivaDebit) * 100) / 100;
    }
  }

  const paymentMethod = saleData.paymentMethod || 'Contado';
  const newSale: SaleRecord = {
    id: saleData.id || generateId(),
    correlative,
    dteCode: saleData.dteCode || `DTE-${docType === 'CCF' ? '03' : '01'}-${correlative}`,
    date: saleData.date || new Date().toISOString().substring(0, 10),
    documentType: docType,
    clientNrc: saleData.clientNrc || '',
    clientId: saleData.clientId,
    clientName: saleData.clientName || 'Cliente General',
    clientNit: saleData.clientNit,
    clientDui: saleData.clientDui,
    clientAddress: saleData.clientAddress,
    clientActivity: saleData.clientActivity,
    description: saleData.description || 'Venta de productos/servicios',
    items,
    taxableAmount: Math.round(taxable * 100) / 100,
    exemptAmount: Math.round(exempt * 100) / 100,
    noSujetaAmount: Math.round(noSujeta * 100) / 100,
    ivaDebit: Math.round(ivaDebit * 100) / 100,
    ivaRetenido: Math.round(ivaRetenido * 100) / 100,
    ivaPercibido: Math.round(ivaPercibido * 100) / 100,
    total: Math.round(total * 100) / 100,
    paymentMethod,
    paymentDays: saleData.paymentDays,
    dueDate: saleData.dueDate,
    paidAmount: paymentMethod === 'Contado' || paymentMethod === 'Tarjeta' ? total : (saleData.paidAmount || 0),
    status: saleData.status || 'Emitida',
    notes: saleData.notes,
    createdAt: new Date().toISOString()
  };

  // Update correlative store
  if (newSale.documentType === 'CCF') {
    appData.nextCorrelatives.salesCCF = Math.max(appData.nextCorrelatives.salesCCF, newSale.correlative + 1);
  } else if (newSale.documentType === 'CF') {
    appData.nextCorrelatives.salesCF = Math.max(appData.nextCorrelatives.salesCF, newSale.correlative + 1);
  } else if (newSale.documentType === 'EXP') {
    appData.nextCorrelatives.salesEXP = Math.max(appData.nextCorrelatives.salesEXP, newSale.correlative + 1);
  } else if (newSale.documentType === 'NC') {
    appData.nextCorrelatives.salesNC = Math.max(appData.nextCorrelatives.salesNC, newSale.correlative + 1);
  }

  // Deduct inventory stock if items link to products
  if (newSale.items && newSale.items.length > 0) {
    newSale.items.forEach(item => {
      if (item.productId) {
        const prod = appData.products.find(p => p.id === item.productId);
        if (prod) {
          prod.stock = Math.max(0, prod.stock - item.qty);
          addInventoryMovement({
            date: newSale.date,
            productId: prod.id,
            productName: prod.name,
            type: 'Salida',
            reason: 'Venta',
            qty: item.qty,
            unitCost: prod.cost,
            totalCost: item.qty * prod.cost,
            referenceDoc: `${newSale.documentType} #${newSale.correlative}`,
            notes: `Venta a ${newSale.clientName || 'Consumidor Final'}`
          });
        }
      }
    });
  }

  appData.salesRecords.unshift(newSale);
  saveData();
  return newSale;
}

export function updateSale(id: string, saleData: Partial<SaleRecord>): SaleRecord {
  const index = appData.salesRecords.findIndex(s => s.id === id);
  if (index === -1) throw new Error('Venta no encontrada');
  
  const existing = appData.salesRecords[index];
  const merged: SaleRecord = { ...existing, ...saleData };

  // Recalculate VAT & Total if items updated
  if (saleData.items && saleData.items.length > 0) {
    const items = saleData.items;
    const taxable = items.filter(it => it.type === 'gravada').reduce((s, it) => s + (it.qty * it.price), 0);
    const exempt = items.filter(it => it.type === 'exenta').reduce((s, it) => s + (it.qty * it.price), 0);
    const noSujeta = items.filter(it => it.type === 'noSujeta').reduce((s, it) => s + (it.qty * it.price), 0);

    if (merged.documentType === 'CCF') {
      merged.taxableAmount = Math.round(taxable * 100) / 100;
      merged.exemptAmount = Math.round(exempt * 100) / 100;
      merged.noSujetaAmount = Math.round(noSujeta * 100) / 100;
      if (saleData.ivaDebit === undefined) {
        merged.ivaDebit = calculateVat(merged.taxableAmount);
      }
      if (saleData.total === undefined) {
        merged.total = Math.round((merged.taxableAmount + merged.exemptAmount + merged.noSujetaAmount + merged.ivaDebit - (merged.ivaRetenido || 0) + (merged.ivaPercibido || 0)) * 100) / 100;
      }
    }
  }

  if (merged.paymentMethod === 'Contado' || merged.paymentMethod === 'Tarjeta') {
    merged.paidAmount = merged.total;
  }

  appData.salesRecords[index] = merged;
  appData.salesRecords = [...appData.salesRecords];
  saveData();
  return merged;
}

export function cancelSale(id: string): SaleRecord {
  const index = appData.salesRecords.findIndex(s => s.id === id);
  if (index === -1) throw new Error('Venta no encontrada');
  appData.salesRecords[index] = { ...appData.salesRecords[index], status: 'Anulada' };
  appData.salesRecords = [...appData.salesRecords];
  saveData();
  return appData.salesRecords[index];
}

export function deleteSale(id: string): boolean {
  const len = appData.salesRecords.length;
  appData.salesRecords = appData.salesRecords.filter(s => s.id !== id);
  if (appData.salesRecords.length < len) {
    saveData();
    return true;
  }
  return false;
}

// Purchases operations
export function getPurchases(): PurchaseRecord[] {
  return appData.purchaseRecords;
}

export function addPurchase(purchaseData: Partial<PurchaseRecord>): PurchaseRecord {
  const correlative = purchaseData.correlative || appData.nextCorrelatives.purchases++;
  const taxable = parseFloat(purchaseData.taxableAmount as unknown as string) || 0;
  const importTaxable = parseFloat(purchaseData.importTaxableAmount as unknown as string) || 0;
  const exempt = parseFloat(purchaseData.exemptAmount as unknown as string) || 0;
  const importExempt = parseFloat(purchaseData.importExemptAmount as unknown as string) || 0;
  const noSujeta = parseFloat(purchaseData.noSujetaAmount as unknown as string) || 0;

  let ivaCredit = parseFloat(purchaseData.ivaCredit as unknown as string);
  if (isNaN(ivaCredit) || ivaCredit === 0) {
    ivaCredit = calculateVat(taxable + importTaxable);
  }

  const ivaWithheld = parseFloat(purchaseData.ivaWithheld as unknown as string) || 0;
  const ivaPerceived = parseFloat(purchaseData.ivaPerceived as unknown as string) || 0;
  const total = purchaseData.total || Math.round((taxable + importTaxable + exempt + importExempt + noSujeta + ivaCredit - ivaWithheld + ivaPerceived) * 100) / 100;
  const paymentMethod = purchaseData.paymentMethod || 'Contado';

  const newPurchase: PurchaseRecord = {
    id: purchaseData.id || generateId(),
    correlative,
    date: purchaseData.date || new Date().toISOString().substring(0, 10),
    documentType: purchaseData.documentType || 'CCF',
    supplierNrc: purchaseData.supplierNrc || '',
    supplierId: purchaseData.supplierId,
    supplierName: purchaseData.supplierName || 'Proveedor General',
    supplierNit: purchaseData.supplierNit,
    supplierEmail: purchaseData.supplierEmail,
    documentNumber: purchaseData.documentNumber || `DOC-${correlative}`,
    description: purchaseData.description || 'Compra de mercadería/insumos',
    taxableAmount: Math.round(taxable * 100) / 100,
    importTaxableAmount: Math.round(importTaxable * 100) / 100,
    exemptAmount: Math.round(exempt * 100) / 100,
    importExemptAmount: Math.round(importExempt * 100) / 100,
    noSujetaAmount: Math.round(noSujeta * 100) / 100,
    ivaCredit: Math.round(ivaCredit * 100) / 100,
    ivaWithheld: Math.round(ivaWithheld * 100) / 100,
    ivaPerceived: Math.round(ivaPerceived * 100) / 100,
    total: Math.round(total * 100) / 100,
    paymentMethod,
    dueDate: purchaseData.dueDate,
    paidAmount: paymentMethod === 'Contado' ? total : (purchaseData.paidAmount || 0),
    status: purchaseData.status || 'Registrada',
    notes: purchaseData.notes,
    createdAt: new Date().toISOString()
  };

  appData.nextCorrelatives.purchases = Math.max(appData.nextCorrelatives.purchases, newPurchase.correlative + 1);
  appData.purchaseRecords = [newPurchase, ...appData.purchaseRecords];
  saveData();
  return newPurchase;
}

export function updatePurchase(id: string, purchaseData: Partial<PurchaseRecord>): PurchaseRecord {
  const index = appData.purchaseRecords.findIndex(p => p.id === id);
  if (index === -1) throw new Error('Compra no encontrada');
  
  const existing = appData.purchaseRecords[index];
  const merged: PurchaseRecord = { ...existing, ...purchaseData };

  if (purchaseData.total === undefined) {
    const taxable = merged.taxableAmount || 0;
    const importTaxable = merged.importTaxableAmount || 0;
    const exempt = merged.exemptAmount || 0;
    const importExempt = merged.importExemptAmount || 0;
    const noSujeta = merged.noSujetaAmount || 0;
    const ivaCredit = merged.ivaCredit || 0;
    const ivaWithheld = merged.ivaWithheld || 0;
    const ivaPerceived = merged.ivaPerceived || 0;
    merged.total = Math.round((taxable + importTaxable + exempt + importExempt + noSujeta + ivaCredit - ivaWithheld + ivaPerceived) * 100) / 100;
  }

  if (merged.paymentMethod === 'Contado') {
    merged.paidAmount = merged.total;
  }

  appData.purchaseRecords[index] = merged;
  appData.purchaseRecords = [...appData.purchaseRecords];
  saveData();
  return merged;
}

export function cancelPurchase(id: string): PurchaseRecord {
  const index = appData.purchaseRecords.findIndex(p => p.id === id);
  if (index === -1) throw new Error('Compra no encontrada');
  appData.purchaseRecords[index] = { ...appData.purchaseRecords[index], status: 'Anulada' };
  appData.purchaseRecords = [...appData.purchaseRecords];
  saveData();
  return appData.purchaseRecords[index];
}

export function deletePurchase(id: string): boolean {
  const len = appData.purchaseRecords.length;
  appData.purchaseRecords = appData.purchaseRecords.filter(p => p.id !== id);
  if (appData.purchaseRecords.length < len) {
    saveData();
    return true;
  }
  return false;
}

// Payment operations (CxC / CxP)
export function getPayments(): PaymentRecord[] {
  return appData.paymentRecords || [];
}

export function addPayment(paymentData: Omit<PaymentRecord, 'id' | 'createdAt'>): PaymentRecord {
  const newPayment: PaymentRecord = {
    ...paymentData,
    id: generateId(),
    createdAt: new Date().toISOString()
  };

  if (!appData.paymentRecords) appData.paymentRecords = [];
  appData.paymentRecords.unshift(newPayment);

  // Update sale or purchase paid amount
  if (newPayment.type === 'Cobro_Cliente') {
    const sale = appData.salesRecords.find(s => s.id === newPayment.referenceId);
    if (sale) {
      sale.paidAmount = (sale.paidAmount || 0) + newPayment.amount;
    }
  } else if (newPayment.type === 'Pago_Proveedor') {
    const pur = appData.purchaseRecords.find(p => p.id === newPayment.referenceId);
    if (pur) {
      pur.paidAmount = (pur.paidAmount || 0) + newPayment.amount;
    }
  }

  saveData();
  return newPayment;
}

export function deletePayment(id: string): boolean {
  const payment = appData.paymentRecords.find(p => p.id === id);
  if (!payment) return false;

  // Reverse paidAmount
  if (payment.type === 'Cobro_Cliente') {
    const sale = appData.salesRecords.find(s => s.id === payment.referenceId);
    if (sale) {
      sale.paidAmount = Math.max(0, (sale.paidAmount || 0) - payment.amount);
    }
  } else if (payment.type === 'Pago_Proveedor') {
    const pur = appData.purchaseRecords.find(p => p.id === payment.referenceId);
    if (pur) {
      pur.paidAmount = Math.max(0, (pur.paidAmount || 0) - payment.amount);
    }
  }

  appData.paymentRecords = appData.paymentRecords.filter(p => p.id !== id);
  saveData();
  return true;
}

// Chart of Accounts (Catálogo de Cuentas) operations
export function getChartOfAccounts(): ChartAccount[] {
  if (!appData.chartOfAccounts || appData.chartOfAccounts.length === 0) {
    appData.chartOfAccounts = [...defaultChartOfAccounts];
  }
  return appData.chartOfAccounts;
}

export const CHART_OF_ACCOUNTS = defaultChartOfAccounts;

export function addChartAccount(account: ChartAccount): ChartAccount {
  if (!appData.chartOfAccounts) {
    appData.chartOfAccounts = [...defaultChartOfAccounts];
  }
  const cleanCode = account.code.trim();
  if (appData.chartOfAccounts.some(a => a.code === cleanCode)) {
    throw new Error(`Ya existe una cuenta contable con el código ${cleanCode}`);
  }
  const newAccount: ChartAccount = {
    ...account,
    code: cleanCode,
    name: account.name.trim()
  };
  appData.chartOfAccounts.push(newAccount);
  // Sort accounts by code
  appData.chartOfAccounts.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  saveData();
  return newAccount;
}

export function updateChartAccount(code: string, updated: Partial<ChartAccount>): ChartAccount {
  if (!appData.chartOfAccounts) {
    appData.chartOfAccounts = [...defaultChartOfAccounts];
  }
  const index = appData.chartOfAccounts.findIndex(a => a.code === code);
  if (index === -1) {
    throw new Error(`Cuenta contable con código ${code} no encontrada`);
  }
  appData.chartOfAccounts[index] = {
    ...appData.chartOfAccounts[index],
    ...updated,
    code: updated.code ? updated.code.trim() : appData.chartOfAccounts[index].code,
    name: updated.name ? updated.name.trim() : appData.chartOfAccounts[index].name
  };
  appData.chartOfAccounts.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  saveData();
  return appData.chartOfAccounts[index];
}

export function deleteChartAccount(code: string): boolean {
  if (!appData.chartOfAccounts) return false;
  // Check if any journal entry uses this account code
  const isUsedInJournal = (appData.journalEntries || []).some(entry => 
    entry.lines.some(l => l.accountCode === code)
  );
  if (isUsedInJournal) {
    throw new Error(`No se puede eliminar la cuenta ${code} porque tiene movimientos registrados en partidas contables.`);
  }
  const initial = appData.chartOfAccounts.length;
  appData.chartOfAccounts = appData.chartOfAccounts.filter(a => a.code !== code);
  if (appData.chartOfAccounts.length < initial) {
    saveData();
    return true;
  }
  return false;
}

export function setChartOfAccounts(accounts: ChartAccount[]): void {
  if (!Array.isArray(accounts) || accounts.length === 0) {
    throw new Error('El listado de cuentas a importar está vacío o no es válido');
  }
  // Validate accounts
  const validAccounts: ChartAccount[] = [];
  const seenCodes = new Set<string>();

  for (const acc of accounts) {
    if (!acc.code || !acc.name || !acc.category) continue;
    const cleanCode = String(acc.code).trim();
    if (seenCodes.has(cleanCode)) continue;
    seenCodes.add(cleanCode);

    validAccounts.push({
      code: cleanCode,
      name: String(acc.name).trim(),
      category: acc.category,
      level: acc.level || (cleanCode.length <= 2 ? 1 : cleanCode.length <= 4 ? 2 : cleanCode.length <= 6 ? 3 : 4),
      description: acc.description ? String(acc.description).trim() : undefined
    });
  }

  if (validAccounts.length === 0) {
    throw new Error('No se encontraron cuentas válidas para importar. Verifique el formato del archivo.');
  }

  validAccounts.sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  appData.chartOfAccounts = validAccounts;
  saveData();
}

export function resetChartOfAccounts(): void {
  appData.chartOfAccounts = [...defaultChartOfAccounts];
  saveData();
}

// Journal Entry operations
export function getJournalEntries(): JournalEntry[] {
  return appData.journalEntries || [];
}

export function addJournalEntry(entryData: Omit<JournalEntry, 'id' | 'createdAt' | 'entryNumber'> & { entryNumber?: number }): JournalEntry {
  const nextNum = entryData.entryNumber || appData.nextCorrelatives.journalEntries || ((appData.journalEntries?.length || 0) + 1);
  const newEntry: JournalEntry = {
    ...entryData,
    id: generateId(),
    entryNumber: nextNum,
    createdAt: new Date().toISOString()
  };

  if (!appData.journalEntries) appData.journalEntries = [];
  appData.journalEntries.unshift(newEntry);
  appData.nextCorrelatives.journalEntries = Math.max(appData.nextCorrelatives.journalEntries || 1, newEntry.entryNumber + 1);

  saveData();
  return newEntry;
}

export function updateJournalEntry(id: string, entryData: Partial<JournalEntry>): JournalEntry {
  const index = appData.journalEntries.findIndex(j => j.id === id);
  if (index === -1) throw new Error('Partida contable no encontrada');
  appData.journalEntries[index] = { ...appData.journalEntries[index], ...entryData };
  appData.journalEntries = [...appData.journalEntries];
  saveData();
  return appData.journalEntries[index];
}

export function deleteJournalEntry(id: string): boolean {
  const initial = appData.journalEntries.length;
  appData.journalEntries = appData.journalEntries.filter(j => j.id !== id);
  if (appData.journalEntries.length < initial) {
    saveData();
    return true;
  }
  return false;
}

/**
 * Generate monthly batch journal entries for sales, purchases, and cost of sales
 */
export function generateMonthlyJournalEntries(params: {
  month: number;
  year: number;
  includeSales?: boolean;
  includePurchases?: boolean;
  includeCostOfSales?: boolean;
  overrideExisting?: boolean;
}): { createdCount: number; createdEntries: JournalEntry[]; details: string[] } {
  const { month, year, includeSales = true, includePurchases = true, includeCostOfSales = true, overrideExisting = false } = params;
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const monthName = monthNames[month - 1] || `Mes ${month}`;
  
  // Calculate last day of the month
  const lastDay = new Date(year, month, 0).getDate();
  const entryDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
  
  const createdEntries: JournalEntry[] = [];
  const details: string[] = [];

  if (!appData.journalEntries) appData.journalEntries = [];

  // Filter sales for the period
  const periodSales = (appData.salesRecords || []).filter(s => {
    if (s.status === 'Anulada') return false;
    const parts = String(s.date).split('T')[0].split('-');
    if (parts.length >= 2) {
      const sY = parseInt(parts[0], 10);
      const sM = parseInt(parts[1], 10);
      return sY === year && sM === month;
    }
    return false;
  });

  // Filter purchases for the period
  const periodPurchases = (appData.purchaseRecords || []).filter(p => {
    if (p.status === 'Anulada') return false;
    const parts = String(p.date).split('T')[0].split('-');
    if (parts.length >= 2) {
      const pY = parseInt(parts[0], 10);
      const pM = parseInt(parts[1], 10);
      return pY === year && pM === month;
    }
    return false;
  });

  // If overrideExisting is true, remove previous automated entries for this period
  if (overrideExisting) {
    const refKeywords = [`Ventas ${monthName} ${year}`, `Compras ${monthName} ${year}`, `Costo de Ventas ${monthName} ${year}`];
    const initialCount = appData.journalEntries.length;
    appData.journalEntries = appData.journalEntries.filter(entry => {
      return !refKeywords.some(keyword => entry.referenceDoc?.includes(keyword) || entry.concept?.includes(keyword));
    });
    if (appData.journalEntries.length < initialCount) {
      details.push(`Se reemplazaron ${initialCount - appData.journalEntries.length} partidas previas de ${monthName} ${year}.`);
    }
  }

  // 1. GENERATE SALES ENTRY
  if (includeSales && periodSales.length > 0) {
    const totalTaxable = periodSales.reduce((sum, s) => sum + (s.taxableAmount || 0), 0);
    const totalExempt = periodSales.reduce((sum, s) => sum + (s.exemptAmount || 0) + (s.noSujetaAmount || 0), 0);
    const totalIvaDebit = periodSales.reduce((sum, s) => sum + (s.ivaDebit || 0), 0);
    const totalIvaRet = periodSales.reduce((sum, s) => sum + (s.ivaRetenido || 0), 0);
    const totalIvaPerc = periodSales.reduce((sum, s) => sum + (s.ivaPercibido || 0), 0);

    const creditSales = periodSales.filter(s => s.paymentMethod === 'Crédito');
    const cashSales = periodSales.filter(s => s.paymentMethod !== 'Crédito');

    const totalCreditAmount = creditSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const totalCashAmount = cashSales.reduce((sum, s) => sum + (s.total || 0), 0);

    const lines: JournalEntry['lines'] = [];

    // Debits (Cuentas de Activo)
    if (totalCashAmount > 0) {
      lines.push({
        accountCode: '1101',
        accountName: 'Efectivo y Equivalentes (Caja General y Bancos)',
        debit: Number(totalCashAmount.toFixed(2)),
        credit: 0
      });
    }
    if (totalCreditAmount > 0) {
      lines.push({
        accountCode: '1103',
        accountName: 'Cuentas por Cobrar Clientes (CxC Comerciales)',
        debit: Number(totalCreditAmount.toFixed(2)),
        credit: 0
      });
    }
    if (totalIvaRet > 0) {
      lines.push({
        accountCode: '1106',
        accountName: 'IVA Retenido a Favor (1% Retenciones Recibidas)',
        debit: Number(totalIvaRet.toFixed(2)),
        credit: 0
      });
    }

    // Credits (Cuentas de Ingresos y Pasivos)
    if (totalTaxable > 0) {
      lines.push({
        accountCode: '4101',
        accountName: 'Ingresos por Ventas Gravadas (Mercaderías Locales)',
        debit: 0,
        credit: Number(totalTaxable.toFixed(2))
      });
    }
    if (totalExempt > 0) {
      lines.push({
        accountCode: '4102',
        accountName: 'Ingresos por Ventas Exentas y No Sujetas',
        debit: 0,
        credit: Number(totalExempt.toFixed(2))
      });
    }
    if (totalIvaDebit > 0) {
      lines.push({
        accountCode: '2102',
        accountName: 'IVA Débito Fiscal por Pagar (13% en Ventas)',
        debit: 0,
        credit: Number(totalIvaDebit.toFixed(2))
      });
    }
    if (totalIvaPerc > 0) {
      lines.push({
        accountCode: '2102',
        accountName: 'IVA Percibido por Pagar a MH',
        debit: 0,
        credit: Number(totalIvaPerc.toFixed(2))
      });
    }

    const totalDebit = Number(lines.reduce((s, l) => s + l.debit, 0).toFixed(2));
    const totalCredit = Number(lines.reduce((s, l) => s + l.credit, 0).toFixed(2));

    // Fix small cent rounding difference if any
    const diff = Number((totalDebit - totalCredit).toFixed(2));
    if (Math.abs(diff) > 0 && lines.length > 0) {
      if (diff > 0) {
        // Debit is higher, adjust credit on sales
        const target = lines.find(l => l.accountCode === '4101') || lines[lines.length - 1];
        target.credit = Number((target.credit + diff).toFixed(2));
      } else {
        // Credit is higher, adjust debit on cash
        const target = lines.find(l => l.accountCode === '1101' || l.accountCode === '1103') || lines[0];
        target.debit = Number((target.debit + Math.abs(diff)).toFixed(2));
      }
    }

    const calculatedDebit = Number(lines.reduce((s, l) => s + l.debit, 0).toFixed(2));
    const calculatedCredit = Number(lines.reduce((s, l) => s + l.credit, 0).toFixed(2));

    const salesEntry = addJournalEntry({
      date: entryDate,
      concept: `Centralización mensual de facturación y ventas emitidas (${periodSales.length} documentos), registro de IVA Débito Fiscal 13% y retenciones de clientes del período ${monthName} ${year}.`,
      sourceType: 'Venta',
      referenceDoc: `Ventas ${monthName} ${year}`,
      lines,
      totalDebit: calculatedDebit,
      totalCredit: calculatedCredit
    });

    createdEntries.push(salesEntry);
    details.push(`Partida #${salesEntry.entryNumber} de Ventas generada (${periodSales.length} facturas, Total $${calculatedDebit.toFixed(2)}).`);
  } else if (includeSales) {
    details.push(`No se encontraron ventas registradas en ${monthName} ${year}.`);
  }

  // 2. GENERATE PURCHASES ENTRY
  if (includePurchases && periodPurchases.length > 0) {
    const totalTaxable = periodPurchases.reduce((sum, p) => sum + (p.taxableAmount || 0) + (p.importTaxableAmount || 0), 0);
    const totalExempt = periodPurchases.reduce((sum, p) => sum + (p.exemptAmount || 0) + (p.importExemptAmount || 0) + (p.noSujetaAmount || 0), 0);
    const totalIvaCredit = periodPurchases.reduce((sum, p) => sum + (p.ivaCredit || 0), 0);
    const totalIvaWithheld = periodPurchases.reduce((sum, p) => sum + (p.ivaWithheld || 0), 0);
    const totalIvaPerceived = periodPurchases.reduce((sum, p) => sum + (p.ivaPerceived || 0), 0);

    const creditPurchases = periodPurchases.filter(p => p.paymentMethod === 'Crédito');
    const cashPurchases = periodPurchases.filter(p => p.paymentMethod !== 'Crédito');

    const totalCreditAmount = creditPurchases.reduce((sum, p) => sum + (p.total || 0), 0);
    const totalCashAmount = cashPurchases.reduce((sum, p) => sum + (p.total || 0), 0);

    const lines: JournalEntry['lines'] = [];

    // Debits (Costos, Gastos e Impuestos Recuperables)
    if (totalTaxable > 0) {
      lines.push({
        accountCode: '5101',
        accountName: 'Costo de Ventas y Compras de Mercaderías',
        debit: Number(totalTaxable.toFixed(2)),
        credit: 0
      });
    }
    if (totalExempt > 0) {
      lines.push({
        accountCode: '5101',
        accountName: 'Compras Exentas de Mercaderías / Insumos',
        debit: Number(totalExempt.toFixed(2)),
        credit: 0
      });
    }
    if (totalIvaCredit > 0) {
      lines.push({
        accountCode: '1105',
        accountName: 'IVA Crédito Fiscal (13% en Compras)',
        debit: Number(totalIvaCredit.toFixed(2)),
        credit: 0
      });
    }
    if (totalIvaPerceived > 0) {
      lines.push({
        accountCode: '1105',
        accountName: 'IVA Percibido en Compras (1% a Favor)',
        debit: Number(totalIvaPerceived.toFixed(2)),
        credit: 0
      });
    }

    // Credits (Pasivos y Caja/Bancos)
    if (totalCashAmount > 0) {
      lines.push({
        accountCode: '1101',
        accountName: 'Efectivo y Equivalentes (Caja y Bancos)',
        debit: 0,
        credit: Number(totalCashAmount.toFixed(2))
      });
    }
    if (totalCreditAmount > 0) {
      lines.push({
        accountCode: '2101',
        accountName: 'Cuentas por Pagar Comerciales (Proveedores CxP)',
        debit: 0,
        credit: Number(totalCreditAmount.toFixed(2))
      });
    }
    if (totalIvaWithheld > 0) {
      lines.push({
        accountCode: '2103',
        accountName: 'Retenciones de IVA por Enterar (1% a Proveedores)',
        debit: 0,
        credit: Number(totalIvaWithheld.toFixed(2))
      });
    }

    const totalDebit = Number(lines.reduce((s, l) => s + l.debit, 0).toFixed(2));
    const totalCredit = Number(lines.reduce((s, l) => s + l.credit, 0).toFixed(2));

    // Balance rounding if any
    const diff = Number((totalDebit - totalCredit).toFixed(2));
    if (Math.abs(diff) > 0 && lines.length > 0) {
      if (diff > 0) {
        const target = lines.find(l => l.accountCode === '1101' || l.accountCode === '2101') || lines[lines.length - 1];
        target.credit = Number((target.credit + diff).toFixed(2));
      } else {
        const target = lines.find(l => l.accountCode === '5101') || lines[0];
        target.debit = Number((target.debit + Math.abs(diff)).toFixed(2));
      }
    }

    const calculatedDebit = Number(lines.reduce((s, l) => s + l.debit, 0).toFixed(2));
    const calculatedCredit = Number(lines.reduce((s, l) => s + l.credit, 0).toFixed(2));

    const purchasesEntry = addJournalEntry({
      date: entryDate,
      concept: `Centralización mensual de compras y gastos recibidos (${periodPurchases.length} comprobantes), registro de IVA Crédito Fiscal 13% y retenciones practicadas del período ${monthName} ${year}.`,
      sourceType: 'Compra',
      referenceDoc: `Compras ${monthName} ${year}`,
      lines,
      totalDebit: calculatedDebit,
      totalCredit: calculatedCredit
    });

    createdEntries.push(purchasesEntry);
    details.push(`Partida #${purchasesEntry.entryNumber} de Compras generada (${periodPurchases.length} compras, Total $${calculatedDebit.toFixed(2)}).`);
  } else if (includePurchases) {
    details.push(`No se encontraron compras registradas en ${monthName} ${year}.`);
  }

  // 3. GENERATE COST OF SALES ENTRY (if products have cost info)
  if (includeCostOfSales && periodSales.length > 0) {
    let totalCostOfSoldGoods = 0;
    const productsMap = new Map((appData.products || []).map(p => [p.id, p]));

    for (const sale of periodSales) {
      if (Array.isArray(sale.items) && sale.items.length > 0) {
        for (const item of sale.items) {
          const prod = item.productId ? productsMap.get(item.productId) : null;
          const unitCost = prod?.cost || 0;
          if (unitCost > 0) {
            totalCostOfSoldGoods += ((item.qty || 0) * unitCost);
          }
        }
      }
    }

    if (totalCostOfSoldGoods > 0) {
      const roundedCost = Number(totalCostOfSoldGoods.toFixed(2));
      const costLines: JournalEntry['lines'] = [
        {
          accountCode: '5101',
          accountName: 'Costo de Ventas y Compras de Mercaderías',
          debit: roundedCost,
          credit: 0
        },
        {
          accountCode: '1104',
          accountName: 'Inventario de Mercaderías para la Venta',
          debit: 0,
          credit: roundedCost
        }
      ];

      const costEntry = addJournalEntry({
        date: entryDate,
        concept: `Reconocimiento del costo de ventas y descarga de inventarios correspondiente a las mercaderías vendidas en ${monthName} ${year}.`,
        sourceType: 'Ajuste',
        referenceDoc: `Costo de Ventas ${monthName} ${year}`,
        lines: costLines,
        totalDebit: roundedCost,
        totalCredit: roundedCost
      });

      createdEntries.push(costEntry);
      details.push(`Partida #${costEntry.entryNumber} de Costo de Ventas generada por $${roundedCost.toFixed(2)}.`);
    }
  }

  saveData();
  return {
    createdCount: createdEntries.length,
    createdEntries,
    details
  };
}

// Complete Excel Backup & Multi-Tab Export
export function exportFullExcel(): void {
  const wb = XLSX.utils.book_new();

  // 1. Resumen General
  const resumenData = [
    ['SISTEMA INTEGRAL ERP & FISCAL VTA-IVA'],
    ['Empresa:', appData.companyInfo.name],
    ['NIT:', appData.companyInfo.nit, 'NRC:', appData.companyInfo.nrc],
    ['Moneda Principal:', `${appData.currencyConfig.name} (${appData.currencyConfig.code} - ${appData.currencyConfig.symbol})`],
    ['Fecha de Generación:', new Date().toLocaleString()],
    [],
    ['Módulo', 'Total Registros', 'Valor Total / Saldo'],
    ['Ventas Emitidas', appData.salesRecords.length, appData.salesRecords.reduce((acc, s) => acc + (s.status === 'Emitida' ? s.total : 0), 0)],
    ['Compras Recibidas', appData.purchaseRecords.length, appData.purchaseRecords.reduce((acc, p) => acc + (p.status === 'Registrada' ? p.total : 0), 0)],
    ['Catálogo de Productos', appData.products.length, appData.products.reduce((acc, p) => acc + (p.stock * p.cost), 0)],
    ['Clientes Activos', appData.clients.length, ''],
    ['Proveedores Registrados', appData.suppliers.length, ''],
    ['Asientos Contables', appData.journalEntries.length, appData.journalEntries.reduce((acc, j) => acc + j.totalDebit, 0)]
  ];
  const wsResumen = XLSX.utils.aoa_to_sheet(resumenData);
  XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen ERP');

  // 2. Ventas
  const salesExport = appData.salesRecords.map(s => ({
    'Fecha': s.date,
    'Tipo Doc': s.documentType,
    'Correlativo': s.correlative,
    'DTE Código': s.dteCode || '',
    'Cliente': s.clientName || '',
    'NRC': s.clientNrc || '',
    'NIT': s.clientNit || '',
    'Descripción': s.description,
    'Gravadas': s.taxableAmount,
    'Exentas': s.exemptAmount,
    'IVA Débito': s.ivaDebit,
    'Retención 1%': s.ivaRetenido,
    'Percepción 1%': s.ivaPercibido,
    'Total': s.total,
    'Cobrado': s.paidAmount || 0,
    'Saldo Pendiente': Math.max(0, s.total - (s.paidAmount || 0)),
    'Forma Pago': s.paymentMethod,
    'Estado': s.status
  }));
  const wsSales = XLSX.utils.json_to_sheet(salesExport);
  XLSX.utils.book_append_sheet(wb, wsSales, 'Libro Ventas');

  // 3. Compras
  const purchasesExport = appData.purchaseRecords.map(p => ({
    'Fecha': p.date,
    'Tipo Doc': p.documentType,
    'Correlativo Int': p.correlative,
    'N° Factura Proveedor': p.documentNumber,
    'Proveedor': p.supplierName || '',
    'NRC': p.supplierNrc || '',
    'NIT': p.supplierNit || '',
    'Descripción': p.description || '',
    'Gravadas': p.taxableAmount,
    'Exentas': p.exemptAmount,
    'IVA Crédito': p.ivaCredit,
    'Retenido': p.ivaWithheld,
    'Percibido': p.ivaPerceived,
    'Total': p.total,
    'Pagado': p.paidAmount || 0,
    'Saldo Pendiente': Math.max(0, p.total - (p.paidAmount || 0)),
    'Forma Pago': p.paymentMethod,
    'Estado': p.status
  }));
  const wsPurchases = XLSX.utils.json_to_sheet(purchasesExport);
  XLSX.utils.book_append_sheet(wb, wsPurchases, 'Libro Compras');

  // 4. Inventario
  const inventoryExport = appData.products.map(p => ({
    'SKU': p.sku,
    'Producto / Servicio': p.name,
    'Categoría': p.category,
    'Unidad': p.unit,
    'Existencia': p.stock,
    'Stock Mínimo': p.minStock,
    'Costo Unitario': p.cost,
    'Precio Venta': p.price,
    'Valor Total Costo': p.stock * p.cost,
    'Valor Total Venta': p.stock * p.price,
    'Tratamiento IVA': p.taxType
  }));
  const wsInventory = XLSX.utils.json_to_sheet(inventoryExport);
  XLSX.utils.book_append_sheet(wb, wsInventory, 'Inventario');

  // 5. Clientes y Proveedores
  const clientsExport = appData.clients.map(c => ({
    'Nombre Comercial / Razón': c.name,
    'NRC': c.nrc,
    'NIT': c.nit,
    'Actividad': c.activity,
    'Dirección': c.address,
    'Teléfono': c.phone,
    'Email': c.email,
    'Gran Contribuyente': c.isGranContribuyente ? 'SÍ' : 'NO',
    'Límite Crédito': c.creditLimit || 0
  }));
  const wsClients = XLSX.utils.json_to_sheet(clientsExport);
  XLSX.utils.book_append_sheet(wb, wsClients, 'Directorio Clientes');

  // Generate and download
  const dateStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `ERP_Completo_VTA_IVA_${dateStr}.xlsx`);
}

// Backup & JSON Handlers
export function exportFullJson(): void {
  const payload = {
    meta: {
      exportedAt: new Date().toISOString(),
      app: 'Sistema ERP & Fiscal VTA-IVA El Salvador',
      version: '3.0'
    },
    ...appData
  };
  const str = JSON.stringify(payload, null, 2);
  const blob = new Blob([str], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_erp_vta_iva_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export specific Sales JSON
export function exportSalesJson(): void {
  const payload = {
    meta: {
      exportedAt: new Date().toISOString(),
      type: 'VENTAS_ERP_SV',
      company: appData.companyInfo.name,
      nrc: appData.companyInfo.nrc,
      count: appData.salesRecords.length
    },
    sales: appData.salesRecords
  };
  const str = JSON.stringify(payload, null, 2);
  const blob = new Blob([str], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ventas_erp_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Export specific Purchases JSON
export function exportPurchasesJson(): void {
  const payload = {
    meta: {
      exportedAt: new Date().toISOString(),
      type: 'COMPRAS_ERP_SV',
      company: appData.companyInfo.name,
      nrc: appData.companyInfo.nrc,
      count: appData.purchaseRecords.length
    },
    purchases: appData.purchaseRecords
  };
  const str = JSON.stringify(payload, null, 2);
  const blob = new Blob([str], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `compras_erp_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download Sample Sales JSON template
export function downloadSampleSalesJson(): void {
  const sample = {
    formato: "PLANTILLA_VENTAS_ERP_VTA_IVA",
    version: "3.0",
    descripcion: "Estructura JSON admitida para importación de ventas emitidas (CCF, Facturas CF, Exportaciones y Notas de Crédito)",
    ventas: [
      {
        documentType: "CCF",
        correlative: 105,
        dteCode: "DTE-03-000000000105",
        date: "2025-02-18",
        clientNrc: "194820-1",
        clientNit: "0614-200410-103-2",
        clientName: "CONSTRUCTORA SANTA TECLA, S.A. DE C.V.",
        clientAddress: "Calle Real #45, Santa Tecla, La Libertad",
        clientActivity: "Construcción de edificios y obras de ingeniería civil",
        description: "Venta de set de rodamientos industriales 50mm y lubricantes",
        taxableAmount: 450.00,
        exemptAmount: 0.00,
        noSujetaAmount: 0.00,
        ivaDebit: 58.50,
        ivaRetenido: 4.50,
        ivaPercibido: 0.00,
        total: 504.00,
        paymentMethod: "Crédito",
        paymentDays: 30,
        items: [
          {
            desc: "Set de rodamientos industriales 50mm",
            qty: 10,
            price: 45.00,
            type: "gravada",
            subtotal: 450.00
          }
        ]
      },
      {
        documentType: "CF",
        correlative: 204,
        dteCode: "DTE-01-000000000204",
        date: "2025-02-19",
        clientName: "Consumidor Final Mostrador",
        clientDui: "01234567-8",
        description: "Venta de lubricante y herramientas manuales de taller",
        taxableAmount: 43.00,
        exemptAmount: 0.00,
        noSujetaAmount: 0.00,
        ivaDebit: 5.59,
        total: 48.59,
        paymentMethod: "Contado",
        items: [
          {
            desc: "Aceite sintético lubricante alta viscosidad (Galón)",
            qty: 1,
            price: 35.00,
            type: "gravada",
            subtotal: 35.00
          },
          {
            desc: "Cinta métrica profesional 8m",
            qty: 1,
            price: 8.00,
            type: "gravada",
            subtotal: 8.00
          }
        ]
      }
    ]
  };

  const str = JSON.stringify(sample, null, 2);
  const blob = new Blob([str], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `plantilla_ventas_sv_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download Sample Purchases JSON template
export function downloadSamplePurchasesJson(): void {
  const sample = {
    formato: "PLANTILLA_COMPRAS_ERP_VTA_IVA",
    version: "3.0",
    descripcion: "Estructura JSON admitida para importación de compras y créditos fiscales recibidos de proveedores",
    compras: [
      {
        documentType: "CCF",
        documentNumber: "CCF-89210-A",
        date: "2025-02-10",
        supplierNrc: "183920-8",
        supplierNit: "0614-120401-102-8",
        supplierName: "IMPORTADORA Y LOGÍSTICA GLOBAL, S.A. DE C.V.",
        description: "Lote de rodamientos de acero y lubricantes para inventario",
        taxableAmount: 850.00,
        importTaxableAmount: 0.00,
        exemptAmount: 0.00,
        ivaCredit: 110.50,
        ivaWithheld: 8.50,
        ivaPerceived: 0.00,
        total: 952.00,
        paymentMethod: "Crédito",
        dueDate: "2025-03-12"
      },
      {
        documentType: "CCF",
        documentNumber: "CCF-2025-410",
        date: "2025-02-12",
        supplierNrc: "219402-4",
        supplierNit: "0614-290998-101-5",
        supplierName: "PAPELERÍA Y SUMINISTROS DE EL SALVADOR, LTDA. DE C.V.",
        description: "Compra de resmas de papel membretado y suministros administrativos",
        taxableAmount: 120.00,
        importTaxableAmount: 0.00,
        exemptAmount: 0.00,
        ivaCredit: 15.60,
        ivaWithheld: 0.00,
        ivaPerceived: 0.00,
        total: 135.60,
        paymentMethod: "Contado"
      }
    ]
  };

  const str = JSON.stringify(sample, null, 2);
  const blob = new Blob([str], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `plantilla_compras_sv_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Parser for Sales JSON
export interface ParsedSalesJsonResult {
  valid: Partial<SaleRecord>[];
  errors: string[];
  rawCount: number;
  stats: {
    totalTaxable: number;
    totalExempt: number;
    totalIvaDebit: number;
    totalAmount: number;
  };
}

export function parseSalesFromJson(data: any): ParsedSalesJsonResult {
  const errors: string[] = [];
  const valid: Partial<SaleRecord>[] = [];
  let rawList: any[] = [];

  if (Array.isArray(data)) {
    rawList = data;
  } else if (data && typeof data === 'object') {
    if (Array.isArray(data.ventas)) rawList = data.ventas;
    else if (Array.isArray(data.sales)) rawList = data.sales;
    else if (Array.isArray(data.salesRecords)) rawList = data.salesRecords;
    else if (Array.isArray(data.records)) rawList = data.records;
    else if (data.identificacion || data.cuerpoDocumento || data.resumen) {
      // Single DTE structure
      rawList = [data];
    } else {
      rawList = [data];
    }
  }

  rawList.forEach((raw, index) => {
    try {
      // Support MH El Salvador DTE format
      if (raw.identificacion || raw.cuerpoDocumento || raw.resumen) {
        const idObj = raw.identificacion || {};
        const recObj = raw.receptor || {};
        const resObj = raw.resumen || {};
        const dteTipo = idObj.tipoDte === '01' ? 'CF' : idObj.tipoDte === '03' ? 'CCF' : idObj.tipoDte === '11' ? 'EXP' : idObj.tipoDte === '05' ? 'NC' : 'CCF';
        
        const taxable = Number(resObj.totalGravada || resObj.subTotalVentas || 0);
        const exempt = Number(resObj.totalExenta || 0);
        const noSujeta = Number(resObj.totalNoSuj || 0);
        const ivaDebit = resObj.tributos?.find((t: any) => t.codigo === '20')?.valor ?? calculateVat(taxable);
        const ivaRet = Number(resObj.ivaRete1 || 0);
        const total = Number(resObj.totalPagar || resObj.montoTotalOperacion || (taxable + exempt + noSujeta + ivaDebit - ivaRet));

        const mappedItems: SalesItem[] = (raw.cuerpoDocumento || []).map((it: any, i: number) => ({
          id: generateId() + i,
          desc: it.descripcion || 'Ítem DTE',
          qty: Number(it.cantidad || 1),
          price: Number(it.precioUni || 0),
          type: it.ventaExenta > 0 ? 'exenta' : it.ventaNoSuj > 0 ? 'noSujeta' : 'gravada',
          subtotal: Number(it.ventaGravada || it.ventaExenta || it.ventaNoSuj || (it.cantidad * it.precioUni) || 0)
        }));

        const codGen = idObj.codigoGeneracion || raw.codigoGeneracion || idObj.numeroControl || raw.dteCode || raw.codigoDte;
        valid.push({
          correlative: Number(idObj.numeroControl?.replace(/\D/g, '') || raw.correlative || 0),
          dteCode: codGen || `DTE-${dteTipo}-${Date.now()}`,
          codigoGeneracion: codGen || idObj.codigoGeneracion || raw.codigoGeneracion,
          date: idObj.fecEmi || new Date().toISOString().substring(0, 10),
          documentType: dteTipo,
          clientNrc: recObj.nrc || '',
          clientNit: recObj.nit || '',
          clientDui: recObj.numDocumento || recObj.dui || '',
          clientName: recObj.nombre || recObj.nombreComercial || 'Cliente DTE',
          clientAddress: typeof recObj.direccion === 'object' ? recObj.direccion?.complemento : recObj.direccion || '',
          clientActivity: recObj.descActividad || '',
          description: mappedItems[0]?.desc ? `${mappedItems[0].desc}${mappedItems.length > 1 ? ` (+${mappedItems.length - 1} ítems)` : ''}` : 'Venta DTE Electrónica',
          taxableAmount: taxable,
          exemptAmount: exempt,
          noSujetaAmount: noSujeta,
          ivaDebit: ivaDebit,
          ivaRetenido: ivaRet,
          total: total,
          items: mappedItems,
          paymentMethod: resObj.condicionOperacion === 2 ? 'Crédito' : 'Contado'
        });
        return;
      }

      // Standard / Flat JSON format
      const docType = (raw.documentType || raw.tipoDocumento || raw.tipo || 'CCF').toUpperCase();
      const validDocType: DocumentTypeSale = ['CCF', 'CF', 'EXP', 'NC', 'ND'].includes(docType) ? docType : 'CCF';
      
      const date = raw.date || raw.fecha || new Date().toISOString().substring(0, 10);
      const clientName = raw.clientName || raw.nombreCliente || raw.cliente || raw.name || (validDocType === 'CF' ? 'Consumidor Final' : 'Cliente General');
      const clientNrc = String(raw.clientNrc || raw.nrc || raw.nrcCliente || '');
      const clientNit = String(raw.clientNit || raw.nit || raw.nitCliente || '');
      const clientDui = String(raw.clientDui || raw.dui || '');
      const description = raw.description || raw.detalle || raw.concepto || 'Venta registrada vía JSON';
      
      let taxable = Number(raw.taxableAmount ?? raw.ventaGravada ?? raw.gravadas ?? raw.taxable ?? 0);
      let exempt = Number(raw.exemptAmount ?? raw.ventaExenta ?? raw.exentas ?? raw.exempt ?? 0);
      let noSujeta = Number(raw.noSujetaAmount ?? raw.noSujeta ?? 0);
      let total = Number(raw.total ?? raw.totalPagar ?? raw.montoTotal ?? 0);
      let ivaDebit = Number(raw.ivaDebit ?? raw.iva ?? raw.debitoFiscal ?? 0);
      let ivaRetenido = Number(raw.ivaRetenido ?? raw.retencion ?? raw.retencion1 ?? 0);
      let ivaPercibido = Number(raw.ivaPercibido ?? raw.percepcion ?? 0);

      // Recalculate if missing
      if (validDocType === 'CF' && total > 0 && taxable === 0) {
        taxable = Math.round((total / 1.13) * 100) / 100;
        ivaDebit = Math.round((total - taxable) * 100) / 100;
      } else if (ivaDebit === 0 && taxable > 0) {
        ivaDebit = calculateVat(taxable);
      }

      if (total === 0) {
        total = Math.round((taxable + exempt + noSujeta + ivaDebit - ivaRetenido + ivaPercibido) * 100) / 100;
      }

      const items: SalesItem[] = Array.isArray(raw.items) 
        ? raw.items.map((it: any, i: number) => ({
            id: it.id || generateId() + i,
            productId: it.productId,
            desc: it.desc || it.descripcion || it.name || 'Ítem',
            qty: Number(it.qty || it.cantidad || 1),
            price: Number(it.price || it.precio || 0),
            type: it.type || (it.exenta ? 'exenta' : 'gravada'),
            subtotal: Number(it.subtotal || (Number(it.qty || 1) * Number(it.price || 0)))
          }))
        : [{
            id: generateId(),
            desc: description,
            qty: 1,
            price: taxable > 0 ? taxable : total,
            type: taxable > 0 ? 'gravada' : 'exenta',
            subtotal: taxable > 0 ? taxable : total
          }];

      const codGenFlat = raw.codigoGeneracion || raw.dteCode || raw.codigoDte || raw.numeroControl;

      valid.push({
        correlative: Number(raw.correlative || raw.correlativo || 0),
        dteCode: codGenFlat || (raw.correlative ? `CCF-${String(raw.correlative).padStart(6, '0')}` : undefined),
        codigoGeneracion: codGenFlat,
        date,
        documentType: validDocType,
        clientNrc,
        clientNit,
        clientDui,
        clientName,
        clientAddress: raw.clientAddress || raw.direccion || '',
        clientActivity: raw.clientActivity || raw.giro || '',
        description,
        taxableAmount: taxable,
        exemptAmount: exempt,
        noSujetaAmount: noSujeta,
        ivaDebit,
        ivaRetenido,
        ivaPercibido,
        total,
        items,
        paymentMethod: raw.paymentMethod || raw.formaPago || 'Contado',
        paymentDays: raw.paymentDays ? Number(raw.paymentDays) : undefined,
        dueDate: raw.dueDate || raw.fechaVencimiento
      });
    } catch (err: any) {
      errors.push(`Fila/Registro #${index + 1}: ${err.message || 'Error de estructura'}`);
    }
  });

  const stats = {
    totalTaxable: valid.reduce((s, r) => s + (r.taxableAmount || 0), 0),
    totalExempt: valid.reduce((s, r) => s + (r.exemptAmount || 0), 0),
    totalIvaDebit: valid.reduce((s, r) => s + (r.ivaDebit || 0), 0),
    totalAmount: valid.reduce((s, r) => s + (r.total || 0), 0)
  };

  return { valid, errors, rawCount: rawList.length, stats };
}

// Parser for Purchases JSON
export interface ParsedPurchasesJsonResult {
  valid: Partial<PurchaseRecord>[];
  errors: string[];
  rawCount: number;
  stats: {
    totalTaxable: number;
    totalExempt: number;
    totalIvaCredit: number;
    totalAmount: number;
  };
}

export function parsePurchasesFromJson(data: any): ParsedPurchasesJsonResult {
  const errors: string[] = [];
  const valid: Partial<PurchaseRecord>[] = [];
  let rawList: any[] = [];

  if (Array.isArray(data)) {
    rawList = data;
  } else if (data && typeof data === 'object') {
    if (Array.isArray(data.compras)) rawList = data.compras;
    else if (Array.isArray(data.purchases)) rawList = data.purchases;
    else if (Array.isArray(data.purchaseRecords)) rawList = data.purchaseRecords;
    else if (Array.isArray(data.records)) rawList = data.records;
    else {
      rawList = [data];
    }
  }

  rawList.forEach((raw, index) => {
    try {
      // Support MH El Salvador DTE format for Purchases (where supplier is emisor)
      if (raw.identificacion || raw.cuerpoDocumento || raw.resumen || raw.emisor) {
        const idObj = raw.identificacion || {};
        const emiObj = raw.emisor || {};
        const resObj = raw.resumen || {};
        const dteTipo = idObj.tipoDte === '01' ? 'CCF' : idObj.tipoDte === '03' ? 'CCF' : idObj.tipoDte === '14' ? 'DUI' : idObj.tipoDte === '05' ? 'NC' : idObj.tipoDte === '06' ? 'ND' : 'CCF';
        
        const taxable = Number(resObj.totalGravada || resObj.subTotalVentas || 0);
        const exempt = Number(resObj.totalExenta || 0);
        const noSujeta = Number(resObj.totalNoSuj || 0);
        const ivaCredit = resObj.tributos?.find((t: any) => t.codigo === '20')?.valor ?? calculateVat(taxable);
        const ivaWithheld = Number(resObj.ivaRete1 || 0);
        const ivaPerceived = Number(resObj.ivaPerci1 || 0);
        const total = Number(resObj.totalPagar || resObj.montoTotalOperacion || (taxable + exempt + noSujeta + ivaCredit - ivaWithheld + ivaPerceived));

        const codGen = idObj.codigoGeneracion || raw.codigoGeneracion || idObj.numeroControl || raw.documentNumber;
        const docNum = codGen || idObj.numeroControl || `DTE-${idObj.tipoDte || '03'}-${Date.now()}`;
        const supplierName = emiObj.nombre || emiObj.nombreComercial || 'Proveedor DTE';
        const supplierNrc = String(emiObj.nrc || '');
        const supplierNit = String(emiObj.nit || '');

        const desc = raw.cuerpoDocumento?.[0]?.descripcion 
          ? `${raw.cuerpoDocumento[0].descripcion}${raw.cuerpoDocumento.length > 1 ? ` (+${raw.cuerpoDocumento.length - 1} ítems)` : ''}`
          : 'Compra DTE Electrónica';

        valid.push({
          date: idObj.fecEmi || new Date().toISOString().substring(0, 10),
          documentType: dteTipo,
          documentNumber: docNum,
          codigoGeneracion: codGen,
          supplierNrc,
          supplierNit,
          supplierName,
          description: desc,
          taxableAmount: taxable,
          importTaxableAmount: 0,
          exemptAmount: exempt,
          importExemptAmount: 0,
          noSujetaAmount: noSujeta,
          ivaCredit,
          ivaWithheld,
          ivaPerceived,
          total,
          paymentMethod: resObj.condicionOperacion === 2 ? 'Crédito' : 'Contado'
        });
        return;
      }

      const docType = (raw.documentType || raw.tipoDocumento || raw.tipo || 'CCF').toUpperCase();
      const validDocType: DocumentTypePurchase = ['CCF', 'DUI', 'NC', 'ND', 'Otros'].includes(docType) ? docType : 'CCF';

      const date = raw.date || raw.fecha || new Date().toISOString().substring(0, 10);
      const supplierName = raw.supplierName || raw.nombreProveedor || raw.proveedor || raw.name || 'Proveedor General';
      const supplierNrc = String(raw.supplierNrc || raw.nrc || raw.nrcProveedor || '');
      const supplierNit = String(raw.supplierNit || raw.nit || raw.nitProveedor || '');
      const codGenFlat = raw.codigoGeneracion || raw.dteCode || raw.codigoDte || raw.numeroControl;
      const documentNumber = String(codGenFlat || raw.documentNumber || raw.numeroDocumento || raw.factura || raw.numDoc || `IMP-${Date.now() + index}`);
      const description = raw.description || raw.detalle || raw.concepto || 'Compra importada vía JSON';

      const taxable = Number(raw.taxableAmount ?? raw.compraGravada ?? raw.gravadas ?? raw.taxable ?? 0);
      const importTaxable = Number(raw.importTaxableAmount ?? raw.gravadasImportacion ?? 0);
      const exempt = Number(raw.exemptAmount ?? raw.compraExenta ?? raw.exentas ?? 0);
      const importExempt = Number(raw.importExemptAmount ?? raw.exentasImportacion ?? 0);
      const noSujeta = Number(raw.noSujetaAmount ?? raw.noSujeta ?? 0);
      
      let ivaCredit = Number(raw.ivaCredit ?? raw.iva ?? raw.creditoFiscal ?? 0);
      if (ivaCredit === 0 && (taxable + importTaxable) > 0) {
        ivaCredit = calculateVat(taxable + importTaxable);
      }

      const ivaWithheld = Number(raw.ivaWithheld ?? raw.ivaRetenido ?? raw.retencion ?? 0);
      const ivaPerceived = Number(raw.ivaPerceived ?? raw.ivaPercibido ?? raw.percepcion ?? 0);
      
      let total = Number(raw.total ?? raw.totalCompra ?? raw.montoTotal ?? 0);
      if (total === 0) {
        total = Math.round((taxable + importTaxable + exempt + importExempt + noSujeta + ivaCredit - ivaWithheld + ivaPerceived) * 100) / 100;
      }

      valid.push({
        date,
        documentType: validDocType,
        documentNumber,
        codigoGeneracion: codGenFlat,
        supplierNrc,
        supplierNit,
        supplierName,
        description,
        taxableAmount: taxable,
        importTaxableAmount: importTaxable,
        exemptAmount: exempt,
        importExemptAmount: importExempt,
        noSujetaAmount: noSujeta,
        ivaCredit,
        ivaWithheld,
        ivaPerceived,
        total,
        paymentMethod: raw.paymentMethod || raw.formaPago || 'Contado',
        dueDate: raw.dueDate || raw.fechaVencimiento
      });
    } catch (err: any) {
      errors.push(`Registro #${index + 1}: ${err.message || 'Error de estructura'}`);
    }
  });

  const stats = {
    totalTaxable: valid.reduce((s, r) => s + (r.taxableAmount || 0), 0),
    totalExempt: valid.reduce((s, r) => s + (r.exemptAmount || 0), 0),
    totalIvaCredit: valid.reduce((s, r) => s + (r.ivaCredit || 0), 0),
    totalAmount: valid.reduce((s, r) => s + (r.total || 0), 0)
  };

  return { valid, errors, rawCount: rawList.length, stats };
}

// Bulk Insert Sales from Parsed JSON
export function importSalesFromJsonData(salesList: Partial<SaleRecord>[], mode: 'append' | 'replace' = 'append'): number {
  if (mode === 'replace') {
    appData.salesRecords = [];
    appData.nextCorrelatives.salesCCF = 1;
    appData.nextCorrelatives.salesCF = 1;
  }

  let count = 0;
  salesList.forEach(sale => {
    addSale(sale);
    count++;
  });

  saveData();
  return count;
}

// Bulk Insert Purchases from Parsed JSON
export function importPurchasesFromJsonData(purchasesList: Partial<PurchaseRecord>[], mode: 'append' | 'replace' = 'append'): number {
  if (mode === 'replace') {
    appData.purchaseRecords = [];
    appData.nextCorrelatives.purchases = 1;
  }

  let count = 0;
  purchasesList.forEach(pur => {
    addPurchase(pur);
    count++;
  });

  saveData();
  return count;
}

// Full Backup JSON import
export function importFullBackupJson(data: any): boolean {
  if (!data || typeof data !== 'object') {
    throw new Error('Estructura de datos JSON no válida.');
  }

  appData = {
    companyInfo: { ...defaultCompanyInfo, ...(data.companyInfo || {}) },
    currencyConfig: { ...defaultData.currencyConfig, ...(data.currencyConfig || {}) },
    products: Array.isArray(data.products) ? data.products.map((p: any) => ({ ...p, id: p.id || generateId() })) : defaultProducts,
    inventoryMovements: Array.isArray(data.inventoryMovements) ? data.inventoryMovements : defaultInventoryMovements,
    clients: Array.isArray(data.clients) ? data.clients.map((c: any) => ({ ...c, id: c.id || generateId() })) : [],
    suppliers: Array.isArray(data.suppliers) ? data.suppliers.map((s: any) => ({ ...s, id: s.id || generateId() })) : [],
    salesRecords: Array.isArray(data.salesRecords) ? data.salesRecords.map((s: any) => ({ ...s, id: s.id || generateId() })) : [],
    purchaseRecords: Array.isArray(data.purchaseRecords) ? data.purchaseRecords.map((p: any) => ({ ...p, id: p.id || generateId() })) : [],
    paymentRecords: Array.isArray(data.paymentRecords) ? data.paymentRecords : [],
    journalEntries: Array.isArray(data.journalEntries) ? data.journalEntries : [],
    nextCorrelatives: { ...defaultNextCorrelatives, ...(data.nextCorrelatives || {}) }
  };

  saveData();
  return true;
}

export function generateTemplateXlsx(type: 'clients' | 'suppliers' | 'sales' | 'purchases' | 'products'): void {
  const wb = XLSX.utils.book_new();

  if (type === 'products') {
    const aoa = [
      ['code', 'name', 'category', 'unit', 'costPrice', 'salePrice', 'minStock', 'taxType', 'description'],
      ['Código/SKU', 'Nombre del Producto', 'Categoría', 'Unidad (Unidad/Kg/Caja/Servicio)', 'Costo Unitario', 'Precio de Venta', 'Stock Mínimo', 'Tipo IVA (gravada/exenta/noSujeta)', 'Descripción Opcional'],
      ['PROD-001', 'Tornillo de Acero Inoxidable 2"', 'Ferretería', 'Caja', '8.50', '12.50', '10', 'gravada', 'Caja con 100 tornillos de alta resistencia']
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, 'PRODUCTOS_PLANTILLA');
  } else if (type === 'clients') {
    const aoa = [
      ['name', 'nrc', 'nit', 'dui', 'address', 'activity', 'contact', 'phone', 'email', 'isGranContribuyente'],
      ['Nombre / Razón Social', 'NRC (Registro)', 'NIT (Tributario)', 'DUI', 'Dirección', 'Giro / Actividad', 'Contacto', 'Teléfono (7-10 dígitos)', 'Correo Electrónico', 'Gran Contribuyente (SI/NO)'],
      ['Empresa Ejemplo S.A. de C.V.', '123456-7', '0614-010190-101-1', '01234567-8', 'San Salvador, Av. Roosevelt #100', 'Servicios de Consultoría', 'Lic. Juan Pérez', '2250-0000', 'contacto@ejemplo.com', 'NO']
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, 'CLIENTES_PLANTILLA');
  } else if (type === 'suppliers') {
    const aoa = [
      ['name', 'nrc', 'nit', 'dui', 'address', 'activity', 'contact', 'phone', 'email', 'isGranContribuyente'],
      ['Nombre / Razón Social', 'NRC Proveedor', 'NIT', 'DUI', 'Dirección', 'Giro Comercial', 'Contacto', 'Teléfono', 'Correo Electrónico', 'Gran Contribuyente (SI/NO)'],
      ['Distribuidora Mayorista S.A.', '654321-0', '0614-150585-102-3', '', 'Santa Tecla, La Libertad', 'Venta al por mayor', 'Ventas Corporativas', '2288-9900', 'pedidos@mayorista.sv', 'SI']
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, 'PROVEEDORES_PLANTILLA');
  } else if (type === 'sales') {
    const aoa = [
      ['date', 'documentType', 'clientNrc', 'dteCode', 'description', 'taxableAmount', 'exemptAmount', 'noSujetaAmount', 'total', 'paymentMethod'],
      ['Fecha (AAAA-MM-DD)', 'Tipo (CCF/CF)', 'NRC Cliente (Obligatorio en CCF)', 'Código DTE (Opcional)', 'Detalle de la Venta', 'Venta Gravada', 'Venta Exenta', 'Venta No Sujeta', 'Total (Obligatorio en CF)', 'Forma de Pago (Contado/Crédito)'],
      ['2025-02-15', 'CCF', '123456-7', 'DTE-03-001', 'Venta de servicios y suministros', '250.00', '0.00', '0.00', '282.50', 'Crédito'],
      ['2025-02-16', 'CF', '', 'DTE-01-002', 'Venta directa de mostrador', '0.00', '0.00', '0.00', '113.00', 'Contado']
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, 'VENTAS_PLANTILLA');
  } else if (type === 'purchases') {
    const aoa = [
      ['date', 'documentType', 'supplierNrc', 'documentNumber', 'description', 'taxableAmount', 'exemptAmount', 'ivaCredit', 'ivaWithheld', 'ivaPerceived', 'paymentMethod'],
      ['Fecha (AAAA-MM-DD)', 'Tipo (CCF/DUI/Otros)', 'NRC Proveedor', 'N° Documento Proveedor', 'Descripción de Compra', 'Compra Gravada', 'Compra Exenta', 'IVA Crédito (13%)', 'Retención IVA (1% o 2%)', 'Percepción IVA (1%)', 'Forma de Pago'],
      ['2025-02-10', 'CCF', '654321-0', 'CCF-90123', 'Compra de papelería e insumos de oficina', '100.00', '0.00', '13.00', '0.00', '1.00', 'Contado']
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, 'COMPRAS_PLANTILLA');
  }

  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `plantilla_${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
