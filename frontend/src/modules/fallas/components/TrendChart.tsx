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
      <div className="bg-slate-50 border border-dashed border-slate-300 rounded-3xl p-8 text-center flex flex-col items-center gap-2">
        <BarChart3 className="text-slate-300" size={32} />
        <p className="text-slate-500 font-medium">No hay datos de tendencia para mostrar con los filtros actuales.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all duration-300">

      {/* --- HEADER DEL GRÁFICO --- */}
      <div
        className="p-5 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsChartExpanded(!isChartExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl shadow-sm transition-colors ${filtroDrill ? 'bg-blue-600 text-white' : (semanaFiltro !== "TODAS" ? 'bg-pf-red text-white' : 'bg-white border border-slate-200 text-slate-700')}`}>
            <BarChart3 size={20} />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
              {tituloGrafico}
            </h3>
            <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
              {isChartExpanded ? "Evolución semanal de fallas." : "Click para desplegar gráfico."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {semanaFiltro !== "TODAS" && (
            <span onClick={(e) => { e.stopPropagation(); setSemanaFiltro("TODAS") }} className="px-3 py-1 bg-pf-red text-white rounded-full text-xs font-bold shadow-sm cursor-pointer hover:bg-red-700 flex items-center gap-1">
              Semana {semanaFiltro} <XCircle size={12} />
            </span>
          )}
          {filtroDrill && (
            <span onClick={(e) => { e.stopPropagation(); setFiltroDrill(null) }} className="px-3 py-1 bg-blue-600 text-white rounded-full text-xs font-bold shadow-sm cursor-pointer hover:bg-blue-700 flex items-center gap-1">
              Filtro Activo <XCircle size={12} />
            </span>
          )}
          <button className="text-slate-400 hover:text-slate-600 p-1">
            {isChartExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </button>
        </div>
      </div>

      {/* --- CUERPO DEL GRÁFICO --- */}
      <div className={`transition-all duration-500 ease-in-out bg-white ${isChartExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4">
          <div className="flex">

            {/* 1. EJE Y (FIJO) */}
            {/* Se queda quieto mientras las barras se mueven a la derecha */}
            <div className="relative h-50 border-r border-slate-100 pr-3 select-none z-20 bg-white ">
              <span className="absolute -top-3 right-1 text-[8px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">N° Fallas</span>
              <div className="flex flex-col justify-between items-end h-full pt-6 pb-0 text-[10px] text-slate-400 font-mono">
                <span className="-translate-y-1/2">{globalMax}</span>
                <span className="-translate-y-1/2">{Math.round(globalMax / 2)}</span>
                <span className="translate-y-0">0</span>
              </div>
            </div>

            {/* 2. ÁREA DE SCROLL HORIZONTAL */}
            <div className="flex-1 pb-4">

              {/* CONTENEDOR DE BARRAS (ANCHO FORZADO) */}
              {/* min-w-[1500px] asegura que quepan 52 semanas holgadamente */}
              <div className="h-48 flex items-end gap-2 px-4 relative pt-6 border-b border-slate-200 w-full">

                {/* Líneas de fondo */}
                <div className="absolute inset-0 w-full h-full flex flex-col justify-between pointer-events-none px-2 opacity-50">
                  <div className="w-full h-[1px] bg-slate-100 border-t border-dashed border-slate-200"></div>
                  <div className="w-full h-[1px] bg-slate-100 border-t border-dashed border-slate-200"></div>
                  <div className="w-full h-[1px] bg-slate-100 border-t border-dashed border-slate-200"></div>
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
                        <div className={`w-full text-center mb-1 text-[10px] font-black transition-all z-10 ${isSelected ? 'text-pf-red scale-110' : 'text-indigo-500 group-hover:text-black'}`}>
                          {item.count}
                        </div>
                      )}

                      {showComparison && (
                        <>
                          <div
                              style={{ height: countPrev === 0 ? '0px' : `${heightPercentPrev}%` }}
                              className={`absolute bottom-0 w-full bg-slate-300 rounded-t-sm ${isBetter ? 'z-0' : 'z-20'} border border-slate-300 group-hover:bg-slate-400 transition-all`}
                              title={`Año Pasado: ${countPrev}`}
                            />
                        </>
                      )}
                      {/* Barra */}
                      {showComparison && !isZero ? (
                        <div
                          style={{ height: item.count === 0 ? '4px' : `${heightPercent}%` }}
                          className={`w-full rounded-t-sm transition-all duration-300 z-10 ${
                            isSelected
                              ? isBetter
                                ? 'bg-green-500 shadow-lg shadow-green-500/30'
                                : 'bg-red-500 shadow-lg shadow-red-500/30'
                              : isBetter
                                ? 'bg-green-600 group-hover:bg-green-500 shadow-sm'
                                : 'bg-red-400 group-hover:bg-red-500 shadow-sm'
                          }`}
                        />
                      ) : (
                        <div
                          style={{ height: item.count === 0 ? '4px' : `${heightPercent}%` }}
                          className={`w-full rounded-t-sm transition-all duration-300 z-10 ${
                            isZero
                              ? 'bg-slate-100'
                              : isSelected
                                ? 'bg-pf-red shadow-lg shadow-pf-red/30'
                                : 'bg-indigo-500 group-hover:bg-indigo-600 shadow-sm'
                          }`}
                        />
                      )}

                      {/* Eje X: Semana */}
                      <div className="absolute top-full left-0 w-full flex flex-col items-center mt-2">
                        <span className={`text-[10px] font-bold font-mono transition-colors h-4 flex items-center justify-center whitespace-nowrap ${isSelected ? 'text-pf-red' : 'text-slate-400'}`}>
                          {/* Mostramos todas las semanas si hay espacio, o simplificamos */}
                          S{item.semana}
                        </span>

                        {/* Tooltip Fecha */}
                        {item.rango && (
                          <span className="mt-1 text-[9px] font-medium whitespace-nowrap px-2 py-1 rounded shadow-lg z-50 hidden group-hover:block bg-slate-800 text-white absolute bottom-full mb-2 left-1/2 -translate-x-1/2 pointer-events-none">
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