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

  let barColor = "bg-slate-400";
  if (showComparison) {
    if (isBetter) barColor = "bg-emerald-500";
    if (isWorse) barColor = "bg-red-500";
  } else {
    if (type === 'FREQ') barColor = "bg-blue-600";
    if (type === 'COST') barColor = "bg-pf-red";
    if (type === 'MTTR') barColor = "bg-purple-600";
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
      className={`group p-3 rounded-xl cursor-pointer transition-all duration-300 border mb-2 ${active ? 'bg-slate-50 border-slate-300 shadow-sm' : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-100'}`}
    >
      <div className="flex justify-between items-end mb-2">
        <span className={`text-xs font-bold truncate max-w-[50%] ${active ? 'text-slate-900' : 'text-slate-600'}`}>
          {item.label}
        </span>
        <div className="text-right flex items-center gap-1">
          {showComparison && !isNeutral && (
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 ${isBetter ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {isBetter ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
              {formatFn(Math.abs(diff))}
            </span>
          )}
          <span className="block text-sm font-black text-slate-800">{formatFn(currentVal)}</span>
        </div>
      </div>

      <div className="relative w-full flex flex-col justify-center gap-1">
        {showComparison && (
          <div className="flex items-center gap-1">
            <div className="relative h-1.5 flex-1 bg-slate-100 rounded-full overflow-hidden border border-slate-300">
              <div className="absolute top-0 left-0 h-full rounded-full bg-slate-400 transition-all duration-500" style={{ width: `${Math.max(prevPercent, 0)}%` }}></div>
            </div>
            <span className="text-[9px] font-medium text-slate-400 w-12 text-right">{anioFiltro - 1}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <div className="relative h-2.5 flex-1 bg-slate-100 rounded-full overflow-hidden shadow-inner border border-slate-300">
            <div data-testid="progress-bar" className={`absolute top-0 left-0 h-full rounded-full ${barColor} transition-all duration-500`} style={{ width: `${Math.max(currentPercent, 0)}%` }}></div>
          </div>
          {showComparison && <span className="text-[9px] font-bold text-slate-600 w-12 text-right">{anioFiltro}</span>}
        </div>
      </div>
    </div>
  );
};