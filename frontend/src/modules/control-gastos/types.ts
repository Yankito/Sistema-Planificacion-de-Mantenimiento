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
    centroCosto: string;
    frecuencia: string;
    mes: number;
    anio: number;
    montoBodega: number;
    montoServExt: number;
    montoCorrectivo: number;
    claseContable?: string;
    mantenible?: string;
}

export interface GastoConsolidadoRow {
    tipo: string;
    planta: string;
    claseContable: string;
    numeroOt: string;
    tipoOt: string;
    nroActivo: string;
    descripcionArticulo: string;
    fechaTrx: string;
    fechaOtPro?: string;
    costoTrx: number;
    tipoGasto: string; // HITO, BODEGA, SERV_EXT, CORRECTIVO
    centroCosto: string;
    anio: number;
    mes: number;
    alertaFecha?: number;
    descripcionOt?: string;
    estadoTrabajo?: string;
    esHito?: boolean;
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
