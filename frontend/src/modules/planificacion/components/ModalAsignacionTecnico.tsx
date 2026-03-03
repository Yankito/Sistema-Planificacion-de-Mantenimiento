import { X, Moon, Plus, Wand2 } from "lucide-react";
import { CONFIG_ROLES } from "../utils/planificacionUtils";
import { useModalAsignacion } from "../hooks/useModalAsignacion";
import type { PlanResult } from "../types";
import type { Tecnico } from "../../../shared/types/index";
import { TecnicoSlot } from "./TecnicoSlot";

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

const ROLE_BUTTON_COLORS: Record<string, string> = {
  M: "bg-blue-600 hover:bg-blue-500",
  E: "bg-yellow-600 hover:bg-yellow-500",
  SADEMA: "bg-emerald-600 hover:bg-emerald-500",
  SUPERVISOR: "bg-purple-600 hover:bg-purple-500",
  CALDERA: "bg-pink-600 hover:bg-pink-500",
};


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

  if (!isOpen || !orden) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">

        {/* Header */}
        <div className="bg-pf-neutral-100 text-black p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-xl font-black uppercase tracking-wider">Asignar Técnicos</h3>
              <p className="text-slate-600 text-xs font-bold mt-1">{orden.equipo} - {orden.descripcion}</p>
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
            {['M', 'E', 'SADEMA', 'SUPERVISOR', 'CALDERA', 'SE'].map(rol => {
              const cfg = CONFIG_ROLES[rol] || { color: 'bg-slate-600', label: rol };
              const btnColor = ROLE_BUTTON_COLORS[rol] || "bg-slate-600 hover:bg-slate-500";

              return (
                <button
                  key={rol}
                  onClick={() => onModificarCupos(orden.nroOrden, 'ADD', rol)}
                  className={`flex items-center gap-1 text-[10px] font-bold ${btnColor} text-white px-3 py-1.5 rounded-lg transition-colors`}
                >
                  <Plus size={12} /> {cfg.label}
                </button>
              );
            })}

            <button onClick={sugerirTecnicosFaltantes} className="ml-auto flex items-center gap-1 text-[10px] font-bold bg-pf-red hover:bg-pf-red/80 text-white px-3 py-1.5 rounded-lg transition-colors shadow-lg shadow-pf-red/20">
              <Wand2 size={12} /> Sugerir Disponibles
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto space-y-6 bg-slate-50/50">
          {orden.tecnicos.map((slot, idx) => (
            <TecnicoSlot
              key={idx}
              idx={idx}
              slot={slot}
              nroOrden={orden.nroOrden}
              onModificarCupos={onModificarCupos}
              onAsignar={onAsignar}
              candidatos={getCandidatosParaSlot(slot.rol, slot.nombre)}
              esSabado={esSabado}
            />
          ))}
        </div>
      </div>
    </div>
  );
};