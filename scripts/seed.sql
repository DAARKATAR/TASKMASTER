-- ==========================================================
-- SCRIPT MULTI-TENANT: TORTAS Y SNACKS ARTESANALES
-- PALETA FUCSIA & COLORES PASTELES
-- POSTGRESQL 17 (NEON SERVERLESS)
-- ==========================================================

-- 1. Registro Central de Inquilinos
CREATE TABLE IF NOT EXISTS public.tenants (
    id VARCHAR(50) PRIMARY KEY,          -- Slug del tenant
    nombre VARCHAR(100) NOT NULL,        -- Razón social
    schema_name VARCHAR(63) NOT NULL,    -- Esquema aislado en PostgreSQL
    brand_color VARCHAR(20) DEFAULT '#DB2777',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Marcas Registradas (Tortas y Snacks como inquilino principal)
INSERT INTO public.tenants (id, nombre, schema_name, brand_color)
VALUES 
  ('tortasysnacks', 'Tortas y Snacks Artesanales', 'tenant_tortasysnacks', '#DB2777'),
  ('gourmetpos', 'GourmetCloud POS & Gastronomía', 'tenant_gourmetpos', '#F97316'),
  ('retailx', 'RetailX Smart POS & Boutiques', 'tenant_retailx', '#8B5CF6')
ON CONFLICT (id) DO UPDATE 
SET nombre = EXCLUDED.nombre,
    schema_name = EXCLUDED.schema_name,
    brand_color = EXCLUDED.brand_color;

-- ==========================================================
-- 2. ESQUEMA AISLADO: TORTAS Y SNACKS ARTESANALES
-- ==========================================================
CREATE SCHEMA IF NOT EXISTS tenant_tortasysnacks;

CREATE TABLE IF NOT EXISTS tenant_tortasysnacks.facturas (
    id SERIAL PRIMARY KEY,
    numero_factura VARCHAR(50) NOT NULL UNIQUE,
    cliente VARCHAR(150) NOT NULL,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    impuestos NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    estado VARCHAR(50) NOT NULL DEFAULT 'TIMBRADA / APROBADA',
    folio_fiscal VARCHAR(100) NOT NULL,
    items_count INT DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO tenant_tortasysnacks.facturas (id, numero_factura, cliente, subtotal, impuestos, total, estado, folio_fiscal, items_count)
OVERRIDING SYSTEM VALUE
VALUES 
  (1001, 'TYS-1001', 'Cliente Frecuente - Salón Pastel', 50420.17, 9579.83, 60000.00, 'TIMBRADA / APROBADA', 'CUFE-TYS-9921-ROSE-2026', 3),
  (2002, 'TYS-2002', 'Mariana Vega - Pedido Especial Torta Cumpleaños', 121848.74, 23151.26, 145000.00, 'TIMBRADA / APROBADA', 'CUFE-TYS-4412-BERRY-2026', 1)
ON CONFLICT (numero_factura) DO UPDATE 
SET cliente = EXCLUDED.cliente, subtotal = EXCLUDED.subtotal, impuestos = EXCLUDED.impuestos, total = EXCLUDED.total, folio_fiscal = EXCLUDED.folio_fiscal;
