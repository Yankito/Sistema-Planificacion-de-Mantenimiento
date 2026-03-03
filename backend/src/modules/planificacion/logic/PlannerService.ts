import { type PlanResult, type PlanningOT } from "../types.js";
import { excelDateToJS, formatearFecha, evitarDomingo, getWeekId } from "../utils/dateHelpers.js";
import { limpiarKey, buscarNombreEnFila, mapDepartamentoAPlanta } from "../utils/excelHelpers.js";
import { buscarNocheComun } from "./turnosLogic.js";
import { distribuirCargaEquilibrada } from "./peakShavingLogic.js";
import { necesitaValidacionTurno } from "../utils/planificacionUtils.js";

/**
 * Servicio principal del módulo de Planificación.
 * Implementa dos algoritmos de asignación de OTs a técnicos:
 *   1. STRICT (generarPlanificacion): prioriza continuidad de técnicos históricos
 *      y busca fechas en las que todos los técnicos coincidan en turno nocturno.
 *   2. BALANCED (generarPlanificacionEquilibrada): distribuye la carga equitativamente
 *      entre días de la semana usando un algoritmo de Peak Shaving.
 */
export class PlannerService {

  /**
   * Genera una planificación con continuidad histórica (modo STRICT).
   * Para cada OT del período actual:
   *   1. Busca su registro equivalente en el período anterior (por activo + descripción).
   *   2. Identifica los técnicos que la ejecutaron en el período anterior.
   *   3. Valida que dichos técnicos tengan turno nocturno coincidente cerca de la fecha proyectada.
   *   4. Si no hay noche común disponible, la OT queda en sinAsignar.
   *
   * @param dfAct - OTs a planificar del período actual
   * @param dfAnt - OTs históricas del período anterior
   * @param dfCumplimiento - Técnicos asignados a OTs en el período anterior
   * @param tecnicosMap - Mapa nombre -> { planta, rol }
   * @param mapaHorarios - Mapa nombre -> array de 31 turnos del mes
   */
  static generarPlanificacion(
    dfAct: Record<string, unknown>[],
    dfAnt: Record<string, unknown>[],
    dfCumplimiento: Record<string, unknown>[],
    tecnicosMap: Map<string, { planta: string, rol: string }>,
    mapaHorarios: Map<string, string[]>
  ): { resultados: PlanResult[], sinAsignar: Record<string, unknown>[] } {
    const resultados: PlanResult[] = [];
    const sinAsignar: Record<string, unknown>[] = [];

    dfAct.forEach(filaAct => {
      // --- 1. Extracción de datos de la OT actual ---
      const deptoKey = Object.keys(filaAct).find(k => k.includes("DEPARTAMENTO")) || "";
      const plantaActual = mapDepartamentoAPlanta(String(filaAct[deptoKey] || ""));
      const otKeyAct = Object.keys(filaAct).find(k => k.includes("PEDIDO") || k.includes("TRABAJO")) || "";
      const nroOrdenActual = String(filaAct[otKeyAct] || "PENDIENTE");
      const actRaw = limpiarKey(filaAct["NÚMERO DE ACTIVO"] || filaAct["NUMERO DE ACTIVO"]);
      const descRaw = limpiarKey(filaAct["DESCRIPCIÓN"] || filaAct["DESCRIPCION"]);

      if (!actRaw || !descRaw || actRaw === "0") {
        sinAsignar.push({ ...filaAct, tecnicos: [], error: "DATOS INCOMPLETOS", planta: plantaActual });
        return;
      }

      // --- 2. Búsqueda del antecedente histórico por combinación activo|descripción ---
      const keyBusqueda = `${actRaw}|${descRaw}`;
      const matchAnt = dfAnt.find(filaAnt => {
        const actAnt = limpiarKey(filaAnt["NÚMERO DE ACTIVO"] || filaAnt["NUMERO DE ACTIVO"]);
        const descAnt = limpiarKey(filaAnt["DESCRIPCIÓN"] || filaAnt["DESCRIPCION"]);
        return `${actAnt}|${descAnt}` === keyBusqueda;
      });

      if (matchAnt) {
        const fechaKeyAnt = Object.keys(matchAnt).find(k => k.includes("FECHA INICIAL PROGRAMADA")) || "";
        const fechaAntJS = excelDateToJS(matchAnt[fechaKeyAnt]);
        const fechaAntStr = formatearFecha(fechaAntJS);

        const otKeyAnt = Object.keys(matchAnt).find(k => k.includes("PEDIDO") || k.includes("TRABAJO")) || "";
        const otAntId = String(matchAnt[otKeyAnt] || "").trim();

        // --- 3. Identificar técnicos que ejecutaron esta OT en el período anterior ---
        const colOtC = Object.keys(dfCumplimiento[0] || {}).find(c => c.includes("NRO_OT") || c.includes("PEDIDO")) || "";
        const cumplimientos = dfCumplimiento.filter(cum => String(cum[colOtC]).includes(otAntId));

        let listaNombres: string[] = [];
        if (cumplimientos.length > 0) {
          listaNombres = cumplimientos.map(c => {
            const colEmp = Object.keys(c).find(k => k.includes("EMPLEADO")) || "EMPLEADO";
            return String(c[colEmp] || "").trim().toUpperCase();
          }).filter(n => n !== "");
        }

        // Fallback: buscar nombre directamente en la fila del historial
        if (listaNombres.length === 0) {
          const n = buscarNombreEnFila(matchAnt);
          if (n) listaNombres.push(n);
        }

        if (listaNombres.length === 0) listaNombres.push("SIN HISTORIAL");
        listaNombres = [...new Set(listaNombres)];

        // Enriquecer con datos del mapa de técnicos y sus horarios
        const tecnicosData = listaNombres.map(nombre => {
          const datos = tecnicosMap.get(nombre);
          const turnos = mapaHorarios.get(nombre);
          return {
            nombre,
            rol: datos?.rol || "M",
            turnos: turnos || null,
            existe: !!datos
          };
        });

        const objetoOT = {
          nroOrden: nroOrdenActual,
          equipo: actRaw,
          descripcion: descRaw,
          fechaAnterior: fechaAntStr,
          tecnicos: tecnicosData,
          planta: plantaActual
        };

        // --- 4. Validar coincidencia de turno nocturno ---
        // Solo aplica a roles que requieren validación (no Supervisores ni SE)
        const tecnicosQueValidan = tecnicosData.filter(t => necesitaValidacionTurno(t.rol));
        const turnosParaValidar = tecnicosQueValidan.map(t => t.turnos).filter(t => t !== null) as string[][];

        let fechaSugerida = new Date(fechaAntJS);
        fechaSugerida.setMonth(fechaSugerida.getMonth() + 1);

        if (tecnicosQueValidan.length === 0) {
          // Solo Supervisores/SE: asignar fecha proyectada directamente
          const fechaFinal = evitarDomingo(fechaSugerida);
          resultados.push({ ...objetoOT, fechaSugerida: formatearFecha(fechaFinal) });
        } else if (turnosParaValidar.length > 0) {
          // Buscar el primer día cercano donde todos tengan turno 'N' (nocturno)
          let fechaFinal = buscarNocheComun(fechaSugerida, turnosParaValidar);
          if (fechaFinal) {
            fechaFinal = evitarDomingo(fechaFinal);
            resultados.push({ ...objetoOT, fechaSugerida: formatearFecha(fechaFinal) });
          } else {
            sinAsignar.push({ ...objetoOT, error: "SIN NOCHE COMUN DISPONIBLE" });
          }
        } else {
          // Los técnicos requieren validación pero no tienen horarios cargados
          sinAsignar.push({ ...objetoOT, error: "SIN TURNOS CARGADOS (REQUERIDOS)" });
        }
      } else {
        // La OT no tiene antecedente histórico: queda sin asignar como "OT NUEVA"
        sinAsignar.push({
          ...filaAct,
          nroOrden: nroOrdenActual,
          equipo: actRaw, descripcion: descRaw,
          tecnicos: [{ nombre: "OT NUEVA", rol: "M" }],
          fechaAnterior: "N/A", planta: plantaActual
        });
      }
    });
    return { resultados, sinAsignar };
  }

  /**
   * Genera una planificación con distribución equilibrada de carga (modo BALANCED).
   * Para cada OT del período actual:
   *   1. Calcula la fecha ideal proyectando el mes siguiente al histórico.
   *   2. Determina los roles requeridos según los técnicos del período anterior.
   *   3. Crea vacantes (VACANTE) por rol en lugar de asignar técnicos específicos.
   *   4. Delega la distribución final por día/semana al módulo de Peak Shaving.
   *
   * @param dfAct - OTs a planificar del período actual
   * @param dfAnt - OTs históricas del período anterior
   * @param dfCumplimiento - Técnicos asignados a OTs en el período anterior
   * @param tecnicosMap - Mapa nombre -> { planta, rol }
   */
  static generarPlanificacionEquilibrada(
    dfAct: Record<string, unknown>[],
    dfAnt: Record<string, unknown>[],
    dfCumplimiento: Record<string, unknown>[],
    tecnicosMap: Map<string, { planta: string, rol: string }>
  ): { resultados: PlanResult[], sinAsignar: Record<string, unknown>[] } {

    const sinAsignar: Record<string, unknown>[] = [];
    const ordenesParaDistribuir: PlanningOT[] = [];

    // --- 1. Preparación: extraer fechas ideales y roles requeridos por OT ---
    dfAct.forEach(filaAct => {
      const deptoKey = Object.keys(filaAct).find(k => k.includes("DEPARTAMENTO")) || "";
      const plantaActual = mapDepartamentoAPlanta(String(filaAct[deptoKey] || ""));
      const otKeyAct = Object.keys(filaAct).find(k => k.includes("PEDIDO") || k.includes("TRABAJO")) || "";
      const nroOrden = String(filaAct[otKeyAct] || "PENDIENTE");
      const equipo = limpiarKey(filaAct["NÚMERO DE ACTIVO"] || filaAct["NUMERO DE ACTIVO"]);
      const descripcion = limpiarKey(filaAct["DESCRIPCIÓN"] || filaAct["DESCRIPCION"]);

      if (!equipo || !descripcion || equipo === "0") {
        sinAsignar.push({ ...filaAct, tecnicos: [], error: "DATOS INCOMPLETOS", planta: plantaActual });
        return;
      }

      const keyBusqueda = `${equipo}|${descripcion}`;
      const matchAnt = dfAnt.find(filaAnt => {
        const actAnt = limpiarKey(filaAnt["NÚMERO DE ACTIVO"] || filaAnt["NUMERO DE ACTIVO"]);
        const descAnt = limpiarKey(filaAnt["DESCRIPCIÓN"] || filaAnt["DESCRIPCION"]);
        return `${actAnt}|${descAnt}` === keyBusqueda;
      });

      let fechaIdeal: Date;
      let tecnicosSlots: PlanningOT['tecnicos'] = [];
      let fechaAnteriorStr = "N/A";

      if (matchAnt) {
        const fechaKeyAnt = Object.keys(matchAnt).find(k => k.includes("FECHA INICIAL PROGRAMADA")) || "";
        const fechaAntJS = excelDateToJS(matchAnt[fechaKeyAnt]);
        fechaAnteriorStr = formatearFecha(fechaAntJS);

        // Proyectar la fecha un mes hacia adelante
        fechaIdeal = new Date(fechaAntJS);
        fechaIdeal.setMonth(fechaIdeal.getMonth() + 1);

        // Determinar roles requeridos en base a los técnicos históricos
        const otKeyAnt = Object.keys(matchAnt).find(k => k.includes("PEDIDO") || k.includes("TRABAJO")) || "";
        const otAntId = String(matchAnt[otKeyAnt] || "").trim();
        const colOtC = Object.keys(dfCumplimiento[0] || {}).find(c => c.includes("NRO_OT") || c.includes("PEDIDO")) || "";
        const cumplimientos = dfCumplimiento.filter(cum => String(cum[colOtC]).includes(otAntId));

        let rolesRequeridos: string[] = [];
        if (cumplimientos.length > 0) {
          const nombresUnicos = new Set<string>();
          cumplimientos.forEach(c => {
            const colEmp = Object.keys(c).find(k => k.includes("EMPLEADO")) || "EMPLEADO";
            const nombre = String(c[colEmp] || "").trim().toUpperCase();
            if (nombre) nombresUnicos.add(nombre);
          });
          nombresUnicos.forEach(nombre => {
            const datosEmp = tecnicosMap.get(nombre);
            rolesRequeridos.push(datosEmp ? datosEmp.rol : "M");
          });
        }
        if (rolesRequeridos.length === 0) rolesRequeridos.push("M");
        rolesRequeridos.sort();

        // Crear slots de VACANTE por cada rol requerido
        tecnicosSlots = rolesRequeridos.map(rol => ({
          nombre: "VACANTE",
          rol: rol,
          turnos: null,
          existe: true
        }));

      } else {
        // Sin historial: usar fecha del Excel o fecha actual, con un slot de Mecánico
        const fechaKeyAct = Object.keys(filaAct).find(k => k.includes("FECHA INICIAL PROGRAMADA")) || "";
        fechaIdeal = filaAct[fechaKeyAct] ? excelDateToJS(filaAct[fechaKeyAct]) : new Date();
        tecnicosSlots = [{ nombre: "VACANTE", rol: "M", turnos: null, existe: true }];
      }

      // Ajustar la fecha ideal para que no caiga en fin de semana
      let fechaAjustada = new Date(fechaIdeal);
      const diaSem = fechaAjustada.getDay();
      if (diaSem === 0) fechaAjustada.setDate(fechaAjustada.getDate() + 1);
      if (diaSem === 6) fechaAjustada.setDate(fechaAjustada.getDate() - 1);

      ordenesParaDistribuir.push({
        nroOrden,
        equipo,
        descripcion,
        fechaAnterior: fechaAnteriorStr,
        tecnicos: tecnicosSlots,
        planta: plantaActual,
        fechaIdeal: fechaAjustada,
        semana: getWeekId(fechaAjustada)
      });

    });

    // --- 2. Delegar la distribución equitativa al algoritmo de Peak Shaving ---
    const resultados = distribuirCargaEquilibrada(ordenesParaDistribuir);

    return { resultados, sinAsignar };
  }
}