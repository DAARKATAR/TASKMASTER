import React from 'react';
import { Printer } from 'lucide-react';

/**
 * TASKMASTER - Ticket Térmico 80mm / 58mm Ultra-Optimizado (Bajo Consumo de Impresión)
 * 
 * Diseñado específicamente para impresoras térmicas (Epson, Bixolon, POS-58, etc.):
 * - 100% texto plano monocromático (cero fondos rellenos, cero sombras oscuras).
 * - Ahorro máximo de papel y energía del cabezal térmico.
 * - Identidad clara del comercio (Nombre, Rubro, Sucursal, Folio y Aviso de Control Interno).
 * - Desglose detallado del método de pago, monto recibido y cambio/vuelto.
 */
export default function BakeryReceiptTicket({ tenant, invoiceData, cartItems }) {
  const businessName = tenant?.nombre || invoiceData?.emisor || 'Mi Negocio POS';
  const businessType = tenant?.business_type || 'Comprobante de Venta';
  const sucursal = tenant?.sucursal || 'Caja Principal';
  
  const numeroFactura = invoiceData?.numero_factura || 'REC-1001';
  const cliente = invoiceData?.cliente || 'Cliente Mostrador';
  
  const subtotal = invoiceData?.subtotal 
    ? Number(invoiceData.subtotal).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) 
    : '0';
  const impuestos = invoiceData?.impuestos 
    ? Number(invoiceData.impuestos).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) 
    : '0';
  const total = invoiceData?.total 
    ? Number(invoiceData.total).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) 
    : '0';
    
  const folioInterno = invoiceData?.folio_fiscal 
    ? invoiceData.folio_fiscal.replace('CUFE-', 'INT-') 
    : 'INT-POS-2026';
    
  const metodoPago = (invoiceData?.metodo_pago || invoiceData?.metodoPago || 'Efectivo').toUpperCase();
  const montoRecibido = invoiceData?.monto_recibido 
    ? Number(invoiceData.monto_recibido).toLocaleString('es-CO') 
    : null;
  const cambio = invoiceData?.cambio !== undefined && invoiceData?.cambio !== null
    ? Number(invoiceData.cambio).toLocaleString('es-CO')
    : null;
    
  const fechaFormatted = invoiceData?.created_at 
    ? new Date(invoiceData.created_at).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium' }) 
    : new Date().toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'medium' });

  const itemsToDisplay = cartItems && cartItems.length > 0 
    ? cartItems 
    : [
        { 
          name: 'Consumo / Venta Registrada en Caja', 
          qty: invoiceData?.items_count || 1, 
          price: invoiceData?.subtotal ? Number(invoiceData.subtotal) : 0 
        }
      ];

  return (
    <div className="w-full flex flex-col items-center py-2 select-none">
      {/* Botón de Impresión Térmica Directa (Oculto en papel al imprimir) */}
      <div className="mb-4 w-full max-w-sm print:hidden">
        <button
          type="button"
          onClick={() => window.print()}
          className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold font-sans flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir Ticket Térmico (80mm / 58mm)</span>
        </button>
      </div>

      {/* Contenedor del Ticket Térmico en Blanco y Negro (Ahorro de Tinta Térmica) */}
      <div className="printable-receipt w-full max-w-sm bg-white text-black p-6 border border-slate-300 rounded-2xl shadow-sm font-mono text-xs leading-tight print:border-none print:shadow-none print:p-0 print:m-0 print:w-full">
        
        {/* ENCABEZADO DE IDENTIDAD DEL COMERCIO */}
        <div className="text-center pb-2 border-b border-black border-dashed space-y-1">
          <p className="font-bold text-sm tracking-wide uppercase">
            {businessName}
          </p>
          <p className="text-[11px] uppercase">
            {businessType}
          </p>
          <p className="text-[10px] text-slate-700">
            Sucursal: {sucursal}
          </p>
          <p className="text-[10px] text-slate-700 font-bold pt-1">
            CONTROL INTERNO DE CAJA
          </p>
        </div>

        {/* METADATOS DEL COMPROBANTE */}
        <div className="py-2.5 border-b border-black border-dashed space-y-1 text-[11px]">
          <div className="flex justify-between font-bold">
            <span>COMPROBANTE:</span>
            <span>{numeroFactura}</span>
          </div>
          <div className="flex justify-between">
            <span>FECHA / HORA:</span>
            <span>{fechaFormatted}</span>
          </div>
          <div className="flex justify-between">
            <span>CLIENTE:</span>
            <span className="truncate max-w-[190px] font-bold">{cliente}</span>
          </div>
          <div className="flex justify-between">
            <span>TIPO REGISTRO:</span>
            <span>VENTA DIRECTA POS</span>
          </div>
        </div>

        {/* DETALLE DE PRODUCTOS */}
        <div className="py-2.5 border-b border-black border-dashed space-y-1.5 text-[11px]">
          <div className="flex justify-between font-bold text-[10px] pb-1 border-b border-black border-dotted">
            <span>CANT  DESCRIPCION</span>
            <span>TOTAL</span>
          </div>
          {itemsToDisplay.map((it, idx) => (
            <div key={idx} className="flex justify-between items-start">
              <span className="truncate max-w-[200px]">
                {it.qty || 1}x {it.name || it.nombre}
              </span>
              <span className="font-bold shrink-0">
                ${Number((it.price || it.precio || 0) * (it.qty || 1)).toLocaleString('es-CO')}
              </span>
            </div>
          ))}
        </div>

        {/* TOTALES Y FORMA DE PAGO */}
        <div className="py-2.5 border-b border-black border-dashed space-y-1 text-[11px]">
          <div className="flex justify-between">
            <span>SUBTOTAL:</span>
            <span>${subtotal}</span>
          </div>
          <div className="flex justify-between">
            <span>IVA / IMPUESTOS:</span>
            <span>{parseFloat(invoiceData?.impuestos || 0) > 0 ? `$${impuestos}` : '0 (Exento)'}</span>
          </div>
          
          <div className="flex justify-between text-sm font-bold pt-1.5 border-t border-black border-dotted">
            <span>TOTAL A PAGAR:</span>
            <span>${total} COP</span>
          </div>

          {/* INFORMACIÓN DE PAGO */}
          <div className="pt-2 border-t border-black border-dotted space-y-1">
            <div className="flex justify-between font-bold">
              <span>METODO DE PAGO:</span>
              <span>{metodoPago}</span>
            </div>
            {montoRecibido && (
              <div className="flex justify-between">
                <span>PAGO CON:</span>
                <span>${montoRecibido} COP</span>
              </div>
            )}
            {cambio !== null && (
              <div className="flex justify-between font-bold">
                <span>CAMBIO / VUELTO:</span>
                <span>${cambio} COP</span>
              </div>
            )}
          </div>
        </div>

        {/* NOTA LEGAL Y FOLIO TÉCNICO */}
        <div className="pt-2 text-center text-[10px] space-y-1">
          <p className="font-bold">
            *** GRACIAS POR SU COMPRA ***
          </p>
          <p className="text-[9px] text-slate-700">
            Documento de control interno no válido como factura electrónica de venta DIAN.
          </p>
          <p className="text-[9px] text-slate-700 break-all pt-1">
            FOLIO: {folioInterno}
          </p>
          <p className="text-[8px] text-slate-500 pt-1">
            Powered by Task Master POS
          </p>
        </div>

      </div>
    </div>
  );
}
