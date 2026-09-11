import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

async function inspectDb() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
  });
  
  try {
    const schemasRes = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY schema_name;
    `);
    console.log('=== ALL SCHEMAS ===');
    console.log(schemasRes.rows.map(r => r.schema_name));

    const tablesRes = await pool.query(`
      SELECT table_schema, table_name 
      FROM information_schema.tables 
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
      ORDER BY table_schema, table_name;
    `);
    console.log('=== ALL TABLES BY SCHEMA ===');
    console.table(tablesRes.rows);

    const tenantsRes = await pool.query('SELECT * FROM public.tenants;');
    console.log('=== PUBLIC.TENANTS ===');
    console.table(tenantsRes.rows);

    const tenantUsersRes = await pool.query('SELECT id, email, tenant_id, role FROM public.tenant_users;');
    console.log('=== PUBLIC.TENANT_USERS ===');
    console.table(tenantUsersRes.rows);

  } finally {
    await pool.end();
  }
}

inspectDb().catch(console.error);
