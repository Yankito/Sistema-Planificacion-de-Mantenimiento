// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCalendarioGrid } from '../useCalendarioGrid';
import type { PlanResult } from '../../types';

// 1. Creamos una OT de ejemplo respetando la interfaz PlanResult
const crearMockOT = (nro: string, fecha: string): PlanResult => ({
  nroOrden: nro,
  equipo: 'MOTOR_TEST',
  descripcion: 'Mantenimiento Preventivo',
  planta: 'PF1',
  tecnicos: [],
  fechaSugerida: fecha,
  fechaAnterior: 'N/A'
});

describe('useCalendarioGrid Hook', () => {

  it('debería generar la estructura de Febrero 2026 correctamente (Mes de 28 días)', () => {
    // Escenario: Febrero 2026 empieza un Domingo (Day 0). 
    // Tu lógica: startIdx = 0 - 1 = -1 -> se vuelve 6 (Empieza en la última posición de la primera semana)
    const mockPlan: PlanResult[] = [crearMockOT('OT-1', '10/02/2026')];
    const mockOrdenes: Record<string, PlanResult[]> = {
      '10/02/2026': [mockPlan[0]]
    };

    const { result } = renderHook(() => useCalendarioGrid(mockPlan, mockOrdenes));

    expect(result.current.nombreMes).toBe('Febrero');
    expect(result.current.anioActual).toBe(2026);

    // Verificamos que la primera semana tenga los nulos correctos (6 nulos antes del Domingo 01)
    expect(result.current.semanas[0].dias.filter(d => d === null)).toHaveLength(6);
    expect(result.current.semanas[0].dias[6]).toBe('01/02/2026');
  });

  it('debería calcular el total acumulado de órdenes ignorando los días fuera del mes', () => {
    const mockPlan: PlanResult[] = [crearMockOT('OT-1', '10/02/2026')];
    const mockOrdenes: Record<string, PlanResult[]> = {
      '10/02/2026': [crearMockOT('OT-1', '10/02/2026'), crearMockOT('OT-2', '10/02/2026')],
      '15/02/2026': [crearMockOT('OT-3', '15/02/2026')],
      '01/03/2026': [crearMockOT('OT-4', '01/03/2026')] // Esta no debe sumarse si el grid es de Febrero
    };

    const { result } = renderHook(() => useCalendarioGrid(mockPlan, mockOrdenes));

    // Debe sumar solo las de Febrero: 2 (del día 10) + 1 (del día 15) = 3
    expect(result.current.totalOrdenesMes).toBe(3);
  });

  it('debería asignar correctamente el número de semana ISO a cada fila del grid', () => {
    const mockPlan: PlanResult[] = [crearMockOT('OT-1', '10/02/2026')];
    const mockOrdenes: Record<string, PlanResult[]> = { '10/02/2026': mockPlan };

    const { result } = renderHook(() => useCalendarioGrid(mockPlan, mockOrdenes));

    // El 10 de Febrero de 2026 es semana 7
    const semanaConOT = result.current.semanas.find(s => s.dias.includes('10/02/2026'));
    expect(semanaConOT?.numero).toBe(7);
    expect(semanaConOT?.idSemana).toBe('SEM-7');
  });

  it('debería manejar un estado seguro si el planResult viene vacío', () => {
    const { result } = renderHook(() => useCalendarioGrid([], {}));

    // Verificamos el fallback "01/02/2026" que tienes en el código
    expect(result.current.nombreMes).toBe('Febrero');
    expect(result.current.totalOrdenesMes).toBe(0);
  });
});