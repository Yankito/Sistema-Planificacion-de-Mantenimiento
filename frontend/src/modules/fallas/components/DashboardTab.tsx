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
  totalFallas: number;
  totalGasto: number;
  totalTiempo: number;
  mttrGlobal: number;
  totalFallasPrev: number;
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
      <div className="bg-pf-neutral-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 group border border-white/5">
        <div className="absolute top-0 right-0 w-96 h-full bg-gradient-to-l from-pf-red/10 to-transparent"></div>
        <div className="relative z-10 flex-1">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-pf-red px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-pf-red/20">
              {semanaFiltro !== "TODAS" ? `Semana ${semanaFiltro}` : "Visión Global"}
            </span>
            <span className="text-white/80 text-xs font-black uppercase tracking-widest">{rangoTexto}</span>
          </div>
          <h3 className="text-3xl font-light leading-tight">
            <span className="font-black text-white italic">{heroStats.topCritico?.label || "---"}</span>
            <span className="block text-white/60 text-xl font-bold mt-1 uppercase tracking-tight">es el equipo crítico del periodo</span>
          </h3>
          <p className="text-pf-neutral-400 text-sm mt-4 max-w-xl font-medium leading-relaxed">
            Registró <span className="text-pf-red font-black text-lg">{heroStats.topCritico?.count || 0} fallas</span> acumulando <span className="text-white font-black">{num(heroStats.topCritico?.tiempo || 0)} minutos</span> de detención total.
          </p>
        </div>

        <div className="flex gap-8 relative z-10 bg-white/5 p-6 rounded-3xl border border-white/5 backdrop-blur-sm">
          <div className="text-center">
            <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Fallas</p>
            <p className="text-3xl font-black text-pf-blue-400 tracking-tighter">{heroStats.topCritico?.count || 0}</p>
          </div>
          <div className="w-[1px] bg-white/10"></div>
          <div className="text-center">
            <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Costo</p>
            <p className="text-2xl font-black text-pf-red leading-none mt-1">{clp(heroStats.topCritico?.gasto || 0)}</p>
          </div>
          <div className="w-[1px] bg-white/10"></div>
          <div className="text-center">
            <p className="text-[10px] text-white/40 uppercase font-black tracking-widest mb-1">Tiempo</p>
            <p className="text-3xl font-black text-pf-warning-400 tracking-tighter">{num(heroStats.topCritico?.tiempo || 0)}'</p>
          </div>
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
        <KpiTile title="Fallas Totales" value={analytics.totalFallas} currentValue={analytics.totalFallas} previousValue={analytics.totalFallasPrev} icon={Activity} color="blue" />
        <KpiTile title="Gasto Acumulado" value={clp(analytics.totalGasto)} currentValue={analytics.totalGasto} previousValue={analytics.totalGastoPrev} formatter={clp} icon={DollarSign} color="red" />
        <KpiTile title="Tiempo Perdido" value={`${num(analytics.totalTiempo)}'`} subValue={`${(analytics.totalTiempo / 60).toFixed(1)} hrs`} currentValue={analytics.totalTiempo} previousValue={analytics.totalTiempoPrev} formatter={(v) => `${num(v)} min`} icon={Clock} color="amber" />
        <KpiTile title="MTTR Global" value={`${(analytics.totalTiempo / (analytics.totalFallas || 1)).toFixed(0)}'`} subValue="Promedio Rep." currentValue={analytics.mttrGlobal} previousValue={analytics.mttrGlobalPrev} formatter={(v) => `${v.toFixed(0)}'`} icon={Zap} color="purple" />
      </div>

      <div className="flex justify-end mb-[-10px] relative z-20">
        <button
          onClick={() => setShowComparison(!showComparison)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm active:scale-95 ${showComparison ? 'bg-pf-neutral-900 text-white border-pf-neutral-900 shadow-lg' : 'bg-white text-pf-neutral-500 border-pf-neutral-200 hover:border-pf-neutral-300'}`}
        >
          <History size={14} className={showComparison ? "text-pf-red animate-spin-slow" : ""} />
          Comparar vs {anioFiltro - 1}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[500px]">
        {/* A. TOP FRECUENCIA */}
        <div className="bg-white rounded-[2rem] border border-pf-neutral-100 shadow-sm flex flex-col overflow-hidden">
          <div className="flex pt-6 pl-6 pr-6 justify-center items-center mb-2">
            <HeaderSection icon={Activity} title="Equipos con más Fallas" color="text-pf-blue-600" bg="bg-pf-blue-50" />
          </div>
          <div className="flex-1 mt-4 space-y-2 overflow-y-auto custom-scrollbar p-3">
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
        <div className="bg-white rounded-[2rem] border border-pf-neutral-100 shadow-sm flex flex-col overflow-hidden">
          <div className="flex pt-6 pl-6 pr-6 justify-center items-center mb-2">
            <HeaderSection icon={DollarSign} title="Equipos más Costosos" color="text-pf-red" bg="bg-pf-red-50" />
          </div>
          <div className="flex-1 mt-4 space-y-2 overflow-y-auto custom-scrollbar p-3">
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
        <div className="bg-white rounded-[2rem] border border-pf-neutral-100 shadow-sm flex flex-col overflow-hidden">
          <div className="flex pt-6 pl-6 pr-6 justify-center items-center mb-2">
            <HeaderSection icon={Zap} title="Mayor MTTR" color="text-pf-blue-600" bg="bg-pf-blue-50" />
          </div>
          <div className="flex-1 mt-4 space-y-2 overflow-y-auto custom-scrollbar p-3">
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