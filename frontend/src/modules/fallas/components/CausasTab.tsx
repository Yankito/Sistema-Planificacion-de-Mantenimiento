import { Search, AlertTriangle } from "lucide-react";
import { HeaderSection } from "./ui/HeaderSection";
import type { FiltroDrill, GrupoMecanicoStats } from "../types";

interface CausasTabProps {
  analytics: {
    porCausa: GrupoMecanicoStats[];
    totalEventos: number;
  };
  filtroDrill: FiltroDrill | null;
  setFiltroDrill: (f: FiltroDrill | null) => void;
}

export const CausasTab = ({ analytics, filtroDrill, setFiltroDrill }: CausasTabProps) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px] animate-in fade-in duration-500">
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
        <HeaderSection icon={Search} title="Ranking de Causas Raíz" color="text-blue-600" bg="bg-blue-50" />
        <div className="mt-4 flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-2">
          {analytics.porCausa.map((item, i) => (
            <div key={i} onClick={() => setFiltroDrill(filtroDrill?.valor === item.label ? null : { tipo: 'CAUSA', valor: item.label })}
              className={`flex justify-between items-center p-3 rounded-xl group border transition-all cursor-pointer ${filtroDrill?.valor === item.label ? 'bg-blue-50 border-blue-200' : 'hover:bg-slate-50 border-transparent'}`}>
              <div className="flex items-center gap-3 w-3/4">
                <span className="text-slate-300 font-bold text-xs w-6">#{i + 1}</span>
                <div className="w-full">
                  <div className="font-bold text-slate-700 text-sm truncate" title={item.label}>{item.label}</div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full mt-1.5 overflow-hidden"><div className="bg-blue-500 h-full" style={{ width: `${Math.min((item.count / analytics.porCausa[0].count) * 100, 100)}%` }}></div></div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-blue-600 text-lg">{item.count}</div>
                <div className="text-[9px] text-slate-400 uppercase font-bold">Eventos</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-center items-center text-center">
        <div className="p-4 bg-amber-50 rounded-full text-amber-500 mb-4"><AlertTriangle size={32} /></div>
        <h3 className="text-lg font-bold text-slate-800">Insight de Causas</h3>
        <p className="text-slate-500 text-sm max-w-xs mt-2">
          La causa <b>"{analytics.porCausa[0]?.label}"</b> representa el <b className="text-blue-600">{((analytics.porCausa[0]?.count / analytics.totalEventos) * 100).toFixed(1)}%</b> de todos los incidentes.
        </p>
        {filtroDrill?.tipo === 'CAUSA' && (
          <button onClick={() => setFiltroDrill(null)} className="mt-6 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200">Limpiar Filtro</button>
        )}
      </div>
    </div>
  );
};