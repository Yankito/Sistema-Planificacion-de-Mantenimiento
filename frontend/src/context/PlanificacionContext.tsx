import { createContext, useContext } from 'react';
import { usePlanificacionManager } from '../modules/planificacion/hooks/usePlanificacionManager';
import { useSeguimientoData } from '../modules/seguimiento/hooks/useSeguimientoData';
import { useFallasManager } from '../modules/fallas/hooks/useFallasManager';


type PlanificacionContextType = {
  planning: ReturnType<typeof usePlanificacionManager>;
  seguimiento: ReturnType<typeof useSeguimientoData>;
  fallas: ReturnType<typeof useFallasManager>;
  config: {
    semanaActual: string;
  };
};

export const PlanificacionContext = createContext<PlanificacionContextType | null>(null);

export const useData = () => {
  const context = useContext(PlanificacionContext);
  if (!context) {
    throw new Error('useData must be used within a PlanificacionProvider');
  }
  return context;
};
