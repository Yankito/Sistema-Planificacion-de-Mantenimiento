/**
 * Utilidades compartidas para el cálculo de semanas y fechas en el Backend.
 * Estandariza la lógica de semanas bajo ISO 8601 a través de todo el proyecto.
 */

/**
 * Obtiene el número de semana bajo el estándar ISO 8601 (Lunes a Domingo).
 * La semana 1 es la que contiene el primer jueves del año.
 * Usa métodos UTC para evitar desfases por zona horaria.
 */
export const getWeekNumber = (d: Date): number => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

/**
 * Retorna el año al que pertenece la semana ISO (ej: 31 Dic puede ser Semana 1 del prox año).
 */
export const getISOWeekYear = (d: Date): number => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  return date.getUTCFullYear();
};

/**
 * Genera el identificador de semana usado en toda la app (ej: "2024-S01").
 */
export const getWeekId = (d: Date): string => {
  const year = getISOWeekYear(d);
  const week = getWeekNumber(d);
  return `${year}-S${week.toString().padStart(2, '0')}`;
};

/**
 * Recuperar el mes principal para un WeekID (para querys genéricos por mes/año).
 * Se asume el mes oficial en el que cae el primer día (lunes) u otro aproximado.
 */
export const getMonthFromWeekId = (weekId: string): { anio: number, mes: number } => {
  try {
    // Si la cadena ya es Formato YYYY-MM
    if (/^\d{4}-\d{2}$/.test(weekId)) {
      const [year, month] = weekId.split('-').map(Number);
      return { anio: year, mes: month };
    }

    // Default: Formato (YYYY-Sww o YYYY-Www)
    const parts = weekId.split(/[-S]/);
    if (parts.length >= 2) {
      const year = Number.parseInt(parts[0], 10);
      const week = Number.parseInt(parts[parts.length - 1], 10);

      // Calculamos el inicio conservador simplemente para saber qué mes le toca aprox.
      // Enero 1er jueves:
      const simple = new Date(year, 0, 1 + (week - 1) * 7);
      return {
        anio: simple.getFullYear(),
        mes: simple.getMonth() + 1
      };
    }
  } catch (e) {
    console.error("Error parsing week ID:", weekId, e);
  }
  const now = new Date();
  return { anio: now.getFullYear(), mes: now.getMonth() + 1 };
};

/**
 * Transforma un excel date code o string a JS Date normal.
 */
export const excelDateToJS = (serial: any): Date => {
  if (serial instanceof Date) return serial;
  if (typeof serial === 'number' || (typeof serial === 'string' && !Number.isNaN(Number(serial)))) {
    const date = new Date(Math.round((Number(serial) - 25569) * 86400 * 1000));
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }
  return new Date();
};
