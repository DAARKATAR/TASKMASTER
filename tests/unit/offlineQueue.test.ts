import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getOfflineQueue,
  enqueueOfflineSale,
  removeOfflineSale,
  clearOfflineQueue,
  syncOfflineQueue
} from '../../frontend/src/utils/offlineQueue.js';

describe('Unidad: Resiliencia de Ventas Fuera de Línea (offlineQueue)', () => {
  // Mock en memoria de localStorage para entorno Node/Vitest
  const storageMock: Record<string, string> = {};

  beforeEach(() => {
    for (const key in storageMock) delete storageMock[key];

    vi.stubGlobal('localStorage', {
      getItem: (key: string) => storageMock[key] || null,
      setItem: (key: string, value: string) => {
        storageMock[key] = String(value);
      },
      removeItem: (key: string) => {
        delete storageMock[key];
      },
      clear: () => {
        for (const key in storageMock) delete storageMock[key];
      }
    });

    clearOfflineQueue();
  });

  it('23. enqueueOfflineSale debe encolar una orden y generar folio temporal simulado', () => {
    const orderData = { items: [{ name: 'Pan de Bono', qty: 2, price: 3000 }], total: 6000 };
    const queued = enqueueOfflineSale('panaderia_central', orderData);

    expect(queued).toBeDefined();
    expect(queued.tenantId).toBe('panaderia_central');
    expect(queued.offlineId).toMatch(/^OFFLINE-/);
    expect(queued.simulatedInvoiceNumber).toMatch(/^REC-OFF-/);
    expect(queued.orderData).toEqual(orderData);

    const currentQueue = getOfflineQueue('panaderia_central');
    expect(currentQueue.length).toBe(1);
    expect(currentQueue[0].offlineId).toBe(queued.offlineId);
  });

  it('24. getOfflineQueue debe filtrar únicamente las ventas del tenant solicitado', () => {
    enqueueOfflineSale('tenant_a', { total: 100 });
    enqueueOfflineSale('tenant_b', { total: 200 });
    enqueueOfflineSale('tenant_a', { total: 300 });

    const queueA = getOfflineQueue('tenant_a');
    const queueB = getOfflineQueue('tenant_b');
    const all = getOfflineQueue();

    expect(all.length).toBe(3);
    expect(queueA.length).toBe(2);
    expect(queueB.length).toBe(1);
    expect(queueA.every((item: any) => item.tenantId === 'tenant_a')).toBe(true);
  });

  it('25. removeOfflineSale debe eliminar individualmente el elemento procesado', () => {
    const sale1 = enqueueOfflineSale('tenant_test', { total: 10 });
    const sale2 = enqueueOfflineSale('tenant_test', { total: 20 });

    expect(getOfflineQueue('tenant_test').length).toBe(2);

    removeOfflineSale(sale1.offlineId);

    const remaining = getOfflineQueue('tenant_test');
    expect(remaining.length).toBe(1);
    expect(remaining[0].offlineId).toBe(sale2.offlineId);
  });

  it('26. syncOfflineQueue debe sincronizar secuencialmente y vaciar la cola', async () => {
    enqueueOfflineSale('tenant_sync', { total: 50 });
    enqueueOfflineSale('tenant_sync', { total: 75 });

    const emitInvoiceMock = vi.fn().mockResolvedValue({ success: true });

    const result = await syncOfflineQueue({ id: 'tenant_sync' }, emitInvoiceMock);

    expect(result.synced).toBe(2);
    expect(result.failed).toBe(0);
    expect(emitInvoiceMock).toHaveBeenCalledTimes(2);

    // La cola del tenant debe quedar vacía
    expect(getOfflineQueue('tenant_sync').length).toBe(0);
  });
});
