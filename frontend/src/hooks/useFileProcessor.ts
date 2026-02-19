import { useState } from "react";
import * as SeguimientoService from "../shared/services/SeguimientoService";
import type { FallaRow } from "../modules/fallas/types";
import * as FallasService from "../shared/services/FallasService";

import * as PlanificacionService from '../shared/services/PlanificacionService'; // Asumiendo que existe
import type { PlanResult } from "../modules/planificacion/types";

interface ProcessorActions {
  onPlanLoaded: (workbook: PlanResult[]) => void; // Recibe el resultado del procesamiento del Excel de planificación
  onSeguimientoLoaded: () => void; // Recarga el historial tras subir
  onFallasLoaded: (data: FallaRow[]) => void;
  targetWeek: string;
}


export const useFileProcessor = ({ targetWeek, onPlanLoaded, onFallasLoaded, onSeguimientoLoaded }: ProcessorActions) => {
  const [loading, setLoading] = useState({ plan: false, seguimiento: false, fallas: false });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, tipo: 'PLAN' | 'SEGUIMIENTO' | 'FALLAS') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(prev => ({ ...prev, [tipo.toLowerCase()]: true }));

    try {
      if (tipo === 'PLAN') {
        // Enviar a endpoint de planificación
        const data = await PlanificacionService.procesarExcelEnServidor(file, 'BALANCED');
        if (data)
          onPlanLoaded(data.resultados);
        else 
          alert("Error al procesar el archivo de planificación en el servidor.");
      } 
      else if (tipo === 'SEGUIMIENTO') {
        await SeguimientoService.uploadExcel(file, targetWeek);
        
        // Si el backend respondió OK, solo avisamos que cargue
        await onSeguimientoLoaded();
      }
      else if (tipo === 'FALLAS') {
        // El back procesa el Excel "Detalle MTBF MTTR" y nos devuelve el JSON listo
        const datosProcesados = await FallasService.uploadFallas(file);
        onFallasLoaded(datosProcesados);
      }

    } catch (error) {
      console.error("Error procesando archivo:", error);
      alert(error instanceof Error ? error.message : "Error al subir el archivo.");
    } finally {
      setLoading(prev => ({ ...prev, [tipo.toLowerCase()]: false }));
      e.target.value = "";
    }
  };

  return { handleFileUpload, loading };
};