import XLSX from "xlsx-js-style";
import { type AtrasoRow, type ReporteExcel } from "../types.js";

// CONSTANTES
const PLANTAS_INDIVIDUALES = ["PF1", "PF2", "PF3", "PF4", "PF5", "PF6", "CDT", "MPS", "DC", "VENTAS", "OTROS"];
const CATEGORIAS = ["TECNICO / SERVICIO", "PROGRAMADOR", "OC / OTRO"];

const DEFINICION_GRUPOS = {
  "COMPLEJO": ["PF3", "PF4", "PF5", "PF6", "CDT", "DC", "VENTAS", "OTROS"],
  "PF ALIMENTOS": ["PF1", "PF2", "PF3", "PF4", "PF5", "PF6", "CDT", "DC", "VENTAS", "OTROS"]
};

// ESTILOS VISUALES
const BORDER_ALL = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
// Nuevo estilo para la separación de años
const BORDER_2025_RIGHT = { ...BORDER_ALL, right: { style: "medium" } };

const STYLE_HEADER_MAIN = {
  fill: { fgColor: { rgb: "FFFF00" } },
  font: { bold: true },
  alignment: { horizontal: "center" },
  border: BORDER_ALL
};

// LÓGICA DE COLORES DEL SEMÁFORO
const getTrafficLightStyle = (current: number, previous: number, isBold: boolean = false, extraBorder?: any) => {
  let color = "FFFF99";
  if (current > previous) color = "FF8888";
  if (current < previous) color = "90EE90";

  return {
    fill: { fgColor: { rgb: color } },
    font: { bold: isBold },
    alignment: { horizontal: "center" },
    border: extraBorder || BORDER_ALL
  };
};

const getColLetter = (colIndex: number) => {
  let letter = '';
  let temp = colIndex + 1;
  while (temp > 0) {
    let mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
};

// Helpers de Conteo - ACTUALIZADO para filtrar por 2026 en totales
const count = (data: AtrasoRow[], planta: string | string[], esOB: boolean, periodo: string, cat?: string) => {
  return data.filter(d => {
    const matchPlanta = Array.isArray(planta) ? planta.includes(d.planta) : d.planta === planta;
    const matchTipo = d.esOB === esOB;
    const matchPeriodo = d.periodo === periodo;
    const matchCat = cat ? d.clasificacion === cat : true;
    return matchPlanta && matchTipo && matchPeriodo && matchCat;
  }).length;
};


// Helper de Ordenamiento
const sortPeriods = (a: string, b: string) => {
  // Helper para extraer el año de cualquier formato
  const getYear = (val: string) => {
    if (/^\d{4}$/.test(val)) return parseInt(val);
    if (/^[A-Z]{3}-\d{2}$/.test(val)) {
      const parts = val.split('-');
      return parseInt("20" + parts[1]);
    }
    if (/^\d{1,2}\/\d{4}$/.test(val)) return parseInt(val.split('/')[1]);
    if (/^\d{4}-\d{1,2}$/.test(val)) return parseInt(val.split('-')[0]);
    return 0; // Fallback
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

  // 3. Ambos son meses del mismo año -> Ordenar por mes
  const getMonth = (val: string) => {
    const mesMap: Record<string, number> = { "ENE": 0, "FEB": 1, "MAR": 2, "ABR": 3, "MAY": 4, "JUN": 5, "JUL": 6, "AGO": 7, "SEP": 8, "OCT": 9, "NOV": 10, "DIC": 11 };

    if (/^[A-Z]{3}-\d{2}$/.test(val)) return mesMap[val.split('-')[0]] ?? 0;
    if (/^\d{1,2}\/\d{4}$/.test(val)) return parseInt(val.split('/')[0]) - 1;
    if (/^\d{4}-\d{1,2}$/.test(val)) return parseInt(val.split('-')[1]) - 1;
    return 0;
  };

  return getMonth(a) - getMonth(b);
};

// Helper para normalizar periodos (Comprimir años anteriores)
const normalizeDatasetPeriods = (data: AtrasoRow[]): AtrasoRow[] => {
  const currentYear = new Date().getFullYear();

  return data.map(row => {
    // Si ya es formato año (YYYY), se deja igual
    if (/^\d{4}$/.test(row.periodo)) return row;

    let year = 0;

    // Caso 1: MMM-YY (ENE-25)
    if (/^[A-Z]{3}-\d{2}$/.test(row.periodo)) {
      const parts = row.periodo.split('-');
      const yy = parseInt(parts[1], 10);
      year = 2000 + yy;
    }
    // Caso 2: MM/YYYY (01/2025)
    else if (/^\d{1,2}\/\d{4}$/.test(row.periodo)) {
      const parts = row.periodo.split('/');
      year = parseInt(parts[1], 10);
    }
    // Caso 3: YYYY-MM (2025-01)
    else if (/^\d{4}-\d{1,2}$/.test(row.periodo)) {
      const parts = row.periodo.split('-');
      year = parseInt(parts[0], 10);
    }

    // Si detectamos un año y es menor al actual, lo transformamos a YYYY
    if (year > 0 && year < currentYear) {
      return { ...row, periodo: year.toString() };
    }

    return row;
  });
};


export const generarExcelReporte = async (
  dataActual: AtrasoRow[],
  dataAnterior: AtrasoRow[],
  modoVista: "ATRASOS" | "CUMPLIDAS",
  reporteActual: string
): Promise<ReporteExcel> => {
  // 1. Normalizamos los periodos antes de filtrar
  const dataActualNorm = normalizeDatasetPeriods(dataActual);
  const dataAnteriorNorm = normalizeDatasetPeriods(dataAnterior);

  const datasetAct = dataActualNorm.filter(d => modoVista === "CUMPLIDAS" ? d.clasificacion === "CUMPLIDA" : d.clasificacion !== "CUMPLIDA");
  const datasetAnt = dataAnteriorNorm.filter(d => modoVista === "CUMPLIDAS" ? d.clasificacion === "CUMPLIDA" : d.clasificacion !== "CUMPLIDA");

  if (datasetAct.length === 0) {
    return {
      buffer: Buffer.alloc(0),
      fileName: 'reporte_vacio.xlsx'
    };
  }

  try {
    const wb = XLSX.utils.book_new();
    const periodosRaw = Array.from(new Set([...datasetAct.map(d => d.periodo), ...datasetAnt.map(d => d.periodo)]))
      .filter(p => p !== "S/A" && p !== "S/D")
      .sort(sortPeriods);

    // DETECCIÓN DINÁMICA DE AÑO
    const anioFull = reporteActual.split('-')[0]; // "2026"
    const anioShort = anioFull.slice(-2);        // "26"
    const columnasPeriodos = [...periodosRaw];

    // Buscar la frontera: El último periodo que NO sea del año actual (ni 2026 ni -26)
    const idxUltimoAnioAnterior = columnasPeriodos.findLastIndex(p =>
      !p.includes(anioFull) && !p.endsWith(`-${anioShort}`)
    );

    // Labels Dinámicos
    const headersLabels = [
      `REPORTE ${modoVista}`,
      ...columnasPeriodos,
      `TOTAL ${anioFull}`,
      `TOTAL ${anioFull} S/A`,
      "DELTA"
    ];

    // Letras para fórmulas SUM (Solo meses del año actual)
    const indicesAnioActual = columnasPeriodos
      .map((p, idx) => (p.includes(anioFull) || p.endsWith(`-${anioShort}`)) ? idx + 1 : -1)
      .filter(idx => idx !== -1);

    const letraInicioActual = getColLetter(indicesAnioActual[0]);
    const letraFinActual = getColLetter(indicesAnioActual[indicesAnioActual.length - 1]);

    const headerRow = headersLabels.map((label, idx) => {
      // El índice en headersLabels es idx. La columna de datos empieza en 1.
      const isFrontera = (idx - 1 === idxUltimoAnioAnterior);
      return { v: label, t: 's', s: isFrontera ? { ...STYLE_HEADER_MAIN, border: BORDER_2025_RIGHT } : STYLE_HEADER_MAIN };
    });

    const matrix: any[][] = [];
    const rowMap = new Map<string, number>();
    matrix.push(headerRow);
    let currentRowIndex = 2;

    const ordenGrupos = [
      ...PLANTAS_INDIVIDUALES.map(p => ({ label: p, id: p, isAgrupado: false })),
      { label: "COMPLEJO", id: "COMPLEJO", isAgrupado: true },
      { label: "PF ALIMENTOS", id: "PF ALIMENTOS", isAgrupado: true }
    ];

    const colIdxTotalAct = columnasPeriodos.length + 1;
    const colIdxTotalAnt = colIdxTotalAct + 1;
    const letraTotalAct = getColLetter(colIdxTotalAct);
    const letraTotalAnt = getColLetter(colIdxTotalAnt);

    [false, true].forEach(esOB => {
      const suffix = esOB ? "OB" : "OM";
      const suffixDisplay = esOB ? "(OB)" : "(OM)";

      ordenGrupos.forEach(grupo => {
        const rowCells: any[] = [];
        // Variables de suma para la fila actual
        let valTotalActActual = 0;
        let valTotalAntActual = 0;

        rowCells.push({ v: `${grupo.label} ${suffixDisplay}`, t: 's', s: { font: { bold: true }, border: BORDER_ALL, fill: { fgColor: { rgb: "FFFFE0" } } } });

        columnasPeriodos.forEach((per, colIdx) => {
          const excelColLetter = getColLetter(colIdx + 1);
          const plantasTarget = grupo.isAgrupado ? DEFINICION_GRUPOS[grupo.id as keyof typeof DEFINICION_GRUPOS] : grupo.id;

          const curVal = count(datasetAct, plantasTarget, esOB, per);
          const antVal = count(datasetAnt, plantasTarget, esOB, per);

          // Lógica de suma: Solo si el periodo es del año actual
          if (per.includes(anioFull) || per.endsWith(`-${anioShort}`)) {
            valTotalActActual += curVal;
            valTotalAntActual += antVal;
          }

          const extraStyle = (colIdx === idxUltimoAnioAnterior) ? BORDER_2025_RIGHT : BORDER_ALL;
          const style = getTrafficLightStyle(curVal, antVal, grupo.isAgrupado, extraStyle);

          if (grupo.isAgrupado) {
            const plantasHijas = DEFINICION_GRUPOS[grupo.id as keyof typeof DEFINICION_GRUPOS];
            const filasReferencias = plantasHijas.map(p => rowMap.get(`${p}_${suffix}`)).filter(r => r !== undefined);
            if (filasReferencias.length > 0) {
              const refs = filasReferencias.map(r => `${excelColLetter}${r}`).join(",");
              rowCells.push({ t: 'n', f: `SUM(${refs})`, v: curVal, s: style });
            } else {
              rowCells.push({ v: curVal, t: 'n', s: style });
            }
          } else {
            if (colIdx === 0) rowMap.set(`${grupo.id}_${suffix}`, currentRowIndex);
            rowCells.push({ v: curVal, t: 'n', s: style });
          }
        });

        // Celdas de Totales con valores calculados (v:) y fórmulas (f:)
        const styleTotalAct = getTrafficLightStyle(valTotalActActual, valTotalAntActual, true);

        if (grupo.isAgrupado) {
          const plantasHijas = DEFINICION_GRUPOS[grupo.id as keyof typeof DEFINICION_GRUPOS];
          const filasRefs = plantasHijas.map(p => rowMap.get(`${p}_${suffix}`)).filter(r => r !== undefined);
          const refs = filasRefs.map(r => `${letraTotalAct}${r}`).join(",");
          rowCells.push({ t: 'n', f: `SUM(${refs})`, v: valTotalActActual, s: styleTotalAct });
        } else {
          rowCells.push({ t: 'n', f: `SUM(${letraInicioActual}${currentRowIndex}:${letraFinActual}${currentRowIndex})`, v: valTotalActActual, s: styleTotalAct });
        }

        rowCells.push({ v: valTotalAntActual, t: 'n', s: { border: BORDER_ALL, alignment: { horizontal: "center" }, font: { bold: true } } });
        rowCells.push({ t: 'n', f: `${letraTotalAct}${currentRowIndex}-${letraTotalAnt}${currentRowIndex}`, v: valTotalActActual - valTotalAntActual, s: getTrafficLightStyle(valTotalActActual, valTotalAntActual, true) });

        matrix.push(rowCells);
        currentRowIndex++;

        CATEGORIAS.forEach(cat => {
          const filaCat: any[] = [{ v: `   ${cat}`, t: 's', s: { border: BORDER_ALL } }];
          const plantasTarget = grupo.isAgrupado ? DEFINICION_GRUPOS[grupo.id as keyof typeof DEFINICION_GRUPOS] : grupo.id;

          let catTotalAct = 0;
          let catTotalAnt = 0;

          columnasPeriodos.forEach((per, cIdx) => {
            const cVal = count(datasetAct, plantasTarget, esOB, per, cat);
            const aVal = count(datasetAnt, plantasTarget, esOB, per, cat);

            if (per.includes(anioFull) || per.endsWith(`-${anioShort}`)) {
              catTotalAct += cVal;
              catTotalAnt += aVal;
            }

            const extraStyle = (cIdx === idxUltimoAnioAnterior) ? BORDER_2025_RIGHT : BORDER_ALL;
            filaCat.push({ v: cVal, t: 'n', s: getTrafficLightStyle(cVal, aVal, false, extraStyle) });
          });

          // Total Actual: Añadimos la fórmula SUM usando el rango dinámico del año actual
          filaCat.push({
            t: 'n',
            f: `SUM(${letraInicioActual}${currentRowIndex}:${letraFinActual}${currentRowIndex})`,
            v: catTotalAct,
            s: getTrafficLightStyle(catTotalAct, catTotalAnt, true)
          });

          // Total Anterior S/A (Valor fijo)
          filaCat.push({
            v: catTotalAnt,
            t: 'n',
            s: { border: BORDER_ALL, alignment: { horizontal: "center" } }
          });

          // Delta (Fórmula de resta)
          filaCat.push({
            t: 'n',
            f: `${letraTotalAct}${currentRowIndex}-${letraTotalAnt}${currentRowIndex}`,
            v: catTotalAct - catTotalAnt,
            s: getTrafficLightStyle(catTotalAct, catTotalAnt, true)
          });
          matrix.push(filaCat);
          currentRowIndex++;
        });

        matrix.push([]);
        currentRowIndex++;
      });
    });

    const wsResumen = XLSX.utils.aoa_to_sheet(matrix);
    wsResumen['!cols'] = [{ wch: 25 }, ...columnasPeriodos.map(() => ({ wch: 10 })), { wch: 12 }, { wch: 15 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsResumen, "RESUMEN_EJECUTIVO");

    const dataRaw = datasetAct.map(item => ({
      Planta: item.planta,
      OT: item.ot,
      Descripcion: item.descripcion,
      Estado: item.estado,
      Clasificacion: item.clasificacion,
      Tipo: item.esOB ? "OB" : "OM",
      Periodo: item.periodo,
      Semana: item.semana,
      Tecnicos: item.detallesTecnicos?.map((t: any) => t.tecnico).join(", ") || ""
    }));
    console.log(`Datos detallados a exportar: ${dataRaw.length} filas`);
    console.log("Ejemplo fila detallada:", dataRaw[0]);

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataRaw), "DATA_DETALLADA");

    // --- CAMBIOS PARA EL BACKEND ---

    // 1. Generamos un Buffer en lugar de un Array/Blob
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer;

    const semanaLabel = reporteActual.includes('-') ? reporteActual.split('-')[1] : reporteActual;
    const nombreArchivo = `Dashboard_Atrasos_${semanaLabel}.xlsx`;

    console.log(`Excel generado: ${nombreArchivo}, tamaño: ${excelBuffer.length} bytes`);
    // RETORNO LIMPIO: TypeScript ya sabe que este objeto cumple con ReporteExcel
    return {
      buffer: excelBuffer,
      fileName: nombreArchivo
    };

  } catch (e) {
    console.error("Error generando Excel:", e);
    throw e;
  }
};