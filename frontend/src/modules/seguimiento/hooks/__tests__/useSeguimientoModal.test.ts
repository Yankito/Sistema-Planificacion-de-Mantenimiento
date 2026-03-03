// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSeguimientoModal } from '../useSeguimientoModal';
import { MOCK_SEGUIMIENTO_DATA, MOCK_VIEW_DETAIL } from '../../../../test/mocks';

describe('useSeguimientoModal Hook', () => {
  const defaultProps = {
    dataModo: MOCK_SEGUIMIENTO_DATA,
    dataAnterior: [],
    viewDetail: MOCK_VIEW_DETAIL,
    PLANTAS_COMPLEJO: ['PF1', 'PF2'],
    PLANTAS_PF_ALIMENTOS: ['PF1']
  };

  // Función helper para evitar repetir renderHook en cada test si no es necesario
  const setup = () => renderHook(() => useSeguimientoModal(defaultProps));

  it('debería filtrar datos según viewDetail (id: PF1)', () => {
    const { result } = setup();
    expect(result.current.totalItems).toBe(2);
    expect(result.current.datosPaginados[0].nroOrden).toBe('100');
  });

  it('debería filtrar por estado', () => {
    const { result } = setup();
    act(() => { result.current.handleFilterChange('En Proceso'); });
    expect(result.current.totalItems).toBe(1);
    expect(result.current.datosPaginados[0].nroOrden).toBe('101');
  });

  it('debería seleccionar un tecnico y calcular sus estadísticas', () => {
    const { result } = setup();
    act(() => { result.current.handleSelectTech('JUAN'); });
    const { stats } = result.current.techData;
    expect(stats!.totalAsignado).toBe(2);
    expect(stats!.finalizadas).toBe(1);
  });

  it('debería resetear la selección de tecnico', () => {
    const { result } = setup();
    act(() => { result.current.handleSelectTech('JUAN'); });
    expect(result.current.selectedTech).toBe('JUAN');
    act(() => { result.current.resetTech(); });
    expect(result.current.selectedTech).toBeNull();
  });
});