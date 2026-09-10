import React, { useState, useRef, useEffect } from 'react';
import { Palette, Upload, Image as ImageIcon, Layout, Check, ArrowRight, ArrowLeft, Smartphone, Monitor, AlertCircle, Sparkles, Store, Building, User, Mail, Lock, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config/api';

export default function NewTenantWizard({ initialData, onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  
  // Datos del nuevo inquilino
  const [businessName, setBusinessName] = useState(initialData?.businessName || '');
  const [businessType, setBusinessType] = useState(initialData?.businessType || 'Repostería & Café');
  const [ownerName, setOwnerName] = useState(initialData?.ownerName || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [password, setPassword] = useState(initialData?.password || '');

  // Estados de validación y carga
  const [step1Error, setStep1Error] = useState(null);
  const [provisionError, setProvisionError] = useState(null);
  const [loadingProvision, setLoadingProvision] = useState(false);
  
  // 1. Fondos planos (Mínimo 4) y color de marca
  const [bgTheme, setBgTheme] = useState('white');
  const [brandColor, setBrandColor] = useState('#DB2777'); // Color elegido por el cliente
  
  // 2. Logo (subido o preset)
  const [logoType, setLogoType] = useState('emoji'); // 'emoji' | 'upload'
  const [logoEmoji, setLogoEmoji] = useState('🍰');
  const [uploadedLogo, setUploadedLogo] = useState(null);
  const fileInputRef = useRef(null);

  // 3. Layout y regla de dispositivo
  const [navbarPosition, setNavbarPosition] = useState('top');
  const [isMobileSimulated, setIsMobileSimulated] = useState(false);
  const [isDesktopScreen, setIsDesktopScreen] = useState(true);
  const [acceptedFiscalDisclaimer, setAcceptedFiscalDisclaimer] = useState(false);

  useEffect(() => {
    const checkScreen = () => {
      setIsDesktopScreen(window.innerWidth >= 1024);
    };
    checkScreen();
    window.addEventListener('resize', checkScreen);
    return () => window.removeEventListener('resize', checkScreen);
  }, []);

  const bgOptions = [
    { id: 'white', name: 'Blanco Puro', bg: '#FFFFFF', border: '#E2E8F0', desc: 'Limpio y minimalista' },
    { id: 'cream', name: 'Crema Pastel', bg: '#FDFBF7', border: '#F2E8D5', desc: 'Cálido y artesanal' },
    { id: 'pink', name: 'Rosa Algodón', bg: '#FFF5F7', border: '#FCE7F3', desc: 'Elegante y dulce' },
    { id: 'lavender', name: 'Lavanda Suave', bg: '#F8F7FF', border: '#EDE9FE', desc: 'Moderno y relajante' },
    { id: 'mint', name: 'Menta Fresca', bg: '#F0FDF4', border: '#DCFCE7', desc: 'Fresco y orgánico' },
    { id: 'slate', name: 'Gris Nórdico', bg: '#F8FAFC', border: '#E2E8F0', desc: 'Corporativo neutro' }
  ];

  const brandOptions = [
    { name: 'Fucsia Artesanal', hex: '#DB2777' },
    { name: 'Esmeralda Fresco', hex: '#059669' },
    { name: 'Índigo Moderno', hex: '#4F46E5' },
    { name: 'Ámbar Cálido', hex: '#D97706' },
    { name: 'Azul Corporativo', hex: '#2563EB' },
  ];

  const logoPresets = [
    { emoji: '🍰', label: 'Pastelería & Repostería' },
    { emoji: '☕', label: 'Cafetería & Espresso' },
    { emoji: '🛍️', label: 'Boutique & Retail' },
    { emoji: '💊', label: 'Farmacia & Salud' },
    { emoji: '🛒', label: 'Minimarket & Abarrotes' },
    { emoji: '🍔', label: 'Comida Rápida & Snacks' },
    { emoji: '🍕', label: 'Pizzería & Restaurante' },
    { emoji: '🍹', label: 'Bebidas & Coctelería' }
  ];

  // Manejador de subida de archivo
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedLogo(event.target.result);
        setLogoType('upload');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFinish = async () => {
    setProvisionError(null);
    setLoadingProvision(true);

    try {
      const slug = businessName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'minuevopos';
      const finalLogo = logoType === 'upload' ? uploadedLogo : logoEmoji;
      const finalNavPos = (isDesktopScreen && !isMobileSimulated && navbarPosition === 'bottom') ? 'top' : navbarPosition;

      const res = await fetch(`${API_BASE_URL}/api/auth/register-tenant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          slug,
          brandColor,
          logo: finalLogo,
          businessType,
          ownerName: ownerName.trim() || 'Administrador',
          email: email.trim(),
          password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al aprovisionar el nuevo negocio.');
      }

      // Éxito: pasar la sesión con token y tenant creado
      onComplete({
        token: data.token,
        user: data.user,
        tenant: data.tenant,
        bgTheme,
        navbarPosition: finalNavPos
      });
    } catch (err) {
      setProvisionError(err.message || 'Error al comunicarse con el servidor.');
    } finally {
      setLoadingProvision(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl bg-white border border-slate-200 shadow-flat-lg overflow-hidden flex flex-col my-auto">
      
      {/* Header del Onboarding (Paleta Task Master Blanco, Negro y Gris) */}
      <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
        <div>
          <div className="flex items-center gap-2">
            <span translate="no" className="notranslate px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-900 text-white">
              Task Master Onboarding
            </span>
            <span className="text-xs font-semibold text-slate-500">Paso {step} de 4</span>
          </div>
          <h2 className="text-lg font-black text-slate-900 font-display mt-0.5">
            Configuración Inicial de tu Marca Blanca POS
          </h2>
        </div>

        {/* Indicador de Pasos en Escala de Grises */}
        <div className="flex items-center gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`h-2 rounded-full transition-all duration-300 ${
                step === s ? 'w-8 bg-slate-900' : step > s ? 'w-4 bg-slate-500' : 'w-2 bg-slate-200'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Contenido del Paso Actual */}
      <div className="p-6 sm:p-8 flex-1">
        
        {/* ======================================================== */}
        {/* PASO 1: COLORES DE FONDO Y MARCA (MÍNIMO 4 FONDOS PLANOS) */}
        {/* ======================================================== */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <Palette className="w-4 h-4 text-slate-800" />
                <span>1. Elige el Color de Fondo y el Color que Tendrá tu POS al Iniciar Sesión</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                La plataforma previa es neutral (blanco, negro y gris). Aquí eliges cómo lucirá tu sistema POS cuando ingreses.
              </p>
            </div>

            {step1Error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{step1Error}</span>
              </div>
            )}

            {/* Datos de Negocio y Credenciales de Administrador */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">
                    Nombre de tu Negocio: *
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => {
                      setBusinessName(e.target.value);
                      if (step1Error) setStep1Error(null);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800"
                    placeholder="Ej. Tortas y Snacks, Café Del Puerto..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">
                    Giro / Categoría:
                  </label>
                  <input
                    type="text"
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-slate-800"
                    placeholder="Ej. Pastelería, Cafetería, Restaurante..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200/60">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">
                    Administrador: *
                  </label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => {
                      setOwnerName(e.target.value);
                      if (step1Error) setStep1Error(null);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-800"
                    placeholder="Ej. Carlos Mendoza"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">
                    Correo Electrónico: *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (step1Error) setStep1Error(null);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-800"
                    placeholder="carlos@negocio.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 font-mono">
                    Contraseña (mín 6 car.): *
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (step1Error) setStep1Error(null);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-slate-800"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Selector de Fondos Planos */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">
                Color de Fondo Limpio (6 Opciones a elección):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {bgOptions.map((opt) => {
                  const isSelected = bgTheme === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setBgTheme(opt.id)}
                      className={`p-3.5 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                        isSelected 
                          ? 'border-slate-900 ring-2 ring-slate-900/15 shadow-sm' 
                          : 'border-slate-200 hover:border-slate-400'
                      }`}
                      style={{ backgroundColor: opt.bg }}
                    >
                      <span 
                        className="w-5 h-5 rounded-full border border-slate-300 shadow-inner shrink-0 mt-0.5" 
                        style={{ backgroundColor: opt.bg }}
                      />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">{opt.name}</span>
                        <span className="text-[10px] text-slate-500 block">{opt.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selector de Color de Marca para cuando inicie sesión */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 font-mono">
                Color de Acento que tendrán tus botones tras iniciar sesión:
              </label>
              <div className="flex flex-wrap items-center gap-3">
                {brandOptions.map((brand) => {
                  const isSelected = brandColor === brand.hex;
                  return (
                    <button
                      key={brand.hex}
                      type="button"
                      onClick={() => setBrandColor(brand.hex)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
                        isSelected 
                          ? 'border-slate-900 bg-slate-900 text-white shadow-sm' 
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <span 
                        className="w-3.5 h-3.5 rounded-full border border-white/50" 
                        style={{ backgroundColor: brand.hex }}
                      />
                      <span>{brand.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* PASO 2: SUBIDA Y ELECCIÓN DE LOGOTIPOS */}
        {/* ======================================================== */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-slate-800" />
                <span>2. Identidad Gráfica: Sube tu Logo o Elige un Ícono</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Este logotipo aparecerá en la cabecera de tu POS y en la impresión de tickets térmicos y facturas.
              </p>
            </div>

            {/* Opciones: Subir Archivo vs Preset */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
              
              {/* Opción A: Subir imagen */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-flat-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 font-display">Opción 1: Subir Archivo Propio</span>
                  <Upload className="w-4 h-4 text-slate-400" />
                </div>

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                    logoType === 'upload' && uploadedLogo 
                      ? 'border-slate-900 bg-slate-50' 
                      : 'border-slate-300 hover:border-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />

                  {uploadedLogo ? (
                    <div className="space-y-2">
                      <img 
                        src={uploadedLogo} 
                        alt="Logo subido" 
                        className="w-20 h-20 object-contain mx-auto rounded-xl border border-slate-200 p-1 bg-white shadow-xs" 
                      />
                      <span className="text-xs font-bold text-slate-900 block">✓ Logo cargado con éxito</span>
                      <span className="text-[10px] text-slate-400">Haz clic para cambiar de imagen</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center mx-auto">
                        <Upload className="w-5 h-5" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 block">Cargar archivo PNG, JPG o SVG</span>
                      <span className="text-[11px] text-slate-400 block">Arrastra una imagen o haz clic aquí</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Opción B: Colección de Logos / Emojis de Tienda */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-flat-sm space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 font-display">Opción 2: Elegir Emblema Preset</span>
                  <Store className="w-4 h-4 text-slate-400" />
                </div>

                <div className="grid grid-cols-4 gap-2.5">
                  {logoPresets.map((preset, idx) => {
                    const isSelected = logoType === 'emoji' && logoEmoji === preset.emoji;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setLogoEmoji(preset.emoji);
                          setLogoType('emoji');
                        }}
                        className={`p-3 rounded-2xl border text-center transition-all ${
                          isSelected 
                            ? 'border-slate-900 bg-slate-100 ring-2 ring-slate-900/10 shadow-sm font-bold' 
                            : 'border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300'
                        }`}
                        title={preset.label}
                      >
                        <span className="text-2xl block">{preset.emoji}</span>
                        <span className="text-[9px] text-slate-500 truncate block mt-1">{preset.label.split(' ')[0]}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Vista Previa del Header */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase font-mono">Previsualización en el POS:</span>
              <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xs">
                <div 
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg shadow-xs"
                  style={{ backgroundColor: brandColor }}
                >
                  {logoType === 'upload' && uploadedLogo ? (
                    <img src={uploadedLogo} alt="Logo" className="w-7 h-7 object-contain rounded" />
                  ) : (
                    logoEmoji
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-black text-slate-900 font-display">{businessName}</h4>
                  <span className="text-[10px] text-slate-600 font-semibold block">{businessType} · POS White-Label</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* PASO 3: ESQUELETOS (SKELETONS) & REGLA DE DISPOSITIVOS    */}
        {/* ======================================================== */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display flex items-center gap-2">
                <Layout className="w-4 h-4 text-slate-800" />
                <span>3. Disposición de la Interfaz: Elige con Esqueletos Visuales</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Visualiza los esqueletos interactivos. <strong>Regla:</strong> La barra inferior está inhabilitada en PC y habilitada exclusivamente para celulares y tabletas.
              </p>
            </div>

            {/* Toggle de Simulación Móvil / Tablet */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-slate-500" />
                <span>Modo de visualización actual: <strong>{isMobileSimulated ? 'Simulador Celular / Tablet' : 'Pantalla de Escritorio (PC)'}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const nextSim = !isMobileSimulated;
                  setIsMobileSimulated(nextSim);
                  if (nextSim) setNavbarPosition('bottom');
                  else if (navbarPosition === 'bottom') setNavbarPosition('top');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-all border ${
                  isMobileSimulated 
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs' 
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{isMobileSimulated ? 'Volver a Modo PC' : 'Simular Celular / Tableta'}</span>
              </button>
            </div>

            {/* Grilla de Esqueletos (Skeletons) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Esqueleto 1: Navbar Arriba (Top) */}
              <div 
                onClick={() => setNavbarPosition('top')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  navbarPosition === 'top' 
                    ? 'border-slate-900 ring-2 ring-slate-900/15 bg-slate-50/50 shadow-sm' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">Arriba (Top)</span>
                    {navbarPosition === 'top' && <Check className="w-4 h-4 text-slate-900" />}
                  </div>
                  
                  {/* Visual Skeleton Wireframe */}
                  <div className="w-full h-32 rounded-xl bg-slate-100 border border-slate-200 p-2 flex flex-col gap-1.5">
                    {/* Barra Superior con color de marca elegido */}
                    <div 
                      className="h-4 w-full rounded-md flex items-center justify-between px-1.5"
                      style={{ backgroundColor: brandColor }}
                    >
                      <div className="w-3 h-2 rounded bg-white/80" />
                      <div className="flex gap-1">
                        <div className="w-4 h-1.5 rounded bg-white/60" />
                        <div className="w-4 h-1.5 rounded bg-white/60" />
                      </div>
                    </div>
                    {/* Cuerpo */}
                    <div className="flex-1 flex gap-1.5">
                      <div className="flex-1 rounded-md bg-white border border-slate-200 p-1 flex flex-col gap-1">
                        <div className="h-2 w-10 rounded bg-slate-200" />
                        <div className="grid grid-cols-2 gap-1 flex-1">
                          <div className="rounded bg-slate-200/60" />
                          <div className="rounded bg-slate-200/60" />
                        </div>
                      </div>
                      <div className="w-8 rounded-md bg-white border border-slate-200 p-1 flex flex-col gap-1">
                        <div className="h-2 w-full rounded bg-slate-200" />
                        <div className="h-4 w-full rounded bg-slate-100" />
                      </div>
                    </div>
                  </div>
                </div>

                <span className="text-[11px] text-slate-500 mt-2 block">
                  Recomendado para computadoras y monitores amplios.
                </span>
              </div>

              {/* Esqueleto 2: Navbar Izquierda (Sidebar Left) */}
              <div 
                onClick={() => setNavbarPosition('left')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  navbarPosition === 'left' 
                    ? 'border-slate-900 ring-2 ring-slate-900/15 bg-slate-50/50 shadow-sm' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">Izquierda (Left)</span>
                    {navbarPosition === 'left' && <Check className="w-4 h-4 text-slate-900" />}
                  </div>
                  
                  {/* Visual Skeleton Wireframe */}
                  <div className="w-full h-32 rounded-xl bg-slate-100 border border-slate-200 p-2 flex gap-1.5">
                    {/* Barra Izquierda */}
                    <div 
                      className="w-7 h-full rounded-md flex flex-col gap-1 items-center p-1"
                      style={{ backgroundColor: brandColor }}
                    >
                      <div className="w-4 h-3 rounded bg-white/80 mb-1" />
                      <div className="w-4 h-1 rounded bg-white/60" />
                      <div className="w-4 h-1 rounded bg-white/60" />
                      <div className="w-4 h-1 rounded bg-white/60" />
                    </div>
                    {/* Cuerpo */}
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="h-3 w-full rounded bg-white border border-slate-200" />
                      <div className="flex-1 rounded bg-white border border-slate-200 p-1 grid grid-cols-2 gap-1">
                        <div className="rounded bg-slate-200/60" />
                        <div className="rounded bg-slate-200/60" />
                      </div>
                    </div>
                  </div>
                </div>

                <span className="text-[11px] text-slate-500 mt-2 block">
                  Formato tipo panel administrativo lateral.
                </span>
              </div>

              {/* Esqueleto 3: Navbar Derecha (Sidebar Right) */}
              <div 
                onClick={() => setNavbarPosition('right')}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                  navbarPosition === 'right' 
                    ? 'border-slate-900 ring-2 ring-slate-900/15 bg-slate-50/50 shadow-sm' 
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">Derecha (Right)</span>
                    {navbarPosition === 'right' && <Check className="w-4 h-4 text-slate-900" />}
                  </div>
                  
                  {/* Visual Skeleton Wireframe */}
                  <div className="w-full h-32 rounded-xl bg-slate-100 border border-slate-200 p-2 flex gap-1.5">
                    {/* Cuerpo */}
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="h-3 w-full rounded bg-white border border-slate-200" />
                      <div className="flex-1 rounded bg-white border border-slate-200 p-1 grid grid-cols-2 gap-1">
                        <div className="rounded bg-slate-200/60" />
                        <div className="rounded bg-slate-200/60" />
                      </div>
                    </div>
                    {/* Barra Derecha */}
                    <div 
                      className="w-7 h-full rounded-md flex flex-col gap-1 items-center p-1"
                      style={{ backgroundColor: brandColor }}
                    >
                      <div className="w-4 h-3 rounded bg-white/80 mb-1" />
                      <div className="w-4 h-1 rounded bg-white/60" />
                      <div className="w-4 h-1 rounded bg-white/60" />
                    </div>
                  </div>
                </div>

                <span className="text-[11px] text-slate-500 mt-2 block">
                  Ideal para cajeros con pantalla táctil a la derecha.
                </span>
              </div>

              {/* Esqueleto 4: Navbar Abajo (Bottom) - REGLA: INHABILITADA PARA PC */}
              {(() => {
                const isBottomAllowed = isMobileSimulated || !isDesktopScreen;
                return (
                  <div 
                    onClick={() => {
                      if (isBottomAllowed) setNavbarPosition('bottom');
                    }}
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between relative ${
                      !isBottomAllowed 
                        ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed' 
                        : navbarPosition === 'bottom'
                        ? 'border-slate-900 ring-2 ring-slate-900/15 bg-slate-50/50 shadow-sm cursor-pointer'
                        : 'border-slate-200 bg-white hover:border-slate-300 cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900">Abajo (Bottom)</span>
                          <Smartphone className="w-3 h-3 text-slate-700" />
                        </div>
                        {navbarPosition === 'bottom' && isBottomAllowed && <Check className="w-4 h-4 text-slate-900" />}
                      </div>

                      {/* Visual Skeleton Wireframe */}
                      <div className="w-full h-32 rounded-xl bg-slate-100 border border-slate-200 p-2 flex flex-col justify-between">
                        <div className="flex-1 rounded-md bg-white border border-slate-200 p-1 flex flex-col gap-1 mb-1">
                          <div className="h-2 w-12 rounded bg-slate-200" />
                          <div className="grid grid-cols-2 gap-1 flex-1">
                            <div className="rounded bg-slate-200/60" />
                            <div className="rounded bg-slate-200/60" />
                          </div>
                        </div>
                        {/* Barra Inferior */}
                        <div 
                          className={`h-4 w-full rounded-md flex items-center justify-around px-2 ${
                            !isBottomAllowed ? 'bg-slate-400' : ''
                          }`}
                          style={isBottomAllowed ? { backgroundColor: brandColor } : {}}
                        >
                          <div className="w-2.5 h-2 rounded bg-white/90" />
                          <div className="w-2.5 h-2 rounded bg-white/70" />
                          <div className="w-2.5 h-2 rounded bg-white/70" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-2">
                      {!isBottomAllowed ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 block text-center">
                          ⚠️ Inhabilitada para PC
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-emerald-700 block text-center">
                          ✓ Habilitada para Móviles/Tablets
                        </span>
                      )}
                    </div>
                  </div>
                );
              })()}

            </div>

          </div>
        )}

        {/* ======================================================== */}
        {/* PASO 4: RESUMEN Y LANZAMIENTO                             */}
        {/* ======================================================== */}
        {step === 4 && (
          <div className="space-y-6 text-center max-w-lg mx-auto py-4">
            
            <div className="w-16 h-16 rounded-3xl mx-auto flex items-center justify-center text-3xl shadow-sm border border-slate-200" style={{ backgroundColor: brandColor }}>
              {logoType === 'upload' && uploadedLogo ? (
                <img src={uploadedLogo} alt="Logo" className="w-10 h-10 object-contain rounded-lg" />
              ) : (
                <span className="text-white">{logoEmoji}</span>
              )}
            </div>

            <div className="space-y-1">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider font-mono">
                ¡Todo Listo para el Lanzamiento!
              </span>
              <h3 className="text-2xl font-black text-slate-900 font-display">
                {businessName}
              </h3>
              <p className="text-xs text-slate-500">
                Tu terminal POS se abrirá ahora con tu paleta personalizada.
              </p>
            </div>

            {/* Resumen */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-left space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Fondo Seleccionado:</span>
                <strong className="text-slate-800 capitalize">{bgTheme}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Color de tu POS:</span>
                <span className="flex items-center gap-1.5 font-bold text-slate-800">
                  <span className="w-3.5 h-3.5 rounded-full border border-slate-300" style={{ backgroundColor: brandColor }} />
                  {brandColor}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Disposición de Navbar:</span>
                <strong className="text-slate-800 capitalize">{navbarPosition}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Identificador del Comercio:</span>
                <code className="text-slate-800 font-mono text-[11px] font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                  {businessName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'tienda'}
                </code>
              </div>
            </div>

            {/* Casilla de Descargo de No Certificación Fiscal (Requerimiento Obligatorio) */}
            <div className="p-4 rounded-2xl bg-amber-50/90 border border-amber-200 text-left transition-all">
              <label className="flex items-start gap-3 cursor-pointer text-xs text-amber-950 leading-relaxed font-sans">
                <input
                  type="checkbox"
                  checked={acceptedFiscalDisclaimer}
                  onChange={(e) => setAcceptedFiscalDisclaimer(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-amber-300 text-slate-900 focus:ring-slate-900 cursor-pointer shrink-0"
                />
                <span>
                  Entiendo y acepto que las facturas y comprobantes generados por el sistema son para <strong>control interno de venta</strong> y <u>no cuentan aún con certificación fiscal oficial ni regulación digital gubernamental</u>.
                </span>
              </label>
            </div>

            {provisionError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 text-left">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span>{provisionError}</span>
              </div>
            )}

            <button
              onClick={handleFinish}
              disabled={!acceptedFiscalDisclaimer || loadingProvision}
              className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                acceptedFiscalDisclaimer && !loadingProvision
                  ? 'bg-slate-900 hover:bg-black text-white shadow-md cursor-pointer'
                  : 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
              }`}
            >
              {loadingProvision ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Configurando tu punto de venta e iniciando sesión...</span>
                </>
              ) : (
                <>
                  <span>{acceptedFiscalDisclaimer ? 'Aprovisionar Negocio & Abrir POS' : 'Acepta la casilla para continuar'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

          </div>
        )}

      </div>

      {/* Controles de Navegación del Carrusel (Blanco, Negro y Gris) */}
      <div className="p-4 sm:p-6 border-t border-slate-200 flex items-center justify-between bg-slate-50/80">
        <button
          type="button"
          onClick={() => step > 1 ? setStep(step - 1) : onCancel()}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{step === 1 ? 'Volver a Inicio' : 'Anterior'}</span>
        </button>

        {step < 4 && (
          <button
            type="button"
            onClick={() => {
              if (step === 1) {
                if (!businessName.trim()) {
                  setStep1Error('El nombre del negocio es obligatorio.');
                  return;
                }
                if (!ownerName.trim()) {
                  setStep1Error('El nombre del administrador es obligatorio.');
                  return;
                }
                if (!email || !email.includes('@')) {
                  setStep1Error('Por favor ingresa un correo electrónico válido.');
                  return;
                }
                if (!password || password.length < 6) {
                  setStep1Error('La contraseña de acceso debe tener al menos 6 caracteres.');
                  return;
                }
                setStep1Error(null);
              }
              setStep(step + 1);
            }}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-slate-900 hover:bg-black shadow-xs transition-colors"
          >
            <span>Siguiente Paso</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

    </div>
  );
}
