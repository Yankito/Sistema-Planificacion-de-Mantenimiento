// src/utils/dateUtils.ts

// UTILIDADES DE FORMATO
export const clp = (v: number) => new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(v);
export const num = (v: number) => new Intl.NumberFormat('es-CL').format(v);
export const fechaFmt = (d: Date | string) => {
  const dateObj = typeof d === 'string' ? new Date(d) : d;
  return dateObj.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });
};

// LÓGICA DE SEMANAS
export const getWeekID = (date: Date | string): string => {
  const parsed = typeof date === 'string' ? new Date(date) : date;
  const d = new Date(parsed.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - dayNr + 3);
  const firstThursday = d.valueOf();
  d.setMonth(0, 1);
  if (d.getDay() !== 4) {
    d.setMonth(0, 1 + ((4 - d.getDay()) + 7) % 7);
  }
  const weekNumber = 1 + Math.ceil((firstThursday - d.valueOf()) / 604800000);
  const targetYear = d.getFullYear();

  return `${targetYear}-S${weekNumber.toString().padStart(2, '0')}`;
};


// Devuelve la descripción visual: "(26 Ene - 01 Feb)"
export const getWeekRange = (date: Date | string): string => {
  const parsed = typeof date === 'string' ? new Date(date) : date;
  const lunes = new Date(parsed.valueOf());
  const diaSemana = (lunes.getDay() + 6) % 7;
  lunes.setDate(lunes.getDate() - diaSemana);

  const domingo = new Date(lunes.valueOf());
  domingo.setDate(lunes.getDate() + 6);

  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const f = (dt: Date) => `${dt.getDate()} ${meses[dt.getMonth()]}`;

  return `(${f(lunes)} - ${f(domingo)})`;
};

export const getWeekOptions = () => {
  const options: Array<{ label: string; value: string }> = [];
  const today = new Date();

  // Semana Anterior
  const addOpt = (d: Date, prefix: string = "") => {
    const id = getWeekID(d);        // Valor: "2026-S05"
    const range = getWeekRange(d);  // Visual: "(...)"
    const label = prefix ? `${prefix}: ${id} ${range}` : `${id} ${range}`;
    options.push({ label, value: id });
  };

  // Generar opciones
  const lastWeek = new Date(today); lastWeek.setDate(today.getDate() - 7);
  addOpt(lastWeek, "Anterior");

  addOpt(today, "Actual");

  const twoWeeksAgo = new Date(today); twoWeeksAgo.setDate(today.getDate() - 14);
  addOpt(twoWeeksAgo);

  const threeWeeksAgo = new Date(today); threeWeeksAgo.setDate(today.getDate() - 21);
  addOpt(threeWeeksAgo);

  return { options, default: getWeekID(lastWeek) };
};

// COMPATIBILIDAD
export const getRangoSemana = (semana: number, anio: number) => {
  const primerDiaAnio = new Date(anio, 0, 1);
  const diaSemana = primerDiaAnio.getDay();
  const diasParaRetroceder = diaSemana === 0 ? 6 : diaSemana - 1;

  const inicioSemana1 = new Date(primerDiaAnio);
  inicioSemana1.setDate(primerDiaAnio.getDate() - diasParaRetroceder);

  const inicioSemanaTarget = new Date(inicioSemana1);
  inicioSemanaTarget.setDate(inicioSemana1.getDate() + ((semana - 1) * 7));

  const finSemanaTarget = new Date(inicioSemanaTarget);
  finSemanaTarget.setDate(inicioSemanaTarget.getDate() + 6);

  const fmt = (d: Date) => d.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit' });

  return `${fmt(inicioSemanaTarget)} - ${fmt(finSemanaTarget)}`;
};

export const getRangeFromWeekID = (weekID: string): string => {
  if (!weekID || weekID === "TODAS") return "";

  const [yearStr, weekStr] = weekID.split("-S");
  const year = Number.parseInt(yearStr);
  const week = Number.parseInt(weekStr);

  // Encontrar el primer jueves del año (estándar ISO)
  const firstThursday = new Date(year, 0, 1);
  while (firstThursday.getDay() !== 4) {
    firstThursday.setDate(firstThursday.getDate() + 1);
  }

  // Calcular el lunes de la semana buscada
  const targetMonday = new Date(firstThursday.valueOf());
  targetMonday.setDate(targetMonday.getDate() - 3 + (week - 1) * 7);

  return getWeekRange(targetMonday);
};

/**
 * Calcula el número de semana de forma consistente para el proyecto
 */
export const getWeekNumber = (d: Date | string): number => {
  const parsed = typeof d === 'string' ? new Date(d) : d;
  const date = new Date(parsed.getTime());
  date.setHours(0, 0, 0, 0);
  // Jueves de la semana actual determina el año de la semana
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
};

/**
 * Parsea una fecha en formato "DD/MM/YYYY" a objeto Date
 */
export const parseDDMMYYYY = (fechaStr: string): Date | null => {
  if (!fechaStr || typeof fechaStr !== 'string') return null;
  const [d, m, y] = fechaStr.split('/').map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Genera el label YYYY-SXX para consistencia en DB y filtros
 */
export const getWeekLabel = (d: Date | string): string => {
  const parsed = typeof d === 'string' ? new Date(d) : d;
  const week = getWeekNumber(parsed);
  return `${parsed.getFullYear()}-S${week.toString().padStart(2, '0')}`;
};

export const getMonthOptions = () => {
  const options: Array<{ label: string; value: string }> = [];
  const today = new Date();

  // Generar opciones para los últimos 6 meses (incluyendo el actual)
  for (let i = 5; i >= 0; i--) {
    const date = new Date(today);
    date.setMonth(today.getMonth() - i);

    const year = date.getFullYear();
    const month = date.getMonth();

    // Formato YYYY-MM
    const value = `${year}-${(month + 1).toString().padStart(2, '0')}`;

    // Formato visual: "Enero 2026"
    const label = date.toLocaleDateString('es-CL', {
      month: 'long',
      year: 'numeric'
    }).toUpperCase();

    options.push({ label, value });
  }

  return { options, default: `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}` };
};

/**
 * Genera una lista de años dinámicamente alrededor del año actual
 */
export const getYearOptions = (back = 2, forward = 2) => {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let i = currentYear - back; i <= currentYear + forward; i++) {
    years.push(i);
  }
  return years;
};

/**
 * Formatea una fecha a YYYY-MM-DD (Local)
 */
export const toISODate = (d: Date) => {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Atajos de fechas
 */
export const getStartOfPreviousYear = () => new Date(new Date().getFullYear() - 1, 0, 1);
export const getStartOfCurrentYear = () => new Date(new Date().getFullYear(), 0, 1);
export const getCurrentDate = () => new Date();
export const getSundayOfPreviousWeek = () => {
  const d = new Date();
  const diaSemana = (d.getDay() + 6) % 7; // Lunes = 0, Domingo = 6
  const lunesEstaSemana = new Date(d.getFullYear(), d.getMonth(), d.getDate() - diaSemana);
  const domingoSemanaPasada = new Date(lunesEstaSemana);
  domingoSemanaPasada.setDate(lunesEstaSemana.getDate() - 1);
  return domingoSemanaPasada;
};