// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFallasData } from '../useFallasData';
import { type FallaRow } from '../../types';

// 1. Helper para crear datos de prueba sin repetir campos obligatorios
const createFalla = (overrides: Partial<FallaRow>): FallaRow => ({
  fecha: new Date(),
  semana: 5,
  planta: 'PF1',
  area: 'MTTO',
  linea: 'L1',
  equipo: 'MOTOR_A',
  causa: 'MECANICO',
  estadoPedido: 'C',
  tipoPedido: 'PM',
  tecnico: 'Yanko',
  duracionMinutos: 60,
  gasto: 1000,
  perdidaKg: 0,
  anio: 2026,
  mes: 1,
  descripcionOperador: '',
  ...overrides
});

const mockData: FallaRow[] = [
  // AÑO 2026 (Actual)
  createFalla({ planta: 'PF1', anio: 2026, equipo: 'MOTOR_A', gasto: 1000, duracionMinutos: 60, causa: 'ELECTRICO' }),
  createFalla({ planta: 'PF1', anio: 2026, equipo: 'MOTOR_A', gasto: 500, duracionMinutos: 30, causa: 'MECANICO' }),
  createFalla({ planta: 'PF2', anio: 2026, equipo: 'BOMBA_B', gasto: 200, duracionMinutos: 120, causa: 'OPERACIONAL' }),
  
  // AÑO 2025 (Anterior - Para comparación)
  createFalla({ planta: 'PF1', anio: 2025, equipo: 'MOTOR_A', gasto: 800, duracionMinutos: 50, causa: 'ELECTRICO' }),
];

describe('useFallasData Hook', () => {

  it('debería inicializar configuraciones y seleccionar el año más reciente', () => {
    const { result } = renderHook(() => useFallasData(mockData));
    
    expect(result.current.config.anios).toEqual([2026, 2025]);
    expect(result.current.config.plantas).toContain('PF1');
    expect(result.current.config.plantas).toContain('PF2');
    expect(result.current.anioFiltro).toBe(2026);
  });

  it('debería calcular KPIs globales (Gasto, Eventos y MTTR) para el año seleccionado', () => {
    const { result } = renderHook(() => useFallasData(mockData));
    const { analytics } = result.current;
    
    // Gasto 2026: 1000 + 500 + 200 = 1700
    expect(analytics.totalGasto).toBe(1700);
    expect(analytics.totalEventos).toBe(3);
    // MTTR: (60 + 30 + 120) / 3 = 70
    expect(analytics.mttrGlobal).toBe(70);
  });

  it('debería inyectar correctamente los datos del año anterior para comparativas', () => {
    const { result } = renderHook(() => useFallasData(mockData));
    const { analytics } = result.current;

    // Gasto 2025: 800
    expect(analytics.totalGastoPrev).toBe(800);
    
    // El ranking debe tener a MOTOR_A con su historia del año pasado
    const motorA = analytics.porFrecuencia.find(d => d.label === 'MOTOR_A');
    expect(motorA).toBeDefined();
    expect(motorA?.prevGasto).toBe(800);
    expect(motorA?.prevCount).toBe(1);
  });

  it('debería filtrar dinámicamente al cambiar la Planta', () => {
    const { result } = renderHook(() => useFallasData(mockData));

    act(() => {
        result.current.setPlantaFiltro('PF1');
    });

    // PF1 en 2026 tiene 2 registros. Total gasto: 1500
    expect(result.current.datosFiltrados).toHaveLength(2);
    expect(result.current.analytics.totalGasto).toBe(1500);
  });

  it('debería ordenar los rankings de equipos por costo de forma descendente', () => {
    const { result } = renderHook(() => useFallasData(mockData));
    const ranking = result.current.analytics.porCosto;
    
    // MOTOR_A (1500) es más caro que BOMBA_B (200)
    expect(ranking[0].label).toBe('MOTOR_A');
    expect(ranking[0].gasto).toBe(1500);
    expect(ranking[1].label).toBe('BOMBA_B');
  });

  it('debería aplicar un Drill-Down por causa raíz correctamente', () => {
    const { result } = renderHook(() => useFallasData(mockData));

    act(() => {
        result.current.setFiltroDrill({ tipo: 'CAUSA', valor: 'ELECTRICO' });
    });

    // Solo 1 falla eléctrica en 2026 (PF1, Motor A, 1000)
    expect(result.current.datosFiltrados).toHaveLength(1);
    expect(result.current.analytics.totalGasto).toBe(1000);
    expect(result.current.analytics.heroStats.topCritico?.label).toBe('MOTOR_A');
  });
});