import React from 'react';
import Navbar from './Navbar';
import { Settings } from 'lucide-react';

export default function PosLayout({
  navbarPosition = 'top',
  activeTab,
  onSelectTab,
  currentUser,
  currentTenant,
  onOpenCustomizer,
  onLogout,
  onExitToLanding,
  showDebugTools,
  children
}) {
  const commonNavbarProps = {
    activeTab,
    onSelectTab,
    currentUser,
    tenant: currentTenant,
    onOpenCustomizer,
    onLogout,
    onExitToLanding,
    showDebugTools
  };

  // 1. CASO NAVBAR ARRIBA (TOP)
  if (navbarPosition === 'top') {
    return (
      <div className="flex-1 flex flex-col">
        <Navbar position="top" {...commonNavbarProps} />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
        <footer className="border-t border-slate-200 bg-white/70 py-4 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 font-mono">
            <div>
              <strong>{currentTenant?.nombre || 'Task Master'}</strong> · Powered by{' '}
              <span translate="no" className="notranslate">
                Task Master POS
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onOpenCustomizer}
                className="hover:underline flex items-center gap-1 font-semibold"
                style={{ color: currentTenant?.brand_color || '#0F172A' }}
              >
                <Settings className="w-3 h-3" /> Personalizar Navbar
              </button>
              <span>·</span>
              <button onClick={onExitToLanding} className="hover:text-slate-800">
                Página Central <span translate="no" className="notranslate">Task Master</span>
              </button>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // 2. CASO NAVBAR A LA IZQUIERDA (SIDEBAR LEFT)
  if (navbarPosition === 'left') {
    return (
      <div className="min-h-screen flex flex-row w-full">
        <Navbar position="left" {...commonNavbarProps} />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="px-6 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              {currentTenant?.nombre || 'Task Master'} · Barra Lateral Izquierda
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenCustomizer}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Ajustes</span>
              </button>
              <button
                onClick={onExitToLanding}
                className="px-3 py-1 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                <span translate="no" className="notranslate">Task Master</span>
              </button>
            </div>
          </header>
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <footer className="border-t border-slate-200 bg-white/70 py-4 px-6 text-xs text-slate-400 font-mono flex justify-between">
            <span>{currentTenant?.nombre || 'Task Master'} · POS White-Label</span>
            <span>Sucursal: {currentUser?.sucursal || 'Principal'}</span>
          </footer>
        </div>
      </div>
    );
  }

  // 3. CASO NAVBAR A LA DERECHA (SIDEBAR RIGHT)
  if (navbarPosition === 'right') {
    return (
      <div className="min-h-screen flex flex-row w-full">
        <div className="flex-1 flex flex-col min-w-0">
          <header className="px-6 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenCustomizer}
                className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Ajustes</span>
              </button>
              <button
                onClick={onExitToLanding}
                className="px-3 py-1 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
              >
                <span translate="no" className="notranslate">Task Master</span>
              </button>
            </div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
              {currentTenant?.nombre || 'Task Master'} · Barra Lateral Derecha
            </span>
          </header>
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <footer className="border-t border-slate-200 bg-white/70 py-4 px-6 text-xs text-slate-400 font-mono flex justify-between">
            <span>{currentTenant?.nombre || 'Task Master'} · POS White-Label</span>
            <span>Sucursal: {currentUser?.sucursal || 'Principal'}</span>
          </footer>
        </div>
        <Navbar position="right" {...commonNavbarProps} />
      </div>
    );
  }

  // 4. CASO NAVBAR ABAJO (BOTTOM)
  return (
    <div className="flex-1 flex flex-col pb-20">
      <header className="px-6 py-3 border-b border-slate-200 bg-white/90 backdrop-blur-sm flex items-center justify-between sticky top-0 z-30">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
          {currentTenant?.nombre || 'Task Master'} · Barra Inferior
        </span>
        <button
          onClick={onOpenCustomizer}
          className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Ajustes</span>
        </button>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
      <Navbar position="bottom" {...commonNavbarProps} />
    </div>
  );
}
