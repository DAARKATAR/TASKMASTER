import { Router } from 'express';
import { listTenants, createTenant, getTenantMetrics, updateTenantModules, updateTenantTheme } from './tenant.controller.js';
import { listProducts, createProduct, updateProduct, deleteProduct } from '../products/product.controller.js';
import { listInvoices, getInvoiceDetails, createInvoice } from '../invoices/invoice.controller.js';

const router = Router();

// Rutas de Tenants
router.get('/', listTenants);
router.post('/', createTenant);
router.patch('/:tenantId/modules', updateTenantModules);
router.put('/:tenantId/modules', updateTenantModules);
router.patch('/:tenantId/theme', updateTenantTheme);
router.put('/:tenantId/theme', updateTenantTheme);

// Sub-rutas de Catálogo de Productos del Tenant
router.get('/:tenantId/products', listProducts);
router.post('/:tenantId/products', createProduct);
router.patch('/:tenantId/products/:productId', updateProduct);
router.put('/:tenantId/products/:productId', updateProduct);
router.delete('/:tenantId/products/:productId', deleteProduct);

// Sub-rutas de Facturas y Ventas POS del Tenant
router.get('/:tenantId/invoices', listInvoices);
router.post('/:tenantId/invoices', createInvoice);
router.get('/:tenantId/invoices/:invoiceId/details', getInvoiceDetails);

// Métricas de Facturación
router.get('/:tenantId/metrics', getTenantMetrics);

export default router;
