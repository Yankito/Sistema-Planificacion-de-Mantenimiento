import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlanificacionManager } from '../usePlanificacionManager';
import * as PlanificacionService from '../../services/PlanificacionService';
import type { ProcesoExcelResponse } from '../../types';

// --- MOCKS ---
vi.mock('../../services/PlanificacionService', () => ({
  ejecutarPlanificacionRemota: vi.fn(), // Cambiado al nuevo método
  getHorarios: vi.fn(),
  actualizarTurnoTecnico: vi.fn(),
  guardarPlanificacion: vi.fn(),
  getResultadosPlanificacion: vi.fn(),
}));

vi.mock('../../../../context/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: {
      usuario: 'testuser',
      roles: ['supervisor'],
      plantas: ['PF1', 'PF2', 'PF3', 'PF4', 'PF5', 'PF6', 'CDT', 'OTROS'],
      nombreCompleto: 'Test User',
      primerNombre: 'Test',
      primerApellido: 'User',
      tieneCI: true,
    },
    token: 'fake-token',
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    sessionExpiresAt: Date.now() + 8 * 60 * 60 * 1000,
  })),
}));


vi.mock('../../../../shared/hooks/usePlantasAcceso', () => ({
  usePlantasAcceso: () => ({
    plantaDefault: 'PF3',
    plantasPlanificacion: ['PF3', 'PF4']
  })
}));

describe('usePlanificacionManager', () => {
  const mockedEjecutar = vi.mocked(PlanificacionService.ejecutarPlanificacionRemota);
  const mockedGetHorarios = vi.mocked(PlanificacionService.getHorarios);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debería ejecutar planificación remota y actualizar el estado', async () => {
    const mockResponse = {
      resultados: [{ nroOrden: 'OT-100', planta: 'PF3', fechaSugerida: '10/02/2026', tecnicos: [] }],
      sinAsignar: [],
      tecnicosMap: { "JUAN": { nombre: "JUAN", planta: "PF3", rol: "M" } },
      mapaHorarios: { "JUAN": ['M'] }
    };

    mockedEjecutar.mockResolvedValue(mockResponse as unknown as ProcesoExcelResponse);

    const { result } = renderHook(() => usePlanificacionManager());

    await act(async () => {
      await result.current.ejecutarPlanificacion('STRICT', '2026-04');
    });

    expect(mockedEjecutar).toHaveBeenCalledWith('STRICT', 4, 2026, 'PF3');
    expect(result.current.planResult).toHaveLength(1);
    expect(result.current.tecnicosMap.has("JUAN")).toBe(true);
  });

  it('debería cargar horarios de Oracle cuando se invoca cargarHorarios', async () => {
    mockedGetHorarios.mockResolvedValue({ data: [{ nombre: 'JUAN', turnos: ['M'], rol: 'Mecánico', planta: 'PF3' }] });

    const { result } = renderHook(() => usePlanificacionManager());

    await act(async () => {
      // Ahora la carga es EXPLÍCITA, no por efecto
      await result.current.cargarHorarios('2026-01', 'PF4');
    });

    expect(mockedGetHorarios).toHaveBeenCalledWith(1, 2026, 'PF4');
  });
});