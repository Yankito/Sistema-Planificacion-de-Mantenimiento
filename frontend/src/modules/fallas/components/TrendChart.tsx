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

  const { globalMax, stepSize } = useMemo(() => {
    let max = 0;
    if (timelineStats?.chartData) {
      timelineStats.chartData.forEach((item: ChartDataItem) => {
        max = Math.max(max, item.count || 0);
      });
    }
    if (showComparison && timelineStatsPrev?.chartData) {
      timelineStatsPrev.chartData.forEach((item: ChartDataItem) => {
        max = Math.max(max, item.count || 0);
      });
    }

    if (max === 0) return { globalMax: 10, stepSize: 2 };

    const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    const norm = max / magnitude;

    let step;
    if (norm <= 1.5) step = 0.2 * magnitude;
    else if (norm <= 3) step = 0.5 * magnitude;
    else if (norm <= 7) step = 1 * magnitude;
    else step = 2 * magnitude;

    step = Math.max(1, Math.round(step));
    const gMax = Math.ceil(max / step) * step;

    return { globalMax: gMax, stepSize: step };
  }, [timelineStats, timelineStatsPrev, showComparison]);

  const yAxisSteps = useMemo(() => {
    const steps = [];
    for (let i = 0; i <= globalMax; i += stepSize) {
      steps.push(i);
    }
    return steps;
  }, [globalMax, stepSize]);

  const currentWeekNumber = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
    const week1 = new Date(d.getFullYear(), 0, 4);
    return 1 + Math.round(((d.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  }, []);

  const totalWeeks = useMemo(() => {
    if (!timelineStats) return currentWeekNumber;
    const maxDataWeek = Math.max(0, ...timelineStats.chartData.map(d => d.semana), (timelineStatsPrev ? Math.max(0, ...timelineStatsPrev.chartData.map(d => d.semana)) : 0));
    // Check if the data implies a past year (e.g., has weeks > currentWeek or just use 52 if it's over e.g. 10 weeks ahead)
    if (maxDataWeek > currentWeekNumber + 4 && maxDataWeek > 40) return 52;
    return Math.max(maxDataWeek, currentWeekNumber);
  }, [timelineStats, timelineStatsPrev, currentWeekNumber]);

  const fullChartData = useMemo(() => {
    const data: ChartDataItem[] = [];
    const sourceData = timelineStats?.chartData || [];
    for (let i = 1; i <= totalWeeks; i++) {
      const existing = sourceData.find(d => d.semana === i);
      if (existing) {
        data.push(existing);
      } else {
        data.push({ semana: i, count: 0, rango: "" });
      }
    }
    return data;
  }, [timelineStats, totalWeeks]);

  return (
    <div className="bg-white flex flex-col flex-1 h-full rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">

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
      <div className={`transition-all duration-500 ease-in-out bg-white flex flex-col ${isChartExpanded ? 'flex-1 max-h-[1000px] opacity-100 min-h-[250px]' : 'max-h-0 opacity-0 overflow-hidden flex-none'}`}>
        <div className="flex flex-1 flex-col h-full relative">
          <div className="flex flex-1 relative z-10 w-full">

            {/* LÍNEAS DE FONDO FIJAS */}
            <div className="absolute inset-0 bottom-[2.5rem] top-[2rem] right-0 left-[4rem] pointer-events-none opacity-40 z-0">
              {yAxisSteps.map((step) => (
                <div key={step} style={{ bottom: `${(step / globalMax) * 100}%` }} className="absolute w-full h-px border-b border-dashed border-pf-neutral-400"></div>
              ))}
            </div>

            {/* 1. EJE Y (FIJO) */}
            <div className="relative border-r border-pf-neutral-300 select-none z-20 bg-white w-[4rem] min-w-[4rem] mb-[2.5rem] mt-[2rem]">
              <span className="absolute -top-7 right-2 text-[8px] font-black text-pf-neutral-600 bg-pf-neutral-100 px-1.5 py-0.5 rounded shadow-sm uppercase tracking-tighter w-max border border-pf-neutral-200">Fallas</span>
              {yAxisSteps.map((step) => (
                <span key={step} style={{ bottom: `${(step / globalMax) * 100}%` }} className="absolute right-2 translate-y-1/2 text-[10px] text-pf-neutral-400 font-mono font-bold leading-none bg-white py-0.5 pl-1">
                  {step}
                </span>
              ))}
            </div>

            {/* 2. ÁREA DE BARRAS (FILL HORIZONTAL) */}
            <div className="flex-1 w-full relative mb-[2.5rem] mt-[2rem]">

              {/* CONTENEDOR DE BARRAS (ANCHO FLEXIBLE) */}
              <div className="absolute inset-0 flex items-end gap-1 px-2 md:px-6">

                {/* Mapeo de Barras */}
                {fullChartData.map((item: ChartDataItem) => {
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
                                        relative flex-1 flex flex-col justify-end group h-full z-10 min-w-0
                                        ${isZero ? 'cursor-default' : 'cursor-pointer hover:scale-[1.02] transition-transform'} 
                                        ${isDimmed ? 'opacity-30 grayscale' : 'opacity-100'}
                                    `}
                    >
                      {showComparison && (
                        <>
                          <div
                            style={{ height: countPrev === 0 ? '0px' : `${heightPercentPrev}%` }}
                            className={`absolute bottom-0 w-full bg-pf-neutral-200 rounded-t-sm ${isBetter ? 'z-0' : 'z-20'} border border-pf-neutral-300 group-hover:bg-pf-neutral-300 transition-all`}
                            title={`Año Pasado: ${countPrev}`}
                          />
                        </>
                      )}
                      {/* Barra principal con su Etiqueta Valor anclada */}
                      {showComparison && !isZero ? (
                        <div
                          style={{ height: item.count === 0 ? '4px' : `${heightPercent}%` }}
                          className={`relative w-full rounded-t-lg transition-all duration-300 z-10 shadow-sm ${isSelected
                            ? isBetter
                              ? 'bg-pf-success-500 shadow-pf-success-200 shadow-xl'
                              : 'bg-pf-red shadow-pf-red-200 shadow-xl'
                            : isBetter
                              ? 'bg-pf-success-600/80 group-hover:bg-pf-success-500'
                              : 'bg-pf-red/60 group-hover:bg-pf-red-500'
                            }`}
                        >
                          {!isZero && (
                            <div className={`absolute bottom-full w-full left-0 text-center mb-1 text-[8px] md:text-[10px] font-black transition-all z-10 ${isSelected ? 'text-pf-red scale-110' : 'text-pf-blue-500 group-hover:text-pf-neutral-900 group-hover:scale-110'}`}>
                              {item.count}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div
                          style={{ height: item.count === 0 ? '4px' : `${heightPercent}%` }}
                          className={`relative w-full rounded-t-lg transition-all duration-300 z-10 shadow-sm ${isZero
                            ? 'bg-pf-neutral-50'
                            : isSelected
                              ? 'bg-pf-red shadow-lg shadow-pf-red/20 scale-105'
                              : 'bg-pf-blue-500 group-hover:bg-pf-blue-600'
                            }`}
                        >
                          {!isZero && (
                            <div className={`absolute bottom-full w-full left-0 text-center mb-1 text-[8px] md:text-[10px] font-black transition-all z-10 ${isSelected ? 'text-pf-red scale-110' : 'text-pf-blue-500 group-hover:text-pf-neutral-900 group-hover:scale-110'}`}>
                              {item.count}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Eje X: Semana */}
                      <div className="absolute top-full left-0 w-full flex flex-col items-center mt-2 overflow-visible">
                        <span className={`text-[7px] md:text-[9px] font-black font-mono transition-colors h-4 flex items-center justify-center whitespace-nowrap ${isSelected ? 'text-pf-red scale-110' : 'text-pf-neutral-400'}`}>
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