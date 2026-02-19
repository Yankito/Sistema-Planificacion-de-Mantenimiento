import { useState, useEffect, useCallback } from "react";
import type { PlanResult, HorarioTecnico } from "../types";
import type { Tecnico } from "../../../shared/types";
import { mapDepartamentoAPlanta } from "../utils/excelUtils";
import * as PlanificacionService from "../../../shared/services/PlanificacionService";
import { getMonthOptions } from "../../../shared/utils/dateUtils";

export const usePlanificacionManager = () => {
  // --- ESTADO DE DATOS ---
  const [planResult, setPlanResult] = useState<PlanResult[]>([]);
  const [planResultSinAsignar, setPlanResultSinAsignar] = useState<PlanResult[]>([]);
  const [horariosResult, setHorariosResult] = useState<HorarioTecnico[]>([]);

  // Mapas para validaciones locales (Magic Wand y Modales)
  const [tecnicosMap, setTecnicosMap] = useState<Map<string, Tecnico>>(new Map());
  const [mapaHorariosActual, setMapaHorariosActual] = useState<Map<string, string[]>>(new Map());

  // --- ESTADO UI ---
  const [mesSeleccionado, setMesSeleccionado] = useState(getMonthOptions().default);
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [loadingAction, setLoadingAction] = useState(false);
  const cargandoPlan = loadingPlan || loadingHorarios || loadingAction;
  const [plantaPlan, setPlantaPlan] = useState("PF3");
  const [plantaHorarios, setPlantaHorarios] = useState("PF3");
  const [fechaFoco, setFechaFoco] = useState<string | null>(null);

  /**
   * Helper para actualizar todo el estado desde una respuesta del servidor
   */
  const actualizarDesdeRespuesta = useCallback((data: any) => {
    if (!data) return;

    // Helper para normalizar nombres
    const normalizePlan = (plan: any[]) => plan.map(ot => ({
      ...ot,
      tecnicos: ot.tecnicos.map((t: any) => ({ ...t, nombre: t.nombre.toUpperCase() }))
    }));

    // 1. OTs
    setPlanResult(normalizePlan(data.resultados || []));
    setPlanResultSinAsignar(normalizePlan(data.sinAsignar || []));

    // 2. Horarios si vienen
    if (data.horariosCompletos) {
      setHorariosResult(data.horariosCompletos);
    }

    // 3. Mapas
    if (data.tecnicosMap) setTecnicosMap(new Map(Object.entries(data.tecnicosMap)));
    if (data.mapaHorarios) setMapaHorariosActual(new Map(Object.entries(data.mapaHorarios)));

    // 4. Cambiar semana si el servidor la especifica o si el primer resultado tiene una distinta
    const primeraSemana = data.semana || data.resultados?.[0]?.semana || data.sinAsignar?.[0]?.semana;
    if (primeraSemana) {
      setMesSeleccionado(primeraSemana);
    }

  }, []);


  // --- ESTADO MODAL ---
  const [modalTecnicoOpen, setModalTecnicoOpen] = useState(false);
  const [ordenEditando, setOrdenEditando] = useState<PlanResult | null>(null);

  // Cálculo del mes para cabeceras
  const mes = (() => {
    if (!mesSeleccionado) return "Mes Desconocido";
    try {
      if (/^\d{4}-\d{2}$/.test(mesSeleccionado)) {
        const [y, m] = mesSeleccionado.split('-').map(Number);
        const d = new Date(y, m - 1, 1);
        return d.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
      }
      // Fallback para formato antiguo de semanas
      return mesSeleccionado;
    } catch (e) {
      return "Mes Desconocido";
    }
  })();

  // --- CARGA DESDE ORACLE ---
  const cargarHorarios = useCallback(async (periodo: string, planta: string) => {
    setLoadingHorarios(true);
    try {
      console.log("Cargando horarios para periodo:", periodo, "planta:", planta);
      const resp = await PlanificacionService.getHorarios(periodo, planta);
      if (resp && resp.data) {
        setHorariosResult(resp.data);
      }
    } catch (error) {
      console.error("Error al cargar horarios desde base de datos:", error);
    } finally {
      setLoadingHorarios(false);
    }
  }, []);

  const cargarPlanificacion = useCallback(async (periodo: string, planta: string) => {
    setLoadingPlan(true);
    try {
      const data = await PlanificacionService.getResultadosPlanificacion(periodo, planta);
      if (data && data.resultados) {
        // Helper inline o reusado (mejor inline aquí para no romper deps del useCallback)
        const normalizePlan = (plan: any[]) => plan.map(ot => ({
          ...ot,
          tecnicos: ot.tecnicos.map((t: any) => ({ ...t, nombre: t.nombre.toUpperCase() }))
        }));

        setPlanResult(normalizePlan(data.resultados));
        setPlanResultSinAsignar(normalizePlan(data.sinAsignar || []));
      }
    } catch (error) {
      console.error("Error al cargar planificación:", error);
    } finally {
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

  // Efecto principal: Cargar horarios al cambiar filtros
  useEffect(() => {
    cargarHorarios(mesSeleccionado, plantaHorarios);
  }, [mesSeleccionado, plantaHorarios, cargarHorarios]);

  // --- ACCIONES PRINCIPALES ---


  /**
   * Ejecución remota: Llama al algoritmo en el servidor usando datos de Oracle.
   */
  const ejecutarPlanificacion = async (modo: 'STRICT' | 'BALANCED', periodo?: string): Promise<boolean> => {
    setLoadingAction(true);
    try {
      const periodoTarget = periodo || mesSeleccionado;
      const data = await PlanificacionService.ejecutarPlanificacionRemota(modo, periodoTarget, plantaPlan);

      if (data) {
        actualizarDesdeRespuesta(data);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error en ejecución remota:", error);
      return false;
    } finally {
      setLoadingAction(false);
    }
  };

  /**
   * Procesa un archivo Excel localmente enviándolo al servidor.
   * Útil para cargas manuales o iniciales sin Oracle.
   */
  const procesarArchivo = async (file: File, mes?: number, anio?: number): Promise<void> => {
    console.log("usePlanificacionManager: Iniciando procesarArchivo...");
    setLoadingAction(true);
    try {
      console.log("Llamando a PlanificacionService.procesarExcelEnServidor...", { mes, anio });
      const data = await PlanificacionService.procesarExcelEnServidor(file, 'STRICT', mesSeleccionado, mes, anio);
      console.log("Respuesta de servidor recibida:", data ? "CON DATOS" : "NULL");
      if (data) {
        actualizarDesdeRespuesta(data);
      }
    } catch (error) {

      console.error("Error procesando archivo:", error);
      alert("Error al procesar archivo de planificación.");
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
    await PlanificacionService.actualizarTurnoTecnico(nombreTecnico, nuevosTurnos, mesSeleccionado);
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
        nuevos.push({ nombre: "VACANTE", rol, turnos: null, existe: true });
      } else if (accion === 'REMOVE' && typeof indice === 'number') {
        nuevos.splice(indice, 1);
      }
      return { ...ot, tecnicos: nuevos };
    };

    setPlanResult(prev => prev.map(ot => ot.nroOrden === nroOrden ? actualizar(ot) : ot));
    setOrdenEditando(prev => prev && prev.nroOrden === nroOrden ? actualizar(prev) : prev);
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
    sinAsignarFiltrado,
    horariosResult,
    tecnicosMap,
    mapaHorariosActual,
    mes,

    // UI State
    cargandoPlan,
    mesSeleccionado,
    plantaPlan,
    setPlantaPlan,
    plantaHorarios,
    setPlantaHorarios,
    setMesSeleccionado,
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
    procesarArchivo,

    reset: () => {
      setPlanResult([]);
      setHorariosResult([]);
      setPlanResultSinAsignar([]);
      setTecnicosMap(new Map());
      setMapaHorariosActual(new Map());
    }
  };
};