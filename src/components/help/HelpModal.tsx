import React from 'react';
import { 
  X, 
  HelpCircle, 
  BookOpen, 
  Calculator, 
  Receipt, 
  ShoppingCart, 
  CheckCircle2, 
  FileSpreadsheet,
  AlertCircle,
  FileText
} from 'lucide-react';
import { VAT_RATE } from '../../services/dataStore';

interface HelpModalProps {
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0f172a] text-white border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-500/20 text-orange-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                <span className="text-orange-500 font-black">ITCPO - ERP</span>
                <span>Guía Tributaria y Manual del Sistema</span>
              </h3>
              <p className="text-xs text-slate-400">
                Normativa de Facturación Electrónica DTE y Control del Impuesto al Valor Agregado (13% El Salvador)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 text-xs sm:text-sm">
          
          {/* Section 1: Introduction */}
          <div className="space-y-2">
            <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-orange-600" />
              1. Estructura y Funcionamiento del IVA (13%)
            </h4>
            <p className="text-slate-600 leading-relaxed">
              El Sistema <strong>ITCPO - ERP</strong> calcula de forma automática el <strong>Débito Fiscal</strong> generado por las ventas y el <strong>Crédito Fiscal</strong> deducible originado en las compras de bienes y servicios relacionados con la actividad económica.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 bg-orange-50/70 rounded-xl border border-orange-200">
                <p className="font-bold text-orange-950">IVA Débito Fiscal (Ventas):</p>
                <p className="text-xs text-orange-900/80 mt-0.5">
                  Impuesto cobrado a los clientes (13% sobre la base gravada). Es una obligación a favor del Estado.
                </p>
              </div>
              <div className="p-3.5 bg-blue-50/70 rounded-xl border border-blue-200">
                <p className="font-bold text-blue-950">IVA Crédito Fiscal (Compras):</p>
                <p className="text-xs text-blue-900/80 mt-0.5">
                  Impuesto pagado a proveedores con NRC. Es un crédito deducible contra el débito fiscal del período.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: CCF vs CF */}
          <div className="space-y-2">
            <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-orange-600" />
              2. Comprobante de Crédito Fiscal (CCF) vs. Consumidor Final (CF)
            </h4>
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0f172a] font-bold text-white uppercase">
                  <tr>
                    <th className="p-2.5">Característica</th>
                    <th className="p-2.5">Crédito Fiscal (CCF)</th>
                    <th className="p-2.5">Consumidor Final (CF)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  <tr>
                    <td className="p-2.5 font-bold">Destinatario</td>
                    <td className="p-2.5">Contribuyentes inscritos de IVA (Empresas, profesionales con NRC).</td>
                    <td className="p-2.5">Público en general sin número de registro (B2C).</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">Requisitos de Cliente</td>
                    <td className="p-2.5 text-orange-700 font-semibold">Obligatorio NRC y NIT del cliente.</td>
                    <td className="p-2.5">Nombre opcional o 'Consumidor Final'.</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">Desglose de IVA</td>
                    <td className="p-2.5">IVA 13% discriminado explícitamente en el cuerpo del documento.</td>
                    <td className="p-2.5">Precio de venta con IVA ya incluido (Base = Total / 1.13).</td>
                  </tr>
                  <tr>
                    <td className="p-2.5 font-bold">Libro Tributario</td>
                    <td className="p-2.5">Libro de Ventas a Contribuyentes (detalle por factura).</td>
                    <td className="p-2.5">Libro de Ventas a Consumidor Final (resumen diario o por serie).</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Retenciones y Percepciones */}
          <div className="space-y-2">
            <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-orange-600" />
              3. Reglas de Retención (1% y 2%) y Percepción de IVA
            </h4>
            <ul className="list-disc list-inside space-y-1.5 text-slate-600 pl-1">
              <li>
                <strong>Agentes de Retención (Grandes Contribuyentes):</strong> Cuando una empresa clasificada como Gran Contribuyente le compra a un Mediano o Pequeño Contribuyente un monto igual o superior a $100.00 (sin IVA), debe retener el <strong>1% de IVA</strong>.
              </li>
              <li>
                <strong>Retención de IVA por Tarjeta (2%):</strong> Aplicada por procesadores de pago y bancos al liquidar transacciones con tarjetas de crédito/débito.
              </li>
              <li>
                <strong>Percepción de IVA (1%):</strong> Aplicada en compras mayoristas o importaciones de bienes específicos.
              </li>
            </ul>
          </div>

          {/* Section 4: Libros Obligatorios */}
          <div className="space-y-2">
            <h4 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-orange-600" />
              4. Libros Legales e Informes F-07
            </h4>
            <p className="text-slate-600">
              Según el <strong>Artículo 141 del Código Tributario de El Salvador</strong>, los contribuyentes deben llevar al día:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-700 font-medium pl-1">
              <li><strong>Libro de Ventas a Contribuyentes:</strong> Registro individual y cronológico de cada CCF emitido.</li>
              <li><strong>Libro de Ventas a Consumidor Final:</strong> Registro consolidado de comprobantes CF del período.</li>
              <li><strong>Libro de Compras:</strong> Registro detallado de todos los Créditos Fiscales recibidos de proveedores locales y DUI de importación.</li>
            </ol>
          </div>

          {/* Section 5: Step-by-Step Example */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
            <h5 className="font-bold text-slate-900 uppercase text-xs">Ejemplo Práctico de Liquidación:</h5>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
              <div className="p-2 bg-white rounded border border-slate-200">
                <p className="text-slate-500 font-sans">Venta CCF $1,000 + CF $500</p>
                <p className="font-bold text-orange-600">Débito Fiscal = $195.00</p>
              </div>
              <div className="p-2 bg-white rounded border border-slate-200">
                <p className="text-slate-500 font-sans">Compras Gravadas $800</p>
                <p className="font-bold text-blue-600">Crédito Fiscal = $104.00</p>
              </div>
              <div className="p-2 bg-[#0f172a] text-white rounded">
                <p className="text-slate-400 font-sans">Resultado Período</p>
                <p className="font-bold text-amber-400">IVA a Pagar = $91.00</p>
              </div>
            </div>
          </div>

        </div>

        {/* Footer with Copyright */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="text-left">
            <p className="text-[11px] font-bold text-slate-700">
              Carlos Alfredo Castillo Flores - ITCPO - 2026
            </p>
            <p className="text-[10px] text-slate-500">
              Derechos reservados • ITCPO - ERP • Cumplimiento Tributario y Fiscal SV
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-bold hover:from-orange-500 hover:to-amber-500 shadow-sm transition-all cursor-pointer"
          >
            Entendido, Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
