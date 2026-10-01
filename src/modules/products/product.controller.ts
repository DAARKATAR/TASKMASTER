import { Request, Response, NextFunction } from 'express';
import { withTenantContext } from '../../services/tenantDbClient.js';

export async function listProducts(req: Request, res: Response, next: NextFunction) {
  const { tenantId } = req.params;
  const cleanId = String(tenantId).trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const schemaName = `tenant_${cleanId}`;

  try {
    const products = await withTenantContext(schemaName, async (client) => {
      const { rows } = await client.query(`
        SELECT id, nombre, precio, rubro, emoji, descripcion, stock, created_at
        FROM productos
        ORDER BY id ASC
      `);
      return rows;
    });
    res.json(products);
  } catch (error) {
    next(error);
  }
}

export async function createProduct(req: Request, res: Response, next: NextFunction) {
  const { tenantId } = req.params;
  const cleanId = String(tenantId).trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const schemaName = `tenant_${cleanId}`;
  const { nombre, precio, rubro, emoji, stock, descripcion } = req.body;

  if (!nombre || precio === undefined) {
    return res.status(400).json({ error: 'El nombre y el precio del producto son obligatorios.' });
  }

  try {
    const product = await withTenantContext(schemaName, async (client) => {
      const { rows } = await client.query(`
        INSERT INTO productos (nombre, precio, rubro, emoji, stock, descripcion)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *;
      `, [
        nombre.trim(),
        parseFloat(precio) || 0,
        (rubro || 'General').trim(),
        (emoji || '📦').trim(),
        parseInt(stock, 10) || 50,
        (descripcion || '').trim()
      ]);
      return rows[0];
    });

    res.status(201).json({ success: true, product });
  } catch (error) {
    next(error);
  }
}
