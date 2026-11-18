import pool from '../src/config/database.js';

async function migrateAndClean() {
  const client = await pool.connect();
  try {
    console.log('[Migration] Iniciando revisión y migración de esquemas en Neon...');

    // 1. Obtener todos los tenants registrados
    const { rows: tenants } = await client.query('SELECT id, schema_name FROM public.tenants');
    console.log(`[Migration] Se encontraron ${tenants.length} tenants para migrar.`);

    for (const t of tenants) {
      const schema = t.schema_name;
      console.log(`[Migration] Procesando esquema: "${schema}"`);

      // Asegurar columnas requeridas en la tabla facturas
      await client.query(`
        CREATE TABLE IF NOT EXISTS "${schema}".facturas (
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
      `);

      // Asegurar que exista la columna metodo_pago y created_at si la tabla ya existía
      await client.query(`
        ALTER TABLE "${schema}".facturas 
        ADD COLUMN IF NOT EXISTS metodo_pago VARCHAR(50) DEFAULT 'Efectivo',
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
      `);

      // Eliminar facturas ficticias de prueba 'FAC-1001' o 'TYS-1001' generadas previamente
      const deleteRes = await client.query(`
        DELETE FROM "${schema}".facturas 
        WHERE numero_factura IN ('FAC-1001', 'TYS-1001')
           OR cliente LIKE '%Prueba%'
           OR cliente LIKE '%Frecuente - Salón%';
      `);
      console.log(`[Migration] Esquema "${schema}": eliminadas ${deleteRes.rowCount} facturas de prueba.`);
    }

    console.log('[Migration] Limpieza y migración de esquemas completada con éxito.');
  } catch (err) {
    console.error('[Migration] Error ejecutando migración:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrateAndClean();
