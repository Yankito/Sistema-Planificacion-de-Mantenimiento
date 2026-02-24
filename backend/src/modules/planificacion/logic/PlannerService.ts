import { type PlanResult, type PlanningOT } from "../types.js";
import { excelDateToJS, formatearFecha, evitarDomingo, getWeekId } from "../utils/dateHelpers.js";
import { limpiarKey, buscarNombreEnFila, mapDepartamentoAPlanta } from "../utils/excelHelpers.js";
import { buscarNocheComun } from "./turnosLogic.js";
import { distribuirCargaEquilibrada } from "./peakShavingLogic.js";
import { necesitaValidacionTurno } from "../utils/planificacionUtils.js";

export class PlannerService {

  // --- MÉTODO 1: PLANIFICACIÓN STRICT (ORIGINAL) ---
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
      // 1. Extracción de Datos
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

      // 2. Búsqueda de Historial
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

        // 3. Buscar Técnicos
        const colOtC = Object.keys(dfCumplimiento[0] || {}).find(c => c.includes("NRO_OT") || c.includes("PEDIDO")) || "";
        const cumplimientos = dfCumplimiento.filter(cum => String(cum[colOtC]).includes(otAntId));

        let listaNombres: string[] = [];
        if (cumplimientos.length > 0) {
          listaNombres = cumplimientos.map(c => {
            const colEmp = Object.keys(c).find(k => k.includes("EMPLEADO")) || "EMPLEADO";
            return String(c[colEmp] || "").trim().toUpperCase();
          }).filter(n => n !== "");
        }

        if (listaNombres.length === 0) {
          const n = buscarNombreEnFila(matchAnt);
          if (n) listaNombres.push(n);
        }

        if (listaNombres.length === 0) listaNombres.push("SIN HISTORIAL");
        listaNombres = [...new Set(listaNombres)];

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

        // 4. Validar Turnos
        // Filtramos para usar solo los turnos de quienes SI validan turno (Mecánicos, Eléctricos, etc.)
        const tecnicosQueValidan = tecnicosData.filter(t => necesitaValidacionTurno(t.rol));
        const turnosParaValidar = tecnicosQueValidan.map(t => t.turnos).filter(t => t !== null) as string[][];

        let fechaSugerida = new Date(fechaAntJS);
        fechaSugerida.setMonth(fechaSugerida.getMonth() + 1);

        if (tecnicosQueValidan.length === 0) {
          // Si NADIE valida turno (ej: solo Supervisores), se asigna la fecha proyectada directa
          const fechaFinal = evitarDomingo(fechaSugerida);
          resultados.push({ ...objetoOT, fechaSugerida: formatearFecha(fechaFinal) });
        } else if (turnosParaValidar.length > 0) {
          // Si hay gente que valida y tiene turnos, buscar la noche común
          let fechaFinal = buscarNocheComun(fechaSugerida, turnosParaValidar);
          if (fechaFinal) {
            fechaFinal = evitarDomingo(fechaFinal);
            resultados.push({ ...objetoOT, fechaSugerida: formatearFecha(fechaFinal) });
          } else {
            sinAsignar.push({ ...objetoOT, error: "SIN NOCHE COMUN DISPONIBLE" });
          }
        } else {
          // Si hay gente que valida pero no tiene turnos cargados
          sinAsignar.push({ ...objetoOT, error: "SIN TURNOS CARGADOS (REQUERIDOS)" });
        }
      } else {
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

  // --- MÉTODO 2: PLANIFICACIÓN EQUILIBRADA ---
  static generarPlanificacionEquilibrada(
    dfAct: Record<string, unknown>[],
    dfAnt: Record<string, unknown>[],
    dfCumplimiento: Record<string, unknown>[],
    tecnicosMap: Map<string, { planta: string, rol: string }>
  ): { resultados: PlanResult[], sinAsignar: Record<string, unknown>[] } {

    const sinAsignar: Record<string, unknown>[] = [];
    const ordenesParaDistribuir: PlanningOT[] = [];

    // 1. Preparación de Datos (Extraer fechas ideales y roles)
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

        fechaIdeal = new Date(fechaAntJS);
        fechaIdeal.setMonth(fechaIdeal.getMonth() + 1);

        // Determinar Roles Requeridos (Historial)
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

        tecnicosSlots = rolesRequeridos.map(rol => ({
          nombre: "VACANTE",
          rol: rol,
          turnos: null,
          existe: true
        }));

      } else {
        // Fallback: Fecha actual o fecha programada del excel
        const fechaKeyAct = Object.keys(filaAct).find(k => k.includes("FECHA INICIAL PROGRAMADA")) || "";
        fechaIdeal = filaAct[fechaKeyAct] ? excelDateToJS(filaAct[fechaKeyAct]) : new Date();
        tecnicosSlots = [{ nombre: "VACANTE", rol: "M", turnos: null, existe: true }];
      }

      // Ajuste de fines de semana
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

    // 2. Delegar distribución compleja (Peak Shaving)
    const resultados = distribuirCargaEquilibrada(ordenesParaDistribuir);

    return { resultados, sinAsignar };
  }
}