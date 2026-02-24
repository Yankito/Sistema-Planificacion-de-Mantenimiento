// Contexto de Autenticación
// Maneja el estado de sesión del usuario, token JWT y expiración automática
import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { UsuarioAuth, AuthSession } from '../modules/auth/types';
import * as AuthService from '../modules/auth/services/AuthService';
import { setSessionExpiredHandler } from '../shared/api/fetchAuth';

interface AuthContextType {
  user: UsuarioAuth | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (usuario: string, contrasena: string) => Promise<void>;
  logout: () => void;
  sessionExpiresAt: number | null;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'pf_auth_session';

// Tiempo de advertencia antes de expirar (5 minutos antes)
const WARNING_BEFORE_MS = 5 * 60 * 1000;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UsuarioAuth | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sessionExpiresAt, setSessionExpiresAt] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const expirationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warningTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Función de logout
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setSessionExpiresAt(null);
    localStorage.removeItem(STORAGE_KEY);

    // Limpiar timers
    if (expirationTimerRef.current) {
      clearTimeout(expirationTimerRef.current);
      expirationTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
  }, []);

  // Registrar handler de sesión expirada para fetchAuth
  useEffect(() => {
    setSessionExpiredHandler(logout);
  }, [logout]);

  /**
   * Configura timers para expiración y advertencia de sesión
   */
  const setupExpirationTimers = useCallback((expiresAt: number) => {
    // Limpiar timers anteriores
    if (expirationTimerRef.current) clearTimeout(expirationTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);

    const timeUntilExpiry = expiresAt - Date.now();

    if (timeUntilExpiry <= 0) {
      // Token ya expiró
      logout();
      return;
    }

    // Timer de expiración: auto-logout cuando expire
    expirationTimerRef.current = setTimeout(() => {
      console.warn('Sesión expirada automáticamente');
      logout();
    }, timeUntilExpiry);

    // Timer de advertencia: alertar 5 minutos antes
    const timeUntilWarning = timeUntilExpiry - WARNING_BEFORE_MS;
    if (timeUntilWarning > 0) {
      warningTimerRef.current = setTimeout(() => {
        console.warn('⚠️ La sesión expirará en 5 minutos');
        // Podrías mostrar una notificación aquí si lo deseas
      }, timeUntilWarning);
    }
  }, [logout]);

  // Restaurar sesión desde localStorage al iniciar
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const session: AuthSession = JSON.parse(stored);

        // Verificar si el token ha expirado
        if (session.expiresAt && Date.now() > session.expiresAt) {
          console.warn('Sesión almacenada ya expiró, eliminando...');
          localStorage.removeItem(STORAGE_KEY);
        } else {
          setUser(session.user);
          setToken(session.token);
          setSessionExpiresAt(session.expiresAt);
          setupExpirationTimers(session.expiresAt);
        }
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, [setupExpirationTimers]);

  const login = useCallback(async (usuario: string, contrasena: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await AuthService.login({ usuario, contrasena });

      // Separar token y datos del usuario
      const { token: newToken, expiresAt, ...userData } = response;

      setUser(userData);
      setToken(newToken);
      setSessionExpiresAt(expiresAt);

      // Guardar sesión completa en localStorage
      const session: AuthSession = {
        user: userData,
        token: newToken,
        expiresAt,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));

      // Configurar timers de expiración
      setupExpirationTimers(expiresAt);
    } catch (err: any) {
      setError(err.message || 'Error de autenticación');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [setupExpirationTimers]);

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      if (expirationTimerRef.current) clearTimeout(expirationTimerRef.current);
      if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    };
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isAuthenticated: !!user && !!token,
      isLoading,
      error,
      login,
      logout,
      sessionExpiresAt,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
