import React, { useState, useEffect } from 'react';
import { X, Info, AlertCircle, ExternalLink } from 'lucide-react';
import type { GastoConsolidadoRow } from '../../types';

interface TransactionSidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    transactions: GastoConsolidadoRow[];
    formatCurrency: (val: number) => string;
}

export const TransactionSidePanel: React.FC<TransactionSidePanelProps> = ({
    isOpen,
    onClose,
    title,
    transactions,
    formatCurrency
}) => {
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

    // Reiniciar selección cuando cambian las transacciones (se abre el panel para otro activo/tipo)
    useEffect(() => {
        setSelectedIndices(new Set());
    }, [transactions, isOpen]);

    if (!isOpen) return null;

    const toggleSelection = (index: number) => {
        const newSelected = new Set(selectedIndices);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedIndices(newSelected);
    };

    const clearSelection = () => setSelectedIndices(new Set());

    const selectedSum = Array.from(selectedIndices).reduce((acc, idx) => {
        return acc + (transactions[idx]?.costoTrx || 0);
    }, 0);

    const getGastoStyles = (tipo: string) => {
        const t = (tipo || '').toUpperCase();
        if (t === 'BODEGA') return {
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            text: 'text-blue-700',
            dot: 'bg-blue-500',
            label: 'text-blue-600',
            checkbox: 'border-blue-300'
        };
        if (t === 'SERV_EXT') return {
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            text: 'text-emerald-700',
            dot: 'bg-emerald-500',
            label: 'text-emerald-600',
            checkbox: 'border-emerald-300'
        };
        if (t === 'CORRECTIVO') return {
            bg: 'bg-red-50',
            border: 'border-red-100',
            text: 'text-red-700',
            dot: 'bg-red-500',
            label: 'text-red-600',
            checkbox: 'border-red-300'
        };
        return {
            bg: 'bg-slate-50',
            border: 'border-slate-100',
            text: 'text-slate-700',
            dot: 'bg-slate-500',
            label: 'text-slate-600',
            checkbox: 'border-slate-300'
        };
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
                {/* Panel Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white shadow-sm z-10">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                        <p className="text-xs text-slate-500">Haz clic en las tarjetas para sumar gastos específicos</p>
                    </div>
                    <div className="flex items-center gap-2">
                        {selectedIndices.size > 0 && (
                            <button
                                onClick={clearSelection}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 px-3 py-1.5 bg-blue-50 rounded-lg transition-colors uppercase tracking-wider"
                            >
                                Limpiar Selección ({selectedIndices.size})
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                        >
                            <X size={20} className="text-slate-500" />
                        </button>
                    </div>
                </div>

                {/* Panel Content (Scrollable Table) */}
                <div className="flex-1 overflow-y-auto p-4 pb-32">
                    {transactions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 italic gap-2">
                            <Info size={40} className="opacity-20" />
                            <p>No hay transacciones individuales registradas.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {transactions.map((trx, tIdx) => {
                                const styles = getGastoStyles(trx.tipoGasto);
                                const isSelected = selectedIndices.has(tIdx);
                                return (
                                    <div
                                        key={tIdx}
                                        onClick={() => toggleSelection(tIdx)}
                                        className={`bg-white border rounded-xl overflow-hidden shadow-sm group/card hover:shadow-md transition-all cursor-pointer relative ${isSelected ? 'ring-2 ring-blue-500 scale-[0.99] shadow-inner' : styles.border}`}
                                    >
                                        <div className={`px-4 py-2 border-b flex justify-between items-center ${styles.bg} ${styles.border}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'bg-white ' + styles.checkbox}`}>
                                                    {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${styles.dot}`}></div>
                                                    <span className={`text-[10px] font-black uppercase tracking-wider ${styles.label}`}>
                                                        {trx.tipoGasto}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-slate-400">
                                                ID: {trx.numeroOt || 'N/A'}
                                            </span>
                                        </div>

                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="text-sm font-bold text-slate-800 flex-1 leading-tight">{trx.descripcionArticulo}</h4>
                                                <span className={`text-sm font-black ml-4 ${isSelected ? 'text-blue-600' : 'text-slate-900'}`}>
                                                    {formatCurrency(trx.costoTrx)}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-y-2 gap-x-4 mt-4 border-t border-slate-50 pt-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-slate-400 uppercase font-bold">OT Relacionada</span>
                                                    <div className="flex items-center gap-1 text-xs font-semibold text-slate-600">
                                                        {trx.numeroOt || 'N/A'}
                                                        {trx.numeroOt && <ExternalLink size={10} className="text-slate-400 opacity-0 group-hover/card:opacity-100 transition-opacity" />}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-slate-400 uppercase font-bold">Fecha Transacción</span>
                                                    <span className="text-xs font-semibold text-slate-600">
                                                        {trx.fechaTrx ? new Date(trx.fechaTrx).toLocaleDateString('es-CL') : 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col col-span-2 bg-slate-50/50 p-2 rounded-lg mt-1">
                                                    <span className="text-[9px] text-slate-400 uppercase font-bold mb-1">Descripción OT</span>
                                                    <span className="text-xs text-slate-500 italic leading-snug">
                                                        {trx.descripcionOt || 'Sin descripción'}
                                                    </span>
                                                </div>
                                            </div>

                                            {trx.alertaFecha === 1 && (
                                                <div className="mt-3 flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-100 text-[10px] font-medium">
                                                    <AlertCircle size={12} />
                                                    La fecha de programa no coincide con el periodo de transacción.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Panel Footer bar for selection */}
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-slate-100">
                    {selectedIndices.size > 0 ? (
                        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-4 duration-300">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-400 mb-1">Total Seleccionado</span>
                                <div className="flex items-baseline gap-2">
                                    <h4 className="text-2xl font-black tabular-nums">{formatCurrency(selectedSum)}</h4>
                                    <span className="text-xs text-slate-400 font-medium">({selectedIndices.size} items)</span>
                                </div>
                            </div>
                            <button
                                onClick={clearSelection}
                                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors border border-slate-700"
                            >
                                Desmarcar
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between px-2 py-2">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-bold text-slate-400 uppercase">Resumen del grupo</span>
                                <span className="text-xs font-bold text-slate-600">{transactions.length} transacciones en total</span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Suma Total</span>
                                <span className="text-lg font-black text-slate-800">{formatCurrency(transactions.reduce((acc, t) => acc + t.costoTrx, 0))}</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
