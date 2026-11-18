import { describe, it, expect } from 'vitest';
import request from 'supertest';
import express from 'express';
import authRoutes from '../../src/routes/authRoutes.js';

describe('Unidad: Validaciones de Registro y Autenticación (Auth Endpoints)', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);

  it('1. Debe rechazar el registro de inquilino si falta el nombre de negocio (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register-tenant')
      .send({ email: 'test@negocio.com', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('nombre del negocio es obligatorio');
  });

  it('2. Debe rechazar el registro si el correo electrónico es inválido (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register-tenant')
      .send({ businessName: 'Panadería Test', email: 'correo-sin-arroba', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('correo electrónico válido');
  });

  it('3. Debe rechazar contraseñas cortas menores a 6 caracteres (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register-tenant')
      .send({ businessName: 'Panadería Test', email: 'admin@pan.com', password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('al menos 6 caracteres');
  });

  it('4. Debe rechazar identificadores/slugs con caracteres no permitidos o longitud menor a 2 (400)', async () => {
    const res = await request(app)
      .post('/api/auth/register-tenant')
      .send({ businessName: 'P', slug: '!', email: 'admin@pan.com', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('entre 2 y 30 caracteres');
  });

  it('5. Debe rechazar login sin email o contraseña (400)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('obligatorios');
  });
});
