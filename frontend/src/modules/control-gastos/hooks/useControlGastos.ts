
import { useState } from 'react';
import { ControlGastosService } from '../services/ControlGastosService';

export const useControlGastos = () => {
    const [loadingCount, setLoadingCount] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const loading = loadingCount > 0;

    const uploadPresupuesto = async (file: File) => {
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
    };

    const getPresupuesto = async (anio: number = 2026, planta?: string) => {
        setLoadingCount(prev => prev + 1);
        setError(null);
        try {
            return await ControlGastosService.getPresupuesto(anio, planta);
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoadingCount(prev => Math.max(0, prev - 1));
        }
    };

    const getGastosConsolidados = async (anio: number = 2026, planta?: string) => {
        setLoadingCount(prev => prev + 1);
        setError(null);
        try {
            return await ControlGastosService.getGastosConsolidados(anio, planta);
        } catch (err: any) {
            setError(err.message);
            throw err;
        } finally {
            setLoadingCount(prev => Math.max(0, prev - 1));
        }
    };

    return {
        uploadPresupuesto,
        getPresupuesto,
        getGastosConsolidados,
        loading,
        error
    };
};
