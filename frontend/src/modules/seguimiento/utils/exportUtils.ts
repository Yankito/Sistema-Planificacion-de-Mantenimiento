import * as XLSX from "xlsx-js-style";
import type { AtrasoRow, FilaExcel } from "../types.js";

// --- CONSTANTES ---
const PLANTAS_INDIVIDUALES = ["PF1", "PF2", "PF3", "PF4", "PF5", "PF6", "CDT", "MPS", "DC", "VENTAS", "OTROS"];
const CATEGORIAS = ["TECNICO / SERVICIO", "PROGRAMADOR", "OC / OTRO"];

const DEFINICION_GRUPOS: Record<string, string[]> = {
  "COMPLEJO": ["PF3", "PF4", "PF5", "PF6", "CDT", "DC", "VENTAS", "OTROS"],
  "PF ALIMENTOS": ["PF1", "PF2", "PF3", "PF4", "PF5", "PF6", "CDT", "DC", "VENTAS", "OTROS"]
};

// --- ESTILOS ---
const BORDER_ALL = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
const BORDER_2025_RIGHT = { ...BORDER_ALL, right: { style: "medium" } };
const STYLE_HEADER_MAIN = {
  fill: { fgColor: { rgb: "FFFF00" } },
  font: { bold: true },
  alignment: { horizontal: "center" },
  border: BORDER_ALL
};

// --- HELPERS TIPADOS ---
const getTrafficLightStyle = (current: number, previous: number, isBold: boolean = false, extraBorder?: object) => {
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

const getColLetter = (colIndex: number): string => {
  let letter = '';
  let temp = colIndex + 1;
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter;
};

const count = (data: AtrasoRow[], planta: string | string[], esOB: boolean, periodo: string, cat?: string): number => {
  return data.filter(d => {
    const matchPlanta = Array.isArray(planta) ? planta.includes(d.planta) : d.planta === planta;
    const matchTipo = d.esOB === esOB;
    const matchPeriodo = d.periodo === periodo;
    const matchCat = cat ? d.clasificacion === cat : true;
    return matchPlanta && matchTipo && matchPeriodo && matchCat;
  }).length;
};

// --- FUNCIÓN PRINCIPAL ---
export const exportarReporteCompleto = async (
  dataActual: AtrasoRow[],
  dataAnterior: AtrasoRow[],
  modoVista: "ATRASOS" | "CUMPLIDAS",
  reporteActual: string
): Promise<void> => {
  const datasetAct = dataActual.filter(d => modoVista === "CUMPLIDAS" ? d.clasificacion === "CUMPLIDA" : d.clasificacion !== "CUMPLIDA");
  const datasetAnt = dataAnterior.filter(d => modoVista === "CUMPLIDAS" ? d.clasificacion === "CUMPLIDA" : d.clasificacion !== "CUMPLIDA");

  if (datasetAct.length === 0) return;

  try {
    const wb = XLSX.utils.book_new();
    const periodosRaw = Array.from(new Set([...datasetAct.map(d => d.periodo), ...datasetAnt.map(d => d.periodo)]))
      .filter(p => p !== "S/A" && p !== "S/D")
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    const anioFull = reporteActual.split('-')[0];
    const anioShort = anioFull.slice(-2);
    const columnasPeriodos = [...periodosRaw];

    // SOLUCIÓN findLastIndex: Alternativa compatible con navegadores antiguos y TS < ES2023
    let idxUltimoAnioAnterior = -1;
    for (let i = columnasPeriodos.length - 1; i >= 0; i--) {
      const p = columnasPeriodos[i];
      if (!p.includes(anioFull) && !p.endsWith(`-${anioShort}`)) {
        idxUltimoAnioAnterior = i;
        break;
      }
    }

    const headersLabels = [`REPORTE ${modoVista}`, ...columnasPeriodos, `TOTAL ${anioFull}`, `TOTAL ${anioFull} S/A`, "DELTA"];

    const indicesAnioActual = columnasPeriodos
      .map((p, idx) => (p.includes(anioFull) || p.endsWith(`-${anioShort}`)) ? idx + 1 : -1)
      .filter(idx => idx !== -1);

    const letraInicioActual = getColLetter(indicesAnioActual[0] || 0);
    const letraFinActual = getColLetter(indicesAnioActual[indicesAnioActual.length - 1] || 0);

    const headerRow: FilaExcel = headersLabels.map((label, idx) => {
      const isFrontera = (idx - 1 === idxUltimoAnioAnterior);
      return { v: label, t: 's', s: isFrontera ? { ...STYLE_HEADER_MAIN, border: BORDER_2025_RIGHT } : STYLE_HEADER_MAIN };
    });

    // Cambiado any[][] por unknown[][] para mayor seguridad o usar objetos de celda de XLSX
    const matrix: FilaExcel[] = [headerRow];
    const rowMap = new Map<string, number>();
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
        const rowCells: FilaExcel = [];
        let valTotalActActual = 0;
        let valTotalAntActual = 0;

        rowCells.push({ v: `${grupo.label} ${suffixDisplay}`, t: 's', s: { font: { bold: true }, border: BORDER_ALL, fill: { fgColor: { rgb: "FFFFE0" } } } });

        columnasPeriodos.forEach((per, colIdx) => {
          const excelColLetter = getColLetter(colIdx + 1);
          const plantasTarget = grupo.isAgrupado ? DEFINICION_GRUPOS[grupo.id] : grupo.id;

          const curVal = count(datasetAct, plantasTarget, esOB, per);
          const antVal = count(datasetAnt, plantasTarget, esOB, per);

          if (per.includes(anioFull) || per.endsWith(`-${anioShort}`)) {
            valTotalActActual += curVal;
            valTotalAntActual += antVal;
          }

          const extraStyle = (colIdx === idxUltimoAnioAnterior) ? BORDER_2025_RIGHT : BORDER_ALL;
          const style = getTrafficLightStyle(curVal, antVal, grupo.isAgrupado, extraStyle);

          if (grupo.isAgrupado) {
            const plantasHijas = DEFINICION_GRUPOS[grupo.id];
            const filasReferencias = plantasHijas.map(p => rowMap.get(`${p}_${suffix}`)).filter((r): r is number => r !== undefined);
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

        const styleTotalAct = getTrafficLightStyle(valTotalActActual, valTotalAntActual, true);

        if (grupo.isAgrupado) {
          const plantasHijas = DEFINICION_GRUPOS[grupo.id];
          const filasRefs = plantasHijas.map(p => rowMap.get(`${p}_${suffix}`)).filter((r): r is number => r !== undefined);
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
          const filaCat: FilaExcel = [{ 
            v: `   ${cat}`, 
            t: 's', 
            s: { border: BORDER_ALL } 
          }];
          const plantasTarget = grupo.isAgrupado ? DEFINICION_GRUPOS[grupo.id] : grupo.id;
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

          filaCat.push({ t: 'n', f: `SUM(${letraInicioActual}${currentRowIndex}:${letraFinActual}${currentRowIndex})`, v: catTotalAct, s: getTrafficLightStyle(catTotalAct, catTotalAnt, true) });
          filaCat.push({ v: catTotalAnt, t: 'n', s: { border: BORDER_ALL, alignment: { horizontal: "center" } } });
          filaCat.push({ t: 'n', f: `${letraTotalAct}${currentRowIndex}-${letraTotalAnt}${currentRowIndex}`, v: catTotalAct - catTotalAnt, s: getTrafficLightStyle(catTotalAct, catTotalAnt, true) });

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
        Tecnicos: item.detallesTecnicos?.map(t => t.tecnico).join(", ") || "" 
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dataRaw), "DATA_DETALLADA");

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    
    const semanaLabel = reporteActual.includes('-') ? reporteActual.split('-')[1] : reporteActual;
    const nombreArchivo = `Dashboard_Atrasos_${semanaLabel}.xlsx`;

    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = nombreArchivo;
    anchor.click();
    window.URL.revokeObjectURL(url);

  } catch (e) { 
    console.error("Error al exportar:", e); 
  }
};