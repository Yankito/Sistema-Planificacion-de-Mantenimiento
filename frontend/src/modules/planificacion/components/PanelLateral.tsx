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

    if (diaSeleccionado.startsWith("WEEK-")) {
      const semanaNum = parseInt(diaSeleccionado.split("-")[1]);
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
    if (diaSeleccionado.startsWith("WEEK-")) return `Semana ${diaSeleccionado.split("-")[1]}`;
    return `Día ${parseInt(diaSeleccionado.split('/')[0])}`;
  }, [diaSeleccionado]);

  return (
    <div className="w-96 flex flex-col">
      <div className="bg-white rounded-[2.5rem] border border-pf-border shadow-xl flex-1 flex flex-col overflow-hidden">
        <div className="p-6 border-b flex justify-between items-center bg-slate-900 text-white">
          <div>
            <h4 className="font-black uppercase tracking-tighter text-lg leading-none">
              {tituloPanel}
            </h4>
            <p className="text-[10px] font-bold text-slate-200 uppercase mt-1">
              {diaSeleccionado
                ? `${ordenesVisualizadas.length} Órdenes ${mostrarSoloVacantes ? 'Incompletas' : 'Asignadas'}`
                : "Sin turno de noche"}
            </p>
          </div>
          {diaSeleccionado && (
            <button
              onClick={() => setDiaSeleccionado(null)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
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
              <div className="flex flex-col items-center justify-center py-12 text-slate-400 opacity-60">
                <Calendar size={40} className="mb-2 stroke-1" />
                <span className="text-xs font-bold uppercase tracking-wider text-center">
                  {mostrarSoloVacantes
                    ? "Todas las órdenes completas"
                    : "Sin órdenes esta semana"}
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
          <div className="p-6 bg-slate-900 border-t border-slate-800 flex items-start gap-3">
            <Info size={16} className="text-pf-red mt-0.5" />
            <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
              <strong className="text-white">Tip de Gestión:</strong> Arrastra estas órdenes a los días resaltados con una <strong className="text-pf-red">Luna</strong>.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};