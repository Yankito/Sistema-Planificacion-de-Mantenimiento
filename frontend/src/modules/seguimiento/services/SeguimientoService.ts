import type {
  AtrasoRow,
  BacklogStats,
  TechStats,
  UploadResponse
} from "../types";
import { API_ENDPOINTS } from "../../../shared/api/config";

const API_BASE = API_ENDPOINTS.SEGUIMIENTO;

// Obtener lista de semanas (snapshots) disponibles
export const getSemanas = async (tipo: string = 'SEGUIMIENTO'): Promise<string[]> => {
  const res = await fetch(`${API_BASE}/semanas?tipo=${tipo}`);
  if (!res.ok) throw new Error("Error al obtener semanas");
  return res.json();
};

// Obtener los datos brutos de una semana
export const getPedidos = async (): Promise<AtrasoRow[]> => {
  const res = await fetch(`${API_BASE}/pedidos`);
  if (!res.ok) throw new Error("Error al cargar pedidos");
  return res.json();
};

// Obtener Analítica procesada (Llamada al nuevo endpoint del backend)
export const getAnalytics = async (actual: string, anterior: string): Promise<{
  flowStats: BacklogStats,
  techStats: TechStats[],
  metadata: Record<string, unknown>
}> => {
  const res = await fetch(`${API_BASE}/dashboard-stats/${actual}/${anterior}`);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || "Error al procesar analítica");
  }
  return res.json();
};

// Subir archivo Excel

export const uploadExcel = async (file: File, targetWeek: string): Promise<UploadResponse> => {
  const formData = new FormData();
  formData.append('file', file);
  console.log("File preparado para subir:", file.name, "con tamaño", file.size);
  console.log("Hojas en el archivo:", file);
  formData.append('targetWeek', targetWeek);
  console.log("Subiendo archivo para semana:", targetWeek);

  try {
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });

    // Si el servidor responde con 500 o 400
    if (!res.ok) {
      const errorText = await res.text(); // Leemos el texto plano primero
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error || "Error interno del servidor");
      } catch {
        throw new Error(`Error ${res.status}: El archivo Excel no tiene el formato correcto.`);
      }
    }

    return await res.json();
  } catch (error) {
    // Si el error es de red o del throw anterior
    throw new Error((error as Error).message || "No se pudo conectar con el servidor");
  }
};

// Descargar Reporte Excel (Manejo de Blob compatible con Navegador)
export const descargarExcel = async (semana: string, modo: string, semanaAnt: string): Promise<void> => {
  const url = `${API_BASE}/descargar-reporte?semana=${semana}&modo=${modo}&semanaAnt=${semanaAnt}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al generar Excel");

  const blob = await res.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;

  // Limpiamos el nombre del archivo
  const semanaLabel = semana.includes('-') ? semana.split('-')[1] : semana;
  link.setAttribute('download', `Dashboard_Atrasos_${semanaLabel}.xlsx`);

  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
};


export const descargarPlantilla = async (tipo: string): Promise<void> => {
  const res = await fetch(`${API_BASE}/plantilla/${tipo}`);
  if (!res.ok) throw new Error("Error al descargar plantilla");

  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Plantilla_${tipo}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
};