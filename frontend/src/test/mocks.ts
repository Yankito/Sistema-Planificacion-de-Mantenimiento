// test/mocks.ts
import type { AtrasoRow } from "../modules/seguimiento/types";

export const MOCK_DATA: AtrasoRow[] = [
  {
    planta: "PF1",
    nroOrden: "OT-100",
    nroActivo: "1",
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
    nroOrden: "OT-200",
    nroActivo: "2",
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
    nroOrden: "OT-300",
    nroActivo: "3",
    descripcion: "Ajuste sensor",
    estado: "EN PROCESO",
    clasificacion: "PROGRAMADOR",
    periodo: "2025",
    semana: "2025-S01",
    esOB: false,
    detallesTecnicos: [{ tecnico: { nombre: "ANA GOMEZ", rol: "M", planta: "PF1" }, opFinalizada: true }]
  }
];

export const MOCK_SEGUIMIENTO_DATA: AtrasoRow[] = [
  {
    nroOrden: '100',
    nroActivo: '1',
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
    nroOrden: '101',
    nroActivo: '2',
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
    nroOrden: '102',
    nroActivo: '3',
    planta: 'PF2',
    estado: 'Pendiente',
    esOB: false,
    clasificacion: 'TECNICO / SERVICIO',
    descripcion: 'Test 3',
    periodo: '2026',
    semana: '2026-S01',
    detallesTecnicos: []
  },
];

export const MOCK_VIEW_DETAIL = { id: 'PF1', esOB: false, cat: undefined, isGlobal: false };