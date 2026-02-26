// test/mocks.ts
import type { AtrasoRow } from "../modules/seguimiento/types.js";
import type { OrdenTrabajo } from "../shared/types/index.js";

export const MOCK_DATA_ATRASO: AtrasoRow[] = [
  {
    planta: "PF1",
    ot: "OT-100",
    descripcion: "Falla bomba",
    estado: "EN PROCESO",
    clasificacion: "TECNICO / SERVICIO",
    periodo: "2025",
    semana: "2025-S01",
    esOB: false,
    detallesTecnicos: [{ tecnico: { nombre: "JUAN PEREZ", rol: "M", planta: "PF1" }, opFinalizada: false }]
  },
  {
    planta: "PF2",
    ot: "OT-200",
    descripcion: "Reparación techo",
    estado: "PENDIENTE",
    clasificacion: "OC / OTRO",
    periodo: "2025",
    semana: "2025-S01",
    esOB: true, // Infraestructura
    detallesTecnicos: []
  },
  {
    planta: "PF1",
    ot: "OT-300",
    descripcion: "Ajuste sensor",
    estado: "EN PROCESO",
    clasificacion: "PROGRAMADOR",
    periodo: "2025",
    semana: "2025-S01",
    esOB: false,
    detallesTecnicos: [{ tecnico: { nombre: "ANA GOMEZ", rol: "M", planta: "PF1" }, opFinalizada: true }]
  }
];

export const MOCK_DATA_ANALISIS: OrdenTrabajo[] = [
  {
    planta: "PF1",
    ot: "OT-100",
    descripcion: "Falla bomba",
    estado: "EN PROCESO",
    clasificacion: "TECNICO / SERVICIO",
    periodo: "2025",
    semana: "2025-S01",
    esOB: false,
    detallesTecnicos: [{ tecnico: { nombre: "JUAN PEREZ", rol: "M", planta: "PF1" }, opFinalizada: false }],
    nroOrden: "100",
    equipo: "Equipo 1"
  },
  {
    planta: "PF2",
    ot: "OT-200",
    descripcion: "Reparación techo",
    estado: "PENDIENTE",
    clasificacion: "OC / OTRO",
    periodo: "2025",
    semana: "2025-S01",
    esOB: true, // Infraestructura
    detallesTecnicos: [],
    nroOrden: "200",
    equipo: "Equipo 2"
  },
  {
    planta: "PF1",
    ot: "OT-300",
    descripcion: "Ajuste sensor",
    estado: "EN PROCESO",
    clasificacion: "PROGRAMADOR",
    periodo: "2025",
    semana: "2025-S01",
    esOB: false,
    detallesTecnicos: [{ tecnico: { nombre: "ANA GOMEZ", rol: "M", planta: "PF1" }, opFinalizada: true }],
    nroOrden: "300",
    equipo: "Equipo 3"
  }
];

export const MOCK_SEGUIMIENTO_DATA: AtrasoRow[] = [
  {
    ot: '100',
    planta: 'PF1',
    estado: 'Pendiente',
    esOB: false,
    clasificacion: 'TECNICO / SERVICIO',
    descripcion: 'Test 1',
    periodo: '2026',
    semana: '2026-S01',
    detallesTecnicos: [{ tecnico: { nombre: 'JUAN', rol: 'M', planta: 'PF1' }, opFinalizada: false }]
  },
  {
    ot: '101',
    planta: 'PF1',
    estado: 'En Proceso',
    esOB: false,
    clasificacion: 'TECNICO / SERVICIO',
    descripcion: 'Test 2',
    periodo: '2026',
    semana: '2026-S01',
    detallesTecnicos: [{ tecnico: { nombre: 'JUAN', rol: 'M', planta: 'PF1' }, opFinalizada: true }]
  },
  {
    ot: '102',
    planta: 'PF2',
    estado: 'Pendiente',
    esOB: false,
    clasificacion: 'TECNICO / SERVICIO',
    descripcion: 'Test 3',
    periodo: '2026',
    semana: '2026-S01',
    detallesTecnicos: [],
  },
];

export const MOCK_VIEW_DETAIL = { id: 'PF1', esOB: false, cat: undefined, isGlobal: false };