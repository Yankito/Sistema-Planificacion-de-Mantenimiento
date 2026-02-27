import { UserMinus, Trash2, ShieldCheck, User } from "lucide-react";
import { CONFIG_ROLES } from "../utils/planificacionUtils";

interface CandidatoAsignacion {
  nombre: string;
  estaDisponible: boolean;
  yaEnUso: boolean;
  esExento: boolean;
  turnoDia: string;
}


interface TecnicoButtonProps {
  cand: CandidatoAsignacion;
  esSeleccionado: boolean;
  onAsignar: () => void;
  esSabado: boolean;
}

const TecnicoButton = ({ cand, esSeleccionado, onAsignar, esSabado }: TecnicoButtonProps) => {
  const isDisabled = !cand.estaDisponible || cand.yaEnUso;

  const getBadgeContent = () => {
    if (cand.yaEnUso) return 'X';
    if (cand.esExento) return <ShieldCheck size={12} />;
    if (cand.estaDisponible) return esSabado ? 'S' : 'N';
    return cand.turnoDia;
  };

  const badgeClass = cand.yaEnUso
    ? '!bg-amber-500 !text-white'
    : !cand.estaDisponible
      ? 'bg-slate-100 text-slate-400'
      : cand.esExento
        ? 'bg-purple-500 text-white'
        : 'bg-pf-red text-white';

  return (
    <button
      disabled={isDisabled && !esSeleccionado}
      onClick={onAsignar}
      className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all border group relative
        ${esSeleccionado ? 'bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-pf-red/50' : 'bg-white border-slate-200'}
        ${!isDisabled && !esSeleccionado ? 'hover:border-pf-red hover:shadow-md cursor-pointer' : ''}
        ${isDisabled && !esSeleccionado ? 'opacity-40 grayscale cursor-not-allowed bg-slate-50' : ''}
      `}
    >
      <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-black ${badgeClass}`}>
        {getBadgeContent()}
      </div>
      <div className="flex flex-col overflow-hidden min-w-0">
        <span className="text-[10px] font-bold truncate leading-tight">{cand.nombre}</span>
        {cand.esExento && <span className="text-[8px] opacity-70 font-bold uppercase">Exento</span>}
      </div>
    </button>
  );
};

interface TecnicoSlotProps {
  idx: number;
  slot: { rol: string; nombre: string };
  nroOrden: string;
  onAsignar: (ordenId: string, indiceTecnico: number, nuevoNombre: string, esAutomatico?: boolean) => void;
  onModificarCupos: (ordenId: string, accion: 'ADD' | 'REMOVE', rol?: string, indice?: number) => void;
  candidatos: CandidatoAsignacion[];
  esSabado: boolean;
}

export const TecnicoSlot = ({ idx, slot, nroOrden, onModificarCupos, onAsignar, candidatos, esSabado }: TecnicoSlotProps) => {
  const config = CONFIG_ROLES[slot.rol] || { label: slot.rol, color: 'bg-slate-500', text: 'text-slate-500' };

  return (
    <div className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm relative group/card">
      <div className="flex justify-between mb-3 items-center border-b border-slate-100 pb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
            Puesto {idx + 1}: <span className={config.text}>{config.label}</span>
          </span>
          <button
            onClick={() => onModificarCupos(nroOrden, 'REMOVE', undefined, idx)}
            className="opacity-0 group-hover/card:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all"
          >
            <Trash2 size={12} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          {slot.nombre !== 'VACANTE' && (
            <div className={`flex items-center gap-1 mr-2 ${config.text}`}>
              <User size={12} className="fill-current" />
            </div>
          )}

          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${slot.nombre === 'VACANTE' ? 'bg-amber-100 text-amber-600' : 'bg-green-100 text-green-700'}`}>
            Actual: {slot.nombre}
          </span>

          {slot.nombre !== 'VACANTE' && (
            <button onClick={() => onAsignar(nroOrden, idx, "VACANTE")} className="p-1 bg-red-50 text-red-500 rounded hover:bg-red-100 hover:text-red-700 transition-colors">
              <UserMinus size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
        {candidatos.map((cand) => (
          <TecnicoButton
            key={cand.nombre}
            cand={cand}
            esSeleccionado={cand.nombre === slot.nombre}
            esSabado={esSabado}
            onAsignar={() => {
              const isDisabled = !cand.estaDisponible || cand.yaEnUso;
              if (!isDisabled) onAsignar(nroOrden, idx, cand.nombre, false);
            }}
          />
        ))}
      </div>
    </div>
  );
};
