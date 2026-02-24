import { useState, useMemo } from 'react';
import { getYearOptions } from '../../../shared/utils/dateUtils';
import { BudgetConfig } from '../components/BudgetConfig';
import { ExecutionMonitor } from '../components/ExecutionMonitor';
import { ExpenseBreakdown } from '../components/ExpenseBreakdown';
import { Settings, Activity, PieChart } from 'lucide-react';
import { usePlantasAcceso } from '../../../shared/hooks/usePlantasAcceso';

export const ControlGastosView = () => {
    const [activeTab, setActiveTab] = useState<'monitor' | 'config' | 'breakdown'>('monitor');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const { plantasIndividuales: plantas, plantaDefault } = usePlantasAcceso();
    const [selectedPlanta, setSelectedPlanta] = useState<string>(plantaDefault);
    const [selectedMonth, setSelectedMonth] = useState<number | undefined>(new Date().getMonth() + 1);
    const years = useMemo<number[]>(() => getYearOptions(2, 2), []);
    const months = [
        { val: undefined, label: 'Todo el año' },
        { val: 1, label: 'Enero' }, { val: 2, label: 'Febrero' }, { val: 3, label: 'Marzo' },
        { val: 4, label: 'Abril' }, { val: 5, label: 'Mayo' }, { val: 6, label: 'Junio' },
        { val: 7, label: 'Julio' }, { val: 8, label: 'Agosto' }, { val: 9, label: 'Septiembre' },
        { val: 10, label: 'Octubre' }, { val: 11, label: 'Noviembre' }, { val: 12, label: 'Diciembre' }
    ];

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

                    <div className="flex flex-col">
                        <label className="text-[10px] font-black text-slate-400 uppercase mb-1 px-1">Mes</label>
                        <select
                            value={activeTab === 'config' ? '' : (selectedMonth ?? '')}
                            disabled={activeTab === 'config'}
                            onChange={(e) => setSelectedMonth(e.target.value === '' ? undefined : Number(e.target.value))}
                            className={`px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm min-w-[140px] ${activeTab === 'config' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            {activeTab !== 'monitor' && <option value="">Todo el año</option>}
                            {months.filter(m => m.val !== undefined).map(m => (
                                <option key={m.val} value={m.val}>{m.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Pestañas de navegacion */}
            <div className="border-b border-slate-200">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    <button
                        onClick={() => {
                            setActiveTab('monitor');
                            if (selectedMonth === undefined) setSelectedMonth(new Date().getMonth() + 1);
                        }}
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
                        onClick={() => {
                            setActiveTab('config');
                            // Si veníamos de monitor y no teníamos mes seleccionado (aunque ahora siempre tiene),
                            // nos aseguramos que para presupuesto sea anual
                        }}
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
                {activeTab === 'monitor' && (
                    <ExecutionMonitor
                        selectedYear={selectedYear}
                        selectedPlanta={selectedPlanta}
                        selectedMonth={selectedMonth}
                    />
                )}
                {activeTab === 'config' && <BudgetConfig selectedYear={selectedYear} selectedPlanta={selectedPlanta} selectedMonth={undefined} />}
                {activeTab === 'breakdown' && <ExpenseBreakdown selectedYear={selectedYear} selectedPlanta={selectedPlanta} selectedMonth={selectedMonth} />}
            </div>
        </div>
    );
};
