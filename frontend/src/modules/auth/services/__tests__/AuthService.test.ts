// @vitest-environment happy-dom
// Tests del servicio de autenticación (frontend)
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock de fetchAuth  
vi.mock('../../../../shared/api/fetchAuth', () => ({
  fetchAuth: vi.fn(),
}));

// Importar DESPUÉS de los mocks
import * as AuthService from '../AuthService';
import { fetchAuth } from '../../../../shared/api/fetchAuth';

const mockedFetchAuth = vi.mocked(fetchAuth);
const mockFetch = vi.fn();

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Usar vi.stubGlobal en vez de global.fetch para evitar errores de tipo
    vi.stubGlobal('fetch', mockFetch);
  });

  describe('login', () => {
    it('debería enviar credenciales y retornar LoginResponse', async () => {
      const mockResponse = {
        usuario: 'jperez',
        primerNombre: 'Juan',
        segundoNombre: null,
        primerApellido: 'Pérez',
        segundoApellido: null,
        nombreCompleto: 'Juan Pérez',
        roles: ['programador'],
        plantas: ['PF1', 'PF3'],
        tieneCI: false,
        token: 'jwt-token-123',
        expiresAt: Date.now() + 28800000,
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await AuthService.login({ usuario: 'jperez', contrasena: 'pass123' });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/auth/login'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ usuario: 'jperez', contrasena: 'pass123' }),
        })
      );
      expect(result.token).toBe('jwt-token-123');
      expect(result.usuario).toBe('jperez');
      expect(result.plantas).toEqual(['PF1', 'PF3']);
    });

    it('debería lanzar error si las credenciales son inválidas', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Usuario o contraseña incorrectos' }),
      } as Response);

      await expect(
        AuthService.login({ usuario: 'wrong', contrasena: 'wrong' })
      ).rejects.toThrow('Usuario o contraseña incorrectos');
    });

    it('debería usar fetch directo sin fetchAuth', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ token: 'abc', expiresAt: 0 }),
      } as Response);

      await AuthService.login({ usuario: 'test', contrasena: 'test' });

      expect(mockFetch).toHaveBeenCalled();
      expect(mockedFetchAuth).not.toHaveBeenCalled();
    });
  });

  describe('getIndicadores', () => {
    it('debería obtener indicadores usando fetchAuth', async () => {
      const mockIndicadores = {
        contadores: { totalOTs: 100, totalTecnicos: 25, totalFallas: 10, totalActivos: 50, plantasActivas: 6 },
        ultimasFallas: [],
        otsPorEstado: [],
        tecnicosPorPlanta: [],
      };

      mockedFetchAuth.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockIndicadores),
      } as Response);

      const result = await AuthService.getIndicadores();

      expect(mockedFetchAuth).toHaveBeenCalledWith(expect.stringContaining('/auth/indicadores'));
      expect(result.contadores.totalOTs).toBe(100);
    });

    it('debería lanzar error si la respuesta no es ok', async () => {
      mockedFetchAuth.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'No autorizado' }),
      } as Response);

      await expect(AuthService.getIndicadores()).rejects.toThrow('Error obteniendo indicadores');
    });
  });

  describe('verifyToken', () => {
    it('debería verificar el token usando fetchAuth', async () => {
      mockedFetchAuth.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ valid: true, usuario: 'jperez' }),
      } as Response);

      const result = await AuthService.verifyToken();

      expect(mockedFetchAuth).toHaveBeenCalledWith(expect.stringContaining('/auth/verify'));
      expect(result.valid).toBe(true);
    });

    it('debería lanzar error si el token no es válido', async () => {
      mockedFetchAuth.mockResolvedValue({ ok: false } as Response);

      await expect(AuthService.verifyToken()).rejects.toThrow('Token inválido');
    });
  });
});
