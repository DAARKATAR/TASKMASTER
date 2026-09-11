import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

async function checkDetails() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
  });

  try {
    console.log('--- schema_alpha.cuentas ---');
    try {
      const r1 = await pool.query('SELECT * FROM schema_alpha.cuentas LIMIT 10;');
      console.table(r1.rows);
    } catch (e) {
      console.log('Error reading schema_alpha.cuentas:', e.message);
    }

    console.log('--- schema_beta.cuentas ---');
    try {
      const r2 = await pool.query('SELECT * FROM schema_beta.cuentas LIMIT 10;');
      console.table(r2.rows);
    } catch (e) {
      console.log('Error reading schema_beta.cuentas:', e.message);
    }

    console.log('--- tenant_test.productos ---');
    try {
      const r3 = await pool.query('SELECT * FROM tenant_test.productos LIMIT 10;');
      console.table(r3.rows);
    } catch (e) {
      console.log('Error reading tenant_test.productos:', e.message);
    }

    console.log('--- tenant_testco ---');
    try {
      const r4 = await pool.query('SELECT * FROM tenant_testco.facturas LIMIT 5;');
      console.table(r4.rows);
    } catch (e) {
      console.log('Error reading tenant_testco.facturas:', e.message);
    }

  } finally {
    await pool.end();
  }
}

checkDetails().catch(console.error);
