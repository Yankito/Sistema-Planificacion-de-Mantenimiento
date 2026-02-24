
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
        it('debe clasificar correctamente un gasto y calcular centro de costo (ultimos 6)', async () => {
            const mockRows = [
                {
                    TIPO: 'B',
                    NUMERO_OT: 'OT-BOD-1',
                    TIPO_OT: 'Preventivo',
                    NRO_ACTIVO: 'ACT-001 (10001)',
                    DESCRIP_ARTICULO: 'Rodamiento',
                    FECHA_TRANSACCION: new Date(2026, 1, 15),
                    COSTO_TRX: 1000,
                    DESC_OT: 'Mantenimiento Preventivo',
                    FECHA_PROG: new Date(2026, 1, 15),
                    PLANTA_CALC: 'PF1',
                    CLASE_CONTABLE_ACTIVO: 'Edif Mant',
                    ANIO_CALC: 2026,
                    MES_CALC: 2
                }
            ];

            const mockExecute = vi.fn().mockResolvedValue({ rows: mockRows });

            vi.mocked(dbConfig.withConnection).mockImplementation(async (callback) => {
                return await callback({ execute: mockExecute } as any);
            });

            const result = await repository.getGastosConsolidados(2026);

            expect(result.length).toBe(1);
            expect(result[0].tipoGasto).toBe('BODEGA');
            expect(result[0].centroCosto).toBe('10001)'); // ultimos 6 de "ACT-001 (10001)"
            expect(result[0].planta).toBe('PF1');
            expect(result[0].esHito).toBe(false);
        });

        it('debe detectar HITO por la descripción de la OT', async () => {
            const mockRows = [
                {
                    TIPO: 'SER',
                    NUMERO_OT: 'OT-HITO-1',
                    TIPO_OT: 'Preventivo',
                    NRO_ACTIVO: 'ACT-HITO',
                    DESC_OT: 'HITO: Entrega Final',
                    FECHA_PROG: new Date(2026, 1, 15),
                    COSTO_TRX: 5000,
                    PLANTA_CALC: 'PF2'
                }
            ];

            const mockExecute = vi.fn().mockResolvedValue({ rows: mockRows });

            vi.mocked(dbConfig.withConnection).mockImplementation(async (callback) => {
                return await callback({ execute: mockExecute } as any);
            });

            const result = await repository.getGastosConsolidados(2026);

            expect(result[0].esHito).toBe(true);
            expect(result[0].tipoGasto).toBe('SERV_EXT');
        });

        it('debe marcar alertaFecha = 1 si meses de trx y prog no coinciden', async () => {
            const mockRows = [
                {
                    TIPO: 'B',
                    NUMERO_OT: 'OT-1',
                    TIPO_OT: 'Preventivo',
                    NRO_ACTIVO: 'ACT-001',
                    FECHA_TRANSACCION: new Date(2026, 2, 1), // Marzo
                    FECHA_PROG: new Date(2026, 1, 15),        // Febrero
                    DESC_OT: 'Test OT',
                    COSTO_TRX: 100,
                    PLANTA_CALC: 'PF1'
                }
            ];

            const mockExecute = vi.fn().mockResolvedValue({ rows: mockRows });

            vi.mocked(dbConfig.withConnection).mockImplementation(async (callback) => {
                return await callback({ execute: mockExecute } as any);
            });

            const result = await repository.getGastosConsolidados(2026);
            expect(result[0].alertaFecha).toBe(1);
        });
    });

    describe('saveGastosConsolidados', () => {
        it('debe llamar a executeMany con los campos correctos', async () => {
            const mockRows = [
                {
                    tipo: 'B',
                    numeroOt: 'OT1',
                    tipoOt: 'Preventivo',
                    nroActivo: 'ACT1',
                    descripcionArticulo: 'Desc 1',
                    fechaTrx: new Date(),
                    costoTrx: 100,
                    planta: 'PF1', // No se guarda
                    claseContable: 'CL1' // No se guarda
                }
            ];

            const mockExecuteMany = vi.fn().mockResolvedValue({ rowsAffected: 1 });

            vi.mocked(dbConfig.withConnection).mockImplementation(async (callback) => {
                return await callback({ executeMany: mockExecuteMany } as any);
            });

            await repository.saveGastosConsolidados(mockRows);

            expect(mockExecuteMany).toHaveBeenCalled();
            const binds = mockExecuteMany.mock.calls[0][1];
            expect(binds[0]).toHaveProperty('tipo', 'B');
            expect(binds[0]).toHaveProperty('numeroOt', 'OT1');
            expect(binds[0]).not.toHaveProperty('planta');
            expect(binds[0]).not.toHaveProperty('claseContable');
        });
    });

    describe('getPresupuesto', () => {
        it('debe obtener presupuesto y calcular centro de costo correctamente', async () => {
            const mockRows = [
                {
                    ACTIVO: 'ACTIVO DE PRUEBA (20002)',
                    FRECUENCIA: 'MENSUAL',
                    MES: 1,
                    ANIO: 2026,
                    MONTOBODEGA: 100,
                    MONTOSERVEXT: 200,
                    MONTOCORRECTIVO: 300,
                    PLANTA_CALC: 'PF1'
                }
            ];

            const mockExecute = vi.fn().mockResolvedValue({ rows: mockRows });

            vi.mocked(dbConfig.withConnection).mockImplementation(async (callback) => {
                return await callback({ execute: mockExecute } as any);
            });

            const result = await repository.getPresupuesto(2026);

            expect(result.length).toBe(1);
            expect(result[0].centroCosto).toBe('20002)');
            expect(result[0].montoBodega).toBe(100);
        });
    });
});
