import { ChevronLeft, User, ClipboardCheck, Clock, Factory, Calendar, AlertCircle, ListFilter, Target, X, Search, ChevronRight } from "lucide-react";
import { OTCard } from "./OTCard";
import { useMemo, useState } from "react";
import type { AtrasoRow, TechStats, TechFilters } from "../types";

export interface TechProfileProps {
  techName: string;
  orders: AtrasoRow[];
  stats: TechStats;
  onBack: () => void;
  filters: TechFilters;
  setFilters: (filters: TechFilters) => void;
  activePlants: string[];
  activePeriods: string[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const TechProfile = ({
  techName,
  orders,
  stats,
  onBack,
  filters,
  setFilters,
  activePlants,
  activePeriods,
  searchTerm,
  setSearchTerm
}: TechProfileProps) => {
  // --- LÓGICA DE PAGINACIÓN ---
  const [pagina, setPagina] = useState(1);
  const itemsPorPagina = 10;

  const handleFilterChange = (newFilters: TechFilters) => {
    setFilters(newFilters);
    setPagina(1);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setPagina(1);
  };

  const totalPaginas = Math.ceil(orders.length / itemsPorPagina);

  const datosPaginados = useMemo(() => {
    const inicio = (pagina - 1) * itemsPorPagina;
    return orders.slice(inicio, inicio + itemsPorPagina);
  }, [orders, pagina]);

  // --- LÓGICA DE CUMPLIMIENTO REAL ---
  const kpiCumplimiento = useMemo(() => {
    if (!stats || stats.totalAsignado === 0) return 0;
    return Math.round((stats.finalizadas) / stats.totalAsignado * 100);
  }, [stats]);

  const getBarColor = (pct: number) => {
    if (pct >= 90) return "bg-green-500";
    if (pct >= 70) return "bg-blue-500";
    if (pct >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <>
      <div className="p-6 border-b bg-white space-y-4 shadow-sm">
        {/* Header y Botón Volver */}
        <div className="flex justify-between items-center">
          <button onClick={onBack} className="flex items-center gap-2 text-pf-red font-black text-sm hover:underline">
            <ChevronLeft size={16} /> Volver
          </button>
          <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100 shadow-sm">
            <Target size={12} />
            <span className="text-xs font-black">{kpiCumplimiento}% Cumplimiento</span>
          </div>
        </div>

        {/* Card de Usuario */}
        <div className="flex items-center gap-4 p-4 bg-slate-900 rounded-2xl text-white shadow-lg">
          <div className="p-3 bg-white/10 rounded-xl"><User size={24} /></div>
          <div className="flex-1">
            <h3 className="text-lg font-black leading-none">{techName}</h3>
            <div className="flex flex-wrap gap-1 mt-2">
              {activePlants?.map((p: string) => (
                <span key={p} className="px-2 py-0.5 rounded bg-white/10 text-[8px] font-bold text-slate-300 border border-white/5 uppercase">
                  {p}
                </span>
              ))}
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <Target size={14} className="text-indigo-400" />
              <span className="text-2xl font-black tracking-tighter">{kpiCumplimiento}%</span>
            </div>
            <p className="text-[9px] font-black text-slate-500 uppercase">Rendimiento</p>
          </div>
        </div>

        {/* BARRA DE PROGRESO */}
        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200">
          <div
            className={`h-full transition-all duration-500 ease-out ${getBarColor(kpiCumplimiento)}`}
            style={{ width: `${kpiCumplimiento}%` }}
          />
        </div>

        {/* BUSCADOR */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder={`Buscar en las OTs de ${techName}...`}
            className="w-full pl-10 pr-10 py-2.5 bg-slate-100 rounded-xl text-xs font-medium outline-none border border-transparent focus:border-indigo-200 transition-all shadow-inner"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* FILTROS INTERNOS */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-400 flex items-center gap-1 uppercase"><Factory size={10} /> Planta</label>
            <select
              value={filters.planta}
              onChange={(e) => handleFilterChange({ ...filters, planta: e.target.value })}
              className="bg-slate-50 p-2 rounded-lg text-[10px] font-bold outline-none border border-slate-200"
            >
              <option value="TODAS">TODAS ({activePlants?.length || 0})</option>
              {activePlants?.map((p: string) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-400 flex items-center gap-1 uppercase"><Calendar size={10} /> Periodo</label>
            <select
              value={filters.periodo}
              onChange={(e) => setFilters({ ...filters, periodo: e.target.value })}
              className="bg-slate-50 p-2 rounded-lg text-[10px] font-bold outline-none border border-slate-200"
            >
              <option value="TODOS">TODOS</option>
              {activePeriods?.map((p: string) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-slate-400 flex items-center gap-1 uppercase"><ListFilter size={10} /> Ver Solo</label>
            <select
              value={filters.cumplimiento}
              onChange={(e) => setFilters({ ...filters, cumplimiento: e.target.value })}
              className={`p-2 rounded-lg text-[10px] font-bold outline-none border ${filters.cumplimiento === 'TODOS' ? 'bg-slate-50' : 'bg-indigo-50 border-indigo-200 text-indigo-600'}`}
            >
              <option value="TODOS">TODOS</option>
              <option value="CUMPLIDAS">CUMPLIDAS</option>
              <option value="PENDIENTES">PENDIENTES</option>
            </select>
          </div>
        </div>

        {/* STATS DE CONTEO */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-50 border p-2 rounded-xl text-center shadow-sm">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Asignadas</p>
            <p className="text-xl font-black text-slate-700">{stats.totalAsignado}</p>
          </div>
          <div className="bg-green-50 border border-green-100 p-2 rounded-xl text-center shadow-sm">
            <p className="text-[8px] font-black text-green-600 uppercase flex items-center justify-center gap-1 tracking-tighter">
              <ClipboardCheck size={10} /> OK
            </p>
            <p className="text-xl font-black text-green-700">{stats.finalizadas}</p>
          </div>
          <div className="bg-red-50 border border-red-100 p-2 rounded-xl text-center shadow-sm">
            <p className="text-[8px] font-black text-red-600 uppercase flex items-center justify-center gap-1 tracking-tighter">
              <Clock size={10} /> Pend.
            </p>
            <p className="text-xl font-black text-red-700">{stats.pendientes}</p>
          </div>
        </div>
      </div>

      {/* LISTA DE ÓRDENES PAGINADA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
        {datosPaginados.length > 0 ? (
          datosPaginados.map((item: AtrasoRow, idx: number) => (
            <OTCard
              key={`${item.ot}-${idx}`}
              item={item}
              isNew={item.isNew}
              selectedTech={techName}
            />
          ))
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 py-20 uppercase">
            <AlertCircle size={40} className="mb-2 opacity-20" />
            <p className="text-xs font-bold italic text-center">Sin órdenes para este filtro</p>
          </div>
        )}
      </div>

      {/* FOOTER DE PAGINACIÓN */}
      {totalPaginas > 1 && (
        <div className="p-4 border-t flex justify-between items-center bg-white shadow-inner">
          <span className="text-[10px] font-bold text-slate-400 uppercase">
            Página {pagina} de {totalPaginas} ({orders.length} OTs)
          </span>
          <div className="flex gap-2">
            <button
              disabled={pagina === 1}
              onClick={() => setPagina(p => p - 1)}
              className="p-2 border rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={pagina === totalPaginas}
              onClick={() => setPagina(p => p + 1)}
              className="p-2 border rounded-lg hover:bg-slate-50 disabled:opacity-30 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};