import { useState, useMemo } from "react";
import { ChevronLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import type { AtrasoRow, OTFlowResult, TechStats, BacklogStats, TechFilters } from "../types";

import { TechProfile } from "./TechProfile";
import { DashboardListView } from "./DashboardListView";

// VISTA DETALLE OT (Estilo Sidebar)1
const OTDetailView = ({ otItem, allData, onBack, onTechClick }: { otItem: OTFlowResult, allData: AtrasoRow[], onBack: () => void, onTechClick: (tech: string) => void }) => {
  const fullRow = allData.find(d => d.nroOrden === otItem.nroOrden);
  const tecnicos = fullRow?.detallesTecnicos || [];

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-6 border-b border-pf-neutral-100 sticky top-0 z-10 bg-white">
        <button onClick={onBack} className="flex items-center gap-1 text-xs font-bold text-pf-neutral-400 hover:text-pf-neutral-600 mb-4 transition-colors"><ChevronLeft size={16} /> VOLVER A LISTA</button>
        <div className="flex items-center gap-2 mb-2">
          <span className="bg-pf-blue-50 text-pf-blue-600 px-2 py-0.5 rounded text-[10px] font-black border border-pf-blue-100/50">{otItem.planta}</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${otItem.tipoMovimiento === 'NUEVA' ? 'bg-pf-red-50 text-pf-red-600 border-pf-red-100/50' : 'bg-pf-success-50 text-pf-success-600 border-pf-success-100/50'}`}>{otItem.tipoMovimiento}</span>
        </div>
        <h2 className="text-2xl font-mono font-black text-pf-neutral-800 tracking-tight mb-2">{otItem.nroOrden}</h2>
        <p className="text-sm text-pf-neutral-600 font-medium leading-relaxed bg-pf-neutral-50 p-3 rounded-lg border border-pf-neutral-100">{otItem.descripcion}</p>

        <div className="mt-4 flex items-center justify-between text-xs pt-2 border-t border-pf-neutral-50">
          <span className="font-bold text-pf-neutral-400 uppercase tracking-widest">Evolución</span>
          <div className="flex items-center gap-2">
            <span className="text-pf-neutral-400 line-through">{otItem.estadoAnterior || "-"}</span>
            <ArrowRight size={12} className="text-pf-neutral-300" />
            <span className="font-black text-pf-blue-600 bg-pf-blue-50 px-2 py-1 rounded border border-pf-blue-100/50">{otItem.estadoActual}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        <h3 className="text-[10px] font-black text-pf-neutral-400 uppercase mb-3 px-1 tracking-widest">Técnicos Asignados</h3>
        {tecnicos.length === 0 ? <div className="text-center py-8 text-pf-neutral-300 italic text-xs">Sin asignación</div> : tecnicos.map((t, i) => (
          <div
            key={i}
            role="button"
            tabIndex={0}
            onClick={() => onTechClick(t.tecnico.nombre)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onTechClick(t.tecnico.nombre);
              }
            }}
            className="flex justify-between items-center p-3 rounded-xl border border-pf-neutral-100 hover:border-pf-blue-200 hover:shadow-md cursor-pointer transition-all bg-white group focus:outline-none focus:ring-2 focus:ring-pf-blue-400"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-pf-neutral-100 flex items-center justify-center text-xs font-black text-pf-neutral-500 group-hover:bg-pf-blue-100 group-hover:text-pf-blue-600">{t.tecnico.nombre.substring(0, 2)}</div>
              <span className="text-sm font-bold text-pf-neutral-700 group-hover:text-pf-blue-700">{t.tecnico.nombre}</span>
            </div>
            {t.opFinalizada ? <CheckCircle2 size={16} className="text-pf-success-500" /> : <div className="w-4 h-4 rounded-full border-2 border-pf-neutral-200"></div>}
          </div>
        ))}
      </div>
    </div>
  );
};


interface AnalysisDashboardProps {
  isOpen: boolean;
  onClose: () => void;
  periodoLabel: string;
  flowStats: BacklogStats | null;
  techStats: TechStats[];
  plantasDisponibles: string[];
  currentData: AtrasoRow[];
}
type ViewState =
  | { type: 'LIST' }
  | { type: 'OT_DETAIL', data: OTFlowResult }
  | { type: 'TECH_DETAIL', data: TechStats };

export const AnalysisDashboard = ({
  isOpen,
  onClose,
  periodoLabel,
  flowStats,
  techStats,
  plantasDisponibles,
  currentData
}: AnalysisDashboardProps) => {

  const [viewStack, setViewStack] = useState<ViewState[]>([{ type: 'LIST' }]);
  const currentView = viewStack[viewStack.length - 1];

  // Filtros para el perfil del técnico
  const [techFilters, setTechFilters] = useState<TechFilters>({
    planta: "TODAS", periodo: "TODOS", cumplimiento: "TODOS", clasificacion: "TODAS"
  });
  const [techSearch, setTechSearch] = useState("");

  const pushView = (view: ViewState) => setViewStack([...viewStack, view]);
  const popView = () => {
    if (viewStack.length > 1) {
      setViewStack(viewStack.slice(0, -1));
      setTechSearch("");
    }
  };

  const handleSelectTech = (tech: TechStats, plantaInicial: string = "TODAS") => {
    setTechFilters({ planta: plantaInicial, periodo: "TODOS", cumplimiento: "TODOS", clasificacion: "TODAS" });
    setTechSearch("");
    pushView({ type: 'TECH_DETAIL', data: tech });
  };

  // Preparamos el perfil del técnico filtrando la data cruda que ya tenemos en memoria
  const techProfileProps = useMemo(() => {
    if (currentView.type !== 'TECH_DETAIL' || !currentView.data) return null;

    const techName = currentView.data.nombre;
    const allOrders = currentData.filter(d => d.detallesTecnicos?.some(t => t.tecnico.nombre === techName));

    // 1. Filtrado para Estadísticas (Planta + Periodo + Search)
    const baseFiltered = allOrders.filter(o => {
      const matchPlanta = techFilters.planta === "TODAS" || o.planta === techFilters.planta;
      const matchPeriodo = techFilters.periodo === "TODOS" || o.periodo === techFilters.periodo;
      const matchClasificacion = techFilters.clasificacion === "TODAS" || !techFilters.clasificacion || o.clasificacion === techFilters.clasificacion;
      const matchSearch = !techSearch || o.nroOrden.toLowerCase().includes(techSearch.toLowerCase()) || o.descripcion.toLowerCase().includes(techSearch.toLowerCase());
      return matchPlanta && matchPeriodo && matchClasificacion && matchSearch;
    });

    // 2. Base de listado sin filtro de cumplimiento (el perfil local lo maneja)
    const listFiltered = baseFiltered;

    // 3. Recalcular Stats para este set filtrado
    const totalAsignado = baseFiltered.length;
    const finalizadas = baseFiltered.filter(o => o.detallesTecnicos?.find(t => t.tecnico.nombre === techName)?.opFinalizada).length;
    const pendientes = totalAsignado - finalizadas;
    const efectividad = totalAsignado > 0 ? Math.round((finalizadas / totalAsignado) * 100) : 0;

    return {
      techName,
      orders: listFiltered,
      stats: {
        ...currentView.data,
        totalAsignado,
        finalizadas,
        pendientes,
        efectividad
      },
      activePlants: Array.from(new Set(allOrders.map(o => o.planta))).sort(),
      activePeriods: Array.from(new Set(allOrders.map(o => o.periodo))).sort(),
      activeClasificaciones: Array.from(new Set(allOrders.map(o => o.clasificacion))).filter(Boolean).sort()
    };
  }, [currentView, currentData, techFilters, techSearch]);

  if (!flowStats) return null;

  return (
    <div className={`fixed inset-0 z-50 flex justify-end transition-opacity duration-300 ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div role="button"
        tabIndex={-1}
        aria-label="Cerrar modal"
        className={`absolute inset-0 bg-pf-neutral-900/40 backdrop-blur-[1px] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose} onKeyDown={(e) => e.key === 'Escape' && onClose()}
      />

      {/* PANEL LATERAL */}
      <div className={`relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col transform transition-transform duration-300 ease-out border-l border-pf-neutral-100 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>

        {/* VISTA 1: DETALLE OT */}
        {currentView.type === 'OT_DETAIL' && (
          <OTDetailView
            otItem={currentView.data}
            allData={currentData}
            onBack={popView}
            onTechClick={(techName) => {
              const stats = techStats.find(t => t.nombre === techName) || { nombre: techName, totalAsignado: 0, finalizadas: 0, pendientes: 0, efectividad: 0, plantas: [] };
              pushView({ type: 'TECH_DETAIL', data: stats });
            }}
          />
        )}

        {/* VISTA 2: PERFIL DE TÉCNICO */}
        {currentView.type === 'TECH_DETAIL' && techProfileProps && (
          <div className="h-full flex flex-col bg-white">
            <TechProfile
              {...techProfileProps}
              filters={techFilters}
              setFilters={setTechFilters}
              searchTerm={techSearch}
              setSearchTerm={setTechSearch}
              onBack={popView}
            />
          </div>
        )}

        {/* VISTA 3: LISTA PRINCIPAL (REFACTORIZADA) */}
        {currentView.type === 'LIST' && (
          <DashboardListView
            onClose={onClose}
            periodoLabel={periodoLabel}
            flowStats={flowStats}
            techStats={techStats}
            plantasDisponibles={plantasDisponibles}
            onSelectOT={(item) => pushView({ type: 'OT_DETAIL', data: item })}
            onSelectTech={(item, currentPlantaFilter) => {
              handleSelectTech(item, currentPlantaFilter);
            }}
          />
        )}
      </div>
    </div>
  );
};