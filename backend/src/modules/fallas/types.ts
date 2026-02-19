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
  ot?: string;
  duracionMinutos: number;
  gasto: number;
  perdidaKg: number;
  anio: number;
  mes: number;
  descripcionOperador: string;
}