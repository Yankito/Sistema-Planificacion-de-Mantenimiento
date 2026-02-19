import { Filter } from "lucide-react";

interface InteractiveBarProps {
  label: string;
  value: string | number;
  subValue?: string;
  percent: number;
  color: string;
  active: boolean;
  onClick: () => void;
}

export const InteractiveBar = ({ label, value, subValue, percent, color, active, onClick }: InteractiveBarProps) => (
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
    className={`
      group relative p-2 rounded-xl cursor-pointer transition-all duration-300 border
      ${active ? 'bg-slate-100 border-slate-300 shadow-inner ring-1 ring-slate-200' : 'bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-100'}
      focus:outline-none focus:ring-2 focus:ring-blue-400
    `}
  >
    <div className="flex justify-between items-end relative z-10 mb-2">
      <span className={`text-xs font-bold transition-colors truncate max-w-[65%] ${active ? 'text-slate-900' : 'text-slate-600 group-hover:text-pf-red'}`} title={label}>
        {label}
      </span>
      <div className="text-right">
        <span className="block text-sm font-bold text-slate-800">{value}</span>
        {subValue && <span className="block text-[10px] text-slate-400">{subValue}</span>}
      </div>
    </div>
    
    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden relative">
      <div className={`h-full rounded-full absolute left-0 top-0 ${color} transition-all duration-1000 ease-out`} style={{ width: `${Math.max(percent, 2)}%` }}></div>
    </div>
    
    {active && <div className="absolute right-2 top-2 text-pf-red animate-bounce"><Filter size={10} fill="currentColor"/></div>}
  </div>
);