import { X, Moon, UserMinus, Plus, Trash2, Wand2, ShieldCheck, User } from "lucide-react";
import { CONFIG_ROLES } from "../utils/planificacionUtils";
import { useModalAsignacion } from "../hooks/useModalAsignacion"; // Importamos el Hook
import type { PlanResult, Tecnico } from "../types";

interface CandidatoAsignacion {
  nombre: string;
  estaDisponible: boolean;
  yaEnUso: boolean;
  esExento: boolean;
  turnoDia: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  orden: PlanResult | null;
  fecha: string;
  tecnicos: Tecnico[];
  mapaHorarios: Map<string, string[]>;
  onAsignar: (ordenId: string, indiceTecnico: number, nuevoNombre: string, esAutomatico?: boolean) => void;
  onModificarCupos: (ordenId: string, accion: 'ADD' | 'REMOVE', rol?: string, indice?: number) => void;
}

export const ModalAsignacionTecnico = ({
  isOpen, onClose, orden, fecha, tecnicos, mapaHorarios, onAsignar, onModificarCupos
}: Props) => {

  const { esSabado, sugerirTecnicosFaltantes, getCandidatosParaSlot } = useModalAsignacion({
    orden: orden || ({} as PlanResult),
    fecha,
    tecnicos,
    mapaHorarios,
    onAsignar
  });

  // 2. LUEGO LOS RETORNOS CONDICIONALES
  if (!isOpen || !orden) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-slate-900 text-white p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-wider">Asignar Técnicos</h3>
              <p className="text-slate-400 text-xs font-bold mt-1">{orden.equipo} - {orden.descripcion}</p>
              <div className="mt-2 inline-flex items-center gap-2 bg-pf-red/20 text-pf-red px-3 py-1 rounded-full text-xs font-bold">
                <Moon size={12} />
                {esSabado
                  ? `Sábado ${fecha}: Disponible salvo L/V/LIC`
                  : `Semana ${fecha}: Requiere Turno Noche`}
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X /></button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
            {/* Botones de acción rápida */}
            {['M', 'E', 'SADEMA', 'SUPERVISOR', 'CALDERA', 'SE'].map(rol => {
              const cfg = CONFIG_ROLES[rol] || { color: 'bg-slate-600', label: rol };
              // Ajuste rapido de colores para el botón (podrías extraer esto si quieres más precisión)
              let btnColor = "bg-slate-600 hover:bg-slate-500";
              if (rol === 'M') btnColor = "bg-blue-600 hover:bg-blue-500";
              if (rol === 'E') btnColor = "bg-yellow-600 hover:bg-yellow-500";
              if (rol === 'SADEMA') btnColor = "bg-emerald-600 hover:bg-emerald-500";
              if (rol === 'SUPERVISOR') btnColor = "bg-purple-600 hover:bg-purple-500";
              if (rol === 'CALDERA') btnColor = "bg-pink-600 hover:bg-pink-500";

              return (
                <button key={rol} onClick={() => onModificarCupos(orden.nroOrden, 'ADD', rol)} className={`flex items-center gap-1 text-[10px] font-bold ${btnColor} text-white px-3 py-1.5 rounded-lg transition-colors`}>
                  <Plus size={12} /> {cfg.label}
                </button>
              );
            })}

            <button onClick={sugerirTecnicosFaltantes} className="ml-auto flex items-center gap-1 text-[10px] font-bold bg-purple-600 hover:bg-purple-500 text-white px-3 py-1.5 rounded-lg transition-colors shadow-lg shadow-purple-900/20">
              <Wand2 size={12} /> Sugerir Disponibles
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 bg-slate-50/50">
          {orden.tecnicos.map((slot, idx) => {

            const config = CONFIG_ROLES[slot.rol] || { label: slot.rol, color: 'bg-slate-500', text: 'text-slate-500' };

            const candidatosConTurno: CandidatoAsignacion[] = getCandidatosParaSlot(slot.rol, slot.nombre);

            return (
              <div key={idx} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm relative group/card">
                <div className="flex justify-between mb-3 items-center border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                      Puesto {idx + 1}: <span className={config.text}>{config.label}</span>
                    </span>
                    <button onClick={() => onModificarCupos(orden.nroOrden, 'REMOVE', undefined, idx)} className="opacity-0 group-hover/card:opacity-100 p-1 text-slate-300 hover:text-red-500 transition-all">
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
                      <button onClick={() => onAsignar(orden.nroOrden, idx, "VACANTE")} className="p-1 bg-red-50 text-red-500 rounded hover:bg-red-100 hover:text-red-700 transition-colors">
                        <UserMinus size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {candidatosConTurno.map((cand) => {
                    const esSeleccionado = cand.nombre === slot.nombre;
                    const isDisabled = !cand.estaDisponible || cand.yaEnUso;
                    return (
                      <button
                        key={cand.nombre}
                        disabled={isDisabled && !esSeleccionado}
                        onClick={() => !isDisabled && onAsignar(orden.nroOrden, idx, cand.nombre, false)}
                        className={`flex items-center gap-2 p-2 rounded-xl text-left transition-all border group relative
                            ${esSeleccionado ? 'bg-slate-800 text-white border-slate-800 shadow-md ring-2 ring-pf-red/50' : 'bg-white border-slate-200'}
                            ${!isDisabled && !esSeleccionado ? 'hover:border-pf-red hover:shadow-md cursor-pointer' : ''}
                            ${isDisabled && !esSeleccionado ? 'opacity-40 grayscale cursor-not-allowed bg-slate-50' : ''}
                          `}
                      >
                        <div className={`w-6 h-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-black
                            ${cand.estaDisponible ? (cand.esExento ? 'bg-purple-500 text-white' : 'bg-pf-red text-white') : 'bg-slate-100 text-slate-400'}
                            ${cand.yaEnUso ? '!bg-amber-500 !text-white' : ''} 
                          `}>
                          {cand.yaEnUso ? 'X' : (cand.esExento ? <ShieldCheck size={12} /> : (cand.estaDisponible ? (esSabado ? 'S' : 'N') : cand.turnoDia))}
                        </div>
                        <div className="flex flex-col overflow-hidden min-w-0">
                          <span className="text-[10px] font-bold truncate leading-tight">{cand.nombre}</span>
                          <span className="text-[8px] opacity-70 font-bold uppercase">{cand.esExento ? "Exento" : ""}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};