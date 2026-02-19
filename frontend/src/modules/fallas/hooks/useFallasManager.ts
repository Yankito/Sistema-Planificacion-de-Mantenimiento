import { useState, useCallback, useEffect } from 'react';
import type { FallaRow } from '../types';
import * as FallasService from '../../../shared/services/FallasService';

export const useFallasManager = () => {
    const [data, setData] = useState<FallaRow[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async (semana?: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await FallasService.getFallas(semana);
            setData(result);
        } catch (err) {
            console.error("Error cargando fallas:", err);
            setError((err as Error).message || "Error desconocido al cargar fallas");
        } finally {
            setIsLoading(false);
        }
    }, []);

    const uploadFile = useCallback(async (file: File) => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await FallasService.uploadFallas(file);
            // El upload retorna una lista actualizada o procesada?
            // El backend retorna: { message, count, semana }
            // Pero en FallasService.uploadFallas estábamos esperando FallaRow[]
            // Vamos a corregir esto. El backend controller retorna { message, count, semana }
            // Pero podríamos hacer que retorne los datos o recargarlos.

            // Asumamos que tras upload queremos recargar todo
            await loadData();
            return result;
        } catch (err) {
            console.error("Error subiendo fallas:", err);
            setError((err as Error).message);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [loadData]);

    // Cargar datos al montar
    useEffect(() => {
        loadData();
    }, [loadData]);

    return {
        data,
        isLoading,
        error,
        loadData,
        uploadFile
    };
};
