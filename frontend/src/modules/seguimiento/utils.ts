export const sortPeriods = (a: string, b: string) => {
  const meses: Record<string, number> = {
    "ENE": 1, "FEB": 2, "MAR": 3, "ABR": 4, "MAY": 5, "JUN": 6,
    "JUL": 7, "AGO": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DIC": 12
  };

  const parsePeriod = (val: string) => {
    let year = 0;
    let month = 0; // 0 significa que es el resumen anual

    if (/^\d{4}$/.test(val)) {
      year = Number.parseInt(val);
    } else if (/^[A-Z]{3}-\d{2}$/.test(val)) {
      const [m, y] = val.split('-');
      year = Number.parseInt("20" + y);
      month = meses[m] ?? 0;
    } else if (/^\d{1,2}\/\d{4}$/.test(val)) {
      const [m, y] = val.split('/');
      year = Number.parseInt(y);
      month = Number.parseInt(m);
    } else if (/^\d{4}-\d{1,2}$/.test(val)) {
      const [y, m] = val.split('-');
      year = Number.parseInt(y);
      month = Number.parseInt(m);
    }

    return { year, month };
  };

  const pA = parsePeriod(a);
  const pB = parsePeriod(b);

  // 1. Comparar años
  if (pA.year !== pB.year) return pA.year - pB.year;

  // 2. Si es el mismo año, comparar meses 
  // (El 0 del resumen anual hará que quede primero automáticamente)
  return pA.month - pB.month;
};