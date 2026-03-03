import { useState, useCallback } from 'react';
import { ControlGastosService } from '../services/ControlGastosService';
import type { PresupuestoRow } from '../types';

export const useControlGastos = () => {
  const [loadingCount, setLoadingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loading = loadingCount > 0;

  const uploadPresupuesto = useCallback(async (file: File) => {
    // Para acciones iniciadas por el usuario (click), no es estrictamente necesario diferir,
    // pero lo hacemos por consistencia.
    setLoadingCount(prev => prev + 1);
    setError(null);
    try {
      return await ControlGastosService.uploadPresupuesto(file);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      throw error;
    } finally {
      setLoadingCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  const getPresupuesto = useCallback(async (anio: number, planta?: string, activo?: string, mes?: number, silent: boolean = false) => {
    if (!silent) setLoadingCount(prev => prev + 1);
    setError(null);
    try {
      return await ControlGastosService.getPresupuesto(anio, planta, activo, mes);
    } catch (err) {
      const error = err as Error;
      setError(error.message);
      throw error;
    } finally {
      if (!silent) setLoadingCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  const getGastosConsolidados = useCallback(async (anio: number, planta?: string, mes?: number, silent: boolean = false) => {
    if (!silent) setLoadingCount(prev => prev + 1);
    setError(null);
    try {
      return await ControlGastosService.getGastosConsolidados(anio, planta, mes);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    } finally {
      if (!silent) setLoadingCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  const searchAssetsByCentroCosto = useCallback(async (cc: string) => {
    setLoadingCount(prev => prev + 1);
    setError(null);
    try {
      return await ControlGastosService.searchAssetsByCentroCosto(cc);
    } finally {
      setLoadingCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  const updateAssetName = useCallback(async (oldName: string, newName: string, anio: number) => {
    setLoadingCount(prev => prev + 1);
    setError(null);
    try {
      return await ControlGastosService.updateAssetName(oldName, newName, anio);
    } finally {
      setLoadingCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  const autoFixAssets = useCallback(async (anio: number) => {
    setLoadingCount(prev => prev + 1);
    setError(null);
    try {
      return await ControlGastosService.autoFixAssets(anio);
    } finally {
      setLoadingCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  const getMaintainableAssets = useCallback(async (search?: string, silent: boolean = false) => {
    if (!silent) setLoadingCount(prev => prev + 1);
    setError(null);
    try {
      return await ControlGastosService.getMaintainableAssets(search);
    } finally {
      if (!silent) setLoadingCount(prev => Math.max(0, prev - 1));
    }
  }, []);

  const saveManualPresupuesto = useCallback(async (rows: PresupuestoRow[]) => {
    setLoadingCount(prev => prev + 1);
    setError(null);
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
