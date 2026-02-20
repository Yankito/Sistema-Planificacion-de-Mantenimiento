import React from 'react';
import { AlertCircle, Search, Upload } from 'lucide-react';

interface MonitorFiltersProps {
    currentMonth: number;
    months: { id: number; name: string }[];
    onMonthChange: (month: number) => void;
    filterExceededOnly: boolean;
    onToggleExceededOnly: () => void;
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
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <select
                        value={currentMonth}
                        onChange={(e) => onMonthChange(Number(e.target.value))}
                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    >
                        {months.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={onToggleExceededOnly}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${filterExceededOnly
                            ? 'bg-red-100 text-red-700 border border-red-200'
                            : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                            }`}
                    >
                        <AlertCircle size={16} />
                        {filterExceededOnly ? 'Mostrando Excedidos' : 'Filtrar por Excedidos'}
                    </button>
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
