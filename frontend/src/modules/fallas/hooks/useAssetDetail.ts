import { useState, useMemo } from "react";
import { type FallaRow } from "../types";
import { getRangoSemana } from "../../../shared/utils/dateUtils";

export const useAssetDetail = (data: FallaRow[], assetName: string) => {

  // Estado de interacción
  const [semSelected, setSemSelected] = useState<number | null>(null);

  // Filtrar datos del activo (Base Histórica)
  const assetData = useMemo(() => {
    return data
      .filter(d => d.equipo === assetName)
      .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
  }, [data, assetName]);

  // Datos para la Tabla y KPIs (Filtrados si hay selección)
  const tableData = useMemo(() => {
    if (semSelected === null) return assetData;
    return assetData.filter(d => d.semana === semSelected);
  }, [assetData, semSelected]);

  // Cálculo de KPIs
  const stats = useMemo(() => {
    const totalGasto = tableData.reduce((a, b) => a + b.gasto, 0);
    const totalTiempo = tableData.reduce((a, b) => a + b.duracionMinutos, 0);
    const count = tableData.length;
    return { totalGasto, totalTiempo, count };
  }, [tableData]);

  // Datos para el Gráfico (Siempre muestra el panorama completo)
  const timelineData = useMemo(() => {
    if (assetData.length === 0) return { chartData: [], maxVal: 0 };

    const groups = assetData.reduce((acc, curr) => {
      acc[curr.semana] = (acc[curr.semana] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const weeks = assetData.map(d => d.semana);
    const minW = Math.min(...weeks);
    const maxW = Math.max(...weeks);

    const chartData = [];
    let maxVal = 0;

    // Año base para calcular rangos (toma el del primer dato o el actual)
    const anioBase = assetData[0]?.anio || new Date().getFullYear();

    for (let i = minW; i <= maxW; i++) {
      const count = groups[i] || 0;
      if (count > maxVal) maxVal = count;
      chartData.push({
        semana: i,
        count,
        rango: getRangoSemana(i, anioBase)
      });
    }

    return { chartData, maxVal };
  }, [assetData]);

  return {
    semSelected,
    setSemSelected,
    tableData,
    stats,
    timelineData
  };
};