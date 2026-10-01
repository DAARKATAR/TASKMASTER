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
  Sliders
} from 'lucide-react';
import { AVAILABLE_MODULES, PRESET_MODULAR_PROFILES, DEFAULT_ACTIVE_MODULES } from '../config/modules';

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
  onUpdateModules
}) {
  const [activeTab, setActiveTab] = useState('modules'); // 'modules' | 'appearance'
  const [selectedModules, setSelectedModules] = useState(
    tenant?.active_modules && Array.isArray(tenant.active_modules)
      ? tenant.active_modules
      : DEFAULT_ACTIVE_MODULES
  );
  const [savingModules, setSavingModules] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
        if (prev.length <= 1) return prev; // Mantener al menos un módulo activo
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
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Error guardando módulos:', err);
      alert('Error al guardar módulos: ' + err.message);
    } finally {
      setSavingModules(false);
    }
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
      <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 shadow-2xl p-6 space-y-5 text-slate-800 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header con el color de marca del negocio */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div
              className="p-2 rounded-xl text-white shadow-xs"
              style={{ backgroundColor: brandColor }}
            >
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm font-display text-slate-900">
                Personalización & Identidad
              </h3>
              <p className="text-xs text-slate-500">
                Configura los módulos a la carta y el estilo visual de tu negocio
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
        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl text-xs font-bold">
          <button
            onClick={() => setActiveTab('modules')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'modules'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Módulos a la Carta ({selectedModules.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('appearance')}
            className={`flex-1 py-2 px-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'appearance'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Diseño & Navbar</span>
          </button>
        </div>

        {/* 1. TAB: MÓDULOS A LA CARTA */}
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
                style={{ backgroundColor: brandColor }}
              >
                {savingModules && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Guardar Preferencias</span>
              </button>
            </div>
          </div>
        )}

        {/* 2. TAB: DISEÑO & NAVBAR */}
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
