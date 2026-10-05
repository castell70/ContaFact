import { AppState, PeriodSummary, SaleRecord, PurchaseRecord } from '../types';
import { parseLocalDate } from '../utils/numberToWords';

export function calculatePeriodSummary(state: AppState, month: number, year: number): PeriodSummary {
  const sales = state.salesRecords || [];
  const purchases = state.purchaseRecords || [];

  // Filter for the selected month & year (Active/Emitida only, skip Anulada for tax books)
  const periodSales = sales.filter(s => {
    const d = parseLocalDate(s.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year && s.status !== 'Anulada';
  });

  const periodPurchases = purchases.filter(p => {
    const d = parseLocalDate(p.date);
    return d.getMonth() + 1 === month && d.getFullYear() === year && p.status !== 'Anulada';
  });

  // Annual filter
  const yearSales = sales.filter(s => {
    const d = parseLocalDate(s.date);
    return d.getFullYear() === year && s.status !== 'Anulada';
  });

  const yearPurchases = purchases.filter(p => {
    const d = parseLocalDate(p.date);
    return d.getFullYear() === year && p.status !== 'Anulada';
  });

  // Monthly Sales Calculations
  const salesTaxable = periodSales.reduce((sum, s) => sum + (s.taxableAmount || 0), 0);
  const salesExempt = periodSales.reduce((sum, s) => sum + (s.exemptAmount || 0), 0);
  const salesNoSujeta = periodSales.reduce((sum, s) => sum + (s.noSujetaAmount || 0), 0);
  const ivaDebit = periodSales.reduce((sum, s) => sum + (s.ivaDebit || 0), 0);
  const ivaRetenidoVentas = periodSales.reduce((sum, s) => sum + (s.ivaRetenido || 0), 0);
  const totalSales = periodSales.reduce((sum, s) => sum + (s.total || 0), 0);

  const salesCCFCount = periodSales.filter(s => s.documentType === 'CCF').length;
  const salesCFCount = periodSales.filter(s => s.documentType === 'CF').length;

  // Monthly Purchases Calculations
  const purchasesTaxable = periodPurchases.reduce((sum, p) => sum + (p.taxableAmount || 0) + (p.importTaxableAmount || 0), 0);
  const purchasesExempt = periodPurchases.reduce((sum, p) => sum + (p.exemptAmount || 0) + (p.importExemptAmount || 0), 0);
  const purchasesNoSujeta = periodPurchases.reduce((sum, p) => sum + (p.noSujetaAmount || 0), 0);
  const ivaCredit = periodPurchases.reduce((sum, p) => sum + (p.ivaCredit || 0), 0);
  const ivaRetenidoCompras = periodPurchases.reduce((sum, p) => sum + (p.ivaWithheld || 0), 0);
  const ivaPercibidoCompras = periodPurchases.reduce((sum, p) => sum + (p.ivaPerceived || 0), 0);
  const totalPurchases = periodPurchases.reduce((sum, p) => sum + (p.total || 0), 0);

  // IVA Balance: Débito Fiscal - Crédito Fiscal
  // > 0 means IVA a Pagar
  // < 0 means Remanente Crédito Fiscal
  const ivaToPay = Math.round((ivaDebit - ivaCredit) * 100) / 100;

  // Gross Utility: Total Base Gravada & Exenta Ventas - Total Base Gravada & Exenta Compras
  const utility = Math.round(((salesTaxable + salesExempt + salesNoSujeta) - (purchasesTaxable + purchasesExempt + purchasesNoSujeta)) * 100) / 100;

  // Annual Totals
  const annualSalesExcludingIva = yearSales.reduce((sum, s) => sum + (s.taxableAmount || 0) + (s.exemptAmount || 0) + (s.noSujetaAmount || 0), 0);
  const annualSalesIncludingIva = yearSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const annualIvaDebit = yearSales.reduce((sum, s) => sum + (s.ivaDebit || 0), 0);

  const annualPurchasesExcludingIva = yearPurchases.reduce((sum, p) => sum + (p.taxableAmount || 0) + (p.importTaxableAmount || 0) + (p.exemptAmount || 0) + (p.importExemptAmount || 0) + (p.noSujetaAmount || 0), 0);
  const annualPurchasesIncludingIva = yearPurchases.reduce((sum, p) => sum + (p.total || 0), 0);
  const annualIvaCredit = yearPurchases.reduce((sum, p) => sum + (p.ivaCredit || 0), 0);

  return {
    periodMonth: month,
    periodYear: year,
    totalSales: Math.round(totalSales * 100) / 100,
    salesTaxable: Math.round(salesTaxable * 100) / 100,
    salesExempt: Math.round(salesExempt * 100) / 100,
    salesNoSujeta: Math.round(salesNoSujeta * 100) / 100,
    ivaDebit: Math.round(ivaDebit * 100) / 100,
    salesCCFCount,
    salesCFCount,
    totalPurchases: Math.round(totalPurchases * 100) / 100,
    purchasesTaxable: Math.round(purchasesTaxable * 100) / 100,
    purchasesExempt: Math.round(purchasesExempt * 100) / 100,
    purchasesNoSujeta: Math.round(purchasesNoSujeta * 100) / 100,
    ivaCredit: Math.round(ivaCredit * 100) / 100,
    purchasesCount: periodPurchases.length,
    ivaRetenidoVentas: Math.round(ivaRetenidoVentas * 100) / 100,
    ivaRetenidoCompras: Math.round(ivaRetenidoCompras * 100) / 100,
    ivaPercibidoCompras: Math.round(ivaPercibidoCompras * 100) / 100,
    ivaToPay,
    utility,
    annualSalesExcludingIva: Math.round(annualSalesExcludingIva * 100) / 100,
    annualSalesIncludingIva: Math.round(annualSalesIncludingIva * 100) / 100,
    annualPurchasesExcludingIva: Math.round(annualPurchasesExcludingIva * 100) / 100,
    annualPurchasesIncludingIva: Math.round(annualPurchasesIncludingIva * 100) / 100,
    annualIvaDebit: Math.round(annualIvaDebit * 100) / 100,
    annualIvaCredit: Math.round(annualIvaCredit * 100) / 100
  };
}

export function getMonthlyHistory(state: AppState, year: number): Array<{
  month: number;
  monthName: string;
  sales: number;
  purchases: number;
  ivaDebit: number;
  ivaCredit: number;
  balance: number;
}> {
  const monthNames = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];

  return Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const summary = calculatePeriodSummary(state, month, year);
    return {
      month,
      monthName: monthNames[i],
      sales: summary.totalSales,
      purchases: summary.totalPurchases,
      ivaDebit: summary.ivaDebit,
      ivaCredit: summary.ivaCredit,
      balance: summary.ivaToPay
    };
  });
}
