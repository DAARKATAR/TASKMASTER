import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { soapSecurity } from '../src/middlewares/soapSecurity.js';

describe('SOAP Security & XXE Protection Middleware', () => {
  const app = express();
  app.use(express.text({ type: ['text/xml', 'application/xml'] }));

  app.post('/test-soap', soapSecurity, (req: any, res) => {
    res.json({ action: req.soap.action, params: req.soap.params });
  });

  it('debe rechazar peticiones vacías con SOAP Fault 400', async () => {
    const res = await request(app)
      .post('/test-soap')
      .set('Content-Type', 'text/xml')
      .send('');
    expect(res.status).toBe(400);
    expect(res.text).toContain('Empty SOAP Request');
  });

  it('debe mitigar y rechazar ataques XXE que contengan DOCTYPE', async () => {
    const maliciousXml = `<?xml version="1.0"?>
    <!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body><test>&xxe;</test></soap:Body>
    </soap:Envelope>`;

    const res = await request(app)
      .post('/test-soap')
      .set('Content-Type', 'text/xml')
      .send(maliciousXml);

    expect(res.status).toBe(400);
    expect(res.text).toContain('Security Violation: XXE Detected');
  });

  it('debe parsear correctamente un payload SOAP válido', async () => {
    const validXml = `<?xml version="1.0"?>
    <soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
      <soap:Body>
        <ConsultarFacturaRequest>
          <numeroFactura>FAC-1001</numeroFactura>
        </ConsultarFacturaRequest>
      </soap:Body>
    </soap:Envelope>`;

    const res = await request(app)
      .post('/test-soap')
      .set('Content-Type', 'text/xml')
      .send(validXml);

    expect(res.status).toBe(200);
    expect(res.body.action).toBe('ConsultarFactura');
    expect(res.body.params.numeroFactura).toBe('FAC-1001');
  });
});
