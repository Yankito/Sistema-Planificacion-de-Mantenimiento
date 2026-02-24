import { type AtrasoRow } from "../types.js";

// Helper para normalizar OTs (asegura comparaciones correctas entre strings)
export const normalizeOT = (val: unknown) => String(val || "").trim().toUpperCase();

interface FilterOptions {
  viewDetail: {
    id: string;
    esOB: boolean;
    cat?: string;
    isGlobal?: boolean
    periodo?: string;
  };
  filterEstado: string;
  searchTerm: string;
}

interface FilterContext {
  plantasComplejo: string[];
  plantasPfAlimentos: string[];
  previousOtSet: Set<string>; // Set optimizado para búsqueda rápida O(1)
}

export const filterOrders = (
  data: AtrasoRow[],
  filters: FilterOptions,
  context: FilterContext
) => {
  // -----------------------------------------------------------------------
  // NIVEL 1: FILTRADO ESTRUCTURAL (Contexto del Modal)
  // Filtra por lo que el usuario seleccionó antes de abrir el modal:
  // Planta (o Grupo Global), Tipo (OB/OM) y Categoría (Programador, etc.)
  // -----------------------------------------------------------------------
  const baseData = data.filter(d => {
    // 1. Filtro Tipo (OB/OM)
    if (d.esOB !== filters.viewDetail.esOB) return false;

    // 2. Filtro Categoría (Si se seleccionó una fila específica)
    if (filters.viewDetail.cat && d.clasificacion !== filters.viewDetail.cat) return false;

    // 3. NUEVO: Filtro Periodo (Si se seleccionó una columna/mes específico)
    if (filters.viewDetail.periodo && d.periodo !== filters.viewDetail.periodo) return false;

    // 4. Filtro Planta
    let matchPlanta = true;
    if (filters.viewDetail.isGlobal) {
      if (filters.viewDetail.id === "COMPLEJO") {
        matchPlanta = context.plantasComplejo.includes(d.planta);
      } else if (filters.viewDetail.id === "PF ALIMENTOS") {
        matchPlanta = context.plantasPfAlimentos.includes(d.planta);
      }
    } else {
      matchPlanta = d.planta === filters.viewDetail.id;
    }

    return matchPlanta;
  });
  // -----------------------------------------------------------------------
  // NIVEL 2: FILTRADO DINÁMICO (Interacción Usuario)
  // Filtra por lo que el usuario hace DENTRO del modal:
  // Dropdown de Estados y Barra de Búsqueda
  // -----------------------------------------------------------------------
  let f = baseData;

  // A. Filtro de Estado
  if (filters.filterEstado === "NUEVAS") {
    // Una OT es nueva si NO existe en el Set de OTs de la semana anterior
    f = f.filter(d => !context.previousOtSet.has(normalizeOT(d.ot)));
  } else if (filters.filterEstado !== "TODOS") {
    f = f.filter(d => d.estado === filters.filterEstado);
  }

  // B. Filtro de Búsqueda (Texto)
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    f = f.filter(d =>
      d.ot.toLowerCase().includes(term) ||
      d.descripcion.toLowerCase().includes(term) ||
      // Busca también dentro de los nombres de los técnicos asignados
      (d.detallesTecnicos && d.detallesTecnicos.some(t => t.tecnico.nombre.toLowerCase().includes(term)))
    );
  }

  return {
    filteredData: f,       // Para pintar la lista de tarjetas
    baseDataForStates: baseData // Para calcular qué opciones mostrar en el <select> de estados
  };
};