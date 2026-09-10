import React, { useState } from 'react';
import { Plus, Minus, Trash2, ShoppingBag, Receipt, Zap, Search, Tag, Check, Coffee, Utensils, Shirt, HeartPulse, ShoppingCart } from 'lucide-react';
import BakeryReceiptTicket from './BakeryReceiptTicket';

export default function PosTerminal({ tenant, onEmitInvoice, loadingSoap, lastResponse }) {
  const [selectedRubro, setSelectedRubro] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [cart, setCart] = useState([
    { id: 1, name: 'Capuchino de Especialidad Doble', price: 9500, qty: 2, emoji: '☕', rubro: 'Cafetería & Panadería' },
    { id: 6, name: 'Hamburguesa Angus Doble Queso', price: 32000, qty: 1, emoji: '🍔', rubro: 'Restaurante & Fast Food' },
  ]);
  const [activeTab, setActiveTab] = useState('cart'); // 'cart' | 'ticket'
  const [acceptedNoFiscalTerms, setAcceptedNoFiscalTerms] = useState(false);

  const brandColor = tenant?.brand_color || '#0F172A';

  // Rubros comunes donde se utilizan los servicios POS
  const rubros = [
    { id: 'Todos', name: 'Todos los Rubros', icon: <Tag className="w-3.5 h-3.5" /> },
    { id: 'Cafetería & Panadería', name: 'Cafetería & Repostería', icon: <Coffee className="w-3.5 h-3.5" /> },
    { id: 'Restaurante & Fast Food', name: 'Restaurante & Fast Food', icon: <Utensils className="w-3.5 h-3.5" /> },
    { id: 'Boutique & Retail', name: 'Boutique & Retail', icon: <Shirt className="w-3.5 h-3.5" /> },
    { id: 'Farmacia & Salud', name: 'Farmacia & Salud', icon: <HeartPulse className="w-3.5 h-3.5" /> },
    { id: 'Minimarket & Abarrotes', name: 'Minimarket & Abarrotes', icon: <ShoppingCart className="w-3.5 h-3.5" /> },
  ];

  // Catálogo completo multisectorial
  const products = [
    // 1. Cafetería & Panadería
    { id: 1, name: 'Capuchino de Especialidad Doble', rubro: 'Cafetería & Panadería', price: 9500, emoji: '☕', desc: 'Espresso doble con leche emulsionada sedosa' },
    { id: 2, name: 'Croissant Francés Mantequilla', rubro: 'Cafetería & Panadería', price: 8500, emoji: '🥐', desc: 'Hojaldre horneado con mantequilla europea' },
    { id: 3, name: 'Torta Selva Negra Gourmet', rubro: 'Cafetería & Panadería', price: 45000, emoji: '🎂', desc: 'Chocolate belga, cerezas y crema suave' },
    { id: 4, name: 'Cheesecake de Frutos Rojos', rubro: 'Cafetería & Panadería', price: 38000, emoji: '🍰', desc: 'Base crocante con coulis de fresa y moras' },
    { id: 5, name: 'Caja Macarons Surtidos (6u)', rubro: 'Cafetería & Panadería', price: 24000, emoji: '🍡', desc: 'Almendra francesa rellenos de frambuesa y pistacho' },

    // 2. Restaurante & Comida Rápida
    { id: 6, name: 'Hamburguesa Angus Doble Queso', rubro: 'Restaurante & Fast Food', price: 32000, emoji: '🍔', desc: '200g carne angus, cheddar madurado y tocineta' },
    { id: 7, name: 'Pizza Familiar Pepperoni Crispy', rubro: 'Restaurante & Fast Food', price: 42000, emoji: '🍕', desc: 'Masa madre fermentada 48h con mozzarella fresca' },
    { id: 8, name: 'Combo Tacos al Pastor (3u)', rubro: 'Restaurante & Fast Food', price: 26000, emoji: '🌮', desc: 'Carne marinada con piña asada, cebolla y cilantro' },
    { id: 9, name: 'Papas Rústicas Trufadas', rubro: 'Restaurante & Fast Food', price: 14000, emoji: '🍟', desc: 'Papas corte grueso con aceite de trufa y parmesano' },
    { id: 10, name: 'Bowl Ensalada César con Pollo', rubro: 'Restaurante & Fast Food', price: 22000, emoji: '🥗', desc: 'Lechuga romana, pechuga a la plancha y crutones' },

    // 3. Boutique & Tienda Retail
    { id: 11, name: 'Camiseta Algodón Pima Básica', rubro: 'Boutique & Retail', price: 55000, emoji: '👕', desc: '100% algodón peruano de fibra larga, tacto suave' },
    { id: 12, name: 'Jeans Slim Fit Denim Premium', rubro: 'Boutique & Retail', price: 120000, emoji: '👖', desc: 'Denim elásticado con lavado índigo oscuro clásico' },
    { id: 13, name: 'Zapatillas Urbanas Streetwear', rubro: 'Boutique & Retail', price: 180000, emoji: '👟', desc: 'Suela amortiguada y capellada en cuero ecológico' },
    { id: 14, name: 'Gorra Clásica Ajustable', rubro: 'Boutique & Retail', price: 45000, emoji: '🧢', desc: 'Algodón drill con visera curva y hebilla metálica' },
    { id: 15, name: 'Bolso Tote Bag Canvas Eco', rubro: 'Boutique & Retail', price: 35000, emoji: '🛍️', desc: 'Lona resistente con asas reforzadas y bolsillo interno' },

    // 4. Farmacia & Salud
    { id: 16, name: 'Protector Solar Facial SPF 50+', rubro: 'Farmacia & Salud', price: 65000, emoji: '🧴', desc: 'Toque seco, amplio espectro UVA/UVB ultraligero' },
    { id: 17, name: 'Complejo Multivitamínico Diario', rubro: 'Farmacia & Salud', price: 48000, emoji: '💊', desc: '60 cápsulas con zinc, vitamina C, D3 y magnesio' },
    { id: 18, name: 'Kit de Primeros Auxilios Portátil', rubro: 'Farmacia & Salud', price: 34000, emoji: '🩹', desc: 'Gasa esterilizada, vendas, micropore y antiséptico' },
    { id: 19, name: 'Termómetro Digital Clínico', rubro: 'Farmacia & Salud', price: 22000, emoji: '🌡️', desc: 'Lectura ultra rápida en 10 segundos con alarma' },
    { id: 20, name: 'Crema Hidratante Reparadora', rubro: 'Farmacia & Salud', price: 39000, emoji: '✨', desc: 'Con ceramidas y ácido hialurónico para piel sensible' },

    // 5. Minimarket & Abarrotes
    { id: 21, name: 'Pack Aguas Minerales (6u)', rubro: 'Minimarket & Abarrotes', price: 18000, emoji: '💧', desc: 'Agua de manantial natural sin gas 600ml cada una' },
    { id: 22, name: 'Café de Origen en Grano (500g)', rubro: 'Minimarket & Abarrotes', price: 32000, emoji: '🫘', desc: 'Variedad arábica tueste medio, notas a caramelo' },
    { id: 23, name: 'Aceite de Oliva Extra Virgen 500ml', rubro: 'Minimarket & Abarrotes', price: 42000, emoji: '🫒', desc: 'Prensado en frío de primera extracción, acidez 0.2%' },
    { id: 24, name: 'Mix Frutos Secos Seleccionados', rubro: 'Minimarket & Abarrotes', price: 16500, emoji: '🥜', desc: 'Almendras, nueces, arándanos y marañones horneados' },
    { id: 25, name: 'Chocolate Amargo Orgánico 70%', rubro: 'Minimarket & Abarrotes', price: 12000, emoji: '🍫', desc: 'Cacao fino de aroma certificado libre de gluten' },
  ];

  const filteredProducts = products.filter(p => {
    const matchesRubro = selectedRubro === 'Todos' || p.rubro === selectedRubro;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.desc.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRubro && matchesSearch;
  });

  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
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

  const handleEmit = () => {
    onEmitInvoice(cart, total);
    setActiveTab('ticket');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      
      {/* Columna Izquierda: Catálogo Multisectorial POS (7 columnas) */}
      <div className="lg:col-span-7 space-y-4">
        
        {/* Buscador de Productos y Selector de Rubros */}
        <div className="p-4 rounded-3xl bg-white border border-slate-200 shadow-flat-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por producto (ej. Capuchino, Hamburguesa, Jeans, Bloqueador)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white transition-all"
                style={{ focusBorderColor: brandColor }}
              />
            </div>
            <span className="text-xs text-slate-500 font-medium hidden sm:inline whitespace-nowrap">
              <strong>{filteredProducts.length}</strong> artículos
            </span>
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

        {/* Rejilla de Productos con el color del usuario */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              onClick={() => addToCart(p)}
              className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 hover:shadow-flat transition-all duration-200 flex flex-col justify-between group cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <span className="text-3xl p-2 rounded-xl bg-slate-50 border border-slate-100 group-hover:scale-105 transition-transform">
                  {p.emoji}
                </span>
                <span 
                  className="font-mono text-sm font-black font-display"
                  style={{ color: brandColor }}
                >
                  $ {p.price.toLocaleString('es-CO')}
                </span>
              </div>

              <div>
                <h4 className="font-display font-bold text-sm text-slate-900 transition-colors">
                  {p.name}
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                  {p.desc}
                </p>
              </div>

              <div 
                className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold"
                style={{ color: brandColor }}
              >
                <span className="text-[10px] text-slate-400 uppercase font-mono">{p.rubro.split(' ')[0]}</span>
                <span className="flex items-center gap-1 group-hover:underline">
                  <Plus className="w-3.5 h-3.5" /> Agregar
                </span>
              </div>
            </div>
          ))}
        </div>
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
                          ${item.price.toLocaleString('es-CO')} c/u
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

            {/* Totales y Botón de Cobro con el color del usuario */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal Venta:</span>
                <span className="font-mono text-slate-900 font-medium">$ {subtotal.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>IVA Estimado (19%):</span>
                <span className="font-mono text-slate-900 font-medium">$ {iva.toLocaleString('es-CO')}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-100 font-bold">
                <span className="text-sm text-slate-800">TOTAL A COBRAR:</span>
                <span 
                  className="text-xl font-black font-display"
                  style={{ color: brandColor }}
                >
                  $ {total.toLocaleString('es-CO')} COP
                </span>
              </div>

              {/* Casilla obligatoria de descargo fiscal requerida por el usuario */}
              <div className="pt-1">
                <label className="flex items-start gap-2 p-2.5 rounded-2xl bg-amber-50/80 border border-amber-200 cursor-pointer text-[11px] text-amber-950 select-none">
                  <input
                    type="checkbox"
                    checked={acceptedNoFiscalTerms}
                    onChange={(e) => setAcceptedNoFiscalTerms(e.target.checked)}
                    className="mt-0.5 rounded border-amber-400 shrink-0"
                    style={{ accentColor: brandColor }}
                  />
                  <span className="leading-snug text-[10.5px]">
                    Entiendo y acepto que los comprobantes generados son de <strong>control interno</strong> y <u>no cuentan aún con certificación fiscal ni regulación digital gubernamental</u>.
                  </span>
                </label>
              </div>

              <div className="pt-1">
                <button
                  onClick={handleEmit}
                  disabled={cart.length === 0 || loadingSoap || !acceptedNoFiscalTerms}
                  className="w-full py-3 rounded-2xl font-bold text-xs sm:text-sm text-white shadow-flat transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: brandColor }}
                >
                  <Zap className={`w-4 h-4 ${loadingSoap ? 'animate-spin' : ''}`} />
                  <span>
                    {loadingSoap 
                      ? 'Generando Comprobante...' 
                      : !acceptedNoFiscalTerms
                      ? '⚠️ Marca la casilla para habilitar cobro'
                      : '🧾 Cobrar y Generar Comprobante de Venta'}
                  </span>
                </button>
              </div>
            </div>

          </div>
        ) : (
          <div className="space-y-3">
            <BakeryReceiptTicket tenant={tenant} invoiceData={lastResponse} cartItems={cart} />
            <div className="text-center">
              <button
                onClick={() => setActiveTab('cart')}
                className="text-xs font-semibold hover:underline"
                style={{ color: brandColor }}
              >
                ← Volver a Modificar Orden POS
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
