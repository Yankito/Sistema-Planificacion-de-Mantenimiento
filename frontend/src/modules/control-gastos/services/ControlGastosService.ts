import { API_ENDPOINTS } from '../../../shared/api/config';
import type { PresupuestoRow } from '../types';

const API_BASE = API_ENDPOINTS.CONTROL_GASTOS;

export class ControlGastosService {
    static async getPresupuesto(anio: number = 2026, planta?: string): Promise<PresupuestoRow[]> {
        const url = new URL(`${API_BASE}/presupuesto`);
        url.searchParams.append('anio', String(anio));
        if (planta) url.searchParams.append('planta', planta);

        const response = await fetch(url.toString());
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error fetching presupuesto');
        }
        return await response.json() as PresupuestoRow[];
    }

    static async uploadPresupuesto(file: File): Promise<any> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/upload-presupuesto`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error uploading presupuesto');
        }

        return await response.json();
    }

    static async uploadGastosConsolidados(file: File): Promise<any> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${API_BASE}/upload-gastos`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error uploading gastos consolidados');
        }

        return await response.json();
    }

    static async getGastosConsolidados(anio: number = 2026, planta?: string): Promise<any[]> {
        const url = new URL(`${API_BASE}/gastos-consolidados`);
        url.searchParams.append('anio', String(anio));
        if (planta) url.searchParams.append('planta', planta);

        const response = await fetch(url.toString());
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Error fetching gastos consolidados');
        }
        return await response.json();
    }
}
