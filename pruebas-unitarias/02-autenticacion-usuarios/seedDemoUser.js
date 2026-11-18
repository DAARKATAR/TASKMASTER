import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pg;

async function seedDemoUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const hash = await bcrypt.hash('admin123', 10);
    const email = 'admin@taskmaster.com';
    const tenantId = 'pasteleratest';

    // 1. Asegurar en tenant_pasteleratest.usuarios
    await pool.query(`
      INSERT INTO tenant_pasteleratest.usuarios (email, password_hash, nombre, role, activo)
      VALUES ($1, $2, 'Administrador Demo', 'admin', true)
      ON CONFLICT (email) DO UPDATE SET password_hash = $2, activo = true;
    `, [email, hash]);

    // 2. Asegurar en public.tenant_users
    await pool.query(`
      INSERT INTO public.tenant_users (email, tenant_id)
      VALUES ($1, $2)
      ON CONFLICT (email) DO UPDATE SET tenant_id = $2;
    `, [email, tenantId]);

    console.log('✅ Usuario demo creado/actualizado:');
    console.log('   Email: admin@taskmaster.com');
    console.log('   Password: admin123');
    console.log('   Tenant: pasteleratest (Pastelería Test)');
  } catch (err) {
    console.error('Error seeding demo user:', err);
  } finally {
    await pool.end();
  }
}

seedDemoUser();
