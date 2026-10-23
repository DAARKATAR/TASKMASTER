import React, { useRef, useState } from 'react';
import { Printer, Check, Copy } from 'lucide-react';

/**
 * TASKMASTER - Ticket Térmico 80mm / 58mm Ultra-Optimizado (Bajo Consumo de Impresión)
 * 
 * Diseñado específicamente para impresoras térmicas (Epson, Bixolon, POS-58, etc.):
 * - 100% texto plano monocromático (cero fondos rellenos, cero sombras oscuras).
 * - Ahorro máximo de papel y energía del cabezal térmico.
 * - Impresión aislada: imprime única y exclusivamente el comprobante sin barras ni elementos de la página.
 */
export default function BakeryReceiptTicket({ tenant, invoiceData, cartItems }) {
  const receiptRef = useRef(null);
  const [copied, setCopied] = useState(false);

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

  // Función de impresión aislada: imprime ÚNICAMENTE el ticket sin ningún elemento de la web
  const handlePrint = () => {
    if (!receiptRef.current) {
      window.print();
      return;
    }

    const iframe = document.createElement('iframe');
    iframe.setAttribute('style', 'position: fixed; width: 0; height: 0; left: -9999px; top: -9999px; border: none;');
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Factura_${numeroFactura}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            html, body {
              margin: 0;
              padding: 0;
              background: #ffffff;
              color: #000000;
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              line-height: 1.3;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .ticket-wrap {
              width: 76mm;
              margin: 0 auto;
              padding: 6px 3px;
              box-sizing: border-box;
            }
            .text-center { text-align: center; }
            .font-bold { font-weight: 700; }
            .uppercase { text-transform: uppercase; }
            .flex { display: flex; }
            .justify-between { justify-content: space-between; }
            .items-start { align-items: flex-start; }
            .border-b { border-bottom: 1px dashed #000000; }
            .border-dotted { border-bottom: 1px dotted #000000; }
            .border-t { border-top: 1px dashed #000000; }
            .py-2 { padding-top: 6px; padding-bottom: 6px; }
            .py-2\\.5 { padding-top: 7px; padding-bottom: 7px; }
            .pb-1 { padding-bottom: 3px; }
            .pb-2 { padding-bottom: 6px; }
            .pt-1 { padding-top: 3px; }
            .pt-1\\.5 { padding-top: 4px; }
            .pt-2 { padding-top: 6px; }
            .text-sm { font-size: 13px; }
            .text-xs { font-size: 11px; }
            .truncate {
              white-space: nowrap;
              overflow: hidden;
              text-overflow: ellipsis;
            }
            .max-w-\\[190px\\] { max-width: 190px; }
            .max-w-\\[200px\\] { max-width: 200px; }
            * { box-sizing: border-box; }
          </style>
        </head>
        <body>
          <div class="ticket-wrap">
            ${receiptRef.current.innerHTML}
          </div>
        </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch (err) {
        console.error('Error al imprimir iframe:', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 1500);
      }
    }, 250);
  };

  const handleCopyText = () => {
    const textLines = [
      `==============================`,
      `${businessName.toUpperCase()}`,
      `${businessType.toUpperCase()} - Sucursal: ${sucursal}`,
      `COMPROBANTE: ${numeroFactura}`,
      `FECHA: ${fechaFormatted}`,
      `CLIENTE: ${cliente}`,
      `------------------------------`,
      ...itemsToDisplay.map(it => `${it.qty || 1}x ${it.name || it.nombre} - $${Number((it.price || it.precio || 0) * (it.qty || 1)).toLocaleString('es-CO')}`),
      `------------------------------`,
      `SUBTOTAL: $${subtotal}`,
      `TOTAL A PAGAR: $${total} COP`,
      `METODO: ${metodoPago}`,
      `FOLIO: ${folioInterno}`,
      `==============================`
    ].join('\n');

    navigator.clipboard.writeText(textLines).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="w-full flex flex-col items-center py-2 select-none">
      {/* Botones de Acción (Ocultos en papel al imprimir) */}
      <div className="mb-4 w-full max-w-sm flex items-center gap-2 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="flex-1 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-black text-white text-xs font-bold font-sans flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir Ticket Térmico</span>
        </button>

        <button
          type="button"
          onClick={handleCopyText}
          className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer border border-slate-200 shrink-0"
          title="Copiar texto del ticket"
        >
          {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>

      {/* Contenedor del Ticket Térmico en Blanco y Negro (Ahorro de Tinta Térmica) */}
      <div
        ref={receiptRef}
        className="printable-receipt w-full max-w-sm bg-white text-black p-6 border border-slate-300 rounded-2xl shadow-sm font-mono text-xs leading-tight print:border-none print:shadow-none print:p-0 print:m-0 print:w-full"
      >
        
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
