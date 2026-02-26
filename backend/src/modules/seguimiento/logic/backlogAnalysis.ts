import type { OrdenTrabajo } from "../../../shared/types/index.js";

export interface OTFlowResult {
  ot: string;
  descripcion: string;
  planta: string;
  estadoAnterior?: string; // Ahora guardará la Clasificación Anterior
  estadoActual?: string;   // Ahora guardará la Clasificación Actual
  tipoMovimiento: "NUEVA" | "FINALIZADA" | "PERSISTENTE" | "CAMBIO_ESTADO" | "DESAPARECIDA";
}

export interface BacklogStats {
  nuevas: OTFlowResult[];
  finalizadas: OTFlowResult[];
  sinCambios: OTFlowResult[];
  conAvance: OTFlowResult[];
  desaparecidas: OTFlowResult[];
}

const normalizeKey = (val: any): string => {
  if (val === null || val === undefined) return "";
  return String(val).trim().toUpperCase();
};

export const analyzeBacklogFlow = (
  currentBacklog: OrdenTrabajo[],
  prevBacklog: OrdenTrabajo[],
  currentCumplimiento: OrdenTrabajo[] = []
): BacklogStats => {

  const mapPrev = new Map<string, OrdenTrabajo>();
  const mapCurrBacklog = new Map<string, OrdenTrabajo>();
  const mapCurrCumplimiento = new Map<string, OrdenTrabajo>();

  prevBacklog.forEach(d => mapPrev.set(normalizeKey(d.ot), d));
  currentBacklog.forEach(d => mapCurrBacklog.set(normalizeKey(d.ot), d));
  currentCumplimiento.forEach(d => mapCurrCumplimiento.set(normalizeKey(d.ot), d));

  const stats: BacklogStats = {
    nuevas: [],
    finalizadas: [],
    sinCambios: [],
    conAvance: [],
    desaparecidas: []
  };

  // BACKLOG ACTUAL (Nuevas y Cambios de Clasificación)
  currentBacklog.forEach(curr => {
    const key = normalizeKey(curr.ot);
    const prev = mapPrev.get(key);

    // Si la clasificación es FINALIZADA, es finalizada
    if (curr.clasificacion === 'FINALIZADA') {
      stats.finalizadas.push({
        ot: curr.ot,
        descripcion: curr.descripcion,
        planta: curr.planta,
        estadoActual: curr.estado, // Aquí sí mostramos el estado final (ej: Finalizado)
        tipoMovimiento: "FINALIZADA"
      });
      return;
    }

    const item: OTFlowResult = {
      ot: curr.ot,
      descripcion: curr.descripcion,
      planta: curr.planta,
      estadoActual: curr.clasificacion, // Mostramos Clasificación
      estadoAnterior: prev ? prev.clasificacion : undefined, // Mostramos Clasificación
      tipoMovimiento: "NUEVA"
    };

    if (!prev) {
      // NUEVA
      item.tipoMovimiento = "NUEVA";
      stats.nuevas.push(item);
    } else if (prev.clasificacion !== curr.clasificacion) {
      // Verificamos si cambió la CLASIFICACIÓN
      item.tipoMovimiento = "CAMBIO_ESTADO";
      stats.conAvance.push(item);
    } else {
      // PERSISTENTE
      item.tipoMovimiento = "PERSISTENTE";
      stats.sinCambios.push(item);
    }
  });

  // BACKLOG ANTERIOR (Salidas)
  prevBacklog.forEach(prev => {
    const key = normalizeKey(prev.ot);
    if (!mapCurrBacklog.has(key)) {
      const enCumplimiento = mapCurrCumplimiento.get(key);

      if (enCumplimiento) {
        stats.finalizadas.push({
          ot: prev.ot,
          descripcion: prev.descripcion,
          planta: prev.planta,
          estadoAnterior: prev.clasificacion, // Clasificación que tenía antes
          estadoActual: enCumplimiento.estado, // Estado real de cierre
          tipoMovimiento: "FINALIZADA"
        });
      } else {
        stats.desaparecidas.push({
          ot: prev.ot,
          descripcion: prev.descripcion,
          planta: prev.planta,
          estadoAnterior: prev.clasificacion,
          estadoActual: "NO EN REPORTE",
          tipoMovimiento: "DESAPARECIDA"
        });
      }
    }
  });

  return stats;
};