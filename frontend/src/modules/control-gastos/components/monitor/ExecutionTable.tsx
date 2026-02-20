import React, { Fragment } from 'react';
import {
    Calendar, Search, ChevronDown, ChevronRight, AlertCircle,
    ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft
} from 'lucide-react';
import type { CostCenterGroup, SortField, SortOrder } from './types';
import type { GastoConsolidadoRow } from '../../types';
import { Tooltip } from './Tooltip';

interface ExecutionTableProps {
    paginatedData: CostCenterGroup[];
    totalItems: number;
    currentPage: number;
    totalPages: number;
    expandedGroups: Record<string, boolean>;
    sortField: SortField;
    sortOrder: SortOrder;
    onToggleGroup: (cc: string) => void;
    onPageChange: (page: number) => void;
    onSort: (field: SortField) => void;
    formatCurrency: (val: number) => string;
    calculateDeviation: (real: number, budget: number) => number;
    onShowDetails: (title: string, transactions: GastoConsolidadoRow[], budget?: number) => void;
    getGroupTransactions: (cc: string) => GastoConsolidadoRow[];
    getAssetTransactions: (activo: string, isHito: boolean) => GastoConsolidadoRow[];
    getTypeTransactions: (activo: string, isHito: boolean, type: string) => GastoConsolidadoRow[];
    itemsPerPage: number;
}

export const ExecutionTable: React.FC<ExecutionTableProps> = ({
    paginatedData,
    totalItems,
    currentPage,
    totalPages,
    expandedGroups,
    sortField,
    sortOrder,
    onToggleGroup,
    onPageChange,
    onSort,
    formatCurrency,
    calculateDeviation,
    onShowDetails,
    getGroupTransactions,
    getAssetTransactions,
    getTypeTransactions,
    itemsPerPage
}) => {
    const renderSortIcon = (field: SortField) => {
        if (sortField !== field) return <ArrowUpDown size={14} className="ml-1 opacity-30" />;
        return sortOrder === 'asc' ? <ArrowUp size={14} className="ml-1 text-blue-600" /> : <ArrowDown size={14} className="ml-1 text-blue-600" />;
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Calendar size={20} className="text-slate-400" />
                    Monitoreo de Ejecución
                </h2>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-500 rounded">Total filtrados: {totalItems}</span>
                    {totalPages > 1 && (
                        <span className="text-xs font-medium px-2 py-1 bg-blue-50 text-blue-600 rounded">Pagina {currentPage} de {totalPages}</span>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50/50">
                        <tr>
                            <th className="px-6 py-4 text-left font-semibold text-slate-600 cursor-pointer hover:text-blue-600 select-none" onClick={() => onSort('centroCosto')}>
                                <div className="flex items-center">Centro Costo / Activo {renderSortIcon('centroCosto')}</div>
                            </th>
                            <th className="px-6 py-4 text-right font-semibold text-slate-600 cursor-pointer hover:text-blue-600 select-none" onClick={() => onSort('totalBudget')}>
                                <div className="flex items-center justify-end">Presupuesto {renderSortIcon('totalBudget')}</div>
                            </th>
                            <th className="px-6 py-4 text-right font-semibold text-slate-600 cursor-pointer hover:text-blue-600 select-none" onClick={() => onSort('totalReal')}>
                                <div className="flex items-center justify-end">Real {renderSortIcon('totalReal')}</div>
                            </th>
                            <th className="px-6 py-4 text-right font-semibold text-slate-600 cursor-pointer hover:text-blue-600 select-none" onClick={() => onSort('deviation')}>
                                <div className="flex items-center justify-end">% Desv. {renderSortIcon('deviation')}</div>
                            </th>
                            <th className="px-6 py-4 text-left font-semibold text-slate-600">Progreso</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {paginatedData.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-12">
                                    <div className="flex flex-col items-center justify-center text-slate-400 italic">
                                        <Search size={40} className="mb-2 opacity-20" />
                                        <p>No hay datos que coincidan con los filtros.</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                        {paginatedData.map((group, groupIdx) => {
                            const isExpanded = expandedGroups[group.centroCosto];
                            const isOver = group.totalReal > group.totalBudget && group.totalBudget > 0;

                            return (
                                <Fragment key={group.centroCosto}>
                                    {groupIdx > 0 && (
                                        <tr className="h-1 bg-slate-80/40 select-none">
                                            <td colSpan={5} className="p-0">
                                                <div className="w-full h-full border-y border-slate-200"></div>
                                            </td>
                                        </tr>
                                    )}
                                    {/* Group Header */}
                                    <tr className={`hover:bg-slate-50 cursor-pointer transition-colors ${isExpanded ? 'bg-slate-50/50' : ''}`} onClick={() => onToggleGroup(group.centroCosto)}>
                                        <td className="px-6 py-4 font-bold text-slate-700">
                                            <div className="flex items-center gap-3">
                                                {isExpanded ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
                                                <div className="flex flex-col">
                                                    <span>{group.centroCosto}</span>
                                                    <span className="text-[10px] font-normal text-slate-400 uppercase tracking-tighter">Centro de Costo</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-700">{formatCurrency(group.totalBudget)}</td>
                                        <td className="px-6 py-4 text-right font-bold text-slate-700">
                                            <div
                                                className="flex items-center justify-end gap-2 hover:text-blue-600 transition-colors group/real"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onShowDetails(`Gastos: ${group.centroCosto}`, getGroupTransactions(group.centroCosto), group.totalBudget);
                                                }}
                                            >
                                                {group.assets.some(a => a.hasActiveOT) ? (
                                                    <Tooltip content="CRÍTICO: Centro de costo con exceso de presupuesto en categoría y OTs aún LIBERADAS">
                                                        <AlertCircle size={14} className="text-pf-red animate-pulse" />
                                                    </Tooltip>
                                                ) : isOver ? (
                                                    <Tooltip content="Presupuesto del centro de costo excedido (OTs Finalizadas)">
                                                        <AlertCircle size={14} className="text-amber-500" />
                                                    </Tooltip>
                                                ) : (
                                                    <>
                                                        {group.assets.some(a =>
                                                            a.details.some(d => d.real > d.budget && d.budget > 0) ||
                                                            (a.totalReal > a.totalBudget && a.totalBudget > 0)
                                                        ) && (
                                                                <Tooltip content="Alerta: Desviación interna en categorías">
                                                                    <AlertCircle size={14} className="text-amber-500/70" />
                                                                </Tooltip>
                                                            )}
                                                        {group.assets.some(a => a.hasDateAlert) && (
                                                            <Tooltip content="Alerta: Transacciones en meses fuera de programa">
                                                                <AlertCircle size={14} className="text-indigo-500" />
                                                            </Tooltip>
                                                        )}
                                                    </>
                                                )}
                                                <span className="border-b border-transparent group-hover/real:border-blue-600 cursor-pointer">
                                                    {formatCurrency(group.totalReal)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className={`px-6 py-4 text-right font-bold ${isOver ? 'text-pf-red' : group.deviation > 90 ? 'text-amber-600' : 'text-emerald-600'}`}>
                                            {group.deviation.toFixed(1)}%
                                        </td>
                                        <td className="px-6 py-4 w-48">
                                            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden border border-slate-300/50">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-pf-red' : 'bg-emerald-500'}`}
                                                    style={{ width: `${Math.min((group.totalReal / (group.totalBudget || 1)) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Assets grouped by type (Mensual, Hito, etc.) */}
                                    {isExpanded && (() => {
                                        const types = Array.from(new Set(group.assets.map(a => a.tipoFila))).sort((a, b) => {
                                            const aLower = a.toLowerCase();
                                            const bLower = b.toLowerCase();
                                            if (aLower.includes('mensual')) return -1;
                                            if (bLower.includes('mensual')) return 1;
                                            if (aLower.includes('hito')) return -1;
                                            if (bLower.includes('hito')) return 1;
                                            return a.localeCompare(b);
                                        });

                                        return types.map(type => (
                                            <Fragment key={`${group.centroCosto}-${type}`}>
                                                {/* Category Separator Row */}
                                                <tr className="bg-slate-100/30 border-y border-slate-200/40">
                                                    <td colSpan={5} className="px-6 py-1.5 pl-10">
                                                        <div className="flex items-center gap-3">
                                                            <div className="h-px flex-1 bg-slate-200"></div>
                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap px-2">
                                                                {type}
                                                            </span>
                                                            <div className="h-px flex-1 bg-slate-200"></div>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {group.assets.filter(a => a.tipoFila === type).map((asset, assetIdx) => {
                                                    const isHito = asset.tipoFila.toLowerCase().includes('hito');
                                                    return (
                                                        <Fragment key={`${group.centroCosto}-${asset.activo}-${assetIdx}`}>
                                                            <tr className="bg-white hover:bg-slate-50 transition-colors">
                                                                <td className="px-6 py-3 pl-14 text-slate-800 font-medium">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        <span className="text-xs font-bold text-slate-700">{asset.activo}</span>
                                                                        {asset.planta && (
                                                                            <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase">
                                                                                {asset.planta}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-3 text-right text-slate-500 text-xs font-medium">{formatCurrency(asset.totalBudget)}</td>
                                                                <td className="px-6 py-3 text-right text-slate-600 font-bold text-xs">
                                                                    <div
                                                                        className="flex items-center justify-end gap-2 text-xs hover:text-blue-600 transition-colors group/asset"
                                                                        onClick={() => onShowDetails(`Activo: ${asset.activo}`, getAssetTransactions(asset.activo, isHito), asset.totalBudget)}
                                                                    >
                                                                        {asset.hasActiveOT ? (
                                                                            <Tooltip content="CRÍTICO: Presupuesto de categoría excedido con OT todavía LIBERADA">
                                                                                <AlertCircle size={12} className="text-pf-red animate-pulse" />
                                                                            </Tooltip>
                                                                        ) : (asset.totalReal > asset.totalBudget && asset.totalBudget > 0) ? (
                                                                            <Tooltip content="Presupuesto excedido (OT Finalizada/Cerrada)">
                                                                                <AlertCircle size={12} className="text-amber-500" />
                                                                            </Tooltip>
                                                                        ) : (
                                                                            asset.details.some(d => d.real > d.budget && d.budget > 0) && (
                                                                                <Tooltip content="Alerta: Desviación interna en categorías (ej: Bodega vs Hito)">
                                                                                    <AlertCircle size={12} className="text-amber-500/70" />
                                                                                </Tooltip>
                                                                            )
                                                                        )}
                                                                        {asset.hasDateAlert && (
                                                                            <Tooltip content="Gastos fuera de periodo">
                                                                                <AlertCircle size={12} className="text-indigo-500" />
                                                                            </Tooltip>
                                                                        )}
                                                                        <span className="border-b border-dashed border-slate-300 group-hover/asset:border-blue-600 cursor-pointer">
                                                                            {formatCurrency(asset.totalReal)}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className={`px-6 py-3 text-right text-xs font-black ${asset.totalReal > asset.totalBudget && asset.totalBudget > 0 ? 'text-pf-red' : 'text-slate-600'}`}>
                                                                    {asset.deviation.toFixed(1)}%
                                                                </td>
                                                                <td className="px-6 py-3">
                                                                    <div className="w-32 bg-slate-200/60 rounded-full h-1.5 overflow-hidden border border-slate-300/30">
                                                                        <div
                                                                            className={`h-full rounded-full transition-all duration-700 ${asset.totalReal > asset.totalBudget && asset.totalBudget > 0 ? 'bg-pf-red/70' : 'bg-emerald-400/80'}`}
                                                                            style={{ width: `${Math.min((asset.totalReal / (asset.totalBudget || 1)) * 100, 100)}%` }}
                                                                        />
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            {/* Details Breakdown */}
                                                            {asset.details.map((detail, dIdx) => {
                                                                const progress = Math.min((detail.real / (detail.budget || 1)) * 100, 100);
                                                                const isOverDetail = detail.real > (detail.budget || 0) && detail.budget > 0;
                                                                const devDetail = calculateDeviation(detail.real, detail.budget);

                                                                return (
                                                                    <tr key={`${group.centroCosto}-${asset.activo}-${assetIdx}-${dIdx}`} className="text-[11px] bg-slate-50/20 group/detail">
                                                                        <td className="px-6 py-1.5 pl-20 text-slate-600 font-medium flex items-center gap-2">
                                                                            <div className={`w-1.5 h-1.5 rounded-full ${detail.tipo === 'Bodega' ? 'bg-blue-400' :
                                                                                detail.tipo === 'Serv. Externos' ? 'bg-emerald-400' :
                                                                                    detail.tipo === 'Correctivo' ? 'bg-pf-red' :
                                                                                        'bg-amber-400'
                                                                                }`}></div>
                                                                            {detail.tipo}
                                                                        </td>
                                                                        <td className="px-6 py-1.5 text-right text-slate-600 font-medium">{formatCurrency(detail.budget)}</td>
                                                                        <td className="px-6 py-1.5 text-right text-slate-600 font-bold text-xs">
                                                                            <div
                                                                                className="hover:text-blue-600 transition-colors cursor-pointer inline-block border-b border-transparent hover:border-blue-600"
                                                                                onClick={() => onShowDetails(`${detail.tipo}: ${asset.activo}`, getTypeTransactions(asset.activo, isHito, detail.tipo), detail.budget)}
                                                                            >
                                                                                {formatCurrency(detail.real)}
                                                                            </div>
                                                                        </td>
                                                                        <td className={`px-6 py-1.5 text-right font-black ${isOverDetail ? 'text-pf-red/60' : 'text-slate-600'}`}>
                                                                            {devDetail.toFixed(1)}%
                                                                        </td>
                                                                        <td className="px-6 py-1.5 pr-12">
                                                                            <div className="w-24 bg-slate-200/50 rounded-full h-1 overflow-hidden ml-auto border border-slate-200">
                                                                                <div
                                                                                    className={`h-full rounded-full transition-all duration-500 ${isOverDetail ? 'bg-pf-red/40' : 'bg-emerald-400/40'}`}
                                                                                    style={{ width: `${progress}%` }}
                                                                                />
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </Fragment>
                                                    );
                                                })}
                                            </Fragment>
                                        ));
                                    })()}
                                </Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-sm text-slate-500">
                        Mostrando <span className="font-semibold text-slate-700">{(currentPage - 1) * itemsPerPage + 1}</span> a <span className="font-semibold text-slate-700">{Math.min(currentPage * itemsPerPage, totalItems)}</span> de <span className="font-semibold text-slate-700">{totalItems}</span> centros de costo
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {[...Array(totalPages)].map((_, i) => {
                            const page = i + 1;
                            if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                                return (
                                    <button
                                        key={page}
                                        onClick={() => onPageChange(page)}
                                        className={`px-3.5 py-1.5 rounded-lg text-sm font-bold transition-all ${currentPage === page
                                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                            : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                                            }`}
                                    >
                                        {page}
                                    </button>
                                );
                            }
                            if (page === currentPage - 2 || page === currentPage + 2) {
                                return <span key={page} className="px-1 text-slate-400">...</span>;
                            }
                            return null;
                        })}

                        <button
                            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
