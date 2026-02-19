import { describe, it, expect } from 'vitest';
import { PlannerService } from '../PlannerService.js';
import { mapDepartamentoAPlanta } from "../../utils/excelHelpers.js";


// --- MOCKS DE DATOS ---
const mockTecnicosMap = new Map([
  ['JUAN PEREZ', { rol: 'M', planta: 'PF1' }],
  ['ANA GOMEZ', { rol: 'E', planta: 'PF1' }]
]);

const mockHorariosMap = new Map([
  ['JUAN PEREZ', ['M', 'M', 'M', 'M', 'M', 'S', 'D']], // Turno Mañana
  ['ANA GOMEZ', ['N', 'N', 'N', 'N', 'N', 'S', 'D']]  // Turno Noche
]);

// Helper para fecha Excel (aprox)
const dateToExcel = (date: Date) => 25569 + (date.getTime() / (86400 * 1000));

describe('PlannerService', () => {

  describe('mapDepartamentoAPlanta', () => {
    it('debería mapear departamentos conocidos correctamente', () => {
      expect(mapDepartamentoAPlanta('MANTENCION PF1')).toBe('PF1');
      expect(mapDepartamentoAPlanta('PRODUCCION PIZZAS')).toBe('PF5');
      expect(mapDepartamentoAPlanta('LOGISTICA')).toBe('CDT');
      expect(mapDepartamentoAPlanta('DESCONOCIDO')).toBe('OTROS');
    });
  });

  describe('generarPlanificacion (Strict Mode)', () => {
    it('debería asignar técnico si existe historial y turno compatible', () => {
      const fechaBase = new Date(2026, 1, 1); // 1 Feb 2026
      
      const dfAct = [{
        'DEPARTAMENTO': 'PF1',
        'PEDIDO': 'OT-100',
        'NÚMERO DE ACTIVO': 'ACT-01',
        'DESCRIPCIÓN': 'Falla Motor',
        'FECHA INICIAL PROGRAMADA': dateToExcel(fechaBase)
      }];

      const dfAnt = [{
        'NÚMERO DE ACTIVO': 'ACT-01',
        'DESCRIPCIÓN': 'Falla Motor',
        'FECHA INICIAL PROGRAMADA': dateToExcel(new Date(2026, 0, 1)), // Mes anterior
        'PEDIDO': 'OT-99'
      }];

      const dfCumplimiento = [{
        'NRO_OT': 'OT-99',
        'EMPLEADO': 'JUAN PEREZ'
      }];

      const { resultados } = PlannerService.generarPlanificacion(
        dfAct, dfAnt, dfCumplimiento, mockTecnicosMap, mockHorariosMap
      );

      expect(resultados).toHaveLength(1);
      expect(resultados[0].nroOrden).toBe('OT-100');
      expect(resultados[0].tecnicos[0].nombre).toBe('JUAN PEREZ');
      expect(resultados[0].tecnicos[0].rol).toBe('M');
    });

    it('debería enviar a sinAsignar si no hay historial', () => {
      const dfAct = [{
        'DEPARTAMENTO': 'PF1',
        'PEDIDO': 'OT-NEW',
        'NÚMERO DE ACTIVO': 'ACT-NEW',
        'DESCRIPCIÓN': 'Nueva Falla'
      }];

      const { sinAsignar } = PlannerService.generarPlanificacion(
        dfAct, [], [], mockTecnicosMap, mockHorariosMap
      );

      expect(sinAsignar).toHaveLength(1);
      expect(sinAsignar[0].error).toBeUndefined(); // No es error, es "Nueva"
      expect(sinAsignar[0].tecnicos[0].nombre).toBe('OT NUEVA');
    });
  });

  describe('generarPlanificacionEquilibrada (Balanceo)', () => {
    it('debería distribuir OTs en la semana (Peak Shaving)', () => {
      // Creamos 10 OTs para la misma semana y planta
      const fecha = new Date(2026, 1, 2); // Lunes
      const dfAct = Array.from({ length: 10 }, (_, i) => ({
        'DEPARTAMENTO': 'PF1',
        'PEDIDO': `OT-${i}`,
        'NÚMERO DE ACTIVO': `ACT-${i}`,
        'DESCRIPCIÓN': `Desc ${i}`,
        'FECHA INICIAL PROGRAMADA': dateToExcel(fecha)
      }));

      const { resultados } = PlannerService.generarPlanificacionEquilibrada(
        dfAct, [], [], mockTecnicosMap
      );

      expect(resultados).toHaveLength(10);

      // Verificamos que no todas estén el lunes
      // El algoritmo debería repartirlas (aprox 2 por día si son 10 en 5 días)
      const fechas = resultados.map(r => r.fechaSugerida);
      const uniqueFechas = new Set(fechas);
      
      // Debería haber repartido en varios días
      expect(uniqueFechas.size).toBeGreaterThan(1);
    });
  });
});