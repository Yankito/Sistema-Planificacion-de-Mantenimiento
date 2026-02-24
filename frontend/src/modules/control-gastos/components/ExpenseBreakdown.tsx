import { useState, useEffect } from 'react';
import type { DetalleGastoItem } from '../types';
import { Search, Filter, Loader2, Box, Share2, Layers } from 'lucide-react';
import { useControlGastos } from '../hooks/useControlGastos';
import { categorizeAsset } from '../utils/categorization';

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
        loadData();
    }, [selectedYear, selectedPlanta, selectedMonth]);

    const loadData = async () => {
        try {
            // Optimizamos: Pedimos solo los datos del mes seleccionado si aplica
            const [, realExpenses] = await Promise.all([
                getPresupuesto(selectedYear, selectedPlanta, undefined, selectedMonth),
                getGastosConsolidados(selectedYear, selectedPlanta, selectedMonth)
            ]);

            const items: DetalleGastoItem[] = [];

            // Agregamos gastos reales (foco principal de este desglose)
            realExpenses.forEach((g, idx) => {
                let categoria: any = 'Gasto Correctivo';

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
        }
    };

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
        'Bodega': '#3b82f6',
        'Servicios Externos': '#10b981',
        'Gasto Correctivo': '#ef4444',
        'Hito': '#f59e0b'
    };

    const slices = Object.entries(categoryTotals).map(([cat, val]) => {
        if (totalValue === 0) return '';
        const start = cumulativePercent;
        const end = cumulativePercent + (val / totalValue) * 100;
        cumulativePercent = end;
        return `${categoryColors[cat] || '#cbd5e1'} ${start}% ${end}%`;
    }).filter(Boolean).join(', ');

    const chartStyle = slices ? { background: `conic-gradient(${slices})` } : { background: '#f1f5f9' };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(val);
    };

    return (
        <div className="space-y-6 relative min-h-[400px]">
            {loading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center rounded-2xl min-h-[400px]">
                    <Loader2 className="animate-spin text-pf-red mb-4" size={40} />
                    <p className="text-slate-600 font-bold uppercase tracking-wider text-xs animate-pulse">Analizando transacciones...</p>
                </div>
            )}

            {/* Controls */}
            <div className="flex gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar por Activo o Concepto..."
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-300 outline-none text-sm text-slate-700 placeholder:text-slate-400"
                        onChange={(e) => setSelectedAsset(e.target.value || 'Todos')}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-slate-400" />
                    <select
                        className="bg-slate-50 border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-2.5"
                        value={selectedAsset}
                        onChange={(e) => setSelectedAsset(e.target.value)}
                    >
                        <option value="Todos">Todos los Activos</option>
                        <option value="Maquinaria">Maquinaria</option>
                        <option value="Redes">Redes</option>
                        <option value="Infra">Infraestructura</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center">
                    <h3 className="text-lg font-bold text-slate-700 mb-6 self-start">Distribución del Gasto Real</h3>
                    <div className="relative w-64 h-64 flex items-center justify-center">
                        <div className="w-full h-full rounded-full transition-all duration-700" style={chartStyle}></div>
                        <div className="absolute w-44 h-44 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
                            <span className="text-slate-400 text-[10px] font-medium uppercase tracking-wider">Total Ejecutado</span>
                            <span className="text-xl font-black text-slate-800">{formatCurrency(totalValue)}</span>
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4 w-full">
                        {Object.entries(categoryTotals).map(([cat, amount]) => (
                            <div key={cat} className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${cat === 'Bodega' ? 'bg-blue-500' :
                                    cat === 'Servicios Externos' ? 'bg-emerald-500' :
                                        cat === 'Gasto Correctivo' ? 'bg-red-500' : 'bg-orange-500'
                                    }`}></div>
                                <div className="flex flex-col">
                                    <span className="text-xs text-slate-500">{cat}</span>
                                    <span className="text-sm font-bold text-slate-700">{formatCurrency(amount)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Tabla de detalles */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800">Detalle de Asignaciones</h3>
                    </div>
                    <div className="flex-1 overflow-auto max-h-[500px]">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-500 font-medium sticky top-0">
                                <tr>
                                    <th className="px-6 py-3">Concepto / Clasificación</th>
                                    <th className="px-6 py-3">Tipo Gasto</th>
                                    <th className="px-6 py-3 text-right">Monto</th>
                                    <th className="px-6 py-3 text-right">Fecha Ref.</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredDetails.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="text-center py-8 text-slate-500">
                                            No hay datos cargados.
                                        </td>
                                    </tr>
                                )}
                                {filteredDetails.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-3">
                                            <div className="font-medium text-slate-800">{item.concepto}</div>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="text-[10px] text-slate-400 font-mono">{item.otId}</span>
                                                {item.assetCategory && (
                                                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase
                                                        ${item.assetCategory === 'Maquinaria' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                            item.assetCategory === 'Redes' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                                item.assetCategory === 'Infra' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                                    'bg-slate-50 text-slate-500 border-slate-100'}
                                                    `}>
                                                        {item.assetCategory === 'Maquinaria' && <Box size={10} />}
                                                        {item.assetCategory === 'Redes' && <Share2 size={10} />}
                                                        {item.assetCategory === 'Infra' && <Layers size={10} />}
                                                        {item.assetCategory}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className={`inline-flex px-2 py-1 rounded text-xs font-bold
                                                ${item.categoria === 'Gasto Correctivo' ? 'bg-red-100 text-red-700' :
                                                    item.categoria === 'Hito' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-slate-100 text-slate-600'}
                                            `}>
                                                {item.categoria}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right font-mono text-slate-700">
                                            {formatCurrency(item.monto)}
                                        </td>
                                        <td className="px-6 py-3 text-right text-slate-500">
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
