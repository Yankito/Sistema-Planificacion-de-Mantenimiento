// @vitest-environment happy-dom
import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTecnicosCarga } from '../useTecnicosCarga';
import type { PlanResult } from '../../types';

const mockPlanResult = [
    {
        fechaSugerida: '05/02/2026',
        planta: 'PF1',
        tecnicos: [{ nombre: 'JUAN', rol: 'M' }]
    },
    {
        fechaSugerida: '05/02/2026', // Misma fecha, mismo técnico (Carga = 2)
        planta: 'PF1',
        tecnicos: [{ nombre: 'JUAN', rol: 'M' }]
    },
    {
        fechaSugerida: '06/02/2026',
        planta: 'PF2',
        tecnicos: [{ nombre: 'ANA', rol: 'E' }]
    }
] as PlanResult[];

describe('useTecnicosCarga Hook', () => {

    it('debería agrupar la carga por técnico y fecha', () => {
        const { result } = renderHook(() => useTecnicosCarga(mockPlanResult, 'TODAS'));

        const juan = result.current.tecnicosFiltrados.find(t => t.nombre === 'JUAN');

        expect(juan).toBeDefined();
        // Juan tiene 2 OTs el día 05/02/2026
        expect(juan?.carga['05/02/2026']).toHaveLength(2);
    });

    it('debería filtrar por planta', () => {
        // Filtramos solo PF2 (Solo Ana)
        const { result } = renderHook(() => useTecnicosCarga(mockPlanResult, 'PF2'));

        expect(result.current.tecnicosFiltrados).toHaveLength(1);
        expect(result.current.tecnicosFiltrados[0].nombre).toBe('ANA');
    });

    it('debería generar los días del mes correctamente según la fecha de la OT', () => {
        const { result } = renderHook(() => useTecnicosCarga(mockPlanResult, 'TODAS'));

        // Las OTs son de Febrero 2026 -> 28 días
        expect(result.current.diasMes).toHaveLength(28);
        expect(result.current.diasMes[0]).toBe('01/02/2026');
    });
});