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
  Trash2,
  Edit2,
  Check,
  X,
  Filter,
  Image as ImageIcon
} from 'lucide-react';
import NewProductModal from './NewProductModal';
import { API_BASE_URL } from '../config/api';
import { useNotification } from '../context/NotificationContext';

export default function InventoryManager({ tenant }) {
  const { notifySuccess, notifyError, confirm } = useNotification();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRubro, setSelectedRubro] = useState('Todos');
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'low' | 'out'
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [updatingStockId, setUpdatingStockId] = useState(null);
  
  // Edición rápida de producto
  const [editingProduct, setEditingProduct] = useState(null);
  const [editPrice, setEditPrice] = useState('');
  const [editStock, setEditStock] = useState('');
  const [editName, setEditName] = useState('');
  const [editImage, setEditImage] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  const brandColor = tenant?.brand_color || '#4F46E5';

  const loadProducts = async () => {
    if (!tenant?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tenants/${tenant.id}/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error cargando inventario:', err);
      notifyError('No se pudo conectar con la base de datos de inventario en Neon.', 'Error de Conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [tenant?.id]);

  // Modificar stock rápido (+ / -) con persistencia real en Neon DB
  const handleQuickStockChange = async (product, delta) => {
    const newStock = Math.max(0, (parseInt(product.stock, 10) || 0) + delta);
    setUpdatingStockId(product.id);

    // Optimistic UI update
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stock: newStock } : p))
    );

    try {
      const res = await fetch(`${API_BASE_URL}/api/tenants/${tenant.id}/products/${product.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock: newStock })
      });

      if (!res.ok) {
        throw new Error('Error al guardar en el servidor');
      }
      notifySuccess(`Stock de "${product.nombre}" actualizado a ${newStock} uds.`, 'Inventario Actualizado');
    } catch (err) {
      console.error('Error actualizando stock en Neon:', err);
      notifyError('No se pudo actualizar el stock en Neon DB', 'Fallo al Actualizar');
      loadProducts();
    } finally {
      setUpdatingStockId(null);
    }
  };

  // Eliminar producto con modal de confirmación personalizado
  const handleDeleteProduct = async (product) => {
    const confirmed = await confirm({
      title: '¿Eliminar Artículo?',
      message: `¿Estás seguro de que deseas eliminar permanentemente el producto "${product.nombre}" del catálogo de ${tenant?.nombre}?`,
      confirmText: 'Sí, Eliminar de DB',
      cancelText: 'Cancelar',
      type: 'danger'
    });
    if (!confirmed) return;

    setProducts((prev) => prev.filter((p) => p.id !== product.id));

    try {
      const res = await fetch(`${API_BASE_URL}/api/tenants/${tenant.id}/products/${product.id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Error al eliminar');
      notifySuccess(`Producto "${product.nombre}" eliminado correctamente.`, 'Producto Eliminado');
    } catch (err) {
      console.error('Error eliminando producto:', err);
      notifyError('No se pudo eliminar el producto de Neon DB', 'Error de Base de Datos');
      loadProducts();
    }
  };

  // Iniciar edición de producto
  const startEditing = (product) => {
    setEditingProduct(product);
    setEditName(product.nombre || '');
    setEditPrice(String(product.precio || 0));
    setEditStock(String(product.stock || 0));
    setEditImage(product.imagen_url || '');
  };

  // Guardar edición de producto
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    setSavingEdit(true);
    const updatedPayload = {
      nombre: editName.trim(),
      precio: parseFloat(editPrice) || 0,
      stock: parseInt(editStock, 10) || 0,
      imagen_url: editImage.trim() || null
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/tenants/${tenant.id}/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedPayload)
      });

      if (!res.ok) throw new Error('Error al actualizar');
      
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...p, ...updatedPayload } : p))
      );
      notifySuccess(`"${updatedPayload.nombre}" actualizado exitosamente en Neon DB.`, 'Cambios Guardados');
      setEditingProduct(null);
    } catch (err) {
      console.error('Error editando producto:', err);
      notifyError('No se pudieron guardar los cambios del producto.', 'Fallo al Guardar');
    } finally {
      setSavingEdit(false);
    }
  };

  // Métricas del inventario
  const totalItems = products.length;
  const outOfStockCount = products.filter((p) => (parseInt(p.stock, 10) || 0) <= 0).length;
  const lowStockCount = products.filter((p) => {
    const s = parseInt(p.stock, 10) || 0;
    return s > 0 && s <= 10;
  }).length;
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
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Total Catálogo</span>
            <Boxes className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-2xl font-black font-display text-slate-900">
            {totalItems} <span className="text-xs font-normal text-slate-500 font-sans">artículos</span>
          </div>
          <p className="text-[11px] text-slate-500">Productos registrados en Neon DB</p>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-flat-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Valorización Stock</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-display text-slate-900">
            ${Math.round(totalValuation).toLocaleString('es-CO')}
          </div>
          <p className="text-[11px] text-slate-500">Costo total inventario disponible</p>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-flat-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Stock Crítico</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-display text-amber-600">
            {lowStockCount} <span className="text-xs font-normal text-slate-500 font-sans">por reponer</span>
          </div>
          <p className="text-[11px] text-slate-500">Artículos con 10 o menos unidades</p>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-flat-sm space-y-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider font-mono">Agotados</span>
            <TrendingDown className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-2xl font-black font-display text-red-600">
            {outOfStockCount} <span className="text-xs font-normal text-slate-500 font-sans">en cero</span>
          </div>
          <p className="text-[11px] text-slate-500">Bloqueados en caja hasta reposición</p>
        </div>
      </div>

      {/* 2. Barra de Herramientas y Filtros */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-flat-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Buscador */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white transition-all"
            />
          </div>

          {/* Filtro por Categoría */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedRubro}
              onChange={(e) => setSelectedRubro(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium focus:outline-none focus:bg-white transition-colors cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por Nivel de Stock */}
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
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p) => {
                  const stock = parseInt(p.stock, 10) || 0;
                  const price = parseFloat(p.precio || 0);
                  const isOut = stock <= 0;
                  const isLow = stock > 0 && stock <= 10;
                  const itemValuation = stock * price;
                  const isUpdating = updatingStockId === p.id;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          {p.imagen_url ? (
                            <img
                              src={p.imagen_url}
                              alt={p.nombre}
                              className="w-11 h-11 object-cover rounded-xl border border-slate-200 shrink-0 shadow-xs"
                            />
                          ) : (
                            <span className="text-xl w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                              {p.emoji || '📦'}
                            </span>
                          )}
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate">{p.nombre}</span>
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

                      {/* Ajuste rápido con persistencia en Neon DB */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleQuickStockChange(p, -1)}
                            disabled={stock <= 0 || isUpdating}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer"
                            title="Restar 1 unidad"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleQuickStockChange(p, 1)}
                            disabled={isUpdating}
                            className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                            title="Sumar 1 unidad"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* Botones de acción: Editar y Eliminar */}
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => startEditing(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                            title="Editar precio y datos del producto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                            title="Eliminar producto de la base de datos"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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
        onProductCreated={() => {
          loadProducts();
        }}
      />

      {/* Modal Rápido para Editar Producto */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">Editar Artículo</h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase font-mono mb-1">
                  Nombre del Producto:
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase font-mono mb-1">
                    Precio ($):
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase font-mono mb-1">
                    Existencias:
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={editStock}
                    onChange={(e) => setEditStock(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase font-mono mb-1">
                  URL de Imagen (Opcional):
                </label>
                <input
                  type="url"
                  value={editImage}
                  onChange={(e) => setEditImage(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900 focus:outline-none focus:bg-white"
                />
                {editImage && (
                  <div className="mt-1.5 flex items-center gap-2">
                    <img src={editImage} alt="Preview" className="w-8 h-8 rounded-lg object-cover border border-slate-200" />
                    <button
                      type="button"
                      onClick={() => setEditImage('')}
                      className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                    >
                      Quitar foto
                    </button>
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  style={{ backgroundColor: brandColor }}
                >
                  {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Guardar Cambios</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
