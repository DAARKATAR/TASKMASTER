import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runSeed() {
  try {
    const seedSqlPath = path.join(__dirname, 'seed.sql');
    const sql = fs.readFileSync(seedSqlPath, 'utf-8');
    
    console.log('Aplicando migraciones y datos iniciales en Neon PostgreSQL...');
    await pool.query(sql);
    console.log('✅ Base de datos inicializada con éxito (tenants alpha y beta listos).');
  } catch (error) {
    console.error('❌ Error aplicando seed:', error);
  } finally {
    await pool.end();
  }
}

runSeed();
