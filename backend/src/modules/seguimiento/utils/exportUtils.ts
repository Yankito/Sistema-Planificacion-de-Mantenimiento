import XLSX from "xlsx-js-style";
import type { OrdenTrabajo } from "../../../shared/types/index.js";
import type { ReporteExcel } from "../types.js";

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
const BORDER_BOUNDARY_RIGHT = { ...BORDER_ALL, right: { style: "medium" } };

const STYLE_HEADER_MAIN = {
  fill: { fgColor: { rgb: "FFFF00" } },
  font: { bold: true },
  alignment: { horizontal: "center" },
  border: BORDER_ALL
};

// LÓGICA DE COLORES DEL SEMÁFORO
const getTrafficLightStyle = (current: number, previous: number, isBold: boolean = false, extraBorder?: unknown, disableColor: boolean = false) => {
  let color = disableColor ? "FFFFFF" : "FFFF99";
  if (!disableColor) {
    if (current > previous) color = "FF8888";
    if (current < previous) color = "90EE90";
  }

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

// Helpers de Conteo - ACTUALIZADO para filtrar por año en totales
const count = (data: OrdenTrabajo[], planta: string | string[], esOB: boolean, periodo: string, cat?: string) => {
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
    if (/^\d{4}$/.test(val)) return Number.parseInt(val);
    if (/^[A-Z]{3}-\d{2}$/.test(val)) {
      const parts = val.split('-');
      return Number.parseInt("20" + parts[1]);
    }
    if (/^\d{1,2}\/\d{4}$/.test(val)) return Number.parseInt(val.split('/')[1]);
    if (/^\d{4}-\d{1,2}$/.test(val)) return Number.parseInt(val.split('-')[0]);
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
    if (/^\d{1,2}\/\d{4}$/.test(val)) return Number.parseInt(val.split('/')[0]) - 1;
    if (/^\d{4}-\d{1,2}$/.test(val)) return Number.parseInt(val.split('-')[1]) - 1;
    return 0;
  };

  return getMonth(a) - getMonth(b);
};

// Helper para normalizar periodos (Comprimir años anteriores)
const normalizeDatasetPeriods = (data: OrdenTrabajo[]): OrdenTrabajo[] => {
  const currentYear = new Date().getFullYear();

  return data.map(row => {
    // Si ya es formato año (YYYY), se deja igual
    if (/^\d{4}$/.test(row.periodo)) return row;

    let year = 0;
    let month = 0;

    // Caso 1: MMM-YY (ENE-25)
    if (/^[A-Z]{3}-\d{2}$/.test(row.periodo)) {
      const parts = row.periodo.split('-');
      const yy = Number.parseInt(parts[1], 10);
      year = 2000 + yy;
      const mNames = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
      month = mNames.indexOf(parts[0]) + 1;
    }
    // Caso 2: MM/YYYY (01/2025)
    else if (/^\d{1,2}\/\d{4}$/.test(row.periodo)) {
      const parts = row.periodo.split('/');
      year = Number.parseInt(parts[1], 10);
      month = Number.parseInt(parts[0], 10);
    }
    // Caso 3: YYYY-MM (2025-01)
    else if (/^\d{4}-\d{1,2}$/.test(row.periodo)) {
      const parts = row.periodo.split('-');
      year = Number.parseInt(parts[0], 10);
      month = Number.parseInt(parts[1], 10);
    }

    // Si detectamos un año y es menor al actual, lo transformamos a YYYY
    if (year > 0 && year < currentYear) {
      return { ...row, periodo: year.toString() };
    }

    // Convertir meses del año actual a formato MMM-YY
    if (year === currentYear && month > 0) {
      const meses = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];
      const yy = year.toString().slice(-2);
      const mName = meses[month - 1];
      return { ...row, periodo: `${mName}-${yy}` };
    }

    return row;
  });
};


export const generarExcelReporte = async (
  dataActual: OrdenTrabajo[],
  dataAnterior: OrdenTrabajo[],
  modoVista: "ATRASOS" | "CUMPLIDAS",
  reporteActual: string
): Promise<ReporteExcel> => {
  // 1. Normalizamos los periodos antes de filtrar
  const dataActualNorm = normalizeDatasetPeriods(dataActual);
  const dataAnteriorNorm = normalizeDatasetPeriods(dataAnterior);
  const disableColorComparison = dataAnteriorNorm.length === 0;

  const datasetAct = dataActualNorm.filter(d => modoVista === "CUMPLIDAS" ? d.clasificacion === "FINALIZADA" : d.clasificacion !== "FINALIZADA");
  const datasetAnt = dataAnteriorNorm.filter(d => modoVista === "CUMPLIDAS" ? d.clasificacion === "FINALIZADA" : d.clasificacion !== "FINALIZADA");

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
    const anioActual = reporteActual.split('-')[0]; // "2026"
    const anioShort = anioActual.slice(-2);        // "26"
    const columnasPeriodos = [...periodosRaw];
    console.log("anioActual", anioActual);
    console.log("anioShort", anioShort);
    console.log("columnasPeriodos", columnasPeriodos);

    // Buscar la frontera: El último periodo que NO sea del año actual (ni 2026 ni -26)
    const idxUltimoAnioAnterior = columnasPeriodos.findLastIndex(p =>
      !p.includes(anioActual) && !p.endsWith(`-${anioShort}`)
    );

    // Labels Dinámicos
    const anioAnterior = (Number.parseInt(anioActual) - 1).toString();
    const headersLabels = [
      `REPORTE ${modoVista}`,
      ...columnasPeriodos,
      `TOTAL ${anioActual}`,
      `TOTAL ${anioActual} S/A`,
      "DELTA"
    ];

    // Letras para fórmulas SUM (Solo meses del año actual)
    const indicesAnioActual = columnasPeriodos
      .map((p, idx) => (p.includes(anioActual) || p.endsWith(`-${anioShort}`)) ? idx + 1 : -1)
      .filter(idx => idx !== -1);

    const letraInicioActual = getColLetter(indicesAnioActual[0]);
    const letraFinActual = getColLetter(indicesAnioActual[indicesAnioActual.length - 1]);

    const headerRow = headersLabels.map((label, idx) => {
      // El índice en headersLabels es idx. La columna de datos empieza en 1.
      const isFrontera = (idx - 1 === idxUltimoAnioAnterior);
      return { v: label, t: 's', s: isFrontera ? { ...STYLE_HEADER_MAIN, border: BORDER_BOUNDARY_RIGHT } : STYLE_HEADER_MAIN };
    });

    const matrix: unknown[][] = [];
    const rowMap = new Map<string, number>();
    matrix.push(headerRow);
    let currentRowIndex = 2;

    const ordenGrupos = [
      ...PLANTAS_INDIVIDUALES.map(p => ({ label: p, id: p, isAgrupado: false })),
      { label: "COMPLEJO", id: "COMPLEJO", isAgrupado: true },
      { label: "PF ALIMENTOS", id: "PF ALIMENTOS", isAgrupado: true }
    ];

    const colIdxTotalSemanaAct = columnasPeriodos.length + 1;
    const colIdxTotalSemanaAnt = colIdxTotalSemanaAct + 1;
    const letraTotalSemanaAct = getColLetter(colIdxTotalSemanaAct);
    const letraTotalSemanaAnt = getColLetter(colIdxTotalSemanaAnt);

    [false, true].forEach(esOB => {
      const suffix = esOB ? "OB" : "OM";
      const suffixDisplay = esOB ? "(OB)" : "(OM)";

      ordenGrupos.forEach(grupo => {
        const rowCells: unknown[] = [];
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
          if (per.includes(anioActual) || per.endsWith(`-${anioShort}`)) {
            valTotalActActual += curVal;
            valTotalAntActual += antVal;
          }

          const extraStyle = (colIdx === idxUltimoAnioAnterior) ? BORDER_BOUNDARY_RIGHT : BORDER_ALL;
          const style = getTrafficLightStyle(curVal, antVal, grupo.isAgrupado, extraStyle, disableColorComparison);

          if (colIdx === 0) rowMap.set(`${grupo.id}_${suffix}`, currentRowIndex);

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
            rowCells.push({ v: curVal, t: 'n', s: style });
          }
        });

        // Celdas de Totales con valores calculados (v:) y fórmulas (f:)
        const styleTotalAct = getTrafficLightStyle(valTotalActActual, valTotalAntActual, true, undefined, disableColorComparison);

        if (grupo.isAgrupado) {
          const plantasHijas = DEFINICION_GRUPOS[grupo.id as keyof typeof DEFINICION_GRUPOS];
          const filasRefs = plantasHijas.map(p => rowMap.get(`${p}_${suffix}`)).filter(r => r !== undefined);
          const refs = filasRefs.map(r => `${letraTotalSemanaAct}${r}`).join(",");
          rowCells.push({ t: 'n', f: `SUM(${refs})`, v: valTotalActActual, s: styleTotalAct });
        } else {
          rowCells.push({ t: 'n', f: `SUM(${letraInicioActual}${currentRowIndex}:${letraFinActual}${currentRowIndex})`, v: valTotalActActual, s: styleTotalAct });
        }

        rowCells.push({ v: valTotalAntActual, t: 'n', s: { border: BORDER_ALL, alignment: { horizontal: "center" }, font: { bold: true } } });
        rowCells.push({ t: 'n', f: `${letraTotalSemanaAct}${currentRowIndex}-${letraTotalSemanaAnt}${currentRowIndex}`, v: valTotalActActual - valTotalAntActual, s: getTrafficLightStyle(valTotalActActual, valTotalAntActual, true, undefined, disableColorComparison) });

        matrix.push(rowCells);
        currentRowIndex++;

        CATEGORIAS.forEach(cat => {
          const filaCat: unknown[] = [{ v: `   ${cat}`, t: 's', s: { border: BORDER_ALL } }];
          const plantasTarget = grupo.isAgrupado ? DEFINICION_GRUPOS[grupo.id as keyof typeof DEFINICION_GRUPOS] : grupo.id;

          let catTotalAct = 0;
          let catTotalAnt = 0;

          columnasPeriodos.forEach((per, cIdx) => {
            const cVal = count(datasetAct, plantasTarget, esOB, per, cat);
            const aVal = count(datasetAnt, plantasTarget, esOB, per, cat);

            if (per.includes(anioActual) || per.endsWith(`-${anioShort}`)) {
              catTotalAct += cVal;
              catTotalAnt += aVal;
            }

            const extraStyle = (cIdx === idxUltimoAnioAnterior) ? BORDER_BOUNDARY_RIGHT : BORDER_ALL;
            filaCat.push({ v: cVal, t: 'n', s: getTrafficLightStyle(cVal, aVal, false, extraStyle, disableColorComparison) });
          });

          // Total Actual: Añadimos la fórmula SUM usando el rango dinámico del año actual
          filaCat.push({
            t: 'n',
            f: `SUM(${letraInicioActual}${currentRowIndex}:${letraFinActual}${currentRowIndex})`,
            v: catTotalAct,
            s: getTrafficLightStyle(catTotalAct, catTotalAnt, true, undefined, disableColorComparison)
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
            f: `${letraTotalSemanaAct}${currentRowIndex}-${letraTotalSemanaAnt}${currentRowIndex}`,
            v: catTotalAct - catTotalAnt,
            s: getTrafficLightStyle(catTotalAct, catTotalAnt, true, undefined, disableColorComparison)
          });
          matrix.push(filaCat);
          currentRowIndex++;
        });

        matrix.push([]);
        currentRowIndex++;
      });
    });

    // -------- NUEVA TABLA RESUMEN PLANTAS --------
    const colIdxResumen = headersLabels.length + 1; // 2 col a la derecha

    const idxAnioAnteriorEnColumnas = columnasPeriodos.indexOf(anioAnterior);
    const letraTotalAnioAnt = idxAnioAnteriorEnColumnas !== -1 ? getColLetter(idxAnioAnteriorEnColumnas + 1) : null;
    const letraTotalAnioAct = letraTotalSemanaAct; // El total del dataset actual (Año actual) sumado por fórmula

    const fSumOtrosAnt = letraTotalAnioAnt
      ? `SUM(${letraTotalAnioAnt}${rowMap.get('DC_OM')},${letraTotalAnioAnt}${rowMap.get('VENTAS_OM')},${letraTotalAnioAnt}${rowMap.get('OTROS_OM')})`
      : "0";
    const fSumOtrosAct = `SUM(${letraTotalAnioAct}${rowMap.get('DC_OM')},${letraTotalAnioAct}${rowMap.get('VENTAS_OM')},${letraTotalAnioAct}${rowMap.get('OTROS_OM')})`;

    const resumenDefs: any[] = [
      [{ v: "RESUMEN PLANTAS", t: 's', s: STYLE_HEADER_MAIN }], // Fila 0
      [
        { v: "Planta", t: 's', s: STYLE_HEADER_MAIN },
        { v: Number.parseInt(anioAnterior) || anioAnterior, t: 'n', s: STYLE_HEADER_MAIN },
        { v: Number.parseInt(anioActual) || anioActual, t: 'n', s: STYLE_HEADER_MAIN }
      ], // Fila 1
      { label: "PF1", id: "PF1_OM" },
      { label: "PF2", id: "PF2_OM" },
      { label: "PF3", id: "PF3_OM" },
      { label: "PF4", id: "PF4_OM" },
      { label: "PF5", id: "PF5_OM" },
      { label: "PF6", id: "PF6_OM" },
      { label: "CDT", id: "CDT_OM" },
      {
        label: "OTROS",
        fAnioAnt: fSumOtrosAnt,
        fAnioAct: fSumOtrosAct
      },
      { label: "PF OB", id: "PF ALIMENTOS_OB" }
    ];

    resumenDefs.forEach((rowDef, idx) => {
      // Relleno de celdas vacías hasta la columna objetivo
      while (matrix[idx].length < colIdxResumen) {
        matrix[idx].push({ v: "", t: "s" });
      }

      if (Array.isArray(rowDef)) {
        matrix[idx].push(...rowDef);
      } else {
        const fAnioAnt = rowDef.fAnioAnt || (letraTotalAnioAnt ? `${letraTotalAnioAnt}${rowMap.get(rowDef.id)}` : "0");
        const fAnioAct = rowDef.fAnioAct || `${letraTotalAnioAct}${rowMap.get(rowDef.id)}`;
        matrix[idx].push(
          { v: rowDef.label, t: 's', s: BORDER_ALL },
          { t: 'n', f: fAnioAnt, s: BORDER_ALL },
          { t: 'n', f: fAnioAct, s: BORDER_ALL }
        );
      }
    });
    // ----------------------------------------------

    const wsResumen = XLSX.utils.aoa_to_sheet(matrix);

    wsResumen['!merges'] = [
      { s: { r: 0, c: colIdxResumen }, e: { r: 0, c: colIdxResumen + 2 } }
    ];

    const baseCols = [{ wch: 25 }, ...columnasPeriodos.map(() => ({ wch: 10 })), { wch: 12 }, { wch: 15 }, { wch: 10 }];
    while (baseCols.length < colIdxResumen) baseCols.push({ wch: 10 });
    baseCols.push({ wch: 15 }, { wch: 10 }, { wch: 10 });
    wsResumen['!cols'] = baseCols;

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
      Tecnicos: item.detallesTecnicos?.map((t) => t.tecnico.nombre).join(", ") || ""
    }));

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataRaw), "DATA_DETALLADA");

    // 1. Generamos un Buffer en lugar de un Array/Blob
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }) as Buffer;

    const semanaLabel = reporteActual.includes('-') ? reporteActual.split('-')[1] : reporteActual;
    const nombreArchivo = `Dashboard_Atrasos_${semanaLabel}.xlsx`;

    return {
      buffer: excelBuffer,
      fileName: nombreArchivo
    };

  } catch (e) {
    console.error("Error generando Excel:", e);
    throw e;
  }
};