// src/shared/services/PlanificacionService.ts
import type { PlanResult, HorarioTecnico, ProcesoExcelResponse } from "../types";
import { API_ENDPOINTS } from "../../../shared/api/config";
import { fetchAuth } from "../../../shared/api/fetchAuth";

const API_BASE = API_ENDPOINTS.PLANIFICACION;

/**
 * Obtiene los horarios (matriz de turnos) desde la base de datos.
 */
export async function getHorarios(mes: number, anio: number, planta?: string): Promise<{ data: HorarioTecnico[] } | null> {
    try {
        const url = new URL(`${API_BASE}/horarios`);
        url.searchParams.append('mes', String(mes));
        url.searchParams.append('anio', String(anio));
        if (planta) url.searchParams.append('planta', planta);

        const response = await fetchAuth(url.toString());

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
        const response = await fetchAuth(`${API_BASE}/guardar`, {
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
        const response = await fetchAuth(`${API_BASE}/horarios`, {
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
export async function getResultadosPlanificacion(mes: number, anio: number, planta?: string): Promise<ProcesoExcelResponse | null> {
    try {
        const url = new URL(`${API_BASE}/resultados`);
        url.searchParams.append('mes', String(mes));
        url.searchParams.append('anio', String(anio));
        if (planta) url.searchParams.append('planta', planta);

        const response = await fetchAuth(url.toString());
        if (!response.ok) throw new Error("Error al obtener resultados");
        return await response.json() as ProcesoExcelResponse;
    } catch (error) {
        console.error("Error en getResultadosPlanificacion:", error);
        return null;
    }
}


export async function ejecutarPlanificacionRemota(
    modo: 'STRICT' | 'BALANCED',
    mes: number,
    anio: number,
    planta?: string
): Promise<ProcesoExcelResponse | null> {
    try {
        console.log("ejecutando planificacion remota...");
        const response = await fetchAuth(`${API_BASE}/ejecutar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ modo, mes, anio, planta }),
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
): Promise<{ success: boolean; message: string }> {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('mes', String(mes));
        formData.append('anio', String(anio));

        const response = await fetchAuth(`${API_BASE}/upload-horarios`, {
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