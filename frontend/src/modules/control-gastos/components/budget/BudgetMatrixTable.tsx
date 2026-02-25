import React, { Fragment, useState, useMemo } from 'react';
import { ChevronDown, Search, AlertCircle, Edit2, Plus, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { TablePagination } from '../../../../shared/components/ui/TablePagination';
import type { ActivoEAM } from '../../../../shared/types';

type SortField = 'activo' | 'totalAnnual';
type SortOrder = 'asc' | 'desc';

interface BudgetMatrixItem {
  id: string;
  nivel: string;
  activo: string;
  totalAnnual: number;
  found: boolean;
  claseContable?: string;
  centroCosto?: string;
  organizacion?: string;
  monthly: {
    [month: number]: {
      bodega: number;
      servExt: number;
      correctivo: number;
      total: number;
    }
  }
}

interface BudgetMatrixTableProps {
  selectedYear: number;
  loading: boolean;
  matrixData: BudgetMatrixItem[];
  showNotFoundOnly: boolean;
  setShowNotFoundOnly: (val: boolean) => void;
  expandedRows: Record<string, boolean>;
  toggleExpand: (id: string) => void;
  handleAutoFix: () => void;
  setManualModalOpen: (val: boolean) => void;
  setSelectedAssetForManual: (asset: ActivoEAM | null) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  openRemapModal: (assetName: string) => void;
  months: string[];
  formatCurrency: (val: number) => string;
}

export const BudgetMatrixTable: React.FC<BudgetMatrixTableProps> = React.memo(({
  selectedYear,
  loading,
  matrixData,
  showNotFoundOnly,
  setShowNotFoundOnly,
  expandedRows,
  toggleExpand,
  handleAutoFix,
  setManualModalOpen,
  setSelectedAssetForManual,
  fileInputRef,
  handleFileChange,
  openRemapModal,
  months,
  formatCurrency
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [sortField, setSortField] = useState<SortField>('activo');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [searchTerm, setSearchTerm] = useState('');

  // Logic for filtering, sorting and pagination
  const filteredAndSortedData = useMemo(() => {
    let result = [...matrixData];

    // Filter
    if (showNotFoundOnly) {
      result = result.filter(item => !item.found);
    }

    if (searchTerm.trim() !== '') {
      const lower = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.activo.toLowerCase().includes(lower) ||
        (item.centroCosto && item.centroCosto.toLowerCase().includes(lower))
      );
    }

    // Sort
    result.sort((a, b) => {
      const factor = sortOrder === 'asc' ? 1 : -1;
      if (sortField === 'activo') {
        return factor * a.activo.localeCompare(b.activo);
      }
      return factor * (a[sortField] - b[sortField]);
    });

    return result;
  }, [matrixData, showNotFoundOnly, sortField, sortOrder, searchTerm]);

  const totalItems = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginatedData = useMemo(() => {
    return filteredAndSortedData.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
  }, [filteredAndSortedData, currentPage, itemsPerPage]);

  // Reset pagination when filters, sorting or data changes
  const [prevSyncKey, setPrevSyncKey] = useState({
    selectedYear,
    showNotFoundOnly,
    sortField,
    sortOrder,
    searchTerm,
    dataLength: matrixData.length
  });

  if (
    prevSyncKey.selectedYear !== selectedYear ||
    prevSyncKey.showNotFoundOnly !== showNotFoundOnly ||
    prevSyncKey.sortField !== sortField ||
    prevSyncKey.sortOrder !== sortOrder ||
    prevSyncKey.searchTerm !== searchTerm ||
    prevSyncKey.dataLength !== matrixData.length
  ) {
    setPrevSyncKey({
      selectedYear,
      showNotFoundOnly,
      sortField,
      sortOrder,
      searchTerm,
      dataLength: matrixData.length
    });
    setCurrentPage(1);
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={14} className="ml-1 opacity-20" />;
    return sortOrder === 'asc' ? <ArrowUp size={14} className="ml-1 text-pf-blue-500" /> : <ArrowDown size={14} className="ml-1 text-pf-blue-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h2 className="text-2xl font-black text-pf-neutral-800 uppercase italic tracking-tight">Planificación Presupuestaria ({selectedYear})</h2>
          <p className="text-pf-neutral-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1.5 pl-0.5">Gestión de recursos por activo y categoría</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-black px-4 py-1.5 bg-white border border-pf-neutral-200 text-pf-neutral-400 rounded-full uppercase tracking-widest shadow-sm">Total: {totalItems}</span>
          {totalPages > 1 && (
            <span className="text-[10px] font-black px-4 py-1.5 bg-pf-neutral-900 text-white rounded-full uppercase tracking-widest shadow-lg shadow-pf-neutral-200">
              Página {currentPage} de {totalPages}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6">
        <div className="relative w-full xl:w-[400px]">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-pf-neutral-400" size={18} />
          <input
            type="text"
            placeholder="Buscar por activo o centro de costo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-pf-neutral-200 rounded-2xl text-[11px] font-black text-pf-neutral-700 outline-none focus:border-pf-red/30 transition-all shadow-sm placeholder:text-pf-neutral-400 placeholder:font-black tracking-widest placeholder:uppercase"
          />
        </div>
        <div className="flex flex-wrap gap-3 w-full xl:w-auto">
          <button
            onClick={handleAutoFix}
            disabled={loading || !matrixData.some(i => !i.found)}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5 border active:scale-95 shadow-sm ${matrixData.some(i => !i.found)
              ? 'bg-pf-blue-500 text-white border-pf-blue-600 hover:bg-pf-blue-600 shadow-pf-blue-100 hover:shadow-lg'
              : 'bg-pf-neutral-50 text-pf-neutral-300 border-pf-neutral-200 cursor-not-allowed'
              }`}
          >
            <Search size={16} />
            Auto-Vincular
          </button>
          <button
            onClick={() => setShowNotFoundOnly(!showNotFoundOnly)}
            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2.5 border active:scale-95 shadow-sm ${showNotFoundOnly
              ? 'bg-pf-red text-white border-pf-red shadow-lg shadow-pf-red/20'
              : 'bg-white text-pf-neutral-600 border-pf-neutral-200 hover:bg-pf-neutral-50'
              }`}
          >
            <AlertCircle size={16} />
            {showNotFoundOnly ? 'Viendo No Vinculados' : 'Filtrar no vinculados'}
          </button>
          <button
            onClick={() => {
              setSelectedAssetForManual(null);
              setManualModalOpen(true);
            }}
            className="px-5 py-2.5 bg-pf-neutral-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:scale-[1.02] transition-all flex items-center gap-2.5 shadow-lg shadow-pf-neutral-200 active:scale-95"
          >
            <Plus size={16} />
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
            className="px-5 py-2.5 bg-white text-pf-neutral-800 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-pf-neutral-50 transition-all flex items-center gap-2.5 border border-pf-neutral-200 shadow-sm active:scale-95"
          >
            Importar Excel
          </button>
        </div>
      </div>

      <div className="overflow-hidden border rounded-[1.5rem] border-pf-neutral-200 bg-white shadow-sm overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead className="bg-pf-neutral-50/80 border-b border-pf-neutral-200 text-pf-neutral-400 font-black uppercase sticky top-0 z-10">
            <tr>
              <th
                className="px-5 py-4 min-w-[240px] border-r border-pf-neutral-200/60 placeholder:uppercase text-[10px] tracking-widest cursor-pointer hover:text-pf-red transition-all group"
                onClick={() => handleSort('activo')}
              >
                <div className="flex items-center gap-1">Activo Planificado {renderSortIcon('activo')}</div>
              </th>
              <th
                className="px-3 py-4 text-right bg-pf-neutral-100/30 border-r border-pf-neutral-200/60 min-w-[120px] text-pf-neutral-800 uppercase text-[10px] tracking-widest cursor-pointer hover:text-pf-red transition-all group"
                onClick={() => handleSort('totalAnnual')}
              >
                <div className="flex items-center justify-end gap-1 px-2">Total Anual {renderSortIcon('totalAnnual')}</div>
              </th>
              {months.map(m => (
                <th key={m} className="px-3 py-4 text-right min-w-[100px] text-[10px] tracking-tighter">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-pf-neutral-100">
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={months.length + 2} className="text-center py-20 text-pf-neutral-400 uppercase font-black tracking-widest text-[10px]">
                  No hay activos {showNotFoundOnly ? 'no vinculados' : ''} para mostrar.
                </td>
              </tr>
            )}
            {paginatedData.map((item) => {
              const isExpanded = expandedRows[item.id];
              return (
                <Fragment key={item.id}>
                  <tr className={`hover:bg-pf-neutral-50 transition-all duration-150 group/row ${isExpanded ? 'bg-pf-neutral-50/50' : ''}`}>
                    <td className="px-1 py-4 border-r border-pf-neutral-100">
                      <div className="flex items-center gap-3">
                        <button onClick={() => toggleExpand(item.id)} className={`text-pf-neutral-400 hover:text-pf-red transition-all p-1 rounded-md ${isExpanded ? 'bg-white shadow-sm rotate-0' : '-rotate-90'}`}>
                          <ChevronDown size={14} />
                        </button>
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-2 pr-2">
                            <span className={`font-black tracking-tight max-w-[200px] text-sm select-text ${item.found ? 'text-pf-neutral-800' : 'text-pf-red drop-shadow-sm'}`} title={item.activo}>
                              {item.activo}
                            </span>
                            {!item.found ? (
                              <button
                                onClick={() => openRemapModal(item.activo)}
                                className="ml-auto p-1 hover:bg-pf-red text-pf-red hover:text-white rounded-md transition-all active:scale-90 border border-pf-red/20 shadow-sm"
                                title="Vincular con activo real"
                              >
                                <Edit2 size={12} />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedAssetForManual({
                                    activo: item.activo,
                                    claseContable: item.claseContable || '',
                                    organizacion: item.organizacion || ''
                                  });
                                  setManualModalOpen(true);
                                }}
                                className="ml-auto p-1 hover:bg-pf-neutral-800 text-pf-neutral-400 hover:text-white rounded-md transition-all opacity-0 group-hover/row:opacity-100 border border-pf-neutral-200 active:scale-95 shadow-sm"
                                title="Editar Presupuesto"
                              >
                                <Edit2 size={12} />
                              </button>
                            )}
                          </div>
                          <span className="text-[9px] font-black text-pf-neutral-400 uppercase tracking-widest mt-0.5">
                            {item.nivel} {item.claseContable ? `• ${item.claseContable}` : ''}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-right font-black text-pf-neutral-800 bg-pf-neutral-100/20 border-r border-pf-neutral-100">
                      {formatCurrency(item.totalAnnual)}
                    </td>
                    {months.map((_, idx) => (
                      <td key={idx} className="px-3 py-4 text-right text-pf-neutral-600 font-black tracking-tighter">
                        {formatCurrency(item.monthly[idx + 1].total)}
                      </td>
                    ))}
                  </tr>

                  {isExpanded && (
                    <>
                      <tr className="bg-pf-blue-50/40 text-[10px]" key={`${item.id}-bodega`}>
                        <td className="px-5 py-1.5 text-right text-pf-blue-600 font-black uppercase tracking-widest border-r border-pf-neutral-100 pl-12 bg-pf-blue-50/50">Variab. Bodega</td>
                        <td className="px-3 py-1.5 text-right text-pf-neutral-300 border-r border-pf-neutral-100">-</td>
                        {months.map((_, idx) => (
                          <td key={idx} className="px-3 py-1.5 text-right text-pf-blue-600 font-black">
                            {formatCurrency(item.monthly[idx + 1].bodega)}
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-pf-success-50/40 text-[10px]" key={`${item.id}-serv`}>
                        <td className="px-5 py-1.5 text-right text-pf-success-600 font-black uppercase tracking-widest border-r border-pf-neutral-100 pl-12 bg-pf-success-50/50">Serv. Externos</td>
                        <td className="px-3 py-1.5 text-right text-pf-neutral-300 border-r border-pf-neutral-100">-</td>
                        {months.map((_, idx) => (
                          <td key={idx} className="px-3 py-1.5 text-right text-pf-success-600 font-black">
                            {formatCurrency(item.monthly[idx + 1].servExt)}
                          </td>
                        ))}
                      </tr>
                      <tr className="bg-pf-red-50/40 text-[10px] border-b border-pf-neutral-100" key={`${item.id}-corr`}>
                        <td className="px-5 py-1.5 text-right text-pf-red font-black uppercase tracking-widest border-r border-pf-neutral-100 pl-12 bg-pf-red-50/50">Correctivo</td>
                        <td className="px-3 py-1.5 text-right text-pf-neutral-300 border-r border-pf-neutral-100">-</td>
                        {months.map((_, idx) => (
                          <td key={idx} className="px-3 py-1.5 text-right text-pf-red font-black">
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

      <div className="mt-8 flex flex-wrap gap-6 text-[10px] font-black uppercase tracking-widest text-pf-neutral-400 px-4">
        <div className="flex items-center gap-2.5 bg-pf-neutral-50 px-3 py-1.5 rounded-full border border-pf-neutral-100 shadow-sm"><div className="w-2.5 h-2.5 bg-pf-blue-500 rounded-full shadow-sm shadow-pf-blue-200"></div> Variab. Bodega</div>
        <div className="flex items-center gap-2.5 bg-pf-neutral-50 px-3 py-1.5 rounded-full border border-pf-neutral-100 shadow-sm"><div className="w-2.5 h-2.5 bg-pf-success-500 rounded-full shadow-sm shadow-pf-success-200"></div> Serv. Externos</div>
        <div className="flex items-center gap-2.5 bg-pf-neutral-50 px-3 py-1.5 rounded-full border border-pf-neutral-100 shadow-sm"><div className="w-2.5 h-2.5 bg-pf-red rounded-full shadow-sm shadow-pf-red/30"></div> Correctivo</div>
        <div className="flex items-center gap-3 ml-auto italic lowercase first-letter:uppercase text-pf-neutral-300">
          <AlertCircle size={12} className="text-pf-red animate-pulse" />
          <span>Líneas en rojo indican activos sin vinculación maestros EAM.</span>
        </div>
      </div>

      {/* Controles de Paginación */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
});
