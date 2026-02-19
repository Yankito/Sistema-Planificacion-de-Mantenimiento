import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx-js-style';
import { processSeguimientoOTs } from '../seguimientoOTsProcessor.js';

const crearHoja = (data: any[]) => XLSX.utils.json_to_sheet(data);

describe('Seguimiento OTs Processor', () => {

  // --- FACTORY: Centraliza la creación del escenario ---
  const setupProcessorTest = (overrides: { pf1?: any[], cumplimiento?: any[], masivo?: any[] } = {}) => {
    const sheets = {
      "PF1": crearHoja(overrides.pf1 || []),
      "CUMPLIMIENTO": crearHoja(overrides.cumplimiento || []),
      "MASIVO": crearHoja(overrides.masivo || [])
    };
    return processSeguimientoOTs(sheets);
  };

  it('debe cruzar Backlog con Cumplimiento correctamente', () => {
    const result = setupProcessorTest({
      pf1: [{ "Pedido de Trabajo": "OT-100", "Estado": "Liberado", "Descripción": "Falla motor", "Fecha Inicial Programada": 45325 }],
      cumplimiento: [{ "NRO_OT": "OT-100", "EMPLEADO": "JUAN PEREZ", "OP_FINALIZADA": "No", "ESTADO_OM": "Liberado" }],
      masivo: [{ "Número": "OT-100", "RMD": "Si", "RSE": "No" }]
    });

    expect(result.actual).toHaveLength(1);
    const ot = result.actual[0];
    expect(ot.ot).toBe("OT-100");
    expect(ot.detallesTecnicos?.[0].tecnico.nombre).toBe("JUAN PEREZ");
    expect(ot.clasificacion).toBe("TECNICO / SERVICIO");
  });

  it('debe clasificar como PROGRAMADOR si está finalizada y tiene RMD/RSE correctos', () => {
    const result = setupProcessorTest({
      pf1: [{ "Pedido de Trabajo": "OT-200", "Estado": "Liberado", "Descripción": "Ajuste", "Fecha Inicial Programada": 45325 }],
      cumplimiento: [{ "NRO_OT": "OT-200", "EMPLEADO": "ANA GOMEZ", "OP_FINALIZADA": "Si", "ESTADO_OM": "Liberado" }],
      masivo: [{ "Número": "OT-200", "RMD": "SI", "RSE": "SI" }]
    });

    expect(result.actual[0].clasificacion).toBe("PROGRAMADOR");
    expect(result.actual[0].detallesTecnicos?.[0].opFinalizada).toBe(true);
  });

  it('debe ignorar OTs que no están en estados de interés (ej: CREADO)', () => {
    const result = setupProcessorTest({
      pf1: [{ "PEDIDO DE TRABAJO": "OT-IGNORE", "ESTADO": "CREADO" }]
    });

    expect(result.actual).toHaveLength(0);
  });

  it('debe clasificar como esOB = true si la descripción contiene el tag (INFRA)', () => {
    const result = setupProcessorTest({
      pf1: [{
        "Pedido de Trabajo": "9000123",
        "Estado": "Liberado",
        "Descripción": "REPARACION TECHOS (INFRA)",
        "Fecha Inicial Programada": 45325
      }]
    });

    expect(result.actual[0].esOB).toBe(true);
  });
});