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
    <div className="fixed inset-0 bg-pf-neutral-900/80 z-[70] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-2xl border border-pf-neutral-200 w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in duration-300">
        <div className="p-6 border-b border-pf-neutral-100 flex justify-between items-center bg-white">
          <div>
            <h3 className="text-xl font-black text-pf-neutral-800 uppercase tracking-tight">Gestionar Presupuesto Manual</h3>
            <p className="text-[10px] text-pf-neutral-400 font-bold uppercase tracking-widest mt-1">Configuración personalizada de recursos por activo</p>
          </div>
          <button
            onClick={onClose}
            className="p-3 hover:bg-pf-red hover:text-white rounded-2xl text-pf-neutral-400 transition-all active:scale-95 border border-transparent hover:border-pf-red shadow-sm"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
          {!selectedAsset ? (
            <div className="space-y-6">
              <label className="block text-[10px] font-black text-pf-neutral-400 uppercase tracking-[0.2em] ml-1">Buscar Activo Maestro</label>
              <div className="relative group">
                {searchLoading ? (
                  <Loader2 className="absolute left-5 top-1/2 -translate-y-1/2 text-pf-red animate-spin" size={20} />
                ) : (
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-pf-neutral-300 group-focus-within:text-pf-red transition-colors" size={20} />
                )}
                <input
                  type="text"
                  placeholder="Escriba nombre del activo o clase contable..."
                  value={assetSearch}
                  onChange={(e) => handleSearchInternal(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-pf-neutral-50/50 border border-pf-neutral-200 rounded-[1.5rem] text-sm font-medium focus:ring-4 focus:ring-pf-red/5 focus:border-pf-red outline-none transition-all placeholder:text-pf-neutral-300"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                {maintainableAssets.map(asset => (
                  <button
                    key={asset.activo}
                    onClick={() => setSelectedAsset(asset)}
                    className="flex flex-col p-5 border border-pf-neutral-100 rounded-[1.5rem] hover:border-pf-red hover:bg-pf-red/5 transition-all text-left group cursor-pointer relative overflow-hidden active:scale-[0.98] shadow-sm hover:shadow-md"
                  >
                    <div className="absolute right-0 top-0 w-16 h-16 bg-pf-red/5 rounded-bl-full translate-x-8 -translate-y-8 group-hover:bg-pf-red/10 transition-colors"></div>
                    <span className="font-black text-pf-neutral-800 tracking-tight text-base mb-1 group-hover:text-pf-red transition-colors">{asset.activo}</span>
                    <span className="text-[10px] font-black text-pf-neutral-400 uppercase tracking-widest">{asset.claseContable} • {asset.organizacion}</span>
                  </button>
                ))}
                {assetSearch.length > 2 && maintainableAssets.length === 0 && (
                  <div className="col-span-full py-16 text-center text-pf-neutral-300 font-black uppercase tracking-[0.3em] text-[10px]">No se encontraron activos para esta búsqueda.</div>
                )}
                {assetSearch.length <= 2 && (
                  <div className="col-span-full py-16 text-center text-pf-neutral-300 font-black uppercase tracking-[0.2em] text-[10px]">Escriba al menos 3 caracteres para iniciar búsqueda ministerial...</div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in slide-in-from-right-10 duration-500 pb-12">
              <div className="flex flex-col sm:flex-row items-center justify-between bg-pf-neutral-50 p-6 rounded-[1.5rem] border border-pf-neutral-200 top-0 z-20 shadow-sm gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-[10px] uppercase font-black text-pf-neutral-400 tracking-widest mb-1.5 opacity-60">Ficha Presupuestaria de Activo</p>
                  <h4 className="font-black text-pf-neutral-800 text-lg tracking-tight">{selectedAsset.activo}</h4>
                </div>
                <div className="flex flex-wrap gap-4 items-center justify-center">
                  <button
                    onClick={() => setManualEntries([...manualEntries, createEmptyEntry(`Plan ${manualEntries.length + 1}`)])}
                    className="px-5 py-2.5 bg-pf-red text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2.5 transition-all hover:bg-black active:scale-95 shadow-lg shadow-pf-red/10"
                  >
                    <Plus size={16} /> Nuevo Plan
                  </button>
                  <button onClick={() => setSelectedAsset(null)} className="text-[10px] text-pf-neutral-400 font-black uppercase tracking-widest border-b border-pf-neutral-200 hover:border-pf-red hover:text-pf-red transition-all cursor-pointer px-1">Cambiar Activo</button>
                </div>
              </div>

              {dataLoading ? (
                <div className="py-32 flex flex-col items-center justify-center space-y-6">
                  <div className="relative">
                    <Loader2 className="w-16 h-16 text-pf-red animate-spin" />
                    <div className="absolute inset-0 bg-pf-red opacity-10 blur-xl animate-pulse rounded-full"></div>
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-pf-neutral-300 animate-pulse pl-1">Extrayendo datos financieros...</p>
                </div>
              ) : (
                <div className="space-y-8">
                  {manualEntries.map((entry, entryIdx) => (
                    <div key={entry.id} className="bg-pf-neutral-50/30 rounded-[2rem] border border-pf-neutral-100 relative group/entry shadow-sm overflow-hidden transition-all hover:shadow-md">
                      <div className="bg-white/80 backdrop-blur-sm px-8 py-5 border-b border-pf-neutral-100 flex items-center justify-between">
                        <div className="flex items-center gap-5">
                          <button
                            onClick={() => {
                              const copy = [...manualEntries];
                              copy[entryIdx].collapsed = !copy[entryIdx].collapsed;
                              setManualEntries(copy);
                            }}
                            className={`p-1.5 hover:bg-pf-neutral-800 hover:text-white rounded-xl text-pf-neutral-400 transition-all cursor-pointer ${entry.collapsed ? '' : 'bg-pf-neutral-50 shadow-inner'}`}
                          >
                            {entry.collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
                          </button>
                          <div>
                            <h5 className="font-black text-pf-neutral-800 uppercase tracking-tight mb-1">
                              {entry.frecuencia || 'Tarea sin nombre'}
                            </h5>
                            <div className="flex items-center gap-2">
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${entry.isPredefined ? 'bg-pf-blue-500 text-white border-pf-blue-600' : 'bg-pf-neutral-800 text-white border-pf-neutral-900'}`}>
                                {entry.isPredefined ? (entry.frecuencia === 'hito' ? 'HITO ESPECÍFICO' : `FREQ ${entry.frecuencia}`) : 'CATEGORÍA LIBRE'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setManualEntries(manualEntries.filter(e => e.id !== entry.id))}
                            className="p-2.5 text-pf-neutral-300 hover:text-pf-red hover:bg-pf-red/10 rounded-xl transition-all active:scale-90"
                            title="Eliminar planificación"
                          >
                            <X size={20} />
                          </button>
                        </div>
                      </div>

                      {!entry.collapsed && (
                        <div className="p-8 animate-in slide-in-from-top-4 duration-500">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
                            <div>
                              <label className="block text-[10px] font-black uppercase text-pf-neutral-400 mb-3 tracking-[0.2em] ml-1">Frecuencia</label>
                              <select
                                value={FRECUENCIAS_PREDEFINIDAS.includes(entry.frecuencia.toLowerCase()) ? entry.frecuencia.toLowerCase() : 'personalizado'}
                                className="w-full px-4 py-3 bg-white border border-pf-neutral-200 rounded-xl text-[11px] font-black uppercase tracking-wider focus:ring-4 focus:ring-pf-blue-500/10 focus:border-pf-blue-500 transition-all outline-none"
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const copy = [...manualEntries];
                                  if (val === 'personalizado') {
                                    copy[entryIdx].isPredefined = false;
                                    copy[entryIdx].frecuencia = 'Nuevo Plan';
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
                                <option value="hito">Hito</option>
                              </select>
                            </div>

                            {['bimensual', 'trimestral', 'semestral', 'anual', 'hito'].includes(entry.frecuencia.toLowerCase()) && (
                              <div className="animate-in fade-in slide-in-from-left-2 duration-500">
                                <label className="block text-[10px] font-black uppercase text-pf-neutral-400 mb-3 tracking-[0.2em] ml-1">Mes de Inicio</label>
                                <select
                                  value={entry.startMonth || 1}
                                  className="w-full px-4 py-3 bg-white border border-pf-neutral-200 rounded-xl text-[11px] font-black uppercase tracking-wider focus:ring-4 focus:ring-pf-blue-500/10 focus:border-pf-blue-500 transition-all outline-none"
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

                            {!entry.isPredefined && (
                              <div className="md:col-span-3 animate-in fade-in slide-in-from-right-2 duration-500">
                                <label className="block text-[10px] font-black uppercase text-pf-neutral-400 mb-3 tracking-[0.2em] ml-1">Nombre de Gasto Personalizado</label>
                                <input
                                  type="text"
                                  value={entry.frecuencia}
                                  onChange={(e) => {
                                    const copy = [...manualEntries];
                                    copy[entryIdx].frecuencia = e.target.value;
                                    setManualEntries(copy);
                                  }}
                                  placeholder="Ej: Mantención Refinería 01, Insumos Especiales, etc."
                                  className="w-full px-5 py-3.5 bg-white border border-pf-neutral-200 rounded-xl text-sm font-black uppercase tracking-wider focus:ring-4 focus:ring-pf-red/5 focus:border-pf-red outline-none transition-all"
                                />
                              </div>
                            )}

                            {entry.isPredefined && (
                              <div className={`${['bimensual', 'trimestral', 'semestral', 'anual', 'hito'].includes(entry.frecuencia.toLowerCase()) ? 'md:col-span-2' : 'md:col-span-3'} animate-in fade-in slide-in-from-right-2 duration-500`}>
                                <label className="block text-[10px] font-black uppercase text-pf-neutral-400 mb-3 tracking-[0.2em]">Montos de Referencia (Automáticos)</label>
                                <div className="grid grid-cols-3 gap-6">
                                  <div className="relative">
                                    <input type="number" placeholder="Bodega" className="w-full pl-5 pr-4 py-3.5 text-sm font-black bg-white border border-pf-neutral-200 rounded-xl focus:border-pf-blue-500 focus:ring-4 focus:ring-pf-blue-500/5 outline-none transition-all placeholder:text-[9px] shadow-sm"
                                      value={entry.monthlyData[entry.startMonth || 1]?.bodega || ''}
                                      onChange={(e) => {
                                        const copy = [...manualEntries];
                                        const sm = copy[entryIdx].startMonth || 1;
                                        applyFrequencyLogic(entryIdx, entry.frecuencia, { b: Number(e.target.value), s: copy[entryIdx].monthlyData[sm].servExt, c: copy[entryIdx].monthlyData[sm].correctivo }, sm);
                                      }}
                                    />
                                    <div className="absolute -top-1.5 -right-1 w-2.5 h-2.5 rounded-full bg-pf-blue-500 border-2 border-white shadow-sm"></div>
                                  </div>
                                  <div className="relative">
                                    <input type="number" placeholder="Serv." className="w-full pl-5 pr-4 py-3.5 text-sm font-black bg-white border border-pf-neutral-200 rounded-xl focus:border-pf-success-500 focus:ring-4 focus:ring-pf-success-500/5 outline-none transition-all placeholder:text-[9px] shadow-sm"
                                      value={entry.monthlyData[entry.startMonth || 1]?.servExt || ''}
                                      onChange={(e) => {
                                        const copy = [...manualEntries];
                                        const sm = copy[entryIdx].startMonth || 1;
                                        applyFrequencyLogic(entryIdx, entry.frecuencia, { b: copy[entryIdx].monthlyData[sm].bodega, s: Number(e.target.value), c: copy[entryIdx].monthlyData[sm].correctivo }, sm);
                                      }}
                                    />
                                    <div className="absolute -top-1.5 -right-1 w-2.5 h-2.5 rounded-full bg-pf-success-500 border-2 border-white shadow-sm"></div>
                                  </div>
                                  <div className="relative">
                                    <input type="number" placeholder="Corr." className="w-full pl-5 pr-4 py-3.5 text-sm font-black bg-white border border-pf-neutral-200 rounded-xl focus:border-pf-red focus:ring-4 focus:ring-pf-red/5 outline-none transition-all placeholder:text-[9px] shadow-sm"
                                      value={entry.monthlyData[entry.startMonth || 1]?.correctivo || ''}
                                      onChange={(e) => {
                                        const copy = [...manualEntries];
                                        const sm = copy[entryIdx].startMonth || 1;
                                        applyFrequencyLogic(entryIdx, entry.frecuencia, { b: copy[entryIdx].monthlyData[sm].bodega, s: copy[entryIdx].monthlyData[sm].servExt, c: Number(e.target.value) }, sm);
                                      }}
                                    />
                                    <div className="absolute -top-1.5 -right-1 w-2.5 h-2.5 rounded-full bg-pf-red border-2 border-white shadow-sm"></div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="overflow-x-auto bg-white/50 backdrop-blur-sm rounded-[1.5rem] border border-pf-neutral-100 shadow-inner">
                            <table className="w-full text-left text-[10px] min-w-[500px]">
                              <thead className="bg-pf-neutral-50 border-b border-pf-neutral-100">
                                <tr className="text-pf-neutral-400 font-black uppercase tracking-widest bg-pf-neutral-50/50">
                                  <th className="py-5 px-6 w-32 border-r border-pf-neutral-100">Mes Período</th>
                                  <th className="py-5 px-6 text-pf-blue-500 border-r border-pf-neutral-100">Presupuesto Bodega</th>
                                  <th className="py-5 px-6 text-pf-success-600 border-r border-pf-neutral-100">Servicios Externos</th>
                                  <th className="py-5 px-6 text-pf-red">Correctivo</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-pf-neutral-100/50">
                                {months.map((m, mIdx) => {
                                  const monthNum = mIdx + 1;
                                  const data = entry.monthlyData[monthNum];
                                  const isLocked = entry.isPredefined;
                                  return (
                                    <tr key={monthNum} className={`transition-all duration-300 ${isLocked ? 'bg-pf-neutral-50/10' : 'hover:bg-pf-blue-50/20'}`}>
                                      <td className="py-4 px-6 font-black text-pf-neutral-500 uppercase tracking-tighter border-r border-pf-neutral-100/50 bg-pf-neutral-50/30">{m}</td>
                                      <td className="py-3 px-6 border-r border-pf-neutral-100/50">
                                        <input
                                          type="number"
                                          value={data.bodega || ''}
                                          disabled={isLocked}
                                          onChange={(e) => {
                                            const copy = [...manualEntries];
                                            copy[entryIdx].monthlyData[monthNum].bodega = Number(e.target.value);
                                            setManualEntries(copy);
                                          }}
                                          className={`w-full px-5 py-3 bg-white border font-black text-sm ${isLocked ? 'border-transparent text-pf-neutral-300 bg-transparent' : 'border-pf-neutral-200 focus:border-pf-blue-500 focus:ring-4 focus:ring-pf-blue-500/5 outline-none shadow-sm'} rounded-xl text-right transition-all`}
                                        />
                                      </td>
                                      <td className="py-3 px-6 border-r border-pf-neutral-100/50">
                                        <input
                                          type="number"
                                          value={data.servExt || ''}
                                          disabled={isLocked}
                                          onChange={(e) => {
                                            const copy = [...manualEntries];
                                            copy[entryIdx].monthlyData[monthNum].servExt = Number(e.target.value);
                                            setManualEntries(copy);
                                          }}
                                          className={`w-full px-5 py-3 bg-white border font-black text-sm ${isLocked ? 'border-transparent text-pf-neutral-300 bg-transparent' : 'border-pf-neutral-200 focus:border-pf-success-500 focus:ring-4 focus:ring-pf-success-500/5 outline-none shadow-sm'} rounded-xl text-right transition-all`}
                                        />
                                      </td>
                                      <td className="py-3 px-6">
                                        <input
                                          type="number"
                                          value={data.correctivo || ''}
                                          disabled={isLocked}
                                          onChange={(e) => {
                                            const copy = [...manualEntries];
                                            copy[entryIdx].monthlyData[monthNum].correctivo = Number(e.target.value);
                                            setManualEntries(copy);
                                          }}
                                          className={`w-full px-5 py-3 bg-white border font-black text-sm ${isLocked ? 'border-transparent text-pf-neutral-300 bg-transparent' : 'border-pf-neutral-100/50 focus:border-pf-red focus:ring-4 focus:ring-pf-red/5 outline-none shadow-sm'} rounded-xl text-right transition-all`}
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
                    <div className="py-24 border-2 border-dashed border-pf-neutral-100 rounded-[2.5rem] bg-pf-neutral-50/30 text-center flex flex-col items-center">
                      <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border border-pf-neutral-100 mb-6 shadow-sm">
                        <Plus className="text-pf-neutral-300" size={32} />
                      </div>
                      <p className="text-pf-neutral-300 font-black uppercase tracking-[0.2em] text-[10px] mb-8">No hay líneas de planificación ministerial.</p>
                      <button
                        onClick={() => setManualEntries([createEmptyEntry('mensual')])}
                        className="px-8 py-3 bg-pf-neutral-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all hover:bg-black hover:scale-105 active:scale-95 shadow-xl shadow-pf-neutral-200"
                      >
                        Iniciar Nueva Resolución
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="p-6 bg-pf-neutral-50/80 border-t border-pf-neutral-100 flex justify-end gap-5">
          <button
            onClick={onClose}
            className="px-8 py-3 text-[10px] font-black uppercase tracking-widest text-pf-neutral-400 hover:bg-pf-red hover:text-white rounded-2xl transition-all active:scale-95 border border-transparent hover:border-pf-red hover:shadow-lg hover:shadow-pf-red/20"
          >
            Cancelar
          </button>
          {selectedAsset && (
            <button
              onClick={handleSaveInternal}
              disabled={saveLoading}
              className="px-10 py-3 bg-pf-success-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all hover:bg-pf-success-600 active:scale-95 shadow-xl shadow-pf-success-500/20 disabled:bg-pf-neutral-200 disabled:text-pf-neutral-400 disabled:shadow-none"
            >
              {saveLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Confirmar Presupuesto
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
