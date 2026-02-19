import { useState } from "react";
import { ArrowRight, ChevronDown, ChevronUp, type LucideIcon } from "lucide-react";
import type { OTFlowResult } from "../../types";

interface EvolutionGroupProps {
  title: string;
  data: OTFlowResult[];
  color: string;
  icon: LucideIcon;
  sublabel: string;
}

export const EvolutionGroup = ({ title, data, color, icon: Icon, sublabel }: EvolutionGroupProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`border rounded-xl bg-white overflow-hidden shadow-sm ${isOpen ? 'ring-2 ring-offset-1' : ''} ring-${color}-200 transition-all`}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        aria-expanded={isOpen}
        className="p-4 cursor-pointer hover:bg-slate-50 flex justify-between items-center focus:outline-none focus:bg-slate-100 focus:ring-inset focus:ring-2 focus:ring-blue-400"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-${color}-100 text-${color}-600`}>
            <Icon size={20} />
          </div>
          <div>
            <h4 className="font-black text-sm text-slate-700 uppercase">{title}</h4>
            <span className="text-xs text-slate-400 font-medium">{sublabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-black text-${color}-600`}>{data.length}</span>
          {isOpen ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
        </div>
      </div>

      {isOpen && data.length > 0 && (
        <div className="border-t border-slate-100 max-h-60 overflow-y-auto bg-slate-50/50 p-2">
          <table className="w-full text-xs text-left">
            <thead className="text-slate-400 font-bold uppercase">
              <tr>
                <th className="px-2 py-1">Planta</th>
                <th className="px-2 py-1">OT</th>
                <th className="px-2 py-1">Cambio</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.ot} className="border-b border-slate-200/50 last:border-0 hover:bg-white transition-colors">
                  <td className="px-2 py-2 font-bold text-slate-600 w-16">{row.planta}</td>
                  <td className="px-2 py-2 font-mono text-slate-500 w-20">{row.ot}</td>
                  <td className="px-2 py-2 text-slate-700">
                    <div className="flex flex-col">
                      <span className="truncate max-w-[200px] font-medium">{row.descripcion}</span>
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        {row.estadoAnterior || 'N/A'} <ArrowRight size={8} /> {row.estadoActual || 'Fin'}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};


