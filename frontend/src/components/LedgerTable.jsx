import React, { useState } from 'react';
import { FileText, Search, Printer, CheckCircle2, Calendar, User, DollarSign, Filter, AlertCircle, RefreshCw } from 'lucide-react';
import BakeryReceiptTicket from './BakeryReceiptTicket';

export default function LedgerTable({ tenant, invoices = [], onConsultSoap, loading, lastResponse, onRefresh }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  const brandColor = tenant?.brand_color || '#0F172A';

  const filteredInvoices = invoices.filter(inv => {
    const term = searchTerm.toLowerCase();
    const num = (inv.numero_factura || inv.id || '').toString().toLowerCase();
    const cli = (inv.cliente || '').toLowerCase();
    const fol = (inv.folio_fiscal || '').toLowerCase();
    return num.includes(term) || cli.includes(term) || fol.includes(term);
  });

  return (
    <div className="space-y-6">
      
      {/* Barra de Filtros y Búsqueda */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-flat-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por comprobante (ej. REC-1001), cliente o folio fiscal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white transition-all"
            />
          </div>
          <span className="text-xs text-slate-500 hidden sm:inline font-medium">
            Mostrando <strong>{filteredInvoices.length}</strong> comprobantes reales
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
              title="Actualizar comprobantes"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          {filteredInvoices.length > 0 && (
            <button
              onClick={() => onConsultSoap && onConsultSoap(filteredInvoices[0].numero_factura)}
              disabled={loading}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 shadow-sm disabled:opacity-50"
              style={{ backgroundColor: brandColor }}
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{loading ? 'Consultando...' : `Consultar SOAP Último (${filteredInvoices[0].numero_factura})`}</span>
            </button>
          )}
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
                <span>Registro de Comprobantes de Venta</span>
              </h3>
              <p className="text-xs text-slate-500">
                Historial auditado de transacciones para <strong>{tenant?.nombre || 'Mi Negocio'}</strong>
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Datos en Vivo</span>
            </span>
          </div>

          {invoices.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                <FileText className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 font-display">Aún no hay comprobantes emitidos</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Las ventas que registres en el <strong>Terminal POS</strong> se guardarán de forma segura y aparecerán aquí automáticamente en tiempo real.
              </p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No se encontraron comprobantes que coincidan con "<strong>{searchTerm}</strong>".
            </div>
          ) : (
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
                    const isSelected = selectedInvoice?.numero_factura === inv.numero_factura;
                    return (
                      <tr 
                        key={inv.id || inv.numero_factura} 
                        className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-slate-100/70 font-semibold' : ''}`}
                      >
                        <td className="py-3 font-mono font-bold text-slate-800">
                          {inv.numero_factura}
                        </td>
                        <td className="py-3 text-slate-700">
                          {inv.cliente}
                        </td>
                        <td className="py-3 text-slate-500">
                          {new Date(inv.created_at || Date.now()).toLocaleDateString('es-CO', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3 text-slate-600">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                            {inv.metodo_pago || 'Efectivo'}
                          </span>
                        </td>
                        <td className="py-3 text-right font-mono font-bold text-slate-900">
                          ${parseFloat(inv.total || 0).toLocaleString('es-CO')}
                        </td>
                        <td className="py-3 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {inv.estado || 'REGISTRADA'}
                          </span>
                        </td>
                        <td className="py-3 text-center">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                            title="Ver Comprobante"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Comprobantes almacenados y protegidos con alta disponibilidad en tu entorno exclusivo de negocio.
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
                Limpiar selección
              </button>
            )}
          </div>

          <BakeryReceiptTicket 
            tenant={tenant}
            invoiceData={selectedInvoice ? {
              numero_factura: selectedInvoice.numero_factura,
              cliente: selectedInvoice.cliente,
              subtotal: parseFloat(selectedInvoice.subtotal || 0).toFixed(2),
              impuestos: parseFloat(selectedInvoice.impuestos || 0).toFixed(2),
              total: parseFloat(selectedInvoice.total || 0).toFixed(2),
              estado: selectedInvoice.estado || 'TIMBRADA / APROBADA',
              folio_fiscal: selectedInvoice.folio_fiscal,
              items_count: selectedInvoice.items_count || 1,
              metodo_pago: selectedInvoice.metodo_pago,
              emisor: tenant?.nombre || 'Mi Negocio POS'
            } : lastResponse} 
          />
        </div>

      </div>

    </div>
  );
}
