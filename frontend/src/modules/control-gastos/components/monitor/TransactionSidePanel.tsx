import React, { useState } from 'react';
import { X, Info, AlertCircle, ExternalLink } from 'lucide-react';
import type { GastoConsolidadoRow } from '../../types';

interface TransactionSidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    transactions: GastoConsolidadoRow[];
    formatCurrency: (val: number) => string;
    totalContextBudget?: number;
}

export const TransactionSidePanel: React.FC<TransactionSidePanelProps> = ({
    isOpen,
    onClose,
    title,
    transactions,
    formatCurrency,
    totalContextBudget
}) => {
    const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

    const [prevTransactions, setPrevTransactions] = useState(transactions);
    const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

    // Reiniciar selección cuando cambian las transacciones (se abre el panel para otro activo/tipo)
    if (transactions !== prevTransactions || isOpen !== prevIsOpen) {
        setPrevTransactions(transactions);
        setPrevIsOpen(isOpen);
        setSelectedIndices(new Set());
    }

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

    const totalTransactionsSum = transactions.reduce((acc, t) => acc + t.costoTrx, 0);

    const getGastoStyles = (tipo?: string) => {
        const t = (tipo || '').toUpperCase();
        if (t === 'BODEGA') return {
            bg: 'bg-pf-blue-50',
            border: 'border-pf-blue-100',
            text: 'text-pf-blue-700',
            dot: 'bg-pf-blue-500',
            label: 'text-pf-blue-600',
            checkbox: 'border-pf-blue-300'
        };
        if (t === 'SERV_EXT') return {
            bg: 'bg-pf-success-50',
            border: 'border-pf-success-100',
            text: 'text-pf-success-700',
            dot: 'bg-pf-success-500',
            label: 'text-pf-success-600',
            checkbox: 'border-pf-success-300'
        };
        if (t === 'CORRECTIVO') return {
            bg: 'bg-pf-red-50',
            border: 'border-pf-red-100',
            text: 'text-pf-red-700',
            dot: 'bg-pf-red',
            label: 'text-pf-red-600',
            checkbox: 'border-pf-red-300'
        };
        return {
            bg: 'bg-pf-neutral-50',
            border: 'border-pf-neutral-100',
            text: 'text-pf-neutral-700',
            dot: 'bg-pf-neutral-500',
            label: 'text-pf-neutral-600',
            checkbox: 'border-pf-neutral-300'
        };
    };

    return (
        <div className="fixed inset-0 z-[100] overflow-hidden flex justify-end">
            <div className="absolute inset-0 bg-pf-neutral-900/40 backdrop-blur-md transition-opacity duration-500" onClick={onClose}></div>

            <div className="relative w-full max-w-2xl bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] h-full flex flex-col animate-in slide-in-from-right duration-500 rounded-l-[3rem] border-l border-pf-neutral-100">
                {/* Panel Header */}
                <div className="px-8 py-6 border-b border-pf-neutral-100 flex items-center justify-between bg-white/80 backdrop-blur-md rounded-tl-[3rem] sticky top-0 z-10">
                    <div>
                        <h3 className="text-xl font-black text-pf-neutral-800 select-text uppercase tracking-tight">{title}</h3>
                        <p className="text-[10px] text-pf-neutral-400 font-black uppercase tracking-widest mt-1">Suma y compara transacciones contra presupuesto</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {selectedIndices.size > 0 && (
                            <button
                                onClick={clearSelection}
                                className="text-[10px] font-black text-pf-blue-600 hover:text-white px-4 py-2 bg-pf-blue-50 border border-pf-blue-100 hover:bg-pf-blue-600 rounded-xl transition-all uppercase tracking-widest flex items-center gap-2 active:scale-95"
                            >
                                <X size={12} />
                                Limpiar ({selectedIndices.size})
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-3 hover:bg-pf-neutral-900 hover:text-white rounded-2xl transition-all active:scale-95 text-pf-neutral-400 border border-transparent hover:border-pf-neutral-900"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Panel Content (Scrollable Table) */}
                <div className="flex-1 overflow-y-auto p-8 pb-48 custom-scrollbar">
                    {transactions.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-pf-neutral-300 gap-6">
                            <div className="p-8 bg-pf-neutral-50 rounded-full border border-pf-neutral-100 shadow-inner">
                                <Info size={48} className="opacity-30" />
                            </div>
                            <p className="font-black uppercase tracking-[0.2em] text-xs">No hay registros detallados</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {transactions.map((trx, tIdx) => {
                                const styles = getGastoStyles(trx.tipoGasto);
                                const isSelected = selectedIndices.has(tIdx);
                                return (
                                    <div
                                        key={tIdx}
                                        onClick={() => toggleSelection(tIdx)}
                                        className={`bg-white border rounded-[1.5rem] overflow-hidden shadow-sm group/card hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer relative ${isSelected ? 'ring-4 ring-pf-blue-500/10 border-pf-blue-500 shadow-pf-blue-100' : styles.border}`}
                                    >
                                        <div className={`px-5 py-3 border-b flex justify-between items-center ${styles.bg} ${styles.border}`}>
                                            <div className="flex items-center gap-4">
                                                <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${isSelected ? 'bg-pf-blue-600 border-pf-blue-600 rotate-12 scale-110 shadow-lg shadow-pf-blue-200' : 'bg-white ' + styles.checkbox}`}>
                                                    {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${styles.dot}`}></div>
                                                    <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${styles.label}`}>
                                                        {trx.tipoGasto}
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-black text-pf-neutral-400 uppercase tracking-widest bg-white/50 px-2 py-1 rounded-md">
                                                OT: {trx.numeroOt || 'SIN ID'}
                                            </span>
                                        </div>

                                        <div className="p-5">
                                            <div className="flex justify-between items-start mb-5 gap-6">
                                                <h4 className="text-sm font-black text-pf-neutral-800 flex-1 leading-tight tracking-tight">{trx.descripcionArticulo}</h4>
                                                <div className="flex flex-col items-end">
                                                    <span className={`text-lg font-black tracking-tighter ${isSelected ? 'text-pf-blue-600' : 'text-black'}`}>
                                                        {formatCurrency(trx.costoTrx)}
                                                    </span>
                                                    <span className="text-[8px] font-black text-pf-neutral-300 uppercase tracking-[0.2em]">Costo Transacción</span>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-y-4 gap-x-6 mt-4 border-t border-pf-neutral-50 pt-5">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-pf-neutral-400 uppercase font-black tracking-widest mb-1.5">OT EAM</span>
                                                    <div className="flex items-center gap-2 text-xs font-bold text-pf-neutral-700 select-text">
                                                        {trx.numeroOt || 'N/A'}
                                                        {trx.numeroOt && <ExternalLink size={12} className="text-pf-neutral-300 opacity-0 group-hover/card:opacity-100 transition-opacity cursor-help" />}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-pf-neutral-400 uppercase font-black tracking-widest mb-1.5">Categoría OT</span>
                                                    <div className="flex items-center gap-1 text-xs font-bold text-pf-neutral-700 select-text">
                                                        {trx.tipoOt || 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-pf-neutral-400 uppercase font-black tracking-widest mb-1.5">Estado Gestión</span>
                                                    <div className={`flex items-center gap-1 text-[9px] font-black px-2 py-1 rounded-lg w-fit border uppercase tracking-widest shadow-sm ${trx.estadoTrabajo === 'LIBERADO' ? 'bg-pf-success-50 text-pf-success-600 border-pf-success-100' :
                                                        trx.estadoTrabajo === 'Liberado' ? 'bg-pf-blue-50 text-pf-blue-600 border-pf-blue-100' :
                                                            trx.estadoTrabajo === 'Finalizar - Sin Cargos' ? 'bg-pf-neutral-50 text-pf-neutral-400 border-pf-neutral-100' :
                                                                'bg-white text-pf-neutral-600 border-pf-neutral-100'
                                                        }`}>
                                                        {trx.estadoTrabajo || 'N/A'}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-pf-neutral-400 uppercase font-black tracking-widest mb-1.5">Fecha Programa</span>
                                                    <span className={`text-xs font-bold ${trx.alertaFecha === 1 ? 'text-pf-blue-500' : 'text-pf-neutral-600'}`}>
                                                        {trx.fechaOtPro ? new Date(trx.fechaOtPro).toLocaleDateString('es-CL') : 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-pf-neutral-400 uppercase font-black tracking-widest mb-1.5">Registro Contable</span>
                                                    <span className="text-xs font-bold text-pf-neutral-600 select-text">
                                                        {trx.fechaTrx ? new Date(trx.fechaTrx).toLocaleDateString('es-CL') : 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-col col-span-2 bg-pf-neutral-50/50 p-3 rounded-xl mt-1 border border-pf-neutral-100/50">
                                                    <span className="text-[9px] text-pf-neutral-400 uppercase font-black tracking-widest mb-1.5">Resumen de Trabajo</span>
                                                    <span className="text-xs text-pf-neutral-500 leading-snug select-text">
                                                        {trx.descripcionOt || 'Descripción de OT no disponible en el sistema.'}
                                                    </span>
                                                </div>
                                            </div>

                                            {trx.alertaFecha === 1 && (
                                                <div className="mt-4 flex items-center gap-3 bg-pf-blue-50 text-pf-blue-700 px-4 py-2 rounded-xl border border-pf-blue-100 text-[10px] font-black uppercase tracking-widest shadow-sm">
                                                    <AlertCircle size={14} className="animate-pulse" />
                                                    Desfase Temporal: Gastos fuera de periodo programado.
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
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-white/90 backdrop-blur-xl border-t border-pf-neutral-100 shadow-[0_-20px_40px_rgba(0,0,0,0.05)] rounded-t-[2.5rem]">
                    {selectedIndices.size > 0 ? (
                        <div className="bg-pf-neutral-900 text-white rounded-[2rem] p-6 shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom-6 duration-500 ring-4 ring-pf-neutral-900/5">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-pf-blue-400 mb-1.5">Suma Comparativa</span>
                                    <h4 className="text-3xl font-black tabular-nums tracking-tighter">{formatCurrency(selectedSum)}</h4>
                                </div>
                                <button
                                    onClick={clearSelection}
                                    className="bg-pf-neutral-800 hover:bg-pf-red text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-pf-neutral-700 active:scale-95 shadow-lg"
                                >
                                    Reiniciar
                                </button>
                            </div>

                            {totalContextBudget !== undefined && (
                                <div className="space-y-3 border-t border-pf-neutral-800 pt-4">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-pf-neutral-400">Consumo Proporcional ({title})</span>
                                        <span className={selectedSum > totalContextBudget ? 'text-pf-red shadow-sm' : 'text-pf-success-400'}>
                                            {((selectedSum / (totalContextBudget || 1)) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-pf-neutral-800 rounded-full h-3 overflow-hidden border border-pf-neutral-700 p-0.5">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 shadow-sm ${selectedSum > totalContextBudget ? 'bg-pf-red shadow-pf-red/20' : 'bg-pf-success-500 shadow-pf-success-500/20'}`}
                                            style={{ width: `${Math.min((selectedSum / (totalContextBudget || 1)) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between items-center text-[10px] text-pf-neutral-500 font-bold uppercase tracking-tighter">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-pf-neutral-600"></div>
                                            <span>Meta: {formatCurrency(totalContextBudget)}</span>
                                        </div>
                                        <span className={selectedSum > totalContextBudget ? 'text-pf-red animate-pulse' : 'text-pf-neutral-400'}>
                                            {selectedSum > totalContextBudget ? 'Sobregiro: ' : 'Remanente: '}
                                            {formatCurrency(Math.abs(totalContextBudget - selectedSum))}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4 px-2">
                            <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-pf-neutral-400 uppercase tracking-widest mb-1">Métricas de Grupo</span>
                                    <span className="text-xs font-black text-pf-neutral-600 tracking-tighter">{transactions.length} Transacciones registradas</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-black text-pf-neutral-400 uppercase tracking-widest mb-1">Gasto Total Real</span>
                                    <span className={`text-2xl font-black tabular-nums tracking-tighter ${totalContextBudget && totalTransactionsSum > totalContextBudget ? 'text-pf-red' : 'text-pf-neutral-800'}`}>
                                        {formatCurrency(totalTransactionsSum)}
                                    </span>
                                </div>
                            </div>

                            {totalContextBudget !== undefined && (
                                <div className="space-y-2">
                                    <div className="w-full bg-pf-neutral-100 rounded-full h-2 overflow-hidden border border-pf-neutral-200/50 p-0.5 shadow-inner">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${totalTransactionsSum > totalContextBudget ? 'bg-pf-red shadow-pf-red/10' : 'bg-pf-success-500/80 shadow-pf-success-500/10'}`}
                                            style={{ width: `${Math.min((totalTransactionsSum / (totalContextBudget || 1)) * 100, 100)}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-pf-neutral-400">
                                        <span className="flex items-center gap-2">
                                            <Info size={12} className="text-pf-neutral-300" />
                                            Presupuesto Asignado: {formatCurrency(totalContextBudget)}
                                        </span>
                                        <span className={totalTransactionsSum > totalContextBudget ? 'text-pf-red' : 'text-pf-success-600'}>
                                            Efectividad: {((totalTransactionsSum / (totalContextBudget || 1)) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

