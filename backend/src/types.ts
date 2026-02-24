export interface ActivoEAM {
    activo: string;
    claseContable: string;
    organizacion: string;
}

export interface Tecnico {
    nombre: string;
    rol: string;
    planta: string;
    activo?: number | boolean;
    key?: string;
    esSugerido?: boolean;
    turnos?: string[] | null;
    existe?: boolean;
}

export interface TecnicoEstado {
    tecnico: Tecnico;
    opFinalizada: boolean;
}

export interface OrdenTrabajo {
    nroOrden: string;
    equipo: string;
    descripcion: string;
    planta: string;
    estado: string;
    fechaSugerida?: string | null;
    tecnicos?: Tecnico[];
    periodo?: string;
    mes?: number;
    anio?: number;
    esOB?: boolean;
    // Campos para seguimiento
    id?: string;
    ot?: string;
    nroActivo?: string;
    clasificacion?: "CUMPLIDA" | "TECNICO / SERVICIO" | "PROGRAMADOR" | "OC / OTRO";
    semana?: string;
    detallesTecnicos?: TecnicoEstado[];
    fecha?: string;
    rmd?: string;
    rse?: string;
    // Campos brutos de DB (usados en logs/lógica intermedia)
    OT?: string;
    NRO_ACTIVO?: string;
    DESCRIPCION?: string;
    PLANTA?: string;
    ESTADO?: string;
}

export interface Horario {
    nombre: string;
    rol: string;
    planta: string;
    turnos: string[];
}

export interface PlanificacionRespuesta {
    resultados: OrdenTrabajo[];
    sinAsignar: OrdenTrabajo[];
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

export interface FallaRow {
    id?: number;
    fecha: Date | string;
    semana: string | number;
    planta: string;
    area: string;
    linea: string;
    equipo: string;
    causa: string;
    estadoPedido: string;
    tipoPedido: string;
    tecnico: string;
    ot?: string;
    duracionMinutos: number;
    gasto: number;
    perdidaKg: number;
    anio: number;
    mes: number;
    descripcionOperador: string;
}

export interface UsuarioAuth {
    usuario: string;
    primerNombre: string;
    segundoNombre: string | null;
    primerApellido: string;
    segundoApellido: string | null;
    nombreCompleto: string;
    roles: string[];
    plantas: string[];
    tieneCI: boolean;
}

export interface AuthSession {
    user: UsuarioAuth;
    token: string;
    expiresAt: number;
}