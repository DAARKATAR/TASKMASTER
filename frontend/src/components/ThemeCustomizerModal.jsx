import React from 'react';
import { Settings, Check, X, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Code } from 'lucide-react';

export default function ThemeCustomizerModal({
  isOpen,
  onClose,
  navbarPosition,
  onSelectNavbarPosition,
  bgTheme,
  onSelectBgTheme,
  showDebugTools,
  onToggleDebugTools,
  brandColor = '#DB2777'
}) {
  if (!isOpen) return null;

  const positions = [
    { id: 'top', name: 'Arriba (Top)', icon: <ArrowUp className="w-4 h-4" />, desc: 'Barra superior tradicional para escritorio' },
    { id: 'left', name: 'Izquierda (Sidebar Left)', icon: <ArrowLeft className="w-4 h-4" />, desc: 'Menú lateral izquierdo tipo panel' },
    { id: 'right', name: 'Derecha (Sidebar Right)', icon: <ArrowRight className="w-4 h-4" />, desc: 'Menú lateral derecho para cajas y POS' },
    { id: 'bottom', name: 'Abajo (Móvil / Tablets)', icon: <ArrowDown className="w-4 h-4" />, desc: 'Barra inferior táctil para pantallas reducidas' },
  ];

  const themes = [
    { id: 'white', name: 'Blanco Puro', bg: '#FFFFFF' },
    { id: 'cream', name: 'Crema Pastel', bg: '#FDFBF7' },
    { id: 'pink', name: 'Rosa Algodón', bg: '#FFF5F7' },
    { id: 'lavender', name: 'Lavanda Suave', bg: '#F8F7FF' },
    { id: 'mint', name: 'Menta Fresca', bg: '#F0FDF4' },
    { id: 'slate', name: 'Gris Nórdico', bg: '#F8FAFC' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-5 text-slate-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header con el color de marca del usuario */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div 
              className="p-2 rounded-xl text-white shadow-xs"
              style={{ backgroundColor: brandColor }}
            >
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-display text-slate-900">Personalizar Interfaz</h3>
              <p className="text-xs text-slate-500">Configura la posición del Navbar y el color de fondo</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Selector de Posición del Navbar (4 Opciones) */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            Posición del Navbar (4 Opciones):
          </label>
          <div className="grid grid-cols-1 gap-2">
            {positions.map((pos) => {
              const isSelected = navbarPosition === pos.id;
              return (
                <button
                  key={pos.id}
                  onClick={() => onSelectNavbarPosition(pos.id)}
                  className={`w-full p-3 rounded-2xl text-left border flex items-center justify-between transition-all ${
                    isSelected 
                      ? 'shadow-sm' 
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                  style={isSelected ? { 
                    borderColor: brandColor, 
                    backgroundColor: `${brandColor}12`,
                    color: brandColor
                  } : {}}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="p-2 rounded-xl"
                      style={isSelected ? { backgroundColor: brandColor, color: '#FFFFFF' } : { backgroundColor: '#F1F5F9', color: '#475569' }}
                    >
                      {pos.icon}
                    </div>
                    <div>
                      <span className="text-xs font-bold block">{pos.name}</span>
                      <span className="text-[11px] text-slate-500 block leading-tight">{pos.desc}</span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 shrink-0" style={{ color: brandColor }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Selector de Color de Fondo (Blanco & Pasteles Planos) */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
            Color de Fondo Limpio:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {themes.map((th) => {
              const isSelected = bgTheme === th.id;
              return (
                <button
                  key={th.id}
                  onClick={() => onSelectBgTheme(th.id)}
                  className={`p-2.5 rounded-2xl border flex items-center gap-2 text-xs font-semibold transition-all ${
                    isSelected 
                      ? 'shadow-sm text-slate-900 ring-2' 
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                  style={{ 
                    backgroundColor: th.bg,
                    borderColor: isSelected ? brandColor : '#E2E8F0',
                    ringColor: `${brandColor}30`
                  }}
                >
                  <span 
                    className="w-3.5 h-3.5 rounded-full border border-slate-300 shadow-inner shrink-0"
                    style={{ backgroundColor: th.bg }}
                  />
                  <span className="truncate text-[11px]">{th.name.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Botón Aplicar y Cerrar con el color de marca del usuario */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-bold text-xs text-white shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: brandColor }}
          >
            Aplicar y Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
