import React, { useState, useEffect } from 'react';
import { Plus, Minus, Trash2, ShoppingBag, Receipt, Zap, Search, Tag, Check, Coffee, Utensils, Shirt, HeartPulse, ShoppingCart, PackagePlus, Loader2, X, Boxes, AlertCircle } from 'lucide-react';
import BakeryReceiptTicket from './BakeryReceiptTicket';
import { API_BASE_URL } from '../config/api';

export default function PosTerminal({ tenant, onEmitInvoice, loadingSoap, lastResponse }) {
  const [selectedRubro, setSelectedRubro] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState('Cliente Mostrador');
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [activeTab, setActiveTab] = useState('cart'); // 'cart' | 'ticket'
  const [acceptedNoFiscalTerms, setAcceptedNoFiscalTerms] = useState(false);

  // Modal para agregar producto al catálogo real en Neon DB
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdRubro, setNewProdRubro] = useState('Cafetería & Repostería');
  const [newProdEmoji, setNewProdEmoji] = useState('📦');
  const [newProdStock, setNewProdStock] = useState('50');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [createProductError, setCreateProductError] = useState(null);

  const brandColor = tenant?.brand_color || '#0F172A';

  // Rubros para filtrado
  const rubros = [
    { id: 'Todos', name: 'Todos los Rubros', icon: <Tag className="w-3.5 h-3.5" /> },
    { id: 'Cafetería & Panadería', name: 'Cafetería & Repostería', icon: <Coffee className="w-3.5 h-3.5" /> },
    { id: 'Restaurante & Fast Food', name: 'Restaurante & Fast Food', icon: <Utensils className="w-3.5 h-3.5" /> },
    { id: 'Boutique & Retail', name: 'Boutique & Retail', icon: <Shirt className="w-3.5 h-3.5" /> },
    { id: 'Farmacia & Salud', name: 'Farmacia & Salud', icon: <HeartPulse className="w-3.5 h-3.5" /> },
    { id: 'Minimarket & Abarrotes', name: 'Minimarket & Abarrotes', icon: <ShoppingCart className="w-3.5 h-3.5" /> },
  ];

  // Cargar catálogo real desde la base de datos de Neon
  const loadProducts = async () => {
    if (!tenant?.id) return;
    setLoadingProducts(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tenants/${tenant.id}/products`);
      if (res.ok) {
        const data = await res.json();
        // Normalizar estructura de productos
        const normalized = data.map((p) => ({
          id: p.id,
          name: p.nombre,
          nombre: p.nombre,
          price: parseFloat(p.precio || 0),
          precio: parseFloat(p.precio || 0),
          rubro: p.rubro || 'General',
          emoji: p.emoji || '📦',
          desc: p.descripcion || '',
          stock: parseInt(p.stock, 10) || 0
        }));
        setProducts(normalized);
      }
    } catch (err) {
      console.error('Error al cargar productos desde Neon:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [tenant?.id]);

  // Crear un nuevo producto en la base de datos de Neon
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setCreateProductError(null);
    if (!newProdName.trim() || !newProdPrice) {
      setCreateProductError('El nombre y el precio son obligatorios.');
      return;
    }

    setCreatingProduct(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tenants/${tenant.id}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: newProdName.trim(),
          precio: parseFloat(newProdPrice),
          rubro: newProdRubro,
          emoji: newProdEmoji,
          stock: parseInt(newProdStock, 10) || 50,
          descripcion: newProdDesc.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar el producto');

      // Limpiar y cerrar modal
      setNewProdName('');
      setNewProdPrice('');
      setNewProdDesc('');
      setShowNewProductModal(false);
      await loadProducts();
    } catch (err) {
      setCreateProductError(err.message);
    } finally {
      setCreatingProduct(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesRubro = selectedRubro === 'Todos' || p.rubro.toLowerCase().includes(selectedRubro.toLowerCase()) || selectedRubro.toLowerCase().includes(p.rubro.toLowerCase());
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRubro && matchesSearch;
  });

  const addToCart = (product) => {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) return prev; // Límite por stock real
        return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) => 
      prev.map(item => {
        if (item.id === id) {
          const newQty = item.qty + delta;
          if (newQty > item.stock) return item; // No sobrepasar stock
          return newQty > 0 ? { ...item, qty: newQty } : null;
        }
        return item;
      }).filter(Boolean)
    );
  };

  const clearCart = () => setCart([]);

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const iva = Math.round(subtotal * 0.19);
  const total = subtotal + iva;

  const handleEmit = async () => {
    if (cart.length === 0) return;
    const itemsCount = cart.reduce((acc, i) => acc + i.qty, 0);
    
    await onEmitInvoice({
      cliente: (customerName || 'Cliente Mostrador').trim(),
      subtotal,
      impuestos: iva,
      total,
      items_count: itemsCount,
      metodo_pago: paymentMethod,
      items: cart
    });

    setActiveTab('ticket');
    clearCart();
    // Actualizar catálogo e inventario en vivo tras la venta
    loadProducts();
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Columna Izquierda: Catálogo Real POS (7 columnas) */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Buscador de Productos, Botón Nuevo Producto y Selector de Rubros */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-flat-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar producto (ej. Café, Croissant)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowNewProductModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-black transition-all shadow-xs"
              >
                <PackagePlus className="w-3.5 h-3.5" />
                <span>+ Agregar Producto</span>
              </button>

              <span className="text-xs text-slate-500 font-medium hidden sm:inline whitespace-nowrap font-mono">
                <strong>{filteredProducts.length}</strong> ítems
              </span>
            </div>
          </div>

          {/* Filtros de Rubros Comerciales */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {rubros.map((rub) => {
              const isSelected = selectedRubro === rub.id;
              return (
                <button
                  key={rub.id}
                  onClick={() => setSelectedRubro(rub.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                    isSelected
                      ? 'text-white shadow-xs'
                      : 'bg-slate-50 text-slate-600 hover:text-slate-900 border-slate-200 hover:border-slate-300'
                  }`}
                  style={isSelected ? { backgroundColor: brandColor, borderColor: brandColor } : {}}
                >
                  {rub.icon}
                  <span>{rub.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Estado de Carga o Catálogo de Productos */}
        {loadingProducts ? (
          <div className="py-20 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-700" />
            <span>Cargando catálogo e inventario...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs bg-white rounded-3xl border border-slate-200 space-y-3 p-6">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-500 text-2xl">
              📦
            </div>
            <h4 className="font-bold text-slate-800 text-sm">Sin productos en este filtro</h4>
            <p className="text-slate-500 text-xs max-w-xs mx-auto">
              No se encontraron artículos registrados para esta búsqueda o rubro en la base de datos.
            </p>
            <button
              onClick={() => setShowNewProductModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-black transition-colors"
            >
              + Crear el Primer Producto
            </button>
          </div>
        ) : (
          /* Rejilla de Productos Reales desde Neon */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredProducts.map((p) => {
              const isOutOfStock = p.stock <= 0;
              return (
                <div
                  key={p.id}
                  onClick={() => !isOutOfStock && addToCart(p)}
                  className={`p-4 rounded-2xl bg-white border transition-all duration-200 flex flex-col justify-between group ${
                    isOutOfStock 
                      ? 'opacity-60 border-slate-200 cursor-not-allowed' 
                      : 'border-slate-200 hover:border-slate-400 hover:shadow-flat cursor-pointer'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-3xl p-2 rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform">
                      {p.emoji}
                    </span>
                    <div className="text-right">
                      <span 
                        className="font-mono text-sm font-black font-display block"
                        style={{ color: brandColor }}
                      >
                        $ {p.price.toLocaleString('es-CO')}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full inline-block mt-0.5 ${
                        isOutOfStock 
                          ? 'bg-red-50 text-red-700 border border-red-200 font-bold' 
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {isOutOfStock ? 'Agotado' : `Stock: ${p.stock}`}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-display font-bold text-sm text-slate-900 transition-colors">
                      {p.name}
                    </h4>
                    {p.desc && (
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                        {p.desc}
                      </p>
                    )}
                  </div>

                  <div 
                    className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold"
                    style={{ color: isOutOfStock ? '#94A3B8' : brandColor }}
                  >
                    <span className="text-[10px] text-slate-400 uppercase font-mono">{p.rubro}</span>
                    <span className="flex items-center gap-1 group-hover:underline">
                      <Plus className="w-3.5 h-3.5" /> {isOutOfStock ? 'Sin existencias' : 'Agregar'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Columna Derecha: Panel del Carrito de Ventas & Ticket (5 columnas) */}
      <div className="lg:col-span-5">
        
        {activeTab === 'cart' ? (
          <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-flat-sm space-y-4">
            
            {/* Header del Carrito */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div 
                  className="p-2 rounded-xl text-white shadow-xs"
                  style={{ backgroundColor: brandColor }}
                >
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm font-display text-slate-900">Orden de Venta Actual</h3>
                  <span className="text-xs text-slate-500">{cart.length} productos agregados</span>
                </div>
              </div>

              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Vaciar</span>
                </button>
              )}
            </div>

            {/* Lista de Ítems */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  <span className="text-3xl block mb-2">🛒</span>
                  El carrito está vacío. Haz clic en un producto para agregarlo.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{item.emoji}</span>
                      <div className="truncate">
                        <span className="font-bold text-slate-800 block truncate">{item.name}</span>
                        <span className="font-mono text-[11px] text-slate-500">
                          ${item.price.toLocaleString('es-CO')} c/u (Disp: {item.stock})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button 
                        onClick={() => updateQty(item.id, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-slate-900 w-4 text-center">{item.qty}</span>
                      <button 
                        onClick={() => updateQty(item.id, 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Formulario Cliente y Medio de Pago */}
            <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
              <div>
                <label className="block text-slate-500 text-[11px] mb-1 font-medium font-mono">
                  Nombre del Cliente:
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:bg-white text-xs font-semibold"
                  placeholder="Ej. María Gómez"
                />
              </div>

              <div>
                <label className="block text-slate-500 text-[11px] mb-1 font-medium font-mono">
                  Método de Pago:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Efectivo', 'Tarjeta', 'Transferencia'].map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`py-1.5 rounded-xl font-semibold text-xs border transition-all ${
                        paymentMethod === method
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Resumen Financiero */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal Base:</span>
                <span>${subtotal.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>IVA Estimado (19%):</span>
                <span>${iva.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>TOTAL A COBRAR:</span>
                <span style={{ color: brandColor }}>${total.toLocaleString('es-CO')}</span>
              </div>
            </div>

            {/* Casilla de Descargo de Control Interno */}
            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 leading-tight">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptedNoFiscalTerms}
                  onChange={(e) => setAcceptedNoFiscalTerms(e.target.checked)}
                  className="mt-0.5 rounded border-amber-300 text-slate-900 focus:ring-slate-900 cursor-pointer shrink-0"
                />
                <span>
                  Confirmo la emisión de este comprobante para <strong>control interno de venta</strong>.
                </span>
              </label>
            </div>

            {/* Botón de Emisión Real de Venta */}
            <button
              onClick={handleEmit}
              disabled={cart.length === 0 || !acceptedNoFiscalTerms || loadingSoap}
              className={`w-full py-3 rounded-2xl font-bold text-xs sm:text-sm text-white transition-all flex items-center justify-center gap-2 shadow-sm ${
                cart.length > 0 && acceptedNoFiscalTerms && !loadingSoap
                  ? 'bg-slate-900 hover:bg-black cursor-pointer'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              {loadingSoap ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Procesando venta...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Emitir Comprobante de Venta (${total.toLocaleString('es-CO')})</span>
                </>
              )}
            </button>

          </div>
        ) : (
          /* Pestaña del Ticket Emitido */
          <div className="space-y-3">
            <BakeryReceiptTicket 
              invoiceData={lastResponse} 
              tenant={tenant} 
              cartItems={lastResponse?.items}
            />
            <button
              onClick={() => setActiveTab('cart')}
              className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
            >
              ← Volver a Nueva Orden
            </button>
          </div>
        )}

      </div>

      {/* MODAL: REGISTRO DE NUEVO PRODUCTO DIRECTO EN BD */}
      {showNewProductModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-slate-900 text-white text-sm">
                  <PackagePlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">Registrar Nuevo Producto</h3>
                  <p className="text-[11px] text-slate-500">Se agregará al catálogo de inventario de tu negocio</p>
                </div>
              </div>
              <button
                onClick={() => setShowNewProductModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createProductError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{createProductError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-bold mb-1 font-mono uppercase text-[10px]">
                  Nombre del Producto: *
                </label>
                <input
                  type="text"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  placeholder="Ej. Tarta de Chocolate Especial"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:bg-white focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-bold mb-1 font-mono uppercase text-[10px]">
                    Precio ($ COP): *
                  </label>
                  <input
                    type="number"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    placeholder="15000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:bg-white focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 font-mono uppercase text-[10px]">
                    Stock Inicial:
                  </label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    placeholder="50"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-bold mb-1 font-mono uppercase text-[10px]">
                    Rubro / Categoría:
                  </label>
                  <select
                    value={newProdRubro}
                    onChange={(e) => setNewProdRubro(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold focus:bg-white focus:outline-none"
                  >
                    <option value="Cafetería & Repostería">Cafetería & Repostería</option>
                    <option value="Restaurante & Fast Food">Restaurante & Fast Food</option>
                    <option value="Boutique & Retail">Boutique & Retail</option>
                    <option value="Farmacia & Salud">Farmacia & Salud</option>
                    <option value="Minimarket & Abarrotes">Minimarket & Abarrotes</option>
                    <option value="General">General</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1 font-mono uppercase text-[10px]">
                    Emoji:
                  </label>
                  <input
                    type="text"
                    value={newProdEmoji}
                    onChange={(e) => setNewProdEmoji(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-center text-base focus:bg-white focus:outline-none"
                    maxLength={4}
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1 font-mono uppercase text-[10px]">
                  Descripción (Opcional):
                </label>
                <input
                  type="text"
                  value={newProdDesc}
                  onChange={(e) => setNewProdDesc(e.target.value)}
                  placeholder="Ej. Con chocolate suizo y cobertura de fresas"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewProductModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingProduct}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white font-bold flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                >
                  {creatingProduct ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Producto</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
