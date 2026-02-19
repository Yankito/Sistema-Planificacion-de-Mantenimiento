import { describe, it, expect, vi } from 'vitest';
import { processExcelData } from '../excelProcessor.js';
import XLSX from 'xlsx-js-style';

vi.mock('../../../db/config.js', () => ({
    query: vi.fn()
}));

describe('excelProcessor - processExcelData', () => {
    it('debe lanzar error amigable si faltan datos en B.ACT', () => {
        const sheets = {
            "B.ACT": XLSX.utils.aoa_to_sheet([]), // Vacía
            "B.ANT": XLSX.utils.aoa_to_sheet([["OT"]]),
            "CUMPLIMIENTO": XLSX.utils.aoa_to_sheet([["OT"]]),
            "EMPLEADOS": XLSX.utils.aoa_to_sheet([["EMPLEADO"]]),
            "HORARIOS": XLSX.utils.aoa_to_sheet([["TECNICO"]])
        };
        expect(() => processExcelData(sheets as any)).toThrow(/No se encontraron datos en la hoja 'B.ACT'/);
    });

    it('debe procesar correctamente con datos mínimos', () => {
        const sheets = {
            "B.ACT": XLSX.utils.aoa_to_sheet([["PEDIDO", "DEPARTAMENTO", "NÚMERO DE ACTIVO", "DESCRIPCIÓN"], ["1", "PF3", "ACT1", "DESC1"]]),
            "B.ANT": XLSX.utils.aoa_to_sheet([["PEDIDO"]]),
            "CUMPLIMIENTO": XLSX.utils.aoa_to_sheet([["NRO_OT", "EMPLEADO"]]),
            "EMPLEADOS": XLSX.utils.aoa_to_sheet([["EMPLEADO", "PLANTA", "ROL"], ["JUAN", "PF3", "M"]]),
            "HORARIOS": XLSX.utils.aoa_to_sheet([["TECNICO", "1"], ["JUAN", "M"]])
        };

        const result = processExcelData(sheets);
        expect(result.resultados.length + result.sinAsignar.length).toBe(1);
        expect(result.tecnicosMap).toHaveProperty("JUAN");
    });

    it('debe preservar celdas vacías en horarios usando header 1 logic', () => {
        const mockHorarios = XLSX.utils.aoa_to_sheet([
            ["NOMBRE", "D1", "D2", "D3"],
            ["PEDRO", "M", "", "T"]
        ]);

        const sheets = {
            "B.ACT": XLSX.utils.aoa_to_sheet([["PEDIDO", "NÚMERO DE ACTIVO", "DESCRIPCIÓN"], ["1", "A", "D"]]),
            "B.ANT": XLSX.utils.aoa_to_sheet([["PEDIDO"]]),
            "CUMPLIMIENTO": XLSX.utils.aoa_to_sheet([["NRO_OT"]]),
            "EMPLEADOS": XLSX.utils.aoa_to_sheet([["NOMBRE", "PLANTA"], ["PEDRO", "PF3"]]),
            "HORARIOS": mockHorarios
        };

        const result = processExcelData(sheets);
        const pedroHoras = result.mapaHorarios["PEDRO"];
        expect(pedroHoras).toEqual(["M", "L", "T"]);
    });
});
