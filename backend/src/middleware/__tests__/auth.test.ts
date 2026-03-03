// Tests del middleware de autenticación JWT y validación de planta (backend)
// Configurar JWT_SECRET antes de importar los módulos

import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import { authMiddleware, plantaMiddleware, generateToken, verificarAccesoPlanta } from '../auth.js';
import type { Request, Response, NextFunction } from 'express';

// Definir secret para los tests
const JWT_SECRET = 'test-secret-key-123';
process.env.JWT_SECRET = JWT_SECRET;

// Helper para crear mocks de Express
const createMockReqRes = (overrides: Partial<Request> = {}) => {
  const req = {
    headers: {},
    query: {},
    params: {},
    body: {},
    ...overrides,
  } as unknown as Request;

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response;

  const next = vi.fn() as NextFunction;

  return { req, res, next };
};

describe('authMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería retornar 401 si no hay header Authorization', () => {
    const { req, res, next } = createMockReqRes();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'NO_TOKEN' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('debería retornar 401 si el formato del token es inválido', () => {
    const { req, res, next } = createMockReqRes({
      headers: { authorization: 'InvalidFormat token123' } as any,
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'INVALID_FORMAT' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('debería retornar 401 si solo dice Bearer sin token', () => {
    const { req, res, next } = createMockReqRes({
      headers: { authorization: 'Bearer' } as any,
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it('debería retornar 403 si el token es inválido', () => {
    const { req, res, next } = createMockReqRes({
      headers: { authorization: 'Bearer token-falso-123' } as any,
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'INVALID_TOKEN' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('debería retornar 401 si el token ha expirado', () => {
    // Crear un token que ya expiró
    const expiredToken = jwt.sign(
      { usuario: 'test', roles: ['programador'], plantas: ['PF1'], nombreCompleto: 'Test' },
      JWT_SECRET!,
      { expiresIn: '-1s' } // expirado hace 1 segundo
    );

    const { req, res, next } = createMockReqRes({
      headers: { authorization: `Bearer ${expiredToken}` } as any,
    });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'TOKEN_EXPIRED' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('debería llamar next() y adjuntar authUser si el token es válido', () => {
    const payload = {
      usuario: 'jperez',
      roles: ['programador'],
      plantas: ['PF1', 'PF3'],
      nombreCompleto: 'Juan Pérez',
    };

    const validToken = generateToken(payload);

    const { req, res, next } = createMockReqRes({
      headers: { authorization: `Bearer ${validToken}` } as any,
    });

    authMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.authUser).toBeDefined();
    expect(req.authUser?.usuario).toBe('jperez');
    expect(req.authUser?.roles).toEqual(['programador']);
    expect(req.authUser?.plantas).toEqual(['PF1', 'PF3']);
  });
});

describe('generateToken', () => {
  it('debería generar un token JWT válido', () => {
    const payload = {
      usuario: 'admin',
      roles: ['supervisor'],
      plantas: ['PF1', 'PF2'],
      nombreCompleto: 'Admin User',
    };

    const token = generateToken(payload);

    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3); // JWT tiene 3 partes

    const decoded = jwt.verify(token, JWT_SECRET!) as any;
    expect(decoded.usuario).toBe('admin');
    expect(decoded.roles).toEqual(['supervisor']);
    expect(decoded.plantas).toEqual(['PF1', 'PF2']);
    expect(decoded.exp).toBeDefined();
  });
});

describe('plantaMiddleware', () => {
  const mockAuthUser = {
    usuario: 'test',
    roles: ['programador'],
    plantas: ['PF1', 'PF3', 'CDT'],
    nombreCompleto: 'Test User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería continuar si no se especificó planta', () => {
    const { req, res, next } = createMockReqRes();
    req.authUser = mockAuthUser;

    plantaMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('debería continuar si la planta es "TODAS"', () => {
    const { req, res, next } = createMockReqRes({ query: { planta: 'TODAS' } as any });
    req.authUser = mockAuthUser;

    plantaMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('debería continuar si la planta es "CONSOLIDADO"', () => {
    const { req, res, next } = createMockReqRes({ query: { planta: 'CONSOLIDADO' } as any });
    req.authUser = mockAuthUser;

    plantaMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('debería continuar si la planta es "CI"', () => {
    const { req, res, next } = createMockReqRes({ query: { planta: 'CI' } as any });
    req.authUser = mockAuthUser;

    plantaMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });

  it('debería continuar si el usuario tiene acceso a la planta', () => {
    const { req, res, next } = createMockReqRes({ query: { planta: 'PF1' } as any });
    req.authUser = mockAuthUser;

    plantaMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('debería retornar 403 si el usuario NO tiene acceso a la planta', () => {
    const { req, res, next } = createMockReqRes({ query: { planta: 'PF5' } as any });
    req.authUser = mockAuthUser;

    plantaMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'PLANTA_NO_AUTORIZADA' })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('debería leer planta desde body si no está en query', () => {
    const { req, res, next } = createMockReqRes({ body: { planta: 'PF3' } });
    req.authUser = mockAuthUser;

    plantaMiddleware(req, res, next);

    expect(next).toHaveBeenCalled();
  });
});

describe('verificarAccesoPlanta', () => {
  it('debería retornar true para planta vacía', () => {
    const { req } = createMockReqRes();
    req.authUser = { usuario: 'test', roles: [], plantas: ['PF1'], nombreCompleto: '' };

    expect(verificarAccesoPlanta(req, '')).toBe(true);
  });

  it('debería retornar true para TODAS', () => {
    const { req } = createMockReqRes();
    req.authUser = { usuario: 'test', roles: [], plantas: ['PF1'], nombreCompleto: '' };

    expect(verificarAccesoPlanta(req, 'TODAS')).toBe(true);
  });

  it('debería retornar true si tiene la planta', () => {
    const { req } = createMockReqRes();
    req.authUser = { usuario: 'test', roles: [], plantas: ['PF1', 'PF3'], nombreCompleto: '' };

    expect(verificarAccesoPlanta(req, 'PF1')).toBe(true);
  });

  it('debería retornar false si no tiene la planta', () => {
    const { req } = createMockReqRes();
    req.authUser = { usuario: 'test', roles: [], plantas: ['PF1'], nombreCompleto: '' };

    expect(verificarAccesoPlanta(req, 'PF5')).toBe(false);
  });
});
