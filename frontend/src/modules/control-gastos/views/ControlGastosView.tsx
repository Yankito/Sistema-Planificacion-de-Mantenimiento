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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] border border-pf-neutral-100 shadow-sm">
                <div>
                    <h1 className="text-3xl font-black text-pf-neutral-800 tracking-tight uppercase italic leading-none">Control de Gastos</h1>
                    <p className="text-[10px] font-black text-pf-neutral-400 uppercase tracking-[0.2em] mt-2 pl-0.5">Gestión y Visualización Presupuestaria</p>
                </div>
                <div className="flex items-center gap-4 bg-pf-neutral-50 p-2 rounded-2xl border border-pf-neutral-100 shadow-inner">
                    <div className="flex flex-col min-w-[140px]">
                        <label className="text-[9px] font-black text-pf-neutral-400 uppercase mb-1 px-1 tracking-widest">Planta</label>
                        <select
                            value={selectedPlanta}
                            onChange={(e) => setSelectedPlanta(e.target.value)}
                            className="px-4 py-2.5 bg-white border border-pf-neutral-200 rounded-xl text-xs font-black text-pf-neutral-700 outline-none focus:border-pf-red/30 transition-all shadow-sm"
                        >
                            {plantas.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                    </div>

                    <div className="flex flex-col min-w-[100px]">
                        <label className="text-[9px] font-black text-pf-neutral-400 uppercase mb-1 px-1 tracking-widest">Año</label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            className="px-4 py-2.5 bg-white border border-pf-neutral-200 rounded-xl text-xs font-black text-pf-neutral-700 outline-none focus:border-pf-red/30 transition-all shadow-sm"
                        >
                            {years.map((year: number) => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex flex-col min-w-[160px]">
                        <label className="text-[9px] font-black text-pf-neutral-400 uppercase mb-1 px-1 tracking-widest">Periodo</label>
                        <select
                            value={activeTab === 'config' ? '' : (selectedMonth ?? '')}
                            disabled={activeTab === 'config'}
                            onChange={(e) => setSelectedMonth(e.target.value === '' ? undefined : Number(e.target.value))}
                            className={`px-4 py-2.5 bg-white border border-pf-neutral-200 rounded-xl text-xs font-black text-pf-neutral-700 outline-none focus:border-pf-red/30 transition-all shadow-sm ${activeTab === 'config' ? 'opacity-40 cursor-not-allowed bg-pf-neutral-100' : ''}`}
                        >
                            {activeTab !== 'monitor' && <option value="">Anual</option>}
                            {months.filter(m => m.val !== undefined).map(m => (
                                <option key={m.val} value={m.val}>{m.label}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Pestañas de navegacion */}
            <div className="border-b border-pf-neutral-200">
                <nav className="-mb-px flex space-x-10" aria-label="Tabs">
                    <button
                        onClick={() => {
                            setActiveTab('monitor');
                            if (selectedMonth === undefined) setSelectedMonth(new Date().getMonth() + 1);
                        }}
                        className={`
                            whitespace-nowrap py-5 px-1 border-b-[3px] font-black text-[11px] uppercase tracking-widest flex items-center gap-2.5 transition-all
                            ${activeTab === 'monitor'
                                ? 'border-pf-red text-pf-neutral-900'
                                : 'border-transparent text-pf-neutral-400 hover:text-pf-neutral-700 hover:border-pf-neutral-200'}
                        `}
                    >
                        <Activity size={18} className={activeTab === 'monitor' ? 'text-pf-red shadow-sm' : ''} />
                        Monitoreo de Ejecución
                    </button>

                    <button
                        onClick={() => setActiveTab('breakdown')}
                        className={`
                            whitespace-nowrap py-5 px-1 border-b-[3px] font-black text-[11px] uppercase tracking-widest flex items-center gap-2.5 transition-all
                            ${activeTab === 'breakdown'
                                ? 'border-pf-red text-pf-neutral-900'
                                : 'border-transparent text-pf-neutral-400 hover:text-pf-neutral-700 hover:border-pf-neutral-200'}
                        `}
                    >
                        <PieChart size={18} className={activeTab === 'breakdown' ? 'text-pf-red shadow-sm' : ''} />
                        Desglose y Análisis
                    </button>

                    <button
                        onClick={() => setActiveTab('config')}
                        className={`
                            whitespace-nowrap py-5 px-1 border-b-[3px] font-black text-[11px] uppercase tracking-widest flex items-center gap-2.5 transition-all
                            ${activeTab === 'config'
                                ? 'border-pf-red text-pf-neutral-900'
                                : 'border-transparent text-pf-neutral-400 hover:text-pf-neutral-700 hover:border-pf-neutral-200'}
                        `}
                    >
                        <Settings size={18} className={activeTab === 'config' ? 'text-pf-red shadow-sm' : ''} />
                        Parámetros Presupuestarios
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
