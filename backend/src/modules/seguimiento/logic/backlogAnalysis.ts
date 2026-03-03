import type { OrdenTrabajo } from "../../../shared/types/index.js";

/**
 * Resultado del análisis de flujo para una OT específica.
 * Refleja el movimiento de una OT entre dos períodos comparados.
 */
export interface OTFlowResult {
  nroOrden: string;
  descripcion: string;
  planta: string;
  estadoAnterior?: string;
  estadoActual?: string;
  tipoMovimiento: "NUEVA" | "FINALIZADA" | "PERSISTENTE" | "CAMBIO_ESTADO" | "DESAPARECIDA";
}

/**
 * Estadísticas globales del análisis de backlog.
 * Agrupa las OTs según cómo variaron entre el período actual y el anterior.
 */
export interface BacklogStats {
  nuevas: OTFlowResult[];
  finalizadas: OTFlowResult[];
  sinCambios: OTFlowResult[];
  conAvance: OTFlowResult[];
  desaparecidas: OTFlowResult[];
}

/**
 * Normaliza el identificador de una OT para comparaciones robustas (trim + uppercase).
 */
const normalizeKey = (val: any): string => {
  if (val === null || val === undefined) return "";
  return String(val).trim().toUpperCase();
};

/**
 * Analiza el flujo del backlog comparando el período actual contra el anterior.
 * Clasifica cada OT según su movimiento:
 *   - NUEVA: aparece en el actual pero no estaba en el anterior
 *   - FINALIZADA: tiene clasificación 'FINALIZADA' o estaba en el anterior y desapareció (y está en cumplimiento)
 *   - PERSISTENTE: sigue en el actual con la misma clasificación que en el anterior
 *   - CAMBIO_ESTADO: sigue en el actual pero cambió de clasificación
 *   - DESAPARECIDA: estaba en el anterior pero no está en el actual ni en cumplimiento
 *
 * @param currentBacklog - OTs del período actual
 * @param prevBacklog - OTs del período anterior
 * @param currentCumplimiento - OTs ya completadas del período actual (opcional)
 */
export const analyzeBacklogFlow = (
  currentBacklog: OrdenTrabajo[],
  prevBacklog: OrdenTrabajo[],
  currentCumplimiento: OrdenTrabajo[] = []
): BacklogStats => {

  const mapPrev = new Map<string, OrdenTrabajo>();
  const mapCurrBacklog = new Map<string, OrdenTrabajo>();
  const mapCurrCumplimiento = new Map<string, OrdenTrabajo>();

  prevBacklog.forEach(d => mapPrev.set(normalizeKey(d.nroOrden), d));
  currentBacklog.forEach(d => mapCurrBacklog.set(normalizeKey(d.nroOrden), d));
  currentCumplimiento.forEach(d => mapCurrCumplimiento.set(normalizeKey(d.nroOrden), d));

  const stats: BacklogStats = {
    nuevas: [],
    finalizadas: [],
    sinCambios: [],
    conAvance: [],
    desaparecidas: []
  };

  // --- Análisis del backlog actual: clasificar cada OT según su evolución ---
  currentBacklog.forEach(curr => {
    const key = normalizeKey(curr.nroOrden);
    const prev = mapPrev.get(key);

    // OTs con clasificación FINALIZADA se reportan directamente como finalizadas
    if (curr.clasificacion === 'FINALIZADA') {
      stats.finalizadas.push({
        nroOrden: curr.nroOrden,
        descripcion: curr.descripcion,
        planta: curr.planta,
        estadoActual: curr.estado,
        tipoMovimiento: "FINALIZADA"
      });
      return;
    }

    const item: OTFlowResult = {
      nroOrden: curr.nroOrden,
      descripcion: curr.descripcion,
      planta: curr.planta,
      estadoActual: curr.clasificacion,
      estadoAnterior: prev ? prev.clasificacion : undefined,
      tipoMovimiento: "NUEVA"
    };

    if (!prev) {
      // No existía en el período anterior: OT nueva
      item.tipoMovimiento = "NUEVA";
      stats.nuevas.push(item);
    } else if (prev.clasificacion !== curr.clasificacion) {
      // Cambió de clasificación entre períodos (ej: PROGRAMADOR -> TECNICO / SERVICIO)
      item.tipoMovimiento = "CAMBIO_ESTADO";
      stats.conAvance.push(item);
    } else {
      // Sin cambios: la OT persiste con la misma clasificación
      item.tipoMovimiento = "PERSISTENTE";
      stats.sinCambios.push(item);
    }
  });

  // --- Análisis del backlog anterior: detectar OTs que desaparecieron ---
  prevBacklog.forEach(prev => {
    const key = normalizeKey(prev.nroOrden);
    if (!mapCurrBacklog.has(key)) {
      const enCumplimiento = mapCurrCumplimiento.get(key);

      if (enCumplimiento) {
        // Desapareció del backlog porque fue completada (está en cumplimiento)
        stats.finalizadas.push({
          nroOrden: prev.nroOrden,
          descripcion: prev.descripcion,
          planta: prev.planta,
          estadoAnterior: prev.clasificacion,
          estadoActual: enCumplimiento.estado,
          tipoMovimiento: "FINALIZADA"
        });
      } else {
        // Desapareció del backlog sin registro de cumplimiento (causa desconocida)
        stats.desaparecidas.push({
          nroOrden: prev.nroOrden,
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