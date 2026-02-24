// src/types.ts

import type { Tecnico } from "../../shared/types";


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
  clasificacion: "CUMPLIDA" | "TECNICO / SERVICIO" | "PROGRAMADOR" | "OC / OTRO" | "MANTENIMIENTO";
  periodo: string;
  semana: string;
  esOB: boolean;
  detallesTecnicos?: TecnicoEstado[];
  rmd?: string;
  rse?: string;
  fecha?: string;
  isNew?: boolean;
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

export interface OTFlowResult {
  ot: string;
  descripcion: string;
  planta: string;
  estadoAnterior?: string;
  estadoActual?: string;
  tipoMovimiento: "NUEVA" | "FINALIZADA" | "PERSISTENTE" | "CAMBIO_ESTADO" | "DESAPARECIDA";
}

export interface BacklogStats {
  nuevas: OTFlowResult[];
  finalizadas: OTFlowResult[];
  sinCambios: OTFlowResult[];
  conAvance: OTFlowResult[];
  desaparecidas: OTFlowResult[];
}

export interface TechStats {
  nombre: string;
  totalAsignado: number;
  finalizadas: number;
  pendientes: number;
  efectividad: number;
  plantas: string[];
}

export interface TechFilters {
  planta: string;
  periodo: string;
  cumplimiento: string;
}

export interface ReporteExcel {
  data: Blob;
  fileName: string;
}

export interface UploadResponse {
  actual: AtrasoRow[];
  anterior: AtrasoRow[];
  activos: ActivoRow[];
  message?: string;
}

export interface CeldaExcel {
  v: string | number | boolean | Date;
  t: 's' | 'n' | 'b' | 'd'; // string, number, boolean, date
  s?: {
    fill?: { fgColor: { rgb: string } };
    font?: { bold: boolean };
    border?: object;
    alignment?: { horizontal: string; vertical?: string };
  };
  f?: string; // Fórmulas
}

export type FilaExcel = (CeldaExcel | string | number | null | undefined)[];
