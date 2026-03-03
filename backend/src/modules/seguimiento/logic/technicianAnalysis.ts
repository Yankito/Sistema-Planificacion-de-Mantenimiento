import type { OrdenTrabajo } from "../../../shared/types/index.js";

/**
 * Estadísticas de rendimiento de un técnico individual.
 */
export interface TechStats {
  nombre: string;
  totalAsignado: number;
  finalizadas: number;
  pendientes: number;
  efectividad: number;
  plantas: string[];
}

/**
 * Prepara el perfil completo de un técnico específico: sus órdenes de trabajo asignadas,
 * las plantas donde opera, sus estadísticas de efectividad y la lista de plantas disponibles.
 * Deduplica OTs por si aparecen en múltiples fuentes de datos.
 *
 * @param techName - Nombre exacto del técnico (case-sensitive)
 * @param allOrders - Todas las OTs disponibles en el período
 * @param plantasDisponibles - Lista de plantas disponibles para el selector del frontend
 */
export const prepareTechProfile = (
  techName: string,
  allOrders: OrdenTrabajo[],
  plantasDisponibles: string[]
) => {
  const techOrders = allOrders.filter(d => {
    return d.detallesTecnicos?.some(t => t.tecnico.nombre === techName);
  });

  // Plantas donde el técnico ha ejecutado OTs (sin duplicados, ordenadas)
  const activePlants = Array.from(new Set(techOrders.map(o => o.planta)))
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  // Deduplicar OTs por ID para evitar conteos incorrectos
  const uniqueOrders = Array.from(new Map(techOrders.map(item => [item.ot, item])).values());

  const stats = {
    total: uniqueOrders.length,
    finalizadas: uniqueOrders.filter(o =>
      o.detallesTecnicos?.find(t => t.tecnico.nombre === techName)?.opFinalizada ||
      o.clasificacion === 'FINALIZADA'
    ).length,
    pendientes: 0
  };
  stats.pendientes = stats.total - stats.finalizadas;

  return {
    techName: techName,
    activePlants: activePlants,
    orders: uniqueOrders,
    stats: stats,
    listaPlantas: plantasDisponibles.filter(p => p !== "TODAS")
  };
};

/**
 * Analiza todas las OTs del backlog y de cumplimiento para calcular estadísticas
 * de rendimiento de cada técnico (total asignado, finalizadas, pendientes, efectividad, plantas).
 * Retorna el array ordenado de mayor a menor por total de OTs asignadas.
 *
 * @param backlogData - OTs pendientes del período
 * @param cumplimientoData - OTs completadas del período
 */
export const analyzeTechnicians = (
  backlogData: OrdenTrabajo[],
  cumplimientoData: OrdenTrabajo[]
): TechStats[] => {
  const map = new Map<string, TechStats>();

  /**
   * Recupera o inicializa el registro de estadísticas de un técnico en el mapa.
   */
  const getStat = (nombre: string) => {
    const key = nombre.trim();
    if (!map.has(key)) {
      map.set(key, {
        nombre: key,
        totalAsignado: 0,
        finalizadas: 0,
        pendientes: 0,
        efectividad: 0,
        plantas: []
      });
    }
    return map.get(key)!;
  };

  const allData = [...backlogData, ...cumplimientoData];

  // Recorrer todas las OTs y acumular estadísticas por técnico
  allData.forEach(row => {
    row.detallesTecnicos?.forEach(t => {
      const stat = getStat(t.tecnico.nombre);

      if (t.opFinalizada) {
        stat.finalizadas++;
      } else {
        stat.pendientes++;
      }

      stat.totalAsignado++;
      if (!stat.plantas.includes(row.planta)) stat.plantas.push(row.planta);
    });
  });

  // Calcular efectividad y ordenar de mayor a menor por total asignado
  return Array.from(map.values()).map(s => ({
    ...s,
    efectividad: s.totalAsignado > 0 ? Math.round((s.finalizadas / s.totalAsignado) * 100) : 0
  })).sort((a, b) => b.totalAsignado - a.totalAsignado);
};