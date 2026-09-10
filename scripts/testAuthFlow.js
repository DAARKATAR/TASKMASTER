import bcrypt from 'bcryptjs';
import pool from '../src/config/database.js';
import { signJwt, authenticateJwt } from '../src/middleware/auth.js';

async function testAuth() {
  const client = await pool.connect();
  const testEmail = 'test_security_owner@taskmaster-audit.com';
  const testPassword = 'PasswordSeguro123!';
  const testTenantId = 'testauthnegocio';
  const testSchema = `tenant_${testTenantId}`;

  try {
    console.log('[Test Auth] 1. Limpiando datos previos de prueba si existían...');
    await client.query(`DROP SCHEMA IF EXISTS "${testSchema}" CASCADE;`);
    await client.query('DELETE FROM public.tenant_users WHERE email = $1;', [testEmail]);
    await client.query('DELETE FROM public.tenants WHERE id = $1;', [testTenantId]);

    console.log('[Test Auth] 2. Probando hasheo bcrypt y aprovisionamiento de esquema...');
    const hash = await bcrypt.hash(testPassword, 10);
    const isMatchBefore = await bcrypt.compare(testPassword, hash);
    if (!isMatchBefore) throw new Error('Bcrypt hash compare failed!');
    console.log('✓ Bcrypt hashing validado con éxito.');

    await client.query('BEGIN');
    await client.query(`
      INSERT INTO public.tenants (id, nombre, schema_name, brand_color, business_type, logo)
      VALUES ($1, $2, $3, $4, $5, $6);
    `, [testTenantId, 'Test Auth Negocio', testSchema, '#0F172A', 'Pruebas', '🏬']);

    await client.query(`
      INSERT INTO public.tenant_users (email, tenant_id)
      VALUES ($1, $2);
    `, [testEmail, testTenantId]);

    await client.query(`CREATE SCHEMA "${testSchema}";`);
    await client.query(`
      CREATE TABLE "${testSchema}".usuarios (
        id SERIAL PRIMARY KEY,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        nombre VARCHAR(150) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const { rows: insertedUser } = await client.query(`
      INSERT INTO "${testSchema}".usuarios (email, password_hash, nombre, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, nombre, role;
    `, [testEmail, hash, 'Test Admin', 'admin']);

    await client.query('COMMIT');
    console.log('✓ Inquilino, mapeo público y tabla aislada usuarios aprovisionados en Neon.');

    console.log('[Test Auth] 3. Probando generación y firma de token JWT...');
    const token = signJwt({
      userId: insertedUser[0].id,
      email: insertedUser[0].email,
      nombre: insertedUser[0].nombre,
      role: insertedUser[0].role,
      tenantId: testTenantId,
      schemaName: testSchema
    });

    if (!token || typeof token !== 'string') throw new Error('JWT signing failed');
    console.log('✓ Token JWT generado:', token.slice(0, 30) + '...');

    console.log('[Test Auth] 4. Probando verificación de login contra Neon...');
    const { rows: mapCheck } = await client.query('SELECT tenant_id FROM public.tenant_users WHERE email = $1;', [testEmail]);
    if (mapCheck.length === 0) throw new Error('Mapping not found');

    const { rows: userCheck } = await client.query(`
      SELECT id, email, password_hash, nombre, role 
      FROM "${testSchema}".usuarios 
      WHERE email = $1;
    `, [testEmail]);

    const passwordMatches = await bcrypt.compare(testPassword, userCheck[0].password_hash);
    const wrongPasswordMatches = await bcrypt.compare('WrongPassword999', userCheck[0].password_hash);

    if (!passwordMatches) throw new Error('Valid password rejected!');
    if (wrongPasswordMatches) throw new Error('Invalid password accepted!');
    console.log('✓ Validación de login correcta: clave correcta aceptada, clave incorrecta rechazada.');

    console.log('[Test Auth] 5. Limpiando inquilino de prueba para mantener 0 tenants en Neon...');
    await client.query(`DROP SCHEMA IF EXISTS "${testSchema}" CASCADE;`);
    await client.query('DELETE FROM public.tenant_users WHERE email = $1;', [testEmail]);
    await client.query('DELETE FROM public.tenants WHERE id = $1;', [testTenantId]);

    const { rows: count } = await client.query('SELECT COUNT(*)::int AS c FROM public.tenants;');
    console.log(`✓ Neon limpio: ${count[0].c} inquilinos restantes.`);

    console.log('\n========================================');
    console.log(' TODOS LOS TESTS DE AUTH Y DB PASARON! ');
    console.log('========================================');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Test Auth Failed]', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

testAuth();
