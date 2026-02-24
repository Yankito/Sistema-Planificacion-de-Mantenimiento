// fetchAuth: wrapper de fetch que adjunta automáticamente el token JWT
// y maneja expiración/errores de autenticación de forma centralizada.
// Todas las peticiones a la API deben usar este helper en lugar de fetch directo.

const STORAGE_KEY = 'pf_auth_session';

// Callback global para manejar logout cuando el token expira
let onSessionExpired: (() => void) | null = null;

/**
 * Registra un callback que se ejecuta cuando la sesión expira.
 * Usualmente el AuthContext registra su función logout aquí.
 */
export const setSessionExpiredHandler = (handler: () => void) => {
  onSessionExpired = handler;
};

/**
 * Obtiene el token almacenado en localStorage.
 */
export const getStoredToken = (): string | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    const session = JSON.parse(stored);

    // Verificar si el token ha expirado
    if (session.expiresAt && Date.now() > session.expiresAt) {
      localStorage.removeItem(STORAGE_KEY);
      onSessionExpired?.();
      return null;
    }

    return session.token || null;
  } catch {
    return null;
  }
};

/**
 * fetchAuth: Reemplaza a `fetch` para peticiones autenticadas.
 * - Adjunta automáticamente el header `Authorization: Bearer <token>`
 * - Si recibe 401 (token expirado), dispara logout automático
 * - Propaga errores de forma transparente
 */
export const fetchAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
  const token = getStoredToken();

  // Si no hay token vigente, disparar logout
  if (!token) {
    onSessionExpired?.();
    throw new Error('No hay sesión activa. Inicie sesión nuevamente.');
  }

  // Adjuntar Authorization header
  const headers = new Headers(options.headers || {});
  headers.set('Authorization', `Bearer ${token}`);

  const res = await fetch(url, {
    ...options,
    headers,
  });

  // Si el backend retorna 401 (token expirado o inválido), desloguear
  if (res.status === 401) {
    try {
      const body = await res.clone().json();
      if (body.code === 'TOKEN_EXPIRED' || body.code === 'NO_TOKEN' || body.code === 'INVALID_TOKEN') {
        onSessionExpired?.();
        throw new Error(body.error || 'La sesión ha expirado');
      }
    } catch (e) {
      // Si no podemos parsear el body, aún disparamos logout
      if (e instanceof Error && e.message.includes('sesión')) throw e;
      onSessionExpired?.();
      throw new Error('Sesión expirada');
    }
  }

  return res;
};
