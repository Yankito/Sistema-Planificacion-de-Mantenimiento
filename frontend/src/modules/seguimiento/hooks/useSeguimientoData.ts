import { useState, useCallback, useEffect } from "react";
import * as SeguimientoService from "../services/SeguimientoService";
import type { AtrasoRow, BacklogStats, TechStats } from "../types";
import {
  toISODate,
  getStartOfPreviousYear,
  getCurrentDate
} from "../../../shared/utils/dateUtils";

export const useSeguimientoData = () => {
  // Datos crudos para las tablas
  const [dataActual, setDataActual] = useState<AtrasoRow[]>([]);

  // Filtros de fecha actuales (para sincronización con la vista)
  const [filtros, setFiltros] = useState({
    fechaInicio: toISODate(getStartOfPreviousYear()),
    fechaFin: toISODate(getCurrentDate())
  });

  // Estadísticas YA procesadas (si aplica)
  const [serverStats, setServerStats] = useState<{
    flowStats: BacklogStats | null;
    techStats: TechStats[]
  }>({ flowStats: null, techStats: [] });

  const [isLoading, setIsLoading] = useState(false);

  // Carga de datos unificada (soporta filtros de fecha)
  const cargarDatos = useCallback(async (fechaInicio?: string, fechaFin?: string) => {
    setIsLoading(true);
    // Actualizamos los filtros locales para que la vista sepa qué se cargó
    if (fechaInicio !== undefined || fechaFin !== undefined) {
      setFiltros(prev => ({
        fechaInicio: fechaInicio !== undefined ? fechaInicio : prev.fechaInicio,
        fechaFin: fechaFin !== undefined ? fechaFin : prev.fechaFin
      }));
    }

    try {
      const data = await SeguimientoService.getPedidos(fechaInicio, fechaFin);
      setDataActual(data);

      try {
        const stats = await SeguimientoService.getAnalytics("ACTUAL", "ANTERIOR", fechaInicio, fechaFin);
        setServerStats(stats);
      } catch (e) {
        console.warn("No se pudieron cargar estadisticas", e);
        setServerStats({ flowStats: null, techStats: [] });
      }

    } catch (error) {
      console.error("Error cargando datos de seguimiento", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efecto de carga inicial con el rango por defecto
  useEffect(() => {
    cargarDatos(filtros.fechaInicio, filtros.fechaFin);
  }, [cargarDatos]); // Solo al montar

  return {
    dataActual,
    dataAnterior: [],
    serverStats,
    reporteActual: "ACTUAL",
    semanaComparar: "",
    isLoading,
    filtros, // Exportar filtros para valor inicial en la vista
    cargarReporte: async (_semana: string) => cargarDatos(filtros.fechaInicio, filtros.fechaFin),
    cambiarComparacion: async () => { }, // No-op
    limpiarComparacion: () => { }, // No-op
    cargarDatos
  };
};