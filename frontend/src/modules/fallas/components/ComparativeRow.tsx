import { TrendingDown, TrendingUp } from "lucide-react";
import type { GrupoMecanicoStats } from "../types";

interface ComparativeRowProps {
  item: GrupoMecanicoStats;
  maxValGlobal: number;
  formatFn: (val: number) => string;
  type: 'FREQ' | 'COST' | 'MTTR';
  onClick: () => void;
  active: boolean;
  showComparison: boolean;
  anioFiltro: number;
}

export const ComparativeRow = ({ item, maxValGlobal, formatFn, type, onClick, active, showComparison, anioFiltro }: ComparativeRowProps) => {
  // TypeScript ahora sabe que item.count y item.prevCount existen
  const currentVal = type === 'FREQ' ? item.count : (type === 'COST' ? item.gasto : (item.mttr || 0));
  const prevVal = type === 'FREQ' ? item.prevCount : (type === 'COST' ? item.prevGasto : item.prevMttr);
  const diff = currentVal - prevVal;

  // Lógica de "Mejor/Peor"
  // En fallas/costos, que baje (diff < 0) es MEJOR (isBetter)
  const isBetter = diff < 0;
  const isWorse = diff > 0;
  const isNeutral = diff === 0;

  let scaleBase = 1;
  if (showComparison) {
    scaleBase = Math.max(prevVal, currentVal);
  } else {
    scaleBase = maxValGlobal;
  }
  if (scaleBase === 0) scaleBase = 1;

  const currentPercent = (currentVal / scaleBase) * 100;
  const prevPercent = (prevVal / scaleBase) * 100;

  let barColor = "bg-pf-neutral-400";
  if (showComparison) {
    if (isBetter) barColor = "bg-pf-success-500";
    if (isWorse) barColor = "bg-pf-red-500";
  } else {
    if (type === 'FREQ') barColor = "bg-pf-blue-600 shadow-md shadow-pf-blue-200/50";
    if (type === 'COST') barColor = "bg-pf-red shadow-md shadow-pf-red-200/50";
    if (type === 'MTTR') barColor = "bg-pf-blue-600 shadow-md shadow-pf-blue-200/50";
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      data-testid={`row-${item.label}`}
      className={`group p-4 rounded-2xl cursor-pointer transition-all duration-300 border mb-2 ${active ? 'bg-pf-neutral-50 border-pf-neutral-200 shadow-md scale-[1.02]' : 'bg-white border-transparent hover:bg-pf-neutral-50/50 hover:border-pf-neutral-100'}`}
    >
      <div className="flex justify-between items-center mb-3">
        <span className={`text-xs font-black max-w-[70%] uppercase tracking-tight italic ${active ? 'text-pf-neutral-900 underline decoration-pf-red decoration-2 underline-offset-4' : 'text-pf-neutral-600'}`}>
          {item.label}
        </span>
        <div className="text-right flex items-center gap-2">
          {showComparison && !isNeutral && (
            <span className={`text-[10px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm border ${isBetter ? 'bg-pf-success-50 text-pf-success-700 border-pf-success-200' : 'bg-pf-red-50 text-pf-red-700 border-pf-red-200'}`}>
              {isBetter ? <TrendingDown size={11} className="animate-pulse" /> : <TrendingUp size={11} className="animate-pulse" />}
              {formatFn(Math.abs(diff))}
            </span>
          )}
          <span className={`block text-[13px] font-black tracking-tight ${active ? 'text-pf-neutral-900' : 'text-pf-neutral-700'}`}>{formatFn(currentVal)}</span>
        </div>
      </div>

      <div className="relative w-full flex flex-col justify-center gap-1.5">
        {showComparison && (
          <div className="flex items-center gap-2">
            <div className="relative h-1.5 flex-1 bg-pf-neutral-100 rounded-full overflow-hidden border border-pf-neutral-200/50">
              <div className="absolute top-0 left-0 h-full rounded-full bg-pf-neutral-400/50 transition-all duration-700" style={{ width: `${Math.max(prevPercent, 0)}%` }}></div>
            </div>
            <span className="text-[9px] font-black text-pf-neutral-400 w-12 text-right tracking-widest uppercase">{anioFiltro - 1}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <div className="relative h-3 flex-1 bg-pf-neutral-100 rounded-full overflow-hidden shadow-inner border border-pf-neutral-200">
            <div data-testid="progress-bar" className={`absolute top-0 left-0 h-full rounded-full ${barColor} transition-all duration-700`} style={{ width: `${Math.max(currentPercent, 0)}%` }}></div>
          </div>
          {showComparison && <span className="text-[9px] font-black text-pf-neutral-700 w-12 text-right tracking-widest uppercase">{anioFiltro}</span>}
        </div>
      </div>
    </div>
  );
};