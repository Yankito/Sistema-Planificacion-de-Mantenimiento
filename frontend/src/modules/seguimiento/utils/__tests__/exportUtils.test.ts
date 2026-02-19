// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportarReporteCompleto } from '../exportUtils';
import * as XLSX from 'xlsx-js-style';
import type { AtrasoRow, CeldaExcel } from '../../types';

// --- MOCKS DE NAVEGADOR (Sustituyen a Tauri) ---
vi.stubGlobal('URL', {
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
});

// Espiamos el click de los enlaces para verificar descargas
vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => { });

vi.mock('xlsx-js-style', async () => {
  const actual = await vi.importActual<typeof import('xlsx-js-style')>('xlsx-js-style');
  return {
    ...actual,
    utils: {
      ...actual.utils,
      book_new: vi.fn(() => ({ SheetNames: [], Sheets: {} })),
      book_append_sheet: vi.fn(),
      json_to_sheet: vi.fn(() => ({})),
      // Mantenemos la estructura para inspeccionar la lógica del semáforo
      aoa_to_sheet: vi.fn((matrix) => ({ '!data': matrix })),
    },
    write: vi.fn(() => new ArrayBuffer(8)),
  };
});

// --- FIXTURES TIPADAS ---
const createMockOT = (overrides: Partial<AtrasoRow>): AtrasoRow => ({
  ot: '100',
  descripcion: 'TEST',
  planta: 'PF1',
  estado: 'Liberado',
  clasificacion: 'TECNICO / SERVICIO',
  periodo: 'ENE-26',
  semana: '2026-S05',
  esOB: false,
  ...overrides
});

describe('ExportUtils Tests', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = ''; // Limpiamos el DOM entre tests
  });

  describe('exportarReporteCompleto (Lógica de Semáforos Web)', () => {

    it('debería calcular correctamente los DELTAS y asignar color ROJO si aumentan', async () => {
      const mockAct = [createMockOT({ ot: '101' }), createMockOT({ ot: '102' })]; // 2 atrasos
      const mockAnt = [createMockOT({ ot: '101' })]; // 1 atraso

      await exportarReporteCompleto(mockAct, mockAnt, 'ATRASOS', '2026-S05');

      const mockedAoa = vi.mocked(XLSX.utils.aoa_to_sheet);
      const matrix = mockedAoa.mock.calls[0][0] as CeldaExcel[][];

      const filaPF1 = matrix.find(row => row[0]?.v === 'PF1 (OM)');
      expect(filaPF1).toBeDefined();

      const celdaDelta = filaPF1![filaPF1!.length - 1];
      expect(celdaDelta.v).toBe(1); // 2 - 1 = 1

      // Rojo: FF8888
      expect(celdaDelta.s?.fill?.fgColor.rgb).toBe('FF8888');
    });

    it('debería asignar color VERDE si los atrasos disminuyen', async () => {
      const mockAct = [createMockOT({ ot: '101' })]; // 1 atraso
      const mockAnt = [createMockOT({ ot: '101' }), createMockOT({ ot: '102' })]; // 2 atrasos

      await exportarReporteCompleto(mockAct, mockAnt, 'ATRASOS', '2026-S05');

      const matrix = vi.mocked(XLSX.utils.aoa_to_sheet).mock.calls[0][0] as CeldaExcel[][];
      const filaPF1 = matrix.find(row => row[0]?.v === 'PF1 (OM)');

      const celdaDelta = filaPF1![filaPF1!.length - 1];
      expect(celdaDelta.v).toBe(-1); // 1 - 2 = -1

      // Verde: 90EE90
      expect(celdaDelta.s?.fill?.fgColor.rgb).toBe('90EE90');
    });

    it('debería disparar la descarga en el navegador con el nombre correcto', async () => {
      // 1. Espiamos la creación del elemento para capturar sus propiedades
      const createElementSpy = vi.spyOn(document, 'createElement');

      // Simulamos el comportamiento del ancla para que el click no haga nada real
      const mockAnchor = {
        href: '',
        download: '',
        click: vi.fn(),
      } as unknown as HTMLAnchorElement;

      // Cuando el código haga document.createElement('a'), devolvemos nuestro mock
      createElementSpy.mockImplementation((tagName) => {
        if (tagName === 'a') return mockAnchor;
        return document.createElement(tagName);
      });

      await exportarReporteCompleto(
        [{ ot: '1', planta: 'PF1', periodo: 'ENE-26', clasificacion: 'PROGRAMADOR' } as AtrasoRow],
        [],
        'ATRASOS',
        '2026-S05'
      );

      // 2. Verificamos que se intentó crear el enlace
      expect(createElementSpy).toHaveBeenCalledWith('a');

      // 3. Verificamos que el nombre del archivo sea el correcto (S05 extraído de 2026-S05)
      expect(mockAnchor.download).toBe('Dashboard_Atrasos_S05.xlsx');

      // 4. Verificamos que se disparó el click
      expect(mockAnchor.click).toHaveBeenCalled();

      createElementSpy.mockRestore();
    });

    it('debería agrupar correctamente el COMPLEJO con fórmulas SUM', async () => {
      const mockAct = [createMockOT({ planta: 'PF3', esOB: true })];

      await exportarReporteCompleto(mockAct, [], 'ATRASOS', '2026-S05');

      const matrix = vi.mocked(XLSX.utils.aoa_to_sheet).mock.calls[0][0] as CeldaExcel[][];
      const filaComplejo = matrix.find(row => row[0]?.v === 'COMPLEJO (OB)');

      expect(filaComplejo).toBeDefined();
      // Buscamos una celda que tenga fórmula de suma
      const celdaConFormula = filaComplejo!.find(c => c?.f && c.f.includes('SUM'));
      expect(celdaConFormula).toBeDefined();
    });
  });
});