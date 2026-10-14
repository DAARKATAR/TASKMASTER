import React, { useState, useEffect } from 'react';
import {
  Plus,
  Minus,
  Trash2,
  ShoppingBag,
  Zap,
  Search,
  Tag,
  Coffee,
  Utensils,
  Shirt,
  HeartPulse,
  ShoppingCart,
  PackagePlus,
  Loader2,
  AlertTriangle,
  Wifi,
  WifiOff,
  CloudUpload,
  RefreshCw,
  Lock,
  Unlock,
  GripVertical,
  ArrowLeftRight
} from 'lucide-react';
import BakeryReceiptTicket from './BakeryReceiptTicket';
import NewProductModal from './NewProductModal';
import { useCart } from '../hooks/useCart';
import { API_BASE_URL } from '../config/api';
import { getOfflineQueue, syncOfflineQueue } from '../utils/offlineQueue';;

export default function PosTerminal({ tenant, onEmitInvoice, loadingSoap, lastResponse }) {
  const [selectedRubro, setSelectedRubro] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [activeTab, setActiveTab] = useState('cart'); // 'cart' | 'ticket'
  const [acceptedNoFiscalTerms, setAcceptedNoFiscalTerms] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [cashReceived, setCashReceived] = useState("");

  // Estado para la animación Nintendo 3DS
  const [draggingCol, setDraggingCol] = useState(null);
  const [dropTargetCol, setDropTargetCol] = useState(null);
  const [snappedCol, setSnappedCol] = useState(null);

  // Verificación de si el módulo de Inventario está activo en este negocio
  const hasInventory = tenant?.active_modules
    ? tenant.active_modules.includes("inventory")
    : true;

  // Estados para Modo Mostrador Ultraligero (Sin Inventario BD)
  const [quickName, setQuickName] = useState("");
  const [quickPrice, setQuickPrice] = useState("");
  const [quickEmoji, setQuickEmoji] = useState("⚡");
  const [sessionButtons, setSessionButtons] = useState(() => {
    const saved = typeof window !== "undefined" ? sessionStorage.getItem(`taskmaster_fast_pos_${tenant?.id || "default"}`) : null;
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      { id: "sb-1", name: "Café / Bebida", price: 3000, emoji: "☕" },
      { id: "sb-2", name: "Panadería / Snack", price: 2500, emoji: "🥐" },
      { id: "sb-3", name: "Menú / Almuerzo", price: 14000, emoji: "🍽️" },
      { id: "sb-4", name: "Servicio / Extra", price: 10000, emoji: "⚡" },
      { id: "sb-5", name: "Venta Mostrador", price: 5000, emoji: "🏷️" },
      { id: "sb-6", name: "Postre / Dulce", price: 4500, emoji: "🍰" }
    ];
  });

  const handleAddQuickSale = (e) => {
    e.preventDefault();
    const priceNum = parseFloat(quickPrice);
    if (!priceNum || priceNum <= 0) return;
    const itemName = (quickName || "Venta Libre").trim();
    addToCart({
      id: `quick-${Date.now()}`,
      name: itemName,
      nombre: itemName,
      price: priceNum,
      precio: priceNum,
      emoji: quickEmoji,
      stock: 9999
    });
    setQuickName("");
    setQuickPrice("");
  };

  const handleSaveQuickButton = () => {
    const priceNum = parseFloat(quickPrice);
    if (!priceNum || priceNum <= 0) return;
    const itemName = (quickName || "Ítem Rápido").trim();
    const newBtn = {
      id: `sb-${Date.now()}`,
      name: itemName,
      price: priceNum,
      emoji: quickEmoji
    };
    const updated = [...sessionButtons, newBtn];
    setSessionButtons(updated);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`taskmaster_fast_pos_${tenant?.id || "default"}`, JSON.stringify(updated));
    }
    addToCart({
      id: newBtn.id,
      name: newBtn.name,
      nombre: newBtn.name,
      price: newBtn.price,
      precio: newBtn.price,
      emoji: newBtn.emoji,
      stock: 9999
    });
    setQuickName("");
    setQuickPrice("");
  };

  const handleDeleteSessionButton = (btnId) => {
    const updated = sessionButtons.filter((b) => b.id !== btnId);
    setSessionButtons(updated);
    if (typeof window !== "undefined") {
      sessionStorage.setItem(`taskmaster_fast_pos_${tenant?.id || "default"}`, JSON.stringify(updated));
    }
  };


  // Disposición de Pantalla y Bloqueo Táctil Tipo App Móvil
  const [isLayoutLocked, setIsLayoutLocked] = useState(() => {
    return localStorage.getItem("taskmaster_pos_locked") !== "false";
  });
  
  const [columnOrder, setColumnOrder] = useState(() => {
    const saved = localStorage.getItem(`taskmaster_layout_${tenant?.id || "default"}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === 2) return parsed;
      } catch {}
    }
    return ["catalog", "cart"];
  });

  const toggleLayoutLock = () => {
    const next = !isLayoutLocked;
    setIsLayoutLocked(next);
    localStorage.setItem("taskmaster_pos_locked", String(next));
  };

  const swapColumns = () => {
    setColumnOrder((prev) => {
      const next = prev[0] === "catalog" ? ["cart", "catalog"] : ["catalog", "cart"];
      localStorage.setItem(`taskmaster_layout_${tenant?.id || "default"}`, JSON.stringify(next));
      return next;
    });
  };

  const resetColumnOrder = () => {
    const def = ["catalog", "cart"];
    setColumnOrder(def);
    localStorage.setItem(`taskmaster_layout_${tenant?.id || "default"}`, JSON.stringify(def));
  };


  // Hook del carrito de compras desacoplado
  const {
    cart,
    addToCart,
    removeFromCart,
    updateQty,
    clearCart,
    subtotal,
    impuestos,
    total,
    itemsCount,
    customerName,
    setCustomerName,
    paymentMethod,
    setPaymentMethod,
    applyTax,
    setApplyTax,
    taxRate,
    setTaxRate
  } = useCart(0.19, false); // 19% IVA opcional desactivado por defecto


  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [offlineCount, setOfflineCount] = useState(0);
  const [syncingOffline, setSyncingOffline] = useState(false);

  const checkOfflineQueue = () => {
    if (tenant?.id) {
      setOfflineCount(getOfflineQueue(tenant.id).length);
    }
  };

  useEffect(() => {
    checkOfflineQueue();
    const handleOnline = () => {
      setIsOnline(true);
      checkOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
      checkOfflineQueue();
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [tenant?.id]);

  const handleSyncOffline = async () => {
    if (!tenant?.id) return;
    setSyncingOffline(true);
    try {
      await syncOfflineQueue(tenant, onEmitInvoice);
      checkOfflineQueue();
      loadProducts();
    } catch (err) {
      console.error('Error sincronizando cola offline:', err);
    } finally {
      setSyncingOffline(false);
    }
  };

  const brandColor = tenant?.brand_color || '#0F172A';

  const rubros = [
    { id: 'Todos', name: 'Todos los Rubros', icon: <Tag className="w-3.5 h-3.5" /> },
    { id: 'Cafetería & Panadería', name: 'Cafetería & Repostería', icon: <Coffee className="w-3.5 h-3.5" /> },
    { id: 'Restaurante & Fast Food', name: 'Restaurante & Fast Food', icon: <Utensils className="w-3.5 h-3.5" /> },
    { id: 'Boutique & Retail', name: 'Boutique & Retail', icon: <Shirt className="w-3.5 h-3.5" /> },
    { id: 'Farmacia & Salud', name: 'Farmacia & Salud', icon: <HeartPulse className="w-3.5 h-3.5" /> },
    { id: 'Minimarket & Abarrotes', name: 'Minimarket & Abarrotes', icon: <ShoppingCart className="w-3.5 h-3.5" /> },
  ];

  const loadProducts = async () => {
    if (!tenant?.id) return;
    setLoadingProducts(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tenants/${tenant.id}/products`);
      if (res.ok) {
        const data = await res.json();
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
    if (tenant?.id) {
      loadProducts();
    }
  }, [tenant?.id]);

  const filteredProducts = products.filter((p) => {
    const rubroStr = (p.rubro || "").toLowerCase();
    const targetRubro = (selectedRubro || "").toLowerCase();
    const matchesRubro =
      selectedRubro === "Todos" ||
      rubroStr.includes(targetRubro) ||
      targetRubro.includes(rubroStr);
    const searchTarget = (searchQuery || "").toLowerCase();
    const matchesSearch =
      (p.name || "").toLowerCase().includes(searchTarget) ||
      (p.desc || "").toLowerCase().includes(searchTarget);
    return matchesRubro && matchesSearch;
  });

  const handleEmit = async () => {
    if (cart.length === 0) return;
    const finalCashReceived = paymentMethod === "Efectivo" ? (parseFloat(cashReceived) || total) : total;
    const finalChange = paymentMethod === "Efectivo" ? Math.max(0, finalCashReceived - total) : 0;

    await onEmitInvoice({
      cliente: (customerName || "Cliente Mostrador").trim(),
      subtotal,
      impuestos,
      total,
      items_count: itemsCount,
      metodo_pago: paymentMethod,
      monto_recibido: finalCashReceived,
      cambio: finalChange,
      items: cart
    });

    setActiveTab("ticket");
    clearCart();
    setCashReceived("");
    checkOfflineQueue();
    loadProducts();
  };

  return (
    <div className="space-y-4">
      {/* Barra de Control: Bloqueo Táctil / Personalización Tipo App Móvil */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={toggleLayoutLock}
            className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
              isLayoutLocked
                ? "bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200"
                : "bg-amber-500 hover:bg-amber-600 text-white shadow-xs animate-pulse"
            }`}
            title={isLayoutLocked ? "Desbloquear para mover o reorganizar la pantalla" : "Bloquear para uso táctil sin movimientos accidentales"}
          >
            {isLayoutLocked ? <Lock className="w-4 h-4 text-slate-700" /> : <Unlock className="w-4 h-4" />}
            <span>{isLayoutLocked ? "Pantalla Bloqueada (Modo Táctil POS)" : "Modo Edición / Reorganizar"}</span>
          </button>

          <span className="text-[11px] text-slate-500 hidden sm:inline">
            {isLayoutLocked
              ? "Diseño fijo para evitar desplazamientos accidentales al pulsar la pantalla táctil de servicio."
              : "Mantén presionado y arrastra con el ratón o usa los botones para reordenar tu mostrador."}
          </span>
        </div>

        {!isLayoutLocked && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={swapColumns}
              className="px-3 py-1.5 text-xs font-bold bg-slate-900 hover:bg-black text-white rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Intercambiar la posición de las columnas"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Invertir Lados ({columnOrder[0] === "catalog" ? "Catálogo ➔ Carrito" : "Carrito ➔ Catálogo"})</span>
            </button>
            <button
              type="button"
              onClick={resetColumnOrder}
              className="px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              Restablecer
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* MÓDULO IZQUIERDO: CATÁLOGO DB O MOSTRADOR ULTRALIGERO */}
        <div
          draggable={!isLayoutLocked}
          onDragStart={(e) => {
            if (!isLayoutLocked) {
              setDraggingCol("catalog");
              e.dataTransfer.setData("text/plain", "catalog");
            }
          }}
          onDragOver={(e) => {
            if (!isLayoutLocked) {
              e.preventDefault();
              if (dropTargetCol !== "catalog") setDropTargetCol("catalog");
            }
          }}
          onDragLeave={() => setDropTargetCol(null)}
          onDragEnd={() => {
            setDraggingCol(null);
            setDropTargetCol(null);
          }}
          onDrop={(e) => {
            if (!isLayoutLocked) {
              e.preventDefault();
              const source = e.dataTransfer.getData("text/plain");
              if (source === "cart") {
                swapColumns();
                setSnappedCol("catalog");
                setTimeout(() => setSnappedCol(null), 500);
              }
            }
            setDraggingCol(null);
            setDropTargetCol(null);
          }}
          className={`lg:col-span-7 space-y-4 transition-all duration-300 ${
            columnOrder[0] === "cart" ? "lg:order-2" : "lg:order-1"
          } ${
            !isLayoutLocked ? "nintendo-edit-mode border-2 border-dashed border-indigo-400 p-3 rounded-3xl bg-indigo-50/20 cursor-grab" : ""
          } ${
            draggingCol === "catalog" ? "nintendo-dragging" : ""
          } ${
            dropTargetCol === "catalog" ? "nintendo-drop-target" : ""
          } ${
            snappedCol === "catalog" ? "nintendo-snap" : ""
          }`}
        >
          {!isLayoutLocked && (
            <div className="p-2 rounded-xl bg-amber-100/70 text-amber-900 text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <GripVertical className="w-4 h-4 text-amber-700" />
                <span>Módulo: Catálogo de Productos (Posición ${columnOrder[0] === "catalog" ? "1" : "2"})</span>
              </span>
              <button
                type="button"
                onClick={swapColumns}
                className="px-2 py-0.5 rounded bg-white text-[10px] font-bold border border-amber-300 text-amber-800 hover:bg-amber-50"
              >
                Mover a la ${columnOrder[0] === "catalog" ? "Derecha ➔" : "⬅ Izquierda"}
              </button>
            </div>
          )}
        {/* Banner de Estado de Conectividad y Cola Offline */}
        {(!isOnline || offlineCount > 0) && (
          <div className={`p-3.5 rounded-2xl border text-xs flex flex-wrap items-center justify-between gap-3 animate-fadeIn ${
            !isOnline
              ? "bg-amber-50 border-amber-300 text-amber-900"
              : "bg-indigo-50 border-indigo-200 text-indigo-900"
          }`}>
            <div className="flex items-center gap-2.5">
              {!isOnline ? (
                <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
              ) : (
                <CloudUpload className="w-4 h-4 text-indigo-600 shrink-0" />
              )}
              <div>
                <span className="font-bold block">
                  {!isOnline ? "Modo Fuera de Línea (Offline)" : "Ventas Pendientes por Sincronizar"}
                </span>
                <span className="text-[11px] opacity-80 block">
                  {!isOnline
                    ? "Puedes seguir cobrando en mostrador. Las ventas se guardan localmente y se emitirán al volver internet."
                    : `Hay ${offlineCount} comprobante(s) emitido(s) offline listos para subir a Neon DB.`}
                </span>
              </div>
            </div>

            {isOnline && offlineCount > 0 && (
              <button
                type="button"
                onClick={handleSyncOffline}
                disabled={syncingOffline}
                className="px-3 py-1.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingOffline ? "animate-spin" : ""}`} />
                <span>{syncingOffline ? "Sincronizando..." : "Subir a la Nube"}</span>
              </button>
            )}
          </div>
        )}


          {/* MODO MOSTRADOR ULTRALIGERO (Si no tiene módulo de inventario en BD) */}
          {!hasInventory && (
            <div className="space-y-4">
              {/* Banner informativo del modo sin inventario */}
              <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 font-bold text-sm">
                    ⚡
                  </div>
                  <div>
                    <span className="font-bold block text-sm">Mostrador Ultraligero (Sin Inventario BD)</span>
                    <span className="text-[11px] text-emerald-700">
                      Modo activo: Facturación rápida sin control de stock. Crea o pulsa artículos en sesión para cobrar al instante.
                    </span>
                  </div>
                </div>
              </div>

              {/* Formulario de Venta Libre / Monto Directo */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-flat-sm space-y-3">
                <h4 className="font-bold text-xs font-display text-slate-800 uppercase tracking-wider font-mono">
                  + Registrar Ítem / Venta Libre en Sesión
                </h4>

                <form onSubmit={handleAddQuickSale} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <div className="sm:col-span-2 flex items-center gap-1">
                      {["☕", "🥐", "🍽️", "⚡", "🏷️"].map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setQuickEmoji(em)}
                          className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
                            quickEmoji === em ? "bg-slate-900 text-white shadow-xs" : "bg-slate-100 hover:bg-slate-200"
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>

                    <div className="sm:col-span-6">
                      <input
                        type="text"
                        placeholder="Descripción (ej. Café Especial, Almuerzo)..."
                        value={quickName}
                        onChange={(e) => setQuickName(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:bg-white"
                      />
                    </div>

                    <div className="sm:col-span-4 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-xs">$</span>
                      <input
                        type="number"
                        step="100"
                        min="100"
                        required
                        placeholder="Precio COP"
                        value={quickPrice}
                        onChange={(e) => setQuickPrice(e.target.value)}
                        className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleSaveQuickButton}
                      disabled={!quickPrice}
                      className="px-3.5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-40 cursor-pointer"
                      title="Guardar como botón rápido de acceso para esta sesión"
                    >
                      ★ Guardar Botón Rápido
                    </button>
                    <button
                      type="submit"
                      disabled={!quickPrice}
                      className="px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs transition-all disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
                      style={{ backgroundColor: brandColor }}
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Cobrar Ítem</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Botones Rápidos de la Sesión */}
              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-flat-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 uppercase font-mono tracking-wider">
                    Teclas Rápidas de la Sesión (Toca para agregar)
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {sessionButtons.length} botones disponibles
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {sessionButtons.map((btn) => (
                    <div
                      key={btn.id}
                      onClick={() => addToCart({
                        id: btn.id,
                        name: btn.name,
                        nombre: btn.name,
                        price: btn.price,
                        precio: btn.price,
                        emoji: btn.emoji,
                        stock: 9999
                      })}
                      className="p-3 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-400 hover:bg-white hover:shadow-flat-sm transition-all cursor-pointer flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-xl p-1 rounded-lg bg-white shadow-2xs group-hover:scale-110 transition-transform">
                          {btn.emoji || "⚡"}
                        </span>
                        <div className="truncate text-left">
                          <span className="font-bold text-xs text-slate-900 block truncate">
                            {btn.name}
                          </span>
                          <span className="font-mono text-[11px] font-bold text-slate-600 block">
                            ${Number(btn.price).toLocaleString("es-CO")}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSessionButton(btn.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 rounded transition-opacity"
                        title="Eliminar botón rápido"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* MODO CATÁLOGO CON BASE DE DATOS (Si tiene inventario activo) */}
          {hasInventory && (
            <div className="space-y-4">
        {/* Buscador de Productos y Selector de Rubros */}
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
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-black transition-all shadow-xs cursor-pointer"
              >
                <PackagePlus className="w-3.5 h-3.5" />
                <span>+ Agregar Producto</span>
              </button>
              <span className="text-xs text-slate-500 font-medium hidden sm:inline whitespace-nowrap font-mono">
                <strong>{filteredProducts.length}</strong> ítems
              </span>
            </div>
          </div>

          {/* Filtros de Rubros */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {rubros.map((rub) => {
              const isSelected = selectedRubro === rub.id;
              return (
                <button
                  key={rub.id}
                  onClick={() => setSelectedRubro(rub.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border cursor-pointer ${
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

        {/* Rejilla de Productos */}
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
              No se encontraron artículos registrados para esta búsqueda en Neon DB.
            </p>
            <button
              onClick={() => setShowNewProductModal(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-black transition-colors cursor-pointer"
            >
              + Crear el Primer Producto
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredProducts.map((p) => {
              const isOutOfStock = p.stock <= 0;
              const isLowStock = p.stock > 0 && p.stock <= 10;

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

                      {/* Stock Badge con Alerta de Stock Bajo */}
                      <div className="flex flex-col items-end gap-1 mt-0.5">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full inline-block ${
                            isOutOfStock
                              ? 'bg-red-50 text-red-700 border border-red-200 font-bold'
                              : isLowStock
                              ? 'bg-amber-50 text-amber-800 border border-amber-300 font-bold'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {isOutOfStock ? 'Agotado' : `Stock: ${p.stock}`}
                        </span>

                        {isLowStock && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600">
                            <AlertTriangle className="w-2.5 h-2.5" /> ¡Últimas unidades!
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-display font-bold text-sm text-slate-900 transition-colors">
                      {p.name}
                    </h4>
                    {p.desc && (
                      <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{p.desc}</p>
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
          )}
      </div>

      {/* MÓDULO DERECHO: CARRITO & FACTURACIÓN */}
      <div
        draggable={!isLayoutLocked}
        onDragStart={(e) => {
          if (!isLayoutLocked) {
            setDraggingCol("cart");
            e.dataTransfer.setData("text/plain", "cart");
          }
        }}
        onDragOver={(e) => {
          if (!isLayoutLocked) {
            e.preventDefault();
            if (dropTargetCol !== "cart") setDropTargetCol("cart");
          }
        }}
        onDragLeave={() => setDropTargetCol(null)}
        onDragEnd={() => {
          setDraggingCol(null);
          setDropTargetCol(null);
        }}
        onDrop={(e) => {
          if (!isLayoutLocked) {
            e.preventDefault();
            const source = e.dataTransfer.getData("text/plain");
            if (source === "catalog") {
              swapColumns();
              setSnappedCol("cart");
              setTimeout(() => setSnappedCol(null), 500);
            }
          }
          setDraggingCol(null);
          setDropTargetCol(null);
        }}
        className={`lg:col-span-5 transition-all duration-300 ${
          columnOrder[0] === "cart" ? "lg:order-1" : "lg:order-2"
        } ${
          !isLayoutLocked ? "nintendo-edit-mode border-2 border-dashed border-indigo-400 p-3 rounded-3xl bg-indigo-50/20 cursor-grab" : ""
        } ${
          draggingCol === "cart" ? "nintendo-dragging" : ""
        } ${
          dropTargetCol === "cart" ? "nintendo-drop-target" : ""
        } ${
          snappedCol === "cart" ? "nintendo-snap" : ""
        }`}
      >
        {!isLayoutLocked && (
          <div className="p-2 mb-3 rounded-xl bg-amber-100/70 text-amber-900 text-xs font-bold flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <GripVertical className="w-4 h-4 text-amber-700" />
              <span>Módulo: Carrito & Facturación (Posición ${columnOrder[0] === "cart" ? "1" : "2"})</span>
            </span>
            <button
              type="button"
              onClick={swapColumns}
              className="px-2 py-0.5 rounded bg-white text-[10px] font-bold border border-amber-300 text-amber-800 hover:bg-amber-50"
            >
              Mover a la ${columnOrder[0] === "cart" ? "Derecha ➔" : "⬅ Izquierda"}
            </button>
          </div>
        )}
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
                  <span className="text-xs text-slate-500">{itemsCount} productos agregados</span>
                </div>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors cursor-pointer"
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
                          ${(item.price || item.precio).toLocaleString('es-CO')} c/u
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-slate-900 w-4 text-center">{item.qty}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-6 h-6 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        className="p-1 text-slate-400 hover:text-red-500 ml-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
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
                      onClick={() => {
                        setPaymentMethod(method);
                        if (method !== "Efectivo") setCashReceived("");
                      }}
                      className={`py-1.5 rounded-xl font-semibold text-xs border transition-all cursor-pointer ${
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

            {/* Calculadora de Vuelto Instantánea en Efectivo */}
            {paymentMethod === "Efectivo" && total > 0 && (
              <div className="p-3 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">Monto Recibido del Cliente:</span>
                  <span className="font-mono font-bold text-slate-900">
                    ${(parseFloat(cashReceived) || total).toLocaleString("es-CO")} COP
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { label: "Exacto", val: total },
                    { label: "$10.000", val: 10000 },
                    { label: "$20.000", val: 20000 },
                    { label: "$50.000", val: 50000 },
                    { label: "$100.000", val: 100000 }
                  ]
                    .filter((b) => b.label === "Exacto" || b.val >= total)
                    .slice(0, 4)
                    .map((b) => (
                      <button
                        key={b.label}
                        type="button"
                        onClick={() => setCashReceived(String(b.val))}
                        className="py-1 px-1.5 text-[11px] font-bold rounded-lg border bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 transition-colors"
                      >
                        {b.label}
                      </button>
                    ))}
                </div>

                <input
                  type="number"
                  value={cashReceived}
                  onChange={(e) => setCashReceived(e.target.value)}
                  placeholder={`Ingresar monto (Total: ${total.toLocaleString("es-CO")})`}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:bg-white focus:border-slate-800 transition-colors"
                />

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                  <span className="font-bold text-slate-600">Cambio / Vuelto a Entregar:</span>
                  <span className={`font-mono font-black text-sm ${
                    (parseFloat(cashReceived) || total) >= total ? "text-emerald-600" : "text-amber-600"
                  }`}>
                    ${Math.max(0, (parseFloat(cashReceived) || total) - total).toLocaleString("es-CO")} COP
                  </span>
                </div>
              </div>
            )}

            {/* Opción Adicional: Toggle de Cálculo de Impuestos / IVA */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
              <label className="flex items-center justify-between cursor-pointer select-none">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={applyTax}
                    onChange={(e) => setApplyTax(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">
                      Calcular Impuesto / IVA ({Math.round(taxRate * 100)}%)
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {applyTax ? "Cálculo tributario activo para esta orden" : "Opcional (Exento / Régimen Simplificado)"}
                    </span>
                  </div>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                  applyTax ? "bg-indigo-50 text-indigo-700 border border-indigo-200" : "bg-slate-200 text-slate-600"
                }`}>
                  {applyTax ? `+${Math.round(taxRate * 100)}%` : "0% IVA"}
                </span>
              </label>
            </div>

            {/* Resumen Financiero */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs font-mono">
              <div className="flex justify-between text-slate-500">
                <span>Subtotal Base:</span>
                <span>${subtotal.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>IVA / Impuestos ({applyTax ? `${Math.round(taxRate * 100)}%` : "Exento"}):</span>
                <span className={applyTax ? "text-slate-800 font-bold" : "text-slate-400"}>
                  ${impuestos.toLocaleString('es-CO')}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>TOTAL A COBRAR:</span>
                <span style={{ color: brandColor }}>${total.toLocaleString('es-CO')}</span>
              </div>
            </div>

            {/* Casilla de Descargo */}
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
          <div className="space-y-3">
            <BakeryReceiptTicket
              invoiceData={lastResponse}
              tenant={tenant}
              cartItems={lastResponse?.items}
            />
            <button
              onClick={() => setActiveTab('cart')}
              className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
            >
              ← Volver a Nueva Orden
            </button>
          </div>
        )}
      </div>

      {/* Modal Desacoplado para Nuevo Producto */}
      <NewProductModal
        isOpen={showNewProductModal}
        onClose={() => setShowNewProductModal(false)}
        tenant={tenant}
        onProductCreated={() => loadProducts()}
      />
    </div>
    </div>
  );
}
