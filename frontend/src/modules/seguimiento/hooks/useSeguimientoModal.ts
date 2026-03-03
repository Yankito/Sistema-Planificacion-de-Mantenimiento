import { useState, useMemo } from "react";
import type { AtrasoRow, TechStats, TechFilters } from "../types";

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

  // --- ESTADO DE ORDENAMIENTO ---
  const [sortConfig, setSortConfig] = useState<{ key: "nroOrden" | "fecha"; direction: "asc" | "desc" } | null>(null);

  const handleSort = (key: "nroOrden" | "fecha") => {
    setSortConfig(prev => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === "asc" ? "desc" : "asc" };
      }
      return { key, direction: "asc" };
    });
  };

  // --- ESTADOS DE TECNICO (PARA EL PERFIL) ---
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [empFilters, setEmpFilters] = useState<TechFilters>({ planta: "TODAS", periodo: "TODOS", clasificacion: "TODAS", cumplimiento: "TODOS" });
  const [empSearch, setEmpSearch] = useState("");

  const handleSelectTech = (name: string) => {
    setSelectedTech(name);
    setEmpFilters({
      planta: viewDetail.isGlobal ? "TODAS" : viewDetail.id,
      periodo: viewDetail.periodo || "TODOS",
      clasificacion: "TODAS",
      cumplimiento: "TODOS"
    });
  };

  // Set de OTs de la semana anterior para identificar "NUEVAS"
  const previousOtSet = useMemo(() => {
    return new Set(dataAnterior.map(d => normalizeOT(d.nroOrden)));
  }, [dataAnterior]);

  // --- LÓGICA DE FILTRADO Y ORDENAMIENTO ---
  const { filteredGeneral, estadosDisponibles } = useMemo(() => {
    // 1. Filtrar por el contexto del clic en la tabla de resumen
    const base = dataModo.filter(d => {
      // EXCLUSIÓN DE MOB (Mobiliario/Muebles) - Solo para CUMPLIMIENTO
      if (modoVista === "CUMPLIDAS" && d.descripcion.toUpperCase().startsWith("MOB")) return false;

      // 1. Filtrar por planta
      let matchPlanta = d.planta === viewDetail.id;
      if (viewDetail.isGlobal) {
        matchPlanta = viewDetail.id === "COMPLEJO"
          ? PLANTAS_COMPLEJO.includes(d.planta)
          : PLANTAS_PF_ALIMENTOS.includes(d.planta);
      }

      const matchOB = d.esOB === viewDetail.esOB;

      // Si hay una categoría específica (ej: desde Tabla de Atrasos), filtramos. 
      // Si no (ej: desde Tablero de Cumplimiento), mostramos el universo completo (OK + Pendientes)
      const matchCat = viewDetail.cat ? d.clasificacion === viewDetail.cat : true;
      const matchPeriodo = viewDetail.periodo ? d.periodo === viewDetail.periodo : true;

      return matchPlanta && matchOB && matchCat && matchPeriodo;
    });

    // 2. Aplicar filtros de la UI del Modal (Buscador y Estado)
    let filtered = base.filter(d => {
      const matchSearch = !searchTerm ||
        d.nroOrden.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.nroActivo.toLowerCase().includes(searchTerm.toLowerCase());

      let matchEstado = true;
      if (filterEstado === "NUEVAS") {
        matchEstado = !previousOtSet.has(normalizeOT(d.nroOrden));
      } else if (filterEstado !== "TODOS") {
        matchEstado = d.estado === filterEstado;
      }

      return matchSearch && matchEstado;
    });

    // 3. Aplicar Ordenamiento
    if (sortConfig) {
      filtered = [...filtered].sort((a, b) => {
        const valA = a[sortConfig.key] || "";
        const valB = b[sortConfig.key] || "";

        if (sortConfig.key === "fecha") {
          const dateA = new Date(valA).getTime() || 0;
          const dateB = new Date(valB).getTime() || 0;
          return sortConfig.direction === "asc" ? dateA - dateB : dateB - dateA;
        }

        // Default: string comparison (e.g., for nroOrden)
        return sortConfig.direction === "asc"
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
    }

    // 4. Obtener lista de estados únicos para el select
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
  }, [dataModo, viewDetail, PLANTAS_COMPLEJO, PLANTAS_PF_ALIMENTOS, filterEstado, searchTerm, sortConfig, previousOtSet, dataAnterior.length, modoVista]);

  // --- PAGINACIÓN SEGURA ---
  const totalPaginas = Math.ceil(filteredGeneral.length / itemsPorPagina);
  const paginaActual = pagina > totalPaginas ? 1 : pagina;

  const datosPaginados = useMemo(() =>
    filteredGeneral.slice((paginaActual - 1) * itemsPorPagina, paginaActual * itemsPorPagina),
    [filteredGeneral, paginaActual]);

  // --- DETALLE DE TECNICO ---
  const techData = useMemo(() => {
    if (!selectedTech) return { orders: [], stats: null, activePlants: [], activeClasificaciones: [] };

    const baseOrders = dataModo.filter(d => d.detallesTecnicos?.some(t => t.tecnico.nombre === selectedTech));

    const listOrders = baseOrders.filter(d => {
      const mPlanta = empFilters.planta === "TODAS" || d.planta === empFilters.planta;
      const mPeriodo = empFilters.periodo === "TODOS" || !empFilters.periodo || d.periodo === empFilters.periodo;
      const mClasificacion = empFilters.clasificacion === "TODAS" || !empFilters.clasificacion || d.clasificacion === empFilters.clasificacion;

      const mSearch = !empSearch || d.nroOrden.toLowerCase().includes(empSearch.toLowerCase()) || d.descripcion.toLowerCase().includes(empSearch.toLowerCase());

      return mPlanta && mPeriodo && mClasificacion && mSearch;
    });

    const totalAsignado = listOrders.length;
    const finalizadas = listOrders.filter(o =>
      o.detallesTecnicos?.find(t => t.tecnico.nombre === selectedTech)?.opFinalizada
    ).length;

    const pendientes = totalAsignado - finalizadas;

    // Calcular efectividad evitando división por cero
    const efectividad = totalAsignado > 0 ? Math.round((finalizadas / totalAsignado) * 100) : 0;

    // Obtener plantas únicas donde el técnico tiene asignaciones en este dataset filtrado
    const plantasTecnico = Array.from(new Set(listOrders.map(o => o.planta))).sort((a, b) => a.localeCompare(b));

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
        isNew: dataAnterior.length > 0 && !previousOtSet.has(normalizeOT(o.nroOrden))
      })),
      stats,
      activePlants: Array.from(new Set(baseOrders.map(o => o.planta))).sort((a, b) => a.localeCompare(b)),
      activePeriods: Array.from(new Set(baseOrders.map(o => o.periodo))).sort((a, b) => a.localeCompare(b)),
      activeClasificaciones: Array.from(new Set(baseOrders.map(o => o.clasificacion))).filter(Boolean).sort((a, b) => a.localeCompare(b))
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
    previousOtSet,
    sortConfig, handleSort
  };
};