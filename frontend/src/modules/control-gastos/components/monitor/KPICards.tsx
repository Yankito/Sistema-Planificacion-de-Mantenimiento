import { TrendingUp, AlertCircle } from 'lucide-react';
import type { CostCenterGroup } from './types';

interface KPICardsProps {
    totalPresupuesto: number;
    totalGasto: number;
    totalAvance: number;
    totalPlanBudget: number;
    totalPlanReal: number;
    totalCorrectivoBudget: number;
    totalCorrectivoReal: number;
    groupedData: CostCenterGroup[];
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
    monthName,
    formatCurrency,
    onToggleFilter
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CARD 1: PRESUPUESTO Y PLAN VS REAL */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <TrendingUp size={80} className="text-blue-500" />
                </div>
                <div>
                    <p className="text-slate-500 text-sm font-medium">Presupuesto Gral. ({monthName})</p>
                    <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{formatCurrency(totalPresupuesto)}</h3>

                    <div className="mt-4 space-y-3">
                        {/* Plan Breakdown */}
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plan (Bodega + Serv)</span>
                                <span className={`text-xs font-bold ${totalPlanReal > totalPlanBudget ? 'text-pf-red' : 'text-slate-600'}`}>
                                    {totalPlanBudget > 0 ? ((totalPlanReal / totalPlanBudget) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm font-black text-slate-700">{formatCurrency(totalPlanBudget)}</span>
                                <div className="text-[10px] text-slate-400">Real: {formatCurrency(totalPlanReal)}</div>
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1 mt-2 overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${totalPlanReal > totalPlanBudget ? 'bg-pf-red/60' : 'bg-blue-500/60'}`}
                                    style={{ width: `${Math.min((totalPlanReal / (totalPlanBudget || 1)) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        {/* Correctivo Breakdown */}
                        <div className="p-3 bg-amber-50/30 rounded-xl border border-amber-100/50">
                            <div className="flex justify-between items-center mb-1">
                                <span className="text-[10px] font-bold text-amber-600/70 uppercase tracking-wider">Manto. Correctivo</span>
                                <span className={`text-xs font-bold ${totalCorrectivoReal > totalCorrectivoBudget ? 'text-pf-red' : 'text-amber-600'}`}>
                                    {totalCorrectivoBudget > 0 ? ((totalCorrectivoReal / totalCorrectivoBudget) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                            <div className="flex justify-between items-baseline">
                                <span className="text-sm font-black text-amber-700">{formatCurrency(totalCorrectivoBudget)}</span>
                                <div className="text-[10px] text-amber-600/60">Real: {formatCurrency(totalCorrectivoReal)}</div>
                            </div>
                            <div className="w-full bg-amber-200/50 rounded-full h-1 mt-2 overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${totalCorrectivoReal > totalCorrectivoBudget ? 'bg-pf-red/60' : 'bg-amber-400/60'}`}
                                    style={{ width: `${Math.min((totalCorrectivoReal / (totalCorrectivoBudget || 1)) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CARD 2: EJECUCIÓN REAL TOTAL */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <AlertCircle size={80} className={totalGasto > totalPresupuesto ? "text-red-500" : "text-emerald-500"} />
                </div>
                <div>
                    <p className="text-slate-500 text-sm font-medium">Ejecución Real Consolidada</p>
                    <h3 className={`text-3xl font-extrabold mt-2 ${totalGasto > totalPresupuesto ? 'text-pf-red' : 'text-emerald-600'}`}>
                        {formatCurrency(totalGasto)}
                    </h3>
                </div>

                <div className="mt-6">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-xs text-slate-400 font-bold uppercase tracking-tighter">Consumo de meta anual</span>
                        <span className={`text-lg font-black ${totalGasto > totalPresupuesto ? 'text-pf-red' : 'text-emerald-600'}`}>
                            {totalAvance.toFixed(1)}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ${totalGasto > totalPresupuesto ? 'bg-pf-red' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min((totalGasto / (totalPresupuesto || 1)) * 100, 100)}%` }}
                        ></div>
                    </div>
                    <div className="mt-4 flex flex-col gap-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                            <span>Desviación Global</span>
                            <span className={totalGasto > totalPresupuesto ? 'text-pf-red' : 'text-emerald-600'}>
                                {totalPresupuesto > 0 ? ((totalGasto - totalPresupuesto) / totalPresupuesto * 100).toFixed(1) : 0}%
                            </span>
                        </div>
                        <div className="flex justify-between text-[10px] font-medium text-slate-400">
                            <span>Vs Presupuesto Estimado</span>
                            <span>{formatCurrency(Math.abs(totalPresupuesto - totalGasto))} {totalGasto > totalPresupuesto ? 'Exceso' : 'Ahorro'}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* CARD 3: ALERTAS DE EJECUCIÓN */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between relative">
                <div>
                    <p className="text-slate-500 text-sm font-medium">Alertas de Ejecución</p>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div
                            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-colors group/alert"
                            onClick={() => onToggleFilter?.('critical')}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border transition-all ${groupedData.some(g => g.totalReal > g.totalBudget && g.assets.some(a => a.hasActiveOT))
                                ? 'bg-red-50 text-pf-red border-red-100 group-hover/alert:scale-110'
                                : 'bg-slate-50 text-slate-300 border-slate-100'
                                }`}>
                                <AlertCircle size={20} className={groupedData.some(g => g.totalReal > g.totalBudget && g.assets.some(a => a.hasActiveOT)) ? 'animate-pulse' : ''} />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-slate-800 line-clamp-1">
                                    {groupedData.filter(g => g.totalReal > g.totalBudget && g.assets.some(a => a.hasActiveOT)).length}
                                </h4>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider line-clamp-1">Críticos (OT Act)</p>
                            </div>
                        </div>

                        <div
                            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-colors group/alert"
                            onClick={() => onToggleFilter?.('exceeded')}
                        >
                            <div className="w-10 h-10 rounded-xl bg-red-50/50 flex items-center justify-center text-pf-red/70 shadow-sm border border-red-100/50 group-hover/alert:scale-110 transition-transform">
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-slate-800">
                                    {groupedData.filter(g => g.totalReal > g.totalBudget && g.totalBudget > 0).length}
                                </h4>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider line-clamp-1">Centros Exc.</p>
                            </div>
                        </div>

                        <div
                            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-colors group/alert"
                            onClick={() => onToggleFilter?.('internal')}
                        >
                            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm border border-amber-100 group-hover/alert:scale-110 transition-transform">
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-slate-800">
                                    {groupedData.filter(g => g.assets.some(a => a.details.some(d => d.real > d.budget && d.budget > 0))).length}
                                </h4>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider line-clamp-1">Desv. Internas</p>
                            </div>
                        </div>

                        <div
                            className="flex items-center gap-3 cursor-pointer hover:bg-slate-50 p-1.5 rounded-xl transition-colors group/alert"
                            onClick={() => onToggleFilter?.('date')}
                        >
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100 group-hover/alert:scale-110 transition-transform">
                                <AlertCircle size={20} />
                            </div>
                            <div>
                                <h4 className="text-xl font-black text-slate-800">
                                    {groupedData.filter(g => g.assets.some(a => a.hasDateAlert)).length}
                                </h4>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider line-clamp-1">Meses Dif.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                    <span>Total Centros Analizados</span>
                    <span className="text-slate-600 px-2 py-0.5 bg-slate-100 rounded-full">{groupedData.length}</span>
                </div>
            </div>
        </div>
    );
};
