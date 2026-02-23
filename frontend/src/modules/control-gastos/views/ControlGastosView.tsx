import { useState, useMemo } from 'react';
import { getYearOptions } from '../../../shared/utils/dateUtils';
import { BudgetConfig } from '../components/BudgetConfig';
import { ExecutionMonitor } from '../components/ExecutionMonitor';
import { ExpenseBreakdown } from '../components/ExpenseBreakdown';
import { Settings, Activity, PieChart } from 'lucide-react';

export const ControlGastosView = () => {
    const [activeTab, setActiveTab] = useState<'monitor' | 'config' | 'breakdown'>('monitor');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedPlanta, setSelectedPlanta] = useState<string>('PF1');

    const plantas = ["PF1", "PF2", "PF3", "PF4", "PF5", "PF6", "MPS", "CDT", "DC", "VENTAS", "OTROS"];
    const years = useMemo<number[]>(() => getYearOptions(2, 2), []);

    return (
        <div className="space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Control de Gastos</h1>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-1 px-1">Planta</label>
                        <select
                            value={selectedPlanta}
                            onChange={(e) => setSelectedPlanta(e.target.value)}
                            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        >
                            {plantas.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col">
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-1 px-1">Año</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                        >
                            {years.map((year: number) => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab('monitor')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                            ${activeTab === 'monitor'
                                ? 'border-pf-red text-pf-red'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                        `}
                    >
                        <Activity size={18} />
                        Monitoreo de Ejecución
                    </button>

                    <button
                        onClick={() => setActiveTab('breakdown')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                            ${activeTab === 'breakdown'
                                ? 'border-pf-red text-pf-red'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                        `}
                    >
                        <PieChart size={18} />
                        Desglose y Análisis
                    </button>

                    <button
                        onClick={() => setActiveTab('config')}
                        className={`
                            whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors
                            ${activeTab === 'config'
                                ? 'border-pf-red text-pf-red'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'}
                        `}
                    >
                        <Settings size={18} />
                        Configuración Presupuestaria
                    </button>
                </nav>
            </div>

            {/* Content Area */}
            <div className="min-h-[500px]">
                {activeTab === 'monitor' && <ExecutionMonitor selectedYear={selectedYear} selectedPlanta={selectedPlanta} />}
                {activeTab === 'config' && <BudgetConfig selectedYear={selectedYear} selectedPlanta={selectedPlanta} />}
                {activeTab === 'breakdown' && <ExpenseBreakdown selectedYear={selectedYear} selectedPlanta={selectedPlanta} />}
            </div>
        </div>
    );
};
