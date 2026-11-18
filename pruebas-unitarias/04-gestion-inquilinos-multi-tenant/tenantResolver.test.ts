import { describe, it, expect, vi } from 'vitest';

// Mock del servicio de base de datos de tenants
vi.mock('../../src/services/tenantService.js', () => ({
  getTenantById: vi.fn().mockImplementation((id: string) => {
    if (id === 'pasteleriatest' || id === 'tortas') {
      return Promise.resolve({
        id,
        nombre: 'Pastelería Test',
        schema_name: `tenant_${id}`,
        brand_color: '#F97316'
      });
    }
    return Promise.resolve(null);
  })
}));

import { tenantResolver } from '../../src/middlewares/tenantResolver.js';

describe('Unidad: Resolución Multi-Inquilino (tenantResolver Middleware)', () => {
  function createMockContext(options: {
    params?: Record<string, string>;
    headers?: Record<string, string>;
    query?: Record<string, string>;
    host?: string;
  }) {
    const req: any = {
      params: options.params || {},
      headers: options.headers || {},
      query: options.query || {},
      get: (header: string) => {
        if (header.toLowerCase() === 'host') return options.host || null;
        return options.headers?.[header.toLowerCase()] || null;
      }
    };

    const res: any = {
      statusCode: 200,
      sentType: '',
      sentBody: '',
      status: vi.fn().mockImplementation(function (this: any, code: number) {
        this.statusCode = code;
        return this;
      }),
      type: vi.fn().mockImplementation(function (this: any, t: string) {
        this.sentType = t;
        return this;
      }),
      send: vi.fn().mockImplementation(function (this: any, body: string) {
        this.sentBody = body;
        return this;
      })
    };

    const next = vi.fn();
    return { req, res, next };
  }

  it('11. tenantResolver debe resolver inquilino mediante parámetro de ruta (:tenantId)', async () => {
    const { req, res, next } = createMockContext({ params: { tenantId: 'pasteleriatest' } });

    await tenantResolver(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.tenant).toBeDefined();
    expect(req.tenant.id).toBe('pasteleriatest');
    expect(res.status).not.toHaveBeenCalled();
  });

  it('12. tenantResolver debe resolver inquilino mediante header HTTP x-tenant-id', async () => {
    const { req, res, next } = createMockContext({ headers: { 'x-tenant-id': 'tortas' } });

    await tenantResolver(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.tenant.id).toBe('tortas');
  });

  it('13. tenantResolver debe resolver inquilino mediante subdominio DNS (Host header)', async () => {
    const { req, res, next } = createMockContext({ host: 'tortas.taskmaster-pos.com' });

    await tenantResolver(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.tenant.id).toBe('tortas');
  });

  it('14. tenantResolver debe responder SOAP Fault 404 si no se proporciona ningún identificador', async () => {
    const { req, res, next } = createMockContext({ host: 'localhost:8080' });

    await tenantResolver(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.sentType).toContain('xml');
    expect(res.sentBody).toContain('<faultcode>soap:Client</faultcode>');
    expect(res.sentBody).toContain('Missing Tenant Identifier');
  });

  it('15. tenantResolver debe responder SOAP Fault 404 si el inquilino no existe en la base de datos', async () => {
    const { req, res, next } = createMockContext({ params: { tenantId: 'inexistente_999' } });

    await tenantResolver(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.sentBody).toContain("Tenant 'inexistente_999' not found");
  });
});
