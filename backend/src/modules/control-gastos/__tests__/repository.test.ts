import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ControlGastosRepository } from '../repository.js';
import * as dbConfig from '../../../db/config.js';

vi.mock('../../../db/config.js', () => ({
    withConnection: vi.fn(async (callback) => {
        const mockConn = {
            execute: vi.fn(),
            executeMany: vi.fn(),
            close: vi.fn()
        };
        return await callback(mockConn);
    })
}));

describe('ControlGastosRepository', () => {
    let repository: any;

    beforeEach(() => {
        vi.clearAllMocks();
        repository = ControlGastosRepository;
    });

    describe('getGastosConsolidados', () => {
        it('debe clasificar correctamente un gasto como BODEGA', async () => {
            const mockRows = [
                {
                    TIPO: 'B',
                    NUMERO_OT: 'OT-BOD-1',
                    TIPO_OT: 'Preventivo',
                    NRO_ACTIVO: 'ACT-001',
                    DESCRIP_ARTICULO: 'Rodamiento',
                    FECHA_TRANSACCION: new Date(2026, 1, 15),
                    FECHA_OT_PRO: new Date(2026, 1, 10),
                    COSTO_TRX: 1000,
                }
            ];

            const mockExecute = vi.fn()
                .mockResolvedValueOnce({ rows: mockRows })
                .mockResolvedValueOnce({ rows: [{ PEDIDO_TRABAJO: 'OT-BOD-1', DESCRIPCION: 'Mantenimiento Preventivo' }] });

            vi.mocked(dbConfig.withConnection).mockImplementation(async (callback) => {
                return await callback({ execute: mockExecute } as any);
            });

            const result = await repository.getGastosConsolidados(2026);

            const item = result.find((r: any) => r.numeroOt === 'OT-BOD-1');
            expect(item?.tipoGasto).toBe('BODEGA');
        });

        it('debe marcar esHito=true si la descripción de la OT empieza con HITO, manteniendo su categoría real', async () => {
            const mockRows = [
                {
                    TIPO: 'SER',
                    NUMERO_OT: 'OT-HITO-1',
                    TIPO_OT: 'Preventivo',
                    NRO_ACTIVO: 'ACT-002',
                    DESCRIP_ARTICULO: 'Servicio',
                    FECHA_TRANSACCION: new Date(2026, 1, 15),
                    FECHA_OT_PRO: new Date(2026, 1, 15),
                    COSTO_TRX: 5000,
                }
            ];

            const mockExecute = vi.fn()
                .mockResolvedValueOnce({ rows: mockRows })
                .mockResolvedValueOnce({ rows: [{ PEDIDO_TRABAJO: 'OT-HITO-1', DESCRIPCION: 'HITO: Entrega Etapa 1' }] });

            vi.mocked(dbConfig.withConnection).mockImplementation(async (callback) => {
                return await callback({ execute: mockExecute } as any);
            });

            const result = await repository.getGastosConsolidados(2026);

            expect(result[0].esHito).toBe(true);
            expect(result[0].tipoGasto).toBe('SERV_EXT');
        });

        it('debe marcar alertaFecha = 1 si los meses no coinciden', async () => {
            const mockRows = [
                {
                    TIPO: 'B',
                    NUMERO_OT: 'OT-1',
                    TIPO_OT: 'Preventivo',
                    NRO_ACTIVO: 'ACT-001',
                    FECHA_TRANSACCION: new Date(2026, 2, 1), // 1 de Marzo
                    FECHA_OT_PRO: new Date(2026, 1, 28),    // 28 de Febrero
                    COSTO_TRX: 100,
                }
            ];

            const mockExecute = vi.fn()
                .mockResolvedValueOnce({ rows: mockRows })
                .mockResolvedValueOnce({ rows: [{ PEDIDO_TRABAJO: 'OT-1', DESCRIPCION: 'Test' }] });

            vi.mocked(dbConfig.withConnection).mockImplementation(async (callback) => {
                return await callback({ execute: mockExecute } as any);
            });

            const result = await repository.getGastosConsolidados(2026);

            expect(result[0].alertaFecha).toBe(1);
        });
    });
});
