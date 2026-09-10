import React from 'react';
import { Receipt, CheckCircle, QrCode, Printer, ShieldCheck, Tag } from 'lucide-react';

export default function PosReceiptCard({ tenant, invoiceData }) {
  const brandColor = tenant?.brand_color || '#F97316';
  const numeroFactura = invoiceData?.numero_factura || 'FAC-1001';
  const cliente = invoiceData?.cliente || 'Restaurante La Casona Gourmet S.A.';
  const subtotal = invoiceData?.subtotal ? Number(invoiceData.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 }) : '2,974.14';
  const impuestos = invoiceData?.impuestos ? Number(invoiceData.impuestos).toLocaleString('es-MX', { minimumFractionDigits: 2 }) : '475.86';
  const total = invoiceData?.total ? Number(invoiceData.total).toLocaleString('es-MX', { minimumFractionDigits: 2 }) : '3,450.00';
  const folioFiscal = invoiceData?.folio_fiscal || 'CUFE-POS-9842-87FA-2026';
  const itemsCount = invoiceData?.items_count || 6;

  return (
    <div className="w-full flex justify-center py-2">
      <div className="relative w-full max-w-md rounded-2xl bg-dark-900/90 border border-white/15 backdrop-blur-2xl p-6 shadow-2xl overflow-hidden group">
        
        {/* Barra de Acento Superior con el Color del Inquilino POS */}
        <div 
          className="absolute top-0 left-0 right-0 h-2 transition-colors duration-500"
          style={{ backgroundColor: brandColor }}
        />

        {/* Encabezado del Ticket POS */}
        <div className="flex items-start justify-between pb-4 border-b border-dashed border-white/15">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span 
                className="w-3 h-3 rounded-full inline-block"
                style={{ backgroundColor: brandColor }}
              />
              <h4 className="font-display font-extrabold text-white text-base tracking-wide uppercase">
                {tenant?.nombre || 'SISTEMA POS'}
              </h4>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">
              NIT / RUC: 901.448.291-4 · Terminal POS #04
            </p>
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
            <CheckCircle className="w-3 h-3 text-emerald-400" />
            CONTROL INTERNO
          </span>
        </div>

        {/* Datos Principales de la Factura */}
        <div className="grid grid-cols-2 gap-3 py-3 text-xs border-b border-dashed border-white/15 font-mono">
          <div>
            <span className="text-[10px] text-slate-500 block">COMPROBANTE</span>
            <strong className="text-white text-sm font-bold text-cyan-400">{numeroFactura}</strong>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-500 block">FECHA & HORA</span>
            <span className="text-slate-300 text-xs">Hoy, 18:45:12</span>
          </div>
          <div className="col-span-2">
            <span className="text-[10px] text-slate-500 block">ADQUIRIENTE / CLIENTE</span>
            <strong className="text-slate-200 truncate block text-xs font-sans font-semibold">
              {cliente}
            </strong>
          </div>
        </div>

        {/* Desglose de Ítems Resumido */}
        <div className="py-3 space-y-2 border-b border-dashed border-white/15 text-xs">
          <div className="flex justify-between text-slate-400 text-[11px]">
            <span>Cant. Concepto</span>
            <span>Subtotal</span>
          </div>
          <div className="flex justify-between text-slate-200 font-medium text-xs">
            <span className="truncate max-w-[240px]">Consumo Punto de Venta ({itemsCount} ítems)</span>
            <span className="font-mono text-slate-300">$ {subtotal}</span>
          </div>
          <div className="flex justify-between text-slate-400 text-[11px] font-mono">
            <span>Impuestos (IVA 16% / Impoconsumo)</span>
            <span className="text-slate-300">$ {impuestos}</span>
          </div>
        </div>

        {/* Total Final Destacado */}
        <div className="py-4 flex items-baseline justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            TOTAL FACTURADO
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black font-display text-white tracking-tight" style={{ color: brandColor }}>
              $ {total}
            </span>
            <span className="text-xs font-bold text-slate-400">COP/USD</span>
          </div>
        </div>

        {/* Folio de Registro Interno POS */}
        <div className="pt-3 border-t border-dashed border-white/15 flex items-center justify-between text-[10px] font-mono text-slate-400">
          <div className="space-y-0.5">
            <div className="flex items-center gap-1 text-slate-300 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
              <span>Registro Interno POS (Sin Certificación Fiscal)</span>
            </div>
            <span className="text-slate-500 truncate block max-w-[240px]">
              {folioFiscal}
            </span>
          </div>

          <div className="w-9 h-9 p-1 rounded bg-white/10 flex items-center justify-center text-white">
            <QrCode className="w-6 h-6" />
          </div>
        </div>

      </div>
    </div>
  );
}
