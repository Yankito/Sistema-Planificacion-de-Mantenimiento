// src/logic/fallasProcessor.ts
import { type FallaRow } from "../types.js";
import { getWeekNumber, getISOWeekYear } from "../../../shared/utils/dateUtils.js";

/**
 * Recibe los datos crudos de la base de datos (sin semana, mes ni año)
 * y los procesa para añadirles estos campos calculados a partir de la fecha.
 */
export const processFallasDataFromDB = (fallasDb: Partial<FallaRow>[]): FallaRow[] => {
  const fallasEnriquecidas: FallaRow[] = fallasDb.map((row) => {
    // Si viene de BD la fecha puede ser string o Date
    let fechaObj: Date;
    if (row.fecha instanceof Date) {
      fechaObj = row.fecha;
    } else {
      fechaObj = new Date(row.fecha as string);
    }

    // SI LA FECHA ES INVÁLIDA
    if (isNaN(fechaObj.getTime())) {
      return {
        ...(row as Readonly<Partial<FallaRow>>),
        fecha: row.fecha || new Date(),
        semana: 0,
        anio: 0,
        mes: 0,
        planta: row.planta || "S/D",
        area: row.area || "",
        linea: row.linea || "",
        equipo: row.equipo || "Equipo Desconocido",
        causa: row.causa || "",
        pedidoTrabajo: row.pedidoTrabajo || "",
        estadoPedido: row.estadoPedido || "",
        tipoPedido: row.tipoPedido || "",
        tecnico: row.tecnico || "",
        duracionMinutos: row.duracionMinutos || 0,
        gasto: row.gasto || 0,
        perdidaKg: row.perdidaKg || 0,
        descripcionOperador: row.descripcionOperador || ""
      } as FallaRow;
    }

    const semana = getWeekNumber(fechaObj);

    return {
      ...(row as Readonly<Partial<FallaRow>>),
      id: row.id,
      fecha: fechaObj,
      anio: getISOWeekYear(fechaObj),
      mes: fechaObj.getMonth() + 1,
      semana: semana,
      planta: row.planta || "S/D",
      area: row.area || "",
      linea: row.linea || "",
      equipo: row.equipo || "Equipo Desconocido",
      causa: row.causa || "",
      pedidoTrabajo: row.pedidoTrabajo || "",
      estadoPedido: row.estadoPedido || "",
      tipoPedido: row.tipoPedido || "",
      tecnico: row.tecnico || "",
      duracionMinutos: Number(row.duracionMinutos) || 0,
      gasto: Number(row.gasto) || 0,
      perdidaKg: Number(row.perdidaKg) || 0,
      descripcionOperador: row.descripcionOperador || "",
    } as FallaRow;
  });

  return fallasEnriquecidas;
};