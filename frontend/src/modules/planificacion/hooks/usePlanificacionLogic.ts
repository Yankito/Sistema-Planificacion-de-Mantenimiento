import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  estaTecnicoDisponible
} from "../utils/planificacionUtils";
import type { PlanResult } from "../types";
import type { Tecnico } from "../../../shared/types";


interface UsePlanificacionProps {
  planResult: PlanResult[];
  setPlanResult: (data: PlanResult[]) => void;
  fechaSeleccionada: string | null;
  // Mapa de técnicos: Key (nombre/RUT) -> Datos Tecnico
  tecnicosMap: Map<string, Tecnico>;
  // Mapa de Turnos: Key (nombre) -> Array de strings con turnos ("N", "L", etc)
  mapaHorarios: Map<string, string[]>;
  cargandoPlan?: boolean;
  itemsVisualizados?: PlanResult[];
  planResultSinAsignar?: PlanResult[];
  setPlanResultSinAsignar?: (data: PlanResult[]) => void;
}

// --- HELPERS DE APOYO (Fuera del hook para evitar nesting profundo) ---

const buscarCandidatoParaSlot = (
  slot: Tecnico,
  ot: PlanResult,
  yaAsignados: string[],
  diaIndex: number,
  esSabado: boolean,
  listaTecnicos: Tecnico[],
  mapaHorarios: Map<string, string[]>
) => {
  if (slot.nombre !== "VACANTE") return slot;

  const mejorCandidato = listaTecnicos.find((cand) =>
    estaTecnicoDisponible(
      cand,
      slot,
      ot.planta,
      yaAsignados,
      diaIndex,
      esSabado,
      mapaHorarios
    )
  );

  if (mejorCandidato) {
    const nombreFinal = mejorCandidato.nombre;
    yaAsignados.push(nombreFinal.toUpperCase());
    return { ...slot, nombre: nombreFinal, esSugerido: true };
  }

  return slot;
};

/**
 * Procesa una OT intentando asignar técnicos a sus vacantes.
 */
const procesarVacantesOT = (ot: PlanResult, listaTecnicos: Tecnico[], mapaHorarios: Map<string, string[]>) => {
  const tieneVacantes = ot.tecnicos.some((t) => t.nombre === "VACANTE");
  if (!tieneVacantes || !ot.fechaSugerida) return { ot, cambios: 0 };

  const [d, m, y] = ot.fechaSugerida.split("/").map(Number);
  const diaIndex = d - 1;
  const esSabado = new Date(y, m - 1, d).getDay() === 6;

  // Nombres de técnicos ya asignados en esta OT para no duplicar
  const yaAsignados = ot.tecnicos
    .map((t) => t.nombre.toUpperCase())
    .filter((n) => n !== "VACANTE");

  let cambiosEnOT = 0;
  const nuevosTecnicos = ot.tecnicos.map((slot) => {
    const nuevoSlot = buscarCandidatoParaSlot(
      slot,
      ot,
      yaAsignados,
      diaIndex,
      esSabado,
      listaTecnicos,
      mapaHorarios
    );
    if (nuevoSlot !== slot) cambiosEnOT++;
    return nuevoSlot;
  });

  return {
    ot: { ...ot, tecnicos: nuevosTecnicos },
    cambios: cambiosEnOT,
  };
};

export const usePlanificacionLogic = ({
  planResult,
  setPlanResult,
  fechaSeleccionada,
  tecnicosMap,
  mapaHorarios,
  cargandoPlan = false,
  itemsVisualizados,
  planResultSinAsignar = [],
  setPlanResultSinAsignar
}: UsePlanificacionProps) => {

  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(fechaSeleccionada);
  const [draggingOT, setDraggingOT] = useState<PlanResult | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("Planificación Actualizada");
  const [mostrarSoloVacantes, setMostrarSoloVacantes] = useState(false);

  // --- SINCRONIZACIÓN (Ajuste de estado durante el renderizado para evitar cascading renders) ---
  const [prevFecha, setPrevFecha] = useState(fechaSeleccionada);
  if (fechaSeleccionada !== prevFecha) {
    setPrevFecha(fechaSeleccionada);
    setDiaSeleccionado(fechaSeleccionada);
  }

  // --- ORDENAMIENTO Y AGRUPACIÓN ---
  const ordenesPorDia = useMemo(() => {
    const dataToProcess = itemsVisualizados !== undefined ? itemsVisualizados : planResult;
    const ordenadas = [...dataToProcess].sort((a, b) => {
      if (!a.fechaSugerida) return 1;
      if (!b.fechaSugerida) return -1;
      const [dA, mA, aA] = a.fechaSugerida.split('/').map(Number);
      const [dB, mB, aB] = b.fechaSugerida.split('/').map(Number);
      return new Date(aA, mA - 1, dA).getTime() - new Date(aB, mB - 1, dB).getTime();
    });


    return ordenadas.reduce((acc: Record<string, PlanResult[]>, orden) => {
      const fecha = orden.fechaSugerida;
      if (!fecha) return acc;
      if (!acc[fecha]) acc[fecha] = [];
      acc[fecha].push(orden);
      return acc;
    }, {});
  }, [planResult, itemsVisualizados]);

  // --- ALGORITMO MAGIC WAND ---

  const handleSugerirTodo = () => {
    let totalCambios = 0;
    const listaTecnicos = Array.from(tecnicosMap.values());

    const ordenesActualizadas = planResult.map((ot) => {
      const { ot: otProcesada, cambios } = procesarVacantesOT(ot, listaTecnicos, mapaHorarios);
      totalCambios += cambios;
      return otProcesada;
    });

    if (totalCambios > 0) {
      setPlanResult(ordenesActualizadas);
      setMensajeExito(`Se asignaron ${totalCambios} técnicos automáticamente`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      toast.error("No se encontraron técnicos disponibles para cubrir las vacantes.");
    }
  };

  // --- HANDLERS DRAG & DROP ---
  const handleDragStart = (e: React.DragEvent, ot: PlanResult) => {
    e.dataTransfer.setData("application/json", JSON.stringify(ot));
    setDraggingOT(ot);
  };

  const handleDrop = (e: React.DragEvent, fechaDestino: string) => {
    e.preventDefault();
    if (!draggingOT) return;

    // 1. Verificar si la orden ya estaba en el plan actual
    const estaEnPlan = planResult.find(p => p.nroOrden === draggingOT.nroOrden);

    if (estaEnPlan) {
      // Caso A: Ya estaba asignada, solo cambiamos la fecha
      const nuevoPlan = planResult.map((p) =>
        p.nroOrden === draggingOT.nroOrden ? { ...p, fechaSugerida: fechaDestino } : p
      );
      setPlanResult(nuevoPlan);
    } else {
      // Caso B: Viene de 'Pendientes' (sin asignar)
      const nuevaOT = {
        ...draggingOT,
        fechaSugerida: fechaDestino,
        tecnicos: draggingOT.tecnicos && draggingOT.tecnicos.length > 0
          ? draggingOT.tecnicos
          : [{ nombre: 'VACANTE', rol: 'M', planta: draggingOT.planta }]
      };

      // La añadimos al plan activo
      setPlanResult([...planResult, nuevaOT]);

      // La removemos de la lista de sin asignar
      if (setPlanResultSinAsignar) {
        setPlanResultSinAsignar(planResultSinAsignar.filter(p => p.nroOrden !== draggingOT.nroOrden));
      }
    }

    setDraggingOT(null);
    setDragOverDate(null);
  };

  const handleDragEnd = () => {
    setDraggingOT(null);
    setDragOverDate(null);
  };

  const handleDragEnter = (e: React.DragEvent, fecha: string) => {
    e.preventDefault();
    setDragOverDate(fecha);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "move";
  };

  return {
    diaSeleccionado, setDiaSeleccionado,
    draggingOT,
    dragOverDate, setDragOverDate,
    showSuccess,
    mensajeExito,
    mostrarSoloVacantes, setMostrarSoloVacantes,
    ordenesPorDia,
    handleSugerirTodo,
    handleDragStart,
    handleDragEnd,
    handleDragEnter,
    handleDragOver,
    handleDrop,
    cargandoPlan
  };
};