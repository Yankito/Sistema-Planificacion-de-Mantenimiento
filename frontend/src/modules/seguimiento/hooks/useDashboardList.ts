import { useState, useMemo } from "react";
import type { BacklogStats, TechStats, OTFlowResult } from "../types";

type DashboardItem = OTFlowResult | TechStats;

/**
 * Helper para filtrar items del dashboard sin anidamiento excesivo.
 */
const filterDashboardItem = (item: DashboardItem, filterPlanta: string, searchTerm: string): boolean => {
  // 1. Filtro por Planta
  const matchPlanta = filterPlanta === "TODAS" || (
    "plantas" in item
      ? (item as TechStats).plantas.includes(filterPlanta)
      : (item as OTFlowResult).planta === filterPlanta
  );

  // 2. Filtro por Búsqueda
  const term = searchTerm.toLowerCase();
  if (!term) return matchPlanta;

  const matchSearch = "nroOrden" in item
    ? (item.nroOrden.toLowerCase().includes(term) || item.descripcion.toLowerCase().includes(term))
    : (item as TechStats).nombre.toLowerCase().includes(term);

  return matchPlanta && matchSearch;
};

export const useDashboardList = (
  flowStats: BacklogStats | null,
  techStats: TechStats[] | null,
  itemsPerPage: number = 50
) => {
  const [activeTab, setActiveTab] = useState<"FLOW" | "TECNICOS">("TECNICOS");
  const [subTabFlow, setSubTabFlow] = useState<"NUEVAS" | "CAMBIOS" | "FINALIZADAS">("NUEVAS");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlanta, setFilterPlanta] = useState("TODAS");
  const [page, setPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: "asc" | "desc" } | null>(null);

  // Lógica de Filtrado y Ordenado con Narrowing de tipos
  const listToDisplay = useMemo((): DashboardItem[] => {
    // Si la data aún no llega del backend, devolvemos lista vacía
    if (!flowStats || !techStats) return [];

    let list: DashboardItem[] = [];

    if (activeTab === "FLOW") {
      if (subTabFlow === "NUEVAS") list = [...flowStats.nuevas];
      else if (subTabFlow === "CAMBIOS") list = [...flowStats.conAvance];
      else list = [...flowStats.finalizadas];
    } else {
      list = [...techStats];
    }

    // 1. Filtrado (Depth 3)
    const filtered = list.filter((item) => filterDashboardItem(item, filterPlanta, searchTerm));

    // 2. Ordenado (Solo para Técnicos si hay configuración)
    if (activeTab === "TECNICOS" && sortConfig) {
      filtered.sort((a, b) => {
        const itemA = a as TechStats;
        const itemB = b as TechStats;

        const valA = sortConfig.key === "efectividad" ? itemA.efectividad : itemA.nombre;
        const valB = sortConfig.key === "efectividad" ? itemB.efectividad : itemB.nombre;

        if (valA < valB) return sortConfig.direction === "asc" ? -1 : 1;
        if (valA > valB) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [activeTab, subTabFlow, flowStats, techStats, filterPlanta, searchTerm, sortConfig]);

  const totalPages = Math.ceil(listToDisplay.length / itemsPerPage);
  const currentPage = page > totalPages ? 1 : page;

  const paginatedList = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return listToDisplay.slice(start, start + itemsPerPage);
  }, [listToDisplay, currentPage, itemsPerPage]);

  return {
    activeTab,
    subTabFlow,
    searchTerm,
    filterPlanta,
    sortConfig,
    setActiveTab: (tab: "FLOW" | "TECNICOS") => { setActiveTab(tab); setPage(1); setSortConfig(null); },
    setSubTabFlow: (sub: "NUEVAS" | "CAMBIOS" | "FINALIZADAS") => { setSubTabFlow(sub); setPage(1); },
    setSearchTerm: (term: string) => { setSearchTerm(term); setPage(1); },
    setFilterPlanta: (planta: string) => { setFilterPlanta(planta); setPage(1); },
    setSortConfig: (key: string) => {
      setSortConfig(prev => {
        if (prev?.key === key) {
          if (prev.direction === "desc") return { key, direction: "asc" };
          return null; // Quitar orden
        }
        // Default: asc para nombre, desc para efectividad/números
        const direction = key === "nombre" ? "asc" : "desc";
        return { key, direction };
      });
      setPage(1);
    },
    page: currentPage,
    setPage,
    paginatedList,
    totalPages,
    totalCount: listToDisplay.length
  };
};
