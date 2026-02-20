import React from 'react';
import { TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import type { CostCenterGroup } from './types';

interface KPICardsProps {
    totalPresupuesto: number;
    totalGasto: number;
    totalAvance: number;
    paginatedDataCount: number;
    groupedData: CostCenterGroup[];
    monthName: string;
    formatCurrency: (val: number) => string;
}

export const KPICards: React.FC<KPICardsProps> = ({
    totalPresupuesto,
    totalGasto,
    totalAvance,
    paginatedDataCount,
    groupedData,
    monthName,
    formatCurrency
}) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <TrendingUp size={80} className="text-blue-500" />
                </div>
                <div>
                    <p className="text-slate-500 text-sm font-medium">Presupuesto Total ({monthName})</p>
                    <h3 className="text-3xl font-extrabold text-slate-800 mt-2">{formatCurrency(totalPresupuesto)}</h3>
                </div>
                <div className="mt-4 flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded">
                    <CheckCircle2 size={12} className="mr-1" />
                    Meta definida ({paginatedDataCount} centros en vista)
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <AlertCircle size={80} className={totalGasto > totalPresupuesto ? "text-red-500" : "text-emerald-500"} />
                </div>
                <div>
                    <p className="text-slate-500 text-sm font-medium">Ejecución Real</p>
                    <h3 className={`text-3xl font-extrabold mt-2 ${totalGasto > totalPresupuesto ? 'text-pf-red' : 'text-emerald-600'}`}>
                        {formatCurrency(totalGasto)}
                    </h3>
                </div>
                <div className="mt-4 w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                        className={`h-full rounded-full ${totalGasto > totalPresupuesto ? 'bg-pf-red' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min((totalGasto / (totalPresupuesto || 1)) * 100, 100)}%` }}
                    ></div>
                </div>
                <div className="mt-2 flex justify-between items-center">
                    <p className="text-xs text-slate-400">{totalAvance.toFixed(1)}% utilizado</p>
                    <p className={`text-xs font-bold ${totalGasto > totalPresupuesto ? 'text-red-600' : 'text-slate-400'}`}>
                        Desviación: {totalPresupuesto > 0 ? ((totalGasto - totalPresupuesto) / totalPresupuesto * 100).toFixed(1) : 0}%
                    </p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
                <div>
                    <p className="text-slate-500 text-sm font-medium">Centros con Sobrepresupuesto</p>
                    <h3 className="text-3xl font-extrabold text-slate-800 mt-2">
                        {groupedData.filter(g => g.totalReal > g.totalBudget && g.totalBudget > 0).length}
                    </h3>
                </div>
                <div className="mt-4">
                    <p className="text-xs text-slate-500">De un total de {groupedData.length} centros identificados.</p>
                </div>
            </div>
        </div>
    );
};
