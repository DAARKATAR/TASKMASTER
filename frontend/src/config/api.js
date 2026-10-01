// Configuración inteligente de la URL base del Backend:
// 1. Si existe VITE_API_URL, se usa esa URL (ej. en despliegue desacoplado en Cloudflare Pages).
// 2. Si no, utiliza cadena vacía '' para aprovechar el proxy de Vite en desarrollo o rutas relativas /api en producción unificada.
export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? '' : (process.env.NODE_ENV === 'production' && window.location.origin.includes('localhost') ? '' : (import.meta.env.VITE_API_URL || '')));
