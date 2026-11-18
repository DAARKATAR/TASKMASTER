import pool from '../src/config/database.js';

async function initAuthTables() {
  const client = await pool.connect();
  try {
    console.log('[Auth DB] Asegurando tabla public.tenant_users...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.tenant_users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(150) NOT NULL UNIQUE,
        tenant_id VARCHAR(50) NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_tenant_users_email ON public.tenant_users(email);
    `);
    console.log('[Auth DB] Tabla public.tenant_users inicializada con éxito.');
  } catch (err) {
    console.error('[Auth DB Error]', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

initAuthTables();
