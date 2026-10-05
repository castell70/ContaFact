import { CurrencyConfig } from '../types';

export const DEFAULT_CURRENCY_CONFIG: CurrencyConfig = {
  code: 'USD',
  symbol: '$',
  name: 'Dólar Estadounidense',
  decimalPlaces: 2,
  thousandSeparator: ',',
  decimalSeparator: '.',
  exchangeRateToUSD: 1.0,
  secondaryCurrencies: [
    { code: 'EUR', symbol: '€', name: 'Euro', rateToUSD: 0.92 },
    { code: 'GTQ', symbol: 'Q', name: 'Quetzal Guatemalteco', rateToUSD: 7.80 },
    { code: 'HNL', symbol: 'L', name: 'Lempira Hondureño', rateToUSD: 24.80 },
    { code: 'NIO', symbol: 'C$', name: 'Córdoba Nicaragüense', rateToUSD: 36.75 },
    { code: 'CRC', symbol: '₡', name: 'Colón Costarricense', rateToUSD: 515.00 },
    { code: 'MXN', symbol: 'MX$', name: 'Peso Mexicano', rateToUSD: 17.20 },
    { code: 'COP', symbol: 'COL$', name: 'Peso Colombiano', rateToUSD: 3950.00 }
  ]
};

const UNIDADES: string[] = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
const DECENAS: string[] = [
  'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE',
  'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'
];
const DIEZ_DIEZ: string[] = [
  '', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA',
  'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'
];
const CENTENAS: string[] = [
  '', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS',
  'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'
];

function convertGroup(n: number): string {
  let output = '';

  if (n === 100) {
    return 'CIEN';
  }

  const c = Math.floor(n / 100);
  const d = Math.floor((n % 100) / 10);
  const u = n % 10;

  if (c > 0) {
    output += CENTENAS[c] + ' ';
  }

  if (d === 1) {
    output += DECENAS[u] + ' ';
  } else if (d === 2) {
    if (u === 0) {
      output += 'VEINTE ';
    } else {
      output += 'VEINTI' + UNIDADES[u] + ' ';
    }
  } else if (d > 2) {
    output += DIEZ_DIEZ[d] + ' ';
    if (u > 0) {
      output += 'Y ' + UNIDADES[u] + ' ';
    }
  } else if (u > 0) {
    output += UNIDADES[u] + ' ';
  }

  return output.trim();
}

export function numberToSpanishWords(amount: number, currencyName = 'DÓLARES', currencyCode = 'USD'): string {
  if (isNaN(amount) || amount < 0) return `CERO ${currencyName.toUpperCase()} CON 00/100 ${currencyCode}`;

  const fixed = amount.toFixed(2);
  const [enteroStr, decimalStr] = fixed.split('.');
  let entero = parseInt(enteroStr, 10);
  const centavos = decimalStr || '00';

  if (entero === 0) {
    return `CERO ${currencyName.toUpperCase()} CON ${centavos}/100 ${currencyCode}`;
  }

  let words = '';

  // Millions
  if (entero >= 1000000) {
    const millions = Math.floor(entero / 1000000);
    entero %= 1000000;
    if (millions === 1) {
      words += 'UN MILLÓN ';
    } else {
      words += convertGroup(millions) + ' MILLONES ';
    }
  }

  // Thousands
  if (entero >= 1000) {
    const thousands = Math.floor(entero / 1000);
    entero %= 1000;
    if (thousands === 1) {
      words += 'MIL ';
    } else {
      words += convertGroup(thousands) + ' MIL ';
    }
  }

  // Units
  if (entero > 0) {
    words += convertGroup(entero) + ' ';
  }

  const resultWords = words.trim();
  let monedaSingular = currencyName.toUpperCase();
  if (monedaSingular.endsWith('ES')) {
    monedaSingular = monedaSingular.slice(0, -2);
  } else if (monedaSingular.endsWith('S')) {
    monedaSingular = monedaSingular.slice(0, -1);
  }
  const moneda = resultWords === 'UN' ? monedaSingular : currencyName.toUpperCase();

  return `${resultWords} ${moneda} CON ${centavos}/100 ${currencyCode}`;
}

export function formatCurrency(
  amount: number | undefined | null, 
  includeSymbolOrConfig?: boolean | Partial<CurrencyConfig>, 
  config?: Partial<CurrencyConfig>
): string {
  const val = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  
  let includeSymbol = true;
  let cfg: Partial<CurrencyConfig> | undefined = config;
  
  if (typeof includeSymbolOrConfig === 'boolean') {
    includeSymbol = includeSymbolOrConfig;
  } else if (typeof includeSymbolOrConfig === 'object' && includeSymbolOrConfig !== null) {
    cfg = includeSymbolOrConfig;
  }

  const decimals = cfg?.decimalPlaces ?? 2;
  const symbol = cfg?.symbol ?? '$';
  const thousands = cfg?.thousandSeparator ?? ',';
  const decimalPoint = cfg?.decimalSeparator ?? '.';

  const fixedParts = Math.abs(val).toFixed(decimals).split('.');
  let integerPart = fixedParts[0];
  const fractionalPart = fixedParts[1];

  // Insert thousand separators
  integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, thousands);

  const sign = val < 0 ? '-' : '';
  const formattedNumber = decimals > 0 ? `${integerPart}${decimalPoint}${fractionalPart}` : integerPart;

  if (!includeSymbol) {
    return `${sign}${formattedNumber}`;
  }

  return `${sign}${symbol}${formattedNumber}`;
}

export function convertAmount(amount: number, fromRate: number, toRate: number): number {
  if (!fromRate || !toRate) return amount;
  // Convert from currency A to base USD, then from base USD to currency B
  const inUSD = amount / fromRate;
  return inUSD * toRate;
}

export function parseLocalDate(dateStr: string | undefined): Date {
  if (!dateStr) return new Date();
  const parts = String(dateStr).split('T')[0].split('-');
  if (parts.length >= 3) {
    const [y, m, d] = parts.map(Number);
    return new Date(y, (m || 1) - 1, d || 1);
  }
  return new Date(dateStr);
}
