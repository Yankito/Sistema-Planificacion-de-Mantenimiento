export interface PlanResult {
  nroOrden: string;
  equipo: string;
  descripcion: string;
  planta: string;
  tecnicos: {
    nombre: string;
    rol: string;
    turnos?: string[] | null;
    existe?: boolean;
    opFinalizada?: string;
  }[];
  fechaSugerida: string;
  fechaAnterior: string;
  error?: string;
}

export interface PlanningOT extends Omit<PlanResult, 'fechaSugerida'> {
  fechaIdeal: Date;
  semana: string;
}

export interface HorarioTecnico {
  nombre: string;
  rol: string;
  planta: string;
  turnos: string[];
}