import pool from '../src/config/database.js';
import { getDefaultProducts } from '../src/config/defaultProducts.js';

async function testProductsAndDetails() {
  const client = await pool.connect();
  const testTenantId = 'test_pos_catalog';
  const testSchema = `tenant_${testTenantId}`;

  try {
    console.log('[Test Catalog] 1. Preparando entorno de prueba en Neon...');
    await client.query(`DROP SCHEMA IF EXISTS "${testSchema}" CASCADE;`);
    await client.query(`CREATE SCHEMA "${testSchema}";`);

    console.log('[Test Catalog] 2. Creando tablas facturas, factura_detalles y productos...');
    await client.query(`
      CREATE TABLE "${testSchema}".facturas (
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

      CREATE TABLE "${testSchema}".factura_detalles (
        id SERIAL PRIMARY KEY,
        factura_id INT NOT NULL REFERENCES "${testSchema}".facturas(id) ON DELETE CASCADE,
        producto_id INT,
        nombre_producto VARCHAR(150) NOT NULL,
        cantidad INT NOT NULL DEFAULT 1,
        precio_unitario NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
        subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00
      );

      CREATE TABLE "${testSchema}".productos (
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

    console.log('[Test Catalog] 3. Sembrando catálogo inicial de Repostería & Café...');
    const defaultProds = getDefaultProducts('Repostería & Café');
    for (const p of defaultProds) {
      await client.query(`
        INSERT INTO "${testSchema}".productos (nombre, precio, rubro, emoji, stock, descripcion)
        VALUES ($1, $2, $3, $4, $5, $6);
      `, [p.nombre, p.precio, p.rubro, p.emoji, p.stock, p.descripcion]);
    }

    const { rows: prods } = await client.query(`SELECT id, nombre, precio, stock FROM "${testSchema}".productos ORDER BY id ASC`);
    console.log(`✓ Se crearon ${prods.length} productos en Neon. Primer producto: "${prods[0].nombre}" ($${prods[0].precio}, Stock: ${prods[0].stock})`);

    console.log('[Test Catalog] 4. Simulando venta de 2 unidades del primer producto...');
    const prodToBuy = prods[0];
    const qtyToBuy = 2;
    const itemSubtotal = prodToBuy.precio * qtyToBuy;
    const iva = Math.round(itemSubtotal * 0.19);
    const total = itemSubtotal + iva;

    await client.query('BEGIN');
    const { rows: inv } = await client.query(`
      INSERT INTO "${testSchema}".facturas (numero_factura, cliente, subtotal, impuestos, total, folio_fiscal, items_count, metodo_pago)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `, ['REC-1001', 'Cliente Frecuente', itemSubtotal, iva, total, 'CUFE-TEST-12345', qtyToBuy, 'Tarjeta']);

    await client.query(`
      INSERT INTO "${testSchema}".factura_detalles (factura_id, producto_id, nombre_producto, cantidad, precio_unitario, subtotal)
      VALUES ($1, $2, $3, $4, $5, $6);
    `, [inv[0].id, prodToBuy.id, prodToBuy.nombre, qtyToBuy, prodToBuy.precio, itemSubtotal]);

    await client.query(`
      UPDATE "${testSchema}".productos
      SET stock = stock - $1
      WHERE id = $2;
    `, [qtyToBuy, prodToBuy.id]);

    await client.query('COMMIT');
    console.log('✓ Venta registrada con éxito en facturas y factura_detalles.');

    console.log('[Test Catalog] 5. Verificando persistencia y descuento de inventario...');
    const { rows: details } = await client.query(`
      SELECT d.*, f.numero_factura 
      FROM "${testSchema}".factura_detalles d
      JOIN "${testSchema}".facturas f ON f.id = d.factura_id
      WHERE d.factura_id = $1;
    `, [inv[0].id]);

    if (details.length !== 1 || details[0].cantidad !== 2) throw new Error('Detalle no coincide');

    const { rows: updatedProd } = await client.query(`SELECT stock FROM "${testSchema}".productos WHERE id = $1;`, [prodToBuy.id]);
    const expectedStock = prodToBuy.stock - qtyToBuy;
    if (updatedProd[0].stock !== expectedStock) {
      throw new Error(`Stock no descontado correctamente. Esperado: ${expectedStock}, Obtenido: ${updatedProd[0].stock}`);
    }
    console.log(`✓ Inventario descontado con éxito: ${prodToBuy.stock} -> ${updatedProd[0].stock}`);

    console.log('[Test Catalog] 6. Limpiando esquema de prueba...');
    await client.query(`DROP SCHEMA IF EXISTS "${testSchema}" CASCADE;`);
    console.log('✓ Esquema de prueba eliminado.');

    console.log('\n======================================================');
    console.log(' TODOS LOS TESTS DE PRODUCTOS Y DETALLES EXITOSOS!  ');
    console.log('======================================================');
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Test Catalog Failed]', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

testProductsAndDetails();
