import React from 'react';
import { Cake, FileText, TrendingUp, Settings, LogOut, Terminal, Shield, ArrowLeft } from 'lucide-react';

export default function Navbar({ 
  position = 'top', // 'top' | 'left' | 'right' | 'bottom'
  activeTab, 
  onSelectTab, 
  currentUser, 
  tenant,
  onOpenCustomizer, 
  onLogout,
  onExitToLanding,
  showDebugTools = false
}) {
  // Pestañas esenciales para el cliente
  const baseTabs = [
    { id: 'pos', name: 'Productos & Venta POS', icon: <Cake className="w-4 h-4" /> },
    { id: 'invoices', name: 'Histórico de Comprobantes', icon: <FileText className="w-4 h-4" /> },
    { id: 'kpis', name: 'Caja & Métricas', icon: <TrendingUp className="w-4 h-4" /> },
  ];

  // Pestañas técnicas de depuración (ocultas por defecto)
  const debugTabs = showDebugTools ? [
    { id: 'console', name: 'Consola SOAP XML', icon: <Terminal className="w-4 h-4 text-cyan-600" /> },
    { id: 'architecture', name: 'Aislamiento de Datos', icon: <Shield className="w-4 h-4 text-emerald-600" /> },
  ] : [];

  const tabs = [...baseTabs, ...debugTabs];

  const brandColor = tenant?.brand_color || '#0F172A';
  const businessName = tenant?.nombre || 'Mi Negocio POS';

  // Render del logo (imagen subida o emoji)
  const renderLogo = (sizeClass = 'w-9 h-9 text-lg') => {
    if (tenant?.logoType === 'upload' && tenant?.logo) {
      return (
        <div 
          className={`${sizeClass} rounded-xl border border-slate-200 flex items-center justify-center p-1 bg-white shadow-xs overflow-hidden shrink-0`}
        >
          <img src={tenant.logo} alt="Logo" className="w-full h-full object-contain" />
        </div>
      );
    }
    return (
      <div 
        className={`${sizeClass} rounded-xl flex items-center justify-center text-white shadow-xs shrink-0`}
        style={{ backgroundColor: brandColor }}
      >
        {tenant?.logo || '🏬'}
      </div>
    );
  };

  // 1. MODO ARRIBA (TOP)
  if (position === 'top') {
    return (
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-flat-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-4">
          
          {/* Brand */}
          <div className="flex items-center gap-3">
            {renderLogo('w-9 h-9 text-lg')}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black tracking-tight text-slate-900 font-display">
                  {businessName}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-800 border border-slate-200">
                  POS
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-sans">
                Sucursal: <strong className="text-slate-800">{currentUser?.sucursal || 'Caja Principal'}</strong>
              </p>
            </div>
          </div>

          {/* Business Tabs */}
          <nav className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-semibold">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm border border-slate-200 font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                style={activeTab === tab.id ? { color: brandColor } : {}}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>

          {/* Tools & User */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenCustomizer}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
              title="Personalizar Posición del Navbar y Fondo"
            >
              <Settings className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Ajustes</span>
            </button>

            {onExitToLanding && (
              <button
                onClick={onExitToLanding}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
                title="Volver a la página central de Task Master"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Task Master</span>
              </button>
            )}

            {currentUser && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <span className="text-xs font-bold text-slate-800 block leading-tight">{currentUser.name}</span>
                  <span className="text-[10px] text-slate-400 block">{currentUser.role || 'Cajero POS'}</span>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                  title="Cerrar sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>
      </header>
    );
  }

  // 2. MODO IZQUIERDA (SIDEBAR LEFT) O 3. DERECHA (SIDEBAR RIGHT)
  if (position === 'left' || position === 'right') {
    const isLeft = position === 'left';
    return (
      <aside className={`w-64 shrink-0 bg-white border-slate-200 flex flex-col justify-between p-4 z-40 sticky top-0 h-screen ${
        isLeft ? 'border-r shadow-flat-sm' : 'border-l shadow-flat-sm order-last'
      }`}>
        <div className="space-y-6">
          {/* Brand */}
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
            {renderLogo('w-10 h-10 text-xl')}
            <div>
              <h1 className="text-sm font-black text-slate-900 font-display">
                {businessName}
              </h1>
              <span className="text-[10px] font-bold block" style={{ color: brandColor }}>
                Punto de Venta POS
              </span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono px-3">
              Módulos Principales:
            </span>
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  activeTab === tab.id
                    ? 'bg-slate-50 border border-slate-200 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
                style={activeTab === tab.id ? { color: brandColor, borderColor: `${brandColor}40` } : {}}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </div>

          {/* Quick Actions */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <button
              onClick={onOpenCustomizer}
              className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Personalizar Posición</span>
            </button>

            {onExitToLanding && (
              <button
                onClick={onExitToLanding}
                className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a Task Master</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer User Profile */}
        {currentUser && (
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 truncate">
              <div 
                className="w-7 h-7 rounded-full text-white flex items-center justify-center font-bold text-xs"
                style={{ backgroundColor: brandColor }}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="truncate">
                <span className="font-bold text-slate-900 block truncate">{currentUser.name}</span>
                <span className="text-[10px] text-slate-400 block truncate">{currentUser.sucursal}</span>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </aside>
    );
  }

  // 4. MODO ABAJO (BOTTOM NAV - IDEAL PARA MÓVILES, TABLETS Y PANTALLAS REDUCIDAS)
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 border-t border-slate-200 backdrop-blur-lg shadow-2xl px-3 py-2">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
                isActive ? 'font-bold scale-105' : 'text-slate-500 hover:text-slate-800'
              }`}
              style={isActive ? { color: brandColor } : {}}
            >
              <div 
                className={`p-1.5 rounded-xl ${isActive ? 'bg-slate-100 border border-slate-200' : ''}`}
                style={isActive ? { borderColor: `${brandColor}40` } : {}}
              >
                {tab.icon}
              </div>
              <span className="text-[10px] tracking-tight">{tab.name.split(' ')[0]}</span>
            </button>
          );
        })}

        <button
          onClick={onOpenCustomizer}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-2xl text-slate-500 hover:text-slate-800 transition-all"
        >
          <div className="p-1.5 rounded-xl bg-slate-100 text-slate-700">
            <Settings className="w-4 h-4" />
          </div>
          <span className="text-[10px]">Ajustes</span>
        </button>
      </div>
    </nav>
  );
}
