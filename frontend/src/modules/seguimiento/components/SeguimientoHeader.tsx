// src/components/seguimiento/SeguimientoHeader.tsx
import { Filter, Calendar, CheckCircle, Clock } from "lucide-react";
import { getRangeFromWeekID } from "../../../shared/utils/dateUtils";

interface SeguimientoHeaderProps {
    modoVista: "ATRASOS" | "CUMPLIDAS";
    setModoVista: (modo: "ATRASOS" | "CUMPLIDAS") => void;
    selectedYear: string;
    setSelectedYear: (year: string) => void;
    yearsInRows: string[];
    selectedSemana: string;
    setSelectedSemana: (semana: string) => void;
    semanasInRows: string[];
    resetViewDetail: () => void;
}

export const SeguimientoHeader = ({
    modoVista, setModoVista,
    selectedYear, setSelectedYear, yearsInRows,
    selectedSemana, setSelectedSemana, semanasInRows,
    resetViewDetail
}: SeguimientoHeaderProps) => {

    const formatLabel = (val: string) => val === "TODAS" ? val : val.split('-')[1] || val;

    return (
        <div className="flex items-center gap-8">
            {/* SWITCH ATRASOS/CUMPLIDAS */}
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                <button
                    onClick={() => { setModoVista("ATRASOS"); resetViewDetail(); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
                        modoVista === 'ATRASOS' ? 'bg-white text-pf-red shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <Clock size={14} /> ATRASOS
                </button>
                <button
                    onClick={() => { setModoVista("CUMPLIDAS"); resetViewDetail(); }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all ${
                        modoVista === 'CUMPLIDAS' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
                    }`}
                >
                    <CheckCircle size={14} /> CUMPLIDAS
                </button>
            </div>

            {/* FILTROS TEMPORALES */}
            <div className="flex items-center gap-6">
                {/* FILTRO AÑO */}
                <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1">
                        <Calendar size={10} /> Año
                    </span>
                    <select
                        value={selectedYear}
                        onChange={(e) => { setSelectedYear(e.target.value); setSelectedSemana("TODAS"); }}
                        className="text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-xl outline-none text-slate-700 cursor-pointer shadow-sm hover:border-slate-300 transition-colors"
                    >
                        {yearsInRows.map((y: string) => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>

                {/* FILTRO SEMANA */}
                <div className="flex flex-col gap-1">
                    <span className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1">
                        <Filter size={10} /> Semana
                    </span>
                    <div className="flex items-center gap-3">
                        <select
                            value={selectedSemana}
                            onChange={(e) => setSelectedSemana(e.target.value)}
                            className="text-xs font-bold bg-white border border-slate-200 px-3 py-1.5 rounded-xl outline-none text-slate-700 cursor-pointer shadow-sm min-w-[90px] hover:border-slate-300 transition-colors"
                        >
                            {semanasInRows.map((sem: string) => <option key={sem} value={sem}>{formatLabel(sem)}</option>)}
                        </select>

                        {/* RANGO DE FECHAS VISUAL */}
                        {selectedSemana !== "TODAS" && (
                            <span className="text-[11px] font-bold text-slate-700 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-100 animate-in fade-in slide-in-from-left-1">
                                {getRangeFromWeekID(selectedSemana)}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};