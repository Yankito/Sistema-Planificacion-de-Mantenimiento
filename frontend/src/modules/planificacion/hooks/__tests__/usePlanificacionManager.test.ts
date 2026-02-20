import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePlanificacionManager } from '../usePlanificacionManager';
import * as PlanificacionService from '../../services/PlanificacionService';
import type { ProcesoExcelResponse, PlanResult } from '../../types';

// --- MOCKS ---
vi.mock('../../services/PlanificacionService', () => ({
  ejecutarPlanificacionRemota: vi.fn(), // Cambiado al nuevo método
  getHorarios: vi.fn(),
  actualizarTurnoTecnico: vi.fn(),
  guardarPlanificacion: vi.fn(),
  getResultadosPlanificacion: vi.fn(),
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
      await result.current.ejecutarPlanificacion('STRICT', '2026-02');
    });

    expect(mockedEjecutar).toHaveBeenCalledWith('STRICT', '2026-02', 'PF3');
    expect(result.current.planResult).toHaveLength(1);
    expect(result.current.tecnicosMap.has("JUAN")).toBe(true);
  });

  it('debería cargar horarios de Oracle cuando cambia la planta', async () => {
    mockedGetHorarios.mockResolvedValue({ data: [{ nombre: 'JUAN', turnos: ['M'], rol: 'Mecánico', planta: 'PF3' }] });

    const { result } = renderHook(() => usePlanificacionManager());

    // Simulamos que ya hay una semana cargada para disparar el useEffect
    await act(async () => {
      result.current.setMesSeleccionado('2026-02');
      result.current.setPlanResult([{ mes: '2026-02' }] as PlanResult[]);
      result.current.setPlantaHorarios('PF4');
    });

    expect(mockedGetHorarios).toHaveBeenCalledWith('2026-02', 'PF4');
  });
});