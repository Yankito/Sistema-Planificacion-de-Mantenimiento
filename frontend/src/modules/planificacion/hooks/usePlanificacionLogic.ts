// src/hooks/usePlanificacionLogic.ts
import { useState, useMemo, useEffect } from "react";
import {
  esPlantaCompatible,
  rolesCoinciden,
  necesitaValidacionTurno
} from "../utils/planificacionUtils";
import type { PlanResult } from "../types";
import type { Tecnico } from "../../../shared/types";

const BLOQUEOS_SABADO = ['L', 'V', 'LIC', 'LM', 'LP'];

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

  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null);
  const [draggingOT, setDraggingOT] = useState<PlanResult | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mensajeExito, setMensajeExito] = useState("Planificación Actualizada");
  const [mostrarSoloVacantes, setMostrarSoloVacantes] = useState(false);

  // --- SINCRONIZACIÓN ---
  useEffect(() => {
    if (fechaSeleccionada) setDiaSeleccionado(fechaSeleccionada);
  }, [fechaSeleccionada]);

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
    let cambiosRealizados = 0;

    // Convertimos el Map a una lista para iterar
    const listaTecnicos = Array.from(tecnicosMap.values());

    const ordenesActualizadas = planResult.map((ot) => {
      const tieneVacantes = ot.tecnicos.some(t => t.nombre === 'VACANTE');
      if (!tieneVacantes || !ot.fechaSugerida) return ot;

      const [d, m, y] = ot.fechaSugerida.split('/').map(Number);
      const diaIndex = d - 1; // Índice para el array de turnos (0-30)
      const esSabado = new Date(y, m - 1, d).getDay() === 6;

      // Nombres de técnicos ya asignados en esta OT para no duplicar
      const yaAsignados = ot.tecnicos.map(t => t.nombre.toUpperCase()).filter(n => n !== 'VACANTE');

      const nuevosTecnicos = ot.tecnicos.map((slot) => {
        if (slot.nombre !== 'VACANTE') return slot;

        // Buscamos el mejor candidato disponible
        const mejorCandidato = listaTecnicos.find((cand) => {
          const nombre = (cand.key || cand.nombre).toUpperCase();

          if (yaAsignados.includes(nombre)) return false;
          if (!rolesCoinciden(slot.rol, cand.rol)) return false;
          if (!esPlantaCompatible(cand.planta, ot.planta)) return false;

          // Si el rol no requiere validación de turno (ej: Jefaturas), pasa directo
          if (!necesitaValidacionTurno(cand.rol)) return true;

          const turnos = mapaHorarios.get(nombre);
          if (!turnos) return false;

          const turnoDia = String(turnos[diaIndex] || "").trim().toUpperCase();

          // Lógica Sábado vs Día de Semana
          return esSabado
            ? !BLOQUEOS_SABADO.some(b => turnoDia.startsWith(b))
            : turnoDia === 'N';
        });

        if (mejorCandidato) {
          cambiosRealizados++;
          const nombreFinal = mejorCandidato.key || mejorCandidato.nombre;
          yaAsignados.push(nombreFinal);
          return { ...slot, nombre: nombreFinal, esSugerido: true };
        }
        return slot;
      });

      return { ...ot, tecnicos: nuevosTecnicos };
    });

    if (cambiosRealizados > 0) {
      setPlanResult(ordenesActualizadas);
      setMensajeExito(`Se asignaron ${cambiosRealizados} técnicos automáticamente`);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } else {
      alert("No se encontraron técnicos disponibles para cubrir las vacantes.");
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