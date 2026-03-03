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

  // Mapeo de colores para el sistema PF
  const colorMap: Record<string, { bg: string, text: string, ring: string, badge: string }> = {
    red: { bg: "bg-pf-red-100", text: "text-pf-red-600", ring: "ring-pf-red-200", badge: "bg-pf-red-50" },
    green: { bg: "bg-pf-success-100", text: "text-pf-success-600", ring: "ring-pf-success-200", badge: "bg-pf-success-50" },
    blue: { bg: "bg-pf-blue-100", text: "text-pf-blue-600", ring: "ring-pf-blue-200", badge: "bg-pf-blue-50" }
  };

  const style = colorMap[color] || colorMap.blue;

  return (
    <div className={`border border-pf-neutral-200 rounded-xl bg-white overflow-hidden shadow-sm ${isOpen ? `ring-2 ring-offset-1 ${style.ring}` : ''} transition-all`}>
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
        className="p-4 cursor-pointer hover:bg-pf-neutral-50 flex justify-between items-center focus:outline-none focus:bg-pf-neutral-100 focus:ring-inset focus:ring-2 focus:ring-pf-blue-400"
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${style.bg} ${style.text}`}>
            <Icon size={20} />
          </div>
          <div>
            <h4 className="font-black text-[11px] text-pf-neutral-700 uppercase tracking-tight">{title}</h4>
            <span className="text-[10px] text-pf-neutral-400 font-bold uppercase tracking-wider">{sublabel}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-2xl font-black ${style.text}`}>{data.length}</span>
          {isOpen ? <ChevronUp size={16} className="text-pf-neutral-400" /> : <ChevronDown size={16} className="text-pf-neutral-400" />}
        </div>
      </div>

      {isOpen && data.length > 0 && (
        <div className="border-t border-pf-neutral-100 max-h-60 overflow-y-auto bg-pf-neutral-50/50 p-2">
          <table className="w-full text-xs text-left">
            <thead className="text-[9px] font-black text-pf-neutral-400 uppercase tracking-widest border-b border-pf-neutral-100">
              <tr>
                <th className="px-3 py-2">Planta</th>
                <th className="px-3 py-2">OT</th>
                <th className="px-3 py-2">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-pf-neutral-100">
              {data.map((row) => (
                <tr key={row.nroOrden} className="hover:bg-white transition-colors">
                  <td className="px-3 py-2 font-black text-pf-neutral-700 text-[10px] uppercase w-16">{row.planta}</td>
                  <td className="px-3 py-2 font-mono text-pf-neutral-500 w-24">{row.nroOrden}</td>
                  <td className="px-3 py-2 text-pf-neutral-600">
                    <div className="flex flex-col">
                      <span className="truncate max-w-[200px] font-bold text-pf-neutral-800">{row.descripcion}</span>
                      <span className="text-[9px] text-pf-neutral-400 flex items-center gap-1 font-bold">
                        {row.estadoAnterior || '---'} <ArrowRight size={8} className="text-pf-red" /> {row.estadoActual || 'Finalizado'}
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


