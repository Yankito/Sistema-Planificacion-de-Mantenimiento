// @vitest-environment happy-dom
// Tests del helper fetchAuth
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchAuth, setSessionExpiredHandler, getStoredToken } from '../fetchAuth';

const STORAGE_KEY = 'pf_auth_session';
const mockFetch = vi.fn();

describe('fetchAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.stubGlobal('fetch', mockFetch);
    // Reset del handler
    setSessionExpiredHandler(() => { });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  describe('getStoredToken', () => {
    it('debería retornar null si no hay sesión en localStorage', () => {
      expect(getStoredToken()).toBeNull();
    });

    it('debería retornar el token si la sesión es válida', () => {
      const session = {
        token: 'valid-token-123',
        expiresAt: Date.now() + 3600000, // 1 hora en el futuro
        user: { usuario: 'test' },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

      expect(getStoredToken()).toBe('valid-token-123');
    });

    it('debería retornar null y limpiar si la sesión expiró', () => {
      const logoutSpy = vi.fn();
      setSessionExpiredHandler(logoutSpy);

      const session = {
        token: 'expired-token',
        expiresAt: Date.now() - 1000, // expiró hace 1 segundo
        user: { usuario: 'test' },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

      expect(getStoredToken()).toBeNull();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(logoutSpy).toHaveBeenCalled();
    });

    it('debería retornar null si localStorage tiene datos corruptos', () => {
      localStorage.setItem(STORAGE_KEY, 'datos{invalidos');
      expect(getStoredToken()).toBeNull();
    });
  });

  describe('fetchAuth (wrapper)', () => {
    it('debería adjuntar Authorization header automáticamente', async () => {
      const session = {
        token: 'my-jwt-token',
        expiresAt: Date.now() + 3600000,
        user: { usuario: 'test' },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

      mockFetch.mockResolvedValue({
        status: 200,
        ok: true,
        json: () => Promise.resolve({ data: 'ok' }),
      });

      await fetchAuth('http://localhost:3001/api/test');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3001/api/test',
        expect.objectContaining({
          headers: expect.any(Headers),
        })
      );

      // Verificar que el header Authorization está presente
      const callArgs = mockFetch.mock.calls[0];
      const headers = callArgs[1].headers as Headers;
      expect(headers.get('Authorization')).toBe('Bearer my-jwt-token');
    });

    it('debería lanzar error si no hay token', async () => {
      const logoutSpy = vi.fn();
      setSessionExpiredHandler(logoutSpy);

      await expect(fetchAuth('http://localhost:3001/api/test')).rejects.toThrow(
        'No hay sesión activa'
      );
      expect(logoutSpy).toHaveBeenCalled();
    });

    it('debería disparar logout en respuesta 401 con TOKEN_EXPIRED', async () => {
      const logoutSpy = vi.fn();
      setSessionExpiredHandler(logoutSpy);

      const session = {
        token: 'my-token',
        expiresAt: Date.now() + 3600000,
        user: { usuario: 'test' },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

      mockFetch.mockResolvedValue({
        status: 401,
        ok: false,
        clone: () => ({
          json: () => Promise.resolve({ code: 'TOKEN_EXPIRED', error: 'La sesión ha expirado' }),
        }),
      });

      await expect(fetchAuth('http://localhost:3001/api/test')).rejects.toThrow(
        'La sesión ha expirado'
      );
      expect(logoutSpy).toHaveBeenCalled();
    });

    it('debería propagar opciones adicionales (method, body, etc.)', async () => {
      const session = {
        token: 'my-token',
        expiresAt: Date.now() + 3600000,
        user: { usuario: 'test' },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

      mockFetch.mockResolvedValue({
        status: 200,
        ok: true,
        json: () => Promise.resolve({}),
      });

      await fetchAuth('http://localhost:3001/api/test', {
        method: 'POST',
        body: JSON.stringify({ data: 'test' }),
      });

      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[1].method).toBe('POST');
      expect(callArgs[1].body).toBe(JSON.stringify({ data: 'test' }));
    });

    it('debería retornar la respuesta normalmente si status no es 401', async () => {
      const session = {
        token: 'my-token',
        expiresAt: Date.now() + 3600000,
        user: { usuario: 'test' },
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

      const mockRes = {
        status: 200,
        ok: true,
        json: () => Promise.resolve({ result: 'success' }),
      };
      mockFetch.mockResolvedValue(mockRes);

      const result = await fetchAuth('http://localhost:3001/api/test');
      expect(result).toBe(mockRes);
    });
  });

  describe('setSessionExpiredHandler', () => {
    it('debería registrar un handler que se llama al expirar', async () => {
      const handler = vi.fn();
      setSessionExpiredHandler(handler);

      // Forzar expiración al no tener token
      await expect(fetchAuth('http://localhost:3001/api/test')).rejects.toThrow();
      expect(handler).toHaveBeenCalled();
    });
  });
});
