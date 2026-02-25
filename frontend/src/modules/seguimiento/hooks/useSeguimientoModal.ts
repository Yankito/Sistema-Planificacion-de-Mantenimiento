import { useState, useMemo } from "react";
import type { AtrasoRow, TechStats } from "../types";

const normalizeOT = (ot: string) => String(ot).trim().toUpperCase();

interface UseSeguimientoModalProps {
  dataModo: AtrasoRow[];
  dataAnterior: AtrasoRow[];
  viewDetail: { id: string; esOB: boolean; cat?: string; isGlobal?: boolean; periodo?: string };
  PLANTAS_COMPLEJO: string[];
  PLANTAS_PF_ALIMENTOS: string[];
  modoVista?: "ATRASOS" | "CUMPLIDAS";
}

export const useSeguimientoModal = ({
  dataModo,
  dataAnterior,
  viewDetail,
  PLANTAS_COMPLEJO,
  PLANTAS_PF_ALIMENTOS,
  modoVista
}: UseSeguimientoModalProps) => {

  // --- ESTADOS DE FILTROS ---
  const [searchTerm, setSearchTerm] = useState("");
  const [filterEstado, setFilterEstado] = useState("TODOS");
  const [pagina, setPagina] = useState(1);
  const itemsPorPagina = 10;

  // --- ESTADOS DE TECNICO (PARA EL PERFIL) ---
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [empFilters, setEmpFilters] = useState({ planta: "TODAS", periodo: "TODOS", cumplimiento: "TODOS" });
  const [empSearch, setEmpSearch] = useState("");

  const handleSelectTech = (name: string) => {
    setSelectedTech(name);
    setEmpFilters({
      planta: !viewDetail.isGlobal ? viewDetail.id : "TODAS",
      periodo: viewDetail.periodo || "TODOS",
      cumplimiento: "TODOS"
    });
  };

  // Set de OTs de la semana anterior para identificar "NUEVAS"
  const previousOtSet = useMemo(() => {
    return new Set(dataAnterior.map(d => normalizeOT(d.ot)));
  }, [dataAnterior]);

  // --- LÓGICA DE FILTRADO GENERAL ---
  const { filteredGeneral, estadosDisponibles } = useMemo(() => {
    // Filtrar por el contexto del clic en la tabla de resumen
    const base = dataModo.filter(d => {
      // EXCLUSIÓN DE MOB (Mobiliario/Muebles) - Solo para CUMPLIMIENTO
      if (modoVista === "CUMPLIDAS" && d.descripcion.toUpperCase().startsWith("MOB")) return false;

      const matchPlanta = viewDetail.isGlobal
        ? (viewDetail.id === "COMPLEJO" ? PLANTAS_COMPLEJO.includes(d.planta) : PLANTAS_PF_ALIMENTOS.includes(d.planta))
        : d.planta === viewDetail.id;

      const matchOB = d.esOB === viewDetail.esOB;

      // Si hay una categoría específica (ej: desde Tabla de Atrasos), filtramos. 
      // Si no (ej: desde Tablero de Cumplimiento), mostramos el universo completo (OK + Pendientes)
      const matchCat = viewDetail.cat ? d.clasificacion === viewDetail.cat : true;
      const matchPeriodo = viewDetail.periodo ? d.periodo === viewDetail.periodo : true;

      return matchPlanta && matchOB && matchCat && matchPeriodo;
    });

    // Aplicar filtros de la UI del Modal (Buscador y Estado)
    const filtered = base.filter(d => {
      const matchSearch = !searchTerm ||
        d.ot.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.descripcion.toLowerCase().includes(searchTerm.toLowerCase());

      let matchEstado = true;
      if (filterEstado === "NUEVAS") {
        matchEstado = !previousOtSet.has(normalizeOT(d.ot));
      } else if (filterEstado !== "TODOS") {
        matchEstado = d.estado === filterEstado;
      }

      return matchSearch && matchEstado;
    });

    // 3. Obtener lista de estados únicos para el select
    const estados = new Set(base.map(d => d.estado));
    const listaLabels = ["TODOS"];
    if (dataAnterior.length > 0) listaLabels.push("NUEVAS");

    return {
      filteredGeneral: filtered,
      estadosDisponibles: [
        ...listaLabels,
        ...Array.from(estados).sort((a, b) => a.localeCompare(b))
      ]
    };
  }, [dataModo, viewDetail, PLANTAS_COMPLEJO, PLANTAS_PF_ALIMENTOS, filterEstado, searchTerm, previousOtSet, dataAnterior.length, modoVista]);

  // --- PAGINACIÓN SEGURA ---
  const totalPaginas = Math.ceil(filteredGeneral.length / itemsPorPagina);
  const paginaActual = pagina > totalPaginas ? 1 : pagina;

  const datosPaginados = useMemo(() =>
    filteredGeneral.slice((paginaActual - 1) * itemsPorPagina, paginaActual * itemsPorPagina),
    [filteredGeneral, paginaActual]);

  // --- DETALLE DE TECNICO ---
  const techData = useMemo(() => {
    if (!selectedTech) return { orders: [], stats: null, activePlants: [], activePeriods: [] };

    const baseOrders = dataModo.filter(d => d.detallesTecnicos?.some(t => t.tecnico.nombre === selectedTech));

    // Aplicar filtros internos del perfil del tecnico
    const listOrders = baseOrders.filter(d => {
      const mPlanta = empFilters.planta === "TODAS" || d.planta === empFilters.planta;
      const mPeriodo = empFilters.periodo === "TODOS" || d.periodo === empFilters.periodo;
      const tec = d.detallesTecnicos?.find(t => t.tecnico.nombre === selectedTech);
      const mCumple = empFilters.cumplimiento === "TODOS"
        ? true
        : (empFilters.cumplimiento === "CUMPLIDAS" ? tec?.opFinalizada : !tec?.opFinalizada);

      const mSearch = !empSearch || d.ot.toLowerCase().includes(empSearch.toLowerCase()) || d.descripcion.toLowerCase().includes(empSearch.toLowerCase());

      return mPlanta && mPeriodo && mCumple && mSearch;
    });

    const totalAsignado = listOrders.length;
    const finalizadas = listOrders.filter(o =>
      o.detallesTecnicos?.find(t => t.tecnico.nombre === selectedTech)?.opFinalizada
    ).length;

    const pendientes = totalAsignado - finalizadas;

    // Calcular efectividad evitando división por cero
    const efectividad = totalAsignado > 0 ? Math.round((finalizadas / totalAsignado) * 100) : 0;

    // Obtener plantas únicas donde el técnico tiene asignaciones en este dataset filtrado
    const plantasTecnico = Array.from(new Set(listOrders.map(o => o.planta))).sort();

    const stats: TechStats = {
      nombre: selectedTech,
      totalAsignado,
      finalizadas,
      pendientes,
      efectividad,
      plantas: plantasTecnico
    };

    return {
      orders: listOrders.map(o => ({
        ...o,
        isNew: dataAnterior.length > 0 && !previousOtSet.has(normalizeOT(o.ot))
      })),
      stats,
      activePlants: Array.from(new Set(baseOrders.map(o => o.planta))).sort(),
      activePeriods: Array.from(new Set(baseOrders.map(o => o.periodo))).sort()
    };
  }, [selectedTech, dataModo, empFilters, empSearch, previousOtSet, dataAnterior.length]);

  // --- HANDLERS CON RESET DE PÁGINA (PARA EVITAR EL ERROR DE REACT) ---
  const handleSearchChange = (val: string) => { setSearchTerm(val); setPagina(1); };
  const handleFilterChange = (val: string) => { setFilterEstado(val); setPagina(1); };

  return {
    searchTerm, handleSearchChange,
    filterEstado, handleFilterChange,
    pagina: paginaActual, setPagina,
    totalPaginas,
    datosPaginados,
    totalItems: filteredGeneral.length,
    estadosDisponibles,
    empSearch, setEmpSearch,
    selectedTech, handleSelectTech,
    empFilters, setEmpFilters,
    techData,
    resetTech: () => setSelectedTech(null),
    previousOtSet
  };
};