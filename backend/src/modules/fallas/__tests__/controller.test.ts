import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FallasController } from '../controller.js';
import { FallasRepository } from '../repository.js';
// import * as XLSX from 'xlsx-js-style'; // Remove this import to rely on mock
import * as processor from '../logic/fallasProcessor.js';

// Mocks
vi.mock('../repository.js');

// Mock XLSX default export
const readMock = vi.fn();
vi.mock('xlsx-js-style', () => ({
    default: {
        read: (...args: any[]) => readMock(...args),
        utils: { sheet_to_json: vi.fn() }
    }
}));

vi.mock('../logic/fallasProcessor.js');

describe('FallasController', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        readMock.mockReturnValue({ Sheets: {} }); // Default behavior
    });

    describe('uploadFallas', () => {
        it('debe retornar 400 si no se envía archivo', async () => {
            const req = { file: null };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            };

            await FallasController.uploadFallas(req as any, res as any);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: "Archivo Excel requerido" });
        });

        it('debe procesar el archivo y guardar datos', async () => {
            const req = {
                file: { buffer: Buffer.from('fake-excel') },
                body: { semana: '2025-S10' }
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            };

            // Spies
            vi.spyOn(processor, 'processFallasData').mockReturnValue([
                { planta: 'PF1', semana: 10, anio: 2025 } as any
            ]);
            const saveSpy = vi.spyOn(FallasRepository, 'guardarFallas').mockResolvedValue();

            await FallasController.uploadFallas(req as any, res as any);

            expect(readMock).toHaveBeenCalled();
            expect(processor.processFallasData).toHaveBeenCalled();
            expect(saveSpy).toHaveBeenCalledWith('2025-S10', expect.anything());
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: "Datos de fallas cargados exitosamente"
            }));
        });

        it('debe derivar la semana si no se envía en body pero hay datos', async () => {
            const req = {
                file: { buffer: Buffer.from('fake-excel') },
                body: {} // Sin semana
            };
            const res = {
                status: vi.fn().mockReturnThis(),
                json: vi.fn()
            };

            vi.spyOn(processor, 'processFallasData').mockReturnValue([
                { planta: 'PF1', semana: 10, anio: 2025 } as any
            ]);
            const saveSpy = vi.spyOn(FallasRepository, 'guardarFallas').mockResolvedValue();

            await FallasController.uploadFallas(req as any, res as any);

            expect(saveSpy).toHaveBeenCalledWith('2025-S10', expect.anything());
        });
    });

    describe('listarFallas', () => {
        it('debe retornar toda la lista si no hay query params', async () => {
            const req = { query: {} };
            const res = { json: vi.fn() };

            const mockResult = [{ id: 1, planta: 'PF1' }];
            vi.spyOn(FallasRepository, 'getFallas').mockResolvedValue(mockResult as any);

            await FallasController.listarFallas(req as any, res as any);

            expect(FallasRepository.getFallas).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(mockResult);
        });

        it('debe filtrar por semana si se provee', async () => {
            const req = { query: { semana: '2025-S10' } };
            const res = { json: vi.fn() };

            const mockResult = [{ id: 1, planta: 'PF1' }];
            vi.spyOn(FallasRepository, 'getFallasBySemana').mockResolvedValue(mockResult as any);

            await FallasController.listarFallas(req as any, res as any);

            expect(FallasRepository.getFallasBySemana).toHaveBeenCalledWith('2025-S10');
            expect(res.json).toHaveBeenCalledWith(mockResult);
        });
    });
});
