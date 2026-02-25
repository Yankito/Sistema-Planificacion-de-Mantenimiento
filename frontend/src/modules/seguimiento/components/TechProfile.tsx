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
    if (pct >= 90) return "bg-pf-success-500";
    if (pct >= 70) return "bg-pf-blue-500";
    if (pct >= 50) return "bg-pf-warning-500";
    return "bg-pf-red-500";
  };

  return (
    <>
      <div className="p-6 border-b border-pf-neutral-100 bg-white space-y-4 shadow-sm">
        {/* Header y Botón Volver */}
        <div className="flex justify-between items-center">
          <button onClick={onBack} className="flex items-center gap-2 text-pf-red font-black text-sm hover:underline transition-all active:scale-95 group">
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver
          </button>
          <div className="flex items-center gap-2 px-3 py-1 bg-pf-blue-50 text-pf-blue-600 rounded-full border border-pf-blue-100 shadow-sm">
            <Target size={12} />
            <span className="text-xs font-black">{kpiCumplimiento}% Cumplimiento</span>
          </div>
        </div>

        {/* Card de Usuario */}
        <div className="flex items-center gap-4 p-5 bg-pf-neutral-900 rounded-2xl text-white shadow-xl">
          <div className="p-3 bg-white/10 rounded-xl shadow-inner"><User size={24} /></div>
          <div className="flex-1">
            <h3 className="text-lg font-black leading-none tracking-tight">{techName}</h3>
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              {activePlants?.map((p: string) => (
                <span key={p} className="px-2 py-0.5 rounded-lg bg-white/10 text-[8px] font-black text-pf-neutral-300 border border-white/5 uppercase tracking-wider">
                  {p}
                </span>
              ))}
            </div>
          </div>

          <div className="text-right">
            <div className="flex items-center gap-2 justify-end">
              <Target size={14} className="text-pf-blue-400" />
              <span className="text-2xl font-black tracking-tighter">{kpiCumplimiento}%</span>
            </div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mt-0.5">Rendimiento</p>
          </div>
        </div>

        {/* BARRA DE PROGRESO */}
        <div className="h-2 w-full bg-pf-neutral-100 rounded-full overflow-hidden border border-pf-neutral-200 shadow-inner">
          <div
            className={`h-full transition-all duration-1000 ease-out shadow-sm ${getBarColor(kpiCumplimiento)}`}
            style={{ width: `${kpiCumplimiento}%` }}
          />
        </div>

        {/* BUSCADOR */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-pf-neutral-400" size={14} />
          <input
            type="text"
            placeholder={`Buscar órdenes de ${techName}...`}
            className="w-full pl-10 pr-10 py-3 bg-pf-neutral-50 rounded-xl text-xs font-bold text-pf-neutral-800 outline-none border border-pf-neutral-200 focus:border-pf-blue-300 focus:bg-white transition-all shadow-sm"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-pf-neutral-400 hover:text-pf-red transition-colors">
              <X size={14} />
            </button>
          )}
        </div>

        {/* FILTROS INTERNOS */}
        <div className="grid grid-cols-3 gap-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-pf-neutral-400 flex items-center gap-1 uppercase tracking-widest pl-1"><Factory size={10} /> Planta</label>
            <select
              value={filters.planta}
              onChange={(e) => handleFilterChange({ ...filters, planta: e.target.value })}
              className="bg-pf-neutral-50 p-2.5 rounded-xl text-[10px] font-black text-pf-neutral-700 outline-none border border-pf-neutral-200 focus:border-pf-blue-200 cursor-pointer transition-all shadow-sm"
            >
              <option value="TODAS">TODAS ({activePlants?.length || 0})</option>
              {activePlants?.map((p: string) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-pf-neutral-400 flex items-center gap-1 uppercase tracking-widest pl-1"><Calendar size={10} /> Periodo</label>
            <select
              value={filters.periodo}
              onChange={(e) => setFilters({ ...filters, periodo: e.target.value })}
              className="bg-pf-neutral-50 p-2.5 rounded-xl text-[10px] font-black text-pf-neutral-700 outline-none border border-pf-neutral-200 focus:border-pf-blue-200 cursor-pointer transition-all shadow-sm"
            >
              <option value="TODOS">TODOS</option>
              {activePeriods?.map((p: string) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-black text-pf-neutral-400 flex items-center gap-1 uppercase tracking-widest pl-1"><ListFilter size={10} /> Ver Solo</label>
            <select
              value={filters.cumplimiento}
              onChange={(e) => setFilters({ ...filters, cumplimiento: e.target.value })}
              className={`p-2.5 rounded-xl text-[10px] font-black outline-none border transition-all cursor-pointer shadow-sm ${filters.cumplimiento === 'TODOS' ? 'bg-pf-neutral-50 border-pf-neutral-200 text-pf-neutral-700' : 'bg-pf-blue-50 border-pf-blue-200 text-pf-blue-600'}`}
            >
              <option value="TODOS">TODAS</option>
              <option value="CUMPLIDAS">CUMPLIDAS</option>
              <option value="PENDIENTES">PENDIENTES</option>
            </select>
          </div>
        </div>

        {/* STATS DE CONTEO */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-pf-neutral-50/50 border border-pf-neutral-100 p-2.5 rounded-2xl text-center shadow-sm">
            <p className="text-[8px] font-black text-pf-neutral-400 uppercase tracking-widest">Asignadas</p>
            <p className="text-xl font-black text-pf-neutral-700 leading-tight">{stats.totalAsignado}</p>
          </div>
          <div className="bg-pf-success-50/50 border border-pf-success-100 p-2.5 rounded-2xl text-center shadow-sm">
            <p className="text-[8px] font-black text-pf-success-600 uppercase flex items-center justify-center gap-1 tracking-widest">
              <ClipboardCheck size={10} /> OK
            </p>
            <p className="text-xl font-black text-pf-success-700 leading-tight">{stats.finalizadas}</p>
          </div>
          <div className="bg-pf-red-50/50 border border-pf-red-100 p-2.5 rounded-2xl text-center shadow-sm">
            <p className="text-[8px] font-black text-pf-red-600 uppercase flex items-center justify-center gap-1 tracking-widest">
              <Clock size={10} /> Pend.
            </p>
            <p className="text-xl font-black text-pf-red-700 leading-tight">{stats.pendientes}</p>
          </div>
        </div>
      </div>

      {/* LISTA DE ÓRDENES PAGINADA */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-pf-neutral-50/50">
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
          <div className="h-full flex flex-col items-center justify-center text-pf-neutral-400 py-20 uppercase">
            <AlertCircle size={40} className="mb-2 opacity-20" />
            <p className="text-[11px] font-black italic text-center tracking-widest">Sin órdenes para este filtro</p>
          </div>
        )}
      </div>

      {/* FOOTER DE PAGINACIÓN */}
      {totalPaginas > 1 && (
        <div className="p-4 border-t border-pf-neutral-100 flex justify-between items-center bg-white shadow-inner">
          <span className="text-[10px] font-black text-pf-neutral-400 uppercase tracking-widest pl-2">
            Página {pagina} de {totalPaginas} <span className="text-pf-neutral-300 ml-1">({orders.length} OTs)</span>
          </span>
          <div className="flex gap-2">
            <button
              disabled={pagina === 1}
              onClick={() => setPagina(p => p - 1)}
              className="p-2.5 border border-pf-neutral-200 rounded-xl hover:bg-pf-neutral-50 disabled:opacity-20 transition-all text-pf-neutral-600 active:scale-90"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              disabled={pagina === totalPaginas}
              onClick={() => setPagina(p => p + 1)}
              className="p-2.5 border border-pf-neutral-200 rounded-xl hover:bg-pf-neutral-50 disabled:opacity-20 transition-all text-pf-neutral-600 active:scale-90"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};