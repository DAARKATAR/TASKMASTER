import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import { globalErrorHandler } from '../src/middlewares/errorHandler.middleware.js';

describe('Global Error Handler Content-Negotiation', () => {
  const app = express();
  app.use(express.json());

  // Ruta REST simulando error
  app.get('/api/test-error', (req, res, next) => {
    next(new Error('Fallo simulado en endpoint REST'));
  });

  // Ruta SOAP simulando error
  app.post('/ws/test-error', (req, res, next) => {
    next(new Error('Fallo simulado en endpoint SOAP'));
  });

  app.use(globalErrorHandler);

  it('debe responder con JSON estructurado ante un error en rutas /api', async () => {
    const res = await request(app).get('/api/test-error');
    expect(res.status).toBe(500);
    expect(res.headers['content-type']).toMatch(/json/);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Fallo simulado en endpoint REST');
  });

  it('debe responder con XML SOAP Fault ante un error en rutas /ws', async () => {
    const res = await request(app).post('/ws/test-error');
    expect(res.status).toBe(500);
    expect(res.headers['content-type']).toMatch(/xml/);
    expect(res.text).toContain('<soap:Fault>');
    expect(res.text).toContain('Fallo simulado en endpoint SOAP');
  });
});
