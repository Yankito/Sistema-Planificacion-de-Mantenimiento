
import { TrendingUp, AlertCircle, Box, Share2, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import type { CostCenterGroup, CategorySummary } from './types';

interface KPICardsProps {
    totalPresupuesto: number;
    totalGasto: number;
    totalAvance: number;
    totalPlanBudget: number;
    totalPlanReal: number;
    totalCorrectivoBudget: number;
    totalCorrectivoReal: number;
    groupedData: CostCenterGroup[];
    categorySummaries: CategorySummary[];
    monthName: string;
    formatCurrency: (val: number) => string;
    onToggleFilter?: (type: 'critical' | 'exceeded' | 'internal' | 'date') => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
    totalPresupuesto,
    totalGasto,
    totalAvance,
    totalPlanBudget,
    totalPlanReal,
    totalCorrectivoBudget,
    totalCorrectivoReal,
    groupedData,
    categorySummaries,
    monthName,
    formatCurrency,
    onToggleFilter
}) => {
    const [isStatsExpanded, setIsStatsExpanded] = useState(true);
    const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(true);

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'Maquinaria': return <Box size={16} className="text-pf-blue-500" />;
            case 'Redes': return <Share2 size={16} className="text-pf-success-500" />;
            case 'Infra': return <Layers size={16} className="text-pf-blue-500" />;
            default: return <Box size={16} className="text-pf-neutral-500" />;
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-pf-neutral-100 flex items-center justify-center text-pf-neutral-400">
                        <TrendingUp size={16} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-pf-neutral-800 uppercase tracking-widest">Resumen General</h2>
                        <p className="text-[10px] text-pf-neutral-400 font-black uppercase tracking-tight">Métricas consolidadas del periodo</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsStatsExpanded(!isStatsExpanded)}
                    className="p-2 hover:bg-pf-neutral-100 rounded-xl transition-all text-pf-neutral-400 flex items-center gap-2 group"
                >
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        {isStatsExpanded ? 'Comprimir' : 'Expandir'}
                    </span>
                    {isStatsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
            </div>

            {isStatsExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* TARJETA 1: PRESUPUESTO Y PLAN VS REAL */}
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-pf-neutral-100 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <TrendingUp size={80} className="text-pf-blue-500" />
                        </div>
                        <div>
                            <p className="text-pf-neutral-500 text-[11px] font-black uppercase tracking-widest pl-0.5">Presupuesto Gral. ({monthName})</p>
                            <h3 className="text-3xl font-black text-pf-neutral-800 mt-1.5 tracking-tighter">{formatCurrency(totalPresupuesto)}</h3>

                            <div className="mt-4 space-y-3">
                                {/* Desglose de Plan */}
                                <div className="p-3 bg-pf-neutral-50 rounded-xl border border-pf-neutral-100 shadow-inner">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-black text-pf-neutral-400 uppercase tracking-[0.15em]">Plan (Bodega + Serv)</span>
                                        <span className={`text-xs font-black ${totalPlanReal > totalPlanBudget ? 'text-pf-red' : 'text-pf-neutral-600'}`}>
                                            {totalPlanBudget > 0 ? ((totalPlanReal / totalPlanBudget) * 100).toFixed(1) : 0}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-baseline mt-1">
                                        <span className="text-lg font-black text-pf-neutral-800 tracking-tight">{formatCurrency(totalPlanBudget)}</span>
                                        <div className="text-[11px] font-black text-pf-neutral-500 uppercase">Real: {formatCurrency(totalPlanReal)}</div>
                                    </div>
                                    <div className="w-full bg-pf-neutral-200/50 rounded-full h-1.5 mt-3 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${totalPlanReal > totalPlanBudget ? 'bg-pf-red shadow-sm' : 'bg-pf-blue-500 shadow-sm'}`}
                                            style={{ width: `${Math.min((totalPlanReal / (totalPlanBudget || 1)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Desglose de Correctivo */}
                                <div className="p-3 bg-pf-warning-50/50 rounded-xl border border-pf-warning-100/50">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="text-[10px] font-black text-pf-warning-600/80 uppercase tracking-[0.15em]">Manto. Correctivo</span>
                                        <span className={`text-xs font-black ${totalCorrectivoReal > totalCorrectivoBudget ? 'text-pf-red' : 'text-pf-warning-600'}`}>
                                            {totalCorrectivoBudget > 0 ? ((totalCorrectivoReal / totalCorrectivoBudget) * 100).toFixed(1) : 0}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-baseline mt-1">
                                        <span className="text-lg font-black text-pf-warning-700 tracking-tight">{formatCurrency(totalCorrectivoBudget)}</span>
                                        <div className="text-[11px] font-black text-pf-warning-500 uppercase">Real: {formatCurrency(totalCorrectivoReal)}</div>
                                    </div>
                                    <div className="w-full bg-pf-warning-200/40 rounded-full h-1.5 mt-3 overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${totalCorrectivoReal > totalCorrectivoBudget ? 'bg-pf-red shadow-sm' : 'bg-pf-warning-400/80 shadow-sm'}`}
                                            style={{ width: `${Math.min((totalCorrectivoReal / (totalCorrectivoBudget || 1)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TARJETA 2: EJECUCIÓN REAL TOTAL */}
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-pf-neutral-100 flex flex-col justify-between relative overflow-hidden group">
                        <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <AlertCircle size={80} className={totalGasto > totalPresupuesto ? "text-pf-red" : "text-pf-success-500"} />
                        </div>
                        <div>
                            <p className="text-pf-neutral-500 text-[11px] font-black uppercase tracking-widest pl-0.5">Ejecución Real Consolidada</p>
                            <h3 className={`text-3xl font-black mt-1.5 tracking-tighter ${totalGasto > totalPresupuesto ? 'text-pf-red' : 'text-pf-success-600'}`}>
                                {formatCurrency(totalGasto)}
                            </h3>

                            <div className="mt-4">
                                <div className="flex justify-between items-end mb-1.5">
                                    <span className="text-[11px] text-pf-neutral-400 font-black uppercase tracking-widest">Meta Mensual</span>
                                    <span className={`text-xl font-black ${totalGasto > totalPresupuesto ? 'text-pf-red' : 'text-pf-success-600'}`}>
                                        {totalAvance.toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-pf-neutral-100 rounded-full h-3 overflow-hidden border border-pf-neutral-200/50 p-0.5">
                                    <div
                                        className={`h-full rounded-full transition-all duration-1000 ${totalGasto > totalPresupuesto ? 'bg-pf-red shadow-sm' : 'bg-pf-success-500 shadow-sm'}`}
                                        style={{ width: `${Math.min((totalGasto / (totalPresupuesto || 1)) * 100, 100)}%` }}
                                    ></div>
                                </div>
                                <div className="mt-3 flex flex-col gap-1 p-3 bg-pf-neutral-50 rounded-xl border border-pf-neutral-100 shadow-inner">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-pf-neutral-400">Desviación Global</span>
                                        <span className={totalGasto > totalPresupuesto ? 'text-pf-red decoration-2' : 'text-pf-success-600'}>
                                            {totalPresupuesto > 0 ? ((totalGasto - totalPresupuesto) / totalPresupuesto * 100).toFixed(1) : 0}%
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-pf-neutral-400 uppercase tracking-tight">
                                        <span>Vs Pto. Estimado</span>
                                        <span>{formatCurrency(Math.abs(totalPresupuesto - totalGasto))} {totalGasto > totalPresupuesto ? 'Exceso' : 'Ahorro'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* TARJETA 3: ALERTAS DE EJECUCIÓN */}
                    <div className="bg-white p-4 rounded-3xl shadow-sm border border-pf-neutral-100 flex flex-col justify-between relative">
                        <div>
                            <p className="text-pf-neutral-500 text-[10px] font-black uppercase tracking-widest pl-0.5">Alertas de Ejecución</p>
                            <div className="mt-3 grid grid-cols-2 gap-3">
                                <div
                                    className="flex items-center gap-2 cursor-pointer hover:bg-pf-neutral-50 p-1.5 rounded-xl transition-all active:scale-95 group/alert"
                                    onClick={() => onToggleFilter?.('critical')}
                                >
                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm border transition-all ${groupedData.some(g => g.totalReal > g.totalBudget && g.assets.some(a => a.hasActiveOT))
                                        ? 'bg-pf-red-50 text-pf-red border-pf-red-100 group-hover/alert:scale-110 shadow-pf-red/10'
                                        : 'bg-pf-neutral-50 text-pf-neutral-300 border-pf-neutral-100'
                                        }`}>
                                        <AlertCircle size={18} className={groupedData.some(g => g.totalReal > g.totalBudget && g.assets.some(a => a.hasActiveOT)) ? 'animate-pulse' : ''} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-2xl font-black text-pf-neutral-800 line-clamp-1 tracking-tighter leading-none">
                                            {groupedData.filter(g => g.totalReal > g.totalBudget && g.assets.some(a => a.hasActiveOT)).length}
                                        </h4>
                                        <p className="text-[9px] font-black text-pf-neutral-400 uppercase tracking-widest leading-none mt-1.5">Críticos</p>
                                    </div>
                                </div>

                                <div
                                    className="flex items-center gap-3 cursor-pointer hover:bg-pf-neutral-50 p-2 rounded-2xl transition-all active:scale-95 group/alert"
                                    onClick={() => onToggleFilter?.('exceeded')}
                                >
                                    <div className="w-11 h-11 rounded-2xl bg-pf-red-50/50 flex items-center justify-center text-pf-red shadow-sm border border-pf-red-100/50 group-hover/alert:scale-110 transition-all">
                                        <AlertCircle size={22} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-3xl font-black text-pf-neutral-800 tracking-tighter leading-none">
                                            {groupedData.filter(g => g.totalReal > g.totalBudget && g.totalBudget > 0).length}
                                        </h4>
                                        <p className="text-[10px] font-black text-pf-neutral-400 uppercase tracking-widest leading-none mt-1.5">Excedidos</p>
                                    </div>
                                </div>

                                <div
                                    className="flex items-center gap-3 cursor-pointer hover:bg-pf-neutral-50 p-2 rounded-2xl transition-all active:scale-95 group/alert"
                                    onClick={() => onToggleFilter?.('internal')}
                                >
                                    <div className="w-11 h-11 rounded-2xl bg-pf-warning-50 flex items-center justify-center text-pf-warning-600 shadow-sm border border-pf-warning-100 group-hover/alert:scale-110 transition-all">
                                        <AlertCircle size={22} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-3xl font-black text-pf-neutral-800 tracking-tighter leading-none">
                                            {groupedData.filter(g => g.assets.some(a => a.details.some(d => d.real > d.budget && d.budget > 0))).length}
                                        </h4>
                                        <p className="text-[10px] font-black text-pf-neutral-400 uppercase tracking-widest leading-none mt-1.5">Desvíos</p>
                                    </div>
                                </div>

                                <div
                                    className="flex items-center gap-3 cursor-pointer hover:bg-pf-neutral-50 p-2 rounded-2xl transition-all active:scale-95 group/alert"
                                    onClick={() => onToggleFilter?.('date')}
                                >
                                    <div className="w-11 h-11 rounded-2xl bg-pf-blue-50 flex items-center justify-center text-pf-blue-600 shadow-sm border border-pf-blue-100 group-hover/alert:scale-110 transition-all">
                                        <AlertCircle size={22} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-3xl font-black text-pf-neutral-800 tracking-tighter leading-none">
                                            {groupedData.filter(g => g.assets.some(a => a.hasDateAlert)).length}
                                        </h4>
                                        <p className="text-[10px] font-black text-pf-neutral-400 uppercase tracking-widest leading-none mt-1.5">Fuera Mes</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-pf-neutral-100 flex items-center justify-between text-[9px] font-black text-pf-neutral-400 uppercase tracking-widest px-1">
                            <span>Total Analizado:</span>
                            <span className="text-pf-neutral-800 px-2.5 py-1 bg-pf-neutral-100 rounded-full shadow-sm">{groupedData.length} centros</span>
                        </div>
                    </div>
                </div>
            )}

            {/* SECCIÓN NUEVA: RESUMEN POR CATEGORÍA */}
            <div className="bg-pf-neutral-50 p-5 rounded-3xl border border-pf-neutral-200/60 shadow-inner relative">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-md text-pf-red border border-pf-neutral-100">
                            <Layers size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-pf-neutral-800 uppercase tracking-widest">Análisis por Clasificación</h2>
                            <p className="text-[12px] text-pf-neutral-400 font-black uppercase tracking-[0.2em] mt-0.5">Visión segmentada por tipo de activo</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}
                        className="p-2 hover:bg-white rounded-xl transition-all text-pf-neutral-400 flex items-center gap-2 group shadow-sm bg-white/50 border border-pf-neutral-100"
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                            {isCategoriesExpanded ? 'Comprimir' : 'Expandir'}
                        </span>
                        {isCategoriesExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                </div>

                {isCategoriesExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        {[...categorySummaries].sort((a, b) => b.totalBudget - a.totalBudget).map((cat) => (
                            <div key={cat.category} className="bg-white p-4 rounded-2xl border border-pf-neutral-100 shadow-sm hover:translate-y-[-2px] hover:shadow-lg transition-all duration-300">
                                <div className="flex items-center gap-2.5 mb-4">
                                    <div className="p-1.5 bg-pf-neutral-50 rounded-lg border border-pf-neutral-100 shadow-sm">
                                        {getCategoryIcon(cat.category)}
                                    </div>
                                    <span className="font-black text-pf-neutral-800 text-[12px] uppercase tracking-widest">{cat.category}</span>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-[10px] text-pf-neutral-400 font-black uppercase tracking-widest mb-1 px-0.5">
                                            <span>Presupuesto</span>
                                            <span>Real</span>
                                        </div>
                                        <div className="flex justify-between items-end">
                                            <span className="font-black text-pf-neutral-800 tracking-tighter">{formatCurrency(cat.totalBudget)}</span>
                                            <span className={`text-[12px] font-black ${cat.totalReal > cat.totalBudget ? 'text-pf-red' : 'text-pf-neutral-600'}`}>
                                                {formatCurrency(cat.totalReal)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-[10px] px-0.5">
                                            <span className="text-pf-neutral-400 font-black uppercase tracking-widest">Desv.</span>
                                            <span className={`font-black text-lg leading-none ${cat.totalReal > cat.totalBudget ? 'text-pf-red' : 'text-pf-success-500'}`}>
                                                {cat.deviation.toFixed(1)}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-pf-neutral-100 rounded-full h-2 overflow-hidden border border-pf-neutral-200/30">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${cat.totalReal > cat.totalBudget ? 'bg-pf-red shadow-[0_0_10px_rgba(239,68,68,0.4)]' : 'bg-pf-success-500 shadow-[0_0_10px_rgba(34,197,94,0.3)]'}`}
                                                style={{ width: `${Math.min((cat.totalReal / (cat.totalBudget || 1)) * 100, 100)}%`, minWidth: cat.totalReal > 0 ? '4px' : '0' }}
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-pf-neutral-100 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.2em] text-pf-neutral-400">
                                        <span>{cat.itemCount} activos</span>
                                        <span className="bg-pf-neutral-50 px-1.5 py-0.5 rounded-full border border-pf-neutral-200/50">{cat.category === 'Maquinaria' ? 'EQUIPOS' : 'FIJO'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
