import { useState, useEffect, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';

/**
 * Hook para la gestión de facturas, ventas POS y métricas en vivo
 */
export function useInvoices(tenantId, authToken) {
  const [invoices, setInvoices] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [invoiceData, setInvoiceData] = useState(null);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  const loadInvoices = useCallback(async (id = tenantId) => {
    if (!id) return;
    setLoadingInvoices(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tenants/${id}/invoices`);
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
        if (data.length > 0 && !invoiceData) {
          setInvoiceData({
            numero_factura: data[0].numero_factura,
            cliente: data[0].cliente,
            subtotal: parseFloat(data[0].subtotal || 0).toFixed(2),
            impuestos: parseFloat(data[0].impuestos || 0).toFixed(2),
            total: parseFloat(data[0].total || 0).toFixed(2),
            estado: data[0].estado,
            folio_fiscal: data[0].folio_fiscal,
            items_count: data[0].items_count || 1,
            metodo_pago: data[0].metodo_pago,
            emisor: id
          });
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
        const data = await res.json();
        setMetrics(data);
      }
    } catch (err) {
      console.error('Error cargando métricas:', err);
    } finally {
      setLoadingMetrics(false);
    }
  }, [tenantId]);

  useEffect(() => {
    if (tenantId) {
      loadInvoices(tenantId);
      loadMetrics(tenantId);
    }
  }, [tenantId, loadInvoices, loadMetrics]);

  const emitInvoice = async (orderData, tenant) => {
    const headers = { 'Content-Type': 'application/json' };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const res = await fetch(`${API_BASE_URL}/api/tenants/${tenant.id}/invoices`, {
      method: 'POST',
      headers,
      body: JSON.stringify(orderData)
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Error emitiendo comprobante');
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
      items: orderData.items || []
    };

    setInvoiceData(formatted);

    // Actualizar historial y métricas
    await Promise.all([loadInvoices(tenant.id), loadMetrics(tenant.id)]);

    return formatted;
  };

  return {
    invoices,
    metrics,
    invoiceData,
    setInvoiceData,
    loadingInvoices,
    loadingMetrics,
    loadInvoices,
    loadMetrics,
    emitInvoice
  };
}

export default useInvoices;
