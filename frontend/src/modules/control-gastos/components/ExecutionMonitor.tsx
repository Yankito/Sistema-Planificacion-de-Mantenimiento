import { useState, useEffect, useRef, Fragment } from 'react';
import { ControlGastosService } from '../services/ControlGastosService';
import { AlertCircle, CheckCircle2, TrendingUp, Calendar, ChevronDown, ChevronRight, Search, Upload, Loader2, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft } from 'lucide-react';
import { useControlGastos } from '../hooks/useControlGastos';

interface ExecutionMonitorProps {
    selectedYear: number;
    selectedPlanta: string;
}

// Internal structures for grouping
interface AssetExecutionDetail {
    tipo: string;
    budget: number;
    real: number;
}

interface AssetExecutionGroup {
    activo: string;
    tipoFila: string;
    totalBudget: number;
    totalReal: number;
    details: AssetExecutionDetail[];
    hasDateAlert?: boolean;
    planta?: string;
    claseContable?: string;
    deviation: number;
}

interface CostCenterGroup {
    centroCosto: string;
    assets: AssetExecutionGroup[];
    totalBudget: number;
    totalReal: number;
    deviation: number;
}

type SortField = 'centroCosto' | 'totalBudget' | 'totalReal' | 'deviation';
type SortOrder = 'asc' | 'desc';

export const ExecutionMonitor = ({ selectedYear, selectedPlanta }: ExecutionMonitorProps) => {
    const [groupedData, setGroupedData] = useState<CostCenterGroup[]>([]);
    const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // Pagination & Sorting State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortField, setSortField] = useState<SortField>('centroCosto');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [filterExceededOnly, setFilterExceededOnly] = useState(false);

    const { getPresupuesto, getGastosConsolidados, loading } = useControlGastos();

    const months = [
        { id: 1, name: 'Enero' }, { id: 2, name: 'Febrero' }, { id: 3, name: 'Marzo' },
        { id: 4, name: 'Abril' }, { id: 5, name: 'Mayo' }, { id: 6, name: 'Junio' },
        { id: 7, name: 'Julio' }, { id: 8, name: 'Agosto' }, { id: 9, name: 'Septiembre' },
        { id: 10, name: 'Octubre' }, { id: 11, name: 'Noviembre' }, { id: 12, name: 'Diciembre' }
    ];

    useEffect(() => {
        loadData();
    }, [selectedYear, currentMonth, selectedPlanta]);

    const calculateDeviation = (real: number, budget: number) => {
        if (budget === 0) return real > 0 ? 100 : 0;
        return ((real - budget) / budget) * 100;
    };

    const loadData = async () => {
        try {
            const [budgetData, realExpenses] = await Promise.all([
                getPresupuesto(selectedYear, selectedPlanta),
                getGastosConsolidados(selectedYear, selectedPlanta)
            ]);

            const monthlyBudget = budgetData.filter(r => r.mes === currentMonth);
            const monthlyReal = realExpenses.filter(r => r.mes === currentMonth);

            const groups: Record<string, CostCenterGroup> = {};
            const consumedRealIndices = new Set<number>();

            // 1. Organizar presupuesto por Centro de Costo y Activo
            monthlyBudget.forEach(row => {
                const cc = row.centroCosto || 'Sin Centro Costo';
                const isHitoRow = row.tipoFila?.toLowerCase().includes('hito');

                if (!groups[cc]) {
                    groups[cc] = { centroCosto: cc, assets: [], totalBudget: 0, totalReal: 0, deviation: 0 };
                }

                const assetReal = monthlyReal.filter((g, idx) => {
                    const matches = g.nroActivo === row.activo &&
                        (isHitoRow ? g.esHito : !g.esHito) &&
                        !consumedRealIndices.has(idx);
                    if (matches) consumedRealIndices.add(idx);
                    return matches;
                });

                const realBodega = assetReal.filter(g => g.tipoGasto === 'BODEGA').reduce((acc, g) => acc + g.costoTrx, 0);
                const realServExt = assetReal.filter(g => g.tipoGasto === 'SERV_EXT').reduce((acc, g) => acc + g.costoTrx, 0);
                const realCorrectivo = assetReal.filter(g => g.tipoGasto === 'CORRECTIVO').reduce((acc, g) => acc + g.costoTrx, 0);

                const assetDetails: AssetExecutionDetail[] = [];
                if ((row.montoBodega || 0) !== 0 || realBodega !== 0)
                    assetDetails.push({ tipo: 'Bodega', budget: row.montoBodega || 0, real: realBodega });
                if ((row.montoServExt || 0) !== 0 || realServExt !== 0)
                    assetDetails.push({ tipo: 'Serv. Externos', budget: row.montoServExt || 0, real: realServExt });
                if ((row.montoCorrectivo || 0) !== 0 || realCorrectivo !== 0)
                    assetDetails.push({ tipo: 'Correctivo', budget: row.montoCorrectivo || 0, real: realCorrectivo });

                const hasDateAlert = assetReal.some(g => g.alertaFecha === 1);
                const rowBudget = (row.montoBodega || 0) + (row.montoServExt || 0) + (row.montoCorrectivo || 0);
                const rowReal = realBodega + realServExt + realCorrectivo;

                const firstReal = assetReal[0];

                groups[cc].assets.push({
                    activo: row.activo,
                    tipoFila: row.tipoFila || 'Mensual',
                    totalBudget: rowBudget,
                    totalReal: rowReal,
                    details: assetDetails,
                    hasDateAlert,
                    planta: firstReal?.planta,
                    claseContable: firstReal?.claseContable,
                    deviation: calculateDeviation(rowReal, rowBudget)
                });

                groups[cc].totalBudget += rowBudget;
                groups[cc].totalReal += rowReal;
            });

            // Gastos reales que no coincidieron con ninguna fila de presupuesto
            monthlyReal.forEach((g, idx) => {
                if (consumedRealIndices.has(idx)) return;

                const cc = g.centroCosto || 'Sin Centro Costo';
                if (!groups[cc]) {
                    groups[cc] = { centroCosto: cc, assets: [], totalBudget: 0, totalReal: 0, deviation: 0 };
                }

                let assetRow = groups[cc].assets.find(a => a.activo === g.nroActivo && a.tipoFila === 'No Presupuestado');

                if (!assetRow) {
                    assetRow = {
                        activo: g.nroActivo,
                        tipoFila: 'No Presupuestado',
                        totalBudget: 0,
                        totalReal: 0,
                        details: [],
                        hasDateAlert: false,
                        planta: g.planta,
                        claseContable: g.claseContable,
                        deviation: 100
                    };
                    groups[cc].assets.push(assetRow);
                }

                assetRow.totalReal += g.costoTrx;
                assetRow.deviation = calculateDeviation(assetRow.totalReal, assetRow.totalBudget);
                if (g.alertaFecha === 1) assetRow.hasDateAlert = true;

                let detail = assetRow.details.find(d => d.tipo === (g.tipoGasto === 'BODEGA' ? 'Bodega' : g.tipoGasto === 'SERV_EXT' ? 'Serv. Externos' : 'Correctivo'));
                if (!detail) {
                    detail = {
                        tipo: g.tipoGasto === 'BODEGA' ? 'Bodega' : g.tipoGasto === 'SERV_EXT' ? 'Serv. Externos' : 'Correctivo',
                        budget: 0,
                        real: 0
                    };
                    assetRow.details.push(detail);
                }
                detail.real += g.costoTrx;
                groups[cc].totalReal += g.costoTrx;
            });

            // Calcular desviación para cada grupo
            Object.values(groups).forEach(g => {
                g.deviation = calculateDeviation(g.totalReal, g.totalBudget);
            });

            setGroupedData(Object.values(groups));

            // Expandir grupos
            const initialExpanded: Record<string, boolean> = {};
            // Por defecto expandimos solo si hay pocos, o dejamos que el usuario decida.
            // Para evitar "lentitud" al renderizar muchos assets, mejor no expandir todos si la lista es grande.
            // Object.keys(groups).forEach(k => initialExpanded[k] = true);
            setExpandedGroups(initialExpanded);

        } catch (e) {
            console.error(e);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            await ControlGastosService.uploadGastosConsolidados(file);
            alert('Gastos cargados correctamente');
            loadData();
        } catch (error: any) {
            console.error(error);
            alert('Error al cargar gastos: ' + error.message);
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    const toggleGroup = (cc: string) => {
        setExpandedGroups(prev => ({ ...prev, [cc]: !prev[cc] }));
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    // Filter & Sort Logic
    const filteredAndSortedData = groupedData
        .filter(group => {
            const matchesSearch = group.centroCosto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                group.assets.some(a => a.activo.toLowerCase().includes(searchTerm.toLowerCase()));

            const isExceeded = group.totalReal > group.totalBudget && group.totalBudget > 0;
            const matchesExceeded = !filterExceededOnly || isExceeded;

            return matchesSearch && matchesExceeded;
        })
        .sort((a, b) => {
            const factor = sortOrder === 'asc' ? 1 : -1;
            if (sortField === 'centroCosto') {
                return factor * a.centroCosto.localeCompare(b.centroCosto);
            }
            return factor * (a[sortField] - b[sortField]);
        });

    // Pagination Logic
    const totalItems = filteredAndSortedData.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const paginatedData = filteredAndSortedData.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    useEffect(() => {
        setCurrentPage(1); // Reset to page 1 when filters change
    }, [searchTerm, filterExceededOnly, sortField, sortOrder, itemsPerPage]);

    const totalPresupuesto = filteredAndSortedData.reduce((acc, g) => acc + g.totalBudget, 0);
    const totalGasto = filteredAndSortedData.reduce((acc, g) => acc + g.totalReal, 0);
    const totalAvance = totalPresupuesto > 0 ? (totalGasto / totalPresupuesto) * 100 : 0;

    const renderSortIcon = (field: SortField) => {
        if (sortField !== field) return <ArrowUpDown size={14} className="ml-1 opacity-30" />;
        return sortOrder === 'asc' ? <ArrowUp size={14} className="ml-1 text-blue-600" /> : <ArrowDown size={14} className="ml-1 text-blue-600" />;
    };

    return (
        <div className="space-y-6 relative min-h-[400px]">
            {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center rounded-2xl min-h-[400px]">
                    <Loader2 className="animate-spin text-pf-red mb-4" size={40} />
                    <p className="text-slate-600 font-bold uppercase tracking-wider text-xs animate-pulse">Cargando datos de ejecución...</p>
                </div>
            )}

            {/* Header & Controls */}
            <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-4">
                    <select
                        value={currentMonth}
                        onChange={(e) => setCurrentMonth(Number(e.target.value))}
                        className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    >
                        {months.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={() => setFilterExceededOnly(!filterExceededOnly)}
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
                        onChange={(e) => setItemsPerPage(Number(e.target.value))}
                        className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp size={80} className="text-blue-500" />
                    </div>
                    <div>
                        <p className="text-slate-500 text-sm font-medium">Presupuesto Total ({months.find(m => m.id === currentMonth)?.name})</p>
                        <h3 className="text-3xl font-extrabold text-slate-800 mt-2">{formatCurrency(totalPresupuesto)}</h3>
                    </div>
                    <div className="mt-4 flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded">
                        <CheckCircle2 size={12} className="mr-1" />
                        Meta definida ({paginatedData.length} grupos en vista)
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
                        <p className="text-slate-500 text-sm font-medium">Grupos con Sobrepresupuesto</p>
                        <h3 className="text-3xl font-extrabold text-slate-800 mt-2">
                            {groupedData.filter(g => g.totalReal > g.totalBudget && g.totalBudget > 0).length}
                        </h3>
                    </div>
                    <div className="mt-4">
                        <p className="text-xs text-slate-500">De un total de {groupedData.length} centros de costo identificados.</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-center">
                <div className="relative w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar Centro Costo o Activo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 w-full border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <input
                        type="file"
                        id="gastos-upload-monitor"
                        style={{ display: 'none' }}
                        onChange={handleFileUpload}
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

            {/* Grouped Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Calendar size={20} className="text-slate-400" />
                        Monitoreo de Ejecución
                    </h2>
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-500 rounded">Total filtrados: {totalItems}</span>
                        {totalPages > 1 && (
                            <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded">Pagina {currentPage} de {totalPages}</span>
                        )}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left font-semibold text-slate-600 cursor-pointer hover:text-blue-600 select-none" onClick={() => handleSort('centroCosto')}>
                                    <div className="flex items-center">Centro Costo / Activo {renderSortIcon('centroCosto')}</div>
                                </th>
                                <th className="px-6 py-4 text-right font-semibold text-slate-600 cursor-pointer hover:text-blue-600 select-none" onClick={() => handleSort('totalBudget')}>
                                    <div className="flex items-center justify-end">Presupuesto {renderSortIcon('totalBudget')}</div>
                                </th>
                                <th className="px-6 py-4 text-right font-semibold text-slate-600 cursor-pointer hover:text-blue-600 select-none" onClick={() => handleSort('totalReal')}>
                                    <div className="flex items-center justify-end">Real {renderSortIcon('totalReal')}</div>
                                </th>
                                <th className="px-6 py-4 text-right font-semibold text-slate-600 cursor-pointer hover:text-blue-600 select-none" onClick={() => handleSort('deviation')}>
                                    <div className="flex items-center justify-end">% Desv. {renderSortIcon('deviation')}</div>
                                </th>
                                <th className="px-6 py-4 text-left font-semibold text-slate-600">Progreso</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedData.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center text-slate-400 italic">
                                            <Search size={40} className="mb-2 opacity-20" />
                                            <p>No hay datos que coincidan con los filtros.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {paginatedData.map((group) => {
                                const isExpanded = expandedGroups[group.centroCosto];
                                const isOver = group.totalReal > group.totalBudget && group.totalBudget > 0;

                                return (
                                    <Fragment key={group.centroCosto}>
                                        {/* Group Header */}
                                        <tr className={`hover:bg-slate-50 cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50/50' : ''}`} onClick={() => toggleGroup(group.centroCosto)}>
                                            <td className="px-6 py-4 font-bold text-slate-700">
                                                <div className="flex items-center gap-3">
                                                    {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                                                    <div className="flex flex-col">
                                                        <span>{group.centroCosto}</span>
                                                        <span className="text-[10px] font-normal text-slate-400 uppercase tracking-tighter">Centro de Costo</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-700">{formatCurrency(group.totalBudget)}</td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-700">
                                                <div className="flex items-center justify-end gap-2">
                                                    {isOver && <AlertCircle size={14} className="text-pf-red animate-pulse" />}
                                                    {formatCurrency(group.totalReal)}
                                                </div>
                                            </td>
                                            <td className={`px-6 py-4 text-right font-bold ${isOver ? 'text-pf-red' : group.deviation > 90 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                                {group.deviation.toFixed(1)}%
                                            </td>
                                            <td className="px-6 py-4 w-48">
                                                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-pf-red' : 'bg-blue-500'}`}
                                                        style={{ width: `${Math.min((group.totalReal / (group.totalBudget || 1)) * 100, 100)}%` }}
                                                    />
                                                </div>
                                            </td>
                                        </tr>

                                        {/* Assets */}
                                        {isExpanded && group.assets.map((asset, idx) => (
                                            <Fragment key={`${group.centroCosto}-${asset.activo}-${idx}`}>
                                                <tr className="bg-white hover:bg-slate-50/80">
                                                    <td className="px-6 py-3 pl-14 text-slate-800 font-medium">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="text-xs">{asset.activo}</span>
                                                            <span className="px-2 py-0.5 rounded text-[9px] bg-slate-100 text-slate-500 border border-slate-200 uppercase tracking-wide">
                                                                {asset.tipoFila}
                                                            </span>
                                                            {asset.planta && (
                                                                <span className="px-2 py-0.5 rounded text-[9px] bg-blue-50 text-blue-600 border border-blue-100 uppercase tracking-wide">
                                                                    {asset.planta}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3 text-right text-slate-500 text-xs">{formatCurrency(asset.totalBudget)}</td>
                                                    <td className="px-6 py-3 text-right text-slate-600 font-medium text-xs">
                                                        <div className="flex items-center justify-end gap-2 text-xs">
                                                            {asset.hasDateAlert && (
                                                                <div title="Gastos fuera de periodo">
                                                                    <AlertCircle size={12} className="text-amber-500" />
                                                                </div>
                                                            )}
                                                            {formatCurrency(asset.totalReal)}
                                                        </div>
                                                    </td>
                                                    <td className={`px-6 py-3 text-right text-xs font-semibold ${asset.totalReal > asset.totalBudget && asset.totalBudget > 0 ? 'text-pf-red' : 'text-slate-500'}`}>
                                                        {asset.deviation.toFixed(1)}%
                                                    </td>
                                                    <td className="px-6 py-3">
                                                        <div className="w-32 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                            <div
                                                                className={`h-full rounded-full ${asset.totalReal > asset.totalBudget && asset.totalBudget > 0 ? 'bg-red-400' : 'bg-blue-300'}`}
                                                                style={{ width: `${Math.min((asset.totalReal / (asset.totalBudget || 1)) * 100, 100)}%` }}
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                                {/* Details Breakdown */}
                                                {asset.details.map((detail, dIdx) => {
                                                    const progress = Math.min((detail.real / (detail.budget || 1)) * 100, 100);
                                                    const isOverDetail = detail.real > (detail.budget || 0) && detail.budget > 0;
                                                    const devDetail = calculateDeviation(detail.real, detail.budget);

                                                    return (
                                                        <tr key={`${group.centroCosto}-${asset.activo}-${idx}-${dIdx}`} className="text-[10px] bg-slate-50/20">
                                                            <td className="px-6 py-1 pl-20 text-slate-500 flex items-center gap-2">
                                                                <div className={`w-1.5 h-1.5 rounded-full ${detail.tipo === 'Bodega' ? 'bg-blue-400' :
                                                                    detail.tipo === 'Serv. Externos' ? 'bg-emerald-400' :
                                                                        detail.tipo === 'Correctivo' ? 'bg-pf-red' :
                                                                            'bg-amber-400'
                                                                    }`}></div>
                                                                {detail.tipo}
                                                            </td>
                                                            <td className="px-6 py-1 text-right text-slate-400 italic">{formatCurrency(detail.budget)}</td>
                                                            <td className="px-6 py-1 text-right text-slate-400 font-medium">
                                                                {formatCurrency(detail.real)}
                                                            </td>
                                                            <td className={`px-6 py-1 text-right italic ${isOverDetail ? 'text-red-400' : 'text-slate-400'}`}>
                                                                {devDetail.toFixed(1)}%
                                                            </td>
                                                            <td className="px-6 py-1 pr-12">
                                                                <div className="w-24 bg-slate-50 rounded-full h-1 overflow-hidden ml-auto border border-slate-100">
                                                                    <div
                                                                        className={`h-full rounded-full ${isOverDetail ? 'bg-red-400/60' : 'bg-slate-200'}`}
                                                                        style={{ width: `${progress}%` }}
                                                                    />
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </Fragment>
                                        ))}
                                    </Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <div className="text-sm text-slate-500">
                            Mostrando <span className="font-semibold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-semibold text-slate-700">{Math.min(currentPage * itemsPerPage, totalItems)}</span> de <span className="font-semibold text-slate-700">{totalItems}</span> centros de costo
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            {[...Array(totalPages)].map((_, i) => {
                                const page = i + 1;
                                // Show first, last, and current +/- 1
                                if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => setCurrentPage(page)}
                                            className={`px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all ${currentPage === page
                                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                                : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                }
                                if (page === currentPage - 2 || page === currentPage + 2) {
                                    return <span key={page} className="px-1 text-slate-400">...</span>;
                                }
                                return null;
                            })}

                            <button
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
