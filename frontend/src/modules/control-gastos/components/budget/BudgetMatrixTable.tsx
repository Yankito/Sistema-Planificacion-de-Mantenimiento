import React, { Fragment } from 'react';
import { ChevronDown, ChevronRight, Search, AlertCircle, Edit2, Plus, FileSpreadsheet } from 'lucide-react';


interface BudgetMatrixItem {
  id: string;
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
  setSelectedAssetForManual: (asset: any) => void;
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
  return (
    <div className="space-y-6">
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
            onClick={() => {
              setSelectedAssetForManual(null);
              setManualModalOpen(true);
            }}
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
                                    setSelectedAssetForManual({ activo: item.activo });
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
    </div>
  );
});
