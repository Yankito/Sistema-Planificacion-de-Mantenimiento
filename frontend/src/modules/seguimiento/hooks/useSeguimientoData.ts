import { useState, useCallback, useMemo } from "react";
import * as SeguimientoService from "../services/SeguimientoService";
import type { AtrasoRow, BacklogStats, TechStats } from "../types";
import {
  toISODate,
  getStartOfPreviousYear,
  getCurrentDate
} from "../../../shared/utils/dateUtils";
import { toast } from "sonner";

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
      const { pedidos, flowStats, techStats } = await SeguimientoService.getDatos(fechaInicio, fechaFin);
      setDataActual(pedidos);
      setServerStats({ flowStats, techStats });
    } catch (error) {
      console.error("Error cargando datos de seguimiento", error);
      toast.error("Error al cargar los datos de seguimiento de OTs.");
      setDataActual([]);
      setServerStats({ flowStats: null, techStats: [] });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return useMemo(() => ({
    dataActual,
    dataAnterior: [],
    serverStats,
    reporteActual: "ACTUAL",
    semanaComparar: "",
    isLoading,
    filtros, // Exportar filtros para valor inicial en la vista
    cargarReporte: async () => cargarDatos(filtros.fechaInicio, filtros.fechaFin),
    cambiarComparacion: async () => { }, // No-op
    limpiarComparacion: () => { }, // No-op
    cargarDatos
  }), [dataActual, serverStats, isLoading, filtros, cargarDatos]);
};