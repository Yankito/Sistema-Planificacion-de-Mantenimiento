
// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useControlGastos } from '../useControlGastos';
import { ControlGastosService } from '../../services/ControlGastosService';
import type { PresupuestoRow } from '../../types';

// Mock del servicio
vi.mock('../../services/ControlGastosService', () => {
    return {
        ControlGastosService: {
            uploadPresupuesto: vi.fn(),
            getPresupuesto: vi.fn(),
            getGastosConsolidados: vi.fn(),
            searchAssetsByCentroCosto: vi.fn(),
            updateAssetName: vi.fn(),
            autoFixAssets: vi.fn(),
            getMaintainableAssets: vi.fn(),
            saveManualPresupuesto: vi.fn()
        }
    };
});

describe('useControlGastos Hook', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe manejar el estado de loading correctamente', async () => {
        let resolvePromise: any;
        const promise = new Promise(resolve => { resolvePromise = resolve; });

        // Usamos vi.mocked para tipado pero el mock ya está definido en vi.mock above
        vi.mocked(ControlGastosService.getPresupuesto).mockReturnValue(promise as any);

        const { result } = renderHook(() => useControlGastos());

        let callPromise: any;
        // No usamos await aquí para poder verificar el loading
        act(() => {
            callPromise = result.current.getPresupuesto(2026);
        });

        expect(result.current.loading).toBe(true);

        await act(async () => {
            resolvePromise([]);
            await callPromise;
        });

        expect(result.current.loading).toBe(false);
    });

    it('debe capturar errores de los servicios', async () => {
        const errorMsg = 'Error format incorrectly';
        vi.mocked(ControlGastosService.uploadPresupuesto).mockRejectedValue(new Error(errorMsg));

        const { result } = renderHook(() => useControlGastos());

        // Se necesita envolver en act para que el setEstado se propague
        await act(async () => {
            try {
                await result.current.uploadPresupuesto(new File([], 'test.xlsx'));
            } catch (e) {
                // Ignorar el error lanzado por el hook
            }
        });

        expect(result.current.error).toBe(errorMsg);
        expect(result.current.loading).toBe(false);
    });

    it('debe llamar a getGastosConsolidados con los parámetros correctos', async () => {
        const mockData: PresupuestoRow[] = [
            {
                activo: 'ACTIVO DE PRUEBA (2002)',
                frecuencia: 'MENSUAL',
                mes: 1,
                anio: 2026,
                montoBodega: 100,
                montoServExt: 200,
                montoCorrectivo: 300
            }
        ];
        vi.mocked(ControlGastosService.getGastosConsolidados).mockResolvedValue(mockData);

        const { result } = renderHook(() => useControlGastos());

        let data;
        await act(async () => {
            data = await result.current.getGastosConsolidados(2026, 'PF1');
        });

        expect(ControlGastosService.getGastosConsolidados).toHaveBeenCalledWith(2026, 'PF1', undefined);
        expect(data).toEqual(mockData);
    });

    it('debe llamar a saveManualPresupuesto correctamente', async () => {
        const mockRows: PresupuestoRow[] = [{
            activo: 'ACTIVO DE PRUEBA (2002)',
            frecuencia: 'MENSUAL',
            mes: 1,
            anio: 2026,
            montoBodega: 100,
            montoServExt: 200,
            montoCorrectivo: 300
        }];
        vi.mocked(ControlGastosService.saveManualPresupuesto).mockResolvedValue(undefined as any);

        const { result } = renderHook(() => useControlGastos());

        await act(async () => {
            await result.current.saveManualPresupuesto(mockRows);
        });

        expect(ControlGastosService.saveManualPresupuesto).toHaveBeenCalledWith(mockRows);
    });
});
