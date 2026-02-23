import { useState, useMemo, useEffect } from "react";
import { usePlanificacionLogic } from "../hooks/usePlanificacionLogic";
import { necesitaValidacionTurno } from "../utils/planificacionUtils";
import { Calendario } from "../components/Calendario";
import { PanelLateral } from "../components/PanelLateral";
import { ModalAsignacionTecnico } from "../components/ModalAsignacionTecnico";
import { Loader2, CalendarDays } from "lucide-react";
import { useData } from "../../../context/PlanificacionContext";
import { getMonthOptions } from "../../../shared/utils/dateUtils";

const BLOQUEOS_SABADO = ['L', 'V', 'LIC', 'LM', 'LP'];

export const PlanificacionView = () => {
  const { planning } = useData();
  const {
    planResult, setPlanResult, plantaPlan, setPlantaPlan,
    cargandoPlan,
    tecnicosMap, mapaHorariosActual,
    periodoSeleccionado, setPeriodoSeleccionado,
    planFiltrado, sinAsignarFiltrado,
    cargarPlanificacion
  } = planning;
  console.log("cargandoPlan", cargandoPlan);

  useEffect(() => {
    const mes = periodoSeleccionado.split('-')[1];
    const anio = periodoSeleccionado.split('-')[0];
    cargarPlanificacion(Number(mes), Number(anio), plantaPlan);
  }, [cargarPlanificacion, periodoSeleccionado, plantaPlan]);

  const [idOrdenEditando, setIdOrdenEditando] = useState<string | null>(null);

  const monthOpts = getMonthOptions().options;

  const logic = usePlanificacionLogic({
    planResult,
    setPlanResult,
    planResultSinAsignar: planning.planResultSinAsignar,
    setPlanResultSinAsignar: planning.setPlanResultSinAsignar,
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

  const plantas = ["PF1", "PF2", "PF3", "PF4", "PF5", "PF6", "CDT", "CI", "OTROS"];

  return (
    <div className="flex flex-col h-full gap-4 relative">
      {/* HEADER CON FILTROS Y ALGORITMOS */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between bg-white p-6 rounded-[2.5rem] border border-pf-border shadow-sm gap-6">
        <div className="flex items-center gap-6">
          <div className="flex flex-col w-56">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 px-1 flex items-center gap-1">
              <CalendarDays size={12} /> Mes de Planificación
            </label>
            <select
              value={periodoSeleccionado}
              onChange={(e) => setPeriodoSeleccionado(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none"
            >
              {monthOpts.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col w-48">
            <label className="text-[10px] font-black text-slate-400 uppercase mb-1 px-1 flex items-center gap-1">
              <div className="w-1 h-3 bg-pf-red rounded-full" /> Planta
            </label>
            <select
              value={plantaPlan}
              onChange={(e) => setPlantaPlan(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-slate-700 outline-none"
            >
              {plantas.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* BOTONES DE EJECUCIÓN (Algoritmos) */}
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
          <div className="hidden xl:block px-3">
            <p className="text-[10px] font-black text-slate-400 uppercase leading-none">Algoritmos</p>
            <p className="text-[8px] font-bold text-slate-300 uppercase mt-0.5 tracking-tighter">Auto-Planificación</p>
          </div>
          <button
            onClick={() => planning.ejecutarPlanificacion('STRICT', periodoSeleccionado)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase transition-all active:scale-95 shadow-lg shadow-slate-200"
          >
            <CalendarDays size={14} className="text-pf-red" />
            Continuidad Técnico
          </button>
          <button
            onClick={() => planning.ejecutarPlanificacion('BALANCED', periodoSeleccionado)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95"
          >
            <div className="w-2 h-2 rounded-full bg-pf-red animate-pulse" />
            Balanceado
          </button>

          <div className="w-px h-8 bg-slate-200 mx-2" />

          <button
            onClick={async () => {
              const ok = await planning.guardarPlanificacion(planResult, plantaPlan, periodoSeleccionado);
              if (ok) alert("Planificación guardada en Oracle");
            }}
            className="flex items-center gap-2 px-4 py-2 bg-pf-red hover:bg-pf-red-dark text-white rounded-xl text-[10px] font-black uppercase transition-all active:scale-95 shadow-lg shadow-pf-red/20"
          >
            Guardar Plan
          </button>
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
            isNocheValid={(tecData: any[], fechaStr: string) => {
              if (!tecData || tecData.length === 0) return true;

              const [d, m, y] = fechaStr.split('/').map(Number);
              const diaIdx = d - 1;
              const esSabado = new Date(y, m - 1, d).getDay() === 6;

              // Filtramos solo los que necesitan validación de turno
              const necesitanValidar = tecData.filter(t => necesitaValidacionTurno(t.rol));

              // Si nadie necesita validar (ej: solo supervisores), el día es válido
              if (necesitanValidar.length === 0) return true;

              // Si hay técnicos que sí necesitan validar, TODOS ellos deben tener 'N' (o no estar bloqueados si es sábado)
              return necesitanValidar.every(t => {
                const turnos = mapaHorariosActual?.get(t.nombre.toUpperCase());
                if (!turnos) return false;
                const turnoDia = String(turnos[diaIdx] || "").trim().toUpperCase();

                if (esSabado) return !BLOQUEOS_SABADO.some(b => turnoDia.startsWith(b));
                return turnoDia === 'N';
              });
            }}
            periodoSeleccionado={periodoSeleccionado}
            mapaHorarios={mapaHorariosActual || new Map()}
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
