import React, { useState } from 'react';
import { Sparkles, CheckCircle, AlertCircle, Loader2, Store } from 'lucide-react';
import PosReceiptCard from './PosReceiptCard';

export default function TenantStudio({ onTenantCreated }) {
  const [nombre, setNombre] = useState('ExpressMart Cloud POS');
  const [slug, setSlug] = useState('expressmart');
  const [brandColor, setBrandColor] = useState('#EC4899');
  const [titular, setTitular] = useState('Supermercados La Estrella S.A.');
  const [saldo, setSaldo] = useState('5420.00');
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const presetColors = [
    { name: 'Naranja Gourmet', hex: '#F97316' },
    { name: 'Violeta Retail', hex: '#8B5CF6' },
    { name: 'Cyan Farma', hex: '#06B6D4' },
    { name: 'Rosa Express', hex: '#EC4899' },
    { name: 'Verde Orgánico', hex: '#10B981' },
    { name: 'Azul Corporativo', hex: '#3B82F6' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: slug,
          nombre,
          brand_color: brandColor,
          initial_titular: titular,
          initial_saldo: saldo
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al aprovisionar tenant POS');
      }

      setMessage({ type: 'success', text: data.message });
      onTenantCreated(data.tenant);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const previewTenant = {
    id: slug || 'preview',
    nombre: nombre || 'Empresa POS Preview',
    brand_color: brandColor,
    schema_name: `tenant_${slug || 'preview'}`
  };

  const previewInvoice = {
    numero_factura: 'FAC-1001',
    cliente: titular || 'Cliente Preview',
    subtotal: (parseFloat(saldo || '0') * 0.84).toFixed(2),
    impuestos: (parseFloat(saldo || '0') * 0.16).toFixed(2),
    total: saldo || '0.00',
    estado: 'TIMBRADA / APROBADA',
    folio_fiscal: `CUFE-${(slug || 'PREVIEW').toUpperCase()}-9921-2026`,
    items_count: 5
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      
      {/* Formulario */}
      <div className="p-6 rounded-2xl bg-dark-900/60 border border-white/10 backdrop-blur-xl shadow-glass">
        <div className="flex items-center gap-2 mb-2">
          <Store className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-bold font-display text-white">
            Studio Marca Blanca POS & Aprovisionador de Esquemas
          </h3>
        </div>
        <p className="text-xs text-slate-400 mb-6">
          Aprovisiona una nueva marca/franquicia de software POS. Se creará automáticamente un entorno aislado con su tabla de facturas, contrato WSDL 1.1 y endpoint SOAP listos para emitir comprobantes internos.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Razón Social / Marca de la Empresa POS:
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => {
                setNombre(e.target.value);
                setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20));
              }}
              className="w-full px-3.5 py-2.5 bg-dark-950/80 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-primary"
              placeholder="Ej. ExpressMart Cloud POS"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Slug URL / Tenant ID:
            </label>
            <div className="flex items-center">
              <span className="px-3 py-2.5 bg-white/5 border border-r-0 border-white/10 rounded-l-xl text-xs font-mono text-slate-400">
                /ws/
              </span>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                className="w-full px-3.5 py-2.5 bg-dark-950/80 border border-white/10 rounded-r-xl text-sm font-mono text-cyan-400 focus:outline-none focus:border-brand-primary"
                placeholder="expressmart"
                required
                pattern="[a-z0-9_]{2,30}"
              />
            </div>
            <span className="text-[11px] text-slate-500 font-mono mt-1 block">
              Esquema DDL generado: tenant_{slug || 'slug'}
            </span>
          </div>

          {/* Color Picker & Presets */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Color de Marca del Ticket POS:
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-10 h-10 rounded-xl bg-transparent border-0 cursor-pointer"
              />
              <input
                type="text"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-24 px-2.5 py-2 bg-dark-950/80 border border-white/10 rounded-xl text-xs font-mono text-white text-center"
              />
              <div className="flex items-center gap-1.5 flex-wrap">
                {presetColors.map((c) => (
                  <button
                    type="button"
                    key={c.hex}
                    onClick={() => setBrandColor(c.hex)}
                    className="w-6 h-6 rounded-full border border-white/20 hover:scale-110 transition-transform"
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Cliente de Factura Inicial (FAC-1001):
              </label>
              <input
                type="text"
                value={titular}
                onChange={(e) => setTitular(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-dark-950/80 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-primary"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                Total Facturado (COP/USD):
              </label>
              <input
                type="number"
                step="0.01"
                value={saldo}
                onChange={(e) => setSaldo(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-dark-950/80 border border-white/10 rounded-xl text-sm font-mono text-emerald-400 focus:outline-none focus:border-brand-primary"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-bold text-sm text-white shadow-glow transition-all flex items-center justify-center gap-2"
              style={{
                backgroundColor: brandColor,
                boxShadow: `0 4px 20px ${brandColor}66`
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Aprovisionando Esquema Seguro...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>🚀 Aprovisionar Marca POS</span>
                </>
              )}
            </button>
          </div>

          {message && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              message.type === 'success' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {message.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{message.text}</span>
            </div>
          )}
        </form>
      </div>

      {/* Previsualización en Tiempo Real del Ticket */}
      <div className="p-6 rounded-2xl bg-dark-900/40 border border-white/10 backdrop-blur-xl flex flex-col items-center justify-center text-center">
        <span className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest mb-4">
          Previsualización del Comprobante Fiscal POS
        </span>

        <PosReceiptCard tenant={previewTenant} invoiceData={previewInvoice} />

        <p className="text-xs text-slate-500 mt-4 max-w-sm">
          Al presionar "Aprovisionar Marca POS", el backend creará el esquema de datos aislado y activará de inmediato el registro para este inquilino.
        </p>
      </div>

    </div>
  );
}
