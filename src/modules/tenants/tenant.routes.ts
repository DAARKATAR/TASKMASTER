import { Router } from 'express';
import { listTenants, createTenant, getTenantMetrics } from './tenant.controller.js';
import { listProducts, createProduct } from '../products/product.controller.js';
import { listInvoices, getInvoiceDetails, createInvoice } from '../invoices/invoice.controller.js';

const router = Router();

// Rutas de Tenants
router.get('/', listTenants);
router.post('/', createTenant);

// Sub-rutas de Catálogo de Productos del Tenant
router.get('/:tenantId/products', listProducts);
router.post('/:tenantId/products', createProduct);

// Sub-rutas de Facturas y Ventas POS del Tenant
router.get('/:tenantId/invoices', listInvoices);
router.post('/:tenantId/invoices', createInvoice);
router.get('/:tenantId/invoices/:invoiceId/details', getInvoiceDetails);

// Métricas de Facturación
router.get('/:tenantId/metrics', getTenantMetrics);

export default router;
