// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileProcessor } from '../useFileProcessor';
import * as SeguimientoService from '../../shared/services/SeguimientoService';
import * as FallasService from '../../shared/services/FallasService';
import type { FallaRow } from '../../modules/fallas/types';

// 1. Mocks de los servicios
vi.mock("../../shared/services/SeguimientoService");
vi.mock("../../shared/services/FallasService");

// 2. Factory para Fallas (Evita el 'as any')
const createMockFalla = (overrides: Partial<FallaRow>): FallaRow => ({
  fecha: new Date(),
  anio: 2026,
  mes: 1,
  semana: 5,
  planta: 'PF1',
  area: 'PRODUCCION',
  linea: 'LINEA 1',
  equipo: 'EQUIPO TEST',
  causa: 'FALLA ELECTRICA',
  duracionMinutos: 10,
  gasto: 1000,
  perdidaKg: 50,
  descripcionOperador: 'TEST',
  estadoPedido: '',
  tipoPedido: '',
  tecnico: '',
  ...overrides
});

describe('useFileProcessor Hook - Tipado Estricto', () => {
  const mockActions = {
    onPlanLoaded: vi.fn(),
    onSeguimientoLoaded: vi.fn(),
    onFallasLoaded: vi.fn(),
    setActiveTab: vi.fn(),
    targetWeek: '2026-S05'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('alert', vi.fn());
    
    // Tipamos los retornos de los mocks globalmente
    vi.mocked(SeguimientoService.uploadExcel).mockResolvedValue({ 
      actual: [], anterior: [], activos: [] 
    });
    vi.mocked(FallasService.uploadFallas).mockResolvedValue([]);
  });

  it('debería procesar FALLAS con datos 100% tipados', async () => {
    const { result } = renderHook(() => useFileProcessor(mockActions));
    
    // Creamos data real basada en la interfaz FallaRow
    const mockResponseFallas: FallaRow[] = [
      createMockFalla({ equipo: 'Compresor Tornillo', gasto: 125000 })
    ];
    
    // Ya no necesitas 'as any' porque mockResponseFallas cumple con la interfaz
    vi.mocked(FallasService.uploadFallas).mockResolvedValue(mockResponseFallas);

    const file = new File([''], 'fallas.xlsx');
    const event = { 
      target: { files: [file], value: 'fallas.xlsx' } 
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileUpload(event, 'FALLAS');
    });

    expect(FallasService.uploadFallas).toHaveBeenCalledWith(file);
    expect(mockActions.onFallasLoaded).toHaveBeenCalledWith(mockResponseFallas);
    expect(result.current.loading.fallas).toBe(false);
  });

  it('debería resetear el input después de un error del servidor', async () => {
    vi.mocked(SeguimientoService.uploadExcel).mockRejectedValue(new Error("Error de Red"));
    
    const { result } = renderHook(() => useFileProcessor(mockActions));
    const file = new File([''], 'test.xlsx');
    const event = { 
      target: { files: [file], value: 'archivo_con_error.xlsx' } 
    } as unknown as React.ChangeEvent<HTMLInputElement>;

    await act(async () => {
      await result.current.handleFileUpload(event, 'SEGUIMIENTO');
    });

    // Verificamos que aunque falló, el input se limpió para re-intentar
    expect(event.target.value).toBe("");
    expect(window.alert).toHaveBeenCalledWith("Error de Red");
  });
});