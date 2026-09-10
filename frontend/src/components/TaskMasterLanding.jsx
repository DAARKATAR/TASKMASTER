import React from 'react';
import { Sparkles, ArrowRight, Shield, Layers, Receipt, Store, Palette, Smartphone, Laptop, CheckCircle2, ChevronRight, Cake, Coffee, ShoppingBag, AlertCircle } from 'lucide-react';

export default function TaskMasterLanding({ onGoToLogin, onStartRegistration, onQuickLaunchDemo }) {
  const features = [
    {
      icon: <Palette className="w-6 h-6 text-slate-800" />,
      title: 'Marca Blanca 100% Personalizable',
      description: 'Elige tu fondo limpio plano, colores corporativos, sube tu propio logo y configura la disposición del Navbar con esqueletos visuales.'
    },
    {
      icon: <Receipt className="w-6 h-6 text-slate-800" />,
      title: 'Comprobantes de Control Interno',
      description: 'Generación de recibos de venta internos y tickets térmicos de caja (no constituyen facturas fiscales oficiales reguladas).'
    },
    {
      icon: <Shield className="w-6 h-6 text-slate-800" />,
      title: 'Aislamiento Seguro de Datos',
      description: 'Cada negocio dispone de su entorno de almacenamiento aislado e independiente. Cero mezcla o cruce de información entre comercios.'
    },
    {
      icon: <Smartphone className="w-6 h-6 text-slate-800" />,
      title: 'Diseño Adaptable por Dispositivo',
      description: 'Navegación superior o lateral para computadoras de escritorio, y barra inferior táctil habilitada exclusivamente para celulares y tabletas.'
    }
  ];

  // Plantillas con nombres genéricos indicando el tipo de servicio o negocio
  const presets = [
    { 
      name: 'Plantilla: Pastelería & Repostería', 
      type: 'Servicio POS para panaderías, tartas y repostería artesanal', 
      emoji: '🍰', 
      color: '#DB2777', 
      tenantId: 'tortasysnacks' 
    },
    { 
      name: 'Plantilla: Cafetería & Restaurante', 
      type: 'Servicio POS para cafeterías de especialidad, bistró y comidas', 
      emoji: '☕', 
      color: '#D97706', 
      tenantId: 'cafepuerto' 
    },
    { 
      name: 'Plantilla: Tienda Retail & Boutique', 
      type: 'Servicio POS para comercio de moda, calzado y accesorios', 
      emoji: '🛍️', 
      color: '#4F46E5', 
      tenantId: 'boutiqueurbana' 
    }
  ];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col selection:bg-slate-900 selection:text-white">
      
      {/* Header / Navbar de la Landing */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Task Master */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-black text-lg shadow-sm" translate="no">
              TM
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-slate-900 font-display flex items-center gap-1.5">
                <span translate="no" className="notranslate">Task Master</span> <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-slate-100 text-slate-800 border border-slate-300">POS Platform</span>
              </span>
              <p className="text-[10px] text-slate-500 font-mono">Plataforma Multi-Tenant de Punto de Venta</p>
            </div>
          </div>

          {/* Botones de Acción (Paleta Blanco, Negro y Gris) */}
          <div className="flex items-center gap-3">
            <button
              onClick={onGoToLogin}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition-colors"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={onStartRegistration}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-black shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>Crear Mi POS Personalizado</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 pb-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center space-y-7">
        
        {/* Badge en tonos neutros */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 border border-slate-300 shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-slate-700" />
          <span>Plataforma Central POS White-Label para Diversos Rubros</span>
        </div>

        {/* Título Principal */}
        <div className="max-w-4xl mx-auto space-y-4">
          <h1 className="text-4xl sm:text-6xl font-black text-slate-900 font-display tracking-tight leading-tight">
            Crea tu propio punto de venta con <span translate="no" className="notranslate text-slate-900 underline decoration-slate-400 decoration-wavy decoration-2">Task Master</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Personaliza el fondo, tus colores, logotipo y la disposición de tu barra de navegación con esqueletos interactivos. Comprobantes de control interno y datos aislados de forma segura e independiente.
          </p>
        </div>

        {/* Aviso de No Certificación Fiscal (Transparencia Total) */}
        <div className="max-w-xl mx-auto p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
          <span className="text-left font-sans leading-tight">
            <strong>Aviso de Control Interno:</strong> Los comprobantes generados son para registro y control de venta de caja; no cuentan con certificación fiscal oficial ni timbre regulatorio.
          </span>
        </div>

        {/* Botones Call to Action (Blanco, Negro y Gris) */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-1">
          <button
            onClick={onStartRegistration}
            className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-slate-900 hover:bg-black text-white shadow-md transition-all flex items-center gap-2 hover:scale-[1.02]"
          >
            <span>Configurar Nuevo Negocio (Onboarding 4 Pasos)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onQuickLaunchDemo}
            className="px-6 py-3.5 rounded-2xl font-bold text-sm bg-white border border-slate-300 hover:border-slate-400 text-slate-800 shadow-sm transition-all flex items-center gap-2 hover:bg-slate-50"
          >
            <span>Ver Demo (Plantilla Pastelería)</span>
            <span className="text-base">🍰</span>
          </button>
        </div>

        {/* Preview de la Suite POS con Nombres Genéricos de Plantillas */}
        <div className="pt-6 max-w-5xl mx-auto">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-4 sm:p-6 shadow-flat-lg">
            
            {/* Barra de simulación de ventana */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-4 text-xs text-slate-500 font-mono">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                <span className="w-3 h-3 rounded-full bg-slate-300"></span>
                <span className="pl-2 font-semibold text-slate-700">app.taskmaster-pos.com/terminal</span>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <span className="text-slate-800 bg-white px-2.5 py-0.5 rounded border border-slate-200 font-semibold">Datos Aislados</span>
                <span className="text-slate-800 bg-white px-2.5 py-0.5 rounded border border-slate-200 font-semibold">Control de Caja POS</span>
              </div>
            </div>

            {/* Grid de Plantillas Genéricas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
              {presets.map((p, idx) => (
                <div 
                  key={idx} 
                  onClick={() => p.tenantId === 'tortasysnacks' ? onQuickLaunchDemo() : onStartRegistration()}
                  className="p-5 rounded-2xl bg-white border border-slate-200 hover:border-slate-400 hover:shadow-md transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-3xl p-2 rounded-xl bg-slate-100 border border-slate-200 group-hover:scale-110 transition-transform">
                      {p.emoji}
                    </span>
                    <span 
                      className="w-4 h-4 rounded-full border border-slate-300 shadow-sm"
                      style={{ backgroundColor: p.color }}
                    />
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 font-display group-hover:text-black transition-colors">
                    {p.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 leading-snug">{p.type}</p>
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-800">
                    <span>{p.tenantId === 'tortasysnacks' ? 'Abrir Demostración' : 'Crear con este rubro'}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </section>

      {/* Características Principales */}
      <section className="py-16 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto space-y-3 mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 font-display">
              Todo lo que necesitas para tu punto de venta en una sola plataforma
            </h2>
            <p className="text-sm text-slate-600">
              Diseñado con arquitectura modular para garantizar alto rendimiento, personalización visual completa y aislamiento de datos.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feat, i) => (
              <div key={i} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-flat-sm space-y-3">
                <div className="p-3 rounded-2xl bg-slate-100 border border-slate-200 w-fit">
                  {feat.icon}
                </div>
                <h3 className="font-bold text-sm text-slate-900 font-display">
                  {feat.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500 font-sans">
          <div className="flex items-center gap-2 font-mono">
            <strong translate="no" className="notranslate text-slate-900">Task Master POS</strong> · Plataforma Multi-Tenant de Marca Blanca
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onGoToLogin} className="hover:text-slate-900 font-semibold">Iniciar Sesión</button>
            <span>·</span>
            <button onClick={onStartRegistration} className="hover:text-slate-900 font-semibold">Registrar Negocio</button>
            <span>·</span>
            <span className="text-slate-600 font-mono">Arquitectura Multi-Inquilino</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
