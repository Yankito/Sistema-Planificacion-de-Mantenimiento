import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, Plus, Save, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { type ManualEntryLine, FRECUENCIAS_PREDEFINIDAS, type PresupuestoRow } from '../../types';
import type { ActivoEAM } from '../../../../shared/types';
import { toast } from 'sonner';
import { confirmDialog } from '../../../../shared/utils/confirmDialog';

interface ManualBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAsset: ActivoEAM | { activo: string, claseContable?: string, organizacion?: string } | null;
  setSelectedAsset: (asset: ActivoEAM | null) => void;
  onSaveSuccess: () => void;
  getMaintainableAssets: (search?: string, silent?: boolean) => Promise<ActivoEAM[]>;
  getPresupuesto: (year: number, planta?: string, activo?: string, mes?: number, silent?: boolean) => Promise<PresupuestoRow[]>;
  saveManualPresupuesto: (rows: PresupuestoRow[]) => Promise<void>;
  selectedYear: number;
  months: string[];
}

export const ManualBudgetModal: React.FC<ManualBudgetModalProps> = React.memo(({
  isOpen,
  onClose,
  selectedAsset,
  setSelectedAsset,
  onSaveSuccess,
  getMaintainableAssets,
  getPresupuesto,
  saveManualPresupuesto,
  selectedYear,
  months
}) => {
  const [assetSearch, setAssetSearch] = useState('');
  const [maintainableAssets, setMaintainableAssets] = useState<ActivoEAM[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [manualEntries, setManualEntries] = useState<ManualEntryLine[]>([]);
  const [saveLoading, setSaveLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lastLoadedAssetRef = useRef<string | null>(null);

  const createEmptyEntry = useCallback((freq = 'mensual', startMonth = 1): ManualEntryLine => {
    const isPre = FRECUENCIAS_PREDEFINIDAS.includes(freq.toLowerCase());
    const entry: ManualEntryLine = {
      id: Math.random().toString(36).substr(2, 9),
      frecuencia: freq,
      isPredefined: isPre,
      collapsed: false,
      startMonth: startMonth,
      monthlyData: {}
    };
    for (let i = 1; i <= 12; i++) {
      entry.monthlyData[i] = { bodega: 0, servExt: 0, correctivo: 0, locked: isPre };
    }
    return entry;
  }, []);

  const loadAssetBudget = useCallback(async () => {
    if (!selectedAsset?.activo) return;
    setDataLoading(true);
    try {
      // Pedimos solo los datos de este activo
      const assetRows = await getPresupuesto(selectedYear, '', selectedAsset.activo, undefined, true);
      const groupedByFrecuencia: Record<string, ManualEntryLine> = {};

      assetRows.forEach(r => {
        const freqValue = r.frecuencia || 'mensual';
        if (!groupedByFrecuencia[freqValue]) {
          groupedByFrecuencia[freqValue] = createEmptyEntry(freqValue);
        }
        groupedByFrecuencia[freqValue].monthlyData[r.mes] = {
          bodega: r.montoBodega || 0,
          servExt: r.montoServExt || 0,
          correctivo: r.montoCorrectivo || 0,
          locked: FRECUENCIAS_PREDEFINIDAS.includes(freqValue.toLowerCase())
        };
      });

      const entries = Object.values(groupedByFrecuencia);
      setManualEntries(entries.length > 0 ? entries : [createEmptyEntry('mensual')]);
    } catch (e) {
      console.error('Error loading budget details:', e);
      const msg = e instanceof Error ? e.message : 'Error desconocido';
      toast.error('Error al cargar el presupuesto del activo: ' + msg);
    } finally {
      setDataLoading(false);
    }
  }, [selectedAsset?.activo, getPresupuesto, selectedYear, createEmptyEntry]);

  // Cargar presupuesto existente solo una vez por activo seleccionado
  useEffect(() => {
    if (isOpen && selectedAsset?.activo) {
      if (lastLoadedAssetRef.current !== selectedAsset.activo) {
        lastLoadedAssetRef.current = selectedAsset.activo;
        loadAssetBudget();
      }
    } else if (!isOpen) {
      setManualEntries([]);
      setAssetSearch('');
      lastLoadedAssetRef.current = null;
    }
  }, [isOpen, selectedAsset?.activo, loadAssetBudget]);



  const applyFrequencyLogic = (lineIdx: number, freq: string, amounts: { b: number, s: number, c: number }, startMonth?: number) => {
    const copy = [...manualEntries];
    const line = copy[lineIdx];
    const isPre = FRECUENCIAS_PREDEFINIDAS.includes(freq.toLowerCase());

    line.frecuencia = freq;
    line.isPredefined = isPre;
    if (startMonth !== undefined) line.startMonth = startMonth;

    const sm = line.startMonth || 1;
    const activeMonths: number[] = [];

    if (freq === 'mensual' || freq === 'semanal' || freq === 'quincenal') {
      for (let i = 1; i <= 12; i++) activeMonths.push(i);
    } else if (freq === 'bimensual') {
      for (let i = sm; i <= 12; i += 2) activeMonths.push(i);
    } else if (freq === 'trimestral') {
      for (let i = sm; i <= 12; i += 3) activeMonths.push(i);
    } else if (freq === 'semestral') {
      for (let i = sm; i <= 12; i += 6) activeMonths.push(i);
    } else if (freq === 'anual' || freq === 'hito') {
      activeMonths.push(sm);
    }

    for (let i = 1; i <= 12; i++) {
      const isActive = activeMonths.includes(i);
      line.monthlyData[i] = {
        bodega: isActive ? amounts.b : 0,
        servExt: isActive ? amounts.s : 0,
        correctivo: isActive ? amounts.c : 0,
        locked: isPre
      };
    }
    setManualEntries(copy);
  };

  const handleSearchInternal = (val: string) => {
    setAssetSearch(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.length > 2) {
      setSearchLoading(true);
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await getMaintainableAssets(val, true);
          setMaintainableAssets(results);
        } finally {
          setSearchLoading(false);
        }
      }, 300);
    } else {
      setMaintainableAssets([]);
      setSearchLoading(false);
    }
  };

  const handleSaveInternal = async () => {
    if (!selectedAsset) return;
    setSaveLoading(true);
    try {
      const allRows: PresupuestoRow[] = [];
      manualEntries.forEach(entry => {
        for (let i = 1; i <= 12; i++) {
          const m = entry.monthlyData[i];
          if (m.bodega > 0 || m.servExt > 0 || m.correctivo > 0) {
            allRows.push({
              activo: selectedAsset.activo,
              anio: selectedYear,
              mes: i,
              montoBodega: m.bodega,
              montoServExt: m.servExt,
              montoCorrectivo: m.correctivo,
              frecuencia: entry.frecuencia,
            });
          }
        }
      });

      if (allRows.length === 0) {
        const confirmed = await confirmDialog('¿Borrar presupuesto?', 'No hay montos ingresados. ¿Desea borrar el presupuesto para este activo?');
        if (!confirmed) {
          setSaveLoading(false);
          return;
        }
      }

      await saveManualPresupuesto(allRows);
      toast.success('Presupuesto guardado correctamente');
      onSaveSuccess();
      onClose();
    } catch (err) {
      const error = err as Error;
      toast.error('Error al guardar: ' + error.message);
    } finally {
      setSaveLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-200">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-bold text-slate-800">Gestionar Presupuesto Manual</h3>
            <p className="text-[10px] text-slate-500">Solo para activos marcados como <span className="text-emerald-600 font-bold">Mantenibles</span></p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-200 rounded-lg text-slate-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {!selectedAsset ? (
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-widest">Seleccionar Activo</label>
              <div className="relative">
                {searchLoading ? (
                  <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" size={18} />
                ) : (
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                )}
                <input
                  type="text"
                  placeholder="Buscar por nombre o clase..."
                  value={assetSearch}
                  onChange={(e) => handleSearchInternal(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                {maintainableAssets.map(asset => (
                  <button
                    key={asset.activo}
                    onClick={() => setSelectedAsset(asset)}
                    className="flex flex-col p-3 border border-slate-100 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all text-left group cursor-pointer"
                  >
                    <span className="font-bold text-slate-700 group-hover:text-blue-700">{asset.activo}</span>
                    <span className="text-[10px] text-slate-400">{asset.claseContable} • {asset.organizacion}</span>
                  </button>
                ))}
                {assetSearch.length > 2 && maintainableAssets.length === 0 && (
                  <div className="col-span-full py-8 text-center text-slate-400 text-xs">No se encontraron activos mantenibles.</div>
                )}
                {assetSearch.length <= 2 && (
                  <div className="col-span-full py-8 text-center text-slate-400 text-xs italic">Escriba al menos 3 caracteres para buscar...</div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300 pb-12">
              <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100 sticky top-0 z-20">
                <div>
                  <p className="text-[10px] uppercase font-bold text-blue-400 mb-1">Activo Seleccionado</p>
                  <h4 className="font-bold text-blue-900">{selectedAsset.activo}</h4>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setManualEntries([...manualEntries, createEmptyEntry(`Tarea ${manualEntries.length + 1}`)])}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus size={14} /> Agregar Fila
                  </button>
                  <button onClick={() => setSelectedAsset(null)} className="text-xs text-blue-600 font-bold hover:underline cursor-pointer">Cambiar Activo</button>
                </div>
              </div>

              {dataLoading ? (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                  <p className="text-sm font-medium text-slate-500">Cargando presupuesto del activo...</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {manualEntries.map((entry, entryIdx) => (
                    <div key={entry.id} className="bg-slate-50 rounded-2xl border border-slate-200 relative group/entry shadow-sm overflow-hidden">
                      <div className="bg-white px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button
                            onClick={() => {
                              const copy = [...manualEntries];
                              copy[entryIdx].collapsed = !copy[entryIdx].collapsed;
                              setManualEntries(copy);
                            }}
                            className="p-1 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors cursor-pointer"
                          >
                            {entry.collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                          </button>
                          <div>
                            <h5 className="font-bold text-slate-700 leading-none mb-1">
                              {entry.frecuencia || 'Nueva Tarea'}
                            </h5>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              {entry.isPredefined ? (entry.frecuencia === 'hito' ? 'Presupuesto por Hito' : `Frecuencia ${entry.frecuencia}`) : 'Personalizado / Libre'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setManualEntries(manualEntries.filter(e => e.id !== entry.id))}
                            className="p-2 text-slate-300 hover:text-pf-red transition-colors"
                            title="Eliminar tarea"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      </div>

                      {!entry.collapsed && (
                        <div className="p-6 animate-in slide-in-from-top-4 duration-300">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <div>
                              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-wider">Tipo de Frecuencia</label>
                              <select
                                value={FRECUENCIAS_PREDEFINIDAS.includes(entry.frecuencia.toLowerCase()) ? entry.frecuencia.toLowerCase() : 'personalizado'}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const copy = [...manualEntries];
                                  if (val === 'personalizado') {
                                    copy[entryIdx].isPredefined = false;
                                    copy[entryIdx].frecuencia = 'Nueva Tarea';
                                    for (let i = 1; i <= 12; i++) copy[entryIdx].monthlyData[i].locked = false;
                                    setManualEntries(copy);
                                  } else {
                                    const currentBaseAmounts = {
                                      b: copy[entryIdx].monthlyData[entry.startMonth || 1]?.bodega || 0,
                                      s: copy[entryIdx].monthlyData[entry.startMonth || 1]?.servExt || 0,
                                      c: copy[entryIdx].monthlyData[entry.startMonth || 1]?.correctivo || 0
                                    };
                                    applyFrequencyLogic(entryIdx, val, currentBaseAmounts, entry.startMonth || 1);
                                  }
                                }}
                              >
                                <option value="personalizado">Personalizada (Nombre Libre)</option>
                                <option value="semanal">Semanal</option>
                                <option value="quincenal">Quincenal</option>
                                <option value="mensual">Mensual</option>
                                <option value="bimensual">Bimensual</option>
                                <option value="trimestral">Trimestral</option>
                                <option value="semestral">Semestral</option>
                                <option value="anual">Anual</option>
                                <option value="hito">Hito / Mes Específico</option>
                              </select>
                            </div>

                            {['bimensual', 'trimestral', 'semestral', 'anual', 'hito'].includes(entry.frecuencia.toLowerCase()) && (
                              <div className="animate-in fade-in duration-300">
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-wider">Empieza en Mes</label>
                                <select
                                  value={entry.startMonth || 1}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm"
                                  onChange={(e) => {
                                    const copy = [...manualEntries];
                                    const currentBaseAmounts = {
                                      b: copy[entryIdx].monthlyData[entry.startMonth || 1]?.bodega || 0,
                                      s: copy[entryIdx].monthlyData[entry.startMonth || 1]?.servExt || 0,
                                      c: copy[entryIdx].monthlyData[entry.startMonth || 1]?.correctivo || 0
                                    };
                                    applyFrequencyLogic(entryIdx, entry.frecuencia, currentBaseAmounts, Number(e.target.value));
                                  }}
                                >
                                  {months.map((m, i) => (
                                    <option key={i + 1} value={i + 1}>{m}</option>
                                  ))}
                                </select>
                              </div>
                            )}

                            <div className={['bimensual', 'trimestral', 'semestral', 'anual', 'hito'].includes(entry.frecuencia.toLowerCase()) ? 'md:col-span-1' : 'md:col-span-2'}>
                              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-wider">Nombre de la Frecuencia</label>
                              <input
                                type="text"
                                value={entry.frecuencia}
                                disabled={entry.isPredefined}
                                onChange={(e) => {
                                  const copy = [...manualEntries];
                                  copy[entryIdx].frecuencia = e.target.value;
                                  setManualEntries(copy);
                                }}
                                placeholder="Ej: Mantenimiento Especial"
                                className={`w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500/20 outline-none transition-all ${entry.isPredefined ? 'bg-slate-100 text-slate-500 border-slate-100' : 'bg-white border-slate-200'}`}
                              />
                            </div>

                            {entry.frecuencia !== 'personalizado' && (
                              <div className="flex items-end gap-2 animate-in fade-in duration-300">
                                <div className="flex-1">
                                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 tracking-wider text-center">Montos de Referencia</label>
                                  <div className="flex gap-1">
                                    <input type="number" placeholder="Bod." className="w-1/3 p-2 text-[10px] bg-white border rounded"
                                      value={entry.monthlyData[entry.startMonth || 1]?.bodega || ''}
                                      onChange={(e) => {
                                        const copy = [...manualEntries];
                                        const sm = copy[entryIdx].startMonth || 1;
                                        applyFrequencyLogic(entryIdx, entry.frecuencia, { b: Number(e.target.value), s: copy[entryIdx].monthlyData[sm].servExt, c: copy[entryIdx].monthlyData[sm].correctivo }, sm);
                                      }}
                                    />
                                    <input type="number" placeholder="Serv." className="w-1/3 p-2 text-[10px] bg-white border rounded"
                                      value={entry.monthlyData[entry.startMonth || 1]?.servExt || ''}
                                      onChange={(e) => {
                                        const copy = [...manualEntries];
                                        const sm = copy[entryIdx].startMonth || 1;
                                        applyFrequencyLogic(entryIdx, entry.frecuencia, { b: copy[entryIdx].monthlyData[sm].bodega, s: Number(e.target.value), c: copy[entryIdx].monthlyData[sm].correctivo }, sm);
                                      }}
                                    />
                                    <input type="number" placeholder="Corr." className="w-1/3 p-2 text-[10px] bg-white border rounded"
                                      value={entry.monthlyData[entry.startMonth || 1]?.correctivo || ''}
                                      onChange={(e) => {
                                        const copy = [...manualEntries];
                                        const sm = copy[entryIdx].startMonth || 1;
                                        applyFrequencyLogic(entryIdx, entry.frecuencia, { b: copy[entryIdx].monthlyData[sm].bodega, s: copy[entryIdx].monthlyData[sm].servExt, c: Number(e.target.value) }, sm);
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="overflow-x-auto bg-white rounded-xl border border-slate-200">
                            <table className="w-full text-left text-[10px]">
                              <thead className="bg-slate-50 border-b border-slate-100">
                                <tr className="text-slate-400 font-black">
                                  <th className="py-2 px-3 w-16">Mes</th>
                                  <th className="py-2 px-1">Bodega</th>
                                  <th className="py-2 px-1">Serv. Ext</th>
                                  <th className="py-2 px-1">Correctivo</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-50">
                                {months.map((m, mIdx) => {
                                  const monthNum = mIdx + 1;
                                  const data = entry.monthlyData[monthNum];
                                  const isLocked = entry.frecuencia !== 'personalizado';
                                  return (
                                    <tr key={monthNum} className={isLocked ? 'bg-slate-50/50' : ''}>
                                      <td className="py-1.5 px-3 font-bold text-slate-500 uppercase">{m}</td>
                                      <td className="py-1 px-1">
                                        <input
                                          type="number"
                                          value={data.bodega || ''}
                                          disabled={isLocked}
                                          onChange={(e) => {
                                            const copy = [...manualEntries];
                                            copy[entryIdx].monthlyData[monthNum].bodega = Number(e.target.value);
                                            setManualEntries(copy);
                                          }}
                                          className={`w-full px-2 py-1 bg-white border ${isLocked ? 'border-transparent text-slate-400' : 'border-slate-100'} rounded text-right transition-all`}
                                        />
                                      </td>
                                      <td className="py-1 px-1">
                                        <input
                                          type="number"
                                          value={data.servExt || ''}
                                          disabled={isLocked}
                                          onChange={(e) => {
                                            const copy = [...manualEntries];
                                            copy[entryIdx].monthlyData[monthNum].servExt = Number(e.target.value);
                                            setManualEntries(copy);
                                          }}
                                          className={`w-full px-2 py-1 bg-white border ${isLocked ? 'border-transparent text-slate-400' : 'border-slate-100'} rounded text-right transition-all`}
                                        />
                                      </td>
                                      <td className="py-1 px-1">
                                        <input
                                          type="number"
                                          value={data.correctivo || ''}
                                          disabled={isLocked}
                                          onChange={(e) => {
                                            const copy = [...manualEntries];
                                            copy[entryIdx].monthlyData[monthNum].correctivo = Number(e.target.value);
                                            setManualEntries(copy);
                                          }}
                                          className={`w-full px-2 py-1 bg-white border ${isLocked ? 'border-transparent text-slate-400' : 'border-slate-100'} rounded text-right transition-all`}
                                        />
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {manualEntries.length === 0 && (
                    <div className="py-12 border-2 border-dashed border-slate-200 rounded-2xl text-center">
                      <p className="text-slate-400 text-sm">No hay líneas de presupuesto. Agregue una para comenzar.</p>
                      <button
                        onClick={() => setManualEntries([createEmptyEntry('mensual')])}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold"
                      >
                        Comenzar con Nueva Línea
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all"
          >
            Cancelar
          </button>
          {selectedAsset && (
            <button
              onClick={handleSaveInternal}
              disabled={saveLoading}
              className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2 disabled:bg-slate-300 disabled:shadow-none"
            >
              {saveLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Guardar Presupuesto
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
