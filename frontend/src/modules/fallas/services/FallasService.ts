// src/shared/services/FallasService.ts
import type { FallaRow } from "../types";
import { API_ENDPOINTS } from "../../../shared/api/config";

const API_BASE = API_ENDPOINTS.FALLAS;

export const uploadFallas = async (file: File): Promise<FallaRow[]> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });


  if (!res.ok) throw new Error("Error al procesar el archivo de fallas en el servidor");

  return res.json();
};

export const getFallas = async (semana?: string): Promise<FallaRow[]> => {
  const url = semana
    ? `${API_BASE}?semana=${semana}`
    : `${API_BASE}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al cargar listado de fallas");
  return res.json();
};

