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
      <div className="p-6 border-b bg-white z-10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">Centro de Análisis</h2>
            <p className="text-xs text-slate-400 font-bold mt-0.5">{periodoLabel}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-400"><X size={20} /></button>
        </div>

        {/* TABS PRINCIPALES */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
          <button onClick={() => setActiveTab("FLOW")} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'FLOW' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            <TrendingUp size={14} /> EVOLUCIÓN
          </button>
          <button onClick={() => setActiveTab("TECNICOS")} className={`flex-1 py-2 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 ${activeTab === 'TECNICOS' ? 'bg-white text-red-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>
            <User size={14} /> TÉCNICOS
          </button>
        </div>

        {/* SUBTABS FLOW */}
        {activeTab === "FLOW" && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
            <button onClick={() => setSubTabFlow("NUEVAS")} className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors flex items-center gap-1 ${subTabFlow === 'NUEVAS' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-slate-400 border-slate-200'}`}><Plus size={12} /> NUEVAS ({flowStats.nuevas.length})</button>
            <button onClick={() => setSubTabFlow("CAMBIOS")} className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors flex items-center gap-1 ${subTabFlow === 'CAMBIOS' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-400 border-slate-200'}`}><ArrowRight size={12} /> CAMBIOS ({flowStats.conAvance.length})</button>
            <button onClick={() => setSubTabFlow("FINALIZADAS")} className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors flex items-center gap-1 ${subTabFlow === 'FINALIZADAS' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-white text-slate-400 border-slate-200'}`}><CheckCircle2 size={12} /> FINALIZADAS ({flowStats.finalizadas.length})</button>
          </div>
        )}

        {/* SUBTABS TECNICOS (SORTING) */}
        {activeTab === "TECNICOS" && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSortConfig("nombre")}
              className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors flex items-center gap-1 ${sortConfig?.key === 'nombre' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-white text-slate-400 border-slate-200'}`}
            >
              <ArrowUpDown size={12} /> NOMBRE {sortConfig?.key === 'nombre' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
            </button>
            <button
              onClick={() => setSortConfig("efectividad")}
              className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors flex items-center gap-1 ${sortConfig?.key === 'efectividad' ? 'bg-indigo-50 text-indigo-600 border-indigo-200' : 'bg-white text-slate-400 border-slate-200'}`}
            >
              <ArrowUpDown size={12} /> CUMPLIMIENTO {sortConfig?.key === 'efectividad' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : ''}
            </button>
          </div>
        )}

        {/* FILTROS */}
        <div className="flex gap-2">
          <div className="relative min-w-[120px]">
            <Factory className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <select value={filterPlanta} onChange={(e) => setFilterPlanta(e.target.value)} className="w-full pl-9 pr-2 py-2 bg-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none border border-slate-200 focus:border-blue-200 cursor-pointer appearance-none">
              <option value="TODAS">TODAS</option>
              {plantasDisponibles.map(p => (<option key={p} value={p}>{p}</option>))}
            </select>
          </div>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl text-xs outline-none border border-slate-200 focus:border-blue-200 transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>
      </div>

      {/* LISTA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-slate-50/50">
        {paginatedList.length === 0 ? (
          <div className="text-center py-10 flex flex-col items-center gap-2">
            <Search size={32} className="text-slate-300" />
            <span className="text-slate-400 text-sm italic">No hay resultados.</span>
          </div>
        ) : (
          paginatedList.map((item) => {
            // --- ELIMINACIÓN DE ANY Y DISCRIMINACIÓN DE TIPOS ---
            if (activeTab === "FLOW") {
              const otItem = item as OTFlowResult;
              return (
                <div
                  key={otItem.ot}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectOT(otItem)}
                  className="bg-white p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:shadow-md cursor-pointer transition-all flex justify-between items-start group"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-black bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">{otItem.planta}</span>
                      <span className="font-mono text-xs font-bold text-slate-700 group-hover:text-blue-600">{otItem.ot}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{otItem.descripcion}</p>
                  </div>
                  {otItem.estadoAnterior && (
                    <div className="text-[9px] text-slate-400 flex flex-col items-end min-w-[60px]">
                      <span className="line-through">{otItem.estadoAnterior}</span>
                      <ArrowRight size={10} className="my-0.5 opacity-50" />
                      <span className="font-bold text-slate-700">{otItem.estadoActual}</span>
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
                  className="bg-white p-3 rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-md cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black ${techItem.efectividad === 100 ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'} group-hover:bg-purple-100 group-hover:text-purple-600 transition-colors`}>
                      {techItem.nombre.substring(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-700 group-hover:text-purple-700 truncate">{techItem.nombre}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="h-1 w-16 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full ${techItem.efectividad >= 80 ? 'bg-green-500' : 'bg-slate-400'}`} style={{ width: `${techItem.efectividad}%` }} />
                        </div>
                        <span className="text-[9px] font-bold text-slate-400">{techItem.efectividad}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3 text-right">
                    <div><span className="block text-xs font-black text-green-600">{techItem.finalizadas}</span><span className="text-[8px] text-slate-300 font-bold uppercase">OK</span></div>
                    <div><span className="block text-xs font-black text-slate-600">{techItem.totalAsignado}</span><span className="text-[8px] text-slate-300 font-bold uppercase">TOT</span></div>
                  </div>
                </div>
              );
            }
          })
        )}
      </div>

      {/* FOOTER PAGINACIÓN */}
      {totalPages > 1 && (
        <div className="p-4 border-t flex justify-between items-center bg-white shadow-lg z-10">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Página {page} de {totalPages}</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-2 border rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-colors"><ChevronLeft size={16} /></button>
            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-2 border rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-colors"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
};