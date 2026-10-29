import { describe, it, expect, vi } from 'vitest';
import jwt from 'jsonwebtoken';
import { signJwt, authenticateJwt, AuthenticatedRequest } from '../../src/middlewares/auth.middleware.js';
import { Response, NextFunction } from 'express';

describe('Unidad: Autenticación JWT y Middleware de Seguridad', () => {
  const dummyPayload = {
    userId: 42,
    email: 'admin@pasteleria.com',
    nombre: 'Carlos Admin',
    role: 'admin',
    tenantId: 'pasteleriatest',
    schemaName: 'tenant_pasteleratest'
  };

  /**
   * Helper para simular objetos req, res y next de Express sin servidor HTTP
   */
  function createMockContext(authHeader?: string) {
    const req = {
      headers: authHeader ? { authorization: authHeader } : {}
    } as AuthenticatedRequest;

    const res = {
      statusCode: 200,
      body: null as any,
      status: vi.fn().mockImplementation(function (this: any, code: number) {
        this.statusCode = code;
        return this;
      }),
      json: vi.fn().mockImplementation(function (this: any, data: any) {
        this.body = data;
        return this;
      })
    } as unknown as Response & { statusCode: number; body: any };

    const next = vi.fn() as NextFunction;

    return { req, res, next };
  }

  it('1. signJwt debe generar un token JWT válido con payload íntegro', () => {
    const token = signJwt(dummyPayload, '1h');
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // Formato Header.Payload.Signature

    const decoded = jwt.decode(token) as any;
    expect(decoded.userId).toBe(dummyPayload.userId);
    expect(decoded.email).toBe(dummyPayload.email);
    expect(decoded.tenantId).toBe(dummyPayload.tenantId);
    expect(decoded.role).toBe(dummyPayload.role);
  });

  it('2. authenticateJwt debe autorizar y adjuntar req.user ante un token válido', () => {
    const token = signJwt(dummyPayload, '2h');
    const { req, res, next } = createMockContext(`Bearer ${token}`);

    authenticateJwt(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBeDefined();
    expect(req.user?.email).toBe(dummyPayload.email);
    expect(req.user?.tenantId).toBe(dummyPayload.tenantId);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('3. authenticateJwt debe retornar 401 si falta el header Authorization', () => {
    const { req, res, next } = createMockContext(undefined);

    authenticateJwt(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('Acceso no autorizado');
  });

  it('4. authenticateJwt debe retornar 401 si el formato no inicia con Bearer', () => {
    const { req, res, next } = createMockContext('Basic dXNlcjpwYXNz');

    authenticateJwt(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body.error).toContain('Bearer Token');
  });

  it('5. authenticateJwt debe retornar 403 ante un token manipulado o firma inválida', () => {
    const invalidToken = jwt.sign(dummyPayload, 'clave_secreta_falsa_hack');
    const { req, res, next } = createMockContext(`Bearer ${invalidToken}`);

    authenticateJwt(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.body.error).toContain('inválido o manipulado');
  });

  it('6. authenticateJwt debe retornar 401 con mensaje específico ante un token expirado', () => {
    // Generar token expirado inmediatamente
    const expiredToken = signJwt(dummyPayload, '-1s');
    const { req, res, next } = createMockContext(`Bearer ${expiredToken}`);

    authenticateJwt(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.body.error).toContain('La sesión ha expirado');
  });
});
