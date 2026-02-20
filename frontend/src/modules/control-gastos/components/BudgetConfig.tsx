import { useState, useRef, useEffect } from 'react';
import { FileSpreadsheet, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
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
    const { uploadPresupuesto, getPresupuesto, loading } = useControlGastos();
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
                        Importar Excel
                    </button>
                    {/* Botón Nueva Asignación eliminado temporalmente ya que la carga es masiva */}
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
                        {matrixData.map((item) => {
                            const isExpanded = expandedRows[item.id];
                            return (
                                <>
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="px-4 py-2 border-r border-slate-100">
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => toggleExpand(item.id)} className="text-slate-400 hover:text-blue-600">
                                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                </button>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-700 truncate max-w-[180px]" title={item.activo}>{item.activo}</span>
                                                    <span className="text-[10px] text-slate-400">{item.nivel}</span>
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
                                </>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            <div className="mt-4 flex gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-blue-500 rounded-full"></div> Bodega</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> Serv. Externos</div>
                <div className="flex items-center gap-1"><div className="w-2 h-2 bg-pf-red rounded-full"></div> Correctivo</div>
            </div>
        </div>
    );
};
