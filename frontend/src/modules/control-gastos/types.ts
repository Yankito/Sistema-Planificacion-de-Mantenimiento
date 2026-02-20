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
}

export interface PresupuestoRow {
    activo: string;
    centroCosto: string;
    tipoFila: string;
    mes: number;
    anio: number;
    montoBodega: number;
    montoServExt: number;
    montoCorrectivo: number;
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
}
