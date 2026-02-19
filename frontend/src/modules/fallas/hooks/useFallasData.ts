import { useState, useMemo } from "react";
import { type FallaRow } from "../types";
import { getRangoSemana } from "../../../shared/utils/dateUtils";

// 1. Interfaces para el tipado de Analytics
export interface GrupoMecanicoStats {
  label: string;
  gasto: number;
  tiempo: number;
  count: number;
  prevGasto: number;
  prevTiempo: number;
  prevCount: number;
  prevMttr: number;
  mttr?: number; // Opcional para cuando calculamos el ranking MTTR
}

interface HeroStats {
  totalGasto: number;
  totalEventos: number;
  totalTiempo: number;
  topCritico: GrupoMecanicoStats | null;
  topLista: GrupoMecanicoStats[];
}

export const useFallasData = (data: FallaRow[]) => {

  // CONFIGURACIÓN INICIAL
  const config = useMemo(() => {
    if (data.length === 0) return { semanas: [] as number[], anios: [] as number[], plantas: [] as string[], anioDefault: new Date().getFullYear() };

    const semanas = Array.from(new Set(data.map(d => d.semana))).sort((a, b) => b - a);
    const anios = Array.from(new Set(data.map(d => d.anio))).sort((a, b) => b - a);
    const plantas = Array.from(new Set(data.map(d => d.planta))).sort((a, b) => a.localeCompare(b));

    return { semanas, anios, plantas, anioDefault: anios[0] };
  }, [data]);

  // ESTADOS
  const [anioFiltro, setAnioFiltro] = useState<number>(config.anioDefault);
  const [plantaFiltro, setPlantaFiltro] = useState<string>("TODAS");
  const [semanaFiltro, setSemanaFiltro] = useState<string>("TODAS");
  const [filtroDrill, setFiltroDrill] = useState<{ tipo: 'EQUIPO' | 'CAUSA', valor: string } | null>(null);
  const [topN, setTopN] = useState<number>(5);

  // FILTRADO PRINCIPAL
  const { datosFiltrados, datosAnioAnterior } = useMemo(() => {
    const semanasAnioActual = data
      .filter(d => d.anio === anioFiltro)
      .map(d => d.semana);
    
    const maxSemana = semanasAnioActual.length > 0 ? Math.max(...semanasAnioActual) : 52;
    const filtrar = (anioTarget: number, esAnioAnterior: boolean) => {
      return data.filter(d => {
        const matchAnio = d.anio === anioTarget;
        const matchPlanta = plantaFiltro === "TODAS" ? true : d.planta === plantaFiltro;
        
        // Si estamos filtrando el año anterior para COMPARATIVA GLOBAL (semana "TODAS"),
        // limitamos hasta la semana máxima que tiene el año actual para que el acumulado sea justo.
        let matchSemana = false;
        if (semanaFiltro === "TODAS") {
          matchSemana = esAnioAnterior ? d.semana <= maxSemana : true;
        } else {
          matchSemana = d.semana === Number(semanaFiltro);
        }

        let matchDrill = true;
        if (filtroDrill) {
          if (filtroDrill.tipo === 'EQUIPO') matchDrill = d.equipo === filtroDrill.valor;
          if (filtroDrill.tipo === 'CAUSA') matchDrill = (d.causa || "").trim().toUpperCase() === filtroDrill.valor;
        }
        return matchAnio && matchPlanta && matchSemana && matchDrill;
      });
    };

    return {
      datosFiltrados: filtrar(anioFiltro, false),
      datosAnioAnterior: filtrar(anioFiltro - 1, true),
      semanaMaximaActual: maxSemana
    };
  }, [data, anioFiltro, plantaFiltro, semanaFiltro, filtroDrill]);

  // ANALYTICS
  const analytics = useMemo(() => {
    const totalGasto = datosFiltrados.reduce((a, b) => a + b.gasto, 0);
    const totalTiempo = datosFiltrados.reduce((a, b) => a + b.duracionMinutos, 0);
    const totalEventos = datosFiltrados.length;
    const mttrGlobal = totalEventos > 0 ? totalTiempo / totalEventos : 0;

    const totalGastoPrev = datosAnioAnterior.reduce((a, b) => a + b.gasto, 0);
    const totalTiempoPrev = datosAnioAnterior.reduce((a, b) => a + b.duracionMinutos, 0);
    const totalEventosPrev = datosAnioAnterior.length;
    const mttrGlobalPrev = totalEventosPrev > 0 ? totalTiempoPrev / totalEventosPrev : 0;

    // Mapa Año Anterior
    const prevMap = datosAnioAnterior.reduce((acc, curr) => {
      if (!acc[curr.equipo]) acc[curr.equipo] = { gasto: 0, tiempo: 0, count: 0 };
      acc[curr.equipo].gasto += curr.gasto;
      acc[curr.equipo].tiempo += curr.duracionMinutos;
      acc[curr.equipo].count += 1;
      return acc;
    }, {} as Record<string, { gasto: number, tiempo: number, count: number }>);

    // Agrupación Dinámica con Tipado
    const groupBy = (keyFn: (d: FallaRow) => string): GrupoMecanicoStats[] => {
      const map = datosFiltrados.reduce((acc, curr) => {
        const key = keyFn(curr);
        if (!acc[key]) {
          const prevData = prevMap[key] || { gasto: 0, tiempo: 0, count: 0 };
          acc[key] = {
            label: key,
            gasto: 0, tiempo: 0, count: 0,
            prevGasto: prevData.gasto,
            prevTiempo: prevData.tiempo,
            prevCount: prevData.count,
            prevMttr: prevData.count > 0 ? prevData.tiempo / prevData.count : 0
          };
        }
        acc[key].gasto += curr.gasto;
        acc[key].tiempo += curr.duracionMinutos;
        acc[key].count += 1;
        return acc;
      }, {} as Record<string, GrupoMecanicoStats>);
      return Object.values(map);
    };

    // Rankings
    const porFrecuencia = groupBy(d => d.equipo).sort((a, b) => b.count - a.count).slice(0, topN);
    const porCosto = groupBy(d => d.equipo).sort((a, b) => b.gasto - a.gasto).slice(0, topN);
    const porTiempo = groupBy(d => d.equipo).sort((a, b) => b.tiempo - a.tiempo).slice(0, topN);
    const porMTTR = groupBy(d => d.equipo)
      .map(d => ({ ...d, mttr: d.tiempo / (d.count || 1) }))
      .sort((a, b) => b.mttr - a.mttr).slice(0, topN);
    const porCausa = groupBy(d => (d.causa || "S/D").trim().toUpperCase()).sort((a, b) => b.count - a.count).slice(0, Math.max(topN, 10));

    const heroStats: HeroStats = {
      totalGasto, totalEventos, totalTiempo,
      topCritico: porFrecuencia.length > 0 ? porFrecuencia[0] : null,
      topLista: groupBy(d => d.equipo).sort((a, b) => b.count - a.count).slice(0, 3)
    };

    return {
      totalGasto, totalTiempo, totalEventos, mttrGlobal,
      totalGastoPrev, totalTiempoPrev, totalEventosPrev, mttrGlobalPrev,
      porCosto, porFrecuencia, porMTTR, porTiempo, porCausa, heroStats
    };
  }, [datosFiltrados, datosAnioAnterior, topN]);

  // TIMELINE
  const timelineStats = useMemo(() => {
    const datosTimeline = data.filter(d => {
      const matchAnio = d.anio === anioFiltro;
      const matchPlanta = plantaFiltro === "TODAS" ? true : d.planta === plantaFiltro;
      let matchDrill = true;
      if (filtroDrill) {
        if (filtroDrill.tipo === 'EQUIPO') matchDrill = d.equipo === filtroDrill.valor;
        if (filtroDrill.tipo === 'CAUSA') matchDrill = (d.causa || "").trim().toUpperCase() === filtroDrill.valor;
      }
      return matchAnio && matchPlanta && matchDrill;
    });

    if (datosTimeline.length === 0) return { chartData: [] as {semana: number, count: number, rango: string}[], maxVal: 0 };

    const groups = datosTimeline.reduce((acc, curr) => {
      acc[curr.semana] = (acc[curr.semana] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const weeks = datosTimeline.map(d => d.semana);
    const minW = Math.min(...weeks);
    const maxW = Math.max(...weeks);
    const chartData = [];
    let maxVal = 0;

    for (let i = minW; i <= maxW; i++) {
      const countValue = groups[i] || 0;
      if (countValue > maxVal) maxVal = countValue;
      chartData.push({ semana: i, count: countValue, rango: getRangoSemana(i, anioFiltro) });
    }
    return { chartData, maxVal };
  }, [data, anioFiltro, plantaFiltro, filtroDrill]);

  const timelineStatsPrev = useMemo(() => {
    const anioPrevio = anioFiltro - 1;
    
    // Filtramos usando el año anterior pero manteniendo los otros criterios
    const datosTimeline = data.filter(d => {
      const matchAnio = d.anio === anioPrevio;
      const matchPlanta = plantaFiltro === "TODAS" ? true : d.planta === plantaFiltro;
      let matchDrill = true;
      if (filtroDrill) {
        if (filtroDrill.tipo === 'EQUIPO') matchDrill = d.equipo === filtroDrill.valor;
        if (filtroDrill.tipo === 'CAUSA') matchDrill = (d.causa || "").trim().toUpperCase() === filtroDrill.valor;
      }
      return matchAnio && matchPlanta && matchDrill;
    });

    if (datosTimeline.length === 0) return { chartData: [], maxVal: 0 };

    const groups = datosTimeline.reduce((acc, curr) => {
      acc[curr.semana] = (acc[curr.semana] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Usamos el rango de semanas 1-52 (o el min/max detectado en la data global para consistencia)
    // Para simplificar, usamos el rango detectado en los datos del año previo
    const weeks = datosTimeline.map(d => d.semana);
    const minW = Math.min(...weeks); 
    const maxW = Math.max(...weeks);
    
    const chartData = [];
    let maxVal = 0;

    for (let i = minW; i <= maxW; i++) {
      const countValue = groups[i] || 0;
      if (countValue > maxVal) maxVal = countValue;
      chartData.push({ 
          semana: i, 
          count: countValue, 
          rango: getRangoSemana(i, anioPrevio) 
      });
    }
    return { chartData, maxVal };
  }, [data, anioFiltro, plantaFiltro, filtroDrill]);


  return {
    datosFiltrados,
    analytics,
    timelineStats,
    timelineStatsPrev,
    config,
    anioFiltro, setAnioFiltro,
    plantaFiltro, setPlantaFiltro,
    semanaFiltro, setSemanaFiltro,
    filtroDrill, setFiltroDrill,
    topN, setTopN
  };
};