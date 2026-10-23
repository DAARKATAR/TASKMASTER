import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Loader2,
  Boxes,
  Upload,
  Link as LinkIcon,
  Sparkles,
  Image as ImageIcon,
  Trash2,
  Check,
  ShoppingBag,
  Eye,
  Plus
} from 'lucide-react';
import { API_BASE_URL } from '../config/api';
import { useNotification } from '../context/NotificationContext';

const EMOJI_OPTIONS = ['☕', '🥐', '🍰', '🥖', '🥪', '🥗', '🍔', '🍕', '👕', '💊', '📦', '🥑', '🍷', '🍎'];

const RUBRO_OPTIONS = [
  'Cafetería & Repostería',
  'Restaurante & Fast Food',
  'Boutique & Retail',
  'Farmacia & Salud',
  'Minimarket & Abarrotes',
  'Panadería Artesanal',
  'General'
];

// Presets de imágenes de alta calidad (Unsplash curadas y libres de derechos)
const IMAGE_PRESETS = [
  {
    label: 'Café Espresso',
    url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    emoji: '☕'
  },
  {
    label: 'Croissant Mantequilla',
    url: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=600&auto=format&fit=crop&q=80',
    emoji: '🥐'
  },
  {
    label: 'Torta / Pastel',
    url: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80',
    emoji: '🍰'
  },
  {
    label: 'Pan Artesanal',
    url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    emoji: '🥖'
  },
  {
    label: 'Hamburguesa Gourmet',
    url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop&q=80',
    emoji: '🍔'
  },
  {
    label: 'Pizza Napolitana',
    url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&auto=format&fit=crop&q=80',
    emoji: '🍕'
  },
  {
    label: 'Ensalada Fresca',
    url: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&auto=format&fit=crop&q=80',
    emoji: '🥗'
  },
  {
    label: 'Prenda / Ropa',
    url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=600&auto=format&fit=crop&q=80',
    emoji: '👕'
  }
];

// Comprimir imagen en cliente usando canvas para optimizar almacenamiento en DB
function compressImageFile(file, maxWidth = 800, maxHeight = 800, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

export default function NewProductModal({ isOpen, onClose, tenant, onProductCreated }) {
  const { notifySuccess, notifyError } = useNotification();

  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [rubro, setRubro] = useState('Cafetería & Repostería');
  const [emoji, setEmoji] = useState('☕');
  const [stock, setStock] = useState('50');
  const [desc, setDesc] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [imageTab, setImageTab] = useState('upload'); // 'upload' | 'url' | 'presets'
  const [urlInput, setUrlInput] = useState('');
  const [isCompressing, setIsCompressing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fileInputRef = useRef(null);
  const brandColor = tenant?.brand_color || '#4F46E5';

  // Si cambia el rubro inicial al abrir
  useEffect(() => {
    if (tenant?.industry && RUBRO_OPTIONS.includes(tenant.industry)) {
      setRubro(tenant.industry);
    }
  }, [tenant]);

  if (!isOpen) return null;

  // Manejar subida de archivo local
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notifyError('Por favor selecciona un archivo de imagen válido (JPG, PNG, WEBP).', 'Formato Inválido');
      return;
    }

    try {
      setIsCompressing(true);
      const compressedDataUrl = await compressImageFile(file);
      setImagenUrl(compressedDataUrl);
      notifySuccess('Imagen cargada y optimizada para el catálogo.', 'Imagen Lista');
    } catch (err) {
      console.error('Error procesando imagen:', err);
      notifyError('No se pudo procesar la imagen seleccionada.', 'Error de Imagen');
    } finally {
      setIsCompressing(false);
    }
  };

  // Manejar URL externa
  const handleApplyUrl = (e) => {
    e?.preventDefault();
    if (!urlInput.trim()) return;
    setImagenUrl(urlInput.trim());
    notifySuccess('URL de imagen vinculada al producto.', 'Imagen Aplicada');
  };

  // Manejar preset rápido
  const handleSelectPreset = (preset) => {
    setImagenUrl(preset.url);
    setEmoji(preset.emoji);
    if (!nombre) {
      setNombre(preset.label);
    }
  };

  // Quitar imagen
  const handleRemoveImage = () => {
    setImagenUrl('');
    setUrlInput('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nombre.trim() || !precio) {
      notifyError('Por favor completa el nombre y el precio de venta.', 'Campos Requeridos');
      return;
    }

    setLoading(true);

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
          descripcion: desc.trim(),
          imagen_url: imagenUrl.trim() || null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al guardar producto');

      notifySuccess(`"${nombre.trim()}" añadido exitosamente a Neon DB con imagen y catálogo en vivo.`);
      onProductCreated(data.product);
      onClose();

      // Reset form
      setNombre('');
      setPrecio('');
      setDesc('');
      setImagenUrl('');
      setUrlInput('');
    } catch (err) {
      console.error('Error creando producto:', err);
      notifyError(err.message, 'Fallo al Guardar');
    } finally {
      setLoading(false);
    }
  };

  // Valores computados para el preview
  const numPrice = parseFloat(precio) || 0;
  const numStock = parseInt(stock, 10) || 0;
  const isOutOfStock = numStock <= 0;
  const isLowStock = numStock > 0 && numStock <= 10;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border border-slate-100 relative max-h-[92vh] overflow-y-auto">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header del Modal */}
        <div className="flex items-center gap-3 pb-4 mb-5 border-b border-slate-100">
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shadow-xs shrink-0"
            style={{ backgroundColor: `${brandColor}15` }}
          >
            <Boxes className="w-5 h-5" style={{ color: brandColor }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black font-display text-slate-900">
                Añadir Nuevo Producto
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                {tenant?.nombre || 'Mi Negocio'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Personaliza imagen, precio y existencias. Observa la vista previa en tiempo real.
            </p>
          </div>
        </div>

        {/* Grid de 2 Columnas: Formulario (Izquierda) + Preview (Derecha) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* COLUMNA IZQUIERDA: FORMULARIO (7 cols) */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-4">
            {/* Nombre del Producto */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">
                Nombre del Producto: *
              </label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Café Espresso Doble Cremoso"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50/50 focus:bg-white transition-all"
              />
            </div>

            {/* Precio y Stock */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">
                  Precio de Venta ($): *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={precio}
                  onChange={(e) => setPrecio(e.target.value)}
                  placeholder="Ej. 4500"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50/50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">
                  Stock Inicial:
                </label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="50"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50/50 focus:bg-white"
                />
              </div>
            </div>

            {/* Rubro / Categoría */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">
                Categoría / Rubro:
              </label>
              <select
                value={rubro}
                onChange={(e) => setRubro(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-white"
              >
                {RUBRO_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* SECCIÓN DE ESPACIO PARA IMÁGENES */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase font-mono flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-slate-500" />
                  Imagen del Producto:
                </span>
                {imagenUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="text-[11px] font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Quitar foto
                  </button>
                )}
              </div>

              {/* Selector de Modos de Imagen */}
              <div className="flex rounded-xl bg-slate-200/70 p-1 text-xs">
                <button
                  type="button"
                  onClick={() => setImageTab('upload')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    imageTab === 'upload' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Subir Foto
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab('url')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    imageTab === 'url' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <LinkIcon className="w-3.5 h-3.5" />
                  Pegar URL
                </button>
                <button
                  type="button"
                  onClick={() => setImageTab('presets')}
                  className={`flex-1 py-1.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    imageTab === 'presets' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Galería Rápida
                </button>
              </div>

              {/* Tab 1: Subir Archivo con Dropzone */}
              {imageTab === 'upload' && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="product-image-upload"
                  />
                  <label
                    htmlFor="product-image-upload"
                    className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-slate-500 rounded-xl cursor-pointer bg-white transition-colors group"
                  >
                    {isCompressing ? (
                      <div className="flex items-center gap-2 text-xs text-slate-600 font-medium py-2">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                        Optimizando imagen...
                      </div>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-slate-400 group-hover:text-slate-700 transition-colors mb-1" />
                        <span className="text-xs font-bold text-slate-700">
                          Haz clic para subir imagen o foto
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Formatos compatibles: JPG, PNG, WEBP (se optimiza automáticamente)
                        </span>
                      </>
                    )}
                  </label>
                </div>
              )}

              {/* Tab 2: Pegar URL */}
              {imageTab === 'url' && (
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://ejemplo.com/foto-producto.jpg"
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-900 font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleApplyUrl}
                    className="px-3.5 py-2 text-xs font-bold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
                  >
                    Aplicar
                  </button>
                </div>
              )}

              {/* Tab 3: Presets de Fotos de Alta Calidad */}
              {imageTab === 'presets' && (
                <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-1">
                  {IMAGE_PRESETS.map((p) => {
                    const isSelected = imagenUrl === p.url;
                    return (
                      <button
                        type="button"
                        key={p.label}
                        onClick={() => handleSelectPreset(p)}
                        className={`p-1 rounded-xl border text-left transition-all relative overflow-hidden group cursor-pointer ${
                          isSelected
                            ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <img
                          src={p.url}
                          alt={p.label}
                          className="w-full h-12 object-cover rounded-lg mb-1"
                        />
                        <span className="text-[10px] font-bold text-slate-800 line-clamp-1 block">
                          {p.label}
                        </span>
                        {isSelected && (
                          <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Fallback de Icono / Emoji */}
              <div className="pt-2 border-t border-slate-200/80">
                <span className="text-[11px] font-bold text-slate-500 block mb-1">
                  O selecciona un icono emoji de respaldo:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {EMOJI_OPTIONS.map((em) => (
                    <button
                      type="button"
                      key={em}
                      onClick={() => setEmoji(em)}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer ${
                        emoji === em
                          ? 'bg-white shadow-xs border border-slate-300 scale-110'
                          : 'hover:bg-slate-200'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Descripción Opcional */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase font-mono mb-1">
                Descripción Breve (Opcional):
              </label>
              <input
                type="text"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Notas de preparación, especificaciones o ingredientes"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-slate-900 focus:outline-none bg-slate-50/50 focus:bg-white"
              />
            </div>

            {/* Acciones */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                style={{ backgroundColor: brandColor }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Guardar en Catálogo</span>
              </button>
            </div>
          </form>

          {/* COLUMNA DERECHA: PREVIEW EN TIEMPO REAL (5 cols) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-50 to-slate-100/70 p-5 rounded-3xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 font-display">
                <Eye className="w-4 h-4 text-indigo-600" />
                <span>Vista Previa en Vivo</span>
              </div>
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse">
                En Directo
              </span>
            </div>

            <p className="text-[11px] text-slate-500 leading-tight">
              Así es como verán tus cajeros y clientes este artículo en la terminal y el catálogo:
            </p>

            {/* TARJETA INTERACTIVA DE PREVIEW */}
            <div className="bg-white rounded-2xl border border-slate-200/90 shadow-flat hover:shadow-flat-md transition-all duration-300 overflow-hidden group">
              {/* Espacio Visual de la Foto o Emoji Placeholder */}
              <div className="h-44 w-full bg-slate-100 relative overflow-hidden flex items-center justify-center">
                {imagenUrl ? (
                  <img
                    src={imagenUrl}
                    alt={nombre || 'Vista previa'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <span className="text-5xl mb-2 filter drop-shadow-sm group-hover:scale-110 transition-transform">
                      {emoji || '📦'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      (Sin foto cargada, se mostrará este icono)
                    </span>
                  </div>
                )}

                {/* Badge flotante de Categoría */}
                <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-xs text-[10px] font-bold font-mono text-slate-800 shadow-xs border border-white/50">
                  {rubro}
                </span>

                {/* Badge de Stock en la imagen */}
                <span
                  className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono shadow-xs backdrop-blur-xs border ${
                    isOutOfStock
                      ? 'bg-rose-50/95 text-rose-700 border-rose-200'
                      : isLowStock
                      ? 'bg-amber-50/95 text-amber-800 border-amber-300'
                      : 'bg-emerald-50/95 text-emerald-700 border-emerald-200'
                  }`}
                >
                  {isOutOfStock ? 'Agotado' : isLowStock ? `¡Bajo stock: ${numStock}!` : `Stock: ${numStock} uds`}
                </span>
              </div>

              {/* Información del Producto */}
              <div className="p-4 space-y-2.5">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 font-display line-clamp-1 group-hover:text-indigo-600 transition-colors">
                    {nombre.trim() || 'Nombre del Producto'}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 min-h-[30px] leading-relaxed">
                    {desc.trim() || 'Sin descripción adicional. Añade detalles para tus clientes.'}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <span className="text-[10px] uppercase font-mono text-slate-400 font-bold block">
                      Precio de Venta
                    </span>
                    <span
                      className="text-lg font-black font-display font-mono"
                      style={{ color: brandColor }}
                    >
                      ${numPrice > 0 ? numPrice.toLocaleString('es-CO') : '0.00'}
                    </span>
                  </div>

                  <button
                    type="button"
                    disabled={isOutOfStock}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-white shadow-xs flex items-center gap-1.5 transition-all opacity-95 group-hover:opacity-100 disabled:opacity-40 cursor-default"
                    style={{ backgroundColor: brandColor }}
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Checklist de Buenas Prácticas */}
            <div className="p-3 bg-white/80 rounded-2xl border border-slate-200/70 text-[11px] space-y-1.5 text-slate-600">
              <span className="font-bold text-slate-800 font-mono text-[10px] uppercase block">
                Recomendaciones:
              </span>
              <div className="flex items-center gap-1.5">
                <Check className={`w-3.5 h-3.5 ${nombre ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span>Nombre atractivo y descriptivo</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className={`w-3.5 h-3.5 ${numPrice > 0 ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span>Precio comercial asignado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className={`w-3.5 h-3.5 ${imagenUrl ? 'text-emerald-500' : 'text-slate-300'}`} />
                <span>Foto de alta definición lista</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
