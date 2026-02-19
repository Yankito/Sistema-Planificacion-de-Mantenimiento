import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SeguimientoController } from '../controller.js';
import { SeguimientoRepository } from '../repository.js';
import * as processor from '../logic/seguimientoOTsProcessor.js';
import * as backlogAnalysis from '../logic/backlogAnalysis.js';
import * as technicianAnalysis from '../logic/technicianAnalysis.js';
import * as exportUtils from '../utils/exportUtils.js';
import * as templateGenerator from '../logic/templateGenerator.js';

// Mocks
vi.mock('../repository.js', () => ({
    SeguimientoRepository: {
        getSemanas: vi.fn(),
        getPedidos: vi.fn(),
        guardarTodo: vi.fn()
    }
}));
vi.mock('../logic/seguimientoOTsProcessor.js');
vi.mock('../logic/backlogAnalysis.js');
vi.mock('../logic/technicianAnalysis.js');
vi.mock('../utils/exportUtils.js');
vi.mock('../logic/templateGenerator.js');

// Mock XLSX default export
const readMock = vi.fn();
vi.mock('xlsx-js-style', () => ({
    default: {
        read: (...args: any[]) => readMock(...args),
        utils: { sheet_to_json: vi.fn() }
    }
}));

describe('SeguimientoController', () => {

    beforeEach(() => {
        vi.clearAllMocks();
        // Reset default mock returns
        readMock.mockReturnValue({ Sheets: {} });
    });

    describe('getSemanas', () => {
        it('debe obtener y retornar semanas', async () => {
            const req = { query: { tipo: 'SEGUIMIENTO' } };
            const res = { json: vi.fn() };

            vi.spyOn(SeguimientoRepository, 'getSemanas').mockResolvedValue(['2025-W10']);

            await SeguimientoController.getSemanas(req, res);

            expect(SeguimientoRepository.getSemanas).toHaveBeenCalledWith('SEGUIMIENTO');
            expect(res.json).toHaveBeenCalledWith(['2025-W10']);
        });
    });

    describe('getPedidos', () => {
        it('debe retornar datos si existen', async () => {
            const req = {}; // No params needed anymore
            const res = { json: vi.fn() };

            const mockData = [{ id: 1 }];
            vi.spyOn(SeguimientoRepository, 'getPedidos').mockResolvedValue(mockData as any);

            await SeguimientoController.getPedidos(req, res);

            expect(res.json).toHaveBeenCalledWith(mockData);
        });
    });

    describe('getDashboardStats', () => {
        it('debe calcular estadísticas de flujo y técnicos', async () => {
            const req = { params: { actual: '2025-W10', anterior: '2025-W09' } };
            const res = { json: vi.fn() };

            vi.spyOn(SeguimientoRepository, 'getPedidos').mockResolvedValue([]);
            vi.spyOn(backlogAnalysis, 'analyzeBacklogFlow').mockReturnValue({ pending: 10 } as any);
            vi.spyOn(technicianAnalysis, 'analyzeTechnicians').mockReturnValue({ top: [] } as any);

            await SeguimientoController.getDashboardStats(req, res);

            expect(SeguimientoRepository.getPedidos).toHaveBeenCalledTimes(2); // Actual y Anterior
            expect(backlogAnalysis.analyzeBacklogFlow).toHaveBeenCalled();
            expect(technicianAnalysis.analyzeTechnicians).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                flowStats: expect.anything(),
                techStats: expect.anything()
            }));
        });
    });

    describe('descargarReporte', () => {
        it('debe generar y descargar reporte excel', async () => {
            const req = { query: { semana: '2025-W10', modo: 'ATRASOS', semanaAnt: '2025-W09' } };
            const res = {
                setHeader: vi.fn(),
                send: vi.fn()
            };

            vi.spyOn(SeguimientoRepository, 'getPedidos').mockResolvedValue([]);
            vi.spyOn(exportUtils, 'generarExcelReporte').mockResolvedValue({
                fileName: 'reporte.xlsx', buffer: Buffer.from('excel')
            });

            await SeguimientoController.descargarReporte(req, res);

            expect(exportUtils.generarExcelReporte).toHaveBeenCalled();
            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', expect.stringContaining('spreadsheet'));
            expect(res.send).toHaveBeenCalled();
        });
    });

    describe('descargarPlantilla', () => {
        it('debe generar y descargar plantilla excel', async () => {
            const req = { params: { tipo: 'SEGUIMIENTO' } };
            const res = {
                setHeader: vi.fn(),
                send: vi.fn()
            };

            vi.spyOn(templateGenerator, 'generarBufferPlantilla').mockReturnValue(Buffer.from('plantilla'));

            await SeguimientoController.descargarPlantilla(req, res);

            expect(templateGenerator.generarBufferPlantilla).toHaveBeenCalledWith('SEGUIMIENTO');
            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', expect.stringContaining('spreadsheet'));
            expect(res.send).toHaveBeenCalled();
        });
    });

});
