import type { Tecnico } from "../../shared/types/index";

export interface PlanResult {
  nroOrden: string;
  equipo: string;
  descripcion: string;
  planta: string;
  tecnicos: Tecnico[];

  fechaSugerida: string;
  fechaAnterior: string;
  error?: string;
  departamento?: string;
  semana?: string;
  mes?: string;
}


export interface HorarioTecnico {
  nombre: string;
  rol: string;
  planta: string;
  turnos: string[];
}

export interface SemanaCalendario {
  numero: number;
  dias: (string | null)[];
  idSemana: string;
}

export interface CargaTecnico {
  nombre: string;
  rol: string;
  carga: Record<string, PlanResult[]>;
}

export interface CeldaCargaSeleccionada {
  nombre: string;
  fecha: string;
  ots: PlanResult[];
}

export interface TecnicoAsignado {
  nombre: string;
  rol: string;
  esSugerido?: boolean;
}

/**
 * Representa una fila cruda del Excel procesada por normalizarColumnas.
 * Todas las keys están en MAYÚSCULAS.
 */
export interface FilaExcelIncompleta {
  "NRO. ORDEN"?: string | number;
  "ORDEN"?: string | number;
  "PEDIDO"?: string | number;
  "EQUIPO"?: string;
  "NÚMERO DE ACTIVO"?: string | number;
  "DESCRIPCIÓN"?: string;
  "DEPARTAMENTO"?: string;
  "PLANTA"?: string;
  "FECHA SUGERIDA"?: string | number;
  "ERROR"?: string; // Campo que agrega el PlannerService al fallar
  [key: string]: string | number | boolean | null | undefined;
}

export interface ProcesoExcelResponse {
  resultados: PlanResult[];
  sinAsignar: PlanResult[];
  tecnicosMap: Record<string, Tecnico>;
  mapaHorarios: Record<string, string[]>;
  horariosCompletos: HorarioTecnico[];
}