import { useState, useCallback } from 'react';
import type { FallaRow } from '../types';
import * as FallasService from '../services/FallasService';
import { toast } from 'sonner';

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
            const msg = (err as Error).message || "Error desconocido al cargar fallas";
            setError(msg);
            toast.error("Error al cargar datos de fallas: " + msg);
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
            const msg = (err as Error).message;
            setError(msg);
            toast.error("Error al subir el archivo de fallas: " + msg);
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, [loadData]);


    return {
        data,
        isLoading,
        error,
        loadData,
        uploadFile
    };
};
