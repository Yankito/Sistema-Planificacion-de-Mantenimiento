import { useState, useMemo } from "react";
import { BarChart3, ChevronDown, ChevronUp, XCircle } from "lucide-react";
import type { FiltroDrill } from "../types";

interface ChartDataItem {
  semana: number;
  count: number;
  rango: string;
}

interface TrendChartProps {
  timelineStats: {
    chartData: ChartDataItem[];
    maxVal: number
  };
  timelineStatsPrev?: { chartData: ChartDataItem[]; maxVal: number };
  showComparison?: boolean;
  semanaFiltro: string;
  setSemanaFiltro: (s: string) => void;
  filtroDrill: FiltroDrill | null;
  setFiltroDrill: (f: FiltroDrill | null) => void;
}

export const TrendChart = ({ timelineStats, timelineStatsPrev, showComparison, semanaFiltro, setSemanaFiltro, filtroDrill, setFiltroDrill }: TrendChartProps) => {

  const [isChartExpanded, setIsChartExpanded] = useState(true);

  // Título dinámico
  const tituloGrafico = filtroDrill
    ? `Tendencia: ${filtroDrill.valor}`
    : "Tendencia Anual Global";

  const globalMax = useMemo(() => {
    return timelineStats.chartData.reduce((max: number, item: ChartDataItem) => {
      const curr = item.count || 0;
      let prev = 0;
      if (showComparison && timelineStatsPrev) {
        const itemPrev = timelineStatsPrev.chartData.find((p: ChartDataItem) => p.semana === item.semana);
        prev = itemPrev ? itemPrev.count : 0;
      }
      return Math.max(max, curr, prev);
    }, 0);
  }, [timelineStats, timelineStatsPrev, showComparison]);

  if (!timelineStats || timelineStats.chartData.length === 0) {
    return (
      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-8 text-center flex flex-col items-center gap-2">
        <BarChart3 className="text-slate-300" size={32} />
        <p className="text-slate-500 font-medium">No hay datos de tendencia actuales.</p>
      </div>
    );
  }

  // Si no hay datos, mostramos estado vacío
  if (!timelineStats || timelineStats.chartData.length === 0) {
    return (
      <div className="bg-pf-neutral-50 border border-dashed border-pf-neutral-300 rounded-[2rem] p-12 text-center flex flex-col items-center gap-3">
        <BarChart3 className="text-pf-neutral-300" size={40} />
        <p className="text-pf-neutral-500 font-black uppercase tracking-widest text-[10px]">Sin datos de tendencia</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">

      {/* --- HEADER DEL GRÁFICO --- */}
      <div
        className="p-5 bg-pf-neutral-50/50 border-b border-pf-neutral-100 flex justify-between items-center cursor-pointer hover:bg-pf-neutral-50 transition-colors"
        onClick={() => setIsChartExpanded(!isChartExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className={`p-2.5 rounded-xl shadow-lg transition-all ${filtroDrill ? 'bg-pf-blue-600 text-white shadow-pf-blue-200' : (semanaFiltro !== "TODAS" ? 'bg-pf-red text-white shadow-pf-red-200' : 'bg-white border border-pf-neutral-200 text-pf-neutral-700')}`}>
            <BarChart3 size={20} />
          </div>
          <div>
            <h3 className="font-black text-pf-neutral-800 text-base uppercase tracking-tight italic">
              {tituloGrafico}
            </h3>
            <p className="text-[10px] text-pf-neutral-500 font-black uppercase tracking-widest mt-0.5 pl-0.5">
              {isChartExpanded ? "Evolución histórica de detenciones" : "Desplegar análisis temporal"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {semanaFiltro !== "TODAS" && (
            <span onClick={(e) => { e.stopPropagation(); setSemanaFiltro("TODAS") }} className="px-3.5 py-1.5 bg-pf-red text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md cursor-pointer hover:bg-pf-red-600 flex items-center gap-1.5 transition-all active:scale-95">
              S{semanaFiltro} <XCircle size={14} />
            </span>
          )}
          {filtroDrill && (
            <span onClick={(e) => { e.stopPropagation(); setFiltroDrill(null) }} className="px-3.5 py-1.5 bg-pf-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-md cursor-pointer hover:bg-pf-blue-700 flex items-center gap-1.5 transition-all active:scale-95">
              Activo <XCircle size={14} />
            </span>
          )}
          <button className="text-pf-neutral-400 hover:text-pf-neutral-600 p-2 transition-colors">
            {isChartExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
          </button>
        </div>
      </div>

      {/* --- CUERPO DEL GRÁFICO --- */}
      <div className={`transition-all duration-500 ease-in-out bg-white ${isChartExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4">
          <div className="flex">

            {/* 1. EJE Y (FIJO) */}
            {/* Se queda quieto mientras las barras se mueven a la derecha */}
            <div className="relative h-50 border-r border-pf-neutral-100 pr-4 select-none z-20 bg-white">
              <span className="absolute -top-3 right-1 text-[8px] font-black text-pf-neutral-600 bg-pf-neutral-100 px-1.5 py-0.5 rounded shadow-sm uppercase tracking-tighter">Fallas</span>
              <div className="flex flex-col justify-between items-end h-full pt-6 pb-0 text-[10px] text-pf-neutral-400 font-mono font-bold">
                <span className="-translate-y-1/2">{globalMax}</span>
                <span className="-translate-y-1/2">{Math.round(globalMax / 2)}</span>
                <span className="translate-y-0 text-pf-neutral-300">0</span>
              </div>
            </div>

            {/* 2. ÁREA DE SCROLL HORIZONTAL */}
            <div className="flex-1 pb-4">

              {/* CONTENEDOR DE BARRAS (ANCHO FORZADO) */}
              {/* min-w-[1500px] asegura que quepan 52 semanas holgadamente */}
              <div className="h-48 flex items-end gap-2 px-6 relative pt-6 border-b border-pf-neutral-200 w-full overflow-x-auto hide-scrollbar">

                {/* Líneas de fondo */}
                <div className="absolute inset-0 w-full h-full flex flex-col justify-between pointer-events-none px-2 opacity-30">
                  <div className="w-full h-px border-t border-dashed border-pf-neutral-200"></div>
                  <div className="w-full h-px border-t border-dashed border-pf-neutral-200"></div>
                  <div className="w-full h-px border-t border-dashed border-pf-neutral-200"></div>
                </div>

                {/* Mapeo de Barras */}
                {timelineStats.chartData.map((item: ChartDataItem) => {
                  const itemPrev = showComparison && timelineStatsPrev
                    ? timelineStatsPrev.chartData.find((p: ChartDataItem) => p.semana === item.semana)
                    : null;
                  const countPrev = itemPrev ? itemPrev.count : 0;

                  const heightPercent = globalMax === 0 ? 0 : (item.count / globalMax) * 100;
                  const heightPercentPrev = globalMax === 0 ? 0 : (countPrev / globalMax) * 100;

                  const isZero = item.count === 0 && countPrev === 0;
                  const isSelected = String(item.semana) === String(semanaFiltro);
                  const isDimmed = semanaFiltro !== "TODAS" && !isSelected;

                  const isBetter = item.count < countPrev;
                  return (
                    <div
                      key={item.semana}
                      onClick={() => (item.count > 0 || countPrev > 0) && setSemanaFiltro(String(item.semana))}
                      className={`
                                        relative flex-1 flex flex-col justify-end group h-full z-10 min-w-[20px] 
                                        ${isZero ? 'cursor-default' : 'cursor-pointer hover:scale-105 transition-transform'} 
                                        ${isDimmed ? 'opacity-30 grayscale' : 'opacity-100'}
                                    `}
                    >
                      {/* Etiqueta Valor */}
                      {!isZero && (
                        <div className={`w-full text-center mb-1 text-[10px] font-black transition-all z-10 ${isSelected ? 'text-pf-red scale-125' : 'text-pf-blue-500 group-hover:text-pf-neutral-900 group-hover:scale-110'}`}>
                          {item.count}
                        </div>
                      )}

                      {showComparison && (
                        <>
                          <div
                            style={{ height: countPrev === 0 ? '0px' : `${heightPercentPrev}%` }}
                            className={`absolute bottom-0 w-full bg-pf-neutral-200 rounded-t-sm ${isBetter ? 'z-0' : 'z-20'} border border-pf-neutral-300 group-hover:bg-pf-neutral-300 transition-all`}
                            title={`Año Pasado: ${countPrev}`}
                          />
                        </>
                      )}
                      {/* Barra */}
                      {showComparison && !isZero ? (
                        <div
                          style={{ height: item.count === 0 ? '4px' : `${heightPercent}%` }}
                          className={`w-full rounded-t-lg transition-all duration-300 z-10 shadow-sm ${isSelected
                            ? isBetter
                              ? 'bg-pf-success-500 shadow-pf-success-200 shadow-xl'
                              : 'bg-pf-red shadow-pf-red-200 shadow-xl'
                            : isBetter
                              ? 'bg-pf-success-600/80 group-hover:bg-pf-success-500'
                              : 'bg-pf-red/60 group-hover:bg-pf-red-500'
                            }`}
                        />
                      ) : (
                        <div
                          style={{ height: item.count === 0 ? '4px' : `${heightPercent}%` }}
                          className={`w-full rounded-t-lg transition-all duration-300 z-10 shadow-sm ${isZero
                            ? 'bg-pf-neutral-50'
                            : isSelected
                              ? 'bg-pf-red shadow-lg shadow-pf-red/20 scale-105'
                              : 'bg-pf-blue-500 group-hover:bg-pf-blue-600'
                            }`}
                        />
                      )}

                      {/* Eje X: Semana */}
                      <div className="absolute top-full left-0 w-full flex flex-col items-center mt-3">
                        <span className={`text-[10px] font-black font-mono transition-colors h-4 flex items-center justify-center whitespace-nowrap ${isSelected ? 'text-pf-red scale-110' : 'text-pf-neutral-400'}`}>
                          S{item.semana}
                        </span>

                        {/* Tooltip Fecha */}
                        {item.rango && (
                          <span className="mt-1 text-[9px] font-black uppercase tracking-widest whitespace-nowrap px-3 py-2 rounded-xl shadow-2xl z-50 hidden group-hover:block bg-pf-neutral-900 text-white absolute bottom-full mb-3 left-1/2 -translate-x-1/2 pointer-events-none border border-white/10 backdrop-blur-md">
                            {item.rango}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};