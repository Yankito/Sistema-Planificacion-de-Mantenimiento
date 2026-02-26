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

export interface PresupuestoRow {
    activo: string;
    mes: number;
    anio: number;
    frecuencia: string;
    montoBodega?: number;
    montoServExt?: number;
    montoCorrectivo?: number;
    centroCosto?: string;
    claseContable?: string;
    mantenible?: string;
    organizacion?: string;
}

export interface GastoConsolidadoRow {
    tipo: string;
    numeroOt: string;
    tipoOt: string;
    nroActivo: string;
    fechaTrx: Date | string;
    descripcionArticulo: string;
    costoTrx: number;
    alertaFecha?: number;
    centroCosto?: string;
    anio?: number;
    mes?: number;
    tipoGasto?: string;
    fechaOtPro?: Date | string;
    descripcionOt?: string;
    estadoTrabajo?: string;
    esHito?: boolean;
    planta?: string;
    claseContable?: string;
    mantenible?: string;
}

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
