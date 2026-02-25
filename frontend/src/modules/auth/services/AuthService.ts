// Servicio de Autenticación - llamadas al backend
import { API_ENDPOINTS } from '../../../shared/api/config';
import { fetchAuth } from '../../../shared/api/fetchAuth';
import type { LoginResponse, LoginCredentials, DashboardIndicadores } from '../types';

const AUTH_URL = API_ENDPOINTS.AUTH;

/**
 * Iniciar sesión con credenciales Oracle (simulado)
 * Esta petición NO usa fetchAuth porque aún no tenemos token
 */
export const login = async (credentials: LoginCredentials): Promise<LoginResponse> => {
  const res = await fetch(`${AUTH_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
    signal: AbortSignal.timeout(15000), // Timeout
  }).catch((err) => {
    if (err.name === 'TimeoutError') {
      throw new Error('El servidor tardó demasiado en responder. Verifica tu conexión.');
    }
    throw new Error('No se pudo conectar con el servidor (backend caído o sin red).');
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Error de autenticación');
  }

  return res.json();
};

/**
 * Obtener indicadores generales del dashboard (ligeros)
 * Usa fetchAuth para incluir el token JWT automáticamente
 */
export const getIndicadores = async (): Promise<DashboardIndicadores> => {
  const res = await fetchAuth(`${AUTH_URL}/indicadores`);
  if (!res.ok) throw new Error('Error obteniendo indicadores');
  return res.json();
};

/**
 * Verificar validez del token actual
 * Usa fetchAuth para incluir el token JWT automáticamente
 */
export const verifyToken = async (): Promise<{ valid: boolean; usuario: string }> => {
  const res = await fetchAuth(`${AUTH_URL}/verify`);
  if (!res.ok) throw new Error('Token inválido');
  return res.json();
};
