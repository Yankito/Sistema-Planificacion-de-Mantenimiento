// src/logic/excelProcessor.ts
import XLSX from "xlsx-js-style";
import { PlannerService } from "./PlannerService.js";
import { type HorarioTecnico } from "../types.js";
import { query } from "../../../db/config.js";

export const normalizarColumnas = (df: any[]) => {
  if (df.length === 0) return [];
  const keys = Object.keys(df[0]);
  return df.map(row => {
    const newRow: any = {};
    keys.forEach(k => {
      newRow[String(k).trim().toUpperCase()] = row[k];
    });
    return newRow;
  });
};


const findSheet = (sheets: { [key: string]: XLSX.WorkSheet }, name: string) => {
  const key = Object.keys(sheets).find(k => k.toUpperCase() === name.toUpperCase());
  return key ? sheets[key] : undefined;
};

export const obtenerMapaHorarios = (sheets: { [key: string]: XLSX.WorkSheet }): Map<string, string[]> => {
  console.log("Iniciando extracción de horarios desde hoja HORARIOS...");
  const sheet = findSheet(sheets, "HORARIOS");
  if (!sheet) {
    console.warn("Hoja HORARIOS no encontrada (case-insensitive check failed).");
    return new Map();
  }
  console.log("Procesando hoja HORARIOS para obtener mapa de horarios por técnico");

  // Usamos header: 1 para obtener un array de arrays
  const dfHorarios = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
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
  console.log(`Mapa de horarios obtenido: ${mapa.size} técnicos encontrados.`);
  return mapa;
};

// --- CAMBIO PRINCIPAL AQUÍ ---
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
    return XLSX.utils.sheet_to_json(sheet);
  };

  const dfAnt = normalizarColumnas(getSheetData("B.ANT"));
  const dfAct = normalizarColumnas(getSheetData("B.ACT"));

  const dfCumplimiento = normalizarColumnas(getSheetData("CUMPLIMIENTO"));
  const dfTecnicos = normalizarColumnas(getSheetData("EMPLEADOS"));

  if (dfAct.length === 0) {
    throw new Error("No se encontraron datos en la hoja 'B.ACT'");
  }

  const tecnicosMap = new Map();
  dfTecnicos.forEach(emp => {
    // Buscar columna que identifique al empleado
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

  // DECIDIR QUÉ ALGORITMO EJECUTAR
  let resultadoPlanificacion;

  if (modo === 'BALANCED') {
    // Modo Nuevo: Carga Equilibrada
    resultadoPlanificacion = PlannerService.generarPlanificacionEquilibrada(
      dfAct,
      dfAnt,
      dfCumplimiento,
      tecnicosMap
    );
  } else {
    // Modo Original: Prioridad Turnos (STRICT)
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

const obtenerHorariosDesdeSheets = (sheets: { [key: string]: XLSX.WorkSheet }) => {
  const sheet = findSheet(sheets, "HORARIOS");
  if (!sheet) return [];
  const dfHorarios = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

  return dfHorarios.slice(1)
    .filter(fila => fila.length > 0 && fila[0])
    .map(fila => {
      const nombre = String(fila[0]).trim().toUpperCase();
      const turnos = fila.slice(1, 32).map(v => String(v || "L").trim().toUpperCase());
      return { nombre, turnos };
    });
};

export const obtenerHorariosPorPlanta = (workbook: XLSX.WorkBook, plantaSel: string): HorarioTecnico[] => {
  const sheet = workbook.Sheets["HORARIOS"];
  const sheetEmp = workbook.Sheets["EMPLEADOS"];
  if (!sheet || !sheetEmp) return [];

  console.log(`Buscando horarios para planta: ${plantaSel}`);
  const dfHorarios = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];
  const dfTecnicos = normalizarColumnas(XLSX.utils.sheet_to_json(sheetEmp));

  console.log(`Total técnicos en EMPLEADOS: ${dfTecnicos.length}`);

  const rolesMap = new Map();
  dfTecnicos.forEach(e => {
    // Usamos búsqueda flexible de cabeceras en normalizarColumnas
    const colEmp = Object.keys(e).find(k => k.includes("EMPLEADO") || k.includes("NOMBRE")) || "EMPLEADO";
    const colRol = Object.keys(e).find(k => k.includes("ROL") || k.includes("CARGO")) || "ROL";
    rolesMap.set(String(e[colEmp]).trim().toUpperCase(), String(e[colRol] || "M").trim().toUpperCase());
  });

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

export const savePlanningToDB = async (snapshotId: number, processData: any) => {
  const { tecnicosMap, horariosCompletos } = processData;

  // 1. Actualizar Maestro de Empleados
  for (const [nombre, info] of Object.entries(tecnicosMap)) {
    const { planta, rol } = info as any;
    await query(`
      INSERT INTO empleados (nombre, planta, rol)
      VALUES ($1, $2, $3)
      ON CONFLICT (nombre) DO UPDATE SET planta = $2, rol = $3
    `, [nombre, planta, rol]);
  }

  // 2. Guardar Matriz de Horarios para este Snapshot
  for (const h of horariosCompletos) {
    await query(`
      INSERT INTO horarios (snapshot_id, empleado_nombre, turnos)
      VALUES ($1, $2, $3)
      ON CONFLICT (snapshot_id, empleado_nombre) DO UPDATE SET turnos = $3
    `, [snapshotId, h.nombre, JSON.stringify(h.turnos)]);
  }
};