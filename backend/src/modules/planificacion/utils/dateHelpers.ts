export { excelDateToJS, getWeekId, getMonthFromWeekId } from '../../../shared/utils/dateUtils.js';

export const formatearFecha = (fecha: Date): string => {
  return `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`;
};

export const evitarDomingo = (fecha: Date): Date => {
  const copiaFecha = new Date(fecha);
  if (copiaFecha.getDay() === 0) {
    copiaFecha.setDate(copiaFecha.getDate() + 1);
  }
  return copiaFecha;
};

export const getMonday = (d: Date): Date => {
  const dObj = new Date(d);
  const day = dObj.getDay();
  const diff = dObj.getDate() - day + (day == 0 ? -6 : 1);
  const lunes = new Date(dObj.setDate(diff));
  lunes.setHours(0, 0, 0, 0);
  return lunes;
};