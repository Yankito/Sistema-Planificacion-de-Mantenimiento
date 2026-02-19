import { type HorarioTecnico } from "../types";
import { Wrench, Zap, User, Eye, Cog, Flame, Briefcase } from "lucide-react";
import { CONFIG_ROLES } from "../utils/planificacionUtils";

const getIconForRole = (rol: string) => {
  switch (rol) {
    case 'M': return <Wrench size={14} fill="currentColor" />;
    case 'E': return <Zap size={14} fill="currentColor" />;
    case 'SADEMA': return <Cog size={14} fill="currentColor" />;
    case 'SUPERVISOR': return <Eye size={14} fill="currentColor" />;
    case 'CALDERA': return <Flame size={14} fill="currentColor" />;
    case 'SE': return <Briefcase size={14} fill="currentColor" />;
    default: return <User size={14} fill="currentColor" />;
  }
};

const COLORES_TURNOS: Record<string, string> = {
  'M': 'bg-blue-500 text-white shadow-sm hover:bg-blue-600',      // Mañana
  'T': 'bg-orange-500 text-white shadow-sm hover:bg-orange-600',    // Tarde
  'N': 'bg-slate-800 text-white shadow-sm hover:bg-slate-700',     // Noche
  'L': 'bg-slate-100 text-slate-300 hover:bg-slate-200',           // Libre
  'V': 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600',   // Vacaciones
  'LIC': 'bg-rose-500 text-white shadow-sm hover:bg-rose-600',    // Licencia
};

interface Props {
  horarios: HorarioTecnico[];
  onCambioTurno: (nombre: string, diaIndex: number) => void;
  mes?: string;
}

export const HorarioView = ({ horarios, onCambioTurno, mes }: Props) => {
  return (
    <div className="bg-white border border-pf-border rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-500">
      <div className="overflow-x-auto custom-scrollbar">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-pf-border">
              <th colSpan={32} className="p-4 text-left text-[12px] font-black text-slate-600 uppercase tracking-widest border-r border-pf-border min-w-[200px] shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                {mes || "Mes Desconocido"}
              </th>
            </tr>
            <tr className="bg-slate-50 border-b border-pf-border">
              <th className="sticky left-0 z-20 bg-slate-50 p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-r border-pf-border min-w-[200px] shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                Personal de Mantención
              </th>
              {Array.from({ length: 31 }, (_, i) => (
                <th key={i} className="p-2 text-[10px] font-bold text-slate-400 border-r border-pf-border min-w-[38px] text-center">
                  {i + 1}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {horarios.map((h, idx) => {
              const roleKey = (h.rol || 'M').toUpperCase().trim();
              const config = CONFIG_ROLES[roleKey] || CONFIG_ROLES['M'];

              return (
                <tr key={idx} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                  {/* Columna Fija de Nombre */}
                  <td className="sticky left-0 z-10 bg-white p-4 border-r border-pf-border shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-xl shrink-0 ${config.color.replace('text-', 'bg-').replace('600', '50')} ${config.text}`}>
                        {getIconForRole(roleKey)}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-sm font-black text-slate-800 truncate max-w-[140px]">{h.nombre}</p>
                        <p className={`text-[9px] font-black uppercase tracking-tighter ${config.text}`}>
                          {config.label}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Celdas de Turnos */}
                  {h.turnos.map((turno, dayIdx) => (
                    <td key={dayIdx} className="p-1 border-r border-slate-100 text-center">
                      <button
                        onClick={() => onCambioTurno(h.nombre, dayIdx)}
                        title={`Día ${dayIdx + 1}: ${turno} (Clic para cambiar)`}
                        className={`
                          w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-all
                          cursor-pointer active:scale-90
                          ${COLORES_TURNOS[turno] || 'bg-slate-50 text-slate-200'}
                        `}
                      >
                        {turno}
                      </button>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};