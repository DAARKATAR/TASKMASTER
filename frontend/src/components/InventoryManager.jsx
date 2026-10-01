import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Search,
  PackagePlus,
  AlertTriangle,
  CheckCircle,
  Plus,
  Minus,
  DollarSign,
  TrendingDown,
  RefreshCw,
  Loader2,
  Tag,
  Filter
} from 'lucide-react';
import NewProductModal from './NewProductModal';
import { API_BASE_URL } from '../config/api';

export default function InventoryManager({ tenant }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRubro, setSelectedRubro] = useState('Todos');
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'low' | 'out'
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [updatingStockId, setUpdatingStockId] = useState(null);

  const brandColor = tenant?.brand_color || '#4F46E5';

  const loadProducts = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tenants/${tenant.id}/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (err) {
      console.error('Error cargando inventario:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [tenant?.id]);

  // Modificar stock rápido (+ / -)
  const handleQuickStockChange = async (product, delta) => {
    const newStock = Math.max(0, parseInt(product.stock, 10) + delta);
    setUpdatingStockId(product.id);
    try {
      // Usamos el endpoint para guardar el producto actualizado o actualizar localmente
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, stock: newStock } : p))
      );
      // Opcional: llamada al backend para persistir
    } catch (err) {
      console.error('Error actualizando stock:', err);
    } finally {
      setUpdatingStockId(null);
    }
  };

  // Métricas de inventario
  const totalItems = products.length;
  const outOfStockCount = products.filter((p) => parseInt(p.stock, 10) <= 0).length;
  const lowStockCount = products.filter(
    (p) => parseInt(p.stock, 10) > 0 && parseInt(p.stock, 10) <= 10
  ).length;
  const totalValuation = products.reduce(
    (acc, p) => acc + (parseFloat(p.precio || 0) * (parseInt(p.stock, 10) || 0)),
    0
  );

  // Filtrado
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      (p.nombre || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.descripcion || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRubro =
      selectedRubro === 'Todos' || (p.rubro || '').toLowerCase() === selectedRubro.toLowerCase();

    const stock = parseInt(p.stock, 10) || 0;
    let matchesStock = true;
    if (stockFilter === 'low') matchesStock = stock > 0 && stock <= 10;
    if (stockFilter === 'out') matchesStock = stock <= 0;

    return matchesSearch && matchesRubro && matchesStock;
  });

  const categories = ['Todos', ...new Set(products.map((p) => p.rubro || 'General'))];

  return (
    <div className="space-y-6">
      {/* 1. KPIs del Inventario en Bodega */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-flat-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Total Artículos</span>
            <Boxes className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-black font-display text-slate-900">{totalItems}</p>
          <span className="text-[10px] text-slate-400 font-mono">En catálogo activo</span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-flat-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Valoración Total</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black font-display text-emerald-600">
            ${Math.round(totalValuation).toLocaleString('es-CO')}
          </p>
          <span className="text-[10px] text-slate-400 font-mono">Stock × Precio unitario</span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-flat-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Stock Bajo (&lt; 10)</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black font-display text-amber-600">{lowStockCount}</p>
          <span className="text-[10px] text-slate-400 font-mono">Requieren reposición</span>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-flat-sm space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold">Agotados</span>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <p className="text-2xl font-black font-display text-red-600">{outOfStockCount}</p>
          <span className="text-[10px] text-slate-400 font-mono">Ventas bloqueadas</span>
        </div>
      </div>

      {/* 2. Barra de Filtros y Acciones */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-flat-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-[260px]">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setStockFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                stockFilter === 'all' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setStockFilter('low')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                stockFilter === 'low' ? 'bg-white shadow-xs text-amber-700' : 'text-slate-600'
              }`}
            >
              Stock Bajo ({lowStockCount})
            </button>
            <button
              onClick={() => setStockFilter('out')}
              className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                stockFilter === 'out' ? 'bg-white shadow-xs text-red-700' : 'text-slate-600'
              }`}
            >
              Agotados ({outOfStockCount})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadProducts}
            disabled={loading}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Refrescar catálogo"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowNewProductModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm hover:opacity-95 transition-all cursor-pointer"
            style={{ backgroundColor: brandColor }}
          >
            <PackagePlus className="w-4 h-4" />
            <span>+ Nuevo Artículo</span>
          </button>
        </div>
      </div>

      {/* 3. Tabla de Inventario Detallada */}
      <div className="rounded-3xl bg-white border border-slate-200 shadow-flat-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center text-slate-400 text-xs space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-700" />
            <span>Cargando existencias desde Neon DB...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs space-y-3 p-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-500 text-2xl">
              📦
            </div>
            <h4 className="font-bold text-slate-800 text-sm">Sin artículos en este filtro</h4>
            <p className="text-slate-500 text-xs max-w-xs mx-auto">
              No hay productos que coincidan con la búsqueda o categoría seleccionada.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-slate-400 uppercase font-mono text-[10px] tracking-wider">
                  <th className="py-3 px-4">Artículo</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4">Precio Venta</th>
                  <th className="py-3 px-4 text-center">Existencias</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Valor Stock</th>
                  <th className="py-3 px-4 text-center">Ajuste Rápido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const stock = parseInt(p.stock, 10) || 0;
                  const price = parseFloat(p.precio || 0);
                  const isOut = stock <= 0;
                  const isLow = stock > 0 && stock <= 10;
                  const itemValuation = stock * price;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <span className="text-2xl p-1.5 rounded-xl bg-slate-100 shrink-0">
                            {p.emoji || '📦'}
                          </span>
                          <div>
                            <span className="font-bold text-slate-900 block">{p.nombre}</span>
                            {p.descripcion && (
                              <span className="text-[11px] text-slate-400 line-clamp-1">
                                {p.descripcion}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-mono text-[10px]">
                          {p.rubro || 'General'}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono font-bold text-slate-800">
                        ${price.toLocaleString('es-CO')}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span className="font-mono font-black text-sm text-slate-900">
                          {stock} uds
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono inline-flex items-center gap-1 ${
                            isOut
                              ? 'bg-red-50 text-red-700 border border-red-200'
                              : isLow
                              ? 'bg-amber-50 text-amber-800 border border-amber-300'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isOut ? (
                            'Agotado'
                          ) : isLow ? (
                            <>
                              <AlertTriangle className="w-2.5 h-2.5" /> ¡Bajo stock!
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-2.5 h-2.5" /> Disponible
                            </>
                          )}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-semibold text-slate-600">
                        ${Math.round(itemValuation).toLocaleString('es-CO')}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleQuickStockChange(p, -1)}
                            disabled={stock <= 0}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer"
                            title="Restar 1 unidad"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleQuickStockChange(p, 1)}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                            title="Sumar 1 unidad"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal para Crear Producto */}
      <NewProductModal
        isOpen={showNewProductModal}
        onClose={() => setShowNewProductModal(false)}
        tenant={tenant}
        onProductCreated={() => loadProducts()}
      />
    </div>
  );
}
