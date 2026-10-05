import React, { useState } from 'react';
import { 
  Printer, 
  X, 
  FileText, 
  QrCode, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  CreditCard,
  ReceiptText
} from 'lucide-react';
import { SaleRecord, CompanyInfo } from '../../types';
import { formatCurrency, numberToSpanishWords } from '../../utils/numberToWords';

interface InvoiceModalProps {
  sale: SaleRecord;
  companyInfo: CompanyInfo;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ sale, companyInfo, onClose }) => {
  const [viewMode, setViewMode] = useState<'letter' | 'ticket'>('letter');

  const isCCF = sale.documentType === 'CCF';
  const docTitle = isCCF ? 'COMPROBANTE DE CRÉDITO FISCAL' : 'FACTURA DE CONSUMIDOR FINAL';
  const dteCode = sale.dteCode || `DTE-03-${sale.correlative.toString().padStart(6, '0')}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Modal Header & Controls (hidden on actual print) */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#0f172a] text-white border-b border-slate-800 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                Vista Previa e Impresión de Documento
              </h3>
              <p className="text-xs text-slate-400">
                {docTitle} • N° {sale.correlative}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => setViewMode('letter')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  viewMode === 'letter'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Formato Carta / Oficial
              </button>
              <button
                onClick={() => setViewMode('ticket')}
                className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                  viewMode === 'ticket'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Ticket Térmico (80mm)
              </button>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir / Guardar PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Document Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/60 print:p-0 print:bg-white">
          
          {viewMode === 'letter' ? (
            /* =======================================================================
               LETTER / OFFICIAL DTE FORMAT
               ======================================================================= */
            <div className="bg-white p-6 sm:p-8 max-w-3xl mx-auto rounded-lg shadow-sm border border-slate-300 print:border-0 print:shadow-none print:p-4 text-slate-800 font-sans text-xs">
              
              {/* Header Box */}
              <div className="grid grid-cols-3 gap-4 pb-4 border-b-2 border-slate-800 items-start">
                
                {/* Company Identification */}
                <div className="col-span-2 space-y-1">
                  <h2 className="font-extrabold text-sm uppercase text-slate-900 leading-tight">
                    {companyInfo.name}
                  </h2>
                  {companyInfo.tradeName && (
                    <p className="font-bold text-orange-700 text-xs uppercase">
                      {companyInfo.tradeName}
                    </p>
                  )}
                  <p className="text-[11px] text-slate-600">{companyInfo.activity}</p>
                  <p className="text-[11px] text-slate-600">{companyInfo.address}</p>
                  <p className="text-[11px] text-slate-600 font-medium">
                    Teléfono: {companyInfo.phone} • Email: {companyInfo.email}
                  </p>
                  <div className="flex flex-wrap gap-x-4 pt-1 font-semibold text-slate-800 text-[11px]">
                    <span>NIT: {companyInfo.nit}</span>
                    <span>NRC: {companyInfo.nrc}</span>
                  </div>
                </div>

                {/* Document Type & Number Box */}
                <div className="border-2 border-slate-900 rounded-md p-3 text-center bg-slate-50 space-y-1 shadow-sm">
                  <p className="font-extrabold text-xs uppercase tracking-tight text-slate-900">
                    {docTitle}
                  </p>
                  <p className="text-base font-black text-orange-600 font-mono">
                    N° {sale.correlative.toString().padStart(6, '0')}
                  </p>
                  <div className="text-[10px] text-slate-600 border-t border-slate-300 pt-1 space-y-0.5 font-mono">
                    <p>DTE: {dteCode}</p>
                    <p>Res. MH: {companyInfo.resolutionNumber || 'RES-2023-01'}</p>
                  </div>
                </div>
              </div>

              {/* Client & Metadata Box */}
              <div className="my-3 p-3 bg-slate-50 rounded border border-slate-200 grid grid-cols-2 gap-3 text-[11px]">
                <div className="space-y-1">
                  <p><span className="font-bold text-slate-700">Cliente:</span> <span className="font-semibold text-slate-900">{sale.clientName || 'Consumidor Final'}</span></p>
                  {isCCF && (
                    <>
                      <p><span className="font-bold text-slate-700">NRC:</span> {sale.clientNrc || 'N/A'}</p>
                      <p><span className="font-bold text-slate-700">NIT/DUI:</span> {sale.clientNit || 'N/A'}</p>
                      <p><span className="font-bold text-slate-700">Giro / Actividad:</span> {sale.clientActivity || 'Comercial'}</p>
                      <p><span className="font-bold text-slate-700">Dirección:</span> {sale.clientAddress || 'San Salvador'}</p>
                    </>
                  )}
                </div>

                <div className="space-y-1 text-right">
                  <p><span className="font-bold text-slate-700">Fecha de Emisión:</span> {sale.date}</p>
                  <p><span className="font-bold text-slate-700">Condición de Pago:</span> <span className="font-semibold">{sale.paymentMethod} {sale.paymentDays ? `(${sale.paymentDays} días)` : ''}</span></p>
                  <p><span className="font-bold text-slate-700">Estado:</span> <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">{sale.status}</span></p>
                  <p><span className="font-bold text-slate-700">Moneda:</span> Dólares de los EE.UU. (USD)</p>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full border-collapse border border-slate-300 my-3 text-[11px]">
                <thead>
                  <tr className="bg-slate-800 text-white font-semibold">
                    <th className="border border-slate-600 px-2 py-1.5 text-center w-12">CANT.</th>
                    <th className="border border-slate-600 px-3 py-1.5 text-left">DESCRIPCIÓN</th>
                    <th className="border border-slate-600 px-2 py-1.5 text-right w-20">PRECIO UNIT.</th>
                    <th className="border border-slate-600 px-2 py-1.5 text-right w-20">NO SUJETAS</th>
                    <th className="border border-slate-600 px-2 py-1.5 text-right w-20">EXENTAS</th>
                    <th className="border border-slate-600 px-2 py-1.5 text-right w-24">GRAVADAS</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items && sale.items.length > 0 ? (
                    sale.items.map((item, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                        <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">{item.qty}</td>
                        <td className="border border-slate-300 px-3 py-1.5">{item.desc}</td>
                        <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{formatCurrency(item.price, false)}</td>
                        <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{item.type === 'noSujeta' ? formatCurrency(item.qty * item.price, false) : '0.00'}</td>
                        <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{item.type === 'exenta' ? formatCurrency(item.qty * item.price, false) : '0.00'}</td>
                        <td className="border border-slate-300 px-2 py-1.5 text-right font-mono font-medium">{item.type === 'gravada' ? formatCurrency(item.qty * item.price, false) : '0.00'}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td className="border border-slate-300 px-2 py-1.5 text-center font-mono">1</td>
                      <td className="border border-slate-300 px-3 py-1.5">{sale.description}</td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{formatCurrency(sale.taxableAmount, false)}</td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{formatCurrency(sale.noSujetaAmount, false)}</td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono">{formatCurrency(sale.exemptAmount, false)}</td>
                      <td className="border border-slate-300 px-2 py-1.5 text-right font-mono font-medium">{formatCurrency(sale.taxableAmount, false)}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Totals and Summary Box */}
              <div className="grid grid-cols-12 gap-3 mt-4 items-start">
                
                {/* Left: Value in words, QR Code simulation, Signatures */}
                <div className="col-span-7 space-y-3">
                  <div className="p-2.5 bg-slate-50 border border-slate-200 rounded text-[11px]">
                    <p className="font-bold text-slate-700">VALOR EN LETRAS:</p>
                    <p className="font-semibold text-slate-900 italic mt-0.5">
                      {numberToSpanishWords(sale.total)}
                    </p>
                  </div>

                  {/* QR & DTE Electronic Signature */}
                  <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded">
                    <div className="w-14 h-14 bg-white border border-slate-300 p-1 rounded flex items-center justify-center shrink-0">
                      <QrCode className="w-12 h-12 text-slate-800" />
                    </div>
                    <div className="text-[10px] text-slate-600 leading-tight space-y-0.5">
                      <p className="font-bold text-slate-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Documento Tributario Electrónico (DTE)
                      </p>
                      <p className="font-mono">Sello de Recepción: SV-DTE-2025-081290384</p>
                      <p>Consulte validez en Ministerio de Hacienda de El Salvador</p>
                    </div>
                  </div>

                  {/* Signature spaces */}
                  <div className="grid grid-cols-2 gap-4 pt-6 text-center text-[10px] text-slate-600">
                    <div className="border-t border-slate-400 pt-1">
                      <p className="font-semibold text-slate-800">Entregado Por</p>
                      <p>Firma y Sello Emisor</p>
                    </div>
                    <div className="border-t border-slate-400 pt-1">
                      <p className="font-semibold text-slate-800">Recibido Conforme</p>
                      <p>Firma, Nombre y DUI Cliente</p>
                    </div>
                  </div>
                </div>

                {/* Right: Detailed Math Totals */}
                <div className="col-span-5 border border-slate-300 rounded overflow-hidden text-[11px]">
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="px-3 py-1 font-semibold text-slate-700 bg-slate-50">Sumas / Subtotal:</td>
                        <td className="px-3 py-1 text-right font-mono font-medium">{formatCurrency(sale.taxableAmount + sale.exemptAmount + sale.noSujetaAmount)}</td>
                      </tr>
                      {isCCF ? (
                        <>
                          <tr className="border-b border-slate-200">
                            <td className="px-3 py-1 font-semibold text-slate-700 bg-slate-50">13% IVA Débito Fiscal:</td>
                            <td className="px-3 py-1 text-right font-mono font-medium text-orange-700">{formatCurrency(sale.ivaDebit)}</td>
                          </tr>
                          {sale.ivaRetenido > 0 && (
                            <tr className="border-b border-slate-200">
                              <td className="px-3 py-1 font-semibold text-slate-700 bg-slate-50">(-) Retención IVA 1%:</td>
                              <td className="px-3 py-1 text-right font-mono font-medium text-red-600">-{formatCurrency(sale.ivaRetenido)}</td>
                            </tr>
                          )}
                          {sale.ivaPercibido > 0 && (
                            <tr className="border-b border-slate-200">
                              <td className="px-3 py-1 font-semibold text-slate-700 bg-slate-50">(+) Percepción IVA 1%:</td>
                              <td className="px-3 py-1 text-right font-mono font-medium text-blue-600">+{formatCurrency(sale.ivaPercibido)}</td>
                            </tr>
                          )}
                        </>
                      ) : (
                        <tr className="border-b border-slate-200">
                          <td className="px-3 py-1 font-semibold text-slate-700 bg-slate-50">IVA Incluido (13%):</td>
                          <td className="px-3 py-1 text-right font-mono font-medium text-slate-600">{formatCurrency(sale.ivaDebit)}</td>
                        </tr>
                      )}
                      <tr className="bg-slate-900 text-white font-bold">
                        <td className="px-3 py-2 text-xs">TOTAL A PAGAR:</td>
                        <td className="px-3 py-2 text-right text-sm font-mono">{formatCurrency(sale.total)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          ) : (
            /* =======================================================================
               THERMAL TICKET FORMAT (80MM POS STYLE)
               ======================================================================= */
            <div className="bg-white p-5 max-w-[360px] mx-auto rounded shadow border border-slate-300 text-slate-900 font-mono text-[11px] print:border-0 print:shadow-none print:p-2">
              
              <div className="text-center space-y-1 border-b border-dashed border-slate-400 pb-3">
                <p className="font-black text-xs uppercase">{companyInfo.name}</p>
                {companyInfo.tradeName && <p className="font-bold text-orange-600 text-[10px]">{companyInfo.tradeName}</p>}
                <p className="text-[10px] text-slate-600">{companyInfo.address}</p>
                <p className="text-[10px] font-bold">NIT: {companyInfo.nit} | NRC: {companyInfo.nrc}</p>
                <p className="text-[10px]">Tel: {companyInfo.phone}</p>
                <p className="text-xs font-black uppercase mt-2">{docTitle}</p>
                <p className="font-black text-sm text-orange-600">N° {sale.correlative}</p>
                <p className="text-[9px] text-slate-500">DTE: {dteCode}</p>
              </div>

              <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-[10px]">
                <p><span className="font-bold">Fecha:</span> {sale.date}</p>
                <p><span className="font-bold">Cliente:</span> {sale.clientName || 'Consumidor Final'}</p>
                {sale.clientNrc && <p><span className="font-bold">NRC:</span> {sale.clientNrc}</p>}
                {sale.clientNit && <p><span className="font-bold">NIT:</span> {sale.clientNit}</p>}
                <p><span className="font-bold">Pago:</span> {sale.paymentMethod}</p>
              </div>

              {/* Items in ticket */}
              <div className="py-2 border-b border-dashed border-slate-400 space-y-1">
                <div className="flex justify-between font-bold border-b border-slate-300 pb-0.5 text-[10px]">
                  <span>CANT x DESC</span>
                  <span>TOTAL</span>
                </div>
                {sale.items && sale.items.length > 0 ? (
                  sale.items.map((it, i) => (
                    <div key={i} className="flex justify-between text-[10px]">
                      <span className="truncate pr-2">{it.qty} x {it.desc}</span>
                      <span className="font-bold shrink-0">{formatCurrency(it.qty * it.price, false)}</span>
                    </div>
                  ))
                ) : (
                  <div className="flex justify-between text-[10px]">
                    <span className="truncate pr-2">1 x {sale.description}</span>
                    <span className="font-bold shrink-0">{formatCurrency(sale.total, false)}</span>
                  </div>
                )}
              </div>

              {/* Ticket Totals */}
              <div className="py-2 border-b border-dashed border-slate-400 space-y-0.5 text-right text-[10px]">
                <div className="flex justify-between">
                  <span>Subtotal Gravado:</span>
                  <span>{formatCurrency(sale.taxableAmount)}</span>
                </div>
                {isCCF && (
                  <div className="flex justify-between font-semibold text-orange-700">
                    <span>IVA (13%):</span>
                    <span>{formatCurrency(sale.ivaDebit)}</span>
                  </div>
                )}
                {sale.ivaRetenido > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Retención IVA (1%):</span>
                    <span>-{formatCurrency(sale.ivaRetenido)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-xs pt-1 border-t border-slate-300">
                  <span>TOTAL A PAGAR:</span>
                  <span>{formatCurrency(sale.total)}</span>
                </div>
              </div>

              {/* Words & Footer */}
              <div className="pt-2 text-center text-[9px] space-y-1.5">
                <p className="italic">{numberToSpanishWords(sale.total)}</p>
                <div className="flex justify-center my-1">
                  <QrCode className="w-12 h-12 text-slate-800" />
                </div>
                <p className="font-bold">¡Gracias por su compra y preferencia!</p>
                <p className="text-[8px] text-slate-500">Sistema VTA-IVA SV</p>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
