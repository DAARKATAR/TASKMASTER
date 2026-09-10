import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import pool from './config/database.js';
import soapRoutes from './routes/soapRoutes.js';
import authRoutes from './routes/authRoutes.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { logAccess, logError, getLogsSummary } from './services/auditLogger.js';
import { getDefaultProducts } from './config/defaultProducts.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Logging HTTP en consola
app.use(morgan('dev'));

// Middleware de registro persistente clasificado en logs/access/
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    logAccess({
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: Date.now() - start,
      clientIp: req.headers['cf-connecting-ip'] || req.ip,
      userAgent: req.get('user-agent')
    });
  });
  next();
});

// Middleware para procesar texto plano XML requerido para peticiones SOAP
app.use(express.text({
  type: ['text/xml', 'application/xml', 'text/plain'],
  limit: '2mb'
}));
app.use(express.json());

// Middleware CORS para permitir peticiones desde Cloudflare Pages, Vercel o cualquier cliente
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, SOAPAction, x-tenant-id, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Rate limiting global para la API
app.use('/api/', apiLimiter);

// Rutas de autenticación con JWT y tablas de usuarios aisladas
app.use('/api/auth', authRoutes);

// Endpoint raíz informativo del Backend
app.get('/', (req, res) => {
  res.json({
    service: 'TaskMaster Multi-Tenant SOAP & REST API Backend',
    status: 'online',
    version: '1.0.0',
    documentation: {
      health: '/health',
      auth: '/api/auth',
      tenants: '/api/tenants',
      soap_endpoint: '/ws/:tenantId',
      wsdl: '/ws/:tenantId?wsdl'
    }
  });
});

import { invalidateTenantCache } from './services/tenantService.js';

// Endpoint para obtener la lista de tenants registrados
app.get('/api/tenants', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, nombre, nombre AS name, schema_name, brand_color FROM public.tenants ORDER BY id ASC'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para crear y aprovisionar un nuevo Tenant de marca blanca con su esquema PostgreSQL aislado
app.post('/api/tenants', async (req, res) => {
  const { id, nombre, brand_color, initial_titular, initial_saldo } = req.body;

  if (!id || !nombre) {
    return res.status(400).json({ error: 'El identificador (slug) y el nombre de la empresa son obligatorios.' });
  }

  const cleanId = id.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (cleanId.length < 2 || cleanId.length > 30) {
    return res.status(400).json({ error: 'El ID del tenant debe tener entre 2 y 30 caracteres alfanuméricos.' });
  }

  const schemaName = `tenant_${cleanId}`;
  const color = brand_color || '#4F46E5';
  const titular = initial_titular || `Administrador de ${nombre}`;
  const saldo = parseFloat(initial_saldo) || 50000.00;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Registrar o actualizar en public.tenants
    await client.query(`
      INSERT INTO public.tenants (id, nombre, schema_name, brand_color)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (id) DO UPDATE
      SET nombre = EXCLUDED.nombre,
          schema_name = EXCLUDED.schema_name,
          brand_color = EXCLUDED.brand_color;
    `, [cleanId, nombre, schemaName, color]);

    // 2. Aprovisionar esquema PostgreSQL aislado
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);

    // 3. Crear tabla facturas dentro del esquema
    await client.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".facturas (
        id SERIAL PRIMARY KEY,
        numero_factura VARCHAR(50) NOT NULL UNIQUE,
        cliente VARCHAR(150) NOT NULL,
        subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        impuestos NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        estado VARCHAR(50) NOT NULL DEFAULT 'TIMBRADA / APROBADA',
        folio_fiscal VARCHAR(100) NOT NULL,
        items_count INT DEFAULT 1,
        metodo_pago VARCHAR(50) DEFAULT 'Efectivo',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "${schemaName}".factura_detalles (
        id SERIAL PRIMARY KEY,
        factura_id INT NOT NULL REFERENCES "${schemaName}".facturas(id) ON DELETE CASCADE,
        producto_id INT,
        nombre_producto VARCHAR(150) NOT NULL,
        cantidad INT NOT NULL DEFAULT 1,
        precio_unitario NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00
      );

      CREATE TABLE IF NOT EXISTS "${schemaName}".productos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        precio NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        rubro VARCHAR(100) NOT NULL DEFAULT 'General',
        emoji VARCHAR(20) DEFAULT '📦',
        descripcion TEXT,
        stock INT NOT NULL DEFAULT 100,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "${schemaName}".usuarios (
        id SERIAL PRIMARY KEY,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        nombre VARCHAR(150) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Poblar catálogo de productos inicial
    const defaultProds = getDefaultProducts();
    for (const p of defaultProds) {
      await client.query(`
        INSERT INTO "${schemaName}".productos (nombre, precio, rubro, emoji, stock, descripcion)
        VALUES ($1, $2, $3, $4, $5, $6);
      `, [p.nombre, p.precio, p.rubro, p.emoji, p.stock, p.descripcion]);
    }

    await client.query('COMMIT');

    // Invalidar caché en memoria
    invalidateTenantCache(cleanId);

    const newTenant = {
      id: cleanId,
      nombre,
      name: nombre,
      schema_name: schemaName,
      brand_color: color
    };

    res.status(201).json({
      success: true,
      message: `Tenant "${nombre}" aprovisionado con éxito con el esquema "${schemaName}".`,
      tenant: newTenant
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error aprovisionando nuevo tenant:', err);
    res.status(500).json({ error: `Error creando tenant: ${err.message}` });
  } finally {
    client.release();
  }
});

// Endpoint para obtener el catálogo real de productos del tenant desde Neon DB
app.get('/api/tenants/:tenantId/products', async (req, res) => {
  const { tenantId } = req.params;
  const cleanId = tenantId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const schemaName = `tenant_${cleanId}`;

  try {
    const { rows } = await pool.query(`
      SELECT id, nombre, precio, rubro, emoji, descripcion, stock, created_at
      FROM "${schemaName}".productos
      ORDER BY id ASC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para registrar un nuevo producto en el catálogo del tenant
app.post('/api/tenants/:tenantId/products', async (req, res) => {
  const { tenantId } = req.params;
  const cleanId = tenantId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const schemaName = `tenant_${cleanId}`;
  const { nombre, precio, rubro, emoji, stock, descripcion } = req.body;

  if (!nombre || precio === undefined) {
    return res.status(400).json({ error: 'El nombre y el precio del producto son obligatorios.' });
  }

  try {
    const { rows } = await pool.query(`
      INSERT INTO "${schemaName}".productos (nombre, precio, rubro, emoji, stock, descripcion)
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

    res.status(201).json({ success: true, product: rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener las facturas reales del tenant desde Neon DB
app.get('/api/tenants/:tenantId/invoices', async (req, res) => {
  const { tenantId } = req.params;
  const cleanId = tenantId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const schemaName = `tenant_${cleanId}`;

  try {
    const { rows } = await pool.query(`
      SELECT id, numero_factura, cliente, subtotal, impuestos, total, estado, folio_fiscal, items_count, metodo_pago, created_at
      FROM "${schemaName}".facturas
      ORDER BY id DESC
    `);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para obtener los renglones / detalles de una factura específica
app.get('/api/tenants/:tenantId/invoices/:invoiceId/details', async (req, res) => {
  const { tenantId, invoiceId } = req.params;
  const cleanId = tenantId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const schemaName = `tenant_${cleanId}`;

  try {
    const { rows } = await pool.query(`
      SELECT id, factura_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal
      FROM "${schemaName}".factura_detalles
      WHERE factura_id = $1
      ORDER BY id ASC
    `, [invoiceId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para registrar una venta real, guardar factura con renglones y actualizar inventario
app.post('/api/tenants/:tenantId/invoices', async (req, res) => {
  const { tenantId } = req.params;
  const cleanId = tenantId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const schemaName = `tenant_${cleanId}`;
  const { cliente, subtotal, impuestos, total, items_count, metodo_pago, items } = req.body;

  const clientName = (cliente || 'Cliente General').trim();
  const subtotalNum = parseFloat(subtotal) || 0;
  const impuestosNum = parseFloat(impuestos) || 0;
  const totalNum = parseFloat(total) || (subtotalNum + impuestosNum);
  const itemsCount = parseInt(items_count, 10) || (Array.isArray(items) ? items.reduce((acc, i) => acc + (i.qty || 1), 0) : 1);
  const paymentMethod = (metodo_pago || 'Efectivo').trim();

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Obtener consecutivo real
    const countRes = await client.query(`SELECT COALESCE(MAX(id), 1000) + 1 AS next_id FROM "${schemaName}".facturas`);
    const nextId = countRes.rows[0].next_id;
    const prefix = cleanId === 'tortasysnacks' ? 'REC' : 'FAC';
    const numeroFactura = `${prefix}-${nextId}`;
    const cufe = `CUFE-${cleanId.toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 2. Insertar cabecera de la factura
    const insertRes = await client.query(`
      INSERT INTO "${schemaName}".facturas (id, numero_factura, cliente, subtotal, impuestos, total, estado, folio_fiscal, items_count, metodo_pago, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, 'TIMBRADA / APROBADA', $7, $8, $9, NOW())
      RETURNING *;
    `, [nextId, numeroFactura, clientName, subtotalNum, impuestosNum, totalNum, cufe, itemsCount, paymentMethod]);

    // 3. Insertar detalle por cada producto y descontar stock
    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        const itemQty = parseInt(item.qty || 1, 10);
        const itemPrice = parseFloat(item.price || item.precio || 0);
        const itemSubtotal = itemPrice * itemQty;
        const itemName = (item.name || item.nombre || 'Artículo POS').trim();
        const prodId = item.id && Number.isInteger(Number(item.id)) ? Number(item.id) : null;

        await client.query(`
          INSERT INTO "${schemaName}".factura_detalles (factura_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal)
          VALUES ($1, $2, $3, $4, $5, $6);
        `, [nextId, prodId, itemName, itemQty, itemPrice, itemSubtotal]);

        if (prodId) {
          await client.query(`
            UPDATE "${schemaName}".productos 
            SET stock = GREATEST(0, stock - $1)
            WHERE id = $2;
          `, [itemQty, prodId]);
        }
      }
    }

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Venta registrada, inventario actualizado y comprobante emitido exitosamente',
      invoice: insertRes.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error registrando venta:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
});

// Endpoint para calcular métricas y gráficos reales para el tenant
app.get('/api/tenants/:tenantId/metrics', async (req, res) => {
  const { tenantId } = req.params;
  const cleanId = tenantId.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  const schemaName = `tenant_${cleanId}`;

  try {
    // 1. Resumen financiero agregado
    const { rows: aggRows } = await pool.query(`
      SELECT 
        COALESCE(SUM(total), 0) AS total_ventas,
        COUNT(*)::int AS total_comprobantes,
        COALESCE(AVG(total), 0) AS ticket_promedio,
        COALESCE(SUM(impuestos), 0) AS total_iva
      FROM "${schemaName}".facturas
    `);

    // 2. Desglose por medio de pago
    const { rows: paymentRows } = await pool.query(`
      SELECT 
        COALESCE(metodo_pago, 'Efectivo') AS metodo,
        COUNT(*)::int AS transacciones,
        COALESCE(SUM(total), 0) AS total
      FROM "${schemaName}".facturas
      GROUP BY metodo_pago
      ORDER BY total DESC
    `);

    // 3. Ventas por día
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
      desglose_pagos: paymentRows.map(r => ({
        metodo: r.metodo,
        transacciones: r.transacciones,
        total: parseFloat(r.total)
      })),
      ventas_por_dia: dailyRows.map(r => ({
        dia: r.dia,
        label: r.label,
        transacciones: r.transacciones,
        total: parseFloat(r.total)
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Montar endpoints del servicio SOAP Multi-Tenant
app.use('/ws', soapRoutes);

// Endpoint para monitoreo y resumen de logs clasificados
app.get('/api/logs/summary', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    logs: getLogsSummary()
  });
});

// Health check para orquestadores o contenedores
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Manejador global de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Manejador global de errores con registro clasificado en logs/errors/
app.use((err, req, res, next) => {
  logError(err, {
    url: req.originalUrl || req.url,
    method: req.method,
    clientIp: req.headers['cf-connecting-ip'] || req.ip
  });

  res.status(500).type('text/xml; charset=utf-8').send(`<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <soap:Fault>
      <faultcode>soap:Server</faultcode>
      <faultstring>Internal Server Error</faultstring>
      <detail><message>${err.message}</message></detail>
    </soap:Fault>
  </soap:Body>
</soap:Envelope>`);
});

// Inicializar servidor
app.listen(PORT, () => {
  console.log(`[SOAP Engine] Servidor escuchando en el puerto ${PORT} en modo ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Endpoints] WSDL disponible en: http://localhost:${PORT}/ws/:tenantId?wsdl`);
  console.log(`[Endpoints] SOAP POST disponible en: http://localhost:${PORT}/ws/:tenantId`);
});

export default app;
