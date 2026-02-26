import React from 'react';
import { AlertCircle, Search, Upload } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface MonitorFiltersProps {
    filterExceededOnly: boolean;
    onToggleExceededOnly: () => void;
    filterInternalDeviation: boolean;
    onToggleInternalDeviation: () => void;
    filterDateAlert: boolean;
    onToggleDateAlert: () => void;
    filterCriticalOnly: boolean;
    onToggleCriticalOnly: () => void;
    searchTerm: string;
    onSearchChange: (search: string) => void;
    selectedCategory: string;
    onCategoryChange: (category: string) => void;
}

export const MonitorFilters: React.FC<MonitorFiltersProps> = ({
    filterExceededOnly,
    onToggleExceededOnly,
    filterInternalDeviation,
    onToggleInternalDeviation,
    filterDateAlert,
    onToggleDateAlert,
    filterCriticalOnly,
    onToggleCriticalOnly,
    searchTerm,
    onSearchChange,
    selectedCategory,
    onCategoryChange
}) => {
    return (
        <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-[1.5rem] border border-pf-neutral-100 shadow-sm">
            {/* Category Select */}
            <div className="relative group/select">
                <select
                    value={selectedCategory}
                    onChange={(e) => onCategoryChange(e.target.value)}
                    className="pl-3 pr-8 py-2 bg-pf-neutral-50 border border-pf-neutral-200 rounded-xl text-[10px] font-black text-pf-neutral-800 outline-none focus:border-pf-neutral-900 transition-all shadow-sm min-w-[150px] uppercase tracking-widest cursor-pointer appearance-none"
                >
                    <option value="Todos">Clasificación: Todas</option>
                    <option value="Maquinaria">Maquinaria</option>
                    <option value="Redes">Redes</option>
                    <option value="Infra">Infraestructura</option>
                    <option value="Otros">Otros</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-pf-neutral-400">
                    <Upload size={10} className="rotate-180" />
                </div>
            </div>

            <div className="h-6 w-px bg-pf-neutral-100 mx-1 hidden md:block"></div>

            {/* Alert Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
                <Tooltip content="CRÍTICO: Excedidos con OTs LIBERADAS">
                    <button
                        onClick={onToggleCriticalOnly}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black transition-all border uppercase tracking-widest active:scale-95 ${filterCriticalOnly
                            ? 'bg-pf-red text-white border-pf-red shadow-md ring-2 ring-pf-red/10'
                            : 'bg-white text-pf-red border-pf-red/20 hover:bg-pf-red/5'
                            }`}
                    >
                        <AlertCircle size={11} className={filterCriticalOnly ? 'animate-pulse' : ''} />
                        Críticos
                    </button>
                </Tooltip>

                <Tooltip content="Presupuesto total excedido">
                    <button
                        onClick={onToggleExceededOnly}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black transition-all border uppercase tracking-widest active:scale-95 ${filterExceededOnly
                            ? 'bg-pf-red-600 text-white border-pf-red shadow-md'
                            : 'bg-white text-pf-neutral-500 border-pf-neutral-200 hover:bg-pf-neutral-50'
                            }`}
                    >
                        <AlertCircle size={11} />
                        Excedido
                    </button>
                </Tooltip>

                <Tooltip content="Mala clasificación interna">
                    <button
                        onClick={onToggleInternalDeviation}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black transition-all border uppercase tracking-widest active:scale-95 ${filterInternalDeviation
                            ? 'bg-pf-warning-500 text-white border-pf-warning-600 shadow-md'
                            : 'bg-white text-pf-neutral-500 border-pf-neutral-200 hover:bg-pf-neutral-50'
                            }`}
                    >
                        <AlertCircle size={11} />
                        Desvíos
                    </button>
                </Tooltip>

                <Tooltip content="Transacciones fuera del periodo">
                    <button
                        onClick={onToggleDateAlert}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black transition-all border uppercase tracking-widest active:scale-95 ${filterDateAlert
                            ? 'bg-pf-blue-600 text-white border-pf-blue-700 shadow-md'
                            : 'bg-white text-pf-neutral-500 border-pf-neutral-200 hover:bg-pf-neutral-50'
                            }`}
                    >
                        <AlertCircle size={11} />
                        Fuera Mes
                    </button>
                </Tooltip>
            </div>

            <div className="h-6 w-px bg-pf-neutral-100 mx-1 hidden lg:block"></div>

            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px] group">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pf-neutral-300 group-focus-within:text-pf-red transition-colors" size={14} />
                <input
                    type="text"
                    placeholder="BUSCAR CENTRO DE COSTO O ACTIVO..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-9 pr-3 py-2 w-full bg-pf-neutral-50/50 border border-pf-neutral-200 rounded-xl text-[10px] font-black text-pf-neutral-800 outline-none focus:border-pf-red focus:bg-white transition-all shadow-inner placeholder:text-pf-neutral-300 placeholder:text-[9px] placeholder:tracking-[0.1em]"
                />
            </div>
        </div>
    );
};
