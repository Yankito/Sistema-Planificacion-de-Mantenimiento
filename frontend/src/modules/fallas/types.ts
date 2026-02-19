export interface FallaRow {
  fecha: Date;
  semana: number;
  planta: string;
  area: string;
  linea: string;
  equipo: string;
  causa: string;
  estadoPedido: string;
  tipoPedido: string;
  tecnico: string;
  duracionMinutos: number; 
  gasto: number; 
  perdidaKg: number; 
  anio: number;
  mes: number;
  descripcionOperador: string;
}

export interface GrupoMecanicoStats {
  label: string;
  gasto: number;
  tiempo: number;
  count: number;
  prevGasto: number;
  prevTiempo: number;
  prevCount: number;
  prevMttr: number;
  mttr?: number;
}

export interface FiltroDrill {
  tipo: 'EQUIPO' | 'CAUSA';
  valor: string;
}