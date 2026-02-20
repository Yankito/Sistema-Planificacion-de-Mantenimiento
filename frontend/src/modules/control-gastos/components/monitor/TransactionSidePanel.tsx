import React from 'react';
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
    if (!isOpen) return null;

    const getGastoStyles = (tipo: string) => {
        const t = (tipo || '').toUpperCase();
        if (t === 'BODEGA') return {
            bg: 'bg-blue-50',
            border: 'border-blue-100',
            text: 'text-blue-700',
            dot: 'bg-blue-500',
            label: 'text-blue-600'
        };
        if (t === 'SERV_EXT') return {
            bg: 'bg-emerald-50',
            border: 'border-emerald-100',
            text: 'text-emerald-700',
            dot: 'bg-emerald-500',
            label: 'text-emerald-600'
        };
        if (t === 'CORRECTIVO') return {
            bg: 'bg-red-50',
            border: 'border-red-100',
            text: 'text-red-700',
            dot: 'bg-red-500',
            label: 'text-red-600'
        };
        return {
            bg: 'bg-slate-50',
            border: 'border-slate-100',
            text: 'text-slate-700',
            dot: 'bg-slate-500',
            label: 'text-slate-600'
        };
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden flex justify-end">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

            <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
                {/* Panel Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                        <p className="text-xs text-slate-500">Detalle de transacciones encontradas</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 rounded-full transition-colors"
                    >
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                {/* Panel Content (Scrollable Table) */}
                <div className="flex-1 overflow-y-auto p-4">
                    {transactions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 italic gap-2">
                            <Info size={40} className="opacity-20" />
                            <p>No hay transacciones individuales registradas.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {transactions.map((trx, tIdx) => {
                                const styles = getGastoStyles(trx.tipoGasto);
                                return (
                                    <div key={tIdx} className={`bg-white border rounded-xl overflow-hidden shadow-sm group/card hover:shadow-md transition-all ${styles.border}`}>
                                        <div className={`px-4 py-2 border-b flex justify-between items-center ${styles.bg} ${styles.border}`}>
                                            <div className="flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full ${styles.dot}`}></div>
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${styles.label}`}>
                                                    {trx.tipoGasto}
                                                </span>
                                            </div>
                                            <span className="text-xs font-bold text-slate-400">
                                                ID: {trx.numeroOt || 'N/A'}
                                            </span>
                                        </div>

                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-3">
                                                <h4 className="text-sm font-bold text-slate-800 flex-1 leading-tight">{trx.descripcionArticulo}</h4>
                                                <span className="text-sm font-black text-slate-900 ml-4">
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

                {/* Panel Footer */}
                <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                        Total: {transactions.length} registros
                    </span>
                    <span className="text-sm font-bold text-slate-800">
                        Suma Total: {formatCurrency(transactions.reduce((acc, t) => acc + t.costoTrx, 0))}
                    </span>
                </div>
            </div>
        </div>
    );
};
