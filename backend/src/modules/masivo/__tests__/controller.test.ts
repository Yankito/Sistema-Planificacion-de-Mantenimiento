
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MassiveController } from '../controller.js';
import { EamRepository } from '../../eam/repository.js';
import XLSX from 'xlsx-js-style';

// Mock repositories and external libs
vi.mock('../../eam/repository.js', () => ({
  EamRepository: {
    truncateTables: vi.fn(),
    insertarPedidos: vi.fn(),
    insertarActivos: vi.fn(),
    insertarCumplimiento: vi.fn(),
    insertarMasivo: vi.fn()
  }
}));

vi.mock('../../fallas/repository.js', () => ({
  FallasRepository: {
    guardarFallas: vi.fn()
  }
}));

vi.mock('../../fallas/logic/fallasProcessor.js', () => ({
  processFallasData: vi.fn(() => [])
}));

vi.mock('../../seguimiento/logic/templateGenerator.js', () => ({
  generarBufferPlantilla: vi.fn(() => Buffer.from('mock-buffer'))
}));

// Mock XLSX properly for vitest/esm
vi.mock('xlsx-js-style', () => {
  const mock = {
    read: vi.fn(),
    utils: {
      sheet_to_json: vi.fn(() => []),
      aoa_to_sheet: vi.fn()
    },
    SSF: {
      parse_date_code: vi.fn(() => ({ d: 1, m: 1, y: 2026, H: 0, M: 0, S: 0 }))
    }
  };
  return {
    default: mock,
    ...mock
  };
});

describe('MassiveController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('uploadMassive', () => {
    it('debe retornar 400 si no hay archivo', async () => {
      const req = { file: null };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await MassiveController.uploadMassive(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Archivo requerido" });
    });

    it('debe processar simulación EAM si se detectan hojas correspondientes', async () => {
      const req = {
        file: { buffer: Buffer.from('fake-excel') },
        body: { targetWeek: '2026-S08' }
      };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      // Usamos XLSX.default.read si XLSX es el objeto con default
      const readMock = (XLSX as any).read || (XLSX as any).default?.read;
      const toJsonMock = (XLSX as any).utils?.sheet_to_json || (XLSX as any).default?.utils?.sheet_to_json;

      vi.mocked(readMock).mockReturnValue({
        SheetNames: ['PF1', 'ACTIVOS', 'CUMPLIMIENTO', 'MASIVO'],
        Sheets: {}
      } as any);

      vi.mocked(toJsonMock).mockReturnValue([
        { 'Pedido de Trabajo': 'OT1', 'NUMERO_DE_ACTIVO': 'ACT1' }
      ]);

      await MassiveController.uploadMassive(req as any, res as any);

      expect(EamRepository.truncateTables).toHaveBeenCalled();
      expect(EamRepository.insertarPedidos).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        message: "Carga masiva completada"
      }));
    });

    it('debe manejar errores y retornar 500', async () => {
      const req = { file: { buffer: Buffer.from('fake-excel') }, body: {} };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      const readMock = (XLSX as any).read || (XLSX as any).default?.read;
      vi.mocked(readMock).mockImplementation(() => {
        throw new Error('Read error');
      });

      await MassiveController.uploadMassive(req as any, res as any);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Read error' });
    });
  });

  describe('descargarPlantillaEAM', () => {
    it('debe enviar el buffer de la plantilla EAM', async () => {
      const req = {};
      const res = { setHeader: vi.fn(), send: vi.fn() };

      await MassiveController.descargarPlantillaEAM(req as any, res as any);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', expect.any(String));
      expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
    });
  });

  describe('descargarPlantillaHorarios', () => {
    it('debe enviar el buffer de la plantilla de horarios', async () => {
      const req = {};
      const res = { setHeader: vi.fn(), send: vi.fn() };

      await MassiveController.descargarPlantillaHorarios(req as any, res as any);

      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', expect.any(String));
      expect(res.send).toHaveBeenCalledWith(expect.any(Buffer));
    });
  });
});
