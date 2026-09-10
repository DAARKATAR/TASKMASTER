/**
 * Servicio de Caché Multi-Tenant (Upstash Redis REST + Fallback en Memoria)
 * Diseñado según la capa 4 de la arquitectura multi-tenant ($0 USD/Mes).
 */

const inMemoryStore = new Map();
const DEFAULT_TTL_SECONDS = 300; // 5 minutos

const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const hasUpstash = Boolean(upstashUrl && upstashToken);

if (hasUpstash) {
  console.log('[Cache] Upstash Redis REST habilitado y configurado.');
} else {
  console.log('[Cache] Modo Local: Utilizando caché L1 en memoria de alta velocidad con TTL.');
}

/**
 * Obtiene un valor de la caché.
 * @param {string} key
 * @returns {Promise<any|null>}
 */
export async function getCache(key) {
  if (!key) return null;

  // 1. Intentar Upstash Redis si está disponible
  if (hasUpstash) {
    try {
      const response = await fetch(`${upstashUrl}/get/${encodeURIComponent(key)}`, {
        headers: {
          Authorization: `Bearer ${upstashToken}`
        }
      });
      if (response.ok) {
        const json = await response.json();
        if (json.result !== null && json.result !== undefined) {
          try {
            return JSON.parse(json.result);
          } catch {
            return json.result;
          }
        }
      }
    } catch (err) {
      console.warn(`[Cache Warning] Error consultando Upstash Redis (${key}):`, err.message);
    }
  }

  // 2. Fallback L1 en Memoria
  const item = inMemoryStore.get(key);
  if (!item) return null;

  if (Date.now() > item.expiresAt) {
    inMemoryStore.delete(key);
    return null;
  }

  return item.value;
}

/**
 * Guarda un valor en la caché con TTL en segundos.
 * @param {string} key
 * @param {any} value
 * @param {number} [ttlSeconds=300]
 */
export async function setCache(key, value, ttlSeconds = DEFAULT_TTL_SECONDS) {
  if (!key) return;

  const valueStr = typeof value === 'object' ? JSON.stringify(value) : String(value);

  // 1. Guardar en Upstash Redis si está disponible
  if (hasUpstash) {
    try {
      await fetch(`${upstashUrl}/set/${encodeURIComponent(key)}?ex=${ttlSeconds}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstashToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ value: valueStr })
      });
    } catch (err) {
      console.warn(`[Cache Warning] Error escribiendo en Upstash Redis (${key}):`, err.message);
    }
  }

  // 2. Guardar en L1 Memoria
  inMemoryStore.set(key, {
    value,
    expiresAt: Date.now() + (ttlSeconds * 1000)
  });
}

/**
 * Elimina una clave de la caché.
 * @param {string} key
 */
export async function deleteCache(key) {
  if (!key) return;

  if (hasUpstash) {
    try {
      await fetch(`${upstashUrl}/del/${encodeURIComponent(key)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${upstashToken}`
        }
      });
    } catch (err) {
      console.warn(`[Cache Warning] Error eliminando en Upstash Redis (${key}):`, err.message);
    }
  }

  inMemoryStore.delete(key);
}

/**
 * Limpia la caché en memoria completa.
 */
export function clearMemoryCache() {
  inMemoryStore.clear();
}

export default {
  getCache,
  setCache,
  deleteCache,
  clearMemoryCache
};
