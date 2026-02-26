export interface ActivoEAM {
  activo: string;
  claseContable: string;
  organizacion: string;
}

export interface Tecnico {
  nombre: string;
  rol: string;
  planta: string;
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
  // Campos brutos de DB (usados en logs/lógica intermedia)
  OT?: string;
  NRO_ACTIVO?: string;
  DESCRIPCION?: string;
  PLANTA?: string;
  ESTADO?: string;
}
