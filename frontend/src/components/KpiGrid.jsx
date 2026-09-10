import React from 'react';
import { DollarSign, ShoppingBag, Receipt, ArrowUpRight, TrendingUp, CreditCard, Clock } from 'lucide-react';

export default function KpiGrid({ tenant }) {
  const brandColor = tenant?.brand_color || '#0F172A';

  const stats = [
    {
      title: 'Ventas Totales del Día',
      value: '$ 335,000 COP',
      change: '+18.4% vs ayer',
      icon: <DollarSign className="w-5 h-5" style={{ color: brandColor }} />,
      desc: 'Cierre parcial de caja'
    },
    {
      title: 'Facturas Emitidas',
      value: '5 Comprobantes',
      change: '100% Timbradas',
      icon: <Receipt className="w-5 h-5 text-emerald-600" />,
      desc: 'Sin errores de emisión'
    },
    {
      title: 'Ticket Promedio',
      value: '$ 67,000 COP',
      change: '3.4 ítems / orden',
      icon: <ShoppingBag className="w-5 h-5 text-indigo-600" />,
      desc: tenant?.businessType || 'Comercio General'
    },
    {
      title: 'IVA Recaudado (19%)',
      value: '$ 53,487 COP',
      change: 'Reglamentario',
      icon: <TrendingUp className="w-5 h-5 text-amber-600" />,
      desc: 'Impuesto generado'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-flat-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: brandColor }} />
            <span>Resumen Financiero de Caja y Ventas del Día</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Sucursal: <strong className="text-slate-800">Salón Principal</strong> · Empresa: <strong style={{ color: brandColor }}>{tenant?.nombre || 'Mi Negocio'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Caja Abierta · Turno Tarde</span>
          </span>
        </div>
      </div>

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div 
            key={i} 
            className="p-5 rounded-3xl bg-white border border-slate-200 shadow-flat-sm flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
                {stat.title}
              </span>
              <div className="p-2 rounded-2xl bg-slate-50 border border-slate-100">
                {stat.icon}
              </div>
            </div>

            <div>
              <span className="text-2xl font-black text-slate-900 font-display block">
                {stat.value}
              </span>
              <div className="flex items-center gap-1 mt-1 text-xs">
                <span className="font-bold text-emerald-600 flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  {stat.change}
                </span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-400 font-sans flex items-center justify-between">
              <span>{stat.desc}</span>
              <Clock className="w-3.5 h-3.5 text-slate-400" />
            </div>
          </div>
        ))}
      </div>

      {/* Desglose de Medios de Pago */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-flat-sm p-6 space-y-4">
        <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
          <CreditCard className="w-4 h-4" style={{ color: brandColor }} />
          <span>Ventas por Medio de Pago en Caja</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 block font-medium">Tarjetas Débito / Crédito</span>
            <span className="text-lg font-bold text-slate-900 block">$ 142,000 COP</span>
            <span className="text-[11px] text-slate-400 block">2 transacciones</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 block font-medium">Transferencia Bancaria</span>
            <span className="text-lg font-bold text-slate-900 block">$ 145,000 COP</span>
            <span className="text-[11px] text-slate-400 block">1 transacción</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-slate-500 block font-medium">Efectivo en Caja</span>
            <span className="text-lg font-bold text-slate-900 block">$ 48,000 COP</span>
            <span className="text-[11px] text-slate-400 block">2 transacciones</span>
          </div>
        </div>
      </div>
    </div>
  );
}
