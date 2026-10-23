import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Sparkles,
  X,
  Trash2,
  HelpCircle,
  Bell,
  ArrowRight
} from 'lucide-react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showNovedades, setShowNovedades] = useState(false);
  const toastIdRef = useRef(0);

  // Mostrar un Toast personalizado
  const showToast = useCallback(({
    type = 'info', // 'success' | 'error' | 'warning' | 'info' | 'novedad'
    title = '',
    message = '',
    duration = 4500,
    action = null
  }) => {
    const id = ++toastIdRef.current;
    const newToast = { id, type, title, message, duration, action, createdAt: Date.now() };

    setToasts((prev) => [newToast, ...prev].slice(0, 5)); // Mantener máximo 5 activos

    if (duration > 0) {
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Helpers específicos
  const notifySuccess = useCallback((message, title = 'Operación Exitosa') => {
    return showToast({ type: 'success', title, message });
  }, [showToast]);

  const notifyError = useCallback((message, title = 'Ocurrió un Problema') => {
    return showToast({ type: 'error', title, message, duration: 6000 });
  }, [showToast]);

  const notifyWarning = useCallback((message, title = 'Atención Requerida') => {
    return showToast({ type: 'warning', title, message, duration: 5000 });
  }, [showToast]);

  const notifyInfo = useCallback((message, title = 'Información') => {
    return showToast({ type: 'info', title, message });
  }, [showToast]);

  const notifyNovedad = useCallback((message, title = '✨ Novedad de la Plataforma') => {
    return showToast({ type: 'novedad', title, message, duration: 7000 });
  }, [showToast]);

  // Diálogo de Confirmación Personalizado (reemplaza window.confirm)
  const confirm = useCallback(({
    title = '¿Estás seguro?',
    message = 'Esta acción no se puede deshacer.',
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'danger' // 'danger' | 'warning' | 'info'
  }) => {
    return new Promise((resolve) => {
      setConfirmDialog({
        title,
        message,
        confirmText,
        cancelText,
        type,
        onConfirm: () => {
          setConfirmDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmDialog(null);
          resolve(false);
        }
      });
    });
  }, []);

  const openNovedades = useCallback(() => setShowNovedades(true), []);
  const closeNovedades = useCallback(() => setShowNovedades(false), []);

  return (
    <NotificationContext.Provider
      value={{
        showToast,
        dismissToast,
        notifySuccess,
        notifyError,
        notifyWarning,
        notifyInfo,
        notifyNovedad,
        confirm,
        openNovedades
      }}
    >
      {children}

      {/* Contenedor Flotante de Toasts */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const typeConfig = {
            success: {
              icon: CheckCircle2,
              iconColor: 'text-emerald-500',
              bgColor: 'bg-white/95 dark:bg-slate-900/95',
              border: 'border-emerald-200 dark:border-emerald-800/60',
              glow: 'shadow-lg shadow-emerald-500/10',
              accent: 'bg-emerald-500'
            },
            error: {
              icon: AlertCircle,
              iconColor: 'text-rose-500',
              bgColor: 'bg-white/95 dark:bg-slate-900/95',
              border: 'border-rose-200 dark:border-rose-800/60',
              glow: 'shadow-lg shadow-rose-500/10',
              accent: 'bg-rose-500'
            },
            warning: {
              icon: AlertTriangle,
              iconColor: 'text-amber-500',
              bgColor: 'bg-white/95 dark:bg-slate-900/95',
              border: 'border-amber-200 dark:border-amber-800/60',
              glow: 'shadow-lg shadow-amber-500/10',
              accent: 'bg-amber-500'
            },
            info: {
              icon: Info,
              iconColor: 'text-indigo-500',
              bgColor: 'bg-white/95 dark:bg-slate-900/95',
              border: 'border-indigo-200 dark:border-indigo-800/60',
              glow: 'shadow-lg shadow-indigo-500/10',
              accent: 'bg-indigo-500'
            },
            novedad: {
              icon: Sparkles,
              iconColor: 'text-violet-500 animate-pulse',
              bgColor: 'bg-white/95 dark:bg-slate-900/95',
              border: 'border-violet-300 dark:border-violet-700/60',
              glow: 'shadow-xl shadow-violet-500/15',
              accent: 'bg-gradient-to-r from-violet-500 to-fuchsia-500'
            }
          }[toast.type] || {
            icon: Bell,
            iconColor: 'text-slate-500',
            bgColor: 'bg-white',
            border: 'border-slate-200',
            glow: 'shadow-md',
            accent: 'bg-slate-500'
          };

          const IconComponent = typeConfig.icon;

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto transform transition-all duration-300 ease-out translate-y-0 opacity-100 rounded-2xl p-3.5 border backdrop-blur-md ${typeConfig.bgColor} ${typeConfig.border} ${typeConfig.glow} flex items-start gap-3 relative overflow-hidden group`}
            >
              <div className={`absolute top-0 left-0 bottom-0 w-1 ${typeConfig.accent}`} />
              <div className="p-1 rounded-xl shrink-0 mt-0.5">
                <IconComponent className={`w-5 h-5 ${typeConfig.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0 pr-5">
                {toast.title && (
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 font-display tracking-tight leading-tight mb-0.5">
                    {toast.title}
                  </h4>
                )}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium break-words">
                  {toast.message}
                </p>
                {toast.action && (
                  <button
                    onClick={() => {
                      toast.action.onClick?.();
                      dismissToast(toast.id);
                    }}
                    className="mt-2 text-[11px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>{toast.action.label}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="absolute top-2.5 right-2.5 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal de Confirmación Personalizado */}
      {confirmDialog && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-scaleUp">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                  confirmDialog.type === 'danger'
                    ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 border border-rose-200 dark:border-rose-900'
                    : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 border border-amber-200 dark:border-amber-900'
                }`}
              >
                {confirmDialog.type === 'danger' ? (
                  <Trash2 className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 font-display">
                  {confirmDialog.title}
                </h3>
                <span className="text-[11px] uppercase tracking-wider font-mono text-slate-400 font-bold">
                  Confirmación requerida
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              {confirmDialog.message}
            </p>

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={confirmDialog.onCancel}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                {confirmDialog.cancelText}
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className={`px-4 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-all cursor-pointer ${
                  confirmDialog.type === 'danger'
                    ? 'bg-rose-600 hover:bg-rose-700 active:scale-95'
                    : 'bg-amber-600 hover:bg-amber-700 active:scale-95'
                }`}
              >
                {confirmDialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Novedades del Sistema */}
      {showNovedades && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={closeNovedades}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-md shadow-violet-500/20">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-violet-600 dark:text-violet-400">
                  TaskMaster v2.4 Updates
                </span>
                <h3 className="text-base font-black font-display text-slate-900 dark:text-white">
                  Novedades y Mejoras del Sistema
                </h3>
              </div>
            </div>

            <div className="space-y-3.5 mb-6">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">📸</span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Catálogo Visual con Espacio para Imágenes y Preview en Vivo
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Ahora puedes subir fotos desde tu equipo, pegar URLs o elegir presets gourmet. Visualiza exactamente cómo se verá la tarjeta del producto antes de guardarla.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔔</span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Sistema de Alertas y Notificaciones Personalizadas
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Reemplazamos todas las alertas nativas y diálogos genéricos del navegador por toasts estilizados con glassmorphism, microanimaciones y confirmaciones no invasivas.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔒</span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Persistencia de Tenant Activo y Catálogos en Cero
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Tu negocio seleccionado permanece intacto al recargar el navegador (F5) y los comercios nuevos inician con catálogo limpio listo para tu inventario personalizado.
                </p>
              </div>
            </div>

            <button
              onClick={closeNovedades}
              className="w-full py-2.5 rounded-xl font-bold text-xs text-white bg-slate-900 dark:bg-violet-600 hover:bg-slate-800 dark:hover:bg-violet-700 shadow-md transition-all cursor-pointer"
            >
              ¡Entendido, Continuar!
            </button>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification debe ser utilizado dentro de un NotificationProvider');
  }
  return context;
}
