import React from 'react';
import { AlertCircle, Search, Upload } from 'lucide-react';
import { Tooltip } from './Tooltip';

interface MonitorFiltersProps {
    currentMonth: number;
    months: { id: number; name: string }[];
    onMonthChange: (month: number) => void;
    filterExceededOnly: boolean;
    onToggleExceededOnly: () => void;
    filterInternalDeviation: boolean;
    onToggleInternalDeviation: () => void;
    filterDateAlert: boolean;
    onToggleDateAlert: () => void;
    filterCriticalOnly: boolean;
    onToggleCriticalOnly: () => void;
    itemsPerPage: number;
    onItemsPerPageChange: (items: number) => void;
    searchTerm: string;
    onSearchChange: (search: string) => void;
    isUploading: boolean;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const MonitorFilters: React.FC<MonitorFiltersProps> = ({
    currentMonth,
    months,
    onMonthChange,
    filterExceededOnly,
    onToggleExceededOnly,
    filterInternalDeviation,
    onToggleInternalDeviation,
    filterDateAlert,
    onToggleDateAlert,
    filterCriticalOnly,
    onToggleCriticalOnly,
    itemsPerPage,
    onItemsPerPageChange,
    searchTerm,
    onSearchChange,
    isUploading,
    onFileUpload
}) => {
    return (
        <div className="space-y-4">
            {/* Header & Controls */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-2">
                <div className="flex flex-wrap items-center gap-3">
                    <select
                        value={currentMonth}
                        onChange={(e) => onMonthChange(Number(e.target.value))}
                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm min-w-[140px]"
                    >
                        {months.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>

                    <div className="h-6 w-px bg-slate-200 mx-1 hidden md:block"></div>

                    <Tooltip content="CRÍTICO: Ver solo excedidos con OTs aún LIBERADAS">
                        <button
                            onClick={onToggleCriticalOnly}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border uppercase tracking-wider ${filterCriticalOnly
                                ? 'bg-red-600 text-white border-red-700 shadow-md shadow-red-100 ring-2 ring-red-200'
                                : 'bg-white text-pf-red border-red-100 hover:bg-red-50'
                                }`}
                        >
                            <AlertCircle size={14} className={filterCriticalOnly ? 'animate-pulse' : ''} />
                            Críticos (OT Act)
                        </button>
                    </Tooltip>

                    <Tooltip content="Ver solo grupos con presupuesto total excedido">
                        <button
                            onClick={onToggleExceededOnly}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border uppercase tracking-wider ${filterExceededOnly
                                ? 'bg-pf-red text-white border-pf-red shadow-md shadow-red-100'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            <AlertCircle size={14} className={filterExceededOnly ? 'animate-pulse' : ''} />
                            Total Excedido
                        </button>
                    </Tooltip>

                    <Tooltip content="Ver grupos con mala clasificación interna (ej: exceso en bodega pero no en total)">
                        <button
                            onClick={onToggleInternalDeviation}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border uppercase tracking-wider ${filterInternalDeviation
                                ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-100'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            <AlertCircle size={14} />
                            Desv. Interna
                        </button>
                    </Tooltip>

                    <Tooltip content="Ver grupos con transacciones fuera del periodo programado">
                        <button
                            onClick={onToggleDateAlert}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all border uppercase tracking-wider ${filterDateAlert
                                ? 'bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-100'
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                }`}
                        >
                            <AlertCircle size={14} />
                            Mes Dif.
                        </button>
                    </Tooltip>
                </div>

                <div className="flex items-center gap-3">
                    <span className="text-sm text-slate-500 font-medium">Items por hoja:</span>
                    <select
                        value={itemsPerPage}
                        onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <div className="relative w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar Centro Costo o Activo..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="file"
                        id="gastos-upload-monitor"
                        style={{ display: 'none' }}
                        onChange={onFileUpload}
                        accept=".xlsx,.xls"
                    />
                    <label
                        htmlFor="gastos-upload-monitor"
                        className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 cursor-pointer transition-colors shadow-sm ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        <Upload size={16} />
                        {isUploading ? 'Cargando...' : 'Cargar Ejecución'}
                    </label>
                </div>
            </div>
        </div>
    );
};
