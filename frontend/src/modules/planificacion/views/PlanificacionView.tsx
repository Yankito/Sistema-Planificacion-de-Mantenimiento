import { useState, useMemo, useEffect } from "react";
import { usePlanificacionLogic } from "../hooks/usePlanificacionLogic";
import { Calendario } from "../components/Calendario";
import { PanelLateral } from "../components/PanelLateral";
import { ModalAsignacionTecnico } from "../components/ModalAsignacionTecnico";
import { Loader2, CalendarDays } from "lucide-react";
import { useData } from "../../../context/PlanificacionContext";
import { getMonthOptions } from "../../../shared/utils/dateUtils";

export const PlanificacionView = () => {
  const { planning } = useData();
  const {
    planResult, setPlanResult, plantaPlan, setPlantaPlan,
    cargandoPlan,
    tecnicosMap, mapaHorariosActual,
    mesSeleccionado, setMesSeleccionado,
    planFiltrado, sinAsignarFiltrado,
    cargarPlanificacion
  } = planning;
  console.log("cargandoPlan", cargandoPlan);

  useEffect(() => {
    cargarPlanificacion(mesSeleccionado, plantaPlan);
  }, [cargarPlanificacion, mesSeleccionado, plantaPlan]);

  const [idOrdenEditando, setIdOrdenEditando] = useState<string | null>(null);

  const monthOpts = getMonthOptions().options;

  const logic = usePlanificacionLogic({
    planResult,
    setPlanResult,
    fechaSeleccionada: null,
    tecnicosMap: tecnicosMap || new Map(),
    mapaHorarios: mapaHorariosActual || new Map(),
    itemsVisualizados: planFiltrado,
    cargandoPlan
  });

  const ordenEnEdicion = useMemo(() => {
    if (!idOrdenEditando) return null;
    return planResult.find(o => o.nroOrden === idOrdenEditando) || null;
  }, [planResult, idOrdenEditando]);

  const handleAsignarTecnico = (ordenId: string, indiceTecnico: number, nuevoNombre: string) => {
    const nuevoPlan = planResult.map(ot => {
      if (ot.nroOrden !== ordenId) return ot;
      const nuevosTecnicos = [...ot.tecnicos];
      nuevosTecnicos[indiceTecnico] = { ...nuevosTecnicos[indiceTecnico], nombre: nuevoNombre };
      return { ...ot, tecnicos: nuevosTecnicos };
    });
    setPlanResult(nuevoPlan);
  };

  const handleModificarCupos = (ordenId: string, accion: 'ADD' | 'REMOVE', rol?: string, indice?: number) => {
    const nuevoPlan = planResult.map(ot => {
      if (ot.nroOrden !== ordenId) return ot;
      const nuevosTecnicos = [...ot.tecnicos];
      if (accion === 'ADD' && rol) {
        nuevosTecnicos.push({ nombre: 'VACANTE', rol });
      } else if (accion === 'REMOVE' && indice !== undefined) {
        nuevosTecnicos.splice(indice, 1);
      }
      return { ...ot, tecnicos: nuevosTecnicos };
    });
    setPlanResult(nuevoPlan);
  };

  const plantas = ["PF3", "PF4", "PF5", "PF6", "CDT", "OTROS"];

  return (
    <div className="flex flex-col h-full gap-4 relative">
      {/* HEADER CON FILTROS */}
      <div className="flex items-center justify-between bg-white p-6 rounded-[2.5rem] border border-pf-border shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex flex-col w-56">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 px-1 flex items-center gap-1">
              <CalendarDays size={12} /> Mes de Planificación
            </label>
            <select
              value={mesSeleccionado}
              onChange={(e) => setMesSeleccionado(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none"
            >
              {monthOpts.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col w-48">
          <label className="text-[10px] font-black text-slate-400 uppercase mb-1 px-1">Filtrar Planta</label>
          <select
            value={plantaPlan}
            onChange={(e) => setPlantaPlan(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none"
          >
            {plantas.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-1 gap-6 relative min-h-0">
        {cargandoPlan && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-[200] flex flex-col items-center justify-center rounded-[3rem] gap-4">
            <Loader2 className="animate-spin text-pf-red" size={48} />
            <p className="text-slate-600 font-black uppercase tracking-widest text-sm animate-pulse">Sincronizando Oracle...</p>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          <Calendario
            {...logic}
            planResult={planFiltrado}
            isNocheValid={() => true}
            mesSeleccionado={mesSeleccionado}
            cargandoPlan={logic.cargandoPlan}
          />
        </div>

        <PanelLateral
          {...logic}
          planResultSinAsignar={sinAsignarFiltrado}
          plantaSeleccionada={plantaPlan}
          onEditTecnicos={(orden) => setIdOrdenEditando(orden.nroOrden)}
        />
      </div>

      {ordenEnEdicion && (
        <ModalAsignacionTecnico
          isOpen={!!ordenEnEdicion}
          onClose={() => setIdOrdenEditando(null)}
          orden={ordenEnEdicion}
          fecha={ordenEnEdicion.fechaSugerida || ''}
          tecnicos={Array.from(tecnicosMap?.values() || [])}
          mapaHorarios={mapaHorariosActual || new Map()}
          onAsignar={handleAsignarTecnico}
          onModificarCupos={handleModificarCupos}
        />
      )}
    </div>
  );
};
