import React from 'react';
import { DollarSign, ShoppingBag, Receipt, ArrowUpRight, TrendingUp, CreditCard, Clock, RefreshCw, BarChart3, AlertCircle } from 'lucide-react';

export default function KpiGrid({ tenant, metrics, loading, onRefresh }) {
  const brandColor = tenant?.brand_color || '#0F172A';

  const totalVentas = metrics?.total_ventas || 0;
  const totalComprobantes = metrics?.total_comprobantes || 0;
  const ticketPromedio = metrics?.ticket_promedio || 0;
  const totalIva = metrics?.total_iva || 0;
  const desglosePagos = metrics?.desglose_pagos || [];
  const ventasPorDia = metrics?.ventas_por_dia || [];

  const stats = [
    {
      title: 'Ventas Totales Registradas',
      value: `$ ${totalVentas.toLocaleString('es-CO')} COP`,
      change: totalComprobantes > 0 ? `${totalComprobantes} ventas procesadas` : 'Sin ventas aún',
      icon: <DollarSign className="w-5 h-5" style={{ color: brandColor }} />,
      desc: 'Suma acumulada de comprobantes'
    },
    {
      title: 'Comprobantes Emitidos',
      value: `${totalComprobantes} ${totalComprobantes === 1 ? 'Comprobante' : 'Comprobantes'}`,
      change: totalComprobantes > 0 ? '100% Registradas' : 'Esperando primera orden',
      icon: <Receipt className="w-5 h-5 text-emerald-600" />,
      desc: 'Control de caja seguro'
    },
    {
      title: 'Ticket Promedio',
      value: `$ ${ticketPromedio.toLocaleString('es-CO')} COP`,
      change: totalComprobantes > 0 ? 'Promedio por cliente' : '$0 COP',
      icon: <ShoppingBag className="w-5 h-5 text-indigo-600" />,
      desc: tenant?.businessType || 'Comercio General'
    },
    {
      title: 'IVA Generado (19%)',
      value: `$ ${Math.round(totalIva).toLocaleString('es-CO')} COP`,
      change: 'Cálculo reglamentario',
      icon: <TrendingUp className="w-5 h-5 text-amber-600" />,
      desc: 'Impuesto estimado en ventas'
    }
  ];

  // Cálculo para la gráfica de barras en SVG
  const maxVentaDia = ventasPorDia.length > 0 
    ? Math.max(...ventasPorDia.map(v => v.total), 1) 
    : 1;

  return (
    <div className="space-y-6">
      {/* Header con botón de recarga */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-flat-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
            <TrendingUp className="w-5 h-5" style={{ color: brandColor }} />
            <span>Métricas Financieras y Auditoría de Ventas</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Comercio: <strong style={{ color: brandColor }}>{tenant?.nombre || 'Mi Negocio'}</strong> · Estado: <strong className="text-emerald-700">En Línea</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>{loading ? 'Calculando...' : 'Actualizar'}</span>
            </button>
          )}

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>Cálculos en Tiempo Real</span>
          </span>
        </div>
      </div>

      {/* Grid de Métricas Principales */}
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
                <span className={`font-bold flex items-center ${totalComprobantes > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {totalComprobantes > 0 && <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />}
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

      {/* Gráfica de Tendencia de Ventas Reales */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-flat-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
              <BarChart3 className="w-4 h-4" style={{ color: brandColor }} />
              <span>Volumen de Ventas por Día (Datos Reales)</span>
            </h4>
            <p className="text-xs text-slate-500">
              Historial dinámico generado automáticamente a partir de las transacciones emitidas
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {ventasPorDia.length} {ventasPorDia.length === 1 ? 'día con ventas' : 'días con ventas'}
          </span>
        </div>

        {ventasPorDia.length === 0 ? (
          <div className="py-12 text-center rounded-2xl bg-slate-50 border border-dashed border-slate-200 space-y-2">
            <BarChart3 className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">Aún no hay suficiente historial para graficar</p>
            <p className="text-[11px] text-slate-400">
              Las barras de ventas aparecerán aquí automáticamente en cuanto registres ventas en el POS.
            </p>
          </div>
        ) : (
          <div className="pt-4 space-y-2">
            <div className="h-44 flex items-end gap-3 sm:gap-6 px-2 border-b border-slate-200 pb-2">
              {ventasPorDia.map((v, idx) => {
                const heightPercent = Math.max(Math.round((v.total / maxVentaDia) * 100), 12);
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                    {/* Tooltip con monto real al pasar el cursor */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-slate-900 text-white text-[10px] font-mono py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap shadow-lg z-10">
                      ${v.total.toLocaleString('es-CO')} ({v.transacciones} {v.transacciones === 1 ? 'venta' : 'ventas'})
                    </div>

                    <div className="w-full max-w-[48px] bg-slate-100 rounded-t-xl overflow-hidden flex items-end h-36">
                      <div 
                        className="w-full rounded-t-xl transition-all duration-500 group-hover:opacity-80"
                        style={{ 
                          height: `${heightPercent}%`,
                          backgroundColor: brandColor 
                        }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 text-center truncate max-w-[60px]">
                      {v.label || v.dia}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono px-2">
              <span>Inicio del registro</span>
              <span>Total graficado: ${totalVentas.toLocaleString('es-CO')} COP</span>
            </div>
          </div>
        )}
      </div>

      {/* Desglose de Medios de Pago Real */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-flat-sm p-6 space-y-4">
        <h4 className="text-sm font-bold text-slate-900 font-display flex items-center gap-2">
          <CreditCard className="w-4 h-4" style={{ color: brandColor }} />
          <span>Ventas Reales por Medio de Pago en Caja</span>
        </h4>

        {desglosePagos.length === 0 ? (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
            No se han registrado cobros aún con ningún medio de pago.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-sans">
            {desglosePagos.map((p, idx) => {
              const porcentaje = totalVentas > 0 ? Math.round((p.total / totalVentas) * 100) : 0;
              return (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 block font-semibold">{p.metodo}</span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700">
                      {porcentaje}%
                    </span>
                  </div>
                  <span className="text-lg font-black text-slate-900 block font-display">
                    $ {p.total.toLocaleString('es-CO')} COP
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    {p.transacciones} {p.transacciones === 1 ? 'transacción registrada' : 'transacciones registradas'}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
