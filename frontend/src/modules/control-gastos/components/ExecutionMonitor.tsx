import { useState, useEffect } from 'react';
import { ControlGastosService } from '../services/ControlGastosService';
import { Loader2 } from 'lucide-react';
import { useControlGastos } from '../hooks/useControlGastos';
import { type GastoConsolidadoRow } from '../types';
import type { AssetExecutionDetail, CostCenterGroup, SortField, SortOrder } from './monitor/types';
import { KPICards } from './monitor/KPICards';
import { MonitorFilters } from './monitor/MonitorFilters';
import { ExecutionTable } from './monitor/ExecutionTable';
import { TransactionSidePanel } from './monitor/TransactionSidePanel';

interface ExecutionMonitorProps {
    selectedYear: number;
    selectedPlanta: string;
}

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

    // Detail Panel State
    const [rawMonthlyReal, setRawMonthlyReal] = useState<GastoConsolidadoRow[]>([]);
    const [selectedDetailTransactions, setSelectedDetailTransactions] = useState<GastoConsolidadoRow[]>([]);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [panelTitle, setPanelTitle] = useState('');

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
            setRawMonthlyReal(monthlyReal);

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
            setExpandedGroups({});

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

    const handleShowDetails = (title: string, transactions: GastoConsolidadoRow[]) => {
        setPanelTitle(title);
        setSelectedDetailTransactions(transactions);
        setIsPanelOpen(true);
    };

    const getAssetTransactions = (activo: string, isHito: boolean) => {
        return rawMonthlyReal.filter(g => g.nroActivo === activo && (isHito ? g.esHito : !g.esHito));
    };

    const getGroupTransactions = (cc: string) => {
        return rawMonthlyReal.filter(g => g.centroCosto === cc);
    };

    const getTypeTransactions = (activo: string, isHito: boolean, type: string) => {
        const typeMap: Record<string, string> = {
            'Bodega': 'BODEGA',
            'Serv. Externos': 'SERV_EXT',
            'Correctivo': 'CORRECTIVO'
        };
        const backendType = typeMap[type] || type;
        return rawMonthlyReal.filter(g =>
            g.nroActivo === activo &&
            (isHito ? g.esHito : !g.esHito) &&
            g.tipoGasto === backendType
        );
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

    return (
        <div className="space-y-6 relative min-h-[400px]">
            {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center rounded-2xl min-h-[400px]">
                    <Loader2 className="animate-spin text-pf-red mb-4" size={40} />
                    <p className="text-slate-600 font-bold uppercase tracking-wider text-xs animate-pulse">Cargando datos de ejecución...</p>
                </div>
            )}

            <MonitorFilters
                currentMonth={currentMonth}
                months={months}
                onMonthChange={setCurrentMonth}
                filterExceededOnly={filterExceededOnly}
                onToggleExceededOnly={() => setFilterExceededOnly(!filterExceededOnly)}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                isUploading={isUploading}
                onFileUpload={handleFileUpload}
            />

            <KPICards
                totalPresupuesto={totalPresupuesto}
                totalGasto={totalGasto}
                totalAvance={totalAvance}
                paginatedDataCount={paginatedData.length}
                groupedData={groupedData}
                monthName={months.find(m => m.id === currentMonth)?.name || ''}
                formatCurrency={formatCurrency}
            />

            <ExecutionTable
                paginatedData={paginatedData}
                totalItems={totalItems}
                currentPage={currentPage}
                totalPages={totalPages}
                expandedGroups={expandedGroups}
                sortField={sortField}
                sortOrder={sortOrder}
                onToggleGroup={toggleGroup}
                onPageChange={setCurrentPage}
                onSort={handleSort}
                formatCurrency={formatCurrency}
                calculateDeviation={calculateDeviation}
                onShowDetails={handleShowDetails}
                getGroupTransactions={getGroupTransactions}
                getAssetTransactions={getAssetTransactions}
                getTypeTransactions={getTypeTransactions}
                itemsPerPage={itemsPerPage}
            />

            <TransactionSidePanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                title={panelTitle}
                transactions={selectedDetailTransactions}
                formatCurrency={formatCurrency}
            />
        </div>
    );
};
