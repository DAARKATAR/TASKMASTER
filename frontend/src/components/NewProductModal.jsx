import React, { useState } from 'react';
import { X, Loader2, Boxes, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

const EMOJI_OPTIONS = ['☕', '🥐', '🍰', '🥖', '🥪', '🥗', '🍔', '🍕', '👕', '💊', '📦', '🥑', '🍷', '🍎'];
const RUBRO_OPTIONS = [
  'Cafetería & Repostería',
  'Restaurante & Fast Food',
  'Boutique & Retail',
  'Farmacia & Salud',
  'Minimarket & Abarrotes',
  'General'
];

export default function NewProductModal({ isOpen, onClose, tenant, onProductCreated }) {
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [rubro, setRubro] = useState('Cafetería & Repostería');
  const [emoji, setEmoji] = useState('☕');
  const [stock, setStock] = useState('50');
  const [desc, setDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !precio) {
      setError('Por favor completa el nombre y el precio');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/tenants/${tenant.id}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          precio: parseFloat(precio),
          rubro,
          emoji,
          stock: parseInt(stock, 10) || 0,
          descripcion: desc.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar producto');

      onProductCreated(data.product);
      onClose();
      // Reset form
      setNombre('');
      setPrecio('');
      setDesc('');
    } catch (err) {
      console.error('Error creando producto:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm"
            style={{ backgroundColor: `${tenant?.brand_color || '#4F46E5'}15` }}
          >
            <Boxes className="w-6 h-6" style={{ color: tenant?.brand_color || '#4F46E5' }} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900">Nuevo Producto para {tenant?.nombre}</h3>
            <p className="text-xs text-slate-500">Se guardará directamente en tu base de datos de Neon</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Producto</label>
            <input
              type="text"
              required
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Café Espresso Doble"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Precio Unitario ($)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                placeholder="4.50"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Stock Inicial</label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="50"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Rubro / Categoría</label>
            <select
              value={rubro}
              onChange={(e) => setRubro(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
            >
              {RUBRO_OPTIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Icono / Emoji</label>
            <div className="flex flex-wrap gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
              {EMOJI_OPTIONS.map((em) => (
                <button
                  type="button"
                  key={em}
                  onClick={() => setEmoji(em)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-transform ${
                    emoji === em ? 'bg-white shadow-md scale-110 border border-slate-300' : 'hover:bg-slate-200'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción Opcional</label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="Notas breves del producto"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 hover:opacity-95 transition-all disabled:opacity-50"
              style={{ backgroundColor: tenant?.brand_color || '#0F172A' }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              <span>Guardar en Catálogo</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
