import { useState, useMemo, useEffect } from "react";
import { usePlanificacionLogic } from "../hooks/usePlanificacionLogic";
import { necesitaValidacionTurno } from "../utils/planificacionUtils";
import { Calendario } from "../components/Calendario";
import { PanelLateral } from "../components/PanelLateral";
import { ModalAsignacionTecnico } from "../components/ModalAsignacionTecnico";
import { CalendarDays } from "lucide-react";
import { usePlanificacionManager } from "../hooks/usePlanificacionManager";
import { usePlantasAcceso } from "../../../shared/hooks/usePlantasAcceso";
import { getMonthOptions } from "../../../shared/utils/dateUtils";
import { toast } from "sonner";
import type { Tecnico } from "../../../shared/types/index";
import { LoadingOverlay } from "../../../shared/components/ui/LoadingOverlay";

const BLOQUEOS_SABADO = ['L', 'V', 'LIC', 'LM', 'LP'];

export const PlanificacionView = () => {
  const planning = usePlanificacionManager();
  const {
    planResult, setPlanResult, plantaPlan, setPlantaPlan,
    cargandoPlan,
    tecnicosMap, mapaHorariosActual,
    periodoSeleccionado, setPeriodoSeleccionado,
    planFiltrado, sinAsignarFiltrado,
    cargarPlanificacion, cargarHorarios
  } = planning;

  useEffect(() => {
    const mes = periodoSeleccionado.split('-')[1];
    const anio = periodoSeleccionado.split('-')[0];
    // Cargamos tanto el plan como los horarios (para validación de turnos)
    cargarPlanificacion(Number(mes), Number(anio), plantaPlan);
    cargarHorarios(periodoSeleccionado, plantaPlan);
  }, [cargarPlanificacion, cargarHorarios, periodoSeleccionado, plantaPlan]);

  const [idOrdenEditando, setIdOrdenEditando] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

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
        nuevosTecnicos.push({ nombre: 'VACANTE', rol, planta: plantaPlan });
      } else if (accion === 'REMOVE' && indice !== undefined) {
        nuevosTecnicos.splice(indice, 1);
      }
      return { ...ot, tecnicos: nuevosTecnicos };
    });
    setPlanResult(nuevoPlan);
  };

  const { plantasPlanificacion: plantas } = usePlantasAcceso();

  return (
    <div className="flex flex-col h-full gap-4 relative overflow-hidden p-2 lg:p-4 bg-pf-neutral-50/30">
      {/* HEADER CON FILTROS Y ALGORITMOS */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between bg-white p-4 lg:p-6 rounded-[2rem] border border-pf-neutral-200 shadow-sm gap-4 lg:gap-6">
        <div className="flex items-center gap-6">
          <div className="flex flex-col w-56">
            <label className="text-[10px] font-black text-pf-neutral-400 uppercase mb-1 px-1 flex items-center gap-1 tracking-widest">
              <CalendarDays size={12} className="text-pf-red" /> Mes de Planificación
            </label>
            <select
              value={periodoSeleccionado}
              onChange={(e) => setPeriodoSeleccionado(e.target.value)}
              disabled={cargandoPlan}
              className="w-full bg-pf-neutral-50 border border-pf-neutral-200 rounded-xl px-4 py-2 font-bold text-pf-neutral-700 outline-none focus:border-pf-red/30 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {monthOpts.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col w-48">
            <label className="text-[10px] font-black text-pf-neutral-400 uppercase mb-1 px-1 flex items-center gap-1 tracking-widest">
              <div className="w-1.5 h-3 bg-pf-red rounded-full" /> Planta
            </label>
            <select
              value={plantaPlan}
              onChange={(e) => setPlantaPlan(e.target.value)}
              disabled={cargandoPlan}
              className="w-full bg-pf-neutral-50 border border-pf-neutral-200 rounded-xl px-4 py-2 font-bold text-pf-neutral-700 outline-none focus:border-pf-red/30 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {plantas.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        {/* BOTONES DE EJECUCIÓN (Algoritmos) */}
        <div className="flex items-center gap-3 bg-pf-neutral-50 p-2 rounded-2xl border border-pf-neutral-100 shadow-inner">
          <div className="hidden xl:block px-3">
            <p className="text-[10px] font-black text-pf-neutral-400 uppercase leading-none tracking-tighter">Algoritmos</p>
            <p className="text-[8px] font-black text-pf-neutral-300 uppercase mt-0.5 tracking-widest">Auto-Plan</p>
          </div>
          <button
            onClick={() => planning.ejecutarPlanificacion('STRICT', periodoSeleccionado)}
            disabled={cargandoPlan}
            className="flex items-center gap-2 px-5 py-2.5 bg-pf-neutral-900 hover:bg-black text-white rounded-xl text-[10px] font-black uppercase transition-all active:scale-95 shadow-lg shadow-pf-neutral-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CalendarDays size={14} className="text-pf-red" />
            Continuidad Técnico
          </button>
          <button
            onClick={() => planning.ejecutarPlanificacion('BALANCED', periodoSeleccionado)}
            disabled={cargandoPlan}
            className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-pf-neutral-100 text-pf-neutral-700 border border-pf-neutral-200 rounded-xl text-[10px] font-black uppercase transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="w-2 h-2 rounded-full bg-pf-red animate-pulse" />
            Balanceado
          </button>

          <div className="w-px h-8 bg-pf-neutral-200 mx-1" />

          <button
            onClick={async () => {
              const ok = await planning.guardarPlanificacion(planResult, plantaPlan, periodoSeleccionado);
              if (ok) toast.success("Planificación guardada en Oracle");
              else toast.error("Error al guardar la planificación en Oracle.");
            }}
            disabled={cargandoPlan}
            className="flex items-center gap-2 px-5 py-2.5 bg-pf-red hover:bg-pf-red-hover text-white rounded-xl text-[10px] font-black uppercase transition-all active:scale-95 shadow-lg shadow-pf-red/20 font-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Guardar Plan
          </button>

          <div className="w-px h-8 bg-pf-neutral-200 mx-1 hidden lg:block" />

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={`hidden lg:flex items-center justify-center p-2.5 rounded-xl transition-all active:scale-95 border ${sidebarOpen ? 'bg-pf-neutral-100 border-pf-neutral-200 text-pf-neutral-600' : 'bg-pf-red text-white border-pf-red shadow-lg shadow-pf-red/20'}`}
            title={sidebarOpen ? "Ocultar Panel" : "Mostrar Panel"}
          >
            <div className={`transition-transform duration-300 ${sidebarOpen ? '' : 'rotate-180'}`}>
              <CalendarDays size={18} />
            </div>
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 relative min-h-0">
        {cargandoPlan && (
          <LoadingOverlay message="Sincronizando con Oracle" />
        )}

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <Calendario
            {...logic}
            planResult={planFiltrado}
            isNocheValid={(tecData: Tecnico[], fechaStr: string) => {
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
          />
        </div>

        <div className={`transition-all duration-500 ease-in-out overflow-hidden flex flex-col ${sidebarOpen ? 'w-80 opacity-100 mr-0' : 'w-0 opacity-0 -mr-6'}`}>
          <PanelLateral
            {...logic}
            planResultSinAsignar={sinAsignarFiltrado}
            plantaSeleccionada={plantaPlan}
            onEditTecnicos={(orden) => setIdOrdenEditando(orden.nroOrden)}
          />
        </div>
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
