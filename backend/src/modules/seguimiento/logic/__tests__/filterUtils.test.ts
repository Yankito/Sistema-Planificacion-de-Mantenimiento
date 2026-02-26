// src/logic/__tests__/filterUtils.test.ts
import { describe, it, expect } from 'vitest'; // o 'jest'
import { filterOrders } from '../filterUtils.js';
import { MOCK_DATA_ATRASO } from '../../../../test/mocks.js';

describe('filterUtils Logic', () => {

    const contextBase = {
        plantasComplejo: ["PF3", "PF4", "PF5", "PF6", "CDT", "OTROS"],
        plantasPfAlimentos: ["PF1", "PF2", "PF3", "PF4", "PF5", "PF6", "CDT", "OTROS"],
        previousOtSet: new Set<string>()
    };

    it('debe filtrar correctamente por búsqueda de texto (OT)', () => {
        const result = filterOrders(
            MOCK_DATA_ATRASO,
            {
                viewDetail: { id: "PF1", esOB: false, isGlobal: false }, // Filtro base: Planta PF1, Mantención
                filterEstado: "TODOS",
                searchTerm: "OT-300" // Buscamos específicamente esta OT
            },
            contextBase
        );

        // Debería encontrar 1 (OT-300) y descartar OT-100 aunque sea de PF1
        expect(result.filteredData).toHaveLength(1);
        expect(result.filteredData[0].ot).toBe("OT-300");
    });

    it('debe filtrar por búsqueda de texto (Nombre Técnico)', () => {
        const result = filterOrders(
            MOCK_DATA_ATRASO,
            {
                viewDetail: { id: "PF ALIMENTOS", esOB: false, isGlobal: true },
                filterEstado: "TODOS",
                searchTerm: "JUAN" // Buscamos al técnico Juan
            },
            contextBase
        );

        expect(result.filteredData).toHaveLength(1);
        expect(result.filteredData[0].ot).toBe("OT-100"); // Juan está en la OT-100
    });

    it('debe identificar OTs NUEVAS correctamente', () => {
        // Simulamos que la OT-100 ya existía la semana pasada
        const previousSet = new Set(["OT-100"]);

        const result = filterOrders(
            MOCK_DATA_ATRASO,
            {
                viewDetail: { id: "PF ALIMENTOS", esOB: false, isGlobal: true },
                filterEstado: "NUEVAS",
                searchTerm: ""
            },
            { ...contextBase, previousOtSet: previousSet }
        );

        // OT-100 existe en el set -> NO ES NUEVA
        // OT-300 no existe en el set -> ES NUEVA
        // OT-200 es OB (infra), el filtro viewDetail pide esOB: false -> DESCARTADA

        expect(result.filteredData).toHaveLength(1);
        expect(result.filteredData[0].ot).toBe("OT-300");
    });

    it('debe retornar baseDataForStates sin aplicar filtro de texto', () => {
        // Esto es crucial para que los dropdowns no se vacíen al escribir
        const result = filterOrders(
            MOCK_DATA_ATRASO,
            {
                viewDetail: { id: "PF1", esOB: false, isGlobal: false },
                filterEstado: "TODOS",
                searchTerm: "TEXTO_QUE_NO_EXISTE"
            },
            contextBase
        );

        // filteredData debe estar vacío porque no hay match de texto
        expect(result.filteredData).toHaveLength(0);

        // baseDataForStates debe tener 2 elementos (las 2 OTs de PF1)
        expect(result.baseDataForStates).toHaveLength(2);
    });
    it('debe excluir órdenes que están fuera del periodo seleccionado', () => {
        const dataConVariosPeriodos = [
            { ot: "OT-ENE", periodo: "ENE-25", planta: "PF1", esOB: false },
            { ot: "OT-FEB", periodo: "FEB-25", planta: "PF1", esOB: false },
            { ot: "OT-MAR", periodo: "MAR-25", planta: "PF1", esOB: false }
        ];

        const result = filterOrders(
            dataConVariosPeriodos as any,
            {
                viewDetail: {
                    id: "PF1",
                    esOB: false,
                    isGlobal: false,
                    periodo: "FEB-25" // Solo queremos FEBRERO
                },
                filterEstado: "TODOS",
                searchTerm: ""
            },
            contextBase
        );

        // Debería traer solo 1 orden (la de FEB)
        expect(result.filteredData).toHaveLength(1);
        expect(result.filteredData[0].ot).toBe("OT-FEB");

        // Las de ENE y MAR deben haber sido excluidas por la lógica
        const otsResultantes = result.filteredData.map(o => o.ot);
        expect(otsResultantes).not.toContain("OT-ENE");
        expect(otsResultantes).not.toContain("OT-MAR");
    });
});