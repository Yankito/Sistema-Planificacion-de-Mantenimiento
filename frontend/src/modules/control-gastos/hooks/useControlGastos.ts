import { useState, useCallback } from 'react';
import { ControlGastosService } from '../services/ControlGastosService';

export const useControlGastos = () => {
  const [loadingCount, setLoadingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loading = loadingCount > 0;

  const uploadPresupuesto = useCallback(async (file: File) => {
    setLoadingCount(prev => prev + 1);
    setError(null);
    try {
      return await ControlGastosService.uploadPresupuesto(file);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoadingCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  const getPresupuesto = useCallback(async (anio: number, planta?: string, silent: boolean = false) => {
    if (!silent) setLoadingCount(prev => prev + 1);
    setError(null);
    try {
      return await ControlGastosService.getPresupuesto(anio, planta);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      if (!silent) setLoadingCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  const getGastosConsolidados = useCallback(async (anio: number, planta?: string, silent: boolean = false) => {
    if (!silent) setLoadingCount(prev => prev + 1);
    setError(null);
    try {
      return await ControlGastosService.getGastosConsolidados(anio, planta);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      if (!silent) setLoadingCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  const searchAssetsByCentroCosto = useCallback(async (cc: string) => {
    setLoadingCount(prev => prev + 1);
    try {
      return await ControlGastosService.searchAssetsByCentroCosto(cc);
    } finally {
      setLoadingCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  const updateAssetName = useCallback(async (oldName: string, newName: string, anio: number) => {
    setLoadingCount(prev => prev + 1);
    try {
      return await ControlGastosService.updateAssetName(oldName, newName, anio);
    } finally {
      setLoadingCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  const autoFixAssets = useCallback(async (anio: number) => {
    setLoadingCount(prev => prev + 1);
    try {
      return await ControlGastosService.autoFixAssets(anio);
    } finally {
      setLoadingCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  const getMaintainableAssets = useCallback(async (search?: string, silent: boolean = false) => {
    if (!silent) setLoadingCount(prev => prev + 1);
    try {
      return await ControlGastosService.getMaintainableAssets(search);
    } finally {
      if (!silent) setLoadingCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  const saveManualPresupuesto = useCallback(async (rows: any[]) => {
    setLoadingCount(prev => prev + 1);
    try {
      await ControlGastosService.saveManualPresupuesto(rows);
    } finally {
      setLoadingCount(prev => Math.max(0, prev - 1));
    }
  }, []);


  return {
    uploadPresupuesto,
    getPresupuesto,
    getGastosConsolidados,
    searchAssetsByCentroCosto,
    updateAssetName,
    autoFixAssets,
    getMaintainableAssets,
    saveManualPresupuesto,
    loading,
    error
  };
};
