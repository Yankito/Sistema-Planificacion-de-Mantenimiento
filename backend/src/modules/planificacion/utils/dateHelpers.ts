// Re-exporta utilidades de fechas compartidas para uso dentro del módulo de planificación
export { excelDateToJS, getWeekId, getMonthFromWeekId } from '../../../shared/utils/dateUtils.js';

/**
 * Formatea una fecha JavaScript a string en formato DD/MM/YYYY.
 */
export const formatearFecha = (fecha: Date): string => {
  return `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`;
};

/**
 * Retorna una copia de la fecha avanzada un día si cae en domingo (getDay() === 0).
 * Se usa para evitar asignar OTs en días no laborables.
 */
export const evitarDomingo = (fecha: Date): Date => {
  const copiaFecha = new Date(fecha);
  if (copiaFecha.getDay() === 0) {
    copiaFecha.setDate(copiaFecha.getDate() + 1);
  }
  return copiaFecha;
};

/**
 * Calcula el lunes de la semana a la que pertenece la fecha dada.
 * Utilizado por el algoritmo de Peak Shaving para alinear OTs al inicio de semana.
 */
export const getMonday = (d: Date): Date => {
  const dObj = new Date(d);
  const day = dObj.getDay();
  const diff = dObj.getDate() - day + (day == 0 ? -6 : 1);
  const lunes = new Date(dObj.setDate(diff));
  lunes.setHours(0, 0, 0, 0);
  return lunes;
};