import pool from '../config/database.js';
import { getCache, setCache, deleteCache } from './cacheService.js';

const CACHE_PREFIX = 'tenant:';
const CACHE_TTL_SECONDS = 300; // 5 minutos

/**
 * Obtiene los metadatos de un tenant por su ID (slug).
 * Implementa caché multi-tenant con Upstash Redis / Memoria.
 *
 * @param {string} tenantId - Slug o identificador del tenant
 * @returns {Promise<{ id: string, name: string, schema_name: string, brand_color: string } | null>}
 */
export async function getTenantById(tenantId) {
  if (!tenantId || typeof tenantId !== 'string') {
    return null;
  }

  const normalizedId = tenantId.trim().toLowerCase();
  const cacheKey = `${CACHE_PREFIX}${normalizedId}`;

  // 1. Consultar caché
  const cached = await getCache(cacheKey);
  if (cached) {
    return cached;
  }

  // 2. Consultar PostgreSQL en Neon
  const query = `
    SELECT id, nombre, nombre AS name, schema_name, brand_color
    FROM public.tenants
    WHERE id = $1
    LIMIT 1;
  `;

  try {
    const { rows } = await pool.query(query, [normalizedId]);
    if (rows.length === 0) {
      return null;
    }

    const tenant = rows[0];

    // 3. Guardar en caché
    await setCache(cacheKey, tenant, CACHE_TTL_SECONDS);

    return tenant;
  } catch (error) {
    console.error(`Error querying tenant [${normalizedId}]:`, error.message);
    throw error;
  }
}

/**
 * Invalida la caché de un tenant específico o toda la caché.
 *
 * @param {string} [tenantId]
 */
export async function invalidateTenantCache(tenantId) {
  if (tenantId) {
    const normalizedId = tenantId.trim().toLowerCase();
    await deleteCache(`${CACHE_PREFIX}${normalizedId}`);
  }
}

export default {
  getTenantById,
  invalidateTenantCache
};
