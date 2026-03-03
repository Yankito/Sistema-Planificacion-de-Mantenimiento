import XLSX from "xlsx-js-style";
import { PlannerService } from "./PlannerService.js";
import { type HorarioTecnico } from "../types.js";
import { query } from "../../../db/config.js";

/**
 * Normaliza las claves (cabeceras) de un array de objetos a mayúsculas sin espacios.
 * Permite tolerar variaciones de capitalización en las hojas de Excel.
 */
export const normalizarColumnas = (df: Record<string, unknown>[]) => {
  if (df.length === 0) return [];
  const keys = Object.keys(df[0]);
  return df.map(row => {
    const newRow: Record<string, unknown> = {};
    keys.forEach(k => {
      newRow[String(k).trim().toUpperCase()] = row[k];
    });
    return newRow;
  });
};

/**
 * Busca una hoja en el workbook de forma case-insensitive por su nombre.
 * Retorna la hoja si la encuentra o undefined si no existe.
 */
const findSheet = (sheets: { [key: string]: XLSX.WorkSheet }, name: string) => {
  const key = Object.keys(sheets).find(k => k.toUpperCase() === name.toUpperCase());
  return key ? sheets[key] : undefined;
};

/**
 * Construye un Map de técnico -> array de turnos (ej: ['M','T','N'...])
 * leyendo la hoja HORARIOS del workbook.
 * Cada fila contiene el nombre del técnico en la primera columna y los turnos en las siguientes.
 */
export const obtenerMapaHorarios = (sheets: { [key: string]: XLSX.WorkSheet }): Map<string, string[]> => {
  const sheet = findSheet(sheets, "HORARIOS");
  if (!sheet) {
    console.warn("Hoja HORARIOS no encontrada (case-insensitive check failed).");
    return new Map();
  }

  const dfHorarios = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
  const mapa = new Map<string, string[]>();

  dfHorarios.slice(1).forEach(fila => {
    if (fila.length > 0) {
      const nombreTec = String(fila[0] || "").trim().toUpperCase();
      if (nombreTec) {
        const turnos = fila.slice(1).map(v => String(v || "L").trim().toUpperCase());
        mapa.set(nombreTec, turnos);
      }
    }
  });
  return mapa;
};

/**
 * Orquesta el proceso de planificación a partir de un workbook de Excel.
 * Lee las hojas B.ANT, B.ACT, CUMPLIMIENTO y EMPLEADOS, normaliza los datos
 * y ejecuta el algoritmo seleccionado (STRICT o BALANCED).
 *
 * @param sheets - Hojas del workbook indexadas por nombre
 * @param modo - 'STRICT' para continuidad histórica, 'BALANCED' para carga equilibrada
 * @returns Resultado de planificación más los mapas de horarios completos
 */
export const processExcelData = (
  sheets: { [key: string]: XLSX.WorkSheet },
  modo: 'STRICT' | 'BALANCED' = 'STRICT'
) => {
  const getSheetData = (name: string) => {
    const sheet = findSheet(sheets, name);
    if (!sheet) {
      console.warn(`Hoja "${name}" no encontrada en el archivo Excel.`);
      return [];
    }
    return XLSX.utils.sheet_to_json(sheet) as Record<string, unknown>[];
  };

  const dfAnt = normalizarColumnas(getSheetData("B.ANT"));
  const dfAct = normalizarColumnas(getSheetData("B.ACT"));

  const dfCumplimiento = normalizarColumnas(getSheetData("CUMPLIMIENTO"));
  const dfTecnicos = normalizarColumnas(getSheetData("EMPLEADOS"));

  if (dfAct.length === 0) {
    throw new Error("No se encontraron datos en la hoja 'B.ACT'");
  }

  // Construir mapa de técnicos con búsqueda flexible de cabeceras
  const tecnicosMap = new Map();
  dfTecnicos.forEach(emp => {
    const colEmp = Object.keys(emp).find(k =>
      k.includes("EMPLEADO") || k.includes("NOMBRE") || k.includes("TECNICO") || k.includes("TÉCNICO")
    );
    const key = String(colEmp ? emp[colEmp] : (emp["EMPLEADO"] || "")).trim().toUpperCase();

    if (key && key !== "UNDEFINED") {
      const colPlanta = Object.keys(emp).find(k => k.includes("PLANTA") || k.includes("UBICACION") || k.includes("UBICACIÓN")) || "PLANTA";
      const colRol = Object.keys(emp).find(k => k.includes("ROL") || k.includes("CARGO") || k.includes("ESPECIALIDAD")) || "ROL";

      tecnicosMap.set(key, {
        planta: String(emp[colPlanta] || "SIN PLANTA").trim().toUpperCase(),
        rol: String(emp[colRol] || "M").trim().toUpperCase()
      });
    }
  });

  const mapaHorarios = obtenerMapaHorarios(sheets);

  // Ejecutar el algoritmo según el modo seleccionado
  let resultadoPlanificacion;

  if (modo === 'BALANCED') {
    resultadoPlanificacion = PlannerService.generarPlanificacionEquilibrada(
      dfAct,
      dfAnt,
      dfCumplimiento,
      tecnicosMap
    );
  } else {
    resultadoPlanificacion = PlannerService.generarPlanificacion(
      dfAct,
      dfAnt,
      dfCumplimiento,
      tecnicosMap,
      mapaHorarios
    );
  }

  const horariosCompletos = obtenerHorariosDesdeSheets(sheets);

  return {
    resultados: resultadoPlanificacion.resultados,
    sinAsignar: resultadoPlanificacion.sinAsignar,
    tecnicosMap: Object.fromEntries(tecnicosMap),
    mapaHorarios: Object.fromEntries(mapaHorarios),
    horariosCompletos
  };
};

/**
 * Extrae la lista completa de técnicos y sus turnos desde la hoja HORARIOS del workbook.
 * Retorna un array de objetos { nombre, turnos[] } para uso en visualización.
 */
const obtenerHorariosDesdeSheets = (sheets: { [key: string]: XLSX.WorkSheet }) => {
  const sheet = findSheet(sheets, "HORARIOS");
  if (!sheet) return [];
  const dfHorarios = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

  return dfHorarios.slice(1)
    .filter(fila => fila.length > 0 && fila[0])
    .map(fila => {
      const nombre = String(fila[0]).trim().toUpperCase();
      const turnos = fila.slice(1, 32).map(v => String(v || "L").trim().toUpperCase());
      return { nombre, turnos };
    });
};

/**
 * Obtiene los horarios de los técnicos de una planta específica desde un workbook.
 * Cruza la hoja HORARIOS con la hoja EMPLEADOS para filtrar por planta y obtener el rol.
 *
 * @param workbook - El libro de Excel completo
 * @param plantaSel - Planta a filtrar (ej: 'PF1', 'SADEMA')
 * @returns Array de HorarioTecnico con nombre, rol, planta y turnos
 */
export const obtenerHorariosPorPlanta = (workbook: XLSX.WorkBook, plantaSel: string): HorarioTecnico[] => {
  const sheet = workbook.Sheets["HORARIOS"];
  const sheetEmp = workbook.Sheets["EMPLEADOS"];
  if (!sheet || !sheetEmp) return [];

  const dfHorarios = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
  const dfTecnicos = normalizarColumnas(XLSX.utils.sheet_to_json(sheetEmp) as Record<string, unknown>[]);

  // Construir mapa nombre -> rol con búsqueda flexible de columnas
  const rolesMap = new Map();
  dfTecnicos.forEach(e => {
    const colEmp = Object.keys(e).find(k => k.includes("EMPLEADO") || k.includes("NOMBRE")) || "EMPLEADO";
    const colRol = Object.keys(e).find(k => k.includes("ROL") || k.includes("CARGO")) || "ROL";
    rolesMap.set(String(e[colEmp]).trim().toUpperCase(), String(e[colRol] || "M").trim().toUpperCase());
  });

  // Filtrar los nombres de técnicos que pertenecen a la planta seleccionada
  const tecnicosFiltrados = dfTecnicos
    .filter(e => {
      const colPlanta = Object.keys(e).find(k => k.includes("PLANTA")) || "PLANTA";
      const plantaEmp = String(e[colPlanta] || "").trim().toUpperCase();
      const seleccion = plantaSel.toUpperCase();
      return seleccion === "SADEMA" ? plantaEmp === "SADEMA" : plantaEmp.includes(seleccion);
    })
    .map(e => {
      const colEmp = Object.keys(e).find(k => k.includes("EMPLEADO") || k.includes("NOMBRE")) || "EMPLEADO";
      return String(e[colEmp] || "").trim().toUpperCase();
    });

  // Recuperar turnos de la hoja HORARIOS solo para los técnicos filtrados
  return dfHorarios.slice(1)
    .filter(fila => {
      const nombreEnFila = String(fila[0] || "").trim().toUpperCase();
      return nombreEnFila && tecnicosFiltrados.includes(nombreEnFila);
    })
    .map(fila => {
      const nombreTec = String(fila[0]).trim().toUpperCase();
      return {
        nombre: nombreTec,
        rol: rolesMap.get(nombreTec) || "M",
        planta: plantaSel,
        turnos: fila.slice(1, 32).map(v => String(v || "L").trim().toUpperCase())
      };
    });
};