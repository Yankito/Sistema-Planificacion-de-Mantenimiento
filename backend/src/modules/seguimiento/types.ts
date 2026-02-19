// src/types.ts
import type { Tecnico } from "../../types.js";

export interface SeguimientoRow {
  nroOT: string;
  descripcion: string;
  clase: string;
  planta: string;
  estado: string;
  tipo: "MANTENCION" | "INFRAESTRUCTURA";
}

export interface SeguimientoResult {
  mantencion: SeguimientoRow[];
  infraestructura: SeguimientoRow[];
}

export interface TecnicoEstado {
  tecnico: Tecnico;
  opFinalizada: boolean;
}

export interface AtrasoRow {
  planta: string;
  ot: string;
  nroActivo?: string;
  descripcion: string;
  estado: string;
  clasificacion: "CUMPLIDA" | "TECNICO / SERVICIO" | "PROGRAMADOR" | "OC / OTRO";
  periodo: string;
  semana: string;
  esOB: boolean;
  detallesTecnicos?: TecnicoEstado[];
  rmd?: string;
  rse?: string;
  fecha?: string;
}

export interface ActivoRow {
  codigo: string;
  descripcion: string;
  planta: string;
  ubicacion: string;
}

export interface MasivoRow {
  numero_ot: string;
  activo: string;
  descripcion: string;
  tpt: string;
  fecha_progr: string;
  horas: number;
  rmd: string;
  rse: string;
}

export interface CumplimientoRow {
  planta: string;
  tecnico: string;
  nro_ot: string;
  tipo: string;
  estado_om: string;
  fecha_programada: string;
  op_finalizada: string;
}

export interface ReporteExcel {
  buffer: Buffer;
  fileName: string;
}