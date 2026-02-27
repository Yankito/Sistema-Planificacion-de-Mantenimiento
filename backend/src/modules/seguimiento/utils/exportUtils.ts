import XLSX from "xlsx-js-style";
import type { OrdenTrabajo } from "../../../shared/types/index.js";
import type { ReporteExcel } from "../types.js";

// --- CONSTANTES ---
const PLANTAS_INDIVIDUALES = ["PF1", "PF2", "PF3", "PF4", "PF5", "PF6", "CDT", "MPS", "DC", "VENTAS", "OTROS"];
const CATEGORIAS = ["TECNICO / SERVICIO", "PROGRAMADOR", "OC / OTRO"];
const MESES_LISTA = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

const DEFINICION_GRUPOS = {
  "COMPLEJO": ["PF3", "PF4", "PF5", "PF6", "CDT", "DC", "VENTAS", "OTROS"],
  "PF ALIMENTOS": ["PF1", "PF2", "PF3", "PF4", "PF5", "PF6", "CDT", "DC", "VENTAS", "OTROS"]
};

// --- ESTILOS ---
const BORDER_ALL = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
const BORDER_BOUNDARY_RIGHT = { ...BORDER_ALL, right: { style: "medium" } };
const STYLE_HEADER_MAIN = {
  fill: { fgColor: { rgb: "FFFF00" } },
  font: { bold: true },
  alignment: { horizontal: "center" },
  border: BORDER_ALL
};

// --- HELPERS DE APOYO ---

/** Centraliza el parseo de cualquier formato de periodo del sistema */
const parsePeriodo = (val: string) => {
  const mesesMap: Record<string, number> = { "ENE": 1, "FEB": 2, "MAR": 3, "ABR": 4, "MAY": 5, "JUN": 6, "JUL": 7, "AGO": 8, "SEP": 9, "OCT": 10, "NOV": 11, "DIC": 12 };
  let year = 0;
  let month = 0;

  if (/^\d{4}$/.test(val)) {
    year = Number.parseInt(val, 10);
  } else if (/^[A-Z]{3}-\d{2}$/.test(val)) {
    const [m, y] = val.split('-');
    year = 2000 + Number.parseInt(y, 10);
    month = mesesMap[m] ?? 0;
  } else if (/^\d{1,2}\/\d{4}$/.test(val)) {
    const [m, y] = val.split('/');
    year = Number.parseInt(y, 10);
    month = Number.parseInt(m, 10);
  } else if (/^\d{4}-\d{1,2}$/.test(val)) {
    const [y, m] = val.split('-');
    year = Number.parseInt(y, 10);
    month = Number.parseInt(m, 10);
  }
  return { year, month, isFullYear: month === 0 };
};

const getTrafficLightStyle = (current: number, previous: number, isBold = false, extraBorder?: any, disableColor = false) => {
  let color = disableColor ? "FFFFFF" : "FFFF99";
  if (!disableColor) {
    if (current > previous) color = "FF8888";
    else if (current < previous) color = "90EE90";
  }
  return {
    fill: { fgColor: { rgb: color } },
    font: { bold: isBold },
    alignment: { horizontal: "center" },
    border: extraBorder || BORDER_ALL
  };
};

const getColLetter = (colIndex: number): string => {
  let letter = '';
  let temp = colIndex + 1;
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCodePoint(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
};

const count = (data: OrdenTrabajo[], planta: string | string[], esOB: boolean, periodo: string, cat?: string) => {
  return data.filter(d => {
    const matchPlanta = Array.isArray(planta) ? planta.includes(d.planta) : d.planta === planta;
    const matchTipo = d.esOB === esOB;
    const matchPeriodo = d.periodo === periodo;
    const matchCat = cat ? d.clasificacion === cat : true;
    return matchPlanta && matchTipo && matchPeriodo && matchCat;
  }).length;
};

const sortPeriods = (a: string, b: string) => {
  const pA = parsePeriodo(a);
  const pB = parsePeriodo(b);
  if (pA.year !== pB.year) return pA.year - pB.year;
  return pA.month - pB.month;
};

const normalizeDatasetPeriods = (data: OrdenTrabajo[]): OrdenTrabajo[] => {
  const currentYear = new Date().getFullYear();
  return data.map(row => {
    const { year, month, isFullYear } = parsePeriodo(row.periodo);
    if (year === 0) return row;

    if (year < currentYear) return { ...row, periodo: year.toString() };
    if (year === currentYear && !isFullYear) {
      return { ...row, periodo: `${MESES_LISTA[month - 1]}-${year.toString().slice(-2)}` };
    }
    return row;
  });
};

interface ExcelContext {
  datasetAct: OrdenTrabajo[];
  datasetAnt: OrdenTrabajo[];
  periodosRaw: string[];
  anioActualInt: number;
  idxUltimoAnioAnterior: number;
  disableColorComparison: boolean;
  letraInicioActual: string;
  letraFinActual: string;
  letraTotalSemanaAct: string;
  letraTotalSemanaAnt: string;
}

const buildRowTotalRefs = (grupoId: string, suffix: string, rowMap: Map<string, number>, colLetra: string) => {
  const plantasHijas = DEFINICION_GRUPOS[grupoId as keyof typeof DEFINICION_GRUPOS] || [];
  return plantasHijas.map(p => rowMap.get(`${p}_${suffix}`)).filter(r => r).map(r => `${colLetra}${r}`).join(",");
};

const procesarCategoria = (
  cat: string,
  grupo: any,
  esOB: boolean,
  context: ExcelContext,
  currentRowIndex: number
) => {
  const { datasetAct, datasetAnt, periodosRaw, anioActualInt, idxUltimoAnioAnterior, disableColorComparison, letraInicioActual, letraFinActual, letraTotalSemanaAct, letraTotalSemanaAnt } = context;
  const filaCat: any[] = [{ v: `   ${cat}`, t: 's', s: { border: BORDER_ALL } }];
  const plantasTarget = grupo.isAgrupado ? DEFINICION_GRUPOS[grupo.id as keyof typeof DEFINICION_GRUPOS] : grupo.id;

  let catTotalAct = 0;
  let catTotalAnt = 0;

  for (let cIdx = 0; cIdx < periodosRaw.length; cIdx++) {
    const per = periodosRaw[cIdx];
    const cVal = count(datasetAct, plantasTarget, esOB, per, cat);
    const aVal = count(datasetAnt, plantasTarget, esOB, per, cat);
    if (parsePeriodo(per).year === anioActualInt) {
      catTotalAct += cVal;
      catTotalAnt += aVal;
    }
    const extraStyle = (cIdx === idxUltimoAnioAnterior) ? BORDER_BOUNDARY_RIGHT : BORDER_ALL;
    filaCat.push({ v: cVal, t: 'n', s: getTrafficLightStyle(cVal, aVal, false, extraStyle, disableColorComparison) });
  }

  const sTotal = getTrafficLightStyle(catTotalAct, catTotalAnt, true, undefined, disableColorComparison);
  filaCat.push({ t: 'n', f: `SUM(${letraInicioActual}${currentRowIndex}:${letraFinActual}${currentRowIndex})`, v: catTotalAct, s: sTotal });
  filaCat.push({ v: catTotalAnt, t: 'n', s: { border: BORDER_ALL, alignment: { horizontal: "center" } } });
  filaCat.push({ t: 'n', f: `${letraTotalSemanaAct}${currentRowIndex}-${letraTotalSemanaAnt}${currentRowIndex}`, v: catTotalAct - catTotalAnt, s: sTotal });

  return filaCat;
};

const procesarGrupo = (
  grupo: any,
  esOB: boolean,
  context: ExcelContext,
  rowMap: Map<string, number>,
  currentRowIndex: number
) => {
  const { datasetAct, datasetAnt, periodosRaw, anioActualInt, idxUltimoAnioAnterior, disableColorComparison, letraInicioActual, letraFinActual, letraTotalSemanaAct, letraTotalSemanaAnt } = context;
  const suffix = esOB ? "OB" : "OM";
  const suffixDisplay = esOB ? "(OB)" : "(OM)";
  const rowCells: any[] = [];
  const matrixRows: any[][] = [];

  let valTotalActActual = 0;
  let valTotalAntActual = 0;

  rowCells.push({ v: `${grupo.label} ${suffixDisplay}`, t: 's', s: { font: { bold: true }, border: BORDER_ALL, fill: { fgColor: { rgb: "FFFFE0" } } } });

  for (let colIdx = 0; colIdx < periodosRaw.length; colIdx++) {
    const per = periodosRaw[colIdx];
    const excelColLetter = getColLetter(colIdx + 1);
    const plantasTarget = grupo.isAgrupado ? DEFINICION_GRUPOS[grupo.id as keyof typeof DEFINICION_GRUPOS] : grupo.id;
    const curVal = count(datasetAct, plantasTarget, esOB, per);
    const antVal = count(datasetAnt, plantasTarget, esOB, per);

    if (parsePeriodo(per).year === anioActualInt) {
      valTotalActActual += curVal;
      valTotalAntActual += antVal;
    }

    const extraStyle = (colIdx === idxUltimoAnioAnterior) ? BORDER_BOUNDARY_RIGHT : BORDER_ALL;
    const style = getTrafficLightStyle(curVal, antVal, grupo.isAgrupado, extraStyle, disableColorComparison);

    if (colIdx === 0) rowMap.set(`${grupo.id}_${suffix}`, currentRowIndex);

    if (grupo.isAgrupado) {
      const refs = buildRowTotalRefs(grupo.id, suffix, rowMap, excelColLetter);
      rowCells.push({ t: 'n', f: refs ? `SUM(${refs})` : undefined, v: curVal, s: style });
    } else {
      rowCells.push({ v: curVal, t: 'n', s: style });
    }
  }

  const styleTotalAct = getTrafficLightStyle(valTotalActActual, valTotalAntActual, true, undefined, disableColorComparison);

  if (grupo.isAgrupado) {
    const refs = buildRowTotalRefs(grupo.id, suffix, rowMap, letraTotalSemanaAct);
    rowCells.push({ t: 'n', f: refs ? `SUM(${refs})` : undefined, v: valTotalActActual, s: styleTotalAct });
  } else {
    rowCells.push({ t: 'n', f: `SUM(${letraInicioActual}${currentRowIndex}:${letraFinActual}${currentRowIndex})`, v: valTotalActActual, s: styleTotalAct });
  }

  rowCells.push({ v: valTotalAntActual, t: 'n', s: { border: BORDER_ALL, alignment: { horizontal: "center" }, font: { bold: true } } });
  rowCells.push({ t: 'n', f: `${letraTotalSemanaAct}${currentRowIndex}-${letraTotalSemanaAnt}${currentRowIndex}`, v: valTotalActActual - valTotalAntActual, s: styleTotalAct });

  matrixRows.push(rowCells);
  let nextRowIdx = currentRowIndex + 1;

  for (const cat of CATEGORIAS) {
    matrixRows.push(procesarCategoria(cat, grupo, esOB, context, nextRowIdx));
    nextRowIdx++;
  }
  matrixRows.push([]); // fila vacia

  return matrixRows;
};

const generarTablaResumen = (
  matrix: any[][],
  rowMap: Map<string, number>,
  anioAnteriorStr: string,
  anioActualInt: number,
  periodosRaw: string[],
  headersLabels: string[],
  letraTotalSemanaAct: string
) => {
  const colIdxResumen = headersLabels.length + 1;
  const idxAnioAntCol = periodosRaw.indexOf(anioAnteriorStr);
  const letraAnt = idxAnioAntCol !== -1 ? getColLetter(idxAnioAntCol + 1) : null;

  const buildRef = (id: string, col: string | null) => col && rowMap.has(id) ? `${col}${rowMap.get(id)}` : "0";

  type ResumenRow = any[] | { label: string; id?: string; fAnt?: string; fAct?: string };
  const resumenDefs: ResumenRow[] = [
    [{ v: "RESUMEN PLANTAS", t: 's', s: STYLE_HEADER_MAIN }],
    [{ v: "Planta", t: 's', s: STYLE_HEADER_MAIN }, { v: anioAnteriorStr, t: 's', s: STYLE_HEADER_MAIN }, { v: anioActualInt.toString(), t: 's', s: STYLE_HEADER_MAIN }],
    ...["PF1", "PF2", "PF3", "PF4", "PF5", "PF6", "CDT"].map(p => ({ label: p, id: `${p}_OM` })),
    { label: "OTROS", fAnt: letraAnt ? `SUM(${buildRef('DC_OM', letraAnt)},${buildRef('VENTAS_OM', letraAnt)},${buildRef('OTROS_OM', letraAnt)})` : "0", fAct: `SUM(${buildRef('DC_OM', letraTotalSemanaAct)},${buildRef('VENTAS_OM', letraTotalSemanaAct)},${buildRef('OTROS_OM', letraTotalSemanaAct)})` },
    { label: "PF OB", id: "PF ALIMENTOS_OB" }
  ];

  for (let idx = 0; idx < resumenDefs.length; idx++) {
    const rowDef = resumenDefs[idx];
    while (matrix[idx].length < colIdxResumen) matrix[idx].push({ v: "", t: "s" });
    if (Array.isArray(rowDef)) {
      matrix[idx].push(...rowDef);
    } else {
      const fA = (rowDef as any).fAnt || buildRef((rowDef as any).id!, letraAnt);
      const fH = (rowDef as any).fAct || buildRef((rowDef as any).id!, letraTotalSemanaAct);
      matrix[idx].push({ v: (rowDef as any).label, t: 's', s: BORDER_ALL }, { t: 'n', f: fA, s: BORDER_ALL }, { t: 'n', f: fH, s: BORDER_ALL });
    }
  }

  return colIdxResumen;
};

// --- FUNCIÓN PRINCIPAL ---
export const generarExcelReporte = async (
  dataActual: OrdenTrabajo[],
  dataAnterior: OrdenTrabajo[],
  modoVista: "ATRASOS" | "CUMPLIDAS",
  reporteActual: string
): Promise<ReporteExcel> => {
  const dataActualNorm = normalizeDatasetPeriods(dataActual);
  const dataAnteriorNorm = normalizeDatasetPeriods(dataAnterior);
  const disableColorComparison = dataAnteriorNorm.length === 0;

  const filterFn = (d: OrdenTrabajo) => modoVista === "CUMPLIDAS" ? d.clasificacion === "FINALIZADA" : d.clasificacion !== "FINALIZADA";
  const datasetAct = dataActualNorm.filter(filterFn);
  const datasetAnt = dataAnteriorNorm.filter(filterFn);

  if (datasetAct.length === 0) return { buffer: Buffer.alloc(0), fileName: 'reporte_vacio.xlsx' };

  try {
    const wb = XLSX.utils.book_new();
    const periodosRaw = Array.from(new Set([...datasetAct.map(d => d.periodo), ...datasetAnt.map(d => d.periodo)]))
      .filter(p => p !== "S/A" && p !== "S/D")
      .sort(sortPeriods);

    const anioActualInt = Number.parseInt(reporteActual.split('-')[0], 10);
    const anioAnteriorStr = (anioActualInt - 1).toString();

    // Identificar frontera de año de forma robusta
    const idxUltimoAnioAnterior = periodosRaw.findLastIndex(p => parsePeriodo(p).year < anioActualInt);

    const headersLabels = [`REPORTE ${modoVista}`, ...periodosRaw, `TOTAL ${anioActualInt}`, `TOTAL ${anioActualInt} S/A`, "DELTA"];
    const indicesAnioActual = periodosRaw
      .map((p, idx) => parsePeriodo(p).year === anioActualInt ? idx + 1 : -1)
      .filter(idx => idx !== -1);

    const letraInicioActual = getColLetter(indicesAnioActual[0]);
    const letraFinActual = getColLetter(indicesAnioActual[indicesAnioActual.length - 1]);

    const colIdxTotalSemanaAct = periodosRaw.length + 1;
    const colIdxTotalSemanaAnt = colIdxTotalSemanaAct + 1;
    const letraTotalSemanaAct = getColLetter(colIdxTotalSemanaAct);
    const letraTotalSemanaAnt = getColLetter(colIdxTotalSemanaAnt);

    const context: ExcelContext = {
      datasetAct, datasetAnt, periodosRaw, anioActualInt, idxUltimoAnioAnterior, disableColorComparison,
      letraInicioActual, letraFinActual, letraTotalSemanaAct, letraTotalSemanaAnt
    };

    const matrix: any[][] = [
      headersLabels.map((label, idx) => ({
        v: label, t: 's',
        s: (idx - 1 === idxUltimoAnioAnterior) ? { ...STYLE_HEADER_MAIN, border: BORDER_BOUNDARY_RIGHT } : STYLE_HEADER_MAIN
      }))
    ];

    const rowMap = new Map<string, number>();
    let currentRowIndex = 2; // Inicia en 2 por el header

    const ordenGrupos = [
      ...PLANTAS_INDIVIDUALES.map(p => ({ label: p, id: p, isAgrupado: false })),
      { label: "COMPLEJO", id: "COMPLEJO", isAgrupado: true },
      { label: "PF ALIMENTOS", id: "PF ALIMENTOS", isAgrupado: true }
    ];

    for (const esOB of [false, true]) {
      for (const grupo of ordenGrupos) {
        const rows = procesarGrupo(grupo, esOB, context, rowMap, currentRowIndex);
        matrix.push(...rows);
        currentRowIndex += rows.length;
      }
    }

    const colIdxResumen = generarTablaResumen(matrix, rowMap, anioAnteriorStr, anioActualInt, periodosRaw, headersLabels, letraTotalSemanaAct);

    const ws = XLSX.utils.aoa_to_sheet(matrix);
    ws['!merges'] = [{ s: { r: 0, c: colIdxResumen }, e: { r: 0, c: colIdxResumen + 2 } }];
    XLSX.utils.book_append_sheet(wb, ws, "RESUMEN_EJECUTIVO");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(datasetAct), "DATA_DETALLADA");

    return {
      buffer: XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' }),
      fileName: `Dashboard_${modoVista}_${reporteActual.split('-')[1] || reporteActual}.xlsx`
    };
  } catch (e) {
    console.error("Error Excel:", e);
    throw e;
  }
};