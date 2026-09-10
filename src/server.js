import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import pool from './config/database.js';
import soapRoutes from './routes/soapRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Logging HTTP
app.use(morgan('dev'));

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
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, SOAPAction, x-tenant-id');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Endpoint raíz informativo del Backend
app.get('/', (req, res) => {
  res.json({
    service: 'TaskMaster Multi-Tenant SOAP & REST API Backend',
    status: 'online',
    version: '1.0.0',
    documentation: {
      health: '/health',
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
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Sembrar factura inicial para pruebas inmediatas
    const subtotalCalc = (saldo * 0.84).toFixed(2);
    const impuestosCalc = (saldo * 0.16).toFixed(2);
    const cufe = `CUFE-${cleanId.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}-2026`;

    await client.query(`
      INSERT INTO "${schemaName}".facturas (id, numero_factura, cliente, subtotal, impuestos, total, estado, folio_fiscal, items_count)
      OVERRIDING SYSTEM VALUE
      VALUES (1001, 'FAC-1001', $1, $2, $3, $4, 'TIMBRADA / APROBADA', $5, 5)
      ON CONFLICT (numero_factura) DO UPDATE
      SET cliente = EXCLUDED.cliente, total = EXCLUDED.total;
    `, [titular, subtotalCalc, impuestosCalc, saldo, cufe]);

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

// Montar endpoints del servicio SOAP Multi-Tenant
app.use('/ws', soapRoutes);

// Health check para orquestadores o contenedores
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Manejador global de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Manejador global de errores
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
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
