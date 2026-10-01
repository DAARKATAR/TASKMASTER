// URL canónica de producción en Render
export const PRODUCTION_RENDER_API = 'https://taskmaster-soq6.onrender.com';

/**
 * Resolución inteligente de la URL base del Backend:
 * 1. Si existe la variable VITE_API_URL en el entorno de compilación, se respeta con máxima prioridad.
 * 2. Si estamos en desarrollo local en el navegador (localhost / 127.0.0.1), se usa '' para aprovechar
 *    el proxy configurado en vite.config.js o el backend local en puerto 3000.
 * 3. En producción (Cloudflare Pages, vistas remotas, preview), apunta automáticamente al backend desplegado en Render.
 */
export function getApiBaseUrl() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return '';
    }
  }
  return PRODUCTION_RENDER_API;
}

export const API_BASE_URL = getApiBaseUrl();

/**
 * Helper seguro para realizar peticiones HTTP que esperan JSON.
 * Evita el error 'Unexpected end of JSON input' al inspeccionar el Content-Type
 * y capturar respuestas vacías o no válidas.
 */
export async function safeFetchJson(url, options = {}) {
  const res = await fetch(url, options);
  const contentType = res.headers.get('content-type') || '';
  let data = null;

  if (contentType.includes('application/json')) {
    try {
      data = await res.json();
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const errorMsg = data?.error || data?.message || `Error del servidor HTTP ${res.status}`;
    throw new Error(errorMsg);
  }

  return data;
}

export default API_BASE_URL;
