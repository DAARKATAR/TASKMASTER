import React, { useState } from 'react';
import {
  Settings,
  Check,
  X,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Code,
  Boxes,
  ShoppingBag,
  FileText,
  TrendingUp,
  Terminal,
  Loader2,
  Sparkles,
  Sliders,
  Palette,
  Pipette,
  Eye,
  RefreshCw,
  Store,
  Layers
} from 'lucide-react';
import { AVAILABLE_MODULES, PRESET_MODULAR_PROFILES, DEFAULT_ACTIVE_MODULES } from '../config/modules';
import { useNotification } from '../context/NotificationContext';

// Helper de contraste y luminancia (Fórmula YIQ)
const isColorDark = (hex) => {
  if (!hex || typeof hex !== 'string') return false;
  let c = hex.replace('#', '').trim();
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  if (c.length !== 6) return false;
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return false;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq < 140;
};

const COLOR_PALETTE_PRESETS = [
  {
    id: 'violet-amber',
    name: 'TaskMaster Índigo',
    emoji: '⚡',
    primary: '#4F46E5',
    accent: '#F59E0B',
    background: '#FFFFFF'
  },
  {
    id: 'bakery-pink',
    name: 'Pastelería & Dulces',
    emoji: '🍰',
    primary: '#DB2777',
    accent: '#F472B6',
    background: '#FDF2F8'
  },
  {
    id: 'coffee-gold',
    name: 'Cafetería & Panadería',
    emoji: '☕',
    primary: '#B45309',
    accent: '#F59E0B',
    background: '#FFFDF9'
  },
  {
    id: 'emerald-organic',
    name: 'Farmacia & Salud',
    emoji: '🌿',
    primary: '#059669',
    accent: '#10B981',
    background: '#F0FDF4'
  },
  {
    id: 'pizza-fire',
    name: 'Pizzería & Restaurante',
    emoji: '🍕',
    primary: '#DC2626',
    accent: '#EA580C',
    background: '#FEF2F2'
  },
  {
    id: 'dark-cyber',
    name: 'Dark Mode / Barbería',
    emoji: '🌙',
    primary: '#06B6D4',
    accent: '#3B82F6',
    background: '#0F172A'
  },
  {
    id: 'boutique-luxe',
    name: 'Boutique & Retail',
    emoji: '🛍️',
    primary: '#7C3AED',
    accent: '#C084FC',
    background: '#FAF5FF'
  }
];

export default function ThemeCustomizerModal({
  isOpen,
  onClose,
  navbarPosition,
  onSelectNavbarPosition,
  bgTheme,
  onSelectBgTheme,
  showDebugTools,
  onToggleDebugTools,
  brandColor = '#4F46E5',
  tenant,
  onUpdateModules,
  onUpdateTheme
}) {
  const { notifySuccess, notifyError, notifyInfo } = useNotification();
  const [activeTab, setActiveTab] = useState('palette'); // 'palette' | 'modules' | 'appearance'
  
  // Módulos
  const [selectedModules, setSelectedModules] = useState(
    tenant?.active_modules && Array.isArray(tenant.active_modules)
      ? tenant.active_modules
      : DEFAULT_ACTIVE_MODULES
  );
  const [savingModules, setSavingModules] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Paleta de Colores Personalizada
  const tenantPalette = tenant?.theme_palette || {};
  const [primaryColor, setPrimaryColor] = useState(tenantPalette.primary || tenant?.brand_color || brandColor || '#4F46E5');
  const [accentColor, setAccentColor] = useState(tenantPalette.accent || '#F59E0B');
  const [bgColor, setBgColor] = useState(tenantPalette.background || '#FFFFFF');
  const [savingPalette, setSavingPalette] = useState(false);

  if (!isOpen) return null;

  const positions = [
    { id: 'top', name: 'Arriba (Top)', icon: <ArrowUp className="w-4 h-4" />, desc: 'Barra superior tradicional' },
    { id: 'left', name: 'Izquierda (Sidebar)', icon: <ArrowLeft className="w-4 h-4" />, desc: 'Menú lateral izquierdo tipo panel' },
    { id: 'right', name: 'Derecha (Sidebar)', icon: <ArrowRight className="w-4 h-4" />, desc: 'Menú lateral derecho para cajas' },
    { id: 'bottom', name: 'Abajo (Móvil/Tablet)', icon: <ArrowDown className="w-4 h-4" />, desc: 'Barra inferior táctil para pantallas reducidas' },
  ];

  const themes = [
    { id: 'white', name: 'Blanco Puro', bg: '#FFFFFF' },
    { id: 'cream', name: 'Crema Pastel', bg: '#FDFBF7' },
    { id: 'pink', name: 'Rosa Algodón', bg: '#FFF5F7' },
    { id: 'lavender', name: 'Lavanda Suave', bg: '#F8F7FF' },
    { id: 'mint', name: 'Menta Fresca', bg: '#F0FDF4' },
    { id: 'slate', name: 'Gris Nórdico', bg: '#F8FAFC' },
  ];

  const handleToggleModule = (moduleId) => {
    setSelectedModules((prev) => {
      if (prev.includes(moduleId)) {
        if (prev.length <= 1) return prev;
        return prev.filter((id) => id !== moduleId);
      }
      return [...prev, moduleId];
    });
    setSaveSuccess(false);
  };

  const handleApplyPreset = (presetModules) => {
    setSelectedModules(presetModules);
    setSaveSuccess(false);
  };

  const handleSaveModules = async () => {
    if (!onUpdateModules) return;
    setSavingModules(true);
    setSaveSuccess(false);
    try {
      await onUpdateModules(selectedModules);
      setSaveSuccess(true);
      notifySuccess('Módulos del negocio guardados correctamente.', 'Configuración Actualizada');
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Error guardando módulos:', err);
      notifyError('No se pudieron guardar los módulos: ' + err.message, 'Fallo de Configuración');
    } finally {
      setSavingModules(false);
    }
  };

  // Aplicar paleta en pantalla inmediatamente sin escribir en base de datos
  const handleApplyLive = () => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--tenant-primary', primaryColor);
      root.style.setProperty('--tenant-accent', accentColor);
      root.style.setProperty('--tenant-bg', bgColor);
    }
    if (notifyInfo) {
      notifyInfo(
        'Colores aplicados en pantalla para prueba visual sin guardar en Neon DB.',
        'Vista Previa en Vivo'
      );
    } else {
      notifySuccess('Paleta aplicada en pantalla para prueba.', 'Vista Previa');
    }
  };

  // Guardar Paleta Personalizada en Neon DB
  const handleSavePalette = async () => {
    if (!onUpdateTheme) return;
    setSavingPalette(true);
    try {
      if (typeof document !== 'undefined') {
        const root = document.documentElement;
        root.style.setProperty('--tenant-primary', primaryColor);
        root.style.setProperty('--tenant-accent', accentColor);
        root.style.setProperty('--tenant-bg', bgColor);
      }
      await onUpdateTheme({
        brand_color: primaryColor,
        theme_palette: {
          primary: primaryColor,
          accent: accentColor,
          background: bgColor
        }
      });
      notifySuccess('¡Paleta corporativa guardada con éxito!', 'Identidad Guardada');
    } catch (err) {
      console.error('Error guardando paleta:', err);
      notifyError('No se pudo guardar la paleta en Neon DB: ' + err.message);
    } finally {
      setSavingPalette(false);
    }
  };

  const handleApplyColorPreset = (preset) => {
    setPrimaryColor(preset.primary);
    setAccentColor(preset.accent);
    setBgColor(preset.background);
  };

  const getModuleIcon = (id) => {
    switch (id) {
      case 'pos':
        return <ShoppingBag className="w-4 h-4" />;
      case 'inventory':
        return <Boxes className="w-4 h-4" />;
      case 'invoices':
        return <FileText className="w-4 h-4" />;
      case 'kpis':
        return <TrendingUp className="w-4 h-4" />;
      case 'soap':
        return <Terminal className="w-4 h-4" />;
      default:
        return <Sliders className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-5 text-slate-800 animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
        {/* Header con el color de marca del negocio */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl text-white shadow-xs"
              style={{ backgroundColor: primaryColor }}
            >
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm font-display text-slate-900">
                  Personalización de Identidad & Módulos
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                  {tenant?.nombre || 'Mi Negocio'}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Añade tu propia paleta de colores corporativa y herramientas a la carta
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pestañas de Personalización */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('palette')}
            className={`flex-1 py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'palette'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Palette className="w-3.5 h-3.5" style={{ color: primaryColor }} />
            <span>Paleta de Colores</span>
          </button>

          <button
            onClick={() => setActiveTab('modules')}
            className={`flex-1 py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'modules'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Módulos ({selectedModules.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex-1 py-2 px-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'appearance'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Navbar & Entorno</span>
          </button>
        </div>

        {/* 1. TAB: PALETA DE COLORES CORPORATIVA (NUEVA FUNCIÓN) */}
        {activeTab === 'palette' && (
          <div className="space-y-4">
            
            {/* Presets Rápidos por Industria */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800 uppercase font-mono tracking-wider">
                  Paletas Listas para Usar:
                </span>
                <span className="text-[10px] text-slate-400">1 clic para aplicar</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {COLOR_PALETTE_PRESETS.map((p) => {
                  const isSelected = primaryColor === p.primary && accentColor === p.accent;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleApplyColorPreset(p)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'border-slate-900 ring-2 ring-slate-900/20 shadow-xs bg-slate-50'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex -space-x-1 shrink-0">
                        <span
                          className="w-4 h-4 rounded-full border border-white shadow-2xs"
                          style={{ backgroundColor: p.primary }}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-white shadow-2xs"
                          style={{ backgroundColor: p.accent }}
                        />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate">
                          {p.emoji} {p.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Controles para Añadir Colores Propios (Alineación Perfecta al Mismo Nivel) */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 uppercase font-mono block">
                  Personaliza Tus Códigos Exactos:
                </span>
                <span className="text-[10px] text-slate-500 font-medium">Hexadecimal / Selector</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-stretch">
                {/* 1. Color Primario */}
                <div className="flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5 h-5">
                    <label className="text-xs font-bold text-slate-700">Primario</label>
                    <span className="text-[10px] text-slate-400 font-medium">Botones & Marca</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all h-11">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-7 h-7 rounded-lg border-0 cursor-pointer p-0 bg-transparent shrink-0"
                      title="Seleccionar color primario"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-full text-xs font-mono font-bold uppercase text-slate-800 focus:outline-none"
                      maxLength={7}
                      placeholder="#4F46E5"
                    />
                  </div>
                </div>

                {/* 2. Color Secundario / Acento */}
                <div className="flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5 h-5">
                    <label className="text-xs font-bold text-slate-700">Secundario</label>
                    <span className="text-[10px] text-slate-400 font-medium">Acentos & Badges</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all h-11">
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-7 h-7 rounded-lg border-0 cursor-pointer p-0 bg-transparent shrink-0"
                      title="Seleccionar color secundario"
                    />
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-full text-xs font-mono font-bold uppercase text-slate-800 focus:outline-none"
                      maxLength={7}
                      placeholder="#F59E0B"
                    />
                  </div>
                </div>

                {/* 3. Color de Fondo */}
                <div className="flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-1.5 h-5">
                    <label className="text-xs font-bold text-slate-700">Fondo</label>
                    <span className="text-[10px] text-slate-400 font-medium">Pantalla / POS</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all h-11">
                    <input
                      type="color"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-7 h-7 rounded-lg border-0 cursor-pointer p-0 bg-transparent shrink-0"
                      title="Seleccionar color de fondo"
                    />
                    <input
                      type="text"
                      value={bgColor}
                      onChange={(e) => setBgColor(e.target.value)}
                      className="w-full text-xs font-mono font-bold uppercase text-slate-800 focus:outline-none"
                      maxLength={7}
                      placeholder="#FFFFFF"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Vista Previa Integrada al Menú & POS (Alto Contraste y Fidelidad) */}
            {(() => {
              const isDark = isColorDark(bgColor);
              return (
                <div
                  className={`p-4 rounded-2xl border transition-all duration-300 space-y-3 ${
                    isDark ? 'border-slate-800 shadow-inner' : 'border-slate-200 shadow-2xs'
                  }`}
                  style={{ backgroundColor: bgColor }}
                >
                  {/* Encabezado del Preview con Contraste Inteligente */}
                  <div
                    className={`flex items-center justify-between pb-2 border-b ${
                      isDark ? 'border-white/10' : 'border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full animate-pulse"
                        style={{ backgroundColor: primaryColor }}
                      />
                      <span className={`text-xs font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Simulador de Menú & Caja POS
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-md ${
                          isDark ? 'bg-white/10 text-slate-200' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        En Vivo
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold shadow-2xs"
                        style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
                      >
                        Acento Activo
                      </span>
                    </div>
                  </div>

                  {/* Simulación del Menú / Barra Superior del Sistema */}
                  <div
                    className={`p-2 rounded-xl flex items-center justify-between gap-2 shadow-2xs ${
                      isDark ? 'bg-slate-900/80 border border-white/10' : 'bg-white/95 border border-slate-200/90'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-6 h-6 rounded-lg flex items-center justify-center text-white text-[11px] font-black shrink-0 shadow-xs"
                        style={{ backgroundColor: primaryColor }}
                      >
                        {tenant?.nombre ? tenant.nombre.charAt(0).toUpperCase() : 'T'}
                      </div>
                      <span className={`text-xs font-bold truncate max-w-[130px] ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {tenant?.nombre || 'Mi Comercio'}
                      </span>
                    </div>

                    {/* Pestañas del Menú */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-white shadow-xs"
                        style={{ backgroundColor: primaryColor }}
                      >
                        POS Caja
                      </span>
                      <span
                        className={`px-2 py-1 rounded-lg text-[10px] font-medium hidden sm:inline-block ${
                          isDark ? 'text-slate-300 bg-white/5' : 'text-slate-600 bg-slate-100'
                        }`}
                      >
                        Inventario
                      </span>
                      <span
                        className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md"
                        style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                      >
                        Mesa #4
                      </span>
                    </div>
                  </div>

                  {/* Tarjetas de Muestra: Producto y Ticket POS */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Tarjeta de Producto */}
                    <div
                      className={`p-3 rounded-xl border flex flex-col justify-between shadow-2xs ${
                        isDark ? 'bg-slate-900/70 border-white/10 text-white' : 'bg-white border-slate-200/90 text-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span
                            className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md"
                            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
                          >
                            Destacado
                          </span>
                          <span
                            className="text-xs font-black font-mono"
                            style={{ color: primaryColor }}
                          >
                            $ 24.500
                          </span>
                        </div>
                        <h6 className="text-xs font-bold truncate">Combo Especial POS</h6>
                        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Categoría: Menú Principal
                        </p>
                      </div>

                      <button
                        type="button"
                        className="w-full mt-2.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs cursor-default flex items-center justify-center gap-1 active:scale-95 transition-transform"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <span>+ Agregar a Orden</span>
                      </button>
                    </div>

                    {/* Tarjeta de Ticket de Cobro */}
                    <div
                      className={`p-3 rounded-xl border flex flex-col justify-between shadow-2xs ${
                        isDark ? 'bg-slate-900/70 border-white/10 text-white' : 'bg-white border-slate-200/90 text-slate-800'
                      }`}
                    >
                      <div>
                        <div
                          className={`flex items-center justify-between text-[11px] font-bold pb-1.5 border-b border-dashed ${
                            isDark ? 'border-white/15' : 'border-slate-200'
                          }`}
                        >
                          <span>Ticket #1042</span>
                          <span
                            className="text-[9px] font-mono px-1.5 py-0.5 rounded-md font-bold"
                            style={{ backgroundColor: `${accentColor}25`, color: accentColor }}
                          >
                            Listo para Cobro
                          </span>
                        </div>
                        <div className={`pt-1.5 text-[10px] flex justify-between ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          <span>1x Combo Especial POS</span>
                          <span className="font-mono font-bold">$ 24.500</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="w-full mt-2.5 py-1.5 rounded-lg text-xs font-bold text-white shadow-xs cursor-default flex items-center justify-center gap-1.5"
                        style={{ backgroundColor: primaryColor }}
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Cobrar Factura</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Barra de Acciones: Cerrar, Aplicar en Vivo y Guardar */}
            <div className="pt-3 flex items-center justify-between border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
              >
                Cerrar
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleApplyLive}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  title="Aplica los colores en pantalla inmediatamente sin guardar en base de datos"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Aplicar</span>
                </button>
                <button
                  type="button"
                  onClick={handleSavePalette}
                  disabled={savingPalette}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-2 hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                  style={{ backgroundColor: primaryColor }}
                >
                  {savingPalette ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Guardar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. TAB: MÓDULOS A LA CARTA */}
        {activeTab === 'modules' && (
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Perfiles Rápidos según tu Rubro
                </span>
                <span className="text-[10px] text-slate-400">1 clic para auto-configurar</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {PRESET_MODULAR_PROFILES.map((preset) => {
                  const isActive =
                    JSON.stringify(preset.modules.sort()) ===
                    JSON.stringify([...selectedModules].sort());
                  return (
                    <button
                      key={preset.id}
                      onClick={() => handleApplyPreset(preset.modules)}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isActive
                          ? 'border-slate-900 bg-slate-900 text-white shadow-xs'
                          : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs">
                        <span>{preset.emoji}</span>
                        <span className="truncate">{preset.name.split('(')[0]}</span>
                      </div>
                      <p className={`text-[10px] mt-0.5 line-clamp-1 ${isActive ? 'text-slate-300' : 'text-slate-400'}`}>
                        {preset.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lista Detallada de Módulos */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-800 block">
                Selección Individual de Herramientas
              </span>
              <div className="space-y-2">
                {AVAILABLE_MODULES.map((mod) => {
                  const isChecked = selectedModules.includes(mod.id);
                  return (
                    <div
                      key={mod.id}
                      onClick={() => handleToggleModule(mod.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isChecked
                          ? 'border-slate-300 bg-white shadow-xs'
                          : 'border-slate-100 bg-slate-50/70 opacity-60 hover:opacity-80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: isChecked ? `${mod.color}20` : '#E2E8F0',
                            color: isChecked ? mod.color : '#64748B'
                          }}
                        >
                          {getModuleIcon(mod.id)}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-slate-900 truncate">
                              {mod.name}
                            </span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded-full font-mono bg-slate-100 text-slate-600">
                              {mod.badge}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{mod.description}</p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-slate-900 border-slate-900 text-white'
                            : 'border-slate-300 bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Botón Guardar en Neon DB */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100">
              {saveSuccess ? (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-4 h-4" /> ¡Módulos guardados en Neon DB!
                </span>
              ) : (
                <span className="text-[11px] text-slate-400">
                  {selectedModules.length} de {AVAILABLE_MODULES.length} herramientas activas
                </span>
              )}

              <button
                onClick={handleSaveModules}
                disabled={savingModules}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-sm flex items-center gap-2 hover:opacity-95 transition-all disabled:opacity-50 cursor-pointer"
                style={{ backgroundColor: primaryColor }}
              >
                {savingModules && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Guardar Preferencias</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. TAB: DISEÑO & NAVBAR */}
        {activeTab === 'appearance' && (
          <div className="space-y-4">
            {/* Posición del Navbar */}
            <div>
              <span className="text-xs font-bold text-slate-800 block mb-1.5">
                Posición de la Barra de Navegación
              </span>
              <div className="grid grid-cols-2 gap-2">
                {positions.map((pos) => {
                  const isSelected = navbarPosition === pos.id;
                  return (
                    <button
                      key={pos.id}
                      onClick={() => onSelectNavbarPosition(pos.id)}
                      className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-slate-900 bg-slate-50 ring-1 ring-slate-900'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-slate-900">{pos.name}</span>
                        <span className="text-slate-600">{pos.icon}</span>
                      </div>
                      <p className="text-[10px] text-slate-500">{pos.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tema de Fondo */}
            <div>
              <span className="text-xs font-bold text-slate-800 block mb-1.5">
                Color de Fondo del Espacio de Trabajo
              </span>
              <div className="grid grid-cols-3 gap-2">
                {themes.map((th) => {
                  const isSelected = bgTheme === th.id;
                  return (
                    <button
                      key={th.id}
                      onClick={() => onSelectBgTheme(th.id)}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center gap-2 ${
                        isSelected
                          ? 'border-slate-900 ring-1 ring-slate-900 bg-white shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div
                        className="w-4 h-4 rounded-full border border-slate-300 shrink-0"
                        style={{ backgroundColor: th.bg }}
                      />
                      <span className="text-xs font-medium text-slate-800 truncate">{th.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Herramientas de Auditoría */}
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Code className="w-4 h-4 text-slate-600" />
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">
                      Herramientas de Desarrollador
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      Muestra el visor de arquitectura Cloud
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={showDebugTools}
                  onChange={(e) => onToggleDebugTools && onToggleDebugTools(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
