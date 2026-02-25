// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSeguimientoData } from '../useSeguimientoData';
import * as SeguimientoService from '../../services/SeguimientoService';

// 1. Mock de los servicios incluyendo el nuevo endpoint de analítica
vi.mock('../../services/SeguimientoService', () => ({
  getPedidos: vi.fn(),
  getAnalytics: vi.fn(),
}));

// Helper para crear OTs de prueba
// const createMockOT = (overrides: Partial<AtrasoRow>): AtrasoRow => ({
//   ot: '1000',
//   descripcion: 'OT DE PRUEBA',
//   planta: 'PF1',
//   estado: 'Liberado',
//   clasificacion: 'PROGRAMADOR',
//   periodo: 'FEB-26',
//   semana: '2026-S05',
//   esOB: false,
//   detallesTecnicos: [],
//   ...overrides
// });


describe('useSeguimientoData Hook', () => {
  // Tipamos los mocks para usar mockResolvedValue con seguridad
  const mockedGetPedidos = vi.mocked(SeguimientoService.getPedidos);
  // const mockedGetAnalytics = vi.mocked(SeguimientoService.getAnalytics);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // it('debería inicializarse con estados vacíos y sin carga', () => {
  //   const { result } = renderHook(() => useSeguimientoData());

  //   expect(result.current.dataActual).toEqual([]);
  //   expect(result.current.reporteActual).toBe("");
  //   expect(result.current.isLoading).toBe(false);
  // });

  // it('debería cargar el reporte y pedir analítica si hay comparación activa', async () => {
  //   const { result } = renderHook(() => useSeguimientoData());

  //   const mockDataAct = [createMockOT({ ot: 'OT-ACTUAL', semana: '2026-S05' })];
  //   const mockDataAnt = [createMockOT({ ot: 'OT-VIEJA', semana: '2026-S04' })];

  //   const mockFlowStats: BacklogStats = {
  //     nuevas: [], finalizadas: [], sinCambios: [], conAvance: [], desaparecidas: []
  //   };

  //   // Simulamos las respuestas del backend
  //   mockedGetPedidos.mockResolvedValueOnce(mockDataAct); // Para dataActual
  //   mockedGetPedidos.mockResolvedValueOnce(mockDataAnt); // Para dataAnterior (si aplica)
  //   mockedGetAnalytics.mockResolvedValue({ flowStats: mockFlowStats, techStats: [], metadata: {} });

  //   // Ejecutamos primero la selección de semana a comparar para que cargarReporte la vea
  //   await act(async () => {
  //     await result.current.cambiarComparacion('2026-S04');
  //   });

  //   await act(async () => {
  //     await result.current.cargarReporte('2026-S05');
  //   });

  //   expect(result.current.reporteActual).toBe('2026-S05');
  //   expect(result.current.dataActual).toEqual(mockDataAct);

  //   // Verificamos que se llamó a la analítica en el servidor
  //   expect(mockedGetAnalytics).toHaveBeenCalledWith('2026-S05', '2026-S04');
  //   expect(result.current.serverStats.flowStats).toEqual(mockFlowStats);
  // });

  it('debería limpiar la comparación correctamente', async () => {
    const { result } = renderHook(() => useSeguimientoData());

    act(() => {
      result.current.limpiarComparacion();
    });

    expect(result.current.semanaComparar).toBe("");
    expect(result.current.dataAnterior).toEqual([]);
    expect(result.current.serverStats.flowStats).toBeNull();
  });

  it('debería manejar errores del servidor sin romper el estado', async () => {
    const { result } = renderHook(() => useSeguimientoData());

    // Forzamos un error en la API
    mockedGetPedidos.mockRejectedValue(new Error("Timeout en Postgres"));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    await act(async () => {
      await result.current.cargarDatos();
    });

    expect(result.current.isLoading).toBe(false);
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});