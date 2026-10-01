/**
 * Gestor de cola fuera de línea (Offline Queue) para TASKMASTER POS.
 * Permite a los comercios seguir cobrando y emitiendo tickets locales
 * sin conexión a internet, sincronizando automáticamente con Neon DB
 * al restablecerse la señal.
 */

const STORAGE_KEY = 'taskmaster_offline_sales_queue';

export function getOfflineQueue(tenantId = null) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const queue = raw ? JSON.parse(raw) : [];
    if (!tenantId) return queue;
    return queue.filter((item) => item.tenantId === tenantId);
  } catch (err) {
    console.error('Error leyendo cola offline:', err);
    return [];
  }
}

export function enqueueOfflineSale(tenantId, orderData) {
  try {
    const queue = getOfflineQueue();
    const offlineId = `OFFLINE-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const offlineItem = {
      offlineId,
      tenantId,
      orderData,
      queuedAt: new Date().toISOString(),
      simulatedInvoiceNumber: `REC-OFF-${Math.floor(1000 + Math.random() * 9000)}`
    };
    queue.push(offlineItem);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    return offlineItem;
  } catch (err) {
    console.error('Error encolando venta offline:', err);
    return null;
  }
}

export function removeOfflineSale(offlineId) {
  try {
    const queue = getOfflineQueue();
    const filtered = queue.filter((item) => item.offlineId !== offlineId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (err) {
    console.error('Error eliminando item de la cola offline:', err);
  }
}

export function clearOfflineQueue(tenantId = null) {
  try {
    if (!tenantId) {
      localStorage.removeItem(STORAGE_KEY);
    } else {
      const queue = getOfflineQueue();
      const filtered = queue.filter((item) => item.tenantId !== tenantId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    }
  } catch (err) {
    console.error('Error limpiando cola offline:', err);
  }
}

/**
 * Procesa y sincroniza todas las ventas en cola para un tenant específico.
 */
export async function syncOfflineQueue(tenant, emitInvoiceFn) {
  if (!tenant?.id || !emitInvoiceFn) return { synced: 0, failed: 0 };
  const pending = getOfflineQueue(tenant.id);
  if (pending.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      await emitInvoiceFn(item.orderData, tenant, true); // true = skipOfflineFallback
      removeOfflineSale(item.offlineId);
      synced++;
    } catch (err) {
      console.error(`Error sincronizando venta offline ${item.offlineId}:`, err);
      failed++;
    }
  }

  return { synced, failed, remaining: pending.length - synced };
}
