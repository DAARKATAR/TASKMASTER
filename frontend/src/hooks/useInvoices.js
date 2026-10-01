import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';
import { enqueueOfflineSale, getOfflineQueue } from '../utils/offlineQueue';

/**
 * Hook para la gestión de facturas, ventas POS, paginación y modo offline resiliente
 */
export function useInvoices(tenantId, authToken) {
  const [invoices, setInvoices] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 1 });
  const [metrics, setMetrics] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [offlinePendingCount, setOfflinePendingCount] = useState(0);

  // Actualizar contador de ventas offline en cola
  const refreshOfflineCount = useCallback(() => {
    if (tenantId) {
      const q = getOfflineQueue(tenantId);
      setOfflinePendingCount(q.length);
    }
  }, [tenantId]);

  useEffect(() => {
    refreshOfflineCount();
  }, [tenantId, refreshOfflineCount]);

  const loadInvoices = useCallback(async (id = tenantId, page = 1, limit = 25, search = '') => {
    if (!id) return;
    setLoadingInvoices(true);
    try {
      let url = `${API_BASE_URL}/api/tenants/${id}/invoices?paginated=true&page=${page}&limit=${limit}`;
      if (search) url += `&search=${encodeURIComponent(search)}`;

      const res = await fetch(url);
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (data && data.invoices && Array.isArray(data.invoices)) {
            setInvoices(data.invoices);
            if (data.pagination) setPagination(data.pagination);
            if (data.invoices.length > 0 && !invoiceData) {
              const first = data.invoices[0];
              setInvoiceData({
                numero_factura: first.numero_factura,
                cliente: first.cliente,
                subtotal: parseFloat(first.subtotal || 0).toFixed(2),
                impuestos: parseFloat(first.impuestos || 0).toFixed(2),
                total: parseFloat(first.total || 0).toFixed(2),
                estado: first.estado,
                folio_fiscal: first.folio_fiscal,
                items_count: first.items_count || 1,
                metodo_pago: first.metodo_pago,
                emisor: id
              });
            }
          } else if (Array.isArray(data)) {
            setInvoices(data);
          }
        }
      }
    } catch (err) {
      console.error('Error cargando facturas:', err);
    } finally {
      setLoadingInvoices(false);
    }
  }, [tenantId, invoiceData]);

  const loadMetrics = useCallback(async (id = tenantId) => {
    if (!id) return;
    setLoadingMetrics(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tenants/${id}/metrics`);
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          setMetrics(data);
        }
      }
    } catch (err) {
      console.error('Error cargando métricas:', err);
    } finally {
      setLoadingMetrics(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) {
      loadInvoices(tenantId, 1, 25);
      loadMetrics(tenantId);
    }
  }, [tenantId, loadInvoices, loadMetrics]);

  /**
   * Emite comprobante con soporte resiliente Offline (fallback automático a cola local)
   */
  const emitInvoice = async (orderData, tenant, skipOfflineFallback = false) => {
    const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

    // Si no hay red y no estamos en reintento, guardar en cola offline
    if (!isOnline && !skipOfflineFallback) {
      const offlineItem = enqueueOfflineSale(tenant.id, orderData);
      refreshOfflineCount();
      const mockInvoice = {
        numero_factura: offlineItem.simulatedInvoiceNumber,
        cliente: orderData.cliente || 'Cliente POS (Offline)',
        subtotal: parseFloat(orderData.subtotal || 0).toFixed(2),
        impuestos: parseFloat(orderData.impuestos || 0).toFixed(2),
        total: parseFloat(orderData.total || 0).toFixed(2),
        estado: 'PENDIENTE DE SINCRONIZACIÓN',
        folio_fiscal: `OFFLINE-${Date.now().toString(36).toUpperCase()}`,
        items_count: orderData.items?.length || 1,
        metodo_pago: orderData.metodoPago || 'Efectivo',
        emisor: tenant.nombre,
        items: orderData.items || [],
        isOffline: true
      };
      setInvoiceData(mockInvoice);
      setInvoices((prev) => [mockInvoice, ...prev]);
      return mockInvoice;
    }

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`${API_BASE_URL}/api/tenants/${tenant.id}/invoices`, {
        method: 'POST',
        headers,
        body: JSON.stringify(orderData)
      });

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
        throw new Error(data?.error || `Error emitiendo comprobante (HTTP ${res.status})`);
      }

      const newInv = data.invoice;
      const formatted = {
        numero_factura: newInv.numero_factura,
        cliente: newInv.cliente,
        subtotal: parseFloat(newInv.subtotal).toFixed(2),
        impuestos: parseFloat(newInv.impuestos).toFixed(2),
        total: parseFloat(newInv.total).toFixed(2),
        estado: newInv.estado,
        folio_fiscal: newInv.folio_fiscal,
        items_count: newInv.items_count,
        metodo_pago: newInv.metodo_pago,
        emisor: tenant.nombre,
        items: orderData.items || [],
        isOffline: false
      };

      setInvoiceData(formatted);
      await Promise.all([loadInvoices(tenant.id, pagination.page, pagination.limit), loadMetrics(tenant.id)]);
      return formatted;
    } catch (networkErr) {
      if (!skipOfflineFallback) {
        console.warn('Fallo de red detectado. Guardando venta en cola offline local...', networkErr);
        const offlineItem = enqueueOfflineSale(tenant.id, orderData);
        refreshOfflineCount();
        const fallbackInvoice = {
          numero_factura: offlineItem.simulatedInvoiceNumber,
          cliente: orderData.cliente || 'Cliente POS (Offline)',
          subtotal: parseFloat(orderData.subtotal || 0).toFixed(2),
          impuestos: parseFloat(orderData.impuestos || 0).toFixed(2),
          total: parseFloat(orderData.total || 0).toFixed(2),
          estado: 'PENDIENTE DE SINCRONIZACIÓN',
          folio_fiscal: `OFFLINE-${Date.now().toString(36).toUpperCase()}`,
          items_count: orderData.items?.length || 1,
          metodo_pago: orderData.metodoPago || 'Efectivo',
          emisor: tenant.nombre,
          items: orderData.items || [],
          isOffline: true
        };
        setInvoiceData(fallbackInvoice);
        setInvoices((prev) => [fallbackInvoice, ...prev]);
        return fallbackInvoice;
      }
      throw networkErr;
    }
  };

  return {
    invoices,
    pagination,
    metrics,
    invoiceData,
    setInvoiceData,
    loadingInvoices,
    loadingMetrics,
    loadInvoices,
    loadMetrics,
    emitInvoice,
    offlinePendingCount,
    refreshOfflineCount
  };
}

export default useInvoices;
