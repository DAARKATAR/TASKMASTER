import React from 'react';
import { CheckCircle, QrCode, AlertCircle, FileText } from 'lucide-react';

export default function BakeryReceiptTicket({ tenant, invoiceData, cartItems }) {
  const brandColor = tenant?.brand_color || '#0F172A';
  const businessName = tenant?.nombre || invoiceData?.emisor || 'Mi Negocio POS';
  const logo = tenant?.logo || '🏬';
  
  const numeroFactura = invoiceData?.numero_factura || 'REC-1001';
  const cliente = invoiceData?.cliente || 'Cliente de Mostrador';
  const subtotal = invoiceData?.subtotal ? Number(invoiceData.subtotal).toLocaleString('es-CO', { minimumFractionDigits: 2 }) : '0.00';
  const impuestos = invoiceData?.impuestos ? Number(invoiceData.impuestos).toLocaleString('es-CO', { minimumFractionDigits: 2 }) : '0.00';
  const total = invoiceData?.total ? Number(invoiceData.total).toLocaleString('es-CO', { minimumFractionDigits: 2 }) : '0.00';
  const folioInterno = invoiceData?.folio_fiscal ? invoiceData.folio_fiscal.replace('CUFE-', 'INT-') : 'INT-POS-2026';

  const itemsToDisplay = cartItems && cartItems.length > 0 
    ? cartItems 
    : [
        { name: 'Consumo / Venta Registrada en Caja', qty: invoiceData?.items_count || 1, price: invoiceData?.subtotal ? Number(invoiceData.subtotal) : 0 }
      ];

  return (
    <div className="w-full flex justify-center py-2">
      <div className="relative w-full max-w-sm rounded-3xl bg-white text-slate-800 border border-slate-300 shadow-flat-lg p-6 font-mono text-xs space-y-4 select-none">
        
        {/* Línea de acento con color de marca elegido */}
        <div 
          className="absolute top-0 left-0 right-0 h-2 rounded-t-3xl" 
          style={{ backgroundColor: brandColor }}
        />

        {/* Encabezado del Ticket */}
        <div className="text-center pt-2 pb-3 border-b border-dashed border-slate-300 space-y-1">
          <div 
            className="w-10 h-10 rounded-xl mx-auto flex items-center justify-center text-xl shadow-xs border border-slate-200"
            style={{ backgroundColor: `${brandColor}15` }}
          >
            {tenant?.logoType === 'upload' && tenant?.logo ? (
              <img src={tenant.logo} alt="Logo" className="w-7 h-7 object-contain rounded" />
            ) : (
              <span>{logo}</span>
            )}
          </div>
          <h3 className="text-base font-black text-slate-900 tracking-tight font-display uppercase">
            {businessName}
          </h3>
          <p className="text-[10px] font-semibold" style={{ color: brandColor }}>
            Comprobante de Venta · Control Interno POS
          </p>
          <p className="text-[10px] text-slate-500">
            Terminal POS #01 · Caja Principal
          </p>
        </div>

        {/* Datos del Comprobante */}
        <div className="space-y-1 text-[11px] pb-3 border-b border-dashed border-slate-300">
          <div className="flex justify-between font-bold text-slate-900">
            <span>COMPROBANTE:</span>
            <span style={{ color: brandColor }}>{numeroFactura}</span>
          </div>
          <div className="flex justify-between text-slate-500 text-[10px]">
            <span>FECHA / HORA:</span>
            <span>Hoy, 19:20:14</span>
          </div>
          <div className="flex justify-between text-slate-600 text-[10px]">
            <span>CLIENTE:</span>
            <span className="truncate max-w-[170px] font-semibold text-slate-800">{cliente}</span>
          </div>
          <div className="flex justify-between items-center pt-1">
            <span className="text-[10px] text-slate-500">TIPO DE REGISTRO:</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
              <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
              COBRO REGISTRADO
            </span>
          </div>
        </div>

        {/* Detalle de Artículos */}
        <div className="space-y-1.5 pb-3 border-b border-dashed border-slate-300 text-[11px]">
          <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
            <span>Cant / Descripción</span>
            <span>Subtotal</span>
          </div>
          {itemsToDisplay.map((it, idx) => (
            <div key={idx} className="flex justify-between items-center text-slate-800">
              <span className="truncate max-w-[180px]">
                {it.qty}x {it.name}
              </span>
              <span className="font-semibold text-slate-900">
                ${Number(it.price * (it.qty || 1)).toLocaleString('es-CO')}
              </span>
            </div>
          ))}
        </div>

        {/* Desglose Financiero */}
        <div className="space-y-1 text-[11px] pb-3 border-b border-dashed border-slate-300">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal:</span>
            <span>${subtotal}</span>
          </div>
          <div className="flex justify-between text-slate-600">
            <span>IVA Estimado (19%):</span>
            <span>${impuestos}</span>
          </div>
          <div className="flex justify-between items-baseline font-bold text-slate-900 text-sm pt-1">
            <span>TOTAL PAGADO:</span>
            <span style={{ color: brandColor }} className="text-base font-display">
              ${total} COP
            </span>
          </div>
        </div>

        {/* Aviso de No Certificación Fiscal (Requerimiento explícito del usuario) */}
        <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-[9.5px] text-amber-900 space-y-1 leading-snug">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
            <span>Aviso de Control Interno:</span>
          </div>
          <p className="text-slate-600 font-sans">
            Este recibo es un <strong>documento de control interno de venta</strong>. No cuenta aún con certificación fiscal oficial ni timbre digital regulado por entidades tributarias.
          </p>
        </div>

        {/* Folio de Registro Interno & QR */}
        <div className="space-y-2 pt-1 text-center">
          <div className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-[9px] text-slate-600 break-all leading-tight">
            <span className="block font-bold text-slate-700 mb-0.5">FOLIO DE CONTROL INTERNO:</span>
            <code>{folioInterno}</code>
          </div>

          <div className="flex items-center justify-center gap-2 pt-1">
            <div className="p-1.5 rounded-lg border border-slate-300 bg-white">
              <QrCode className="w-8 h-8 text-slate-800" />
            </div>
            <div className="text-left text-[9px] text-slate-500 leading-tight">
              <span className="font-bold text-slate-700 block">Comprobante POS</span>
              <span>Registro de orden local</span>
            </div>
          </div>
        </div>

        {/* Footer del Recibo */}
        <div className="pt-2 text-center text-[10px] text-slate-400 space-y-0.5 border-t border-slate-100">
          <p className="flex items-center justify-center gap-1">
            <span>¡Gracias por preferir a</span>
            <strong className="text-slate-700">{businessName}!</strong>
          </p>
          <p className="text-[9px] text-slate-400">Sistema POS: Task Master</p>
        </div>

      </div>
    </div>
  );
}
