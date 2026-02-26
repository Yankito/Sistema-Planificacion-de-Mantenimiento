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

    return {
        data,
        isLoading,
        error,
        loadData
    };
};
