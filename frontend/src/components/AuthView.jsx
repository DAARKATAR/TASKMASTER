import React, { useState } from 'react';
import { Lock, Mail, Store, ArrowRight, ShieldCheck, ArrowLeft, User, Sparkles } from 'lucide-react';

export default function AuthView({ onLoginSuccess, onStartNewTenantWizard, onBackToLanding }) {
  const [isRegister, setIsRegister] = useState(false);
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState('mariana@tortasysnacks.com');
  const [loginPassword, setLoginPassword] = useState('password123');

  // Register form state (para nuevo negocio)
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [businessType, setBusinessType] = useState('Repostería & Café');

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    onLoginSuccess({
      name: loginEmail.includes('tortas') ? 'Mariana López' : 'Administrador',
      role: 'Administradora de Tienda POS',
      email: loginEmail,
      sucursal: 'Salón Principal',
      isExisting: true
    });
  };

  const handleRegisterSubmit = (e) => {
    e.preventDefault();
    // Pasa al carrusel de personalización de nuevo inquilino
    onStartNewTenantWizard({
      businessName: businessName || 'Mi Nuevo Negocio POS',
      ownerName: ownerName || 'Administrador',
      email: registerEmail,
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

      {/* Header del Auth en Blanco y Negro */}
      <div className="text-center space-y-1.5 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white mx-auto flex items-center justify-center text-xl font-black shadow-xs font-display">
          TM
        </div>
        <h2 className="text-2xl font-black text-slate-900 font-display tracking-tight">
          Task Master <span className="text-slate-900">POS</span>
        </h2>
        <p className="text-xs text-slate-500">
          {isRegister ? 'Crea tu nuevo negocio y personaliza tu terminal' : 'Ingresa a tu punto de venta o pruébalo en modo demo'}
        </p>
      </div>

      {/* Toggle Iniciar Sesión / Registrar Nuevo Negocio (Neutro Blanco/Gris/Negro) */}
      <div className="flex rounded-2xl bg-slate-100 p-1 border border-slate-200 mb-5 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setIsRegister(false)}
          className={`flex-1 py-2 rounded-xl transition-all ${
            !isRegister ? 'bg-white text-slate-900 shadow-sm font-bold border border-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Iniciar Sesión
        </button>
        <button
          type="button"
          onClick={() => setIsRegister(true)}
          className={`flex-1 py-2 rounded-xl transition-all ${
            isRegister ? 'bg-white text-slate-900 shadow-sm font-bold border border-slate-200' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Crear Nuevo Negocio
        </button>
      </div>

      {/* Formulario 1: Iniciar Sesión */}
      {!isRegister ? (
        <form onSubmit={handleLoginSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">
              Correo o Usuario:
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-colors"
                placeholder="usuario@negocio.com"
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

          <div className="pt-2 space-y-2">
            <button
              type="submit"
              className="w-full py-3 rounded-xl font-bold text-xs sm:text-sm bg-slate-900 hover:bg-black text-white shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>Ingresar al POS</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Demo Access */}
            <button
              type="button"
              onClick={() => {
                setLoginEmail('mariana@tortasysnacks.com');
                setLoginPassword('password123');
                onLoginSuccess({
                  name: 'Mariana López',
                  role: 'Administradora de Tienda POS',
                  email: 'mariana@tortasysnacks.com',
                  sucursal: 'Salón Rosa Principal',
                  isExisting: true
                });
              }}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Acceso Rápido Demo "Tortas y Snacks" 🍰</span>
            </button>
          </div>
        </form>
      ) : (
        /* Formulario 2: Crear Nuevo Negocio (Conduce al Carrusel de Personalización) */
        <form onSubmit={handleRegisterSubmit} className="space-y-3">
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
              Correo Electrónico:
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
              Contraseña de Acceso:
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-800 focus:bg-white transition-colors"
                placeholder="Mínimo 6 caracteres"
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
              <span>Continuar al Carrusel de Personalización</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

      {/* Footer de Seguridad */}
      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
        <span className="flex items-center gap-1 text-slate-700 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-600" />
          <span>Aislamiento de Datos Seguro</span>
        </span>
        <span translate="no" className="notranslate text-slate-400">Task Master POS</span>
      </div>

    </div>
  );
}
