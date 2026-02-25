export const excelDateToJS = (serial: any): Date => {
  if (serial instanceof Date) return serial;
  const date = new Date((serial - 25569) * 86400 * 1000);
  return isNaN(date.getTime()) ? new Date() : date;
};

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

export const getWeekId = (d: Date): string => {
  const lunes = getMonday(d);
  const oneJan = new Date(lunes.getFullYear(), 0, 1);
  const numberOfDays = Math.floor((lunes.getTime() - oneJan.getTime()) / (86400000));
  const week = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
  return `${lunes.getFullYear()}-S${week.toString().padStart(2, '0')}`;
};

export const getMonthFromWeekId = (weekId: string): { anio: number, mes: number } => {
  try {
    // Check for direct Month format (YYYY-MM) first
    if (/^\d{4}-\d{2}$/.test(weekId)) {
      const [year, month] = weekId.split('-').map(Number);
      return { anio: year, mes: month };
    }

    // Default: Week format (YYYY-Sww or YYYY-Www)
    const parts = weekId.split(/[-S]/);
    if (parts.length >= 2) {
      const year = parseInt(parts[0], 10);
      const week = parseInt(parts[parts.length - 1], 10);

      // Calculate date from week number
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