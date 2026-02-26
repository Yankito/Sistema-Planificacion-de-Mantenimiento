import { useMemo } from "react";
import { X, Info, Calendar } from "lucide-react";
import { TarjetaOrden } from "./ui/TarjetaOrden";
import type { PlanResult } from "../types";
import { getWeekNumber, parseDDMMYYYY } from "../../../shared/utils/dateUtils";


interface PanelLateralProps {
  diaSeleccionado: string | null;
  setDiaSeleccionado: (dia: string | null) => void;
  ordenesPorDia: Record<string, PlanResult[]>; // Tipado como Record
  planResultSinAsignar: PlanResult[];
  handleDragStart: (e: React.DragEvent, ot: PlanResult) => void;
  handleDragEnd: () => void;
  plantaSeleccionada: string;
  onEditTecnicos: (orden: PlanResult) => void;
  mostrarSoloVacantes: boolean;
}

export const PanelLateral = ({
  diaSeleccionado,
  setDiaSeleccionado,
  ordenesPorDia,
  planResultSinAsignar,
  handleDragStart,
  handleDragEnd,
  plantaSeleccionada,
  onEditTecnicos,
  mostrarSoloVacantes
}: PanelLateralProps) => {

  const ordenesVisualizadas = useMemo((): PlanResult[] => {
    if (!diaSeleccionado) return [];

    let listaFiltrada: PlanResult[] = [];

    if (diaSeleccionado.startsWith("SEM-")) {
      console.log(diaSeleccionado);
      const semanaNum = Number.parseInt(diaSeleccionado.split("-")[1]);
      Object.keys(ordenesPorDia).forEach((fecha) => {
        const fechaObj = parseDDMMYYYY(fecha);
        if (fechaObj) {
          const semanaDeLaOrden = getWeekNumber(fechaObj);
          if (semanaDeLaOrden === semanaNum) {
            listaFiltrada.push(...ordenesPorDia[fecha]);
          }
        }
      });
    } else {
      listaFiltrada = ordenesPorDia[diaSeleccionado] || [];
    }

    if (mostrarSoloVacantes) {
      return listaFiltrada.filter(ot =>
        ot.tecnicos.some((t) => t.nombre === 'VACANTE')
      );
    }

    return listaFiltrada;
  }, [diaSeleccionado, ordenesPorDia, mostrarSoloVacantes]);

  const tituloPanel = useMemo((): string => {
    if (!diaSeleccionado) return "Pendientes";
    if (diaSeleccionado.startsWith("SEM-")) return `Semana ${diaSeleccionado.split("-")[1]}`;
    return `Día ${Number.parseInt(diaSeleccionado.split('/')[0])}`;
  }, [diaSeleccionado]);

  return (
    <div className="w-96 flex flex-col h-full">
      <div className="bg-white rounded-[2.5rem] border border-pf-neutral-100 shadow-2xl flex-1 flex flex-col overflow-hidden">
        <div className="p-7 border-b border-white/10 flex justify-between items-center bg-pf-neutral-900 text-white shadow-lg">
          <div>
            <h4 className="font-black uppercase tracking-tight text-xl leading-none">
              {tituloPanel}
            </h4>
            <p className="text-[10px] font-black text-white/60 uppercase mt-2 tracking-widest pl-0.5">
              {diaSeleccionado
                ? `${ordenesVisualizadas.length} Órdenes ${mostrarSoloVacantes ? 'Incompletas' : 'Asignadas'}`
                : "Pendientes de Planificar"}
            </p>
          </div>
          {diaSeleccionado && (
            <button
              onClick={() => setDiaSeleccionado(null)}
              className="p-2.5 hover:bg-white/10 rounded-xl transition-all active:scale-90"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-pf-neutral-50/40 custom-scrollbar">
          {diaSeleccionado ? (
            ordenesVisualizadas.length > 0 ? (
              ordenesVisualizadas.map((orden, i) => (
                <TarjetaOrden
                  key={`${orden.nroOrden}-${i}`}
                  orden={orden}
                  handleDragStart={handleDragStart}
                  handleDragEnd={handleDragEnd}
                  esAsignada={true}
                  onEditTecnicos={onEditTecnicos}
                />
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-pf-neutral-300">
                <Calendar size={48} className="mb-4 stroke-[1.5] opacity-20" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] text-center max-w-[200px] leading-relaxed">
                  {mostrarSoloVacantes
                    ? "Todas las órdenes completas"
                    : "Sin órdenes planificadas"}
                </span>
              </div>
            )
          ) : (
            planResultSinAsignar.map((ot, i) => (
              <TarjetaOrden
                key={ot.nroOrden || i}
                orden={{
                  ...ot,
                  planta: ot.planta || plantaSeleccionada,
                }}
                handleDragStart={handleDragStart}
                handleDragEnd={handleDragEnd}
                esAsignada={false}
                onEditTecnicos={onEditTecnicos}
              />
            ))
          )}
        </div>

        {!diaSeleccionado && (
          <div className="p-6 bg-pf-neutral-900 border-t border-white/5 flex items-start gap-3 shadow-2xl">
            <Info size={16} className="text-pf-red mt-0.5" />
            <p className="text-[10px] text-pf-neutral-400 font-bold leading-relaxed tracking-wide uppercase">
              <strong className="text-white">Tip de Gestión:</strong> Arrastra estas órdenes a los días resaltados con una <strong className="text-pf-red">Luna</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};