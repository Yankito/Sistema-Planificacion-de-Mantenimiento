import { useState, useEffect } from 'react';
import type { DetalleGastoItem } from '../types';
import { Search, Filter, Loader2, Box, Share2, Layers } from 'lucide-react';
import { useControlGastos } from '../hooks/useControlGastos';
import { categorizeAsset } from '../utils/categorization';
import { toast } from 'sonner';

interface ExpenseBreakdownProps {
    selectedYear: number;
    selectedPlanta: string;
    selectedMonth?: number;
}

export const ExpenseBreakdown = ({ selectedYear, selectedPlanta, selectedMonth }: ExpenseBreakdownProps) => {
    const [selectedAsset, setSelectedAsset] = useState('Todos');
    const [details, setDetails] = useState<DetalleGastoItem[]>([]);
    const { getPresupuesto, getGastosConsolidados, loading } = useControlGastos();


    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                // Optimizamos: Pedimos solo los datos del mes seleccionado si aplica
                const [, realExpenses] = await Promise.all([
                    getPresupuesto(selectedYear, selectedPlanta, undefined, selectedMonth),
                    getGastosConsolidados(selectedYear, selectedPlanta, selectedMonth)
                ]);

                if (!isMounted) return;

                const items: DetalleGastoItem[] = [];

                // Agregamos gastos reales (foco principal de este desglose)
                realExpenses.forEach((g, idx) => {
                    let categoria: 'Hito' | 'Bodega' | 'Servicios Externos' | 'Gasto Correctivo' = 'Gasto Correctivo';

                    // Si está marcado como Hito, lo categorizamos como tal para el gráfico
                    if (g.esHito) {
                        categoria = 'Hito';
                    } else if (g.tipoGasto === 'BODEGA') {
                        categoria = 'Bodega';
                    } else if (g.tipoGasto === 'SERV_EXT') {
                        categoria = 'Servicios Externos';
                    } else {
                        categoria = 'Gasto Correctivo';
                    }

                    items.push({
                        id: `real-${idx}`,
                        concepto: `${g.descripcionOt || 'Gasto'} - ${g.descripcionArticulo || ''}`,
                        monto: g.costoTrx,
                        categoria,
                        fecha: typeof g.fechaTrx === 'string' ? g.fechaTrx : (g.fechaTrx as Date).toISOString().split('T')[0],
                        otId: g.numeroOt,
                        assetCategory: categorizeAsset(g.claseContable)
                    });
                });

                setDetails(items);
            } catch (e) {
                console.error(e);
                const msg = e instanceof Error ? e.message : 'Error desconocido';
                toast.error('Error al cargar el desglose de gastos: ' + msg);
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [selectedYear, selectedPlanta, selectedMonth, getPresupuesto, getGastosConsolidados]);

    // Filter Logic
    const filteredDetails = details.filter(item => {
        if (selectedAsset === 'Todos') return true;

        if (['Maquinaria', 'Redes', 'Infra'].includes(selectedAsset)) {
            return item.assetCategory === selectedAsset;
        }

        const matchesSearch = item.concepto.toLowerCase().includes(selectedAsset.toLowerCase()) ||
            item.otId.toLowerCase().includes(selectedAsset.toLowerCase());
        return matchesSearch;
    });

    // Group by category for Chart
    const categoryTotals = filteredDetails.reduce((acc, curr) => {
        acc[curr.categoria] = (acc[curr.categoria] || 0) + curr.monto;
        return acc;
    }, {} as Record<string, number>);

    const totalValue = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

    // Calculate conic gradient slices
    let cumulativePercent = 0;
    const categoryColors: Record<string, string> = {
        'Bodega': '#3b82f6', // pf-blue-500
        'Servicios Externos': '#14b8a6', // pf-success-500
        'Gasto Correctivo': '#e11d48', // pf-red
        'Hito': '#f59e0b' // pf-warning-500
    };

    const slices = Object.entries(categoryTotals).map(([cat, val]) => {
        if (totalValue === 0) return '';
        const start = cumulativePercent;
        const end = cumulativePercent + (val / totalValue) * 100;
        cumulativePercent = end;
        return `${categoryColors[cat] || '#94a3b8'} ${start}% ${end}%`;
    }).filter(Boolean).join(', ');

    const chartStyle = slices ? { background: `conic-gradient(${slices})` } : { background: '#f8fafc' };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);
    };

    return (
        <div className="space-y-8 relative min-h-[500px] animate-in fade-in duration-500">
            {loading && (
                <div className="absolute inset-0 bg-white/40 z-50 flex flex-col items-center justify-center rounded-[2.5rem] transition-all duration-500">
                    <div className="relative">
                        <Loader2 className="animate-spin text-pf-red mb-6" size={48} />
                        <div className="absolute inset-0 bg-pf-red opacity-10 animate-ping rounded-full"></div>
                    </div>
                    <p className="text-pf-neutral-800 font-black uppercase tracking-[0.3em] text-[10px] animate-pulse">Auditando Transacciones...</p>
                </div>
            )}

            {/* Controls */}
            <div className="flex flex-col md:flex-row gap-5 items-center bg-white p-6 rounded-[2rem] shadow-[0_4px_20px_rgb(0,0,0,0.03)] border border-pf-neutral-100">
                <div className="relative flex-1 w-full group">
                    <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-pf-neutral-300 group-focus-within:text-pf-red transition-colors" />
                    <input
                        type="text"
                        placeholder="Filtrar por Maestro de Activo o Concepto OT..."
                        className="w-full pl-12 pr-6 py-3.5 bg-pf-neutral-50/50 border border-pf-neutral-100 rounded-[1.25rem] focus:ring-4 focus:ring-pf-red/5 focus:border-pf-red outline-none text-sm font-medium text-pf-neutral-800 placeholder:text-pf-neutral-300 transition-all"
                        onChange={(e) => setSelectedAsset(e.target.value || 'Todos')}
                    />
                </div>
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div className="p-3.5 bg-pf-neutral-900 rounded-[1.25rem] text-white shadow-lg shadow-pf-neutral-900/10">
                        <Filter size={18} />
                    </div>
                    <select
                        className="flex-1 md:w-56 bg-pf-neutral-50 border border-pf-neutral-100 text-pf-neutral-800 text-[11px] font-black uppercase tracking-widest rounded-[1.25rem] focus:ring-4 focus:ring-pf-neutral-900/5 focus:border-pf-neutral-900 block p-3.5 outline-none transition-all cursor-pointer"
                        value={selectedAsset}
                        onChange={(e) => setSelectedAsset(e.target.value)}
                    >
                        <option value="Todos">Todos los Activos</option>
                        <option value="Maquinaria">MAQUINARIA INDUSTRIAL</option>
                        <option value="Redes">REDES Y SERVICIOS</option>
                        <option value="Infra">INFRAESTRUCTURA GENERAL</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-pf-neutral-100 flex flex-col items-center justify-center relative overflow-hidden group/chart">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-pf-neutral-50 rounded-bl-full opacity-50 group-hover/chart:bg-pf-red/5 transition-colors"></div>
                    <h3 className="text-sm font-black text-pf-neutral-800 uppercase tracking-[0.2em] mb-10 self-start italic pl-2 border-l-4 border-pf-red">Distribución del Gasto Real</h3>
                    <div className="relative w-72 h-72 flex items-center justify-center">
                        <div className="w-full h-full rounded-full transition-all duration-1000 shadow-[0_0_40px_rgba(0,0,0,0.05)] cursor-pointer hover:scale-105 active:scale-95" style={chartStyle}></div>
                        <div className="absolute w-52 h-52 bg-white rounded-full flex flex-col items-center justify-center shadow-[inset_0_2px_15px_rgba(0,0,0,0.08)] border border-pf-neutral-50">
                            <span className="text-pf-neutral-400 text-[10px] font-black uppercase tracking-[0.25em] mb-1">Total Ejecutado</span>
                            <span className="text-2xl font-black text-pf-neutral-800 italic">{formatCurrency(totalValue)}</span>
                        </div>
                    </div>

                    <div className="mt-12 grid grid-cols-2 gap-6 w-full">
                        {Object.entries(categoryTotals).map(([cat, amount]) => (
                            <div key={cat} className="flex items-center gap-4 bg-pf-neutral-50/50 p-3 rounded-2xl border border-pf-neutral-50 transition-all hover:bg-white hover:shadow-md active:scale-95 cursor-default group/item">
                                <div className={`w-3.5 h-3.5 rounded-full shadow-sm group-hover/item:scale-125 transition-transform ${cat === 'Bodega' ? 'bg-pf-blue-500 shadow-pf-blue-200' :
                                    cat === 'Servicios Externos' ? 'bg-pf-success-500 shadow-pf-success-200' :
                                        cat === 'Gasto Correctivo' ? 'bg-pf-red shadow-pf-red/30' : 'bg-pf-warning-500 shadow-pf-warning-200'
                                    }`}></div>
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-pf-neutral-400 mb-0.5">{cat}</span>
                                    <span className="text-sm font-black text-pf-neutral-800 italic tracking-tight">{formatCurrency(amount)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tabla de detalles */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-pf-neutral-100 flex flex-col overflow-hidden group/table">
                    <div className="p-8 border-b border-pf-neutral-100 bg-white group-hover/table:bg-pf-neutral-50/30 transition-colors">
                        <h3 className="text-sm font-black text-pf-neutral-800 uppercase tracking-[0.2em] italic border-l-4 border-pf-red pl-2">Detalle de Asignaciones</h3>
                    </div>
                    <div className="flex-1 overflow-auto max-h-[600px] custom-scrollbar">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-pf-neutral-900 text-pf-neutral-400 font-black uppercase tracking-widest text-[9px] sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="px-8 py-5">Concepto / Clasificación</th>
                                    <th className="px-6 py-5">Categoría Trx</th>
                                    <th className="px-6 py-5 text-right">Monto</th>
                                    <th className="px-8 py-5 text-right">Fecha Registro</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-pf-neutral-100">
                                {filteredDetails.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center py-24 text-pf-neutral-300 font-black uppercase tracking-[0.4em] text-[10px]">
                                            No se detectan transacciones.
                                        </td>
                                    </tr>
                                )}
                                {filteredDetails.map((item) => (
                                    <tr key={item.id} className="hover:bg-pf-neutral-50/80 transition-all group/row cursor-default">
                                        <td className="px-8 py-5">
                                            <div className="font-black text-pf-neutral-800 text-sm italic tracking-tight group-hover/row:text-pf-red transition-colors">{item.concepto}</div>
                                            <div className="flex items-center gap-3 mt-2">
                                                <span className="text-[10px] text-pf-neutral-400 font-black tracking-widest p-1 bg-pf-neutral-50 border border-pf-neutral-100 rounded-md">ID: {item.otId}</span>
                                                {item.assetCategory && (
                                                    <span className={`flex items-center gap-2 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border
                                                        ${item.assetCategory === 'Maquinaria' ? 'bg-pf-blue-500 text-white border-pf-blue-600 shadow-sm' :
                                                            item.assetCategory === 'Redes' ? 'bg-pf-success-500 text-white border-pf-success-600 shadow-sm' :
                                                                item.assetCategory === 'Infra' ? 'bg-pf-warning-500 text-white border-pf-warning-600 shadow-sm' :
                                                                    'bg-pf-neutral-800 text-white border-pf-neutral-900'}
                                                    `}>
                                                        {item.assetCategory === 'Maquinaria' && <Box size={10} />}
                                                        {item.assetCategory === 'Redes' && <Share2 size={10} />}
                                                        {item.assetCategory === 'Infra' && <Layers size={10} />}
                                                        {item.assetCategory}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className={`inline-flex px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border
                                                ${item.categoria === 'Gasto Correctivo' ? 'bg-pf-red/10 text-pf-red border-pf-red/20 shadow-sm shadow-pf-red/10' :
                                                    item.categoria === 'Hito' ? 'bg-pf-warning-500/10 text-pf-warning-600 border-pf-warning-200 shadow-sm shadow-pf-warning-200/10' :
                                                        'bg-pf-neutral-50 text-pf-neutral-500 border-pf-neutral-100'}
                                            `}>
                                                {item.categoria}
                                            </span>
                                        </td>
                                        <td className="px-6 py-5 text-right font-black text-pf-neutral-800 text-base italic tracking-tighter">
                                            {formatCurrency(item.monto)}
                                        </td>
                                        <td className="px-8 py-5 text-right text-pf-neutral-400 font-black uppercase tracking-tighter text-[10px]">
                                            {item.fecha}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
