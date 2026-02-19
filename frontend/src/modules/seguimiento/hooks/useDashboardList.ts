import { useState, useMemo } from "react";
import type { BacklogStats, TechStats, OTFlowResult } from "../types";

type DashboardItem = OTFlowResult | TechStats;

export const useDashboardList = (
  flowStats: BacklogStats | null,
  techStats: TechStats[] | null,
  itemsPerPage: number = 50
) => {
  const [activeTab, setActiveTab] = useState<"FLOW" | "TECNICOS">("FLOW");
  const [subTabFlow, setSubTabFlow] = useState<"NUEVAS" | "CAMBIOS" | "FINALIZADAS">("NUEVAS");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPlanta, setFilterPlanta] = useState("TODAS");
  const [page, setPage] = useState(1);

  // Lógica de Filtrado con Narrowing de tipos
  const listToDisplay = useMemo((): DashboardItem[] => {
    // Si la data aún no llega del backend, devolvemos lista vacía
    if (!flowStats || !techStats) return [];

    let list: DashboardItem[] = []; 

    if (activeTab === "FLOW") {
      if (subTabFlow === "NUEVAS") list = flowStats.nuevas;
      else if (subTabFlow === "CAMBIOS") list = flowStats.conAvance;
      else list = flowStats.finalizadas;
    } else {
      list = techStats;
    }

    return list.filter((item) => {
      // 1. Filtro por Planta
      // Usamos 'plantas' in item para saber si es TechStats (Backend format)
      const matchPlanta = filterPlanta === "TODAS" || (
        "plantas" in item 
          ? (item as TechStats).plantas.includes(filterPlanta)
          : (item as OTFlowResult).planta === filterPlanta
      );

      // 2. Filtro por Búsqueda
      const term = searchTerm.toLowerCase();
      if (!term) return matchPlanta;

      const matchSearch = "ot" in item
        ? (item.ot.toLowerCase().includes(term) || item.descripcion.toLowerCase().includes(term))
        : (item as TechStats).nombre.toLowerCase().includes(term);

      return matchPlanta && matchSearch;
    });
  }, [activeTab, subTabFlow, flowStats, techStats, filterPlanta, searchTerm]);

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
    setActiveTab: (tab: "FLOW" | "TECNICOS") => { setActiveTab(tab); setPage(1); },
    setSubTabFlow: (sub: "NUEVAS" | "CAMBIOS" | "FINALIZADAS") => { setSubTabFlow(sub); setPage(1); },
    setSearchTerm: (term: string) => { setSearchTerm(term); setPage(1); },
    setFilterPlanta: (planta: string) => { setFilterPlanta(planta); setPage(1); },
    page: currentPage, 
    setPage,
    paginatedList,
    totalPages,
    totalCount: listToDisplay.length
  };
};