import React, { useState } from 'react';
import { Lock, Mail, Store, ArrowRight, ShieldCheck, ArrowLeft, User, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export default function AuthView({ initialIsRegister = false, onLoginSuccess, onStartNewTenantWizard, onBackToLanding }) {
  const [isRegister, setIsRegister] = useState(initialIsRegister);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loginError, setLoginError] = useState(null);

  // Register form state (para nuevo negocio)
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [businessType, setBusinessType] = useState('Repostería & Café');
  const [registerError, setRegisterError] = useState(null);

  // Iniciar sesión real contra Backend con JWT y Rate Limiting
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoginError(null);
    setLoadingLogin(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginEmail.trim(),
          password: loginPassword
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al iniciar sesión.');
      }

      // Éxito: entregar token, usuario y tenant autenticado
      onLoginSuccess(data);
    } catch (err) {
      setLoginError(err.message || 'Fallo de conexión al servidor de autenticación.');
    } finally {
      setLoadingLogin(false);
    }
  };

  // Validar y pasar datos al Wizard de personalización
  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    setRegisterError(null);

    if (!businessName.trim()) {
      setRegisterError('El nombre del negocio es obligatorio.');
      return;
    }
    if (!ownerName.trim()) {
      setRegisterError('El nombre del administrador es obligatorio.');
      return;
    }
    if (!registerEmail || !registerEmail.includes('@')) {
      setRegisterError('Por favor ingresa un correo electrónico válido.');
      return;
    }
    if (!registerPassword || registerPassword.length < 6) {
      setRegisterError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    onStartNewTenantWizard({
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      email: registerEmail.trim(),
      password: registerPassword,
      businessType
    });
  };

  return (
    <div className="w-full max-w-md mx-auto rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-flat-lg relative">
      
      {/* Botón Volver a Landing */}
      {onBackToLanding && (
        <button
          type="button"
          onClick={onBackToLanding}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a <span translate="no" className="notranslate">Task Master</span></span>
        </button>
      )}

      {/* Header del Auth */}
      <div className="text-center space-y-1.5 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white mx-auto flex items-center justify-center text-xl font-black shadow-xs font-display">
          TM
        </div>
        <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">
          Task Master <span className="text-slate-900">POS</span>
        </h2>
        <p className="text-xs text-slate-500">
          {isRegister ? 'Registra tu empresa y crea tu terminal personalizada' : 'Ingresa a tu punto de venta con tus credenciales protegidas'}
        </p>
      </div>

      {/* Toggle Iniciar Sesión / Registrar Nuevo Negocio */}
      <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200 mb-5 text-xs font-semibold">
        <button
          type="button"
          onClick={() => {
            setIsRegister(false);
            setLoginError(null);
            setRegisterError(null);
          }}
          className={`flex-1 py-2 rounded-xl transition-all ${
            !isRegister ? 'bg-white text-slate-900 shadow-sm font-bold border border-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Iniciar Sesión
        </button>
        <button
          type="button"
          onClick={() => {
            setIsRegister(true);
            setLoginError(null);
            setRegisterError(null);
          }}
          className={`flex-1 py-2 rounded-xl transition-all ${
            isRegister ? 'bg-white text-slate-900 shadow-sm font-bold border border-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Crear Nuevo Negocio
        </button>
      </div>

      {/* Formulario 1: Iniciar Sesión con JWT */}
      {!isRegister ? (
        <form onSubmit={handleLoginSubmit} className="space-y-3.5">
          {loginError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{loginError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">
              Correo Electrónico:
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-colors"
                placeholder="usuario@tu-negocio.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">
              Contraseña:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loadingLogin}
              className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm bg-slate-900 hover:bg-black text-white shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loadingLogin ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando credenciales...</span>
                </>
              ) : (
                <>
                  <span>Ingresar al POS</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      ) : (
        /* Formulario 2: Crear Nuevo Negocio */
        <form onSubmit={handleRegisterSubmit} className="space-y-3">
          {registerError && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{registerError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">
              Nombre de tu Negocio:
            </label>
            <div className="relative">
              <Store className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-colors"
                placeholder="Ej. Café & Deli Gourmet"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">
              Nombre del Administrador:
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-colors"
                placeholder="Ej. Carlos Mendoza"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">
              Correo Electrónico del Administrador:
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                value={registerEmail}
                onChange={(e) => setRegisterEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-colors"
                placeholder="carlos@negocio.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">
              Contraseña de Acceso (mín. 6 caracteres):
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-colors"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm bg-slate-900 hover:bg-black text-white shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>Continuar a Personalizar Marca y Terminal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Footer de Seguridad */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span className="flex items-center gap-1 text-slate-700 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
          <span>Protegido con JWT & Rate Limiting</span>
        </span>
        <span translate="no" className="notranslate text-slate-400">Task Master POS</span>
      </div>

    </div>
  );
}
