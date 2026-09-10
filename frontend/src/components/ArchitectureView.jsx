import React from 'react';
import { Database, ShieldCheck, Lock, Layers, CheckCircle2 } from 'lucide-react';

export default function ArchitectureView({ tenants }) {
  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-flat-sm">
        <div className="flex items-center gap-2.5 mb-2">
          <Layers className="w-5 h-5 text-slate-800" />
          <h3 className="text-lg font-bold font-display text-slate-900">
            Aislamiento Estricto de Datos por Inquilino
          </h3>
        </div>
        <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">
          Para garantizar confidencialidad estricta entre franquicias y negocios de marca blanca, el motor no utiliza un simple discriminador en tablas compartidas. Cada inquilino dispone de su propio entorno de datos aislado, y cada petición inicia fijando la ruta de búsqueda de forma atómica:
        </p>
        <div className="my-3 p-3.5 bg-slate-900 rounded-2xl border border-slate-800 font-mono text-xs text-emerald-400">
          BEGIN; SET LOCAL search_path TO "tenant_tortasysnacks", public;
        </div>
      </div>

      {/* 3 Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-flat-sm space-y-2">
          <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-700 border border-pink-200 flex items-center justify-center font-bold text-xs font-mono">
            01
          </div>
          <h4 className="text-sm font-bold text-slate-900">Resolución & Caché L1</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            El middleware <code>tenantResolver</code> extrae el slug de ruta <code>/ws/:tenantId</code> y verifica la caché en memoria (TTL 5 min) para evitar sobrecargar el motor de base de datos.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-flat-sm space-y-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-xs font-mono">
            02
          </div>
          <h4 className="text-sm font-bold text-slate-900">Aislamiento Transaccional</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            Cada transacción POS opera en un espacio de nombres estrictamente confinado. No existen rutas cruzadas ni fugas entre comercios.
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-flat-sm space-y-2">
          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 flex items-center justify-center font-bold text-xs font-mono">
            03
          </div>
          <h4 className="text-sm font-bold text-slate-900">Seguridad & Mitigación XML</h4>
          <p className="text-xs text-slate-600 leading-relaxed">
            El parser SOAP desactiva entidades externas y DTDs, previniendo ataques Billion Laughs y asegurando la integridad de las transacciones.
          </p>
        </div>
      </div>

      {/* Table of active tenants */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-flat-sm p-6">
        <h4 className="text-sm font-bold font-display text-slate-900 mb-4 flex items-center gap-2">
          <Database className="w-4 h-4 text-slate-800" />
          <span>Entornos de Almacenamiento Aprovisionados por Inquilino</span>
        </h4>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono">
                <th className="pb-3 font-semibold">Tenant Slug</th>
                <th className="pb-3 font-semibold">Razón Social / Marca</th>
                <th className="pb-3 font-semibold">Esquema Aislado</th>
                <th className="pb-3 font-semibold">Color Marca</th>
                <th className="pb-3 font-semibold">Endpoint SOAP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 text-pink-700 font-bold">{t.id}</td>
                  <td className="py-3 font-sans font-semibold text-slate-900">{t.nombre}</td>
                  <td className="py-3 text-slate-600">
                    <span className="px-2 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-[11px]">
                      {t.schema_name}
                    </span>
                  </td>
                  <td className="py-3 text-slate-600 flex items-center gap-2">
                    <span 
                      className="w-3.5 h-3.5 rounded-full inline-block border border-slate-300 shadow-inner"
                      style={{ backgroundColor: t.brand_color }}
                    />
                    <span>{t.brand_color}</span>
                  </td>
                  <td className="py-3 text-slate-500 font-sans">
                    <code className="text-pink-600 bg-pink-50 px-2 py-0.5 rounded">/ws/{t.id}</code>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
