import { useState, useEffect, useCallback, useRef } from "react";
import type { PlanResult, HorarioTecnico, ProcesoExcelResponse } from "../types";
import type { Tecnico } from "../../../shared/types";
import { mapDepartamentoAPlanta } from "../utils/excelUtils";
import * as PlanificacionService from "../services/PlanificacionService";
import { getMonthOptions } from "../../../shared/utils/dateUtils";
import { usePlantasAcceso } from "../../../shared/hooks/usePlantasAcceso";
import { toast } from "sonner";

/**
 * Normaliza los datos de planificación (OTs y técnicos) para asegurar consistencia.
 */
const normalizePlanData = (
  plan: PlanResult[],
  options: { toUpper?: boolean; setExiste?: boolean } = {}
): PlanResult[] => {
  return (plan || []).map(ot => ({
    ...ot,
    tecnicos: (ot.tecnicos || []).map((t: Tecnico) => ({
      ...t,
      nombre: options.toUpper ? (t.nombre || "").toUpperCase() : t.nombre,
      ...(options.setExiste ? { existe: true } : {})
    }))
  }));
};

export const usePlanificacionManager = () => {
  const { plantaDefault } = usePlantasAcceso();

  // --- ESTADO DE DATOS ---
  const [planResult, setPlanResult] = useState<PlanResult[]>([]);
  const [planResultSinAsignar, setPlanResultSinAsignar] = useState<PlanResult[]>([]);
  const [horariosResult, setHorariosResult] = useState<HorarioTecnico[]>([]);

  // Mapas para validaciones locales (Magic Wand y Modales)
  const [tecnicosMap, setTecnicosMap] = useState<Map<string, Tecnico>>(new Map());
  const [mapaHorariosActual, setMapaHorariosActual] = useState<Map<string, string[]>>(new Map());

  // --- ESTADO UI ---
  const [periodoSeleccionado, setPeriodoSeleccionado] = useState(getMonthOptions().default);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const cargandoPlan = loadingPlan || loadingHorarios || loadingAction;
  const [plantaPlan, setPlantaPlan] = useState(plantaDefault);
  const [fechaFoco, setFechaFoco] = useState<string | null>(null);

  // Evita llamadas duplicadas con mismos parametros
  const lastPlanKeyRef = useRef<string | null>(null);
  const lastHorariosKeyRef = useRef<string | null>(null);
  const planInFlightRef = useRef<string | null>(null);
  const horariosInFlightRef = useRef<string | null>(null);

  /**
   * Helper para actualizar todo el estado desde una respuesta del servidor
   */
  const actualizarDesdeRespuesta = useCallback((data: ProcesoExcelResponse) => {
    if (!data) return;

    // 1. OTs
    setPlanResult(normalizePlanData(data.resultados || []));
    setPlanResultSinAsignar(normalizePlanData(data.sinAsignar || []));

    // 2. Horarios si vienen
    if (data.horariosCompletos) {
      setHorariosResult(data.horariosCompletos);
    }

    // 3. Mapas
    if (data.tecnicosMap) setTecnicosMap(new Map(Object.entries(data.tecnicosMap)));
    if (data.mapaHorarios) setMapaHorariosActual(new Map(Object.entries(data.mapaHorarios)));


  }, []);


  // --- ESTADO MODAL ---
  const [modalTecnicoOpen, setModalTecnicoOpen] = useState(false);
  const [ordenEditando, setOrdenEditando] = useState<PlanResult | null>(null);

  // Cálculo del mes para cabeceras
  const mes = (() => {
    if (!periodoSeleccionado) return "Mes Desconocido";
    try {
      if (/^\d{4}-\d{2}$/.test(periodoSeleccionado)) {
        const [y, m] = periodoSeleccionado.split('-').map(Number);
        const d = new Date(y, m - 1, 1);
        return d.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
      }
      // Fallback para formato antiguo de semanas
      return periodoSeleccionado;
    } catch (e) {
      console.error("usePlanificacionManager: Error al calcular mes:", e);
      return "Mes Desconocido";
    }
  })();

  // --- CARGA DESDE ORACLE ---
  const cargarHorarios = useCallback(async (
    periodo: string,
    planta: string,
    options?: { force?: boolean }
  ) => {
    if (!/^\d{4}-\d{2}$/.test(periodo)) {
      console.warn("usePlanificacionManager: Periodo invalido para horarios:", periodo);
      return;
    }

    const key = `${periodo}::${planta}`;
    if (!options?.force) {
      if (lastHorariosKeyRef.current === key) return;
      if (horariosInFlightRef.current === key) return;
    }

    horariosInFlightRef.current = key;
    setLoadingHorarios(true);
    try {
      const [anio, mes] = periodo.split('-').map(Number);
      const resp = await PlanificacionService.getHorarios(mes, anio, planta);
      if (resp?.data) {
        setHorariosResult(resp.data);
        lastHorariosKeyRef.current = key;
      }
    } catch (error) {
      console.error("Error al cargar horarios desde base de datos:", error);
      toast.error("Error al cargar los horarios desde la base de datos.");
    } finally {
      if (horariosInFlightRef.current === key) {
        horariosInFlightRef.current = null;
      }
      setLoadingHorarios(false);
    }
  }, []);

  const cargarPlanificacion = useCallback(async (
    mes: number,
    anio: number,
    planta: string,
    options?: { force?: boolean }
  ) => {
    if (!Number.isFinite(mes) || !Number.isFinite(anio)) {
      console.warn("usePlanificacionManager: Mes/anio invalidos:", { mes, anio });
      return;
    }

    const key = `${anio}-${String(mes).padStart(2, '0')}::${planta}`;
    if (!options?.force) {
      if (lastPlanKeyRef.current === key) return;
      if (planInFlightRef.current === key) return;
    }

    planInFlightRef.current = key;
    setLoadingPlan(true);
    try {
      const data = await PlanificacionService.getResultadosPlanificacion(mes, anio, planta);
      if (data?.resultados) {
        setPlanResult(normalizePlanData(data.resultados, { toUpper: true, setExiste: true }));
        setPlanResultSinAsignar(normalizePlanData(data.sinAsignar || [], { toUpper: true, setExiste: true }));
        lastPlanKeyRef.current = key;
      }
    } catch (error) {
      console.error("Error al cargar planificación:", error);
      toast.error("Error al cargar la planificación desde Oracle.");
    } finally {
      if (planInFlightRef.current === key) {
        planInFlightRef.current = null;
      }
      setLoadingPlan(false);
    }
  }, []);

  // Efecto: Sincronizar mapas de referencia cuando cambian los horarios
  useEffect(() => {
    if (horariosResult.length > 0) {
      const tMap = new Map<string, Tecnico>();
      const hMap = new Map<string, string[]>();

      horariosResult.forEach(h => {
        tMap.set(h.nombre, { nombre: h.nombre, rol: h.rol, planta: h.planta });
        hMap.set(h.nombre, h.turnos);
      });

      setTecnicosMap(tMap);
      setMapaHorariosActual(hMap);
    }
  }, [horariosResult]);


  // --- ACCIONES PRINCIPALES ---


  /**
   * Ejecución remota: Llama al algoritmo en el servidor usando datos de Oracle.
   */
  const ejecutarPlanificacion = async (modo: 'STRICT' | 'BALANCED', periodo: string): Promise<boolean> => {
    setLoadingAction(true);
    try {
      const [anio, mes] = periodo.split('-').map(Number);
      const data = await PlanificacionService.ejecutarPlanificacionRemota(modo, mes, anio, plantaPlan);

      if (data) {
        actualizarDesdeRespuesta(data);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error en ejecución remota:", error);
      toast.error("Error al ejecutar la planificación en el servidor.");
      return false;
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Sincroniza un cambio de turno individual en la matriz de técnicos.
   */
  const handleCambioTurno = async (nombreTecnico: string, diaIndex: number) => {
    const tecnico = horariosResult.find(t => t.nombre === nombreTecnico);
    if (!tecnico) return;

    const ciclo = ['M', 'T', 'N', 'L', 'V'];
    const turnoActual = tecnico.turnos[diaIndex];
    const siguienteIndex = (ciclo.indexOf(turnoActual) + 1) % ciclo.length;

    const nuevosTurnos = [...tecnico.turnos];
    nuevosTurnos[diaIndex] = ciclo[siguienteIndex];

    // Update optimista en la UI para respuesta instantánea
    setHorariosResult(prev => prev.map(t =>
      t.nombre === nombreTecnico ? { ...t, turnos: nuevosTurnos } : t
    ));

    // Persistir MERGE en Oracle (usando SEGUNDA)
    await PlanificacionService.actualizarTurnoTecnico(nombreTecnico, nuevosTurnos, periodoSeleccionado);
  };

  /**
   * Asignación manual de un técnico a una OT específica.
   */
  const handleAsignarTecnico = (nroOrden: string, indexTecnico: number, nuevoNombre: string, esAutomatico = false) => {
    const updateFn = (ot: PlanResult): PlanResult => {
      const nuevosTecnicos = [...ot.tecnicos];
      nuevosTecnicos[indexTecnico] = {
        ...nuevosTecnicos[indexTecnico],
        nombre: nuevoNombre,
        esSugerido: esAutomatico
      };
      return { ...ot, tecnicos: nuevosTecnicos };
    };

    setPlanResult(prev => prev.map(ot => ot.nroOrden === nroOrden ? updateFn(ot) : ot));
    if (ordenEditando?.nroOrden === nroOrden) {
      setOrdenEditando(prev => prev ? updateFn(prev) : null);
    }
  };

  /**
   * Agrega o elimina slots de técnicos (cupos) en una orden.
   */
  const handleModificarCupos = (nroOrden: string, accion: 'ADD' | 'REMOVE', rol?: string, indice?: number) => {
    const actualizar = (ot: PlanResult): PlanResult => {
      const nuevos = [...ot.tecnicos];
      if (accion === 'ADD' && rol) {
        nuevos.push({ nombre: "VACANTE", rol, planta: ot.planta, turnos: null, existe: true });
      } else if (accion === 'REMOVE' && typeof indice === 'number') {
        nuevos.splice(indice, 1);
      }
      return { ...ot, tecnicos: nuevos };
    };

    setPlanResult(prev => prev.map(ot => ot.nroOrden === nroOrden ? actualizar(ot) : ot));
    setOrdenEditando(prev => prev?.nroOrden === nroOrden ? actualizar(prev) : prev);
  };

  // --- FILTROS DE VISTA ---

  // Órdenes que pertenecen a la planta seleccionada en el Calendario
  const planFiltrado = planResult.filter(p => p.planta === plantaPlan);

  // Órdenes sin asignar, mapeando departamentos a plantas de PF si es necesario
  const sinAsignarFiltrado = planResultSinAsignar.filter(o => {
    if (o.planta) return o.planta === plantaPlan;
    return mapDepartamentoAPlanta(String(o.departamento || "")) === plantaPlan;
  });

  return {
    // Datos
    planResult,
    setPlanResult,
    planFiltrado,
    planResultSinAsignar,
    setPlanResultSinAsignar,
    sinAsignarFiltrado,
    horariosResult,
    tecnicosMap,
    mapaHorariosActual,
    mes,

    // UI State
    cargandoPlan,
    periodoSeleccionado,
    plantaPlan,
    setPlantaPlan,
    setPeriodoSeleccionado,
    fechaFoco,
    setFechaFoco,

    modalTecnicoOpen,
    setModalTecnicoOpen,
    ordenEditando,
    setOrdenEditando,

    // Acciones
    cargarPlanificacion,
    cargarHorarios,
    ejecutarPlanificacion,
    handleCambioTurno,
    handleAsignarTecnico,
    handleModificarCupos,
    guardarPlanificacion: PlanificacionService.guardarPlanificacion,

    reset: () => {
      setPlanResult([]);
      setHorariosResult([]);
      setPlanResultSinAsignar([]);
      setTecnicosMap(new Map());
      setMapaHorariosActual(new Map());
    }
  };
};