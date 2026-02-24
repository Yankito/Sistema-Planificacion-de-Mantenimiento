export interface PresupuestoItem {
    id: string;
    nivel: 'Maquinaria' | 'Redes' | 'Infraestructura';
    activo: string;
    presupuestoMensual: number;
    presupuestoAnual: number;
}

export interface EjecucionGasto {
    id: string;
    activo: string;
    planta: string;
    centroCosto: string;
    gastoReal: number;
    presupuesto: number;
    estado: 'En Rango' | 'Alerta' | 'Excedido';
    otId?: string;
    otEstado?: 'Abierta' | 'Cerrada' | 'En Progreso';
}

export interface DetalleGastoItem {
    id: string;
    concepto: string; // e.g. "Rodamiento SKF"
    monto: number;
    categoria: 'Bodega' | 'Servicios Externos' | 'Gasto Correctivo' | 'Hito';
    fecha: string;
    otId: string;
    assetCategory?: 'Maquinaria' | 'Redes' | 'Infra' | 'Otros';
}

import type { PresupuestoRow, GastoConsolidadoRow } from '../../shared/types';

export { type PresupuestoRow, type GastoConsolidadoRow };
export interface ManualEntryLine {
    id: string;
    frecuencia: string;
    isPredefined: boolean;
    collapsed?: boolean;
    startMonth?: number;
    monthlyData: {
        [month: number]: {
            bodega: number;
            servExt: number;
            correctivo: number;
            locked: boolean;
        }
    }
}

export const FRECUENCIAS_PREDEFINIDAS = ['semanal', 'quincenal', 'mensual', 'bimensual', 'trimestral', 'semestral', 'anual', 'hito'];
