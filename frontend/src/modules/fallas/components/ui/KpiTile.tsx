import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";

interface KpiTileProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: 'red' | 'amber' | 'blue' | 'purple' | 'green';
  subValue?: string;
  previousValue?: number;
  currentValue?: number;
  inverse?: boolean;
  formatter?: (val: number) => string;
}

export const KpiTile = ({ title, value, subValue, icon: Icon, color, previousValue, currentValue, inverse = false, formatter }: KpiTileProps) => {

  const theme: Record<string, string> = {
    red: 'text-pf-red bg-red-50',
    amber: 'text-amber-600 bg-amber-50',
    blue: 'text-blue-600 bg-blue-50',
    purple: 'text-purple-600 bg-purple-50',
    green: 'text-emerald-600 bg-emerald-50'
  };

  let diff = 0;
  let isUp = false;
  let isGood = false;
  let hasData = false;

  if (previousValue !== undefined && currentValue !== undefined && previousValue !== 0) {
    hasData = true;
    diff = currentValue - previousValue;
    isUp = diff > 0;
    isGood = inverse ? !isUp : isUp;
  }

  const absDiff = Math.abs(diff);
  const diffDisplay = formatter ? formatter(absDiff) : absDiff;

  return (
    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-full group hover:shadow-md transition-all relative overflow-hidden">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{title}</p>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight">{value}</h3>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme[color] || theme.blue}`}>
          <Icon size={20} />
        </div>
      </div>

      <div className="flex items-center gap-2 mt-auto">
        {hasData && Math.abs(diff) > 0 && (
          <div data-testid="kpi-indicator" className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full ${isGood ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
            {isUp ? <TrendingUp size={10} strokeWidth={3} /> : <TrendingDown size={10} strokeWidth={3} />}
            <span>{diffDisplay}</span>
          </div>
        )}

        {hasData && Math.abs(diff) === 0 && (
          <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-500">
            <Minus size={10} /> <span>Sin cambio</span>
          </div>
        )}

        {subValue && <p className="text-[10px] text-slate-400 font-medium ml-auto">{subValue}</p>}
      </div>
    </div>
  );
};