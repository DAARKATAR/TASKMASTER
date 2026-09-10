import pool from '../src/config/database.js';

async function resetDatabase() {
  const client = await pool.connect();
  try {
    console.log('[Reset] Iniciando purga total de datos de prueba en Neon PostgreSQL...');

    // 1. Obtener todos los esquemas de tenants existentes
    const { rows: schemas } = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%';
    `);

    console.log(`[Reset] Se encontraron ${schemas.length} esquemas de tenants para eliminar.`);

    // 2. Eliminar cada esquema tenant en cascada
    for (const s of schemas) {
      console.log(`[Reset] Eliminando esquema en cascada: "${s.schema_name}"`);
      await client.query(`DROP SCHEMA IF EXISTS "${s.schema_name}" CASCADE;`);
    }

    // 3. Recrear o limpiar la tabla public.tenants
    console.log('[Reset] Recreando tabla limpia public.tenants...');
    await client.query(`DROP TABLE IF EXISTS public.tenants CASCADE;`);
    await client.query(`
      CREATE TABLE public.tenants (
        id VARCHAR(50) PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        schema_name VARCHAR(100) NOT NULL UNIQUE,
        brand_color VARCHAR(20) NOT NULL DEFAULT '#0F172A',
        business_type VARCHAR(100) DEFAULT 'Comercio General',
        logo VARCHAR(50) DEFAULT '🏬',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 4. Comprobar que la tabla esté totalmente vacía
    const { rows: countRows } = await client.query('SELECT COUNT(*)::int AS count FROM public.tenants;');
    console.log(`[Reset] Estado final de public.tenants: ${countRows[0].count} registros.`);

    // 5. Comprobar que no queden esquemas tenant_*
    const { rows: remainingSchemas } = await client.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%';
    `);
    console.log(`[Reset] Esquemas tenant_* restantes: ${remainingSchemas.length}`);

    console.log('[Reset] ¡La base de datos de Neon ha quedado 100% limpia y lista para tenants reales!');
  } catch (err) {
    console.error('[Reset] Error reseteando la base de datos:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

resetDatabase();
