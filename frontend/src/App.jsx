import React, { useState, useEffect, Suspense, lazy } from 'react';
import TaskMasterLanding from './components/TaskMasterLanding';
import AuthView from './components/AuthView';
import PosTerminal from './components/PosTerminal';
import LedgerTable from './components/LedgerTable';
import PosLayout from './components/PosLayout';
import { Sliders, Loader2 } from 'lucide-react';

// Code-Splitting con React.lazy para componentes no críticos en carga inicial
const NewTenantWizard = lazy(() => import('./components/NewTenantWizard'));
const InventoryManager = lazy(() => import('./components/InventoryManager'));
const KpiGrid = lazy(() => import('./components/KpiGrid'));
const SoapConsole = lazy(() => import('./components/SoapConsole'));
const ArchitectureView = lazy(() => import('./components/ArchitectureView'));
const ThemeCustomizerModal = lazy(() => import('./components/ThemeCustomizerModal'));

import { useAuth } from './hooks/useAuth';
import { useTenant } from './hooks/useTenant';
import { useInvoices } from './hooks/useInvoices';
import { useThemePreferences } from './hooks/useThemePreferences';
import { useSoapClient } from './hooks/useSoapClient';

function SuspenseFallback({ message = 'Cargando módulo...' }) {
  return (
    <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-xs gap-3">
      <Loader2 className="w-6 h-6 animate-spin text-slate-800" />
      <span>{message}</span>
    </div>
  );
}

export default function App() {
  // 1. Navegación de vistas principales: 'landing' | 'auth' | 'wizard' | 'pos'
  const [currentView, setCurrentView] = useState('landing');
  const [activeTab, setActiveTab] = useState('pos');
  const [wizardInitData, setWizardInitData] = useState(null);
  const [authIsRegister, setAuthIsRegister] = useState(false);
  const [authInitialEmail, setAuthInitialEmail] = useState('');
  const [authInitialPassword, setAuthInitialPassword] = useState('');
  const [showDebugTools, setShowDebugTools] = useState(false);

  // 2. Custom Hooks desacoplados
  const { authToken, currentUser, setCurrentUser, login, logout } = useAuth();
  const { currentTenant, setCurrentTenant, availableTenants, loadTenants, selectTenant, activeModules, updateActiveModules } =
    useTenant();
  const { invoices, pagination, metrics, invoiceData, loadingInvoices, loadingMetrics, loadInvoices, loadMetrics, emitInvoice } =
    useInvoices(currentTenant?.id, authToken);
  const { navbarPosition, selectNavbarPosition, bgTheme, selectBgTheme, showCustomizer, setShowCustomizer, themeColors } =
    useThemePreferences(currentTenant, currentView);
  const { lastResponse, loadingSoap, latency, httpStatus, executeSoapCall } = useSoapClient(currentTenant);

  // Si la pestaña actual se desactiva por configuración modular, cambiar a la primera activa
  useEffect(() => {
    if (activeModules && activeModules.length > 0) {
      const mappedCurrent = activeTab === 'console' ? 'soap' : activeTab;
      if (!activeModules.includes(mappedCurrent) && activeTab !== 'architecture') {
        const firstAvailable = activeModules[0];
        setActiveTab(firstAvailable === 'soap' ? 'console' : firstAvailable);
      }
    }
  }, [activeModules, activeTab]);

  // Handlers
  const handleLoginSuccess = (authData) => {
    login(authData?.token, authData?.user);
    if (authData?.tenant) setCurrentTenant(authData.tenant);
    setCurrentView('pos');
  };

  const handleLogout = () => {
    logout();
    setCurrentTenant(null);
    setCurrentView('landing');
  };

  const handleStartNewTenantWizard = (formData) => {
    setWizardInitData(formData);
    setCurrentView('wizard');
  };

  const handleTenantCreated = (sessionData) => {
    login(sessionData?.token, sessionData?.user);
    if (sessionData?.tenant) setCurrentTenant(sessionData.tenant);
    if (sessionData?.bgTheme) selectBgTheme(sessionData.bgTheme);
    if (sessionData?.navbarPosition) selectNavbarPosition(sessionData.navbarPosition);
    loadTenants();
    setCurrentView('pos');
  };

  const handleEmitInvoice = async (orderData) => {
    try {
      await emitInvoice(orderData, currentTenant);
    } catch (err) {
      console.error('Error emitiendo venta:', err);
      alert(`Error al registrar venta: ${err.message}`);
    }
  };

  // Renderizador del contenido interno de la terminal POS según los módulos activos
  const renderPosContent = () => {
    if (!currentTenant) {
      return (
        <div className="py-20 px-6 text-center space-y-4 max-w-md mx-auto bg-white rounded-3xl border border-slate-200 shadow-flat-sm my-10">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center mx-auto text-indigo-600 text-3xl">
            🏬
          </div>
          <h3 className="text-lg font-bold font-display text-slate-900">
            Sin Negocios Registrados
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Registra tu primer negocio para comenzar a operar el punto de venta y configurar tus herramientas a la carta.
          </p>
          <button
            onClick={() => {
              setWizardInitData(null);
              setCurrentView('wizard');
            }}
            className="w-full py-3 rounded-2xl font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-all cursor-pointer"
          >
            + Registrar Mi Primer Negocio
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* MÓDULO 1: TERMINAL POS */}
        {activeTab === 'pos' && (
          <PosTerminal
            tenant={currentTenant}
            onEmitInvoice={handleEmitInvoice}
            loadingSoap={loadingSoap}
            lastResponse={invoiceData}
          />
        )}

        {/* MÓDULO 2: INVENTARIO & CATÁLOGO (NUEVO MÓDULO DEDICADO) */}
        {activeTab === 'inventory' && (
          <Suspense fallback={<SuspenseFallback message="Cargando catálogo e inventario..." />}>
            <InventoryManager tenant={currentTenant} />
          </Suspense>
        )}

        {/* MÓDULO 3: LIBRO DE COMPROBANTES */}
        {activeTab === 'invoices' && (
          <LedgerTable
            tenant={currentTenant}
            invoices={invoices}
            pagination={pagination}
            onPageChange={(p) => loadInvoices(currentTenant.id, p, pagination?.limit || 25)}
            onConsultSoap={(inv) => executeSoapCall(inv)}
            loading={loadingInvoices || loadingSoap}
            lastResponse={invoiceData}
            onRefresh={() => loadInvoices(currentTenant.id, pagination?.page || 1, pagination?.limit || 25)}
          />
        )}

        {/* MÓDULO 4: MÉTRICAS Y KPIS */}
        <Suspense fallback={<SuspenseFallback />}>
          {activeTab === 'kpis' && (
            <KpiGrid
              tenant={currentTenant}
              metrics={metrics}
              loading={loadingMetrics}
              onRefresh={() => loadMetrics(currentTenant.id)}
            />
          )}

          {/* MÓDULO 5: ENLACE FISCAL / SOAP */}
          {activeTab === 'console' && (
            <SoapConsole
              tenant={currentTenant}
              lastResponse={lastResponse}
              loading={loadingSoap}
              latency={latency}
              httpStatus={httpStatus}
              onExecuteSoap={executeSoapCall}
            />
          )}

          {/* HERRAMIENTA DEV: ARQUITECTURA CLOUD */}
          {activeTab === 'architecture' && (
            <ArchitectureView tenant={currentTenant} />
          )}
        </Suspense>
      </div>
    );
  };

  return (
    <div
      className="min-h-screen text-slate-800 font-sans transition-colors duration-300 flex flex-col selection:bg-slate-900 selection:text-white"
      style={{ backgroundColor: currentView === 'pos' ? (themeColors[bgTheme] || '#FFFFFF') : '#FFFFFF' }}
    >
      {/* 1. LANDING PAGE */}
      {currentView === 'landing' && (
        <TaskMasterLanding
          onGoToLogin={() => {
            setAuthIsRegister(false);
            setAuthInitialEmail('');
            setAuthInitialPassword('');
            setCurrentView('auth');
          }}
          onStartRegistration={() => {
            setAuthIsRegister(true);
            setAuthInitialEmail('');
            setAuthInitialPassword('');
            setCurrentView('auth');
          }}
          onQuickLaunchDemo={() => {
            setAuthIsRegister(false);
            setAuthInitialEmail('admin@taskmaster.com');
            setAuthInitialPassword('admin123');
            setCurrentView('auth');
          }}
        />
      )}

      {/* 2. FORMULARIO DE LOGIN / REGISTRO */}
      {currentView === 'auth' && (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
          <AuthView
            initialIsRegister={authIsRegister}
            initialEmail={authInitialEmail}
            initialPassword={authInitialPassword}
            onLoginSuccess={handleLoginSuccess}
            onStartNewTenantWizard={handleStartNewTenantWizard}
            onBackToLanding={() => setCurrentView('landing')}
          />
        </div>
      )}

      {/* 3. WIZARD DE REGISTRO CON CODE-SPLITTING */}
      {currentView === 'wizard' && (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
          <Suspense fallback={<SuspenseFallback message="Cargando asistente de configuración..." />}>
            <NewTenantWizard
              initialData={wizardInitData}
              onComplete={handleTenantCreated}
              onCancel={() => setCurrentView('landing')}
            />
          </Suspense>
        </div>
      )}

      {/* 4. BLOQUEO SI NO ESTÁ AUTENTICADO EN LA VISTA POS */}
      {currentView === 'pos' && !currentUser && (
        <div className="py-24 px-6 text-center max-w-md mx-auto my-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto text-3xl">
            🔒
          </div>
          <h3 className="text-xl font-bold font-display text-slate-900">
            Acceso Restringido al POS
          </h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Para operar la terminal de venta y registrar ventas debes iniciar sesión con una cuenta de negocio autorizada.
          </p>
          <button
            onClick={() => {
              setAuthIsRegister(false);
              setCurrentView('auth');
            }}
            className="w-full py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition-all shadow-sm cursor-pointer"
          >
            Iniciar Sesión con mi Cuenta
          </button>
        </div>
      )}

      {/* 5. TERMINAL POS MODULARIZADA CON POSLAYOUT */}
      {currentView === 'pos' && currentUser && (
        <>
          <PosLayout
            navbarPosition={navbarPosition}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
            currentUser={currentUser}
            currentTenant={currentTenant}
            onOpenCustomizer={() => setShowCustomizer(true)}
            onLogout={handleLogout}
            onExitToLanding={() => setCurrentView('landing')}
            showDebugTools={showDebugTools}
          >
            {renderPosContent()}
          </PosLayout>

          {/* Botón flotante para el personalizador de diseño */}
          <button
            onClick={() => setShowCustomizer(true)}
            className="fixed bottom-4 right-4 z-40 p-3 rounded-2xl bg-white text-slate-700 border border-slate-200 shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 group cursor-pointer"
            title="Personalizar Módulos Activos y Diseño"
          >
            <Sliders
              className="w-4 h-4 transition-transform group-hover:rotate-45"
              style={{ color: currentTenant?.brand_color || '#0F172A' }}
            />
            <span className="text-xs font-bold hidden sm:inline">
              Módulos & Estilo ({activeModules.length})
            </span>
          </button>
        </>
      )}

      {/* MODAL DE PERSONALIZACIÓN CON CODE-SPLITTING */}
      <Suspense fallback={null}>
        {showCustomizer && (
          <ThemeCustomizerModal
            isOpen={showCustomizer}
            onClose={() => setShowCustomizer(false)}
            navbarPosition={navbarPosition}
            onSelectNavbarPosition={selectNavbarPosition}
            bgTheme={bgTheme}
            onSelectBgTheme={selectBgTheme}
            showDebugTools={showDebugTools}
            onToggleDebugTools={setShowDebugTools}
            brandColor={currentTenant?.brand_color || '#0F172A'}
            tenant={currentTenant}
            onUpdateModules={updateActiveModules}
          />
        )}
      </Suspense>
    </div>
  );
}
