import { useState, useEffect, useCallback } from 'react';
import { ControlGastosService } from '../services/ControlGastosService';
import { Loader2 } from 'lucide-react';
import { useControlGastos } from '../hooks/useControlGastos';
import { type GastoConsolidadoRow } from '../types';
import { toast } from 'sonner';
import type { AssetExecutionDetail, CostCenterGroup, SortField, SortOrder, AssetCategory, CategorySummary } from './monitor/types';
import { KPICards } from './monitor/KPICards';
import { MonitorFilters } from './monitor/MonitorFilters';
import { ExecutionTable } from './monitor/ExecutionTable';
import { TransactionSidePanel } from './monitor/TransactionSidePanel';
import { categorizeAsset } from '../utils/categorization';

interface ExecutionMonitorProps {
    selectedYear: number;
    selectedPlanta: string;
    selectedMonth?: number;
}

export const ExecutionMonitor = ({ selectedYear, selectedPlanta, selectedMonth }: ExecutionMonitorProps) => {
    const [groupedData, setGroupedData] = useState<CostCenterGroup[]>([]);
    const [categorySummaries, setCategorySummaries] = useState<CategorySummary[]>([]);
    // Si no se selecciona un mes globalmente, se toma el mes actual
    const currentMonth = selectedMonth ?? (new Date().getMonth() + 1);
    const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [isUploading, setIsUploading] = useState(false);

    // Paginacion y ordenamiento
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [sortField, setSortField] = useState<SortField>('centroCosto');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [filterExceededOnly, setFilterExceededOnly] = useState(false);
    const [filterInternalDeviation, setFilterInternalDeviation] = useState(false);
    const [filterDateAlert, setFilterDateAlert] = useState(false);
    const [filterCriticalOnly, setFilterCriticalOnly] = useState(false);

    // Panel de detalles
    const [rawMonthlyReal, setRawMonthlyReal] = useState<GastoConsolidadoRow[]>([]);
    const [selectedDetailTransactions, setSelectedDetailTransactions] = useState<GastoConsolidadoRow[]>([]);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [panelTitle, setPanelTitle] = useState('');
    const [panelBudget, setPanelBudget] = useState<number | undefined>(undefined);

    const { getPresupuesto, getGastosConsolidados, loading } = useControlGastos();

    const months = [
        { id: 1, name: 'Enero' }, { id: 2, name: 'Febrero' }, { id: 3, name: 'Marzo' },
        { id: 4, name: 'Abril' }, { id: 5, name: 'Mayo' }, { id: 6, name: 'Junio' },
        { id: 7, name: 'Julio' }, { id: 8, name: 'Agosto' }, { id: 9, name: 'Septiembre' },
        { id: 10, name: 'Octubre' }, { id: 11, name: 'Noviembre' }, { id: 12, name: 'Diciembre' }
    ];

    const calculateDeviation = (real: number, budget: number) => {
        if (budget === 0) return real > 0 ? 100 : 0;
        return ((real - budget) / budget) * 100;
    };

    const loadData = useCallback(async () => {
        try {
            // Optimizamos: Pedimos solo los datos del mes seleccionado si aplica
            const [budgetData, realExpenses] = await Promise.all([
                getPresupuesto(selectedYear, selectedPlanta, undefined, currentMonth),
                getGastosConsolidados(selectedYear, selectedPlanta, currentMonth)
            ]);

            const monthlyBudget = budgetData; // Ya viene filtrado por mes desde el backend
            const monthlyReal = realExpenses; // Ya viene filtrado por mes desde el backend
            setRawMonthlyReal(monthlyReal);

            const groups: Record<string, CostCenterGroup> = {};
            const consumedRealIndices = new Set<number>();

            // 1. Organizar presupuesto por Centro de Costo y Activo
            monthlyBudget.forEach(row => {
                const cc = row.centroCosto || 'Sin Centro Costo';
                const isHitoRow = row.frecuencia?.toLowerCase().includes('hito');

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
                const hasActiveOT =
                    (realBodega > (row.montoBodega || 0) && assetReal.some(g => g.tipoGasto === 'BODEGA' && g.estadoTrabajo === 'Liberado')) ||
                    (realServExt > (row.montoServExt || 0) && assetReal.some(g => g.tipoGasto === 'SERV_EXT' && g.estadoTrabajo === 'Liberado')) ||
                    (realCorrectivo > (row.montoCorrectivo || 0) && assetReal.some(g => g.tipoGasto === 'CORRECTIVO' && g.estadoTrabajo === 'Liberado'));
                const rowBudget = (row.montoBodega || 0) + (row.montoServExt || 0) + (row.montoCorrectivo || 0);
                const rowReal = realBodega + realServExt + realCorrectivo;

                const firstReal = assetReal[0];
                //mostrar activo : PF Conj Basculas P1 (0228)
                if (row.activo.startsWith('PF Conj Basculas P1 (0228)')) {
                    console.log(row);
                    console.log(firstReal);
                }
                const claseContableAsset = row.claseContable || firstReal?.claseContable;

                groups[cc].assets.push({
                    activo: row.activo,
                    frecuencia: row.frecuencia || 'Mensual',
                    totalBudget: rowBudget,
                    totalReal: rowReal,
                    details: assetDetails,
                    hasDateAlert,
                    planta: firstReal?.planta,
                    claseContable: claseContableAsset,
                    category: categorizeAsset(claseContableAsset),
                    deviation: calculateDeviation(rowReal, rowBudget),
                    hasActiveOT,
                    mantenible: row.mantenible || firstReal?.mantenible
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

                let assetRow = groups[cc].assets.find(a => a.activo === g.nroActivo && a.frecuencia === 'No Presupuestado');

                if (!assetRow) {
                    assetRow = {
                        activo: g.nroActivo,
                        frecuencia: 'No Presupuestado',
                        totalBudget: 0,
                        totalReal: 0,
                        details: [],
                        hasDateAlert: false,
                        planta: g.planta,
                        claseContable: g.claseContable,
                        category: categorizeAsset(g.claseContable),
                        deviation: 100,
                        hasActiveOT: false,
                        mantenible: g.mantenible
                    };
                    groups[cc].assets.push(assetRow);
                }

                assetRow.totalReal += g.costoTrx;
                assetRow.deviation = calculateDeviation(assetRow.totalReal, assetRow.totalBudget);
                if (g.alertaFecha === 1) assetRow.hasDateAlert = true;
                // En 'No Presupuestado', cualquier gasto con OT Liberada es critico (presupuesto es 0)
                if (g.estadoTrabajo === 'Liberado' && g.costoTrx > 0) assetRow.hasActiveOT = true;

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

            // Calcular resúmenes por categoría
            const catMap: Record<AssetCategory, CategorySummary> = {
                'Maquinaria': { category: 'Maquinaria', totalBudget: 0, totalReal: 0, deviation: 0, itemCount: 0 },
                'Redes': { category: 'Redes', totalBudget: 0, totalReal: 0, deviation: 0, itemCount: 0 },
                'Infra': { category: 'Infra', totalBudget: 0, totalReal: 0, deviation: 0, itemCount: 0 },
                'Otros': { category: 'Otros', totalBudget: 0, totalReal: 0, deviation: 0, itemCount: 0 },
            };

            Object.values(groups).forEach(g => {
                g.assets.forEach(a => {
                    catMap[a.category].totalBudget += a.totalBudget;
                    catMap[a.category].totalReal += a.totalReal;
                    catMap[a.category].itemCount++;
                });
            });

            Object.values(catMap).forEach(c => {
                c.deviation = calculateDeviation(c.totalReal, c.totalBudget);
            });

            setCategorySummaries(Object.values(catMap).filter(c => c.itemCount > 0));
            setExpandedGroups({});

        } catch (e) {
            console.error(e);
        }
    }, [selectedYear, selectedPlanta, currentMonth, getPresupuesto, getGastosConsolidados]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            await ControlGastosService.uploadGastosConsolidados(file);
            toast.success('Gastos cargados correctamente');
            loadData();
        } catch (err) {
            const error = err as Error;
            console.error(error);
            toast.error('Error al cargar gastos: ' + error.message);
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

    const handleShowDetails = (title: string, transactions: GastoConsolidadoRow[], budget?: number) => {
        setPanelTitle(title);
        setSelectedDetailTransactions(transactions);
        setPanelBudget(budget);
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

    const handleToggleFilter = (type: 'critical' | 'exceeded' | 'internal' | 'date') => {
        if (type === 'critical') setFilterCriticalOnly(!filterCriticalOnly);
        if (type === 'exceeded') setFilterExceededOnly(!filterExceededOnly);
        if (type === 'internal') setFilterInternalDeviation(!filterInternalDeviation);
        if (type === 'date') setFilterDateAlert(!filterDateAlert);
    };

    // Filter & Sort Logic
    const filteredAndSortedData = groupedData
        .filter(group => {
            const matchesSearch = group.centroCosto.toLowerCase().includes(searchTerm.toLowerCase()) ||
                group.assets.some(a => a.activo.toLowerCase().includes(searchTerm.toLowerCase()));

            const isExceeded = group.totalReal > group.totalBudget && group.totalBudget > 0;
            const hasInternalDeviation = group.assets.some(a =>
                a.details.some(d => d.real > d.budget && d.budget > 0) ||
                (a.totalReal > a.totalBudget && a.totalBudget > 0)
            );
            const hasDateAlert = group.assets.some(a => a.hasDateAlert);
            const hasCritical = group.assets.some(a => a.totalReal > a.totalBudget && a.hasActiveOT);
            const matchesCategory = selectedCategory === 'Todos' || group.assets.some(a => a.category === selectedCategory);

            const matchesExceeded = !filterExceededOnly || isExceeded;
            const matchesInternal = !filterInternalDeviation || hasInternalDeviation;
            const matchesDate = !filterDateAlert || hasDateAlert;
            const matchesCritical = !filterCriticalOnly || hasCritical;

            return matchesSearch && matchesExceeded && matchesInternal && matchesDate && matchesCritical && matchesCategory;
        })
        .map(group => {
            if (selectedCategory === 'Todos') return group;

            const filteredAssets = group.assets.filter(a => a.category === selectedCategory);
            return {
                ...group,
                assets: filteredAssets,
                // Opcional: Recalcular totales para que reflejen solo la categoría seleccionada
                totalBudget: filteredAssets.reduce((sum, a) => sum + a.totalBudget, 0),
                totalReal: filteredAssets.reduce((sum, a) => sum + a.totalReal, 0),
                deviation: calculateDeviation(
                    filteredAssets.reduce((sum, a) => sum + a.totalReal, 0),
                    filteredAssets.reduce((sum, a) => sum + a.totalBudget, 0)
                )
            };
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
    }, [searchTerm, filterExceededOnly, filterInternalDeviation, filterDateAlert, sortField, sortOrder, itemsPerPage]);

    const totalPresupuesto = filteredAndSortedData.reduce((acc, g) => acc + g.totalBudget, 0);
    const totalGasto = filteredAndSortedData.reduce((acc, g) => acc + g.totalReal, 0);
    const totalAvance = totalPresupuesto > 0 ? (totalGasto / totalPresupuesto) * 100 : 0;

    // Plan breakdown for KPIs
    const totalPlanBudget = filteredAndSortedData.reduce((acc, g) =>
        acc + g.assets.reduce((aAcc, asset) =>
            aAcc + asset.details
                .filter(d => d.tipo === 'Bodega' || d.tipo === 'Serv. Externos')
                .reduce((dAcc, d) => dAcc + d.budget, 0)
            , 0)
        , 0);

    const totalPlanReal = filteredAndSortedData.reduce((acc, g) =>
        acc + g.assets.reduce((aAcc, asset) =>
            aAcc + asset.details
                .filter(d => d.tipo === 'Bodega' || d.tipo === 'Serv. Externos')
                .reduce((dAcc, d) => dAcc + d.real, 0)
            , 0)
        , 0);

    const totalCorrectivoBudget = filteredAndSortedData.reduce((acc, g) =>
        acc + g.assets.reduce((aAcc, asset) =>
            aAcc + asset.details
                .filter(d => d.tipo === 'Correctivo')
                .reduce((dAcc, d) => dAcc + d.budget, 0)
            , 0)
        , 0);

    const totalCorrectivoReal = filteredAndSortedData.reduce((acc, g) =>
        acc + g.assets.reduce((aAcc, asset) =>
            aAcc + asset.details
                .filter(d => d.tipo === 'Correctivo')
                .reduce((dAcc, d) => dAcc + d.real, 0)
            , 0)
        , 0);

    return (
        <div className="space-y-6 relative min-h-[400px]">
            {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center rounded-2xl min-h-[400px]">
                    <Loader2 className="animate-spin text-pf-red mb-4" size={40} />
                    <p className="text-slate-600 font-bold uppercase tracking-wider text-xs animate-pulse">Cargando datos de ejecución...</p>
                </div>
            )}

            <MonitorFilters
                filterExceededOnly={filterExceededOnly}
                onToggleExceededOnly={() => setFilterExceededOnly(!filterExceededOnly)}
                filterInternalDeviation={filterInternalDeviation}
                onToggleInternalDeviation={() => setFilterInternalDeviation(!filterInternalDeviation)}
                filterDateAlert={filterDateAlert}
                onToggleDateAlert={() => setFilterDateAlert(!filterDateAlert)}
                filterCriticalOnly={filterCriticalOnly}
                onToggleCriticalOnly={() => setFilterCriticalOnly(!filterCriticalOnly)}
                itemsPerPage={itemsPerPage}
                onItemsPerPageChange={setItemsPerPage}
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedCategory={selectedCategory}
                onCategoryChange={setSelectedCategory}
                isUploading={isUploading}
                onFileUpload={handleFileUpload}
            />

            <KPICards
                totalPresupuesto={totalPresupuesto}
                totalGasto={totalGasto}
                totalAvance={totalAvance}
                totalPlanBudget={totalPlanBudget}
                totalPlanReal={totalPlanReal}
                totalCorrectivoBudget={totalCorrectivoBudget}
                totalCorrectivoReal={totalCorrectivoReal}
                groupedData={filteredAndSortedData}
                categorySummaries={categorySummaries}
                monthName={months.find(m => m.id === currentMonth)?.name || ''}
                formatCurrency={formatCurrency}
                onToggleFilter={handleToggleFilter}
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
                totalContextBudget={panelBudget}
            />
        </div>
    );
};
