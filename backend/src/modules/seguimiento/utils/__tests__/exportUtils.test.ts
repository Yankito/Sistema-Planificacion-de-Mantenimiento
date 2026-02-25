import { describe, it, expect, vi, beforeEach } from 'vitest';
// 1. Importamos la librería. Como estará mockeada abajo, "XLSX" será nuestro objeto mock.
import XLSX from 'xlsx-js-style';
import { generarExcelReporte } from '../exportUtils.js';
import type { AtrasoRow } from '../../types.js';
import type { OrdenTrabajo } from '../../../../types.js';

// 2. Definimos el mock COMPLETAMENTE contenido dentro del factory.
// Sin variables externas para evitar el error de "ReferenceError".
vi.mock('xlsx-js-style', () => {
  // Creamos las funciones espía AQUÍ ADENTRO
  const aoaSpy = vi.fn((matrix) => ({ '!data': matrix, '!ref': 'A1:Z100' }));
  const jsonSpy = vi.fn(() => ({}));
  const bookNewSpy = vi.fn(() => ({ SheetNames: [], Sheets: {} }));
  const bookAppendSpy = vi.fn();
  const writeSpy = vi.fn(() => Buffer.from([0x50, 0x4B, 0x03, 0x04]));

  const utilsObj = {
    book_new: bookNewSpy,
    book_append_sheet: bookAppendSpy,
    aoa_to_sheet: aoaSpy,
    json_to_sheet: jsonSpy,
  };

  return {
    // Simulamos el export por defecto
    default: {
      utils: utilsObj,
      write: writeSpy,
    },
    // Simulamos exports nombrados (por seguridad)
    utils: utilsObj,
    write: writeSpy,
  };
});

// --- FIXTURES ---
const mockDataActual = [
  { planta: 'PF1', periodo: 'ENE-26', clasificacion: 'TECNICO / SERVICIO', esOB: false, ot: '100', descripcion: '', estado: 'Liberado', semana: '2026-S05' },
  { planta: 'PF1', periodo: 'ENE-26', clasificacion: 'TECNICO / SERVICIO', esOB: false, ot: '101', descripcion: '', estado: 'Liberado', semana: '2026-S05' },
  { planta: 'DC', periodo: 'ENE-26', clasificacion: 'PROGRAMADOR', esOB: true, ot: '200', descripcion: '', estado: 'Liberado', semana: '2026-S05' },
] as AtrasoRow[];

const mockDataAnterior = [
  { planta: 'PF1', periodo: 'ENE-26', clasificacion: 'TECNICO / SERVICIO', esOB: false, ot: '101', descripcion: '', estado: 'Liberado', semana: '2026-S04' },
  { planta: 'DC', periodo: 'ENE-26', clasificacion: 'PROGRAMADOR', esOB: true, ot: '200', descripcion: '', estado: 'Liberado', semana: '2026-S04' },
] as AtrasoRow[];

describe('ExportUtils Backend Tests', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generarExcelReporte (Lógica de Negocio)', () => {

    it('debería calcular correctamente los DELTAS y retornar el objeto ReporteExcel', async () => {
      const reporte = await generarExcelReporte(
        mockDataActual as any,
        mockDataAnterior as any,
        'ATRASOS',
        '2026-S05'
      );

      expect(reporte.fileName).toBe('Dashboard_Atrasos_S05.xlsx');

      // 3. AQUÍ ESTÁ EL TRUCO: Accedemos al mock a través del objeto importado.
      // Como XLSX está mockeado, sus métodos son vi.fn() y tienen la propiedad .mock
      const aoaMock = XLSX.utils.aoa_to_sheet as any;
      const matrix = aoaMock.mock.calls[0][0];

      expect(aoaMock).toHaveBeenCalled();

      const headerRow = matrix[0];
      const deltaIdx = headerRow.findIndex((cell: any) => cell?.v === 'DELTA');

      // Buscamos la fila de PF1
      const filaPF1 = matrix.find((row: any[]) => row[0]?.v === 'PF1 (OM)');

      expect(filaPF1).toBeDefined();
      expect(filaPF1[1].v).toBe(2); // Valor actual

      const deltaCelda = filaPF1[deltaIdx];
      expect(deltaCelda).toBeDefined(); // avoid crash if deltaIdx is wrong
      expect(deltaCelda.v).toBe(1); // Delta
      expect(deltaCelda.s?.fill?.fgColor?.rgb).toBe('FF8888'); // Rojo
    });

    it('debería asignar color VERDE si los atrasos bajaron', async () => {
      const actual = [{ planta: 'PF1', periodo: 'ENE-26', clasificacion: 'TECNICO / SERVICIO', esOB: false, ot: '100' }] as OrdenTrabajo[];
      const anterior = [
        { planta: 'PF1', periodo: 'ENE-26', clasificacion: 'TECNICO / SERVICIO', esOB: false, ot: '101' },
        { planta: 'PF1', periodo: 'ENE-26', clasificacion: 'TECNICO / SERVICIO', esOB: false, ot: '102' }
      ] as OrdenTrabajo[];

      await generarExcelReporte(actual, anterior, 'ATRASOS', '2026-S05');

      const aoaMock = XLSX.utils.aoa_to_sheet as any;
      const matrix = aoaMock.mock.calls[0][0];

      const headerRow = matrix[0];
      const deltaIdx = headerRow.findIndex((cell: any) => cell.v === 'DELTA');

      const filaPF1 = matrix.find((row: any[]) => row[0]?.v === 'PF1 (OM)');

      const celdaDelta = filaPF1[deltaIdx];
      expect(celdaDelta).toBeDefined();
      expect(celdaDelta.v).toBe(-1);
      expect(celdaDelta.s?.fill?.fgColor?.rgb).toBe('90EE90'); // Verde
    });

    it('debería retornar un buffer vacío si no hay datos en el dataset actual', async () => {
      const reporte = await generarExcelReporte([], [], 'ATRASOS', '2026-S05');

      expect(reporte.buffer.length).toBe(0);
      expect(reporte.fileName).toBe('reporte_vacio.xlsx');
    });
  });
});