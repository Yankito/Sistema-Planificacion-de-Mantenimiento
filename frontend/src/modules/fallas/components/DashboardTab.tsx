import { useState } from "react";
import { Activity, DollarSign, Clock, Zap, History } from "lucide-react";
import { KpiTile } from "./ui/KpiTile";
import { HeaderSection } from "./ui/HeaderSection";
import { TrendChart } from "./TrendChart";
import { clp, num } from "../../../shared/utils/dateUtils";
import { ComparativeRow } from "./ComparativeRow";
import type { GrupoMecanicoStats, FiltroDrill } from "../types";

// 1. Definimos la estructura exacta del objeto de analítica
interface AnalyticsData {
  totalEventos: number;
  totalGasto: number;
  totalTiempo: number;
  mttrGlobal: number;
  totalEventosPrev: number;
  totalGastoPrev: number;
  totalTiempoPrev: number;
  mttrGlobalPrev: number;
  porFrecuencia: GrupoMecanicoStats[];
  porCosto: GrupoMecanicoStats[];
  porMTTR: GrupoMecanicoStats[];
  porCausa: GrupoMecanicoStats[];
  heroStats: {
    topCritico: GrupoMecanicoStats | null;
  };
}

interface TimelineStats {
  chartData: { semana: number; count: number; rango: string }[];
  maxVal: number;
}

interface Props {
  analytics: AnalyticsData;
  timelineStats: TimelineStats;
  timelineStatsPrev: TimelineStats;
  semanaFiltro: string;
  setSemanaFiltro: (s: string) => void;
  filtroDrill: FiltroDrill | null;
  setFiltroDrill: (f: FiltroDrill | null) => void;
  rangoTexto: string;
  topN: number;
  anioFiltro: number;
}

export const DashboardTab = ({ 
    analytics, timelineStats, timelineStatsPrev, semanaFiltro, setSemanaFiltro,
    filtroDrill, setFiltroDrill, rangoTexto, anioFiltro 
}: Props) => {
  
  const { heroStats } = analytics;
  const [showComparison, setShowComparison] = useState(false); 

  const handleBarClick = (tipo: 'EQUIPO' | 'CAUSA', valor: string) => {
    if (filtroDrill && filtroDrill.tipo === tipo && filtroDrill.valor === valor) {
      setFiltroDrill(null); 
    } else {
      setFiltroDrill({ tipo, valor });
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* 1. HERO CARD */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 group">
         <div className="absolute top-0 right-0 w-64 h-full bg-gradient-to-l from-pf-red/20 to-transparent"></div>
         <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
                <span className="bg-pf-red px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider">
                    {semanaFiltro !== "TODAS" ? `Foco: Semana ${semanaFiltro}` : "Visión Global"}
                </span>
                <span className="text-white/80 text-[15px] font-mono font-bold">{rangoTexto}</span>
            </div>
            <h3 className="text-3xl font-light">
                <span className="font-bold">{heroStats.topCritico?.label || "Sin Datos"}</span> es el equipo crítico.
            </h3>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
                Registró <span className="text-white font-bold text-lg">{heroStats.topCritico?.count || 0} fallas</span> y acumuló {num(heroStats.topCritico?.tiempo || 0)} min de detención.
            </p>
         </div>

         <div className="flex gap-4 relative z-10">
            <div className="text-center"><p className="text-[10px] text-slate-400 uppercase font-bold">Fallas</p><p className="text-xl font-bold text-blue-400">{heroStats.topCritico?.count || 0}</p></div>
            <div className="w-[1px] bg-white/10"></div>
            <div className="text-center"><p className="text-[10px] text-slate-400 uppercase font-bold">Costo</p><p className="text-xl font-bold text-pf-red">{clp(heroStats.topCritico?.gasto || 0)}</p></div>
            <div className="w-[1px] bg-white/10"></div>
            <div className="text-center"><p className="text-[10px] text-slate-400 uppercase font-bold">Tiempo</p><p className="text-xl font-bold text-amber-400">{num(heroStats.topCritico?.tiempo || 0)}'</p></div>
         </div>
      </div>

      <TrendChart 
        timelineStats={timelineStats} 
        timelineStatsPrev={timelineStatsPrev}
        showComparison={showComparison}
        semanaFiltro={semanaFiltro} 
        setSemanaFiltro={setSemanaFiltro} 
        filtroDrill={filtroDrill} 
        setFiltroDrill={setFiltroDrill} 
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KpiTile title="Fallas Totales" value={analytics.totalEventos} currentValue={analytics.totalEventos} previousValue={analytics.totalEventosPrev} icon={Activity} color="blue" />
        <KpiTile title="Gasto Acumulado" value={clp(analytics.totalGasto)} currentValue={analytics.totalGasto} previousValue={analytics.totalGastoPrev} formatter={clp} icon={DollarSign} color="red" />
        <KpiTile title="Tiempo Perdido" value={`${num(analytics.totalTiempo)}'`} subValue={`${(analytics.totalTiempo/60).toFixed(1)} hrs`} currentValue={analytics.totalTiempo} previousValue={analytics.totalTiempoPrev} formatter={(v) => `${num(v)} min`} icon={Clock} color="amber" />
        <KpiTile title="MTTR Global" value={`${(analytics.totalTiempo / (analytics.totalEventos || 1)).toFixed(0)}'`} subValue="Promedio Rep." currentValue={analytics.mttrGlobal} previousValue={analytics.mttrGlobalPrev} formatter={(v) => `${v.toFixed(0)}'`} icon={Zap} color="purple" />
      </div>

      <div className="flex justify-end mb-[-10px] relative z-20">
          <button 
            onClick={() => setShowComparison(!showComparison)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${showComparison ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}
          >
             <History size={14} className={showComparison ? "text-pf-red" : ""} />
             Comparar vs {anioFiltro - 1}
          </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        {/* A. TOP FRECUENCIA */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
            <div className="flex pt-6 pl-6 pr-6 justify-center items-center mb-2">
                <HeaderSection icon={Activity} title="Equipos con más Fallas" color="text-blue-600" bg="bg-blue-50"/>
            </div>
            <div className="flex-1 mt-4 space-y-2 overflow-y-auto custom-scrollbar p-2">
                {analytics.porFrecuencia.map((item: GrupoMecanicoStats, idx: number) => (
                    <ComparativeRow 
                        key={idx} 
                        item={item}
                        maxValGlobal={analytics.porFrecuencia[0]?.count || 1}
                        formatFn={(v: number) => `${v} fallas`}
                        type="FREQ"
                        active={filtroDrill?.valor === item.label}
                        onClick={() => handleBarClick('EQUIPO', item.label)}
                        showComparison={showComparison}
                        anioFiltro={anioFiltro}
                    />
                ))}
            </div>
        </div>

        {/* B. TOP COSTOS */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
            <div className="flex pt-6 pl-6 pr-6 justify-center items-center mb-2">
                <HeaderSection icon={DollarSign} title="Equipos más Costosos" color="text-pf-red" bg="bg-red-50"/>
            </div>
            <div className="flex-1 mt-4 space-y-2 overflow-y-auto custom-scrollbar p-2">
                {analytics.porCosto.map((item: GrupoMecanicoStats, idx: number) => (
                     <ComparativeRow 
                        key={idx} 
                        item={item}
                        maxValGlobal={analytics.porCosto[0]?.gasto || 1}
                        formatFn={(v: number) => clp(v)}
                        type="COST"
                        active={filtroDrill?.valor === item.label}
                        onClick={() => handleBarClick('EQUIPO', item.label)}
                        showComparison={showComparison}
                        anioFiltro={anioFiltro}
                    />
                ))}
            </div>
        </div>

        {/* C. TOP MTTR */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
            <div className="flex pt-6 pl-6 pr-6 justify-center items-center mb-2">
                <HeaderSection icon={Zap} title="Mayor MTTR" color="text-purple-600" bg="bg-purple-50"/>
            </div>
            <div className="flex-1 mt-4 space-y-2 overflow-y-auto custom-scrollbar p-2">
                {analytics.porMTTR.map((item: GrupoMecanicoStats, idx: number) => (
                     <ComparativeRow 
                        key={idx} 
                        item={item}
                        maxValGlobal={analytics.porMTTR[0]?.mttr || 1}
                        formatFn={(v: number) => `${v.toFixed(0)} min`}
                        type="MTTR"
                        active={filtroDrill?.valor === item.label}
                        onClick={() => handleBarClick('EQUIPO', item.label)}
                        showComparison={showComparison}
                        anioFiltro={anioFiltro}
                    />
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};