// src/shared/services/PlanificacionService.ts
import type { PlanResult, ProcesoExcelResponse, HorarioTecnico } from "../../modules/planificacion/types";
import { API_ENDPOINTS } from "../../shared/api/config";

const API_BASE = API_ENDPOINTS.PLANIFICACION;


export async function procesarExcelEnServidor(
    archivo: File,
    modo: 'STRICT' | 'BALANCED',
    semana?: string,
    mes?: number,
    anio?: number
): Promise<ProcesoExcelResponse | null> {
    try {
        const formData = new FormData();
        formData.append('file', archivo);
        formData.append('modo', modo);
        if (semana) formData.append('semana', semana);
        if (mes) formData.append('mes', String(mes));
        if (anio) formData.append('anio', String(anio));

        const response = await fetch(`${API_BASE}/procesar`, {
            method: 'POST',
            body: formData, // El navegador configura automáticamente el boundary para archivos
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Error en el procesamiento remoto");
        }

        return await response.json() as ProcesoExcelResponse;
    } catch (error) {
        console.error("Error al procesar en servidor:", error);
        return null;
    }
}

/**
 * Obtiene los horarios (matriz de turnos) desde la base de datos.
 */
export async function getHorarios(periodo: string, planta?: string): Promise<{ data: HorarioTecnico[] } | null> {
    try {
        const url = new URL(`${API_BASE}/horarios`);
        url.searchParams.append('periodo', periodo);
        if (planta) url.searchParams.append('planta', planta);

        const response = await fetch(url.toString());

        if (!response.ok) throw new Error("Error al obtener horarios de la DB");

        return await response.json();
    } catch (error) {
        console.error("Error en getHorarios:", error);
        return null;
    }
}

/**
 * Persiste la planificación ajustada.
 * Se utiliza el periodo (YYYY-MM) para identificar el mes/anio.
 */
export async function guardarPlanificacion(
    datos: PlanResult[],
    planta: string,
    periodo: string
): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE}/guardar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                datos,
                planta,
                periodo,
                fechaCarga: new Date().toISOString()
            }),
        });
        return response.ok;
    } catch (error) {
        console.error("Error al guardar:", error);
        return false;
    }
}

/**
 * Sincroniza el cambio de un turno individual.
 */
export async function actualizarTurnoTecnico(
    nombre: string,
    turnos: string[],
    periodo: string
): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE}/horarios`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, turnos, periodo }),
        });
        return response.ok;
    } catch (error) {
        console.error("Error al actualizar turno:", error);
        return false;
    }
}

/**
 * Obtiene los resultados de planificación (OTs asignadas) desde la DB.
 */
export async function getResultadosPlanificacion(periodo: string, planta?: string): Promise<ProcesoExcelResponse | null> {
    try {
        const url = new URL(`${API_BASE}/resultados`);
        url.searchParams.append('periodo', periodo);
        if (planta) url.searchParams.append('planta', planta);

        const response = await fetch(url.toString());
        if (!response.ok) throw new Error("Error al obtener resultados");
        return await response.json() as ProcesoExcelResponse;
    } catch (error) {
        console.error("Error en getResultadosPlanificacion:", error);
        return null;
    }
}


export async function ejecutarPlanificacionRemota(
    modo: 'STRICT' | 'BALANCED',
    periodo: string,
    planta?: string
): Promise<ProcesoExcelResponse | null> {
    try {
        const response = await fetch(`${API_BASE}/ejecutar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ modo, periodo, planta }),
        });

        if (!response.ok) throw new Error("Error en la ejecución remota");
        return await response.json();
    } catch (error) {
        console.error("Error al ejecutar plan en servidor:", error);
        return null;
    }
}

export async function uploadHorarios(
    file: File,
    mes: number,
    anio: number
): Promise<any> {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('mes', String(mes));
        formData.append('anio', String(anio));

        const response = await fetch(`${API_BASE}/upload-horarios`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Error al cargar horarios");
        }
        return await response.json();
    } catch (error) {
        console.error("Error en uploadHorarios:", error);
        throw error;
    }
}