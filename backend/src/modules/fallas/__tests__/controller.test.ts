import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FallasController } from '../controller.js';
import { FallasRepository } from '../repository.js';
import * as processor from '../logic/fallasProcessor.js';

// Mocks
vi.mock('../repository.js');
vi.mock('../logic/fallasProcessor.js');

describe('FallasController', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('listarFallas', () => {
        it('debe retornar toda la lista si no hay query params', async () => {
            const req = { query: {} };
            const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

            const mockResult = [{ planta: 'PF1' }];
            const mockProcessedResult = [{ planta: 'PF1', semana: 1, anio: 2025, mes: 1 }];

            vi.spyOn(FallasRepository, 'getFallas').mockResolvedValue(mockResult as any);
            vi.spyOn(processor, 'processFallasDataFromDB').mockReturnValue(mockProcessedResult as any);

            await FallasController.listarFallas(req as any, res as any);

            expect(FallasRepository.getFallas).toHaveBeenCalled();
            expect(processor.processFallasDataFromDB).toHaveBeenCalledWith(mockResult);
            expect(res.json).toHaveBeenCalledWith(mockProcessedResult);
        });

        it('debe filtrar por semana calculada si se provee (como un número entero u otro tipo, coincidiendo via string)', async () => {
            const req = { query: { semana: '10' } };
            const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

            const mockResult = [{ planta: 'PF1' }];
            const mockProcessedResult = [
                { planta: 'PF1', semana: 10, anio: 2025, mes: 3 },
                { planta: 'PF2', semana: 11, anio: 2025, mes: 3 }
            ];

            vi.spyOn(FallasRepository, 'getFallas').mockResolvedValue(mockResult as any);
            vi.spyOn(processor, 'processFallasDataFromDB').mockReturnValue(mockProcessedResult as any);

            await FallasController.listarFallas(req as any, res as any);

            expect(FallasRepository.getFallas).toHaveBeenCalled();
            // Should filter only semana 10
            expect(res.json).toHaveBeenCalledWith([mockProcessedResult[0]]);
        });
    });
});
