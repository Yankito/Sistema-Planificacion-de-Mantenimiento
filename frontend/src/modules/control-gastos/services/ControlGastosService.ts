import { API_ENDPOINTS } from '../../../shared/api/config';
import { fetchAuth } from '../../../shared/api/fetchAuth';
import type { ActivoEAM } from '../../../shared/types';
import type { PresupuestoRow, GastoConsolidadoRow } from '../types';


const API_BASE = API_ENDPOINTS.CONTROL_GASTOS;

export class ControlGastosService {
  static async getPresupuesto(anio: number, planta?: string, activo?: string, mes?: number): Promise<PresupuestoRow[]> {
    const url = new URL(`${API_BASE}/presupuesto`);
    url.searchParams.append('anio', String(anio));
    if (planta) url.searchParams.append('planta', planta);
    if (activo) url.searchParams.append('activo', activo);
    if (mes) url.searchParams.append('mes', String(mes));

    const response = await fetchAuth(url.toString());
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Error fetching presupuesto');
    }
    return await response.json() as PresupuestoRow[];
  }

  static async uploadPresupuesto(file: File): Promise<{ success: boolean, count: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetchAuth(`${API_BASE}/upload-presupuesto`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Error uploading presupuesto');
    }

    return await response.json();
  }

  static async uploadGastosConsolidados(file: File): Promise<{ success: boolean, count: number }> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetchAuth(`${API_BASE}/upload-gastos`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Error uploading gastos consolidados');
    }

    return await response.json();
  }

  static async getGastosConsolidados(anio: number, planta?: string, mes?: number): Promise<GastoConsolidadoRow[]> {
    const url = new URL(`${API_BASE}/gastos-consolidados`);
    url.searchParams.append('anio', String(anio));
    if (planta) url.searchParams.append('planta', planta);
    if (mes) url.searchParams.append('mes', String(mes));

    const response = await fetchAuth(url.toString());
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Error fetching gastos consolidados');
    }
    return await response.json();
  }

  static async searchAssetsByCentroCosto(cc: string): Promise<ActivoEAM[]> {
    const url = new URL(`${API_BASE}/search-assets-cc`);
    url.searchParams.append('cc', cc);
    const response = await fetchAuth(url.toString());
    if (!response.ok) throw new Error('Error searching assets');
    return await response.json();
  }

  static async updateAssetName(oldName: string, newName: string, anio: number): Promise<void> {
    const response = await fetchAuth(`${API_BASE}/update-asset-name`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldName, newName, anio })
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Error updating asset name');
    }
  }

  static async autoFixAssets(anio: number): Promise<{ fixed: number, total: number }> {
    const response = await fetchAuth(`${API_BASE}/auto-fix-assets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ anio })
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Error auto-fixing assets');
    }
    return await response.json();
  }

  static async getMaintainableAssets(search?: string): Promise<ActivoEAM[]> {
    const url = new URL(`${API_BASE}/maintainable-assets`);
    if (search) url.searchParams.append('search', search);
    const response = await fetchAuth(url.toString());
    if (!response.ok) throw new Error('Error fetching maintainable assets');
    return await response.json();
  }

  static async saveManualPresupuesto(rows: PresupuestoRow[]): Promise<void> {
    const response = await fetchAuth(`${API_BASE}/save-manual-presupuesto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rows })
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Error saving manual budget');
    }
  }

}
