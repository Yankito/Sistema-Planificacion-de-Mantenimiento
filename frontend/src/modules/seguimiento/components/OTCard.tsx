import { CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import type { AtrasoRow, TecnicoEstado } from "../types";

interface OTCardProps {
  item: AtrasoRow;
  isNew?: boolean;
  onSelectTech?: (name: string) => void;
  selectedTech?: string | null;
}

export const OTCard = ({ item, isNew, onSelectTech, selectedTech }: OTCardProps) => {
  const esNueva = isNew || item.isNew;
  return (
    <div className={`bg-white p-4 rounded-xl border shadow-sm transition-all ${esNueva ? 'border-l-4 border-red-600 shadow-red-100' : 'border-slate-200'}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-slate-900">{item.ot}</span>

          {esNueva && (
            <span className="bg-red-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse shadow-sm">
              NUEVA
            </span>
          )}
        </div>

        {item.fecha && (
          <div className="flex items-center gap-1 text-slate-400">
            <Calendar size={10} />
            <span className="text-[9px] font-bold">{item.fecha}</span>
          </div>
        )}
      </div>

      <div className="mb-3">
        <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold ${item.clasificacion === 'CUMPLIDA' ? 'bg-green-100 text-green-700 border border-green-200' :
          item.clasificacion === 'PROGRAMADOR' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
            item.clasificacion === 'TECNICO / SERVICIO' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
              'bg-amber-100 text-amber-700 border border-amber-200'
          }`}>
          {item.clasificacion}
        </span>
      </div>

      <p className="text-[10px] text-slate-500 uppercase font-medium line-clamp-2 mb-3">{item.descripcion}</p>

      <div className="bg-slate-50 border border-slate-100 rounded-lg p-2 mb-3 space-y-1">
        {item.detallesTecnicos?.map((t: TecnicoEstado, i: number) => (
          <div
            key={i}
            onClick={() => onSelectTech && onSelectTech(t.tecnico.nombre)}
            className={`flex items-center justify-between p-1 rounded transition-colors ${!selectedTech ? 'hover:bg-red-50 cursor-pointer group' : ''}`}
          >
            <span className={`text-[10px] font-bold ${selectedTech === t.tecnico.nombre ? 'text-red-600' : 'text-slate-600 group-hover:text-red-600'}`}>
              {t.tecnico.nombre}
            </span>
            {t.opFinalizada ? <CheckCircle2 size={14} className="text-green-500" /> : <AlertCircle size={14} className="text-red-500" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className={`p-1.5 rounded-lg border flex flex-col items-center ${item.rmd === 'SI' || item.rmd === '' || item.rmd === '0' || item.rmd === null ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
          <span className="text-[7px] font-black uppercase opacity-60">RMD</span>
          <span className="text-[10px] font-bold">{item.rmd}</span>
        </div>
        <div className={`p-1.5 rounded-lg border flex flex-col items-center ${item.rse === 'SI' || item.rse === '' || item.rse === '0' || item.rse === null ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
          <span className="text-[7px] font-black uppercase opacity-60">RSE</span>
          <span className="text-[10px] font-bold">{item.rse}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-50 text-[9px] font-bold text-slate-400 uppercase">
        <span>{item.periodo}</span>
        <span className="italic">{item.planta}</span>
      </div>
    </div>
  );
};