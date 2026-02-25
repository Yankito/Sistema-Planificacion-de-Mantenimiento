import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SeguimientoController } from '../controller.js';
import { SeguimientoRepository } from '../repository.js';
import * as backlogAnalysis from '../logic/backlogAnalysis.js';
import * as technicianAnalysis from '../logic/technicianAnalysis.js';
import * as exportUtils from '../utils/exportUtils.js';
import * as templateGenerator from '../logic/templateGenerator.js';

// Mocks
vi.mock('../repository.js', () => ({
    SeguimientoRepository: {
        getPedidos: vi.fn(),
        guardarTodo: vi.fn()
    }
}));
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
    let req: any;
    let res: any;

    beforeEach(() => {
        vi.clearAllMocks();
        readMock.mockReturnValue({ Sheets: {} });

        req = {
            query: {},
            params: {},
            authUser: {
                usuario: 'testuser',
                plantas: ['PF1', 'PF2'],
                roles: ['USER']
            }
        };

        res = {
            json: vi.fn().mockReturnThis(),
            status: vi.fn().mockReturnThis(),
            setHeader: vi.fn().mockReturnThis(),
            send: vi.fn().mockReturnThis()
        };
    });

    describe('getPedidos', () => {
        it('debe solicitar pedidos dentro del rango de fechas definido y retornarlos', async () => {
            const fechaInicio = '2025-02-01';
            const fechaFin = '2025-02-28';
            req.query = { fechaInicio, fechaFin };

            // Simulamos que el repositorio devuelve órdenes que están en ese periodo
            const mockPedidos = [
                { ot: 'OT-01', fecha: '05/02/2025', descripcion: 'OT dentro de rango', esOB: false },
                { ot: 'OT-02', fecha: '20/02/2025', descripcion: 'OT dentro de rango 2', esOB: false },
                { ot: 'OT-03', fecha: '29/02/2025', descripcion: 'OT fuera de rango 3', esOB: false }
            ];

            const getPedidosSpy = vi.spyOn(SeguimientoRepository, 'getPedidos').mockResolvedValue(mockPedidos as any);

            await SeguimientoController.getPedidos(req, res);

            // Verificamos que se llamó al repositorio con las fechas CORRECTAS
            expect(getPedidosSpy).toHaveBeenCalledWith(fechaInicio, fechaFin, req.authUser.plantas);

            // Verificamos que el controlador devolvió exactamente lo que el repositorio entregó
            expect(res.json).toHaveBeenCalledWith(mockPedidos);

            // Verificación adicional de consistencia de datos
            const result = res.json.mock.calls[0][0];
            expect(result).toHaveLength(3);
            expect(result[0].ot).toBe('OT-01');
        });

        it('debe retornar 400 si faltan fechas obligatorias', async () => {
            req.query = { fechaInicio: '2025-01-01' }; // Falta fechaFin
            await SeguimientoController.getPedidos(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: expect.stringContaining('formato YYYY-MM-DD') });
        });
    });

    describe('getDashboardStats', () => {
        it('debe calcular estadísticas de flujo y técnicos', async () => {
            req.query = { fechaInicio: '2025-01-01', fechaFin: '2025-01-31' };
            vi.spyOn(SeguimientoRepository, 'getPedidos').mockResolvedValue([]);
            vi.spyOn(backlogAnalysis, 'analyzeBacklogFlow').mockReturnValue({ pending: 10 } as any);
            vi.spyOn(technicianAnalysis, 'analyzeTechnicians').mockReturnValue({ top: [] } as any);

            await SeguimientoController.getDashboardStats(req, res);

            expect(SeguimientoRepository.getPedidos).toHaveBeenCalled();
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                flowStats: expect.anything(),
                techStats: expect.anything()
            }));
        });
    });

    describe('getDatos', () => {
        it('debe retornar pedidos y estadísticas en una sola llamada', async () => {
            req.query = { fechaInicio: '2025-01-01', fechaFin: '2025-01-31' };
            const mockPedidos = [{ ot: '123' }];
            vi.spyOn(SeguimientoRepository, 'getPedidos').mockResolvedValue(mockPedidos as any);
            vi.spyOn(backlogAnalysis, 'analyzeBacklogFlow').mockReturnValue({ balanced: true } as any);
            vi.spyOn(technicianAnalysis, 'analyzeTechnicians').mockReturnValue({ performance: 100 } as any);

            await SeguimientoController.getDatos(req, res);

            expect(res.json).toHaveBeenCalledWith({
                pedidos: mockPedidos,
                flowStats: { balanced: true },
                techStats: { performance: 100 }
            });
        });

        it('debe retornar 400 si faltan fechas', async () => {
            req.query = {};
            await SeguimientoController.getDatos(req, res);
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ error: 'Parámetros fechaInicio y fechaFin son obligatorios' });
        });
    });

    describe('descargarReporte', () => {
        it('debe generar y descargar reporte excel', async () => {
            req.query = { fechaInicio: '2025-01-01', fechaFin: '2025-01-31', modo: 'ATRASOS', semanaAnt: '2025-W09' };
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
            req.params = { tipo: 'SEGUIMIENTO' };
            vi.spyOn(templateGenerator, 'generarBufferPlantilla').mockReturnValue(Buffer.from('plantilla'));

            await SeguimientoController.descargarPlantilla(req, res);

            expect(templateGenerator.generarBufferPlantilla).toHaveBeenCalledWith('SEGUIMIENTO');
            expect(res.setHeader).toHaveBeenCalledWith('Content-Type', expect.stringContaining('spreadsheet'));
            expect(res.send).toHaveBeenCalled();
        });
    });

});
