import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set in the environment variables.');
  process.exit(1);
}

/**
 * Pool optimizado para PostgreSQL Serverless (Neon DB) en Render:
 * - max: 10 conexiones simultáneas
 * - idleTimeoutMillis: 30000 (cierra conexiones ociosas para no saturar Neon)
 * - connectionTimeoutMillis: 10000 (tolerancia para cold-starts de Neon)
 * - allowExitOnIdle: true (permite al runtime de Node terminar limpiamente)
 */
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  allowExitOnIdle: true
});

// Validación de la conexión inicial
pool.connect((err, client, release) => {
  if (err) {
    console.error('[DATABASE] Error conectando con el pool de Neon DB:', err.message);
  } else {
    console.log('[DATABASE] Conexión establecida con éxito con Neon PostgreSQL.');
    release();
  }
});

export default pool;
