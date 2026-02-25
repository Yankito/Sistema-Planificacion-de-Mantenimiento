import { Move, User, Sparkles, Calendar } from "lucide-react";
import { CONFIG_ROLES } from "../../utils/planificacionUtils";
import type { PlanResult } from "../../types";

interface TarjetaOrdenProps {
  orden: PlanResult;
  handleDragStart: (e: React.DragEvent<HTMLDivElement>, orden: PlanResult) => void;
  handleDragEnd: () => void;
  esAsignada: boolean;
  onEditTecnicos?: (orden: PlanResult) => void;
}

export const TarjetaOrden = ({ orden, handleDragStart, handleDragEnd, esAsignada, onEditTecnicos }: TarjetaOrdenProps) => {
  const listaTecnicos = orden.tecnicos;

  return (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, orden)}
      onDragEnd={handleDragEnd}
      className={`p-5 bg-white rounded-3xl border shadow-sm cursor-grab active:cursor-grabbing hover:border-pf-red transition-all group relative overflow-hidden
        ${esAsignada ? 'border-pf-neutral-100' : 'border-pf-warning-200'}
      `}
    >


      {!esAsignada && <div className="absolute top-4 left-0 w-1 h-8 bg-pf-warning-400 rounded-r-full" />}

      <div className="flex justify-between items-start mb-3 pl-2">
        <div className="flex flex-col">
          <p className="text-[10px] font-black text-pf-red uppercase italic leading-none">OT: {orden.nroOrden}</p>
          {orden.equipo && (
            <p className="text-[9px] font-bold text-pf-neutral-400 uppercase tracking-tighter mt-1">Eq: {orden.equipo}</p>
          )}
          {!esAsignada && orden.error && (
            <span className="text-[7px] font-black bg-pf-red-100 text-pf-red-700 px-1.5 py-0.5 rounded uppercase mt-1 w-fit">
              {orden.error}
            </span>
          )}
        </div>
        <Move size={14} className="text-pf-neutral-300 group-hover:text-pf-red transition-colors" />
      </div>

      <p className="font-black text-pf-neutral-800 text-sm leading-tight mb-4 pl-2 line-clamp-2 tracking-tight">{orden.descripcion}</p>

      <div className="pl-2 space-y-2">
        <div className="flex flex-col gap-1.5">
          {listaTecnicos.map((tec, idx) => {
            const config = CONFIG_ROLES[tec.rol] || { label: tec.rol, color: 'bg-pf-neutral-500', text: 'text-pf-neutral-500' };

            return (
              <div key={`${tec.nombre}-${idx}`} className="flex items-center justify-between">
                <div className="text-[10px] font-bold text-pf-neutral-400 flex items-center gap-1.5 w-full">
                  <div className={`flex items-center gap-1 ${config.text}`}>
                    <User size={10} className="fill-current" />
                  </div>

                  <span className={`truncate flex-1 ${tec.nombre === "VACANTE" ? config.text : "text-pf-neutral-600"}`}>
                    {tec.nombre}
                  </span>

                  {tec.esSugerido && (
                    <div title="Sugerido automáticamente">
                      <Sparkles size={11} className="text-pf-blue-500 ml-1 fill-pf-blue-100 animate-pulse" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {esAsignada && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onEditTecnicos) onEditTecnicos(orden);
              }}
              className="mt-3 w-full text-[10px] font-black text-pf-neutral-500 bg-pf-neutral-50 hover:bg-pf-neutral-100 hover:text-pf-red py-2 rounded-xl border border-pf-neutral-200 transition-all uppercase tracking-widest shadow-sm active:scale-95"
            >
              Cambiar Técnicos
            </button>
          )}
        </div>

        {orden.fechaAnterior && orden.fechaAnterior !== "N/A" && (
          <div className="flex items-center gap-1 text-[9px] font-black text-pf-blue-600 bg-pf-blue-50 px-2.5 py-1 rounded-lg w-fit mt-1 border border-pf-blue-100/50 shadow-sm">
            <Calendar size={10} />
            <span>Última vez: {orden.fechaAnterior}</span>
          </div>
        )}

        {orden.fechaSugerida && (
          <div className="flex items-center gap-1 text-[9px] font-black text-pf-neutral-600 bg-pf-neutral-100 px-2.5 py-1 rounded-lg w-fit mt-1 border border-pf-neutral-200/50 shadow-sm">
            <Calendar size={10} />
            <span>Prog: {orden.fechaSugerida}</span>
          </div>
        )}
      </div>
    </div>
  );
};