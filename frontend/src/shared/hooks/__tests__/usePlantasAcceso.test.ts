// @vitest-environment happy-dom
// Tests del hook usePlantasAcceso
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { usePlantasAcceso } from '../usePlantasAcceso';

// Mock de useAuth
const mockUser = {
  usuario: 'test',
  primerNombre: 'Test',
  segundoNombre: null,
  primerApellido: 'User',
  segundoApellido: null,
  nombreCompleto: 'Test User',
  roles: ['programador'],
  plantas: [] as string[],
  tieneCI: false,
};

vi.mock('../../../context/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
    token: 'fake-token',
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    sessionExpiresAt: Date.now() + 28800000,
  })),
}));

describe('usePlantasAcceso', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('con usuario supervisor (todas las plantas)', () => {
    beforeEach(() => {
      mockUser.plantas = ['PF1', 'PF2', 'PF3', 'PF4', 'PF5', 'PF6', 'CDT', 'MPS', 'OTROS', 'DC', 'VENTAS'];
    });

    it('debería retornar todas las plantas individuales', () => {
      const { result } = renderHook(() => usePlantasAcceso());

      expect(result.current.plantasIndividuales).toEqual(
        ['PF1', 'PF2', 'PF3', 'PF4', 'PF5', 'PF6', 'CDT', 'MPS', 'OTROS', 'DC', 'VENTAS']
      );
    });

    it('debería retornar todas las plantas del complejo', () => {
      const { result } = renderHook(() => usePlantasAcceso());

      expect(result.current.plantasComplejo).toEqual(
        ['PF3', 'PF4', 'PF5', 'PF6', 'CDT', 'OTROS', 'DC', 'VENTAS']
      );
    });

    it('debería retornar PF Alimentos completo', () => {
      const { result } = renderHook(() => usePlantasAcceso());

      expect(result.current.plantasPFAlimentos).toEqual(
        ['PF1', 'PF2', 'PF3', 'PF4', 'PF5', 'PF6', 'CDT', 'OTROS', 'DC', 'VENTAS']
      );
    });

    it('debería incluir CI en plantasPlanificacion si tiene todas las plantas CI', () => {
      const { result } = renderHook(() => usePlantasAcceso());

      expect(result.current.plantasPlanificacion).toContain('CI');
    });

    it('plantaDefault debería ser PF1', () => {
      const { result } = renderHook(() => usePlantasAcceso());

      expect(result.current.plantaDefault).toBe('PF1');
    });

    it('tieneAcceso debería retornar true para cualquier planta', () => {
      const { result } = renderHook(() => usePlantasAcceso());

      expect(result.current.tieneAcceso('PF1')).toBe(true);
      expect(result.current.tieneAcceso('PF6')).toBe(true);
      expect(result.current.tieneAcceso('CI')).toBe(true);
      expect(result.current.tieneAcceso('TODAS')).toBe(true);
    });
  });

  describe('con usuario programador (solo algunas plantas)', () => {
    beforeEach(() => {
      mockUser.plantas = ['PF1', 'PF3'];
    });

    it('debería filtrar solo plantas asignadas', () => {
      const { result } = renderHook(() => usePlantasAcceso());

      expect(result.current.plantasIndividuales).toEqual(['PF1', 'PF3']);
    });

    it('plantasComplejo solo debería tener PF3', () => {
      const { result } = renderHook(() => usePlantasAcceso());

      expect(result.current.plantasComplejo).toEqual(['PF3']);
    });

    it('NO debería incluir CI en plantasPlanificacion (no tiene todas las CI)', () => {
      const { result } = renderHook(() => usePlantasAcceso());

      expect(result.current.plantasPlanificacion).not.toContain('CI');
      expect(result.current.plantasPlanificacion).toEqual(['PF1', 'PF3']);
    });

    it('plantaDefault debería ser PF1', () => {
      const { result } = renderHook(() => usePlantasAcceso());

      expect(result.current.plantaDefault).toBe('PF1');
    });

    it('tieneAcceso debería retornar false para plantas no asignadas', () => {
      const { result } = renderHook(() => usePlantasAcceso());

      expect(result.current.tieneAcceso('PF1')).toBe(true);
      expect(result.current.tieneAcceso('PF5')).toBe(false);
      expect(result.current.tieneAcceso('CI')).toBe(false);
    });

    it('filtrarPlantas debería filtrar una lista externa', () => {
      const { result } = renderHook(() => usePlantasAcceso());

      const filtradas = result.current.filtrarPlantas(['PF1', 'PF2', 'PF3', 'PF4']);
      expect(filtradas).toEqual(['PF1', 'PF3']);
    });
  });

  describe('con usuario sin plantas', () => {
    beforeEach(() => {
      mockUser.plantas = [];
    });

    it('debería retornar listas vacías', () => {
      const { result } = renderHook(() => usePlantasAcceso());

      expect(result.current.plantasIndividuales).toEqual([]);
      expect(result.current.plantasComplejo).toEqual([]);
      expect(result.current.plantasPFAlimentos).toEqual([]);
    });

    it('plantaDefault debería ser PF1 como fallback', () => {
      const { result } = renderHook(() => usePlantasAcceso());

      expect(result.current.plantaDefault).toBe('PF1');
    });

    it('filtrarPlantas debería retornar vacío', () => {
      const { result } = renderHook(() => usePlantasAcceso());

      expect(result.current.filtrarPlantas(['PF1', 'PF2'])).toEqual([]);
    });

    it('tieneAcceso debería retornar false excepto para TODAS/CONSOLIDADO', () => {
      const { result } = renderHook(() => usePlantasAcceso());

      expect(result.current.tieneAcceso('PF1')).toBe(false);
      expect(result.current.tieneAcceso('TODAS')).toBe(true);
      expect(result.current.tieneAcceso('CONSOLIDADO')).toBe(true);
    });
  });

  describe('con plantas CI completas', () => {
    beforeEach(() => {
      // Solo tiene las 6 plantas del CI, no PF1/PF2
      mockUser.plantas = ['PF3', 'PF4', 'PF5', 'PF6', 'CDT', 'OTROS'];
    });

    it('debería incluir CI en planificación', () => {
      const { result } = renderHook(() => usePlantasAcceso());

      expect(result.current.plantasPlanificacion).toContain('CI');
      expect(result.current.tieneAcceso('CI')).toBe(true);
    });

    it('NO debería incluir PF1 ni PF2', () => {
      const { result } = renderHook(() => usePlantasAcceso());

      expect(result.current.plantasIndividuales).not.toContain('PF1');
      expect(result.current.plantasIndividuales).not.toContain('PF2');
    });
  });
});
