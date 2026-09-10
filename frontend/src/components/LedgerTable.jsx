import React, { useState } from 'react';
import { FileText, Search, Printer, CheckCircle2, Calendar, User, DollarSign, Filter, AlertCircle } from 'lucide-react';
import BakeryReceiptTicket from './BakeryReceiptTicket';

export default function LedgerTable({ tenant, onConsultSoap, loading, lastResponse }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const brandColor = tenant?.brand_color || '#0F172A';
  const prefix = tenant?.id === 'tortasysnacks' ? 'REC' : 'REC';

  const sampleInvoices = [
    { 
      id: `${prefix}-1001`, 
      client: 'Cliente Frecuente - Salón Principal', 
      date: 'Hoy, 18:30', 
      terminal: 'Caja Principal #01', 
      amount: 60000, 
      items_count: 3, 
      status: 'COBRADO / REGISTRADO',
      folio: `INT-${prefix}-9921-2026`,
      payment_method: 'Tarjeta Débito'
    },
    { 
      id: `${prefix}-1002`, 
      client: 'Eventos & Banquetería S.A.S.', 
      date: 'Hoy, 17:15', 
      terminal: 'Caja Principal #01', 
      amount: 145000, 
      items_count: 6, 
      status: 'COBRADO / REGISTRADO',
      folio: `INT-${prefix}-9922-2026`,
      payment_method: 'Transferencia Bancaria'
    },
    { 
      id: `${prefix}-1003`, 
      client: 'Mariana Gómez (Mostrador)', 
      date: 'Hoy, 15:40', 
      terminal: 'Caja Rápida #02', 
      amount: 28500, 
      items_count: 2, 
      status: 'COBRADO / REGISTRADO',
      folio: `INT-${prefix}-9923-2026`,
      payment_method: 'Efectivo'
    },
    { 
      id: `${prefix}-1004`, 
      client: 'Comercial & Distribuciones San Marcos', 
      date: 'Hoy, 14:10', 
      terminal: 'Caja Principal #01', 
      amount: 82000, 
      items_count: 4, 
      status: 'COBRADO / REGISTRADO',
      folio: `INT-${prefix}-9924-2026`,
      payment_method: 'Tarjeta Crédito'
    },
    { 
      id: `${prefix}-1005`, 
      client: 'Carlos Ramírez (Para Llevar)', 
      date: 'Hoy, 11:25', 
      terminal: 'Caja Rápida #02', 
      amount: 19500, 
      items_count: 2, 
      status: 'COBRADO / REGISTRADO',
      folio: `INT-${prefix}-9925-2026`,
      payment_method: 'Efectivo'
    }
  ];

  const filteredInvoices = sampleInvoices.filter(inv => 
    inv.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.folio.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Barra de Filtros y Búsqueda */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-flat-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Buscar por comprobante (ej. ${prefix}-1001), cliente o folio interno...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white transition-all"
            />
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline font-medium">
            Mostrando <strong>{filteredInvoices.length}</strong> comprobantes
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onConsultSoap && onConsultSoap(`${prefix}-1001`)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 shadow-sm disabled:opacity-50"
            style={{ backgroundColor: brandColor }}
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{loading ? 'Consultando...' : `Re-imprimir ${prefix}-1001`}</span>
          </button>
        </div>
      </div>

      {/* Grid: Tabla de Comprobantes + Visor de Recibo Seleccionado */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Tabla Principal */}
        <div className="lg:col-span-8 rounded-3xl bg-white border border-slate-200 shadow-flat-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900 font-display flex items-center gap-2">
                <FileText className="w-4 h-4" style={{ color: brandColor }} />
                <span>Registro de Comprobantes de Venta (Control Interno POS)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Historial de cobros locales de caja para <strong>{tenant?.nombre || 'Mi Negocio'}</strong>
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
              ● Control Interno
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 uppercase tracking-wider font-mono text-[11px]">
                  <th className="pb-3 font-semibold">Comprobante</th>
                  <th className="pb-3 font-semibold">Cliente</th>
                  <th className="pb-3 font-semibold">Fecha / Hora</th>
                  <th className="pb-3 font-semibold">Método Pago</th>
                  <th className="pb-3 font-semibold text-right">Total (COP)</th>
                  <th className="pb-3 font-semibold text-center">Estado</th>
                  <th className="pb-3 font-semibold text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => {
                  const isSelected = selectedInvoice?.id === inv.id;
                  return (
                    <tr 
                      key={inv.id} 
                      className="hover:bg-slate-50 transition-colors"
                      style={isSelected ? { backgroundColor: `${brandColor}0E` } : {}}
                    >
                      <td className="py-3.5 font-mono font-bold" style={{ color: brandColor }}>
                        {inv.id}
                      </td>
                      <td className="py-3.5 font-medium text-slate-800">
                        <span className="truncate max-w-[180px] block font-sans">{inv.client}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">{inv.terminal}</span>
                      </td>
                      <td className="py-3.5 text-slate-500 whitespace-nowrap">
                        {inv.date}
                      </td>
                      <td className="py-3.5 text-slate-600">
                        {inv.payment_method}
                      </td>
                      <td className="py-3.5 text-right font-bold text-slate-900 font-mono">
                        ${inv.amount.toLocaleString('es-CO')}
                      </td>
                      <td className="py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Cobrado</span>
                        </span>
                      </td>
                      <td className="py-3.5 text-center">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:text-white text-slate-700 transition-colors"
                          style={isSelected ? { backgroundColor: brandColor, color: '#FFFFFF' } : {}}
                        >
                          Ver Ticket
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              Los comprobantes aquí listados son documentos de <strong>control interno de caja</strong> y no cuentan con certificación fiscal oficial gubernamental.
            </span>
          </div>
        </div>

        {/* Visor de Ticket Térmico al costado */}
        <div className="lg:col-span-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
              Comprobante Seleccionado:
            </span>
            {selectedInvoice && (
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="text-xs font-semibold hover:underline"
                style={{ color: brandColor }}
              >
                Ver actual
              </button>
            )}
          </div>

          <BakeryReceiptTicket 
            tenant={tenant}
            invoiceData={selectedInvoice ? {
              numero_factura: selectedInvoice.id,
              cliente: selectedInvoice.client,
              subtotal: (selectedInvoice.amount / 1.19).toFixed(2),
              impuestos: (selectedInvoice.amount - (selectedInvoice.amount / 1.19)).toFixed(2),
              total: selectedInvoice.amount.toFixed(2),
              estado: selectedInvoice.status,
              folio_fiscal: selectedInvoice.folio,
              items_count: selectedInvoice.items_count,
              emisor: tenant?.nombre || 'Mi Negocio POS'
            } : lastResponse} 
          />
        </div>

      </div>

    </div>
  );
}
