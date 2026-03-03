import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ControlGastosController } from '../controller.js';
import { ControlGastosRepository } from '../repository.js';

// Mock del repositorio
vi.mock('../repository.js', () => ({
    ControlGastosRepository: {
        getPresupuesto: vi.fn(),
        getGastosConsolidados: vi.fn(),
        saveGastosConsolidados: vi.fn(),
        clearPresupuesto: vi.fn()
    }
}));

describe('ControlGastosController', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getGastosConsolidados', () => {
        it('debe retornar los gastos obtenidos del repositorio', async () => {
            const req = { query: { anio: '2026' } };
            const res = { json: vi.fn() };
            const mockData = [{ id: 1, tipoGasto: 'BODEGA' }];
            const controller = new ControlGastosController();

            vi.mocked(ControlGastosRepository.getGastosConsolidados).mockResolvedValue(mockData as any);

            await controller.getGastosConsolidados(req as any, res as any);

            expect(res.json).toHaveBeenCalledWith(mockData);
        });
        describe('processPresupuestoData', () => {
            it('debe detenerse al encontrar una fila con TOTAL en la primera columna', () => {
                const controller = new ControlGastosController() as any;
                const data = [
                    ['(ACT-01)', '', ''], // ignored since code only?
                    ['MENSUAL', 100, 200], // Will be processed since preceded by code? Wait, we need the logic.
                    ['TOTAL GASTOS', 500, 500],
                    ['MENSUAL', 100, 200], // Should be skipped
                ];

                // To properly mock we use typical realistic structure:
                const fullData = [
                    ['', 'Enero', 'Febrero'],
                    ['Centro de Costo', 'Bodega', 'Bodega'],
                    ['(MAQ-001) MOTOR', '', ''],
                    ['MENSUAL', '100', '200'],
                    ['TOTAL GENERAL', '500', '500'],
                    ['MENSUAL', '100', '300'],
                ];

                const colMap = { 1: { month: 1, type: 'bod' }, 2: { month: 2, type: 'bod' } };
                // startIndex is usually after subHeader (3)
                const result = controller.processPresupuestoData(fullData, 2, colMap, 2026);

                // Should have picked up row 3, but break at 4 ('TOTAL GENERAL')
                expect(result.length).toBe(2);
                expect(result[0].mes).toBe(1);
                expect(result[0].montoBodega).toBe(100);
            });
        });

    });
});
