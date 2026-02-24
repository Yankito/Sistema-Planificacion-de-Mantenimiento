// Hook para obtener las plantas accesibles al usuario autenticado
// Filtra cualquier lista de plantas según los permisos del usuario
import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';

// Todas las plantas posibles del sistema
const TODAS_LAS_PLANTAS_SISTEMA = ['PF1', 'PF2', 'PF3', 'PF4', 'PF5', 'PF6', 'CDT', 'MPS', 'OTROS', 'DC', 'VENTAS'];

// Plantas que conforman el grupo "Complejo Industrial" (CI)
const PLANTAS_COMPLEJO = ['PF3', 'PF4', 'PF5', 'PF6', 'CDT', 'OTROS', 'DC', 'VENTAS'];

// Plantas que conforman "PF Alimentos" completo
const PLANTAS_PF_ALIMENTOS_FULL = ['PF1', 'PF2', ...PLANTAS_COMPLEJO];

/**
 * Hook que retorna las plantas del usuario y utilidades de filtrado.
 * Todas las vistas deben usar este hook en lugar de listas hardcoded.
 */
export const usePlantasAcceso = () => {
  const { user } = useAuth();

  // Plantas asignadas al usuario (desde PF_EAM_ACCESO_PLANTAS)
  const plantasUsuario = useMemo(() => user?.plantas || [], [user]);

  // Filtra una lista de plantas para mostrar solo las accesibles al usuario
  const filtrarPlantas = useMemo(() => {
    return (listaOriginal: string[]): string[] => {
      if (plantasUsuario.length === 0) return [];
      return listaOriginal.filter(p => plantasUsuario.includes(p));
    };
  }, [plantasUsuario]);

  // Plantas individuales del usuario (para selectores y listados)
  const plantasIndividuales = useMemo(() =>
    filtrarPlantas(TODAS_LAS_PLANTAS_SISTEMA),
    [filtrarPlantas]
  );

  // Subconjunto de plantasUsuario que son del Complejo Industrial
  const plantasComplejo = useMemo(() =>
    filtrarPlantas(PLANTAS_COMPLEJO),
    [filtrarPlantas]
  );

  // Subconjunto de plantasUsuario que son PF Alimentos
  const plantasPFAlimentos = useMemo(() =>
    filtrarPlantas(PLANTAS_PF_ALIMENTOS_FULL),
    [filtrarPlantas]
  );

  // Para planificación/horarios (agrupación CI como opción virtual si tiene todas las del CI)
  const plantasPlanificacion = useMemo(() => {
    const base = filtrarPlantas(['PF1', 'PF2', 'PF3', 'PF4', 'PF5', 'PF6', 'CDT', 'OTROS']);
    const plantasCI = ['PF3', 'PF4', 'PF5', 'PF6', 'CDT', 'OTROS'];
    const tieneCI = plantasCI.every(p => plantasUsuario.includes(p));
    if (tieneCI && !base.includes('CI')) {
      // Insertar CI después de PF6
      const idx = base.indexOf('CDT');
      if (idx >= 0) base.splice(idx, 0, 'CI');
      else base.push('CI');
    }
    return base;
  }, [filtrarPlantas, plantasUsuario]);

  // Primera planta disponible (para valor por defecto en selectores)
  const plantaDefault = useMemo(() =>
    plantasIndividuales[0] || 'PF1',
    [plantasIndividuales]
  );

  // Verificar si el usuario tiene acceso a una planta específica
  const tieneAcceso = useMemo(() => {
    return (planta: string): boolean => {
      if (planta === 'CI') {
        // CI es virtual — necesita todas las plantas del complejo
        const plantasCI = ['PF3', 'PF4', 'PF5', 'PF6', 'CDT', 'OTROS'];
        return plantasCI.every(p => plantasUsuario.includes(p));
      }
      if (planta === 'TODAS' || planta === 'CONSOLIDADO') return true;
      return plantasUsuario.includes(planta);
    };
  }, [plantasUsuario]);

  return {
    plantasUsuario,       // Lista cruda de plantas del usuario
    plantasIndividuales,  // Para selectores: solo plantas individuales accesibles
    plantasComplejo,      // Subconjunto CI accesible
    plantasPFAlimentos,   // Subconjunto PF Alimentos accesible
    plantasPlanificacion, // Con CI virtual si aplica
    plantaDefault,        // Primera planta disponible
    tieneAcceso,          // Verificar acceso a una planta
    filtrarPlantas,       // Filtrar cualquier lista por acceso
  };
};
