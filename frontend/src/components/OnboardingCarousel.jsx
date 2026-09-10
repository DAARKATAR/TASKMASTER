import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, Cake, ShoppingBag, Receipt, Database, ArrowRight, Check } from 'lucide-react';

export default function OnboardingCarousel({ onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      id: 1,
      badge: 'PASO 1 DE 4 · IDENTIDAD DE MARCA',
      title: 'Creación de Marca Blanca "Tortas y Snacks"',
      subtitle: 'Personalización gráfica en tonos fucsia y pasteles planos',
      description: 'Cada empresa cliente define su identidad de forma única. Para "Tortas y Snacks", se aplica una paleta gastronómica dulce con acentos en fucsia (#DB2777), rosas suaves y crema pastelera, configurando automáticamente el subdominio y el slug del tenant.',
      icon: <Cake className="w-8 h-8 text-pink-600" />,
      tag: 'Identidad Visual Pastel',
      previewContent: (
        <div className="p-6 rounded-2xl bg-pink-50/60 border border-pink-200 text-center space-y-3 shadow-flat">
          <div className="w-16 h-16 rounded-2xl bg-white border-2 border-pink-300 mx-auto flex items-center justify-center text-3xl shadow-sm">
            🍰
          </div>
          <h4 className="text-lg font-black text-slate-900 font-display">Tortas y Snacks</h4>
          <p className="text-xs text-pink-700 font-medium">Repostería Artesanal & Café Gourmet</p>
          <div className="flex justify-center gap-2 pt-2">
            <span className="w-6 h-6 rounded-full bg-[#DB2777] border border-white shadow-sm" title="Fucsia Principal" />
            <span className="w-6 h-6 rounded-full bg-[#F472B6] border border-white shadow-sm" title="Rosa Pastel" />
            <span className="w-6 h-6 rounded-full bg-[#FCE7F3] border border-slate-200 shadow-sm" title="Crema Fresa" />
            <span className="w-6 h-6 rounded-full bg-[#FFFDF9] border border-slate-200 shadow-sm" title="Blanco Crema" />
          </div>
        </div>
      )
    },
    {
      id: 2,
      badge: 'PASO 2 DE 4 · CATÁLOGO & TERMINAL POS',
      title: 'Punto de Venta Táctil & Carrito Inteligente',
      subtitle: 'Optimizado para repostería, tartas, combos y cafetería rápida',
      description: 'El sistema aprovisiona una interfaz POS interactiva donde el cajero puede registrar órdenes en segundos, aplicar combos de merienda, calcular automáticamente el IVA (19%) y emitir el comprobante de control interno de venta.',
      icon: <ShoppingBag className="w-8 h-8 text-pink-600" />,
      tag: 'Terminal POS Inteligente',
      previewContent: (
        <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-2 text-xs font-mono shadow-flat">
          <div className="flex justify-between items-center text-pink-700 font-bold border-b border-slate-100 pb-2">
            <span>ORDEN POS #042</span>
            <span className="bg-pink-100 text-pink-800 px-2 py-0.5 rounded text-[10px]">SALÓN ROSA</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>1x Torta Selva Negra</span>
            <span className="text-slate-900 font-bold">$45.000</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>2x Cupcake Velvet Fucsia</span>
            <span className="text-slate-900 font-bold">$24.000</span>
          </div>
          <div className="flex justify-between text-slate-700">
            <span>1x Capuchino Vainilla</span>
            <span className="text-slate-900 font-bold">$9.500</span>
          </div>
          <div className="pt-2 border-t border-slate-100 flex justify-between text-slate-900 font-bold text-sm">
            <span>TOTAL:</span>
            <span className="text-pink-600 font-display text-base">$78.500 COP</span>
          </div>
        </div>
      )
    },
    {
      id: 3,
      badge: 'PASO 3 DE 4 · MOTOR SOAP & REGISTRO DE VENTA',
      title: 'Contrato WSDL 1.1 & Emisión de Comprobante',
      subtitle: 'Comprobantes de control interno con folio POS y código QR',
      description: 'Cada inquilino dispone de su propio endpoint SOAP con contrato WSDL personalizado. Cada ticket genera una transacción XML para control interno de caja.',
      icon: <Receipt className="w-8 h-8 text-pink-600" />,
      tag: 'SOAP 1.1 & Registro Interno',
      previewContent: (
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-[11px] font-mono text-slate-700 space-y-1.5 shadow-flat">
          <div className="text-pink-600 font-bold">&lt;soap:Envelope xmlns:tns=".../wsdl"&gt;</div>
          <div className="pl-3 text-slate-500">&lt;tns:BrandContext&gt;</div>
          <div className="pl-6 text-pink-700 font-semibold">&lt;emisor&gt;Tortas y Snacks&lt;/emisor&gt;</div>
          <div className="pl-6 text-emerald-600">&lt;status&gt;REGISTRADO_POS_INTERNO&lt;/status&gt;</div>
          <div className="pl-3 text-slate-500">&lt;/tns:BrandContext&gt;</div>
          <div className="pl-3 text-pink-600">&lt;tns:ConsultarFacturaResponse&gt;</div>
          <div className="pl-6 text-slate-900">&lt;numero&gt;TYS-1001&lt;/numero&gt;</div>
          <div className="pl-6 text-pink-700 font-bold">&lt;total&gt;60000.00&lt;/total&gt;</div>
          <div className="pl-3 text-pink-600">&lt;/tns:ConsultarFacturaResponse&gt;</div>
        </div>
      )
    },
    {
      id: 4,
      badge: 'PASO 4 DE 4 · ARQUITECTURA AISLADA DE DATOS',
      title: 'Entorno Exclusivo por Inquilino',
      subtitle: 'Seguridad estricta y cero riesgo de mezcla de información',
      description: 'El sistema aísla los comprobantes y el inventario en un entorno de almacenamiento exclusivo por comercio, garantizando confidencialidad total.',
      icon: <Database className="w-8 h-8 text-emerald-600" />,
      tag: 'Almacenamiento Aislado',
      previewContent: (
        <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs font-mono space-y-2.5 shadow-flat">
          <div className="flex items-center gap-2 text-emerald-800 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>ENTORNO SEGURO ACTIVO</span>
          </div>
          <div className="p-2 bg-white rounded-lg border border-emerald-200 text-emerald-800 text-[11px]">
            SET LOCAL search_path TO "tenant_tortasysnacks", public;
          </div>
          <p className="text-[11px] text-slate-600 font-sans leading-relaxed">
            Los comprobantes pertenecen exclusivamente al entorno aislado de la tienda.
          </p>
        </div>
      )
    }
  ];

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  const slide = slides[currentSlide];

  return (
    <div className="w-full max-w-4xl mx-auto rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-flat-lg relative overflow-hidden">
      
      {/* Header del Carrusel */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-pink-50 text-pink-600 border border-pink-100">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[10px] font-bold tracking-wider text-pink-700 uppercase block font-mono">
              {slide.badge}
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Ecosistema de Marca Blanca para Repostería & Snacks
            </span>
          </div>
        </div>

        {/* Indicadores */}
        <div className="flex items-center gap-1.5">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentSlide === idx ? 'w-8 bg-pink-600' : 'w-2 bg-slate-200 hover:bg-slate-300'
              }`}
              title={`Ir al paso ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Contenido */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center min-h-[290px]">
        
        {/* Info */}
        <div className="md:col-span-7 space-y-3">
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-pink-50 text-pink-700 border border-pink-200">
            {slide.tag}
          </span>

          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 font-display tracking-tight leading-snug">
            {slide.title}
          </h3>

          <p className="text-sm font-semibold text-pink-700">
            {slide.subtitle}
          </p>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            {slide.description}
          </p>

          <div className="pt-2">
            <button
              onClick={onComplete}
              className="px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-pink-600 hover:bg-pink-700 text-white shadow-flat transition-all flex items-center gap-2"
            >
              <span>Acceder al POS de Tortas y Snacks</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Preview */}
        <div className="md:col-span-5 flex justify-center">
          <div className="w-full max-w-xs">
            {slide.previewContent}
          </div>
        </div>

      </div>

      {/* Controles de Navegación */}
      <div className="flex items-center justify-between pt-5 mt-6 border-t border-slate-100 text-xs">
        <button
          onClick={prevSlide}
          className="flex items-center gap-1 text-slate-500 hover:text-slate-900 font-medium py-1 px-3 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Anterior</span>
        </button>

        <span className="text-slate-400 font-mono text-[11px]">
          Paso {currentSlide + 1} de {slides.length}
        </span>

        <button
          onClick={nextSlide}
          className="flex items-center gap-1 text-pink-700 hover:text-pink-800 font-bold py-1 px-3 rounded-lg hover:bg-pink-50 transition-colors"
        >
          <span>Siguiente</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}
