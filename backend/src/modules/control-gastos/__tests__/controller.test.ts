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
    });

});
