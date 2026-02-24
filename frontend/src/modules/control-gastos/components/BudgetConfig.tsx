import { useState, useRef, useEffect, Fragment } from 'react';
import { FileSpreadsheet, ChevronDown, ChevronRight, Loader2, Search, AlertCircle, Edit2, X, Plus, Save } from 'lucide-react';
import { useControlGastos } from '../hooks/useControlGastos';

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

export const BudgetConfig = ({ selectedYear, selectedPlanta }: BudgetConfigProps) => {
    const [matrixData, setMatrixData] = useState<BudgetMatrixItem[]>([]);
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});
    const [showNotFoundOnly, setShowNotFoundOnly] = useState(false);
    const [mappingModal, setMappingModal] = useState<{ open: boolean, oldAsset: string | null, cc: string | null }>({ open: false, oldAsset: null, cc: null });
    const [suggestedAssets, setSuggestedAssets] = useState<any[]>([]);

    // Manual Entry States
    const [manualModalOpen, setManualModalOpen] = useState(false);
    const [maintainableAssets, setMaintainableAssets] = useState<any[]>([]);
    const [assetSearch, setAssetSearch] = useState('');
    const [selectedAssetForManual, setSelectedAssetForManual] = useState<any | null>(null);
    const [manualBudgetRows, setManualBudgetRows] = useState<any[]>(
        Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, montoBodega: 0, montoServExt: 0, montoCorrectivo: 0, frecuencia: '' }))
    );

    const {
        uploadPresupuesto,
        getPresupuesto,
        searchAssetsByCentroCosto,
        updateAssetName,
        autoFixAssets,
        loading
    } = useControlGastos();
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, [selectedYear, selectedPlanta]);

    const loadData = async () => {
        try {
            const data = await getPresupuesto(selectedYear, selectedPlanta);

            // Process into Matrix Structure
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
                    // Init months
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

            // Calculate totals
            Object.values(grouped).forEach(item => {
                let total = 0;
                Object.values(item.monthly).forEach(m => total += m.total);
                item.totalAnnual = total;
            });

            setMatrixData(Object.values(grouped));
        } catch (e) {
            console.error(e);
        }
    };

    const handleRemapSearchByCC = async (cc: string) => {
        if (cc) {
            const assets = await searchAssetsByCentroCosto(cc);
            setSuggestedAssets(assets);
        } else {
            setSuggestedAssets([]);
        }
    };

    const openRemapModal = (assetName: string) => {
        // Buscamos dígitos dentro de paréntesis (el Centro de Costo)
        const match = assetName.match(/\((\d+)\)/);
        const cc = match ? match[1] : '';

        setMappingModal({ open: true, oldAsset: assetName, cc });
        if (cc) handleRemapSearchByCC(cc);
        else setSuggestedAssets([]);
    };

    const handleUpdateName = async (newName: string) => {
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
    };

    const handleAutoFix = async () => {
        if (!confirm('Esto vinculará automáticamente todos los activos que tengan una coincidencia única en la base de datos. ¿Desea continuar?')) return;
        try {
            const result = await autoFixAssets(selectedYear);
            alert(`Se vincularon ${result.fixed} activos automáticamente de un total de ${result.total} activos no encontrados.`);
            loadData();
        } catch (err: any) {
            alert('Error al ejecutar auto-vinculación: ' + err.message);
        }
    };


    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            try {
                await uploadPresupuesto(e.target.files[0]);
                alert('Presupuesto cargado exitosamente');
                loadData();
            } catch (err: any) {
                alert('Error al cargar: ' + err.message);
            }
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const formatCurrency = (val: number) => {
        if (val === 0) return '-';
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(val);
    };

    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative min-h-[400px]">
            {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center rounded-2xl min-h-[400px]">
                    <Loader2 className="animate-spin text-pf-red mb-4" size={40} />
                    <p className="text-slate-600 font-bold uppercase tracking-wider text-xs animate-pulse">Cargando presupuesto...</p>
                </div>
            )}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800">Planificación Presupuestaria ({selectedYear})</h2>
                    <p className="text-slate-500 text-sm mt-1">Matriz de asignación de recursos por activo y tipo de gasto.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleAutoFix}
                        disabled={loading || !matrixData.some(i => !i.found)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border ${matrixData.some(i => !i.found)
                            ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700'
                            : 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed'
                            }`}
                        title="Vincular automáticamente coincidencias únicas"
                    >
                        <Search size={18} />
                        Auto-Vincular
                    </button>
                    <button
                        onClick={() => setShowNotFoundOnly(!showNotFoundOnly)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 border ${showNotFoundOnly
                            ? 'bg-pf-red/10 text-pf-red border-pf-red/20'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        <AlertCircle size={18} />
                        {showNotFoundOnly ? 'Viendo No Encontrados' : 'Filtrar No Encontrados'}
                    </button>
                    <button
                        onClick={() => setManualModalOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-lg shadow-blue-200"
                    >
                        <Plus size={18} />
                        Ingreso Manual
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                    />
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors flex items-center gap-2"
                    >
                        {loading ? <span className="animate-spin">⌛</span> : <FileSpreadsheet size={18} />}
                        Importar Excel (Prueba)
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto border rounded-xl border-slate-200">
                <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-3 min-w-[200px] border-r border-slate-200">Activo</th>
                            <th className="px-2 py-3 text-right bg-slate-100/50 border-r border-slate-200 min-w-[100px]">Total Anual</th>
                            {months.map(m => (
                                <th key={m} className="px-2 py-3 text-right min-w-[80px]">{m}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {matrixData.length === 0 && (
                            <tr>
                                <td colSpan={14} className="text-center py-12 text-slate-400">
                                    No hay datos cargados para el año {selectedYear}. Importe una planilla Excel.
                                </td>
                            </tr>
                        )}
                        {matrixData
                            .filter(item => !showNotFoundOnly || !item.found)
                            .map((item) => {
                                const isExpanded = expandedRows[item.id];
                                return (
                                    <Fragment key={item.id}>
                                        <tr className="hover:bg-slate-50 transition-colors group">
                                            <td className="px-4 py-2 border-r border-slate-100">
                                                <div className="flex items-center gap-2">
                                                    <button onClick={() => toggleExpand(item.id)} className="text-slate-400 hover:text-blue-600">
                                                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                    </button>
                                                    <div className="flex flex-col flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className={`font-bold truncate max-w-[180px] ${item.found ? 'text-slate-700' : 'text-pf-red'}`} title={item.activo}>
                                                                {item.activo}
                                                            </span>
                                                            {!item.found ? (
                                                                <button
                                                                    onClick={() => openRemapModal(item.activo)}
                                                                    className="p-1 hover:bg-pf-red/10 text-pf-red rounded transition-colors"
                                                                    title="Vincular con activo real"
                                                                >
                                                                    <Edit2 size={12} />
                                                                </button>
                                                            ) : (
                                                                <button
                                                                    onClick={() => {
                                                                        // Precargar para edición manual
                                                                        setSelectedAssetForManual({ activo: item.activo });
                                                                        const rows = Array.from({ length: 12 }, (_, i) => {
                                                                            const m = item.monthly[i + 1];
                                                                            // Necesitamos la frecuencia original si existiera, o deducirla
                                                                            return {
                                                                                mes: i + 1,
                                                                                montoBodega: m.bodega,
                                                                                montoServExt: m.servExt,
                                                                                montoCorrectivo: m.correctivo,
                                                                                frecuencia: '' // Podríamos intentar obtenerla del primer mes si la matrix la guardara
                                                                            };
                                                                        });
                                                                        setManualBudgetRows(rows);
                                                                        setManualModalOpen(true);
                                                                    }}
                                                                    className="p-1 hover:bg-blue-50 text-blue-500 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                                    title="Editar Presupuesto"
                                                                >
                                                                    <Edit2 size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                        <span className="text-[10px] text-slate-400">
                                                            {item.nivel} {item.claseContable ? `• ${item.claseContable}` : ''}
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-2 py-2 text-right font-bold text-slate-700 bg-slate-50/50 border-r border-slate-100">
                                                {formatCurrency(item.totalAnnual)}
                                            </td>
                                            {months.map((_, idx) => (
                                                <td key={idx} className="px-2 py-2 text-right text-slate-600 font-medium">
                                                    {formatCurrency(item.monthly[idx + 1].total)}
                                                </td>
                                            ))}
                                        </tr>

                                        {isExpanded && (
                                            <>
                                                <tr className="bg-blue-50/30 text-[10px]" key={`${item.id}-bodega`}>
                                                    <td className="px-4 py-1 text-right text-blue-600 font-medium border-r border-slate-100 pl-8">Variab. Bodega</td>
                                                    <td className="px-2 py-1 text-right text-slate-400 border-r border-slate-100">-</td>
                                                    {months.map((_, idx) => (
                                                        <td key={idx} className="px-2 py-1 text-right text-blue-600">
                                                            {formatCurrency(item.monthly[idx + 1].bodega)}
                                                        </td>
                                                    ))}
                                                </tr>
                                                <tr className="bg-emerald-50/30 text-[10px]" key={`${item.id}-serv`}>
                                                    <td className="px-4 py-1 text-right text-emerald-600 font-medium border-r border-slate-100 pl-8">Serv. Externos</td>
                                                    <td className="px-2 py-1 text-right text-slate-400 border-r border-slate-100">-</td>
                                                    {months.map((_, idx) => (
                                                        <td key={idx} className="px-2 py-1 text-right text-emerald-600">
                                                            {formatCurrency(item.monthly[idx + 1].servExt)}
                                                        </td>
                                                    ))}
                                                </tr>
                                                <tr className="bg-pf-red/5 text-[10px] border-b border-slate-100" key={`${item.id}-corr`}>
                                                    <td className="px-4 py-1 text-right text-pf-red font-medium border-r border-slate-100 pl-8">Correctivo</td>
                                                    <td className="px-2 py-1 text-right text-slate-400 border-r border-slate-100">-</td>
                                                    {months.map((_, idx) => (
                                                        <td key={idx} className="px-2 py-1 text-right text-pf-red">
                                                            {formatCurrency(item.monthly[idx + 1].correctivo)}
                                                        </td>
                                                    ))}
                                                </tr>
                                            </>
                                        )}
                                    </Fragment>
                                );
                            })}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> Bodega</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Serv. Externos</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-pf-red rounded-full"></div> Correctivo</div>
                <div className="flex items-center gap-2 ml-auto text-[10px] italic">
                    <AlertCircle size={10} className="text-pf-red" />
                    <span>Líneas en rojo indican activos del presupuesto que no coinciden con la base de datos de mantenimiento.</span>
                </div>
            </div>


            {/* Modal de Remapeo */}
            {mappingModal.open && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h3 className="font-bold text-slate-800">Vincular Activo</h3>
                                <p className="text-[10px] text-slate-500">Buscando reemplazo para: <span className="text-pf-red font-bold">{mappingModal.oldAsset}</span></p>
                            </div>
                            <button
                                onClick={() => { setMappingModal({ open: false, oldAsset: null, cc: null }); setSuggestedAssets([]); }}
                                className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-6">
                            <div className="mb-6 p-4 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-slate-400 mb-1 tracking-wider">Centro de Costo Vinculado</label>
                                    <p className="text-xl font-mono font-bold text-slate-700 tracking-widest">{mappingModal.cc}</p>
                                </div>
                                <div className="p-2 bg-pf-red/10 rounded-lg">
                                    <Search className="text-pf-red" size={20} />
                                </div>
                            </div>

                            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-wider">
                                    {suggestedAssets.length > 0 ? `Sugerencias (${suggestedAssets.length})` : 'Resultados'}
                                </label>

                                {suggestedAssets.length === 0 ? (
                                    <div className="py-8 text-center border-2 border-dashed border-slate-100 rounded-xl">
                                        <AlertCircle size={32} className="mx-auto text-slate-200 mb-2" />
                                        <p className="text-xs text-slate-400">No se encontraron activos con el CC {mappingModal.cc} en la base de datos.</p>
                                    </div>
                                ) : (
                                    suggestedAssets.map(asset => (
                                        <button
                                            key={asset.activo}
                                            onClick={() => handleUpdateName(asset.activo)}
                                            className="w-full text-left p-3 hover:bg-pf-red/5 border border-slate-100 hover:border-pf-red/30 rounded-xl transition-all group flex justify-between items-center"
                                        >
                                            <div>
                                                <p className="text-sm font-bold text-slate-700 group-hover:text-pf-red">{asset.activo}</p>
                                                <p className="text-[10px] text-slate-400">{asset.claseContable} • {asset.organizacion}</p>
                                            </div>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <span className="text-[10px] font-bold text-pf-red uppercase">Vincular</span>
                                            </div>
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
                            <p className="text-[10px] text-slate-400 italic">Al vincular, se actualizarán todas las líneas de presupuesto para este nombre.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
