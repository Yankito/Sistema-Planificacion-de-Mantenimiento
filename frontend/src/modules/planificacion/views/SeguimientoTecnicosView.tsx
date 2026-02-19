import { useState } from "react";
import type { PlanResult } from "../types";
import { User, AlertTriangle, CheckCircle2, Search, X, ArrowRightCircle, Wrench, Zap, Cog, Eye, Flame, Briefcase } from "lucide-react";
import { useTecnicosCarga } from "../hooks/useTecnicosCarga"; // Importamos el Hook
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


interface Props {
  planResult: PlanResult[];
  plantas: string[];
  onNavegar: (planta: string, fecha: string) => void;
  mes?: string;
}

export const SeguimientoTecnicosView = ({ planResult, plantas, onNavegar, mes }: Props) => {
  const [plantaSel, setPlantaSel] = useState("TODAS");

  const {
    tecnicosFiltrados, diasMes,
    busqueda, setBusqueda,
    celdaSeleccionada, setCeldaSeleccionada,
    totalTecnicos
  } = useTecnicosCarga(planResult, plantaSel);

  return (
    <div className="space-y-6 h-full flex flex-col animate-in fade-in">

      {/* HEADER */}
      <div className="bg-white p-6 rounded-3xl border border-pf-border shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-black uppercase italic text-slate-900">Carga de Trabajo</h2>
          <p className="text-xs text-slate-400 font-bold">
            {totalTecnicos} Técnicos encontrados en {plantaSel}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar técnico..."
              className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-pf-red transition-all w-48"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <select value={plantaSel} onChange={(e) => setPlantaSel(e.target.value)} className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none cursor-pointer hover:border-pf-red transition-colors">
            <option value="TODAS">TODAS LAS PLANTAS</option>
            {plantas.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* TABLA HEATMAP (Visualización pura) */}
      <div className="bg-white border border-pf-border rounded-[2.5rem] shadow-sm flex-1 overflow-hidden flex flex-col relative">
        <div className="overflow-auto custom-scrollbar flex-1">
          {tecnicosFiltrados.length > 0 ? (
            <table className="min-w-full border-collapse">
              <thead className="bg-slate-50 sticky top-0 z-20">
                <tr className="bg-slate-50 border-b border-pf-border">
                  <th colSpan={32} className="p-4 text-left text-[12px] font-black text-slate-600 uppercase tracking-widest border-r border-pf-border min-w-[200px] shadow-[4px_0_8px_-4px_rgba(0,0,0,0.05)]">
                    {mes || "Mes Desconocido"}
                  </th>
                </tr>
                <tr>
                  <th className="p-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-r border-pf-border min-w-[200px] sticky left-0 bg-slate-50 z-30 shadow-[4px_0_10px_-5px_rgba(0,0,0,0.1)]">
                    Técnico
                  </th>
                  {diasMes.map(dia => {
                    const [d, ,] = dia.split('/');
                    return (
                      <th key={dia} className="p-2 text-center border-b border-r border-pf-border min-w-[40px]">
                        <span className="text-xs font-black text-slate-600">{d}</span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {tecnicosFiltrados.map((tec) => {
                  const roleKey = (tec.rol || 'M').toUpperCase().trim();
                  const config = CONFIG_ROLES[roleKey] || CONFIG_ROLES['M'];

                  return (
                    <tr key={tec.nombre} className="group hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 border-r border-b border-pf-border sticky left-0 bg-white group-hover:bg-slate-50/50 z-10 shadow-[4px_0_10px_-5px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg shrink-0 ${config.color.replace('text-', 'bg-').replace('600', '50')} ${config.text}`}>
                            {getIconForRole(roleKey)}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-black text-slate-800 truncate max-w-[140px]" title={tec.nombre}>{tec.nombre}</p>
                            <p className={`text-[9px] font-bold ${config.text}`}>{config.label}</p>
                          </div>
                        </div>
                      </td>
                      {diasMes.map(dia => {
                        const trabajos = tec.carga[dia] || [];
                        const cantidad = trabajos.length;
                        let bgClass = "";
                        if (cantidad < 1) bgClass = "";
                        else if (cantidad < 4) bgClass = "bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200";
                        else if (cantidad < 6) bgClass = "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-200";
                        else if (cantidad < 8) bgClass = "bg-red-500 text-white hover:bg-red-600 shadow-red-200";
                        else bgClass = "bg-red-800 text-white hover:bg-red-900 animate-pulse shadow-red-200";

                        return (
                          <td key={dia} className="p-1 border-r border-b border-slate-100 text-center h-12 relative">
                            {cantidad > 0 && (
                              <button
                                onClick={() => setCeldaSeleccionada({ nombre: tec.nombre, fecha: dia, ots: trabajos })}
                                className={`w-8 h-8 mx-auto rounded-lg flex items-center justify-center text-xs font-black shadow-md transition-transform active:scale-90 ${bgClass}`}
                              >
                                {cantidad}
                              </button>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
              <p className="text-sm font-bold">No se encontraron técnicos con carga asignada.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL DETALLE DE CARGA */}
      {celdaSeleccionada && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="bg-slate-900 p-6 flex justify-between items-center text-white shrink-0">
              <div>
                <h3 className="text-lg font-black uppercase italic">{celdaSeleccionada.nombre}</h3>
                <p className="text-xs text-slate-400 font-bold mt-1">Carga del día {celdaSeleccionada.fecha}</p>
              </div>
              <button onClick={() => setCeldaSeleccionada(null)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-3 overflow-y-auto bg-slate-50/50">
              {celdaSeleccionada.ots.map((ot: PlanResult, i: number) => (
                <div key={i} className="border border-slate-200 rounded-2xl p-4 bg-white shadow-sm flex gap-4 items-start">
                  <div className={`p-3 rounded-xl shadow-sm border border-slate-100 shrink-0 ${ot.tecnicos.length > 1 ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'}`}>
                    {ot.tecnicos.length > 1 ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-[10px] font-black text-pf-red uppercase mb-1 bg-pf-red/5 px-2 py-0.5 rounded w-fit">OT: {ot.nroOrden}</p>
                      <span className="text-[9px] font-bold text-slate-400">{ot.planta}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-800 leading-tight mb-2">{ot.descripcion}</p>
                    <p className="text-[10px] text-slate-500 uppercase font-bold bg-slate-100 px-2 py-1 rounded w-fit border border-slate-200">
                      {ot.equipo}
                    </p>
                  </div>
                  {/* BOTÓN DE NAVEGACIÓN */}
                  <button
                    onClick={() => onNavegar(ot.planta, ot.fechaSugerida)}
                    className="p-2 text-slate-300 hover:text-pf-red hover:bg-pf-red/5 rounded-full transition-all"
                    title="Ver en Planificación"
                  >
                    <ArrowRightCircle size={24} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};