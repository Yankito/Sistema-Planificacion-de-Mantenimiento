export const sortPeriods = (a: string, b: string) => {
  // Helper para extraer el año de cualquier formato
  const getYear = (val: string) => {
    if (/^\d{4}$/.test(val)) return parseInt(val);
    if (/^[A-Z]{3}-\d{2}$/.test(val)) {
      const parts = val.split('-');
      return parseInt("20" + parts[1]);
    }
    if (/^\d{1,2}\/\d{4}$/.test(val)) return parseInt(val.split('/')[1]);
    if (/^\d{4}-\d{1,2}$/.test(val)) return parseInt(val.split('-')[0]);
    return 0;
  };

  const yearA = getYear(a);
  const yearB = getYear(b);

  if (yearA !== yearB) return yearA - yearB;

  // Si es el mismo año
  const isYearA = /^\d{4}$/.test(a);
  const isYearB = /^\d{4}$/.test(b);

  // El resumen anual (YYYY) va PRIMERO si hay conflicto en el mismo año 
  if (isYearA && !isYearB) return -1;
  if (!isYearA && isYearB) return 1;
  if (isYearA && isYearB) return 0;

  // 2. Ambos son MESES
  const meses: Record<string, number> = { "ENE": 0, "FEB": 1, "MAR": 2, "ABR": 3, "MAY": 4, "JUN": 5, "JUL": 6, "AGO": 7, "SEP": 8, "OCT": 9, "NOV": 10, "DIC": 11 };
  const [mesA, anioA] = a.split('-');
  const [mesB, anioB] = b.split('-');

  if (!anioA || !anioB) return a.localeCompare(b);

  // Comparar años primero
  const fullYearA = parseInt("20" + anioA);
  const fullYearB = parseInt("20" + anioB);

  if (fullYearA !== fullYearB) return fullYearA - fullYearB;

  // Comparar meses
  return (meses[mesA] ?? 0) - (meses[mesB] ?? 0);
};
