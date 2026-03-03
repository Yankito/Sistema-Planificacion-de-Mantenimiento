/** Activo físico del catálogo EAM (máquina o instalación mantenible) */
export interface ActivoEAM {
  activo: string;
  claseContable: string;
  organizacion: string;
}

/** Técnico de mantenimiento con su planta de asignación y especialidad */
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

/** Estado de un técnico en una OT: incluye si finalizó su operación */
export interface TecnicoEstado {
  tecnico: Tecnico;
  opFinalizada: boolean;
}

/** Orden de Trabajo (OT) con datos de planificación y seguimiento */
export interface OrdenTrabajo {
  nroOrden: string;
  nroActivo: string;
  descripcion: string;
  planta: string;
  estado: string;
  fechaSugerida?: string | null;
  tecnicos?: Tecnico[];
  periodo?: string;
  mes?: number;
  anio?: number;
  esOB?: boolean;
  // Campos de seguimiento (backlog/cumplimiento)
  clasificacion?: "FINALIZADA" | "TECNICO / SERVICIO" | "PROGRAMADOR" | "OC / OTRO";
  semana?: string;
  detallesTecnicos?: TecnicoEstado[];
  fecha?: string;
  rmd?: string;
  rse?: string;
}

/** Fila del presupuesto anual por activo, frecuencia y tipo de gasto */
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

/** Fila de gasto real por transacción (materiales, servicios externos, correctivos) */
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

/** Usuario autenticado en el sistema con sus permisos de acceso */
export interface AuthUser {
  id?: string;
  username: string;
  nombre: string;
  rol: string;
  planta?: string;
  plantasAcceso?: string[];
}
