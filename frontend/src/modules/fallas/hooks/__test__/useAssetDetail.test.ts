// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAssetDetail } from '../useAssetDetail';
import { type FallaRow } from '../../types';

// 1. Mock Data Tipado (Eliminamos 'any')
// Usamos un Factory parcial o definimos el objeto completo para cumplir con FallaRow
const mockData: FallaRow[] = [
  { 
    equipo: 'MOTOR_X', semana: 5, gasto: 1000, duracionMinutos: 60, 
    fecha: new Date('2026-02-01'), anio: 2026, planta: 'PF1', area: 'MTTO',
    linea: 'L1', causa: 'ELECTRICA', estadoPedido: 'CERRADA', 
    tipoPedido: 'Correctivo', tecnico: 'Yanko', perdidaKg: 0, mes: 1, descripcionOperador: ''
  },
  { 
    equipo: 'MOTOR_X', semana: 6, gasto: 500, duracionMinutos: 30, 
    fecha: new Date('2026-02-08'), anio: 2026, planta: 'PF1', area: 'MTTO',
    linea: 'L1', causa: 'MECANICA', estadoPedido: 'CERRADA', 
    tipoPedido: 'Correctivo', tecnico: 'Yanko', perdidaKg: 0, mes: 1, descripcionOperador: ''
  },
  { 
    equipo: 'OTRO_EQ', semana: 5, gasto: 9999, duracionMinutos: 999, 
    fecha: new Date('2026-02-01'), anio: 2026, planta: 'DC', area: 'MTTO',
    linea: 'L2', causa: 'OTRO', estadoPedido: 'OPEN', 
    tipoPedido: 'Emergencia', tecnico: 'Admin', perdidaKg: 100, mes: 1, descripcionOperador: ''
  }
];

describe('useAssetDetail Hook', () => {

  it('debería filtrar datos solo del equipo seleccionado ignorando otros', () => {
    const { result } = renderHook(() => useAssetDetail(mockData, 'MOTOR_X'));
    
    // Verificamos que solo tomó los 2 de MOTOR_X
    expect(result.current.tableData).toHaveLength(2);
    expect(result.current.stats.totalGasto).toBe(1500);
    expect(result.current.stats.count).toBe(2);
  });

  it('debería generar la data del gráfico incluyendo el rango de fechas', () => {
    const { result } = renderHook(() => useAssetDetail(mockData, 'MOTOR_X'));
    
    const { chartData } = result.current.timelineData;
    
    const s5 = chartData.find(d => d.semana === 5);
    const s6 = chartData.find(d => d.semana === 6);
    
    expect(s5?.count).toBe(1);
    expect(s6?.count).toBe(1);
    // Verificamos que el helper getRangoSemana funcione internamente
    expect(s5?.rango).toBeDefined(); 
  });

  it('debería realizar un "Drill-down" al seleccionar una semana específica', () => {
    const { result } = renderHook(() => useAssetDetail(mockData, 'MOTOR_X'));

    act(() => {
        result.current.setSemSelected(6);
    });

    // La tabla debe reducirse a la semana 6
    expect(result.current.tableData).toHaveLength(1);
    expect(result.current.tableData[0].semana).toBe(6);

    // Los KPIs deben recalcularse dinámicamente
    expect(result.current.stats.totalGasto).toBe(500);
    expect(result.current.stats.totalTiempo).toBe(30);
  });

  it('debería limpiar los filtros y volver al estado global de la planta', () => {
    const { result } = renderHook(() => useAssetDetail(mockData, 'MOTOR_X'));

    act(() => {
        result.current.setSemSelected(5);
        result.current.setSemSelected(null);
    });

    // Debe recuperar la longitud original de MOTOR_X
    expect(result.current.tableData).toHaveLength(2);
    expect(result.current.stats.totalGasto).toBe(1500);
  });
});