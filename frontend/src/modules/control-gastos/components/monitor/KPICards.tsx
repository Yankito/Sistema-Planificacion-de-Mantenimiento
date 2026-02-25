
import { TrendingUp, AlertCircle, Box, Share2, Layers } from 'lucide-react';
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
    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'Maquinaria': return <Box size={16} className="text-pf-blue-500" />;
            case 'Redes': return <Share2 size={16} className="text-pf-success-500" />;
            case 'Infra': return <Layers size={16} className="text-pf-blue-500" />;
            default: return <Box size={16} className="text-pf-neutral-500" />;
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* TARJETA 1: PRESUPUESTO Y PLAN VS REAL */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-pf-neutral-100 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp size={80} className="text-pf-blue-500" />
                    </div>
                    <div>
                        <p className="text-pf-neutral-500 text-[10px] font-black uppercase tracking-widest pl-0.5">Presupuesto Gral. ({monthName})</p>
                        <h3 className="text-3xl font-black text-pf-neutral-800 mt-2 tracking-tighter">{formatCurrency(totalPresupuesto)}</h3>

                        <div className="mt-6 space-y-4">
                            {/* Desglose de Plan */}
                            <div className="p-4 bg-pf-neutral-50 rounded-2xl border border-pf-neutral-100 shadow-inner">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] font-black text-pf-neutral-400 uppercase tracking-[0.15em]">Plan (Bodega + Serv)</span>
                                    <span className={`text-xs font-black ${totalPlanReal > totalPlanBudget ? 'text-pf-red' : 'text-pf-neutral-600'}`}>
                                        {totalPlanBudget > 0 ? ((totalPlanReal / totalPlanBudget) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-[15px] font-black text-pf-neutral-800 tracking-tight">{formatCurrency(totalPlanBudget)}</span>
                                    <div className="text-[9px] font-black text-pf-neutral-400 uppercase">Real: {formatCurrency(totalPlanReal)}</div>
                                </div>
                                <div className="w-full bg-pf-neutral-200/50 rounded-full h-1.5 mt-3 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${totalPlanReal > totalPlanBudget ? 'bg-pf-red shadow-sm' : 'bg-pf-blue-500 shadow-sm'}`}
                                        style={{ width: `${Math.min((totalPlanReal / (totalPlanBudget || 1)) * 100, 100)}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Desglose de Correctivo */}
                            <div className="p-4 bg-pf-warning-50/50 rounded-2xl border border-pf-warning-100/50">
                                <div className="flex justify-between items-center mb-1">
                                    <span className="text-[9px] font-black text-pf-warning-600/80 uppercase tracking-[0.15em]">Manto. Correctivo</span>
                                    <span className={`text-xs font-black ${totalCorrectivoReal > totalCorrectivoBudget ? 'text-pf-red' : 'text-pf-warning-600'}`}>
                                        {totalCorrectivoBudget > 0 ? ((totalCorrectivoReal / totalCorrectivoBudget) * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                                <div className="flex justify-between items-baseline">
                                    <span className="text-[15px] font-black text-pf-warning-700 tracking-tight">{formatCurrency(totalCorrectivoBudget)}</span>
                                    <div className="text-[9px] font-black text-pf-warning-600/60 uppercase">Real: {formatCurrency(totalCorrectivoReal)}</div>
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
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-pf-neutral-100 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <AlertCircle size={80} className={totalGasto > totalPresupuesto ? "text-pf-red" : "text-pf-success-500"} />
                    </div>
                    <div>
                        <p className="text-pf-neutral-500 text-[10px] font-black uppercase tracking-widest pl-0.5">Ejecución Real Consolidada</p>
                        <h3 className={`text-3xl font-black mt-2 tracking-tighter ${totalGasto > totalPresupuesto ? 'text-pf-red' : 'text-pf-success-600'}`}>
                            {formatCurrency(totalGasto)}
                        </h3>

                        <div className="mt-6">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-[10px] text-pf-neutral-400 font-black uppercase tracking-widest">Consumo de Meta Mensual</span>
                                <span className={`text-lg font-black ${totalGasto > totalPresupuesto ? 'text-pf-red' : 'text-pf-success-600'}`}>
                                    {totalAvance.toFixed(1)}%
                                </span>
                            </div>
                            <div className="w-full bg-pf-neutral-100 rounded-full h-3 overflow-hidden border border-pf-neutral-200/50 p-0.5">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ${totalGasto > totalPresupuesto ? 'bg-pf-red shadow-sm' : 'bg-pf-success-500 shadow-sm'}`}
                                    style={{ width: `${Math.min((totalGasto / (totalPresupuesto || 1)) * 100, 100)}%` }}
                                ></div>
                            </div>
                            <div className="mt-4 flex flex-col gap-1.5 p-4 bg-pf-neutral-50 rounded-[1.25rem] border border-pf-neutral-100 shadow-inner">
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-pf-neutral-400">Desviación Global</span>
                                    <span className={totalGasto > totalPresupuesto ? 'text-pf-red decoration-2' : 'text-pf-success-600'}>
                                        {totalPresupuesto > 0 ? ((totalGasto - totalPresupuesto) / totalPresupuesto * 100).toFixed(1) : 0}%
                                    </span>
                                </div>
                                <div className="flex justify-between text-[9px] font-bold text-pf-neutral-400 uppercase tracking-tight">
                                    <span>Vs Pto. Estimado</span>
                                    <span>{formatCurrency(Math.abs(totalPresupuesto - totalGasto))} {totalGasto > totalPresupuesto ? 'Exceso' : 'Ahorro'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* TARJETA 3: ALERTAS DE EJECUCIÓN */}
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-pf-neutral-100 flex flex-col justify-between relative">
                    <div>
                        <p className="text-pf-neutral-500 text-[10px] font-black uppercase tracking-widest pl-0.5">Alertas de Ejecución</p>
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            <div
                                className="flex items-center gap-3 cursor-pointer hover:bg-pf-neutral-50 p-2 rounded-2xl transition-all active:scale-95 group/alert"
                                onClick={() => onToggleFilter?.('critical')}
                            >
                                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm border transition-all ${groupedData.some(g => g.totalReal > g.totalBudget && g.assets.some(a => a.hasActiveOT))
                                    ? 'bg-pf-red-50 text-pf-red border-pf-red-100 group-hover/alert:scale-110 shadow-pf-red/10'
                                    : 'bg-pf-neutral-50 text-pf-neutral-300 border-pf-neutral-100'
                                    }`}>
                                    <AlertCircle size={22} className={groupedData.some(g => g.totalReal > g.totalBudget && g.assets.some(a => a.hasActiveOT)) ? 'animate-pulse' : ''} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-2xl font-black text-pf-neutral-800 line-clamp-1 tracking-tighter leading-none">
                                        {groupedData.filter(g => g.totalReal > g.totalBudget && g.assets.some(a => a.hasActiveOT)).length}
                                    </h4>
                                    <p className="text-[8px] font-black text-pf-neutral-400 uppercase tracking-widest leading-none mt-1">Críticos</p>
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
                                    <h4 className="text-2xl font-black text-pf-neutral-800 tracking-tighter leading-none">
                                        {groupedData.filter(g => g.totalReal > g.totalBudget && g.totalBudget > 0).length}
                                    </h4>
                                    <p className="text-[8px] font-black text-pf-neutral-400 uppercase tracking-widest leading-none mt-1">Excedidos</p>
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
                                    <h4 className="text-2xl font-black text-pf-neutral-800 tracking-tighter leading-none">
                                        {groupedData.filter(g => g.assets.some(a => a.details.some(d => d.real > d.budget && d.budget > 0))).length}
                                    </h4>
                                    <p className="text-[8px] font-black text-pf-neutral-400 uppercase tracking-widest leading-none mt-1">Desvíos</p>
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
                                    <h4 className="text-2xl font-black text-pf-neutral-800 tracking-tighter leading-none">
                                        {groupedData.filter(g => g.assets.some(a => a.hasDateAlert)).length}
                                    </h4>
                                    <p className="text-[8px] font-black text-pf-neutral-400 uppercase tracking-widest leading-none mt-1">Fuera Mes</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 pt-5 border-t border-pf-neutral-100 flex items-center justify-between text-[9px] font-black text-pf-neutral-400 uppercase tracking-widest px-1">
                        <span>Total Analizado:</span>
                        <span className="text-pf-neutral-800 px-3 py-1 bg-pf-neutral-100 rounded-full shadow-sm">{groupedData.length} centros</span>
                    </div>
                </div>
            </div>

            {/* SECCIÓN NUEVA: RESUMEN POR CATEGORÍA */}
            <div className="bg-pf-neutral-50 p-8 rounded-[2.5rem] border border-pf-neutral-200/60 shadow-inner">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-md text-pf-red border border-pf-neutral-100">
                        <Layers size={22} />
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-pf-neutral-800 uppercase tracking-widest">Análisis por Clasificación</h2>
                        <p className="text-[10px] text-pf-neutral-400 font-black uppercase tracking-[0.2em] mt-0.5">Visión segmentada de maquinaria e infraestructura</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {categorySummaries.sort((a, b) => b.totalBudget - a.totalBudget).map((cat) => (
                        <div key={cat.category} className="bg-white p-6 rounded-[1.75rem] border border-pf-neutral-100 shadow-sm hover:translate-y-[-4px] hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="p-2 bg-pf-neutral-50 rounded-xl border border-pf-neutral-100 shadow-sm">
                                    {getCategoryIcon(cat.category)}
                                </div>
                                <span className="font-black text-pf-neutral-800 text-xs uppercase tracking-widest">{cat.category}</span>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-[8px] text-pf-neutral-400 font-black uppercase tracking-widest mb-1.5 px-0.5">
                                        <span>Presupuesto</span>
                                        <span>Ejecución Real</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-sm font-black text-pf-neutral-800 tracking-tighter">{formatCurrency(cat.totalBudget)}</span>
                                        <span className={`text-xs font-black ${cat.totalReal > cat.totalBudget ? 'text-pf-red' : 'text-pf-neutral-600'}`}>
                                            {formatCurrency(cat.totalReal)}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-[9px] px-0.5">
                                        <span className="text-pf-neutral-400 font-black uppercase tracking-widest">Desviación</span>
                                        <span className={`font-black text-lg leading-none ${cat.totalReal > cat.totalBudget ? 'text-pf-red' : 'text-pf-success-500'}`}>
                                            {cat.deviation.toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-pf-neutral-100 rounded-full h-2 overflow-hidden border border-pf-neutral-200/50 p-0.5">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${cat.totalReal > cat.totalBudget ? 'bg-pf-red' : 'bg-pf-success-500'}`}
                                            style={{ width: `${Math.min((cat.totalReal / (cat.totalBudget || 1)) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-pf-neutral-100 flex justify-between items-center text-[8px] font-black uppercase tracking-[0.2em] text-pf-neutral-400">
                                    <span>{cat.itemCount} activos</span>
                                    <span className="bg-pf-neutral-50 px-2 py-0.5 rounded-full border border-pf-neutral-200/50">{cat.category === 'Maquinaria' ? 'Equipos' : 'Fijo'}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
