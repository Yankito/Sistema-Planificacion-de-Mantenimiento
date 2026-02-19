const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export const API_ENDPOINTS = {
  FALLAS: `${BASE_URL}/fallas`,
  PLANIFICACION: `${BASE_URL}/planificacion`,
  SEGUIMIENTO: `${BASE_URL}/seguimiento`,
  MASIVO: `${BASE_URL}/masivo`,
};
