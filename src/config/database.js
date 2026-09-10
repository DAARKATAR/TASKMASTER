import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('ERROR: DATABASE_URL is not set in the environment variables.');
  process.exit(1);
}

// Configuración del Pool para PostgreSQL (Neon)
// Se requiere SSL obligatorio.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Neon usa certificados que pueden requerir esto en algunos entornos
  }
});

// Validación de la conexión inicial
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client from pool', err.stack);
  } else {
    console.log('Successfully connected to the database.');
    release();
  }
});

export default pool;
