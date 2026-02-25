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
    itemsPerPage: number;
    onItemsPerPageChange: (items: number) => void;
    searchTerm: string;
    onSearchChange: (search: string) => void;
    isUploading: boolean;
    onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
    itemsPerPage,
    onItemsPerPageChange,
    searchTerm,
    onSearchChange,
    isUploading,
    onFileUpload,
    selectedCategory,
    onCategoryChange
}) => {
    return (
        <div className="space-y-4">
            {/* Header & Controls */}
            {/* Header & Controls */}
            <div className="flex flex-wrap justify-between items-center gap-6 mb-4 bg-white p-6 rounded-[2rem] border border-pf-neutral-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)]">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative group/select">
                        <select
                            value={selectedCategory}
                            onChange={(e) => onCategoryChange(e.target.value)}
                            className="pl-5 pr-10 py-3.5 bg-pf-neutral-50 border border-pf-neutral-200 rounded-[1.25rem] text-[11px] font-black text-pf-neutral-800 outline-none focus:border-pf-neutral-900 focus:ring-4 focus:ring-pf-neutral-900/5 transition-all shadow-sm min-w-[200px] uppercase tracking-widest cursor-pointer appearance-none"
                        >
                            <option value="Todos">Todas las Clasificaciones</option>
                            <option value="Maquinaria">Maquinaria</option>
                            <option value="Redes">Redes</option>
                            <option value="Infra">Infraestructura</option>
                            <option value="Otros">Otros</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-pf-neutral-400 group-focus-within/select:text-pf-neutral-900">
                            <Upload size={14} className="rotate-180" />
                        </div>
                    </div>

                    <div className="h-10 w-px bg-pf-neutral-100 mx-1 hidden lg:block"></div>

                    <div className="flex flex-wrap gap-2.5">
                        <Tooltip content="CRÍTICO: Ver solo excedidos con OTs aún LIBERADAS">
                            <button
                                onClick={onToggleCriticalOnly}
                                className={`flex items-center gap-2.5 px-4 py-3 rounded-[1.25rem] text-[10px] font-black transition-all border uppercase tracking-widest shadow-sm active:scale-95 ${filterCriticalOnly
                                    ? 'bg-pf-red text-white border-pf-red shadow-lg shadow-pf-red/20 ring-4 ring-pf-red/10'
                                    : 'bg-white text-pf-red border-pf-red/20 hover:bg-pf-red/5'
                                    }`}
                            >
                                <AlertCircle size={14} className={filterCriticalOnly ? 'animate-pulse' : ''} />
                                Críticos (OT Act)
                            </button>
                        </Tooltip>

                        <Tooltip content="Ver solo grupos con presupuesto total excedido">
                            <button
                                onClick={onToggleExceededOnly}
                                className={`flex items-center gap-2.5 px-4 py-3 rounded-[1.25rem] text-[10px] font-black transition-all border uppercase tracking-widest shadow-sm active:scale-95 ${filterExceededOnly
                                    ? 'bg-pf-red-600 text-white border-pf-red shadow-lg shadow-pf-red/20'
                                    : 'bg-white text-pf-neutral-500 border-pf-neutral-200 hover:bg-pf-neutral-50'
                                    }`}
                            >
                                <AlertCircle size={14} className={filterExceededOnly ? 'animate-pulse' : ''} />
                                Excedido
                            </button>
                        </Tooltip>

                        <Tooltip content="Ver grupos con mala clasificación interna (ej: exceso en bodega pero no en total)">
                            <button
                                onClick={onToggleInternalDeviation}
                                className={`flex items-center gap-2.5 px-4 py-3 rounded-[1.25rem] text-[10px] font-black transition-all border uppercase tracking-widest shadow-sm active:scale-95 ${filterInternalDeviation
                                    ? 'bg-pf-warning-500 text-white border-pf-warning-600 shadow-lg shadow-pf-warning-200'
                                    : 'bg-white text-pf-neutral-500 border-pf-neutral-200 hover:bg-pf-neutral-50'
                                    }`}
                            >
                                <AlertCircle size={14} />
                                Desv. Interna
                            </button>
                        </Tooltip>

                        <Tooltip content="Ver grupos con transacciones fuera del periodo programado">
                            <button
                                onClick={onToggleDateAlert}
                                className={`flex items-center gap-2.5 px-4 py-3 rounded-[1.25rem] text-[10px] font-black transition-all border uppercase tracking-widest shadow-sm active:scale-95 ${filterDateAlert
                                    ? 'bg-pf-blue-600 text-white border-pf-blue-700 shadow-lg shadow-pf-blue-200'
                                    : 'bg-white text-pf-neutral-500 border-pf-neutral-200 hover:bg-pf-neutral-50'
                                    }`}
                            >
                                <AlertCircle size={14} />
                                Fuera Mes
                            </button>
                        </Tooltip>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-center gap-6 bg-pf-neutral-50/50 p-6 rounded-[2.5rem] border border-pf-neutral-100 shadow-inner">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 text-pf-neutral-300 group-focus-within:text-pf-red transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="BUSCAR POR CENTRO DE COSTO O CÓDIGO DE ACTIVO..."
                        value={searchTerm}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-14 pr-6 py-4 w-full bg-white border border-pf-neutral-200 rounded-[1.5rem] text-sm font-black text-pf-neutral-800 outline-none focus:border-pf-red focus:ring-4 focus:ring-pf-red/5 transition-all shadow-sm placeholder:text-pf-neutral-300 placeholder:text-[10px] placeholder:tracking-[0.25em]"
                    />
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="flex items-center gap-4 bg-white px-5 py-3.5 rounded-[1.5rem] border border-pf-neutral-200 shadow-sm flex-1 lg:flex-none">
                        <span className="text-[10px] font-black text-pf-neutral-400 uppercase tracking-widest">Filas:</span>
                        <select
                            value={itemsPerPage}
                            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                            className="bg-transparent text-[11px] font-black text-pf-neutral-900 outline-none cursor-pointer appearance-none px-2 text-center"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>

                    <input
                        type="file"
                        id="gastos-upload-monitor"
                        style={{ display: 'none' }}
                        onChange={onFileUpload}
                        accept=".xlsx,.xls"
                    />
                    <label
                        htmlFor="gastos-upload-monitor"
                        className={`flex items-center justify-center gap-3 px-8 py-4 bg-pf-neutral-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-black hover:scale-[1.02] cursor-pointer transition-all shadow-xl shadow-pf-neutral-900/10 active:scale-95 flex-1 lg:flex-none ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        {isUploading ? <Upload size={18} className="animate-bounce" /> : <Upload size={18} />}
                        {isUploading ? 'Procesando...' : 'Cargar Ejecución'}
                    </label>
                </div>
            </div>
        </div>
    );
};
