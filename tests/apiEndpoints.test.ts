import { describe, it, expect, vi } from "vitest";

// Mock global de la librería PostgreSQL ("pg") para pruebas desacopladas de red
vi.mock("pg", () => {
  const mockClient = {
    query: vi.fn().mockImplementation((sql, params) => {
      const s = String(sql).toLowerCase();
      if (s.includes("begin") || s.includes("commit") || s.includes("set local")) {
        return Promise.resolve({ rows: [] });
      }
      if (s.includes("from public.tenants") || s.includes("from tenants")) {
        return Promise.resolve({
          rows: [
            { id: "pasteleratest", nombre: "Pastelería Test", name: "Pastelería Test", schema_name: "tenant_pasteleratest", brand_color: "#F97316", active_modules: ["pos", "inventory", "invoices", "kpis"] }
          ]
        });
      }
      if (s.includes("from productos")) {
        return Promise.resolve({
          rows: [
            { id: 1, nombre: "Croissant Francés", precio: 8500, stock: 20, rubro: "Cafetería", emoji: "🥐" }
          ]
        });
      }
      if (s.includes("sum(total)") || s.includes("total_ventas") || s.includes("group by metodo_pago") || s.includes("group by to_char") || s.includes("ticket_promedio")) {
        return Promise.resolve({
          rows: [{ total_ventas: "150000", total_comprobantes: 10, ticket_promedio: "15000", total_iva: "28500", metodo: "Efectivo", transacciones: 10, total: "150000", dia: "2026-10-29", label: "Hoy" }]
        });
      }
      if (s.includes("count(*)") && s.includes("facturas")) {
        return Promise.resolve({ rows: [{ total: 1 }] });
      }
      if (s.includes("from facturas") || s.includes(".facturas")) {
        return Promise.resolve({
          rows: [
            { id: 1001, numero_factura: "FAC-1001", cliente: "Cliente Test", subtotal: 10000, impuestos: 1900, total: 11900, estado: "TIMBRADA / APROBADA", folio_fiscal: "CUFE-TEST-123", items_count: 1 }
          ]
        });
      }
      return Promise.resolve({ rows: [] });
    }),
    release: vi.fn()
  };

  class MockPool {
    connect(cb) {
      if (cb) cb(null, mockClient, vi.fn());
      return Promise.resolve(mockClient);
    }
    query(sql, params) {
      return mockClient.query(sql, params);
    }
  }

  return {
    default: { Pool: MockPool },
    Pool: MockPool
  };
});
import request from "supertest";
import app from "../src/server.js";

describe('TaskMaster Core API Endpoints Debug Test Suite', () => {
  it('GET / and /api should return system status', async () => {
    const res = await request(app).get('/api');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('online');
    expect(res.body.service).toContain('TaskMaster');
  });

  it('GET /health should return healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });

  it('GET /api/logs/summary should return logs summary object', async () => {
    const res = await request(app).get('/api/logs/summary');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.logs).toHaveProperty('audit');
    expect(res.body.logs).toHaveProperty('access');
    expect(res.body.logs).toHaveProperty('errors');
  });

  it('GET /api/tenants should return list of active tenants', async () => {
    const res = await request(app).get('/api/tenants');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /ws/pasteleratest should return WSDL XML definition', async () => {
    const res = await request(app).get('/ws/pasteleratest');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/xml/);
    expect(res.text).toContain('<definitions');
    expect(res.text).toContain('http://schemas.xmlsoap.org/wsdl/');
  });

  it('POST /ws/pasteleratest with valid SOAP query should return XML response', async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/">
  <soapenv:Body>
    <ConsultarFacturaRequest>
      <numero_factura>FAC-1001</numero_factura>
    </ConsultarFacturaRequest>
  </soapenv:Body>
</soapenv:Envelope>`;

    const res = await request(app)
      .post('/ws/pasteleratest')
      .set('Content-Type', 'text/xml')
      .send(xml);

    // It should either return 200 (if found) or 404 SOAP Fault (if invoice doesn't exist), but must be XML
    expect([200, 404]).toContain(res.status);
    expect(res.headers['content-type']).toMatch(/xml/);
  });

  it('POST /api/auth/login without credentials should return 400', async () => {
    const res = await request(app).post('/api/auth/login').send({});
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('GET /api/auth/me without Bearer token should return 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('GET /api/tenants/pasteleratest/products should return catalog items', async () => {
    const res = await request(app).get('/api/tenants/pasteleratest/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('PATCH /api/tenants/pasteleratest/products/:productId route testing', async () => {
    const res = await request(app)
      .patch('/api/tenants/pasteleratest/products/1')
      .send({ stock: 50 });
    // If route is missing, it returns 404 "Endpoint not found"
    expect(res.body.error).not.toBe('Endpoint not found');
  });

  it('DELETE /api/tenants/pasteleratest/products/:productId route testing', async () => {
    const res = await request(app)
      .delete('/api/tenants/pasteleratest/products/999999');
    // If route is missing, it returns 404 "Endpoint not found"
    expect(res.body.error).not.toBe('Endpoint not found');
  });

  it('GET /api/tenants/pasteleratest/invoices should return invoices list or pagination', async () => {
    const res = await request(app).get('/api/tenants/pasteleratest/invoices?paginated=true');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('invoices');
    expect(Array.isArray(res.body.invoices)).toBe(true);
  });

  it('GET /api/tenants/pasteleratest/metrics should return billing metrics', async () => {
    const res = await request(app).get('/api/tenants/pasteleratest/metrics');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total_ventas');
    expect(res.body).toHaveProperty('total_comprobantes');
  });
});
