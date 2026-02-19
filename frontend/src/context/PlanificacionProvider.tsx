import React, { useMemo } from 'react';
import { PlanificacionContext } from './PlanificacionContext';
import { usePlanificacionManager } from '../modules/planificacion/hooks/usePlanificacionManager';
import { useSeguimientoData } from '../modules/seguimiento/hooks/useSeguimientoData';
import { useFallasManager } from '../modules/fallas/hooks/useFallasManager';
import { getMonthOptions } from '../shared/utils/dateUtils';

export const PlanificacionProvider = ({ children }: { children: React.ReactNode }) => {
    const planning = usePlanificacionManager();
    const seguimiento = useSeguimientoData();
    const fallas = useFallasManager();

    // Podemos derivar la semana actual de las opciones disponibles o de planning
    const semanaActual = planning.mesSeleccionado || getMonthOptions().default;

    const value = useMemo(() => ({
        planning,
        seguimiento,
        fallas,
        config: {
            semanaActual
        }
    }), [planning, seguimiento, fallas, semanaActual]);

    return (
        <PlanificacionContext.Provider value={value}>
            {children}
        </PlanificacionContext.Provider>
    );
};
