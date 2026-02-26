import { useMemo } from "react";
import { getWeekNumber, parseDDMMYYYY } from "../../../shared/utils/dateUtils";
import type { PlanResult, SemanaCalendario } from "../types";

export const useCalendarioGrid = (
  planResult: PlanResult[],
  ordenesPorDia: Record<string, PlanResult[]>,
  periodoSeleccionado?: string
) => {
  return useMemo(() => {
    let fechaBase: Date | null = null;

    if (periodoSeleccionado && /^\d{4}-\d{2}$/.test(periodoSeleccionado)) {
      const [y, m] = periodoSeleccionado.split('-').map(Number);
      fechaBase = new Date(y, m - 1, 1);
    } else {
      const today = new Date();
      const base = planResult[0]?.fechaSugerida || `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
      fechaBase = parseDDMMYYYY(base);
    }

    if (!fechaBase) {
      const today = new Date();
      return {
        semanas: [],
        nombreMes: "",
        totalOrdenesMes: 0,
        anioActual: today.getFullYear()
      };
    }

    const mes = fechaBase.getMonth() + 1;
    const anio = fechaBase.getFullYear();
    const primerDia = new Date(anio, mes - 1, 1);
    const ultimoDia = new Date(anio, mes, 0).getDate();

    const nombreMes = primerDia.toLocaleString('es-ES', { month: 'long' });

    let startIdx = primerDia.getDay() - 1;
    if (startIdx === -1) startIdx = 6;

    const diasArray = [
      ...Array(startIdx).fill(null),
      ...Array.from({ length: ultimoDia }, (_, i) => {
        const d = (i + 1).toString().padStart(2, '0');
        const m = mes.toString().padStart(2, '0');
        return `${d}/${m}/${anio}`;
      })
    ];

    let totalMes = 0;
    const semanasArr: SemanaCalendario[] = [];

    for (let i = 0; i < diasArray.length; i += 7) {
      const chunk = diasArray.slice(i, i + 7);
      const fechaRefStr = chunk.find(d => d !== null);

      let numSemana = 0;
      if (fechaRefStr) {
        const dObj = parseDDMMYYYY(fechaRefStr);
        if (dObj) numSemana = getWeekNumber(dObj);
      }

      chunk.forEach(fecha => {
        if (fecha && ordenesPorDia[fecha]) {
          totalMes += ordenesPorDia[fecha].length;
        }
      });

      semanasArr.push({
        numero: numSemana,
        dias: chunk,
        idSemana: `SEM-${numSemana}`
      });
    }

    return {
      semanas: semanasArr,
      nombreMes: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1),
      totalOrdenesMes: totalMes,
      anioActual: anio
    };
  }, [planResult, ordenesPorDia, periodoSeleccionado]);
};