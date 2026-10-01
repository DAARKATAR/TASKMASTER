import pool from '../../config/database.js';
import { getDefaultProducts } from '../../config/defaultProducts.js';
import { invalidateTenantCache } from '../../services/tenantService.js';
import { Tenant, ProvisionTenantDTO } from './tenant.types.js';

const SAFE_SLUG_REGEX = /^[a-z0-9_]{2,30}$/;

/**
 * Aprovisiona un nuevo esquema PostgreSQL aislado y puebla las tablas maestras.
 * Es el único punto canónico de aprovisionamiento de tenants en la plataforma.
 */
export async function provisionTenant(dto: ProvisionTenantDTO): Promise<Tenant> {
  const cleanId = String(dto.id).trim().toLowerCase().replace(/[^a-z0-9_]/g, '');

  if (!SAFE_SLUG_REGEX.test(cleanId)) {
    throw new Error('El identificador del tenant debe tener entre 2 y 30 caracteres alfanuméricos.');
  }

  const schemaName = `tenant_${cleanId}`;
  const titular = dto.initialTitular || `Administrador de ${dto.nombre}`;
  const brandColor = dto.brandColor || '#4F46E5';
  const saldo = Number(dto.initialSaldo) || 50000.00;

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
    `, [cleanId, dto.nombre, schemaName, brandColor]);

    // 2. Crear esquema aislado
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);

    // 3. Crear DDL de tablas dentro del esquema
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

      CREATE TABLE IF NOT EXISTS "${schemaName}".cuentas (
        id SERIAL PRIMARY KEY,
        numero_cuenta VARCHAR(50) NOT NULL UNIQUE,
        titular VARCHAR(150) NOT NULL,
        saldo NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        moneda VARCHAR(10) NOT NULL DEFAULT 'COP',
        tipo_cuenta VARCHAR(50) NOT NULL DEFAULT 'Corriente POS',
        activa BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Semillado de cuenta POS y catálogo inicial
    await client.query(`
      INSERT INTO "${schemaName}".cuentas (numero_cuenta, titular, saldo, moneda, tipo_cuenta, activa)
      VALUES ($1, $2, $3, 'COP', 'Terminal POS Principal', TRUE)
      ON CONFLICT (numero_cuenta) DO NOTHING;
    `, [`CTA-${cleanId.toUpperCase()}-001`, titular, saldo]);

    const defaultProds = getDefaultProducts();
    for (const p of defaultProds) {
      await client.query(`
        INSERT INTO "${schemaName}".productos (nombre, precio, rubro, emoji, stock, descripcion)
        VALUES ($1, $2, $3, $4, $5, $6);
      `, [p.nombre, p.precio, p.rubro, p.emoji, p.stock, p.descripcion]);
    }

    await client.query('COMMIT');
    invalidateTenantCache(cleanId);

    return {
      id: cleanId,
      nombre: dto.nombre,
      name: dto.nombre,
      schema_name: schemaName,
      brand_color: brandColor
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
