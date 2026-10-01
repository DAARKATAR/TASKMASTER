import React, { useState } from 'react';
import TaskMasterLanding from './components/TaskMasterLanding';
import AuthView from './components/AuthView';
import NewTenantWizard from './components/NewTenantWizard';
import PosTerminal from './components/PosTerminal';
import KpiGrid from './components/KpiGrid';
import LedgerTable from './components/LedgerTable';
import SoapConsole from './components/SoapConsole';
import ArchitectureView from './components/ArchitectureView';
import ThemeCustomizerModal from './components/ThemeCustomizerModal';
import PosLayout from './components/PosLayout';
import { Sliders } from 'lucide-react';

import { useAuth } from './hooks/useAuth';
import { useTenant } from './hooks/useTenant';
import { useInvoices } from './hooks/useInvoices';
import { useThemePreferences } from './hooks/useThemePreferences';
import { useSoapClient } from './hooks/useSoapClient';

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
  const { currentTenant, setCurrentTenant, availableTenants, loadTenants, selectTenant } = useTenant();
  const { invoices, metrics, invoiceData, loadingInvoices, loadingMetrics, loadInvoices, loadMetrics, emitInvoice } =
    useInvoices(currentTenant?.id, authToken);
  const { navbarPosition, selectNavbarPosition, bgTheme, selectBgTheme, showCustomizer, setShowCustomizer, themeColors } =
    useThemePreferences(currentTenant, currentView);
  const { lastResponse, loadingSoap, latency, httpStatus, executeSoapCall } = useSoapClient(currentTenant);

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

  // Renderizador del contenido interno de la terminal POS
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
            Registra tu primer negocio para comenzar a operar el punto de venta y emitir comprobantes reales.
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
        {activeTab === 'pos' && (
          <PosTerminal
            tenant={currentTenant}
            onEmitInvoice={handleEmitInvoice}
            loadingSoap={loadingSoap}
            lastResponse={invoiceData}
          />
        )}

        {activeTab === 'invoices' && (
          <LedgerTable
            tenant={currentTenant}
            invoices={invoices}
            onConsultSoap={(inv) => executeSoapCall(inv)}
            loading={loadingInvoices || loadingSoap}
            lastResponse={invoiceData}
            onRefresh={() => loadInvoices(currentTenant.id)}
          />
        )}

        {activeTab === 'kpis' && (
          <KpiGrid
            tenant={currentTenant}
            metrics={metrics}
            loading={loadingMetrics}
            onRefresh={() => loadMetrics(currentTenant.id)}
          />
        )}

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

        {activeTab === 'architecture' && (
          <ArchitectureView tenant={currentTenant} />
        )}
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

      {/* 3. WIZARD DE REGISTRO DE TENANT */}
      {currentView === 'wizard' && (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
          <NewTenantWizard
            initialData={wizardInitData}
            onComplete={handleTenantCreated}
            onCancel={() => setCurrentView('landing')}
          />
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
            title="Personalizar Posición del Navbar y Fondo"
          >
            <Sliders
              className="w-4 h-4 transition-transform group-hover:rotate-45"
              style={{ color: currentTenant?.brand_color || '#0F172A' }}
            />
            <span className="text-xs font-bold hidden sm:inline">Navbars ({navbarPosition})</span>
          </button>
        </>
      )}

      {/* MODAL DE PERSONALIZACIÓN */}
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
      />
    </div>
  );
}
