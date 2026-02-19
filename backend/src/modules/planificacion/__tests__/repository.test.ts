import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PlanificacionRepository } from '../repository.js';
import * as dbConfig from '../../../db/config.js';

vi.mock('../../../db/config.js', () => ({
    query: vi.fn(),
    executeMany: vi.fn()
}));

describe('PlanificacionRepository', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });



    describe('guardarPlanificacion', () => {
        it('debe hacer MERGE en PF_IM_PLANIFICACION', async () => {
            (dbConfig.query as any).mockResolvedValue({ rows: [] });

            const asignaciones = [
                { ot: 'OT1', tecnicos: [], periodo: '2026-02' }
            ];

            await PlanificacionRepository.guardarPlanificacion(asignaciones);

            expect(dbConfig.query).toHaveBeenCalledWith(
                expect.stringContaining('MERGE INTO PF_IM_PLANIFICACION'),
                expect.objectContaining({
                    anio: 2026,
                    mes: 2,
                    ot: 'OT1'
                })
            );
        });
    });

    describe('getHorarios', () => {
        it('debe mapear correctamente los campos de Oracle y parsear JSON', async () => {
            const mockRows = [
                { EMPLEADO_NOMBRE: 'JUAN', ROL: 'M', PLANTA: 'PF3', TURNOS: '["M", "L"]' }
            ];
            (dbConfig.query as any).mockResolvedValue({ rows: mockRows });

            const result = await PlanificacionRepository.getHorarios('2026-02', 'PF3');

            expect(dbConfig.query).toHaveBeenCalledWith(
                expect.stringContaining('WHERE h.anio = :anio AND h.mes = :mes'),
                expect.objectContaining({
                    anio: 2026,
                    mes: 2,
                    plantaFiltro: 'PF3',
                    plantaLike: '%PF3%'
                })
            );

            expect(result[0]).toEqual({
                nombre: 'JUAN',
                rol: 'M',
                planta: 'PF3',
                turnos: ['M', 'L']
            });
        });
    });

    describe('getDataParaPlanificar', () => {
        it('debe consultar PF_EAM_PEDIDOS y unir con PF_IM_PLANIFICACION', async () => {
            const mockRows = [{ OT: '123', descripcion: 'Test' }];
            (dbConfig.query as any).mockResolvedValue({ rows: mockRows });

            const result = await PlanificacionRepository.getDataParaPlanificar('2026-02');

            expect(dbConfig.query).toHaveBeenCalledWith(
                expect.stringContaining('NOT LIKE \'OM%\''),
                expect.objectContaining({
                    anio: 2026,
                    mes: 2
                })
            );
            expect(result.ots).toEqual(expect.arrayContaining([
                expect.objectContaining({ OT: '123' })
            ]));
        });
    });
});
