import pg from 'pg';
import dotenv from 'dotenv';
import { getDefaultProducts } from '../src/config/defaultProducts.js';
dotenv.config();

const { Pool } = pg;

async function syncAllTenants() {
  const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: { rejectUnauthorized: false } 
  });

  try {
    const schemasRes = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name LIKE 'tenant_%'
    `);

    for (const row of schemasRes.rows) {
      const s = row.schema_name;
      console.log(`Checking schema ${s}...`);

      // 1. Ensure factura_detalles
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "${s}".factura_detalles (
          id SERIAL PRIMARY KEY,
          factura_id INT NOT NULL REFERENCES "${s}".facturas(id) ON DELETE CASCADE,
          producto_id INT,
          nombre_producto VARCHAR(150) NOT NULL,
          cantidad INT NOT NULL DEFAULT 1,
          precio_unitario NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
          subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00
        );
      `);

      // 2. Ensure productos
      await pool.query(`
        CREATE TABLE IF NOT EXISTS "${s}".productos (
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

      // Check if productos has rows
      const prodCheck = await pool.query(`SELECT COUNT(*) FROM "${s}".productos;`);
      if (parseInt(prodCheck.rows[0].count, 10) === 0) {
        console.log(`Seeding initial products for ${s}...`);
        const defaultProds = getDefaultProducts('General');
        for (const p of defaultProds) {
          await pool.query(`
            INSERT INTO "${s}".productos (nombre, precio, rubro, emoji, stock, descripcion)
            VALUES ($1, $2, $3, $4, $5, $6);
          `, [p.nombre, p.precio, p.rubro, p.emoji, p.stock, p.descripcion]);
        }
      }

      console.log(`Schema ${s} is 100% updated with productos and factura_detalles.`);
    }

  } finally {
    await pool.end();
  }
}

syncAllTenants().catch(console.error);
