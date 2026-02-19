// src/modules/seguimiento/hooks/useSeguimientoData.ts
import { useState, useCallback, useEffect } from "react";
import * as SeguimientoService from "../../../shared/services/SeguimientoService";
import type { AtrasoRow, BacklogStats, TechStats } from "../types";

export const useSeguimientoData = () => {
  // Datos crudos para las tablas
  const [dataActual, setDataActual] = useState<AtrasoRow[]>([]);

  // Estadísticas YA procesadas (si aplica)
  const [serverStats, setServerStats] = useState<{
    flowStats: BacklogStats | null;
    techStats: TechStats[]
  }>({ flowStats: null, techStats: [] });

  const [isLoading, setIsLoading] = useState(false);

  // Carga de datos unificada (sin selectores de historial)
  const cargarDatos = useCallback(async () => {
    setIsLoading(true);
    try {
      console.log("Cargando datos actuales de seguimiento...");
      const data = await SeguimientoService.getPedidos();
      for (let i = 0; i < data.length; i++) {
        if (data[i].ot === '603961') {
          console.log(data[i]);
        }
      }
      setDataActual(data);
      try {
        const stats = await SeguimientoService.getAnalytics("ACTUAL", "ANTERIOR");
        setServerStats(stats);
      } catch (e) {
        console.warn("No se pudieron cargar estadisticas", e);
        // Fallback or keep empty
        setServerStats({ flowStats: null, techStats: [] });
      }

    } catch (error) {
      console.error("Error cargando datos de seguimiento", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Efecto de carga inicial única
  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  return {
    dataActual,
    dataAnterior: [],
    serverStats,
    reporteActual: "ACTUAL",
    semanaComparar: "",
    isLoading,
    cargarReporte: async (_semana: string) => cargarDatos(),
    cambiarComparacion: async () => { }, // No-op
    limpiarComparacion: () => { }, // No-op
    cargarDatos
  };
};