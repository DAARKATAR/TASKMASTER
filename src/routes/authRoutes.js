import express from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { signJwt, authenticateJwt } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { logAudit } from '../services/auditLogger.js';
import { getDefaultProducts } from '../config/defaultProducts.js';

const router = express.Router();

/**
 * POST /api/auth/register-tenant
 * Registro seguro de un nuevo negocio con aprovisionamiento de esquema,
 * tabla aislada de usuarios y emisión de JWT.
 */
router.post('/register-tenant', authLimiter, async (req, res) => {
  const {
    businessName,
    slug,
    brandColor,
    logo,
    businessType,
    email,
    password,
    ownerName
  } = req.body;

  // 1. Validaciones básicas
  if (!businessName || !businessName.trim()) {
    return res.status(400).json({ error: 'El nombre del negocio es obligatorio.' });
  }

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Debe ingresar un correo electrónico válido.' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const rawSlug = slug || businessName;
  const cleanId = rawSlug.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

  if (cleanId.length < 2 || cleanId.length > 30) {
    return res.status(400).json({ error: 'El identificador del negocio debe tener entre 2 y 30 caracteres alfanuméricos.' });
  }

  const schemaName = `tenant_${cleanId}`;
  const color = brandColor || '#0F172A';
  const finalOwnerName = (ownerName && ownerName.trim()) || 'Administrador';
  const finalType = businessType || 'Comercio General';
  const finalLogo = logo || '🏬';

  const client = await pool.connect();
  try {
    // 2. Verificar que el correo no esté registrado
    const { rows: existingUser } = await client.query(
      'SELECT id FROM public.tenant_users WHERE email = $1;',
      [cleanEmail]
    );
    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Este correo electrónico ya está registrado con otro negocio.' });
    }

    // 3. Verificar que el ID de tenant no esté tomado
    const { rows: existingTenant } = await client.query(
      'SELECT id FROM public.tenants WHERE id = $1;',
      [cleanId]
    );
    if (existingTenant.length > 0) {
      return res.status(400).json({ error: `El identificador de negocio "${cleanId}" ya se encuentra en uso. Elige otro nombre o slug.` });
    }

    // 4. Hashear la contraseña con bcrypt
    const passwordHash = await bcrypt.hash(password, 10);

    await client.query('BEGIN');

    // 5. Insertar en public.tenants
    await client.query(`
      INSERT INTO public.tenants (id, nombre, schema_name, brand_color, business_type, logo)
      VALUES ($1, $2, $3, $4, $5, $6);
    `, [cleanId, businessName.trim(), schemaName, color, finalType, finalLogo]);

    // 6. Insertar en public.tenant_users para mapeo de login
    await client.query(`
      INSERT INTO public.tenant_users (email, tenant_id)
      VALUES ($1, $2);
    `, [cleanEmail, cleanId]);

    // 7. Crear esquema aislado en PostgreSQL
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}";`);

    // 8. Crear tabla facturas dentro del esquema
    await client.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".facturas (
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

      -- Detalle de líneas de producto por factura
      CREATE TABLE IF NOT EXISTS "${schemaName}".factura_detalles (
        id SERIAL PRIMARY KEY,
        factura_id INT NOT NULL REFERENCES "${schemaName}".facturas(id) ON DELETE CASCADE,
        producto_id INT,
        nombre_producto VARCHAR(150) NOT NULL,
        cantidad INT NOT NULL DEFAULT 1,
        precio_unitario NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00
      );

      -- Catálogo e inventario real de productos
      CREATE TABLE IF NOT EXISTS "${schemaName}".productos (
        id SERIAL PRIMARY KEY,
        nombre VARCHAR(150) NOT NULL,
        precio NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        rubro VARCHAR(100) NOT NULL DEFAULT 'General',
        emoji VARCHAR(20) DEFAULT '📦',
        descripcion TEXT,
        stock INT NOT NULL DEFAULT 100,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 9. Poblar catálogo inicial según el rubro comercial
    const defaultProds = getDefaultProducts(finalType);
    for (const p of defaultProds) {
      await client.query(`
        INSERT INTO "${schemaName}".productos (nombre, precio, rubro, emoji, stock, descripcion)
        VALUES ($1, $2, $3, $4, $5, $6);
      `, [p.nombre, p.precio, p.rubro, p.emoji, p.stock, p.descripcion]);
    }

    // 10. Crear tabla usuarios aislada dentro del esquema del tenant
    await client.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".usuarios (
        id SERIAL PRIMARY KEY,
        email VARCHAR(150) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        nombre VARCHAR(150) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'admin',
        activo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 11. Insertar usuario administrador dentro del esquema del tenant
    const { rows: userRows } = await client.query(`
      INSERT INTO "${schemaName}".usuarios (email, password_hash, nombre, role)
      VALUES ($1, $2, $3, 'admin')
      RETURNING id, email, nombre, role, created_at;
    `, [cleanEmail, passwordHash, finalOwnerName]);

    await client.query('COMMIT');

    const createdUser = userRows[0];
    const tenantData = {
      id: cleanId,
      nombre: businessName.trim(),
      schema_name: schemaName,
      brand_color: color,
      business_type: finalType,
      logo: finalLogo
    };

    // 11. Emitir token JWT
    const token = signJwt({
      userId: createdUser.id,
      email: createdUser.email,
      nombre: createdUser.nombre,
      role: createdUser.role,
      tenantId: cleanId,
      schemaName
    });

    // 12. Registrar en log de auditoría clasificado
    logAudit({
      tenantId: cleanId,
      action: 'TENANT_REGISTERED',
      statusCode: 201,
      durationMs: 0,
      clientIp: req.headers['cf-connecting-ip'] || req.ip,
      metadata: { email: cleanEmail, businessName }
    });

    res.status(201).json({
      success: true,
      message: `Negocio "${businessName}" y usuario administrador creados con éxito.`,
      token,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        nombre: createdUser.nombre,
        role: createdUser.role
      },
      tenant: tenantData
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Register Error]', err);
    res.status(500).json({ error: `Error creando el negocio: ${err.message}` });
  } finally {
    client.release();
  }
});

/**
 * POST /api/auth/login
 * Autenticación mediante email y contraseña cifrada con bcrypt.
 * Protegido con authLimiter contra ataques de fuerza bruta.
 */
router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'El correo electrónico y la contraseña son obligatorios.' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const client = await pool.connect();

  try {
    console.log(`[Auth Login] 📥 Nueva petición de inicio de sesión para: "${cleanEmail}"`);
    console.log(`[Auth Login] 🔍 Consultando mapeo en tabla central "public.tenant_users"...`);

    // 1. Identificar a qué tenant pertenece el usuario
    let { rows: mappingRows } = await client.query(
      'SELECT tenant_id FROM public.tenant_users WHERE email = $1;',
      [cleanEmail]
    );

    let tenantId = mappingRows[0]?.tenant_id;

    // 1.1 Si no está en tenant_users, buscar en los esquemas existentes de public.tenants (Auto-reparación)
    if (!tenantId) {
      console.log(`[Auth Login] ⚠️ Usuario no encontrado en "public.tenant_users". Buscando en esquemas de tenants...`);
      const { rows: allTenants } = await client.query(
        'SELECT id, schema_name FROM public.tenants;'
      );

      for (const t of allTenants) {
        try {
          const { rows: checkUser } = await client.query(`
            SELECT id FROM "${t.schema_name}".usuarios WHERE email = $1;
          `, [cleanEmail]);

          if (checkUser.length > 0) {
            tenantId = t.id;
            console.log(`[Auth Login] 💡 Usuario localizado en esquema "${t.schema_name}" (${t.id}). Auto-registrando en "public.tenant_users"...`);
            await client.query(`
              INSERT INTO public.tenant_users (email, tenant_id)
              VALUES ($1, $2)
              ON CONFLICT (email) DO UPDATE SET tenant_id = $2;
            `, [cleanEmail, tenantId]);
            break;
          }
        } catch (schemaErr) {
          // Ignorar si el esquema o tabla aún no tiene la estructura
        }
      }
    }

    if (!tenantId) {
      console.log(`[Auth Login] ❌ Usuario "${cleanEmail}" no encontrado en la base de datos.`);
      return res.status(401).json({ error: 'Credenciales inválidas. Usuario no registrado en ningún negocio.' });
    }

    console.log(`[Auth Login] 🏢 Tenant identificado: "${tenantId}". Consultando datos del inquilino...`);

    // 2. Obtener datos del tenant
    const { rows: tenantRows } = await client.query(
      'SELECT id, nombre, schema_name, brand_color, business_type, logo FROM public.tenants WHERE id = $1;',
      [tenantId]
    );

    if (tenantRows.length === 0) {
      console.log(`[Auth Login] ❌ El negocio "${tenantId}" no está activo.`);
      return res.status(401).json({ error: 'El negocio asociado a este usuario no se encuentra activo.' });
    }

    const tenant = tenantRows[0];
    console.log(`[Auth Login] 🔐 Verificando credenciales en "${tenant.schema_name}".usuarios...`);

    // 3. Consultar la tabla aislada del tenant
    const { rows: userRows } = await client.query(`
      SELECT id, email, password_hash, nombre, role, activo 
      FROM "${tenant.schema_name}".usuarios 
      WHERE email = $1;
    `, [cleanEmail]);

    if (userRows.length === 0) {
      console.log(`[Auth Login] ❌ El usuario no existe en la tabla "${tenant.schema_name}".usuarios.`);
      return res.status(401).json({ error: 'Credenciales inválidas.' });
    }

    const user = userRows[0];

    if (!user.activo) {
      console.log(`[Auth Login] ⚠️ Cuenta desactivada para: "${cleanEmail}".`);
      return res.status(403).json({ error: 'Esta cuenta de usuario ha sido desactivada.' });
    }

    // 4. Comparar contraseña con bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      console.log(`[Auth Login] ❌ Contraseña incorrecta para: "${cleanEmail}".`);
      return res.status(401).json({ error: 'Credenciales inválidas. Contraseña incorrecta.' });
    }

    console.log(`[Auth Login] ✅ Contraseña válida para: "${cleanEmail}". Generando token JWT...`);

    // 5. Emitir JWT
    const token = signJwt({
      userId: user.id,
      email: user.email,
      nombre: user.nombre,
      role: user.role,
      tenantId: tenant.id,
      schemaName: tenant.schema_name
    });

    // 6. Registrar en auditoría
    logAudit({
      tenantId: tenant.id,
      action: 'LOGIN_SUCCESS',
      statusCode: 200,
      durationMs: 0,
      clientIp: req.headers['cf-connecting-ip'] || req.ip,
      metadata: { email: cleanEmail }
    });

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso.',
      token,
      user: {
        id: user.id,
        email: user.email,
        nombre: user.nombre,
        role: user.role
      },
      tenant
    });
  } catch (err) {
    console.error('[Login Error]', err);
    res.status(500).json({ error: `Error en la autenticación: ${err.message}` });
  } finally {
    client.release();
  }
});

/**
 * GET /api/auth/me
 * Endpoint protegido para validar sesión y restaurar datos del usuario y su tenant
 */
router.get('/me', authenticateJwt, async (req, res) => {
  const { tenantId, email } = req.user;
  const client = await pool.connect();

  try {
    const { rows: tenantRows } = await client.query(
      'SELECT id, nombre, schema_name, brand_color, business_type, logo FROM public.tenants WHERE id = $1;',
      [tenantId]
    );

    if (tenantRows.length === 0) {
      return res.status(404).json({ error: 'Inquilino no encontrado.' });
    }

    const tenant = tenantRows[0];
    const { rows: userRows } = await client.query(`
      SELECT id, email, nombre, role, created_at 
      FROM "${tenant.schema_name}".usuarios 
      WHERE email = $1;
    `, [email]);

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado en el inquilino.' });
    }

    res.json({
      success: true,
      user: userRows[0],
      tenant
    });
  } catch (err) {
    console.error('[Me Error]', err);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

export default router;
