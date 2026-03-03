import { Search, ChevronLeft, ChevronRight, TrendingUp, User, ArrowRight, Plus, Factory, CheckCircle2, X, ArrowUpDown } from "lucide-react";
import { useDashboardList } from "../hooks/useDashboardList";
import type { OTFlowResult, TechStats, BacklogStats } from "../types";

interface DashboardListViewProps {
  onClose: () => void;
  periodoLabel: string;
  flowStats: BacklogStats;
  techStats: TechStats[];
  plantasDisponibles: string[];
  onSelectOT: (item: OTFlowResult) => void;
  onSelectTech: (item: TechStats, currentPlanta: string) => void;
}

export const DashboardListView = ({
  onClose,
  periodoLabel,
  flowStats,
  techStats,
  plantasDisponibles,
  onSelectOT,
  onSelectTech
}: DashboardListViewProps) => {

  const {
    activeTab, setActiveTab,
    subTabFlow, setSubTabFlow,
    searchTerm, setSearchTerm,
    filterPlanta, setFilterPlanta,
    sortConfig, setSortConfig,
    page, setPage,
    paginatedList,
    totalPages
  } = useDashboardList(flowStats, techStats);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* HEADER DE LA LISTA */}
      <div className="p-6 border-b border-pf-neutral-100 bg-white z-10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-black text-pf-neutral-800 uppercase tracking-tight">Centro de Análisis</h2>
            <p className="text-xs text-pf-neutral-400 font-bold mt-0.5">{periodoLabel}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-pf-neutral-100 rounded-full transition-colors text-pf-neutral-400"><X size={20} /></button>
        </div>

        {/* TABS PRINCIPALES */}
        <div className="flex bg-pf-neutral-100 p-1.5 rounded-2xl mb-4">
          <button onClick={() => setActiveTab("FLOW")} className={`flex-1 py-2.5 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'FLOW' ? 'bg-white text-pf-blue-600 shadow-sm shadow-pf-blue-100' : 'text-pf-neutral-400 hover:text-pf-neutral-600'}`}>
            <TrendingUp size={14} /> EVOLUCIÓN
          </button>
          <button onClick={() => setActiveTab("TECNICOS")} className={`flex-1 py-2.5 rounded-xl text-[11px] font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'TECNICOS' ? 'bg-white text-pf-red-600 shadow-sm shadow-pf-red-100' : 'text-pf-neutral-400 hover:text-pf-neutral-600'}`}>
            <User size={14} /> TÉCNICOS
          </button>
        </div>

        {/* SUBTABS FLOW */}
        {activeTab === "FLOW" && (
          <div className="flex gap-2 mb-2 overflow-x-auto pb-1 no-scrollbar">
            <button onClick={() => setSubTabFlow("NUEVAS")} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors flex items-center gap-1 ${subTabFlow === 'NUEVAS' ? 'bg-pf-red-50 text-pf-red-600 border-pf-red-200' : 'bg-white text-pf-neutral-400 border-pf-neutral-200'}`}><Plus size={12} /> NUEVAS ({flowStats.nuevas.length})</button>
            <button onClick={() => setSubTabFlow("CAMBIOS")} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors flex items-center gap-1 ${subTabFlow === 'CAMBIOS' ? 'bg-pf-blue-50 text-pf-blue-600 border-pf-blue-200' : 'bg-white text-pf-neutral-400 border-pf-neutral-200'}`}><ArrowRight size={12} /> CAMBIOS ({flowStats.conAvance.length})</button>
            <button onClick={() => setSubTabFlow("FINALIZADAS")} className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors flex items-center gap-1 ${subTabFlow === 'FINALIZADAS' ? 'bg-pf-success-50 text-pf-success-600 border-pf-success-200' : 'bg-white text-pf-neutral-400 border-pf-neutral-200'}`}><CheckCircle2 size={12} /> FINALIZADAS ({flowStats.finalizadas.length})</button>
          </div>
        )}

        {/* SUBTABS TECNICOS (SORTING) */}
        {activeTab === "TECNICOS" && (
          <div className="flex gap-2 mb-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSortConfig("nombre")}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors flex items-center gap-1 ${sortConfig?.key === 'nombre' ? 'bg-pf-blue-50 text-pf-blue-600 border-pf-blue-200' : 'bg-white text-pf-neutral-400 border-pf-neutral-200'}`}
            >
              <ArrowUpDown size={12} /> NOMBRE {sortConfig?.key === 'nombre' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
            </button>
            <button
              onClick={() => setSortConfig("efectividad")}
              className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-colors flex items-center gap-1 ${sortConfig?.key === 'efectividad' ? 'bg-pf-blue-100 text-pf-blue-700 border-pf-blue-300' : 'bg-white text-pf-neutral-400 border-pf-neutral-200'}`}
            >
              <ArrowUpDown size={12} /> CUMPLIMIENTO {sortConfig?.key === 'efectividad' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
            </button>
          </div>
        )}

        {/* FILTROS */}
        <div className="flex gap-2">
          <div className="relative min-w-[120px]">
            <Factory className="absolute left-3 top-1/2 -translate-y-1/2 text-pf-neutral-400" size={14} />
            <select value={filterPlanta} onChange={(e) => setFilterPlanta(e.target.value)} className="w-full pl-9 pr-2 py-2.5 bg-pf-neutral-50 rounded-xl text-xs font-bold text-pf-neutral-700 outline-none border border-pf-neutral-200 focus:border-pf-blue-300 cursor-pointer appearance-none shadow-sm transition-all">
              <option value="TODAS">TODAS LAS PLANTAS</option>
              {plantasDisponibles.map(p => (<option key={p} value={p}>{p}</option>))}
            </select>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-pf-neutral-400" size={14} />
            <input type="text" placeholder={activeTab === "FLOW" ? "Buscar por OT o descripción..." : "Buscar por técnico..."} className="w-full pl-10 pr-4 py-2.5 bg-pf-neutral-50 rounded-xl text-xs outline-none border border-pf-neutral-200 focus:border-pf-blue-300 transition-all shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      {/* LISTA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-pf-neutral-50/50">
        {paginatedList.length === 0 ? (
          <div className="text-center py-10 flex flex-col items-center gap-2">
            <Search size={32} className="text-pf-neutral-300" />
            <span className="text-pf-neutral-400 text-sm italic py-2">No se encontraron resultados para los filtros aplicados.</span>
          </div>
        ) : (
          paginatedList.map((item) => {
            // --- ELIMINACIÓN DE ANY Y DISCRIMINACIÓN DE TIPOS ---
            if (activeTab === "FLOW") {
              const otItem = item as OTFlowResult;
              return (
                <div
                  key={otItem.nroOrden}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectOT(otItem)}
                  className="bg-white p-3.5 rounded-2xl border border-pf-neutral-200 hover:border-pf-blue-300 hover:shadow-lg hover:shadow-pf-blue-100/50 cursor-pointer transition-all flex justify-between items-start group"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black bg-pf-neutral-100 text-pf-neutral-500 px-1.5 py-0.5 rounded border border-pf-neutral-200 shadow-sm">{otItem.planta}</span>
                      <span className="font-mono text-xs font-bold text-pf-neutral-700 group-hover:text-pf-blue-600 transition-colors">{otItem.nroOrden}</span>
                    </div>
                    <p className="text-[11px] text-pf-neutral-500 font-medium truncate">{otItem.descripcion}</p>
                  </div>
                  {otItem.estadoAnterior && (
                    <div className="text-[9px] text-pf-neutral-400 flex flex-col items-end min-w-[60px] bg-pf-neutral-50/50 p-1 rounded-lg">
                      <span className="line-through">{otItem.estadoAnterior}</span>
                      <ArrowRight size={10} className="my-0.5 opacity-50" />
                      <span className="font-bold text-pf-neutral-700">{otItem.estadoActual}</span>
                    </div>
                  )}
                </div>
              );
            } else {
              const techItem = item as TechStats;
              return (
                <div
                  key={techItem.nombre}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectTech(techItem, filterPlanta)}
                  className="bg-white p-3.5 rounded-2xl border border-pf-neutral-200 hover:border-pf-red-200 hover:shadow-lg hover:shadow-pf-red-100/30 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-[10px] font-black ${techItem.efectividad === 100 ? 'bg-pf-success-100 text-pf-success-700' : 'bg-pf-neutral-100 text-pf-neutral-500'} group-hover:bg-pf-red-100 group-hover:text-pf-red-600 transition-colors shadow-sm`}>
                      {techItem.nombre.substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-pf-neutral-700 group-hover:text-pf-red-700 truncate">{techItem.nombre}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1.5 w-20 bg-pf-neutral-100 rounded-full overflow-hidden shadow-inner">
                          <div className={`h-full transition-all duration-1000 ${techItem.efectividad >= 80 ? 'bg-pf-success-500' : (techItem.efectividad >= 50 ? 'bg-pf-warning-500' : 'bg-pf-red-500')}`} style={{ width: `${techItem.efectividad}%` }} />
                        </div>
                        <span className={`text-[10px] font-black ${techItem.efectividad >= 80 ? 'text-pf-success-600' : (techItem.efectividad >= 50 ? 'text-pf-warning-600' : 'text-pf-red-600')}`}>{techItem.efectividad}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 text-right pr-2">
                    <div><span className="block text-sm font-black text-pf-success-600 leading-none">{techItem.finalizadas}</span><span className="text-[8px] text-pf-neutral-300 font-bold uppercase tracking-tighter">OK</span></div>
                    <div><span className="block text-sm font-black text-pf-neutral-700 leading-none">{techItem.totalAsignado}</span><span className="text-[8px] text-pf-neutral-300 font-bold uppercase tracking-tighter">TOT</span></div>
                  </div>
                </div>
              );
            }
          })
        )}
      </div>

      {/* FOOTER PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="p-4 border-t border-pf-neutral-100 flex justify-between items-center bg-white shadow-[0_-4px_20px_-5px_rgba(0,0,0,0.05)] z-10">
          <span className="text-[10px] font-bold text-pf-neutral-400 uppercase tracking-widest pl-2">Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2.5 border border-pf-neutral-200 rounded-xl hover:bg-pf-neutral-50 disabled:opacity-20 transition-all text-pf-neutral-600 active:scale-90"><ChevronLeft size={16} /></button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2.5 border border-pf-neutral-200 rounded-xl hover:bg-pf-neutral-50 disabled:opacity-20 transition-all text-pf-neutral-600 active:scale-90"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
};