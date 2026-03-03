
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EamRepository } from '../repository.js';
import * as dbConfig from '../../../db/config.js';

vi.mock('../../../db/config.js', () => ({
  query: vi.fn(),
  executeMany: vi.fn()
}));

describe('EamRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('truncateTables', () => {
    it('debe intentar truncar todas las tablas de EAM', async () => {
      vi.mocked(dbConfig.query).mockResolvedValue({} as any);

      await EamRepository.truncateTables();

      expect(dbConfig.query).toHaveBeenCalledTimes(4);
      expect(dbConfig.query).toHaveBeenCalledWith(expect.stringContaining('TRUNCATE TABLE PF_EAM_CUMPLIMIENTO'));
      expect(dbConfig.query).toHaveBeenCalledWith(expect.stringContaining('TRUNCATE TABLE PF_EAM_MASIVO'));
      expect(dbConfig.query).toHaveBeenCalledWith(expect.stringContaining('TRUNCATE TABLE PF_EAM_PEDIDOS'));
      expect(dbConfig.query).toHaveBeenCalledWith(expect.stringContaining('TRUNCATE TABLE PF_EAM_ACTIVOS'));
    });

    it('debe manejar errores en truncate individualmente', async () => {
      vi.mocked(dbConfig.query).mockRejectedValueOnce(new Error('Table not found'));
      vi.mocked(dbConfig.query).mockResolvedValue({} as any);

      await EamRepository.truncateTables();

      expect(dbConfig.query).toHaveBeenCalledTimes(4);
    });
  });

  describe('insertarActivos', () => {
    it('debe llamar a executeMany con los datos mapeados', async () => {
      const mockItems = [{ nro_de_activo: 'ACT1', planta: 'P1', activo: 'ACT1', clase_contable: 'CL1', organizacion: 'ORG1' }];
      vi.mocked(dbConfig.executeMany).mockResolvedValue({ rowsAffected: 1 } as any);

      await EamRepository.insertarActivos(mockItems);

      expect(dbConfig.executeMany).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO PF_EAM_ACTIVOS'),
        mockItems
      );
    });

    it('no debe hacer nada si el array está vacío', async () => {
      await EamRepository.insertarActivos([]);
      expect(dbConfig.executeMany).not.toHaveBeenCalled();
    });
  });

  describe('insertarPedidos', () => {
    it('debe llamar a executeMany para insertar pedidos', async () => {
      const mockPedidos = [{ pedido_trabajo: 'OT1', fecha_inicial_programada: '01/01/2026 00:00:00' }];
      vi.mocked(dbConfig.executeMany).mockResolvedValue({ rowsAffected: 1 } as any);

      await EamRepository.insertarPedidos(mockPedidos);

      expect(dbConfig.executeMany).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO PF_EAM_PEDIDOS'),
        mockPedidos
      );
    });
  });

  describe('insertarCumplimiento', () => {
    it('debe llamar a executeMany para insertar cumplimiento', async () => {
      const mockItems = [{ nro_ot: 'OT1', fecha_programada_inicio: '01/01/2026' }];
      vi.mocked(dbConfig.executeMany).mockResolvedValue({ rowsAffected: 1 } as any);

      await EamRepository.insertarCumplimiento(mockItems);

      expect(dbConfig.executeMany).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO PF_EAM_CUMPLIMIENTO'),
        mockItems
      );
    });
  });

  describe('insertarMasivo', () => {
    it('debe llamar a executeMany para insertar masivo', async () => {
      const mockItems = [{ numero: 'M1', horas: 10 }];
      vi.mocked(dbConfig.executeMany).mockResolvedValue({ rowsAffected: 1 } as any);

      await EamRepository.insertarMasivo(mockItems);

      expect(dbConfig.executeMany).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO PF_EAM_MASIVO'),
        mockItems
      );
    });
  });
});
