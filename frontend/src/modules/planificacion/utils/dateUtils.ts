export const excelDateToJS = (serial: number | string | Date): Date => {
  if (serial instanceof Date) return serial;

  const serialNum = typeof serial === 'string' ? parseFloat(serial) : serial;
  if (isNaN(serialNum) || serialNum === 0) return new Date();

  // Excel usa el sistema de fechas 1900 (donde el serial 1 es 1/1/1900)
  // La diferencia real de días entre la base de JS (1970) y Excel es 25569.
  // Pero restamos 2 porque Excel cuenta 1900 como bisiesto (un día extra) 
  // y empieza en el día 1 en lugar del 0.

  const daysSinceUnix = serialNum - 25569;
  const date = new Date(Math.round(daysSinceUnix * 86400 * 1000));

  // Extraemos componentes UTC para evitar que el huso horario de Chile mueva los días
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const day = date.getUTCDate();

  // Retornamos una fecha local limpia a las 00:00:00
  return new Date(year, month, day, 0, 0, 0, 0);
};

export const formatearFecha = (fecha: Date): string => {
  return `${String(fecha.getDate()).padStart(2, '0')}/${String(fecha.getMonth() + 1).padStart(2, '0')}/${fecha.getFullYear()}`;
};

/**
 * Si la fecha cae domingo, la mueve al lunes. 
 * Crítico para evitar asignaciones en días no laborables de mantenimiento.
 */
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
  const diff = dObj.getDate() - day + (day === 0 ? -6 : 1);
  const lunes = new Date(dObj.setDate(diff));
  lunes.setHours(0, 0, 0, 0);
  return lunes;
};

export const getWeekId = (d: Date): string => {
  const lunes = getMonday(d);
  const oneJan = new Date(lunes.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((lunes.getTime() - oneJan.getTime()) / 86400000);
  // Cálculo de semana estándar
  const week = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
  return `${lunes.getFullYear()}-S${String(week).padStart(2, '0')}`;
};