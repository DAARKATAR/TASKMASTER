import { Request, Response, NextFunction } from 'express';
import { withTenantContext } from '../../services/tenantDbClient.js';
import { invalidateProductsCache } from '../products/product.controller.js';
import { CreateInvoiceDTO } from './invoice.types.js';

export async function listInvoices(req: Request, res: Response, next: NextFunction) {
  const { tenantId } = req.params;
  const cleanId = String(tenantId).trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const schemaName = `tenant_${cleanId}`;

  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '50'), 10)));
  const offset = (page - 1) * limit;
  const search = req.query.search ? String(req.query.search).trim() : null;
  const wantsPaginatedWrapper = req.query.paginated === 'true';

  try {
    const { rows, total } = await withTenantContext(schemaName, async (client) => {
      let countQuery = 'SELECT COUNT(*)::int AS total FROM facturas';
      let dataQuery = `
        SELECT id, numero_factura, cliente, subtotal, impuestos, total, estado, folio_fiscal, items_count, metodo_pago, created_at
        FROM facturas
      `;
      const queryParams: any[] = [];

      if (search) {
        countQuery += ' WHERE cliente ILIKE $1 OR numero_factura ILIKE $1';
        dataQuery += ' WHERE cliente ILIKE $1 OR numero_factura ILIKE $1';
        queryParams.push(`%${search}%`);
      }

      dataQuery += ` ORDER BY id DESC LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
      const dataParams = [...queryParams, limit, offset];

      const countRes = await client.query(countQuery, queryParams);
      const dataRes = await client.query(dataQuery, dataParams);

      return {
        rows: dataRes.rows,
        total: countRes.rows[0]?.total || 0
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    res.setHeader('X-Total-Count', total);
    res.setHeader('X-Page', page);
    res.setHeader('X-Limit', limit);
    res.setHeader('X-Total-Pages', totalPages);

    if (wantsPaginatedWrapper) {
      return res.json({
        invoices: rows,
        pagination: {
          total,
          page,
          limit,
          totalPages
        }
      });
    }

    res.json(rows);
  } catch (error) {
    next(error);
  }
}

export async function getInvoiceDetails(req: Request, res: Response, next: NextFunction) {
  const { tenantId, invoiceId } = req.params;
  const cleanId = String(tenantId).trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const schemaName = `tenant_${cleanId}`;

  try {
    const details = await withTenantContext(schemaName, async (client) => {
      const { rows } = await client.query(`
        SELECT id, factura_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal
        FROM factura_detalles
        WHERE factura_id = $1
        ORDER BY id ASC
      `, [invoiceId]);
      return rows;
    });

    res.json(details);
  } catch (error) {
    next(error);
  }
}

export async function createInvoice(req: Request, res: Response, next: NextFunction) {
  const { tenantId } = req.params;
  const cleanId = String(tenantId).trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const schemaName = `tenant_${cleanId}`;

  const { cliente, subtotal, impuestos, total, items_count, metodo_pago, items } = req.body as CreateInvoiceDTO;

  const clientName = (cliente || 'Cliente General').trim();
  const subtotalNum = parseFloat(String(subtotal)) || 0;
  const impuestosNum = parseFloat(String(impuestos)) || 0;
  const totalNum = parseFloat(String(total)) || (subtotalNum + impuestosNum);
  const itemsCount = parseInt(String(items_count), 10) || (Array.isArray(items) ? items.reduce((acc, i) => acc + (i.qty || 1), 0) : 1);
  const paymentMethod = (metodo_pago || 'Efectivo').trim();

  try {
    const invoice = await withTenantContext(schemaName, async (client) => {
      // 1. Obtener consecutivo de la factura
      const countRes = await client.query('SELECT COALESCE(MAX(id), 1000) + 1 AS next_id FROM facturas');
      const nextId = countRes.rows[0].next_id;

      const prefix = cleanId === 'tortasysnacks' ? 'REC' : 'FAC';
      const numeroFactura = `${prefix}-${nextId}`;
      const cufe = `CUFE-${cleanId.toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 2. Insertar cabecera de la factura con search_path
      const insertRes = await client.query(`
        INSERT INTO facturas (id, numero_factura, cliente, subtotal, impuestos, total, estado, folio_fiscal, items_count, metodo_pago, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'TIMBRADA / APROBADA', $7, $8, $9, NOW())
        RETURNING *;
      `, [nextId, numeroFactura, clientName, subtotalNum, impuestosNum, totalNum, cufe, itemsCount, paymentMethod]);

      // 3. Insertar detalle por cada producto y descontar stock
      if (Array.isArray(items) && items.length > 0) {
        for (const item of items) {
          const itemQty = parseInt(String(item.qty || item.cantidad || 1), 10);
          const itemPrice = parseFloat(String(item.price || item.precio || 0));
          const itemSubtotal = itemPrice * itemQty;
          const itemName = (item.name || item.nombre || 'Artículo POS').trim();
          const prodId = item.id && Number.isInteger(Number(item.id)) ? Number(item.id) : null;

          await client.query(`
            INSERT INTO factura_detalles (factura_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal)
            VALUES ($1, $2, $3, $4, $5, $6);
          `, [nextId, prodId, itemName, itemQty, itemPrice, itemSubtotal]);

          if (prodId) {
            await client.query(`
              UPDATE productos 
              SET stock = GREATEST(0, stock - $1)
              WHERE id = $2;
            `, [itemQty, prodId]);
          }
        }
      }

      return insertRes.rows[0];
    });

    // Invalidar caché de productos del tenant tras descontar stock
    invalidateProductsCache(cleanId);

    res.status(201).json({
      success: true,
      message: 'Venta registrada, inventario actualizado y comprobante emitido exitosamente',
      invoice
    });
  } catch (error) {
    next(error);
  }
}
