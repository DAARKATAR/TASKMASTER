import { describe, it, expect, beforeEach } from 'vitest';
import { getCache, setCache, deleteCache, clearMemoryCache } from '../../src/services/cacheService.js';

describe('Unidad: Servicio de Caché L1 en Memoria con TTL (cacheService)', () => {
  beforeEach(() => {
    clearMemoryCache();
  });

  it('16. setCache y getCache deben almacenar y recuperar datos primitivos y objetos complejos', async () => {
    const testKey = 'tenant:tortas:config';
    const testData = { name: 'Tortas & Snacks', activeModules: ['pos', 'invoices'], theme: '#FF5733' };

    await setCache(testKey, testData, 60);
    const retrieved = await getCache(testKey);

    expect(retrieved).toEqual(testData);
  });

  it('17. getCache debe retornar null si la clave no existe en caché', async () => {
    const result = await getCache('clave_inexistente_xyz');
    expect(result).toBeNull();
  });

  it('18. getCache debe expirar y retornar null cuando se supera el tiempo de vida (TTL)', async () => {
    const testKey = 'temporary_token_key';
    // TTL de 0.05 segundos (50 milisegundos)
    await setCache(testKey, { val: 123 }, 0.05);

    // Esperar 70ms para que expire
    await new Promise((resolve) => setTimeout(resolve, 70));

    const retrieved = await getCache(testKey);
    expect(retrieved).toBeNull();
  });

  it('19. deleteCache debe invalidar inmediatamente una entrada de caché', async () => {
    const testKey = 'tenant:active_status';
    await setCache(testKey, { active: true }, 100);

    // Verificar que existe
    expect(await getCache(testKey)).toEqual({ active: true });

    // Invalidar
    await deleteCache(testKey);

    // Debe ser null
    expect(await getCache(testKey)).toBeNull();
  });
});
