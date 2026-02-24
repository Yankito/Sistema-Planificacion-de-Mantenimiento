import { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2 } from 'lucide-react';
import { useControlGastos } from '../hooks/useControlGastos';

import { ManualBudgetModal } from './budget/ManualBudgetModal';
import { RemapAssetModal } from './budget/RemapAssetModal';
import { BudgetMatrixTable } from './budget/BudgetMatrixTable';

interface BudgetConfigProps {
    selectedYear: number;
    selectedPlanta: string;
}

// Internal type for the matrix view
interface BudgetMatrixItem {
    id: string; // Asset Name
    nivel: string;
    activo: string;
    totalAnnual: number;
    found: boolean;
    claseContable?: string;
    monthly: {
        [month: number]: {
            bodega: number;
            servExt: number;
            correctivo: number;
            total: number;
        }
    }
}

const MONTHS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

export const BudgetConfig = ({ selectedYear, selectedPlanta }: BudgetConfigProps) => {
    const [matrixData, setMatrixData] = useState<BudgetMatrixItem[]>([]);
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const [showNotFoundOnly, setShowNotFoundOnly] = useState(false);
    const [mappingModal, setMappingModal] = useState<{ open: boolean, oldAsset: string | null, cc: string | null }>({ open: false, oldAsset: null, cc: null });
    const [suggestedAssets, setSuggestedAssets] = useState<any[]>([]);

    const [manualModalOpen, setManualModalOpen] = useState(false);
    const [selectedAssetForManual, setSelectedAssetForManual] = useState<any | null>(null);

    const {
        uploadPresupuesto,
        getPresupuesto,
        searchAssetsByCentroCosto,
        updateAssetName,
        autoFixAssets,
        getMaintainableAssets,
        saveManualPresupuesto,
        loading
    } = useControlGastos();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, [selectedYear, selectedPlanta]);

    const loadData = useCallback(async () => {
        try {
            const data = await getPresupuesto(selectedYear, selectedPlanta);
            const grouped: Record<string, BudgetMatrixItem> = {};

            data.forEach(row => {
                if (!grouped[row.activo]) {
                    grouped[row.activo] = {
                        id: row.activo,
                        nivel: (row.centroCosto || '').includes('0170') ? 'Infraestructura' : 'Maquinaria',
                        activo: row.activo,
                        totalAnnual: 0,
                        found: !!(row.claseContable || row.mantenible),
                        claseContable: row.claseContable,
                        monthly: {}
                    };
                    for (let i = 1; i <= 12; i++) {
                        grouped[row.activo].monthly[i] = { bodega: 0, servExt: 0, correctivo: 0, total: 0 };
                    }
                }

                const m = grouped[row.activo].monthly[row.mes];
                if (m) {
                    m.bodega += (row.montoBodega || 0);
                    m.servExt += (row.montoServExt || 0);
                    m.correctivo += (row.montoCorrectivo || 0);
                    m.total = m.bodega + m.servExt + m.correctivo;
                }
            });

            Object.values(grouped).forEach(item => {
                let total = 0;
                Object.values(item.monthly).forEach(m => total += m.total);
                item.totalAnnual = total;
            });

            setMatrixData(Object.values(grouped));
        } catch (e) {
            console.error(e);
        }
    }, [selectedYear, selectedPlanta, getPresupuesto]);

    const handleRemapSearchByCC = useCallback(async (cc: string) => {
        if (cc) {
            const assets = await searchAssetsByCentroCosto(cc);
            setSuggestedAssets(assets);
        } else {
            setSuggestedAssets([]);
        }
    }, [searchAssetsByCentroCosto]);

    const openRemapModal = useCallback((assetName: string) => {
        const match = assetName.match(/\((\d+)\)/);
        const cc = match ? match[1] : '';

        setMappingModal({ open: true, oldAsset: assetName, cc });
        if (cc) handleRemapSearchByCC(cc);
        else setSuggestedAssets([]);
    }, [handleRemapSearchByCC]);

    const handleUpdateName = useCallback(async (newName: string) => {
        if (!mappingModal.oldAsset) return;
        try {
            await updateAssetName(mappingModal.oldAsset, newName, selectedYear);
            setMappingModal({ open: false, oldAsset: null, cc: null });
            setSuggestedAssets([]);
            loadData();
            alert('Nombre actualizado correctamente');
        } catch (err: any) {
            alert('Error al actualizar: ' + err.message);
        }
    }, [mappingModal.oldAsset, updateAssetName, selectedYear, loadData]);

    const handleAutoFix = useCallback(async () => {
        if (!confirm('Esto vinculará automáticamente todos los activos que tengan una coincidencia única en la base de datos. ¿Desea continuar?')) return;
        try {
            const result = await autoFixAssets(selectedYear);
            alert(`Se vincularon ${result.fixed} activos automáticamente de un total de ${result.total} activos no encontrados.`);
            loadData();
        } catch (err: any) {
            alert('Error al ejecutar auto-vinculación: ' + err.message);
        }
    }, [autoFixAssets, selectedYear, loadData]);


    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                await uploadPresupuesto(e.target.files[0]);
                alert('Presupuesto cargado exitosamente');
                loadData();
            } catch (err: any) {
                alert('Error al cargar: ' + err.message);
            }
        }
    }, [uploadPresupuesto, loadData]);

    const toggleExpand = useCallback((id: string) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    }, []);

    const formatCurrency = useCallback((val: number) => {
        if (val === 0) return '-';
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);
    }, []);

    const months = MONTHS;

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative min-h-[400px]">
            {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center rounded-2xl min-h-[400px]">
                    <Loader2 className="animate-spin text-pf-red mb-4" size={40} />
                    <p className="text-slate-600 font-bold uppercase tracking-wider text-xs animate-pulse">Cargando presupuesto...</p>
                </div>
            )}

            <BudgetMatrixTable
                selectedYear={selectedYear}
                loading={loading}
                matrixData={matrixData}
                showNotFoundOnly={showNotFoundOnly}
                setShowNotFoundOnly={setShowNotFoundOnly}
                expandedRows={expandedRows}
                toggleExpand={toggleExpand}
                handleAutoFix={handleAutoFix}
                setManualModalOpen={setManualModalOpen}
                setSelectedAssetForManual={setSelectedAssetForManual}
                fileInputRef={fileInputRef}
                handleFileChange={handleFileChange}
                openRemapModal={openRemapModal}
                months={months}
                formatCurrency={formatCurrency}
            />

            <ManualBudgetModal
                isOpen={manualModalOpen}
                onClose={() => { setManualModalOpen(false); setSelectedAssetForManual(null); }}
                selectedAsset={selectedAssetForManual}
                setSelectedAsset={setSelectedAssetForManual}
                onSaveSuccess={loadData}
                getMaintainableAssets={getMaintainableAssets}
                getPresupuesto={getPresupuesto}
                saveManualPresupuesto={saveManualPresupuesto}
                selectedYear={selectedYear}
                months={months}
            />

            <RemapAssetModal
                isOpen={mappingModal.open}
                onClose={() => { setMappingModal({ open: false, oldAsset: null, cc: null }); setSuggestedAssets([]); }}
                mappingModal={mappingModal}
                suggestedAssets={suggestedAssets}
                handleUpdateName={handleUpdateName}
            />
        </div>
    );
};
