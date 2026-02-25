import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SeguimientoRepository } from '../repository.js';
import * as db from '../../../db/config.js';

// Mockeamos el módulo de base de datos
vi.mock('../../../db/config.js', () => ({
  query: vi.fn(),
  executeMany: vi.fn()
}));

describe('SeguimientoRepository - SQL Validation', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('Simulación DB: debe traer órdenes en rango (incluyendo límites) y omitir fuera de rango', async () => {
    const fechaInicio = '2025-02-01';
    const fechaFin = '2025-02-28';

    // 1. Definimos qué hay en la "DB" (Simulación de lo que tiene Oracle)
    const dataInDB = [
      { OT: 'OT-DENTRO', DESCRIPCION: 'Normal', FECHA: '15/02/2025', PLANTA: 'PF1', ES_OB: 0, ESTADO: 'LIBERADO' },
      { OT: 'OT-LIMITE-SUP', DESCRIPCION: 'En el borde', FECHA: '28/02/2025', PLANTA: 'PF1', ES_OB: 0, ESTADO: 'LIBERADO' },
      { OT: 'OT-FUERA', DESCRIPCION: 'Fuera de rango', FECHA: '01/03/2025', PLANTA: 'PF1', ES_OB: 0, ESTADO: 'LIBERADO' }
    ];

    // 2. Mockeamos el comportamiento de Oracle para este test
    vi.mocked(db.query).mockImplementation(async (sql, params: any) => {
      // Simulamos lo que el motor SQL haría con el rango entregado
      const filtered = dataInDB.filter(row => {
        const [d, m, y] = row.FECHA.split('/');
        const fechaRowStr = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
        return fechaRowStr >= params.fechaInicio && fechaRowStr <= params.fechaFin;
      });
      return { rows: filtered };
    });

    // 3. Ejecutamos
    const result = await SeguimientoRepository.getPedidos(fechaInicio, fechaFin, ['PF1']);

    // 4. Validamos que solo trajo 2 (Inclusivo de límites)
    expect(result).toHaveLength(2);
    const ots = result.map(r => r.ot);
    expect(ots).toContain('OT-DENTRO');
    expect(ots).toContain('OT-LIMITE-SUP');
    expect(ots).not.toContain('OT-FUERA');
  });

  it('debe mapear correctamente los datos de la DB al objeto OrdenTrabajo e identificar OB/INFRA', async () => {
    // Simulamos filas "crudas" que vendrían de Oracle
    const mockDbRows = [
      {
        OT: '123',
        DESCRIPCION: 'Mantenimiento preventivo',
        PLANTA: 'PF1',
        ES_OB: 0, // No es OB por prefijo
        ESTADO: 'LIBERADO',
      },
      {
        OT: '456',
        DESCRIPCION: 'Reparación baño (INFRA)', // Nueva condición
        PLANTA: 'PF1',
        ES_OB: 1, // El SQL ya debería habernos marcado esto como 1 por el tag (INFRA)
        ESTADO: 'LIBERADO'
      }
    ];

    vi.mocked(db.query).mockResolvedValue({ rows: mockDbRows });

    const result = await SeguimientoRepository.getPedidos('2025-01-01', '2025-01-31', ['PF1']);

    // Validamos la transformación
    expect(result).toHaveLength(2);

    // Verificamos la OT Normal
    expect(result[0].ot).toBe('123');
    expect(result[0].esOB).toBe(false);

    // Verificamos la OT de Infraestructura (OB)
    expect(result[1].ot).toBe('456');
    expect(result[1].esOB).toBe(true); // El mapeo detecta ES_OB === 1
  });

  it('debe generar el SQL con los filtros de fecha correctos (el motor de DB se encarga del rango)', async () => {
    const fechaInicio = '2025-05-01';
    const fechaFin = '2025-05-31';

    await SeguimientoRepository.getPedidos(fechaInicio, fechaFin, ['PF1']);

    const [sqlCall, paramsCall] = vi.mocked(db.query).mock.calls[0] as [string, any];

    // Confirmamos que el SQL le ordena a Oracle filtrar por el rango usando TRUNC
    expect(sqlCall).toContain('TRUNC(p.fecha_inicial_programada) >= TO_DATE(:fechaInicio, \'YYYY-MM-DD\')');
    expect(sqlCall).toContain('TRUNC(p.fecha_inicial_programada) <= TO_DATE(:fechaFin, \'YYYY-MM-DD\')');

    // Confirmamos que le pasamos las fechas que el usuario eligió
    expect(paramsCall.fechaInicio).toBe('2025-05-01');
    expect(paramsCall.fechaFin).toBe('2025-05-31');
  });

  it('debe validar que el SQL aplique la jerarquía de plantas en el WHERE', async () => {
    vi.mocked(db.query).mockResolvedValue({ rows: [] });

    await SeguimientoRepository.getPedidos('2025-01-01', '2025-01-31', ['PF1', 'PF2']);

    const [sqlCall] = vi.mocked(db.query).mock.calls[0] as [string, any];

    // Verificamos que al final filtra por la columna "PLANTA" calculada
    expect(sqlCall).toContain('WHERE "PLANTA" IN (:planta0, :planta1)');
  });
});
