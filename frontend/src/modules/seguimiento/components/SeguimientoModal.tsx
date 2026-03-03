import { X, Search, ChevronLeft, ChevronRight, Filter, Sparkles, ArrowUp, ArrowDown, Hash, Calendar } from "lucide-react";
import type { AtrasoRow } from "../types";
import { TechProfile } from "./TechProfile";
import { OTCard } from "./OTCard";
import { useSeguimientoModal } from "../hooks/useSeguimientoModal";

interface SeguimientoModalProps {
  viewDetail: { id: string; esOB: boolean; cat?: string; isGlobal?: boolean; periodo?: string };
  onClose: () => void;
  dataModo: AtrasoRow[];
  dataAnterior?: AtrasoRow[];
  selectedSemana: string;
  LISTA_PLANTAS_INDIVIDUALES: string[];
  PLANTAS_COMPLEJO: string[];
  PLANTAS_PF_ALIMENTOS: string[];
  modoVista: "ATRASOS" | "CUMPLIDAS";
}

export const SeguimientoModal = ({
  viewDetail, onClose, dataModo, dataAnterior = [], selectedSemana,
  PLANTAS_COMPLEJO, PLANTAS_PF_ALIMENTOS, modoVista
}: SeguimientoModalProps) => {

  const {
    searchTerm, handleSearchChange,
    filterEstado, handleFilterChange,
    pagina, setPagina,
    totalPaginas, datosPaginados, totalItems, estadosDisponibles, previousOtSet,
    selectedTech, handleSelectTech,
    empFilters, setEmpFilters,
    techData, resetTech,
    empSearch, setEmpSearch,
    sortConfig, handleSort
  } = useSeguimientoModal({
    dataModo,
    dataAnterior,
    viewDetail,
    PLANTAS_COMPLEJO,
    PLANTAS_PF_ALIMENTOS,
    modoVista
  });

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

        {/* VISTA 1: PERFIL DE TECNICO */}
        {selectedTech && techData.stats ? (
          <TechProfile
            techName={selectedTech}
            orders={techData.orders}
            stats={techData.stats}
            filters={empFilters}
            setFilters={setEmpFilters}
            activePlants={techData.activePlants}
            activePeriods={techData.activePeriods}
            activeClasificaciones={techData.activeClasificaciones}
            onBack={resetTech}
            searchTerm={empSearch}
            setSearchTerm={setEmpSearch}
          />
        ) : (
          /* VISTA 2: LISTADO GENERAL */
          <>
            <div className="p-4 border-b bg-white">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h2 className="text-lg font-black text-slate-800">{viewDetail.id}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500">{viewDetail.cat || (modoVista === "CUMPLIDAS" ? 'CUMPLIDAS' : 'GLOBAL')}</span>
                    {viewDetail.periodo && (
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-indigo-100 text-pf-red border border-slate-300">
                        Periodo: {viewDetail.periodo}
                      </span>
                    )}
                    <span className="text-xs text-slate-400">Semana: {selectedSemana}</span>
                    <span className="text-xs text-slate-300">|</span>
                    <span className="text-xs font-bold text-slate-600">{totalItems} OTs</span>
                  </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X /></button>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                  <div className="relative min-w-[140px]">
                    {filterEstado === "NUEVAS" ? <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" size={14} /> : <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />}
                    <select
                      value={filterEstado}
                      onChange={(e) => handleFilterChange(e.target.value)}
                      className={`w-full pl-9 pr-2 py-2 rounded-xl text-xs font-bold outline-none border border-transparent focus:border-blue-200 cursor-pointer appearance-none ${filterEstado === 'NUEVAS' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-700'}`}
                    >
                      {estadosDisponibles.map(est => <option key={est} value={est}>{est}</option>)}
                    </select>
                  </div>

                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input
                      type="text"
                      placeholder="Buscar OT, Activo, Descripción o Técnico..."
                      className="w-full pl-10 pr-4 py-2 bg-slate-100 rounded-xl text-sm outline-none border border-transparent focus:border-blue-200 transition-all"
                      value={searchTerm}
                      onChange={(e) => handleSearchChange(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 px-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ordenar por:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSort('nroOrden')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all shadow-sm border ${sortConfig?.key === 'nroOrden' ? 'bg-slate-800 text-white border-slate-800 shadow-slate-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
                    >
                      <Hash size={10} />
                      <span>OT</span>
                      {sortConfig?.key === 'nroOrden' && (sortConfig.direction === 'asc' ? <ArrowUp size={10} className="animate-in slide-in-from-bottom-1" /> : <ArrowDown size={10} className="animate-in slide-in-from-top-1" />)}
                    </button>
                    <button
                      onClick={() => handleSort('fecha')}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all shadow-sm border ${sortConfig?.key === 'fecha' ? 'bg-slate-800 text-white border-slate-800 shadow-slate-200' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:border-slate-300'}`}
                    >
                      <Calendar size={10} />
                      <span>Fecha</span>
                      {sortConfig?.key === 'fecha' && (sortConfig.direction === 'asc' ? <ArrowUp size={10} className="animate-in slide-in-from-bottom-1" /> : <ArrowDown size={10} className="animate-in slide-in-from-top-1" />)}
                    </button>
                  </div>
                </div>
              </div>
            </div>


            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
              {datosPaginados.length > 0 ? (
                datosPaginados.map((item, idx) => {
                  const isItemNew = dataAnterior.length > 0 && !previousOtSet.has(item.nroOrden);
                  return (
                    <OTCard
                      key={idx}
                      item={item}
                      isNew={isItemNew}
                      onSelectTech={(name) => handleSelectTech(name)}
                    />
                  );
                })
              ) : (
                <div className="text-center py-10 flex flex-col items-center gap-2">
                  <Search size={32} className="text-slate-300" />
                  <span className="text-slate-400 text-sm italic">No se encontraron órdenes.</span>
                </div>
              )}
            </div>

            {totalPaginas > 1 && (
              <div className="p-4 border-t flex justify-between items-center bg-white shadow-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Página {pagina} de {totalPaginas}</span>
                <div className="flex gap-2">
                  <button disabled={pagina === 1} onClick={() => setPagina(p => p - 1)} className="p-2 border rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-colors"><ChevronLeft size={18} /></button>
                  <button disabled={pagina === totalPaginas} onClick={() => setPagina(p => p + 1)} className="p-2 border rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-colors"><ChevronRight size={18} /></button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};