import React, { useState, useEffect } from 'react';
import TaskMasterLanding from './components/TaskMasterLanding';
import AuthView from './components/AuthView';
import NewTenantWizard from './components/NewTenantWizard';
import Navbar from './components/Navbar';
import PosTerminal from './components/PosTerminal';
import KpiGrid from './components/KpiGrid';
import LedgerTable from './components/LedgerTable';
import SoapConsole from './components/SoapConsole';
import ArchitectureView from './components/ArchitectureView';
import ThemeCustomizerModal from './components/ThemeCustomizerModal';
import { Cake, FileText, TrendingUp, Sparkles, ArrowLeft, Settings, Sliders } from 'lucide-react';
import { API_BASE_URL } from './config/api';

export default function App() {
  // Navegación de nivel superior: 'landing' | 'auth' | 'wizard' | 'pos'
  const [currentView, setCurrentView] = useState('landing');
  
  // Estado de usuario autenticado y token JWT
  const [currentUser, setCurrentUser] = useState(null);
  const [authToken, setAuthToken] = useState(() => localStorage.getItem('taskmaster_token') || null);
  const [authIsRegister, setAuthIsRegister] = useState(false);
  
  // Módulos internos del POS: 'pos' | 'invoices' | 'kpis' | 'console' | 'architecture'
  const [activeTab, setActiveTab] = useState('pos');
  
  // Inquilino / Negocio Activo (Inicia nulo hasta cargar de Neon DB)
  const [currentTenant, setCurrentTenant] = useState(null);
  const [availableTenants, setAvailableTenants] = useState([]);
  const [loadingTenants, setLoadingTenants] = useState(true);

  // Datos para el wizard de registro
  const [wizardInitData, setWizardInitData] = useState(null);

  // Opciones de personalización: 4 posiciones de Navbar y Color de Fondo Plano
  const [navbarPosition, setNavbarPosition] = useState('top'); // 'top' | 'left' | 'right' | 'bottom'
  const [bgTheme, setBgTheme] = useState('white'); // 'white' | 'cream' | 'pink' | 'lavender' | 'mint' | 'slate'
  const [showCustomizer, setShowCustomizer] = useState(false);
  
  // Herramientas de depuración SOAP (ocultas en primera instancia)
  const [showDebugTools, setShowDebugTools] = useState(false);

  // Mapeo de colores de fondo planos y limpios
  const themeColors = {
    white: '#FFFFFF',
    cream: '#FDFBF7',
    pink: '#FFF5F7',
    lavender: '#F8F7FF',
    mint: '#F0FDF4',
    slate: '#F8FAFC'
  };

  // Datos de comprobante y estado de ventas reales desde Neon DB
  const [invoiceData, setInvoiceData] = useState(null);
  const [invoices, setInvoices] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  
  const [lastResponse, setLastResponse] = useState(null);
  const [loadingSoap, setLoadingSoap] = useState(false);
  const [latency, setLatency] = useState(12);
  const [httpStatus, setHttpStatus] = useState(200);

  // Cargar facturas reales desde Neon DB
  const loadInvoices = async (tenantId = currentTenant?.id) => {
    if (!tenantId) return;
    setLoadingInvoices(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/invoices`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
        if (data.length > 0 && !invoiceData) {
          setInvoiceData({
            numero_factura: data[0].numero_factura,
            cliente: data[0].cliente,
            subtotal: parseFloat(data[0].subtotal || 0).toFixed(2),
            impuestos: parseFloat(data[0].impuestos || 0).toFixed(2),
            total: parseFloat(data[0].total || 0).toFixed(2),
            estado: data[0].estado,
            folio_fiscal: data[0].folio_fiscal,
            items_count: data[0].items_count || 1,
            metodo_pago: data[0].metodo_pago,
            emisor: currentTenant?.nombre || 'Mi Negocio'
          });
        }
      }
    } catch (err) {
      console.error('Error cargando facturas:', err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Cargar métricas reales calculadas desde Neon DB
  const loadMetrics = async (tenantId = currentTenant?.id) => {
    if (!tenantId) return;
    setLoadingMetrics(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/metrics`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Error cargando métricas:', err);
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Cargar lista de tenants registrados en Neon DB
  const loadTenants = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tenants`);
      if (res.ok) {
        const list = await res.json();
        setAvailableTenants(list);
      }
    } catch (err) {
      console.error('Error cargando lista de tenants:', err);
    }
  };

  // Restaurar sesión de usuario mediante JWT al cargar
  useEffect(() => {
    const initAuthAndTenants = async () => {
      setLoadingTenants(true);
      const token = localStorage.getItem('taskmaster_token');
      if (token) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setCurrentUser(data.user);
            setCurrentTenant(data.tenant);
            setAuthToken(token);
            setCurrentView('pos');
          } else {
            localStorage.removeItem('taskmaster_token');
            setAuthToken(null);
            setCurrentUser(null);
          }
        } catch (err) {
          console.error('Error restaurando sesión:', err);
        }
      }

      await loadTenants();
      setLoadingTenants(false);
    };

    initAuthAndTenants();
  }, []);

  // Escuchar cambio de tenant para recargar datos en vivo
  useEffect(() => {
    if (currentTenant?.id) {
      loadInvoices(currentTenant.id);
      loadMetrics(currentTenant.id);
    }
  }, [currentTenant?.id]);

  // Detección de ancho de pantalla para la regla de barra inferior
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 1024;
      if (isDesktop && navbarPosition === 'bottom') {
        setNavbarPosition('top');
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [navbarPosition]);

  useEffect(() => {
    if (currentView === 'pos') {
      document.documentElement.style.setProperty('--brand-primary', currentTenant?.brand_color || '#4F46E5');
      document.body.style.backgroundColor = themeColors[bgTheme] || '#FFFFFF';
    } else {
      document.documentElement.style.setProperty('--brand-primary', '#0F172A');
      document.body.style.backgroundColor = '#FFFFFF';
    }
  }, [bgTheme, currentTenant, currentView]);

  // Emisión real de comprobante y persistencia en Neon DB
  const handleEmitInvoice = async (orderData) => {
    setLoadingSoap(true);
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/tenants/${currentTenant.id}/invoices`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error emitiendo comprobante');

      const newInv = data.invoice;
      const formatted = {
        numero_factura: newInv.numero_factura,
        cliente: newInv.cliente,
        subtotal: parseFloat(newInv.subtotal).toFixed(2),
        impuestos: parseFloat(newInv.impuestos).toFixed(2),
        total: parseFloat(newInv.total).toFixed(2),
        estado: newInv.estado,
        folio_fiscal: newInv.folio_fiscal,
        items_count: newInv.items_count,
        metodo_pago: newInv.metodo_pago,
        emisor: currentTenant.nombre,
        items: orderData.items || []
      };

      setInvoiceData(formatted);
      setLastResponse({ raw: JSON.stringify(formatted, null, 2), isFault: false, ...formatted });

      // Recargar datos en vivo inmediatamente
      await Promise.all([loadInvoices(currentTenant.id), loadMetrics(currentTenant.id)]);
    } catch (err) {
      console.error('Error emitiendo venta:', err);
      alert(`Error al registrar venta: ${err.message}`);
    } finally {
      setLoadingSoap(false);
    }
  };

  // Invocación SOAP POST real contra el backend Express
  const executeSoapCall = async (invoiceNumber = '') => {
    if (!invoiceNumber) return;
    setLoadingSoap(true);
    const startTime = performance.now();

    const targetNs = `https://${currentTenant.id}.pos-billing.com/schema`;
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:sch="${targetNs}">
  <soapenv:Header/>
  <soapenv:Body>
    <sch:ConsultarFacturaRequest>
      <sch:numero_factura>${invoiceNumber}</sch:numero_factura>
    </sch:ConsultarFacturaRequest>
  </soapenv:Body>
</soapenv:Envelope>`.trim();

    try {
      const res = await fetch(`${API_BASE_URL}/ws/${currentTenant.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': `https://${currentTenant.id}.pos-billing.com/wsdl/ConsultarFactura`
        },
        body: xml
      });

      const elapsed = Math.round(performance.now() - startTime);
      setLatency(elapsed);
      setHttpStatus(res.status);

      const responseText = await res.text();
      
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(responseText, 'text/xml');

      const faultNode = xmlDoc.getElementsByTagNameNS('*', 'Fault')[0] || xmlDoc.getElementsByTagName('Fault')[0];

      if (faultNode || !res.ok) {
        const faultCode = faultNode?.getElementsByTagNameNS('*', 'faultcode')[0]?.textContent || 'soap:Fault';
        const faultString = faultNode?.getElementsByTagNameNS('*', 'faultstring')[0]?.textContent || 'Factura no encontrada';
        
        setLastResponse({
          raw: responseText,
          isFault: true,
          faultCode,
          faultString
        });
      } else {
        const numero_factura = xmlDoc.getElementsByTagNameNS('*', 'numero_factura')[0]?.textContent || invoiceNumber;
        const cliente = xmlDoc.getElementsByTagNameNS('*', 'cliente')[0]?.textContent || 'Cliente';
        const subtotal = xmlDoc.getElementsByTagNameNS('*', 'subtotal')[0]?.textContent || '0.00';
        const impuestos = xmlDoc.getElementsByTagNameNS('*', 'impuestos')[0]?.textContent || '0.00';
        const total = xmlDoc.getElementsByTagNameNS('*', 'total')[0]?.textContent || '0.00';
        const estado = xmlDoc.getElementsByTagNameNS('*', 'estado')[0]?.textContent || 'TIMBRADA / APROBADA';
        const folio_fiscal = xmlDoc.getElementsByTagNameNS('*', 'folio_fiscal')[0]?.textContent || '';
        const items_count = xmlDoc.getElementsByTagNameNS('*', 'items_count')[0]?.textContent || '1';

        const updated = {
          numero_factura,
          cliente,
          subtotal,
          impuestos,
          total,
          estado,
          folio_fiscal,
          items_count: parseInt(items_count, 10),
          emisor: currentTenant.nombre
        };

        setInvoiceData(updated);
        setLastResponse({
          raw: responseText,
          isFault: false,
          ...updated
        });
      }
    } catch (err) {
      console.error('SOAP Error:', err);
      setLastResponse({
        raw: `Error: ${err.message}`,
        isFault: true,
        faultCode: 'ClientError',
        faultString: err.message
      });
    } finally {
      setLoadingSoap(false);
    }
  };

  // Manejo de Login con JWT
  const handleLoginSuccess = (authData) => {
    if (authData?.token) {
      localStorage.setItem('taskmaster_token', authData.token);
      setAuthToken(authData.token);
    }
    setCurrentUser(authData.user);
    setCurrentTenant(authData.tenant);
    setCurrentView('pos');
  };

  // Cierre seguro de sesión con invalidación de token
  const handleLogout = () => {
    localStorage.removeItem('taskmaster_token');
    setAuthToken(null);
    setCurrentUser(null);
    setCurrentTenant(null);
    setCurrentView('landing');
  };

  // Inicio de registro de nuevo negocio -> pasa al Wizard con credenciales
  const handleStartNewTenantWizard = (formData) => {
    setWizardInitData(formData);
    setCurrentView('wizard');
  };

  // Finalización del Wizard de Onboarding con aprovisionamiento real
  const handleTenantCreated = (sessionData) => {
    if (sessionData?.token) {
      localStorage.setItem('taskmaster_token', sessionData.token);
      setAuthToken(sessionData.token);
    }
    setCurrentTenant(sessionData.tenant);
    setCurrentUser(sessionData.user);
    if (sessionData.bgTheme) setBgTheme(sessionData.bgTheme);
    if (sessionData.navbarPosition) setNavbarPosition(sessionData.navbarPosition);
    loadTenants();
    setCurrentView('pos');
  };

  // Lanzar creación de negocio o login (sin bypass mock)
  const handleLaunchDemo = () => {
    setAuthIsRegister(true);
    setCurrentView('auth');
  };

  // Contenido principal de las pestañas en la vista POS
  const renderMainContent = () => {
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
            className="w-full py-3 rounded-2xl font-bold text-xs text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-all"
          >
            + Registrar Mi Primer Negocio
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* 1. MÓDULO DE PRODUCTOS Y VENTA POS */}
        {activeTab === 'pos' && (
          <PosTerminal 
            tenant={currentTenant}
            onEmitInvoice={handleEmitInvoice}
            loadingSoap={loadingSoap}
            lastResponse={invoiceData}
          />
        )}

      {/* 2. MÓDULO DE HISTÓRICO DE COMPROBANTES */}
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

      {/* 3. MÓDULO DE CAJA Y MÉTRICAS FINANCIERAS */}
      {activeTab === 'kpis' && (
        <KpiGrid 
          tenant={currentTenant} 
          metrics={metrics}
          loading={loadingMetrics}
          onRefresh={() => loadMetrics(currentTenant.id)}
        />
      )}
    </div>
    );
  };

  return (
    <div 
      className="min-h-screen text-slate-800 font-sans transition-colors duration-300 flex flex-col selection:bg-slate-900 selection:text-white"
      style={{ backgroundColor: currentView === 'pos' ? (themeColors[bgTheme] || '#FFFFFF') : '#FFFFFF' }}
    >
      
      {/* VISTA 1: LANDING PAGE CENTRAL DE TASK MASTER */}
      {currentView === 'landing' && (
        <TaskMasterLanding 
          onGoToLogin={() => {
            setAuthIsRegister(false);
            setCurrentView('auth');
          }}
          onStartRegistration={() => {
            setAuthIsRegister(true);
            setCurrentView('auth');
          }}
          onQuickLaunchDemo={() => {
            setAuthIsRegister(false);
            setCurrentView('auth');
          }}
        />
      )}

      {/* VISTA 2: FORMULARIO DE LOGIN / REGISTRO HECHO Y DERECHO */}
      {currentView === 'auth' && (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
          <AuthView 
            initialIsRegister={authIsRegister}
            onLoginSuccess={handleLoginSuccess}
            onStartNewTenantWizard={handleStartNewTenantWizard}
            onBackToLanding={() => setCurrentView('landing')}
          />
        </div>
      )}

      {/* VISTA 3: CARRUSEL DE PERSONALIZACIÓN PARA NUEVOS USUARIOS (WIZARD CON ESQUELETOS) */}
      {currentView === 'wizard' && (
        <div className="min-h-screen flex items-center justify-center p-4 sm:p-8">
          <NewTenantWizard 
            initialData={wizardInitData}
            onComplete={handleTenantCreated}
            onCancel={() => setCurrentView('landing')}
          />
        </div>
      )}

      {/* BLOQUEO DE SEGURIDAD: SI INTENTAN ENTRAR AL POS SIN AUTENTICACIÓN */}
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
            className="w-full py-3 rounded-2xl bg-slate-900 text-white font-bold text-xs hover:bg-black transition-all shadow-sm"
          >
            Iniciar Sesión con mi Cuenta
          </button>
        </div>
      )}

      {/* VISTA 4: TERMINAL POS OPERATIVA PERSONALIZADA */}
      {currentView === 'pos' && currentUser && (
        <>
          {/* CASO A: NAVBAR ARRIBA (TOP) */}
          {navbarPosition === 'top' && (
            <div className="flex-1 flex flex-col">
              <Navbar 
                position="top"
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                currentUser={currentUser}
                tenant={currentTenant}
                onOpenCustomizer={() => setShowCustomizer(true)}
                onLogout={handleLogout}
                onExitToLanding={() => setCurrentView('landing')}
                showDebugTools={showDebugTools}
              />

              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                {renderMainContent()}
              </main>

              <footer className="border-t border-slate-200 bg-white/70 py-4 mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 font-mono">
                  <div>
                    <strong>{currentTenant?.nombre || 'Task Master'}</strong> · Powered by <span translate="no" className="notranslate">Task Master POS</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setShowCustomizer(true)}
                      className="hover:underline flex items-center gap-1 font-semibold"
                      style={{ color: currentTenant?.brand_color || '#0F172A' }}
                    >
                      <Settings className="w-3 h-3" /> Personalizar Navbar
                    </button>
                    <span>·</span>
                    <button 
                      onClick={() => setCurrentView('landing')}
                      className="hover:text-slate-800"
                    >
                      Página Central <span translate="no" className="notranslate">Task Master</span>
                    </button>
                  </div>
                </div>
              </footer>
            </div>
          )}

          {/* CASO B: NAVBAR A LA IZQUIERDA (SIDEBAR LEFT) */}
          {navbarPosition === 'left' && (
            <div className="min-h-screen flex flex-row w-full">
              <Navbar 
                position="left"
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                currentUser={currentUser}
                tenant={currentTenant}
                onOpenCustomizer={() => setShowCustomizer(true)}
                onLogout={handleLogout}
                onExitToLanding={() => setCurrentView('landing')}
                showDebugTools={showDebugTools}
              />

              <div className="flex-1 flex flex-col min-w-0">
                <header className="px-6 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                    {currentTenant?.nombre || 'Task Master'} · Barra Lateral Izquierda
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowCustomizer(true)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Ajustes</span>
                    </button>
                    <button
                      onClick={() => setCurrentView('landing')}
                      className="px-3 py-1 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      <span translate="no" className="notranslate">Task Master</span>
                    </button>
                  </div>
                </header>

                <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
                  {renderMainContent()}
                </main>

                <footer className="border-t border-slate-200 bg-white/70 py-4 px-6 text-xs text-slate-400 font-mono flex justify-between">
                  <span>{currentTenant?.nombre || 'Task Master'} · POS White-Label</span>
                  <span>Sucursal: {currentUser?.sucursal}</span>
                </footer>
              </div>
            </div>
          )}

          {/* CASO C: NAVBAR A LA DERECHA (SIDEBAR RIGHT) */}
          {navbarPosition === 'right' && (
            <div className="min-h-screen flex flex-row w-full">
              <div className="flex-1 flex flex-col min-w-0">
                <header className="px-6 py-3 border-b border-slate-200 bg-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowCustomizer(true)}
                      className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      <Settings className="w-3.5 h-3.5" />
                      <span>Ajustes</span>
                    </button>
                    <button
                      onClick={() => setCurrentView('landing')}
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
                  {renderMainContent()}
                </main>

                <footer className="border-t border-slate-200 bg-white/70 py-4 px-6 text-xs text-slate-400 font-mono flex justify-between">
                  <span>{currentTenant?.nombre || 'Task Master'} · POS White-Label</span>
                  <span>Sucursal: {currentUser?.sucursal}</span>
                </footer>
              </div>

              <Navbar 
                position="right"
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                currentUser={currentUser}
                tenant={currentTenant}
                onOpenCustomizer={() => setShowCustomizer(true)}
                onLogout={handleLogout}
                onExitToLanding={() => setCurrentView('landing')}
                showDebugTools={showDebugTools}
              />
            </div>
          )}

          {/* CASO D: NAVBAR ABAJO (BOTTOM) - SÓLO HABILITADO EN CELULARES, TABLETS Y DISPOSITIVOS REDUCIDOS */}
          {navbarPosition === 'bottom' && (
            <div className="flex-1 flex flex-col pb-24">
              <header className="px-4 py-2.5 border-b border-slate-200 bg-white flex items-center justify-between sticky top-0 z-30 shadow-flat-sm">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{currentTenant?.logo || '🏬'}</span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block leading-tight">{currentTenant?.nombre || 'Mi Negocio'}</span>
                    <span className="text-[10px] font-semibold block" style={{ color: currentTenant?.brand_color || '#0F172A' }}>
                      {currentUser?.sucursal}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowCustomizer(true)}
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200"
                    title="Ajustes de Interfaz"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentView('landing')}
                    className="text-[11px] font-semibold text-slate-500 hover:text-red-600 px-2 py-1 rounded"
                  >
                    Salir
                  </button>
                </div>
              </header>

              <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-4">
                {renderMainContent()}
              </main>

              {/* Barra Inferior Fija para Móviles / Tablets */}
              <Navbar 
                position="bottom"
                activeTab={activeTab}
                onSelectTab={setActiveTab}
                currentUser={currentUser}
                tenant={currentTenant}
                onOpenCustomizer={() => setShowCustomizer(true)}
                onLogout={handleLogout}
                onExitToLanding={() => setCurrentView('landing')}
                showDebugTools={showDebugTools}
              />
            </div>
          )}

          {/* Botón Flotante discreto para abrir Personalizador en cualquier momento */}
          <button
            onClick={() => setShowCustomizer(true)}
            className="fixed bottom-4 right-4 z-40 p-3 rounded-2xl bg-white text-slate-700 border border-slate-200 shadow-xl hover:shadow-2xl transition-all flex items-center gap-2 group"
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

      {/* MODAL DE PERSONALIZACIÓN CON EL COLOR DE MARCA DEL USUARIO */}
      <ThemeCustomizerModal 
        isOpen={showCustomizer}
        onClose={() => setShowCustomizer(false)}
        navbarPosition={navbarPosition}
        onSelectNavbarPosition={setNavbarPosition}
        bgTheme={bgTheme}
        onSelectBgTheme={setBgTheme}
        showDebugTools={showDebugTools}
        onToggleDebugTools={setShowDebugTools}
        brandColor={currentTenant?.brand_color || '#0F172A'}
      />

    </div>
  );
}
