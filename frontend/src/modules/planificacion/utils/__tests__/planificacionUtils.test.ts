import { describe, it, expect } from 'vitest';
import { esPlantaCompatible, necesitaValidacionTurno, rolesCoinciden } from '../planificacionUtils';

describe('Planificación Utils - Reglas de Negocio PF', () => {

  describe('esPlantaCompatible', () => {
    it('debería retornar true si el tecnico y la OT son de la misma planta', () => {
      expect(esPlantaCompatible('PF1', 'PF1')).toBe(true);
    });

    it('debería permitir que personal de CI trabaje en plantas del Centro Industrial', () => {
      expect(esPlantaCompatible('CI', 'PF3')).toBe(true);
      expect(esPlantaCompatible('CI', 'CDT')).toBe(true);
      expect(esPlantaCompatible('CI', 'PF1')).toBe(false); // PF1 no es CI
    });

    it('debería ser flexible si la planta de la OT es "OTROS"', () => {
      expect(esPlantaCompatible('CUALQUIERA', 'OTROS')).toBe(true);
    });
  });

  describe('necesitaValidacionTurno', () => {
    it('debería eximir a Supervisores y Servicios Externos de la validación de turno', () => {
      expect(necesitaValidacionTurno('SUPERVISOR')).toBe(false);
      expect(necesitaValidacionTurno('SE')).toBe(false);
      expect(necesitaValidacionTurno('M')).toBe(true); // Mecánicos sí validan
    });
  });

  describe('rolesCoinciden', () => {
    it('debería normalizar strings y comparar roles correctamente', () => {
      expect(rolesCoinciden(' m ', 'M')).toBe(true);
      expect(rolesCoinciden('E', 'M')).toBe(false);
    });
  });
});