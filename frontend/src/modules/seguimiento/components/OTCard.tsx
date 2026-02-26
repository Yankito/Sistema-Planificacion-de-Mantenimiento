import { CheckCircle2, AlertCircle, Calendar } from "lucide-react";
import type { AtrasoRow } from "../types";
import type { TecnicoEstado } from "../../../shared/types/index";

interface OTCardProps {
  item: AtrasoRow;
  isNew?: boolean;
  onSelectTech?: (name: string) => void;
  selectedTech?: string | null;
}

export const OTCard = ({ item, isNew, onSelectTech, selectedTech }: OTCardProps) => {
  const esNueva = isNew || item.isNew;
  return (
    <div className={`bg-white p-3 rounded-xl border shadow-sm transition-all ${esNueva ? 'border-l-4 border-pf-red-600 shadow-pf-red-100' : 'border-pf-neutral-200'}`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-black text-pf-neutral-900">{item.ot}</span>

          {esNueva && (
            <span className="bg-pf-red-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-black animate-pulse shadow-sm">
              NUEVA
            </span>
          )}
        </div>

        {item.fecha && (
          <div className="flex items-center gap-1 text-pf-neutral-500">
            <Calendar size={10} />
            <span className="text-[9px] font-bold">{item.fecha}</span>
          </div>
        )}
      </div>

      <div className="mb-2">
        <span className={`text-[9px] px-2 py-0.5 rounded-md font-black bg-white border ${item.clasificacion === 'FINALIZADA' ? 'bg-pf-success-100 text-pf-success-700 border-pf-success-200' :
          item.clasificacion === 'PROGRAMADOR' ? 'bg-pf-blue-100 text-pf-blue-700 border-pf-blue-200' :
            item.clasificacion === 'TECNICO / SERVICIO' ? 'bg-pf-blue-50 text-pf-blue-600 border-pf-blue-200' :
              'bg-pf-warning-100 text-pf-warning-700 border-pf-warning-200'
          }`}>
          {item.clasificacion}
        </span>
      </div>

      <p className="text-[10px] text-pf-neutral-500 uppercase font-bold line-clamp-2 mb-3 leading-relaxed tracking-tight">{item.descripcion}</p>

      <div className="bg-pf-neutral-50 border border-pf-neutral-100 rounded-lg p-2 mb-3 space-y-1 shadow-inner">
        {item.detallesTecnicos?.map((t: TecnicoEstado, i: number) => (
          <div
            key={i}
            onClick={() => onSelectTech && onSelectTech(t.tecnico.nombre)}
            className={`flex items-center justify-between p-1 rounded transition-colors ${!selectedTech ? 'hover:bg-pf-red-50 cursor-pointer group' : ''}`}
          >
            <span className={`text-[10px] font-bold ${selectedTech === t.tecnico.nombre ? 'text-pf-red-600' : 'text-pf-neutral-600 group-hover:text-pf-red-600'}`}>
              {t.tecnico.nombre}
            </span>
            {t.opFinalizada ? <CheckCircle2 size={14} className="text-pf-success-500" /> : <AlertCircle size={14} className="text-pf-red-500" />}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className={`p-1.5 rounded-lg border flex flex-col items-center shadow-sm ${item.rmd === 'SI' || item.rmd === '' || item.rmd === '0' || item.rmd === null ? 'bg-pf-success-50 text-pf-success-700 border-pf-success-100' : 'bg-pf-red-50 text-pf-red-700 border-pf-red-100'}`}>
          <span className="text-[7px] font-black uppercase opacity-60">RMD</span>
          <span className="text-[10px] font-black">{item.rmd}</span>
        </div>
        <div className={`p-1.5 rounded-lg border flex flex-col items-center shadow-sm ${item.rse === 'SI' || item.rse === '' || item.rse === '0' || item.rse === null ? 'bg-pf-success-50 text-pf-success-700 border-pf-success-100' : 'bg-pf-red-50 text-pf-red-700 border-pf-red-100'}`}>
          <span className="text-[7px] font-black uppercase opacity-60">RSE</span>
          <span className="text-[10px] font-black">{item.rse}</span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-pf-neutral-100 text-[9px] font-black text-pf-neutral-800 uppercase tracking-widest">
        <span>{item.periodo}</span>
        <span>{item.planta}</span>
      </div>
    </div>
  );
};