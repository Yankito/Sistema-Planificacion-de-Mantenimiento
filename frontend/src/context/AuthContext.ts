import { createContext } from 'react';
import type { UsuarioAuth } from '../modules/auth/types';

export interface AuthContextType {
  user: UsuarioAuth | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (usuario: string, contrasena: string) => Promise<void>;
  logout: () => void;
  sessionExpiresAt: number | null;
}

export const AuthContext = createContext<AuthContextType | null>(null);
