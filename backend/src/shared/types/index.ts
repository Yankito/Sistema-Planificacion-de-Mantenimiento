export interface ActivoEAM {
  activo: string;
  claseContable: string;
  organizacion: string;
}
export interface Tecnico {
  nombre: string;
  rol: string;
  planta: string;
  activo?: number | boolean;
  key?: string;
  esSugerido?: boolean;
  turnos?: string[] | null;
  existe?: boolean;
}

export interface TecnicoEstado {
  tecnico: Tecnico;
  opFinalizada: boolean;
}

export interface OrdenTrabajo {
  nroOrden: string;
  equipo: string;
  descripcion: string;
  planta: string;
  estado: string;
  fechaSugerida?: string | null;
  tecnicos?: Tecnico[];
  periodo?: string;
  mes?: number;
  anio?: number;
  esOB?: boolean;
  // Campos para seguimiento
  id?: string;
  ot?: string;
  nroActivo?: string;
  clasificacion?: "FINALIZADA" | "TECNICO / SERVICIO" | "PROGRAMADOR" | "OC / OTRO";
  semana?: string;
  detallesTecnicos?: TecnicoEstado[];
  fecha?: string;
  rmd?: string;
  rse?: string;
}

export interface PresupuestoRow {
  activo: string;
  mes: number;
  anio: number;
  frecuencia: string;
  montoBodega?: number;
  montoServExt?: number;
  montoCorrectivo?: number;
  centroCosto?: string;
  claseContable?: string;
  mantenible?: string;
  organizacion?: string;
}

export interface GastoConsolidadoRow {
  tipo: string;
  numeroOt: string;
  tipoOt: string;
  nroActivo: string;
  fechaTrx: Date | string;
  descripcionArticulo: string;
  costoTrx: number;
  alertaFecha?: number;
  centroCosto?: string;
  anio?: number;
  mes?: number;
  tipoGasto?: string;
  fechaOtPro?: Date | string;
  descripcionOt?: string;
  estadoTrabajo?: string;
  esHito?: boolean;
  planta?: string;
  claseContable?: string;
  mantenible?: string;
}

export interface AuthUser {
  id?: string;
  username: string;
  nombre: string;
  rol: string;
  planta?: string;
  plantasAcceso?: string[];
}
