import React, { Fragment } from 'react';
import {
    Calendar, Search, ChevronDown, AlertCircle,
    ArrowUpDown, ArrowUp, ArrowDown
} from 'lucide-react';
import { TablePagination } from '../../../../shared/components/ui/TablePagination';
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
        if (sortField !== field) return <ArrowUpDown size={14} className="ml-1 opacity-20" />;
        return sortOrder === 'asc' ? <ArrowUp size={14} className="ml-1 text-pf-blue-500" /> : <ArrowDown size={14} className="ml-1 text-pf-blue-500" />;
    };

    return (
        <div className="bg-white rounded-[2.5rem] shadow-sm border border-pf-neutral-200 overflow-hidden">
            <div className="p-8 border-b border-pf-neutral-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-pf-neutral-50/50">
                <h2 className="text-2xl font-black text-pf-neutral-800 flex items-center gap-4 uppercase tracking-tighter">
                    <Calendar size={24} className="text-pf-red -rotate-12 bg-pf-red/5 p-1 rounded-lg" />
                    Monitoreo de Ejecución
                </h2>
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black px-4 py-1.5 bg-white border border-pf-neutral-200 text-pf-neutral-400 rounded-full uppercase tracking-widest shadow-sm">Total: {totalItems}</span>
                    {totalPages > 1 && (
                        <span className="text-[10px] font-black px-4 py-1.5 bg-pf-neutral-900 text-white rounded-full uppercase tracking-widest shadow-lg shadow-pf-neutral-200">
                            Página {currentPage} de {totalPages}
                        </span>
                    )}
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-pf-neutral-50/50 border-b border-pf-neutral-200">
                            <th className="px-6 py-6 text-left font-black text-[10px] text-pf-neutral-400 uppercase tracking-[0.2em] cursor-pointer hover:text-pf-red transition-all select-none group" onClick={() => onSort('centroCosto')}>
                                <div className="flex items-center gap-1">Centro Costo / Activo {renderSortIcon('centroCosto')}</div>
                            </th>
                            <th className="px-6 py-6 text-right font-black text-[10px] text-pf-neutral-400 uppercase tracking-[0.2em] cursor-pointer hover:text-pf-red transition-all select-none group" onClick={() => onSort('totalBudget')}>
                                <div className="flex items-center justify-end gap-1">Presupuesto {renderSortIcon('totalBudget')}</div>
                            </th>
                            <th className="px-6 py-6 text-right font-black text-[10px] text-pf-neutral-400 uppercase tracking-[0.2em] cursor-pointer hover:text-pf-red transition-all select-none group" onClick={() => onSort('totalReal')}>
                                <div className="flex items-center justify-end gap-1">Real {renderSortIcon('totalReal')}</div>
                            </th>
                            <th className="px-6 py-6 text-right font-black text-[10px] text-pf-neutral-400 uppercase tracking-[0.2em] cursor-pointer hover:text-pf-red transition-all select-none group" onClick={() => onSort('deviation')}>
                                <div className="flex items-center justify-end gap-1">% Desv. {renderSortIcon('deviation')}</div>
                            </th>
                            <th className="px-6 py-6 text-left font-black text-[10px] text-pf-neutral-400 uppercase tracking-[0.2em]">Visualización de Meta</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-pf-neutral-100">
                        {paginatedData.length === 0 && (
                            <tr>
                                <td colSpan={5} className="text-center py-24">
                                    <div className="flex flex-col items-center justify-center text-pf-neutral-300 gap-4">
                                        <div className="p-6 bg-pf-neutral-50 rounded-full border border-pf-neutral-100 shadow-inner">
                                            <Search size={48} className="opacity-40" />
                                        </div>
                                        <p className="font-black uppercase tracking-[0.25em] text-[10px]">No hay datos para esta selección</p>
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
                                        <tr className="bg-pf-neutral-50/40 select-none">
                                            <td colSpan={5} className="p-0">
                                                <div className="w-full h-full border-y border-pf-neutral-200/50"></div>
                                            </td>
                                        </tr>
                                    )}
                                    {/* Cabecera de Grupo */}
                                    <tr className={`hover:bg-pf-neutral-50 cursor-pointer transition-all duration-300 group/row ${isExpanded ? 'bg-pf-neutral-50/80 shadow-[inset_0_2px_10px_rgba(0,0,0,0.02)]' : ''}`} onClick={() => onToggleGroup(group.centroCosto)}>
                                        <td className="px-6 py-6 font-black text-pf-neutral-700">
                                            <div className="flex items-center gap-5">
                                                <div className={`p-2 rounded-xl transition-all duration-300 ${isExpanded ? 'bg-pf-neutral-900 text-white shadow-lg' : 'bg-pf-neutral-100 text-pf-neutral-400 -rotate-90'}`}>
                                                    <ChevronDown size={14} />
                                                </div>
                                                <div className="flex flex-col select-text">
                                                    <span className="text-sm tracking-tighter text-pf-neutral-800">{group.centroCosto}</span>
                                                    <span className="text-[9px] font-black text-pf-neutral-400 uppercase tracking-widest mt-1">Centro de Costo</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-6 text-right font-black text-pf-neutral-800 tracking-tighter text-sm">{formatCurrency(group.totalBudget)}</td>
                                        <td className="px-6 py-6 text-right font-black text-pf-neutral-800">
                                            <div
                                                className="flex items-center justify-end gap-3 hover:scale-105 transition-all group/real"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onShowDetails(`Gastos: ${group.centroCosto}`, getGroupTransactions(group.centroCosto), group.totalBudget);
                                                }}
                                            >
                                                {group.assets.some(a => a.hasActiveOT) ? (
                                                    <Tooltip content="CRÍTICO: Centro de costo con exceso de presupuesto en categoría y OTs aún LIBERADAS">
                                                        <AlertCircle size={16} className="text-pf-red animate-pulse" />
                                                    </Tooltip>
                                                ) : isOver ? (
                                                    <Tooltip content="Presupuesto del centro de costo excedido (OTs Finalizadas)">
                                                        <AlertCircle size={16} className="text-pf-warning-500" />
                                                    </Tooltip>
                                                ) : (
                                                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-pf-neutral-100/50 rounded-xl border border-pf-neutral-100">
                                                        {group.assets.some(a =>
                                                            a.details.some(d => d.real > d.budget && d.budget > 0) ||
                                                            (a.totalReal > a.totalBudget && a.totalBudget > 0)
                                                        ) && (
                                                                <Tooltip content="Alerta: Desviación interna en categorías">
                                                                    <AlertCircle size={14} className="text-pf-warning-400" />
                                                                </Tooltip>
                                                            )}
                                                        {group.assets.some(a => a.hasDateAlert) && (
                                                            <Tooltip content="Alerta: Transacciones en meses fuera de programa">
                                                                <AlertCircle size={14} className="text-pf-blue-500" />
                                                            </Tooltip>
                                                        )}
                                                    </div>
                                                )}
                                                <span className="text-sm tracking-tighter cursor-pointer border-b-2 border-pf-neutral-100 hover:border-pf-red transition-all">
                                                    {formatCurrency(group.totalReal)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className={`px-6 py-6 text-right font-black text-sm ${isOver ? 'text-pf-red' : group.deviation > 90 ? 'text-pf-warning-600' : 'text-pf-success-600'}`}>
                                            {group.deviation.toFixed(1)}%
                                        </td>
                                        <td className="px-6 py-6 w-52">
                                            <div className="w-full bg-pf-neutral-100 rounded-full h-3 overflow-hidden border border-pf-neutral-200/40 p-0.5 shadow-inner">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-1000 shadow-sm ${isOver ? 'bg-pf-red shadow-pf-red/20' : 'bg-pf-success-500 shadow-pf-success-500/20'}`}
                                                    style={{ width: `${Math.min((group.totalReal / (group.totalBudget || 1)) * 100, 100)}%` }}
                                                />
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Activos agrupados por tipo (Mensual, Hito, etc.) */}
                                    {isExpanded && (() => {
                                        const types = Array.from(new Set(group.assets.map(a => a.frecuencia))).sort((a, b) => {
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
                                                {/* Fila Separadora de Categoría */}
                                                <tr className="bg-pf-neutral-50/20 border-y border-pf-neutral-100">
                                                    <td colSpan={5} className="px-6 py-3 pl-10 bg-pf-neutral-50/40">
                                                        <div className="flex items-center gap-6">
                                                            <div className="h-px flex-1 bg-pf-neutral-100"></div>
                                                            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-pf-neutral-300 whitespace-nowrap px-4">
                                                                {type}
                                                            </span>
                                                            <div className="h-px flex-1 bg-pf-neutral-100"></div>
                                                        </div>
                                                    </td>
                                                </tr>

                                                {group.assets.filter(a => a.frecuencia === type).map((asset, assetIdx) => {
                                                    const isHito = asset.frecuencia.toLowerCase().includes('hito');
                                                    return (
                                                        <Fragment key={`${group.centroCosto}-${asset.activo}-${assetIdx}`}>
                                                            <tr className="bg-white hover:bg-pf-neutral-50/50 transition-all duration-200 select-text">
                                                                <td className="px-6 py-5 pl-16 text-pf-neutral-800 font-bold">
                                                                    <div className="flex flex-wrap items-center gap-3">
                                                                        <span className="text-sm font-black text-pf-neutral-700 tracking-tighter">{asset.activo}</span>
                                                                        <div className="flex gap-2">
                                                                            <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase tracking-widest shadow-sm
                                                                                ${asset.category === 'Maquinaria' ? 'bg-pf-blue-50 text-pf-blue-600 border-pf-blue-100' :
                                                                                    asset.category === 'Redes' ? 'bg-pf-success-50 text-pf-success-600 border-pf-success-100' :
                                                                                        asset.category === 'Infra' ? 'bg-pf-blue-50 text-pf-blue-600 border-pf-blue-100' :
                                                                                            'bg-pf-neutral-50 text-pf-neutral-500 border-pf-neutral-100'}
                                                                            `}>
                                                                                {asset.category}
                                                                            </span>
                                                                            {asset.planta && (
                                                                                <span title="Planta" className="px-2.5 py-1 rounded-lg text-[9px] font-black bg-white text-pf-neutral-500 border border-pf-neutral-200 uppercase tracking-widest shadow-sm">
                                                                                    {asset.planta}
                                                                                </span>
                                                                            )}
                                                                            {asset.claseContable && (
                                                                                <span title="Clase Contable" className="px-2.5 py-1 rounded-lg text-[9px] font-black bg-pf-warning-50 text-pf-warning-700 border border-pf-warning-100 uppercase tracking-widest shadow-sm">
                                                                                    {asset.claseContable}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-6 py-5 text-right text-pf-neutral-400 text-xs font-black tracking-tighter">{formatCurrency(asset.totalBudget)}</td>
                                                                <td className="px-6 py-5 text-right text-pf-neutral-700 font-black text-xs">
                                                                    <div
                                                                        className="flex items-center justify-end gap-3 text-xs hover:scale-105 transition-all group/asset"
                                                                        onClick={() => onShowDetails(`Activo: ${asset.activo}`, getAssetTransactions(asset.activo, isHito), asset.totalBudget)}
                                                                    >
                                                                        <div className="flex items-center gap-1.5">
                                                                            {asset.hasActiveOT ? (
                                                                                <Tooltip content="CRÍTICO: Presupuesto de categoría excedido con OT todavía LIBERADA">
                                                                                    <AlertCircle size={15} className="text-pf-red animate-pulse" />
                                                                                </Tooltip>
                                                                            ) : (asset.totalReal > asset.totalBudget && asset.totalBudget > 0) ? (
                                                                                <Tooltip content="Presupuesto excedido (OT Finalizada/Cerrada)">
                                                                                    <AlertCircle size={15} className="text-pf-warning-500" />
                                                                                </Tooltip>
                                                                            ) : (
                                                                                asset.details.some(d => d.real > d.budget && d.budget > 0) && (
                                                                                    <Tooltip content="Alerta: Desviación interna en categorías (ej: Bodega vs Hito)">
                                                                                        <AlertCircle size={15} className="text-pf-warning-400" />
                                                                                    </Tooltip>
                                                                                )
                                                                            )}
                                                                            {asset.hasDateAlert && (
                                                                                <Tooltip content="Gastos fuera de periodo">
                                                                                    <AlertCircle size={15} className="text-pf-blue-500" />
                                                                                </Tooltip>
                                                                            )}
                                                                        </div>
                                                                        <span className="border-b-2 border-pf-neutral-100 group-hover/asset:border-pf-red transition-all cursor-pointer tracking-tighter">
                                                                            {formatCurrency(asset.totalReal)}
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td className={`px-6 py-5 text-right text-xs font-black ${asset.totalReal > asset.totalBudget && asset.totalBudget > 0 ? 'text-pf-red' : 'text-pf-neutral-500'}`}>
                                                                    {asset.deviation.toFixed(1)}%
                                                                </td>
                                                                <td className="px-6 py-5">
                                                                    <div className="w-40 bg-pf-neutral-100 rounded-full h-2.5 overflow-hidden border border-pf-neutral-200/40 p-0.5 shadow-inner">
                                                                        <div
                                                                            className={`h-full rounded-full transition-all duration-1000 ${asset.totalReal > asset.totalBudget && asset.totalBudget > 0 ? 'bg-pf-red shadow-pf-red/20' : 'bg-pf-success-500/80'}`}
                                                                            style={{ width: `${Math.min((asset.totalReal / (asset.totalBudget || 1)) * 100, 100)}%` }}
                                                                        />
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                            {/* Desglose de Detalles */}
                                                            {asset.details.map((detail, dIdx) => {
                                                                const progress = Math.min((detail.real / (detail.budget || 1)) * 100, 100);
                                                                const isOverDetail = detail.real > (detail.budget || 0) && detail.budget > 0;
                                                                const devDetail = calculateDeviation(detail.real, detail.budget);

                                                                return (
                                                                    <tr key={`${group.centroCosto}-${asset.activo}-${assetIdx}-${dIdx}`} className="text-[10px] bg-pf-neutral-50/10 group/detail">
                                                                        <td className="px-6 py-2.5 pl-24 text-pf-neutral-500 font-black uppercase tracking-widest flex items-center gap-3">
                                                                            <div className={`w-2 h-2 rounded-full border border-white shadow-sm ${detail.tipo === 'Bodega' ? 'bg-pf-blue-500' :
                                                                                detail.tipo === 'Serv. Externos' ? 'bg-pf-success-500' :
                                                                                    detail.tipo === 'Correctivo' ? 'bg-pf-red' :
                                                                                        'bg-pf-warning-500'
                                                                                }`}></div>
                                                                            {detail.tipo}
                                                                        </td>
                                                                        <td className="px-6 py-2.5 text-right text-pf-neutral-400 font-black tracking-tight">{formatCurrency(detail.budget)}</td>
                                                                        <td className="px-6 py-2.5 text-right text-pf-neutral-700 font-black">
                                                                            <div
                                                                                className="hover:text-pf-red transition-all cursor-pointer inline-block border-b border-pf-neutral-200 hover:border-pf-red tracking-tighter"
                                                                                onClick={() => onShowDetails(`${detail.tipo}: ${asset.activo}`, getTypeTransactions(asset.activo, isHito, detail.tipo), detail.budget)}
                                                                            >
                                                                                {formatCurrency(detail.real)}
                                                                            </div>
                                                                        </td>
                                                                        <td className={`px-6 py-2.5 text-right font-black ${isOverDetail ? 'text-pf-red/70' : 'text-pf-neutral-400'}`}>
                                                                            {devDetail.toFixed(1)}%
                                                                        </td>
                                                                        <td className="px-6 py-2.5 pr-12">
                                                                            <div className="w-28 bg-pf-neutral-100 rounded-full h-1.5 overflow-hidden ml-auto border border-pf-neutral-200/30 p-0.5">
                                                                                <div
                                                                                    className={`h-full rounded-full transition-all duration-1000 ${isOverDetail ? 'bg-pf-red/60' : 'bg-pf-success-400/50'}`}
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

            {/* Controles de Paginación */}
            <TablePagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                onPageChange={onPageChange}
                className="mt-0 border-t border-t-pf-neutral-100 rounded-none bg-pf-neutral-50"
            />
        </div>
    );
};
