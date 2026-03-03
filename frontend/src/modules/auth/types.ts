export interface LoginResponse extends UsuarioAuth {
  token: string;
  expiresAt: number; // timestamp ms de expiración
}

export interface LoginCredentials {
  usuario: string;
  contrasena: string;
}

export interface DashboardIndicadores {
  contadores: {
    totalOTs: number;
    totalTecnicos: number;
    totalFallas: number;
    totalActivos: number;
    plantasActivas: number;
  };
  ultimasFallas: Array<{
    PLANTA: string;
    EQUIPO: string;
    CAUSA: string;
    DURACION_MINUTOS: number;
    FECHA: string;
  }>;
  ultimasOTs: Array<{
    ID: string;
    DESCRIPCION: string;
    ESTADO: string;
    FECHA: string;
    PLANTA: string;
  }>;
  otsPorEstado: Array<{
    ESTADO: string;
    CANTIDAD: number;
  }>;
  tecnicosPorPlanta: Array<{
    PLANTA: string;
    CANTIDAD: number;
  }>;
}

export interface AuthUser {
  id?: string;
  username: string;
  nombre: string;
  rol: string;
  planta?: string;
  plantasAcceso?: string[];
}

export interface UsuarioAuth {
  usuario: string;
  primerNombre: string;
  segundoNombre: string | null;
  primerApellido: string;
  segundoApellido: string | null;
  nombreCompleto: string;
  roles: string[];
  plantas: string[];
  tieneCI: boolean;
}

export interface AuthSession {
  user: UsuarioAuth;
  token: string;
  expiresAt: number;
}

// Agrupación CI = PF3, PF4, PF5, PF6, CDT, OTROS
export const PLANTAS_CI = ['PF3', 'PF4', 'PF5', 'PF6', 'CDT', 'OTROS'] as const;
export const TODAS_LAS_PLANTAS = ['PF1', 'PF2', 'PF3', 'PF4', 'PF5', 'PF6', 'CDT', 'OTROS', 'MPS'] as const;
