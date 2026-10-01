import { Request, Response, NextFunction } from 'express';
import pool from '../../config/database.js';
import { provisionTenant } from './tenant.provisioner.js';

export async function listTenants(req: Request, res: Response, next: NextFunction) {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre, nombre AS name, schema_name, brand_color FROM public.tenants ORDER BY id ASC'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
}

export async function createTenant(req: Request, res: Response, next: NextFunction) {
  try {
    const { id, nombre, brand_color, initial_titular, initial_saldo } = req.body;
    if (!id || !nombre) {
      return res.status(400).json({ error: 'El identificador (slug) y el nombre de la empresa son obligatorios.' });
    }

    const tenant = await provisionTenant({
      id,
      nombre,
      brandColor: brand_color,
      initialTitular: initial_titular,
      initialSaldo: parseFloat(initial_saldo) || 50000.00
    });

    res.status(201).json({
      success: true,
      message: `Tenant "${nombre}" aprovisionado con éxito.`,
      tenant
    });
  } catch (error) {
    next(error);
  }
}

export async function getTenantMetrics(req: Request, res: Response, next: NextFunction) {
  const { tenantId } = req.params;
  const cleanId = String(tenantId).trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const schemaName = `tenant_${cleanId}`;

  try {
    const { rows: aggRows } = await pool.query(`
      SELECT 
        COALESCE(SUM(total), 0) AS total_ventas,
        COUNT(*)::int AS total_comprobantes,
        COALESCE(AVG(total), 0) AS ticket_promedio,
        COALESCE(SUM(impuestos), 0) AS total_iva
      FROM "${schemaName}".facturas
    `);

    const { rows: paymentRows } = await pool.query(`
      SELECT 
        COALESCE(metodo_pago, 'Efectivo') AS metodo,
        COUNT(*)::int AS transacciones,
        COALESCE(SUM(total), 0) AS total
      FROM "${schemaName}".facturas
      GROUP BY metodo_pago
      ORDER BY total DESC
    `);

    const { rows: dailyRows } = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'YYYY-MM-DD') AS dia,
        TO_CHAR(created_at, 'Dy DD Mon') AS label,
        COUNT(*)::int AS transacciones,
        COALESCE(SUM(total), 0) AS total
      FROM "${schemaName}".facturas
      GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD'), TO_CHAR(created_at, 'Dy DD Mon')
      ORDER BY dia ASC
      LIMIT 14
    `);

    const summary = aggRows[0];
    res.json({
      total_ventas: parseFloat(summary.total_ventas),
      total_comprobantes: summary.total_comprobantes,
      ticket_promedio: Math.round(parseFloat(summary.ticket_promedio)),
      total_iva: parseFloat(summary.total_iva),
      desglose_pagos: paymentRows.map((r: any) => ({
        metodo: r.metodo,
        transacciones: r.transacciones,
        total: parseFloat(r.total)
      })),
      ventas_por_dia: dailyRows.map((r: any) => ({
        dia: r.dia,
        label: r.label,
        transacciones: r.transacciones,
        total: parseFloat(r.total)
      }))
    });
  } catch (error) {
    next(error);
  }
}
