// Controlador de Autenticación
// Maneja las peticiones HTTP para login y datos del dashboard
import type { Request, Response } from 'express';
import { AuthRepository } from './repository.js';
import { generateToken } from '../../middleware/auth.js';

export const AuthController = {

  /**
   * POST /api/auth/login
   * Recibe { usuario, contrasena } y retorna datos del usuario + token JWT
   */
  async login(req: Request, res: Response) {
    try {
      const { usuario, contrasena } = req.body;

      if (!usuario || !contrasena) {
        return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
      }

      // Validar credenciales contra la tabla PF_EAM_USUARIOS
      const user = await AuthRepository.login(usuario, contrasena);
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Obtener rol y plantas en paralelo
      const [roles, plantas] = await Promise.all([
        AuthRepository.getRoles(usuario),
        AuthRepository.getPlantas(usuario),
      ]);

      // Determinar agrupación CI para las plantas del usuario
      const plantasCI = ['PF3', 'PF4', 'PF5', 'PF6', 'CDT', 'OTROS'];
      const tieneCI = plantasCI.every(p => plantas.includes(p));

      const nombreCompleto = [user.PRIMER_NOMBRE, user.SEGUNDO_NOMBRE, user.PRIMER_APELLIDO, user.SEGUNDO_APELLIDO]
        .filter(Boolean)
        .join(' ');

      // Generar token JWT con datos del usuario (expira en 8 horas)
      const token = generateToken({
        usuario: user.USUARIO,
        roles,
        plantas,
        nombreCompleto,
      });

      // Calcular fecha de expiración para el frontend
      const expiresAt = Date.now() + (8 * 60 * 60 * 1000); // 8 horas en ms

      return res.json({
        token,
        expiresAt,
        usuario: user.USUARIO,
        primerNombre: user.PRIMER_NOMBRE,
        segundoNombre: user.SEGUNDO_NOMBRE,
        primerApellido: user.PRIMER_APELLIDO,
        segundoApellido: user.SEGUNDO_APELLIDO,
        nombreCompleto,
        roles,
        plantas,
        tieneCI,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error interno del servidor";
      console.error('Error en login:', message);
      return res.status(500).json({ error: message });
    }
  },

  /**
   * GET /api/auth/indicadores
   * Retorna indicadores generales livianos para el dashboard
   * (Ruta protegida por middleware JWT)
   */
  async getIndicadores(_req: Request, res: Response) {
    try {
      const indicadores = await AuthRepository.getDashboardIndicadores();
      return res.json(indicadores);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error obteniendo indicadores";
      console.error('Error obteniendo indicadores:', message);
      return res.status(500).json({ error: message });
    }
  },

  /**
   * GET /api/auth/verify
   * Verifica que el token sea válido y retorna los datos del usuario
   * (Ruta protegida por middleware JWT)
   */
  async verify(req: Request, res: Response) {
    try {
      // Si llegamos aquí, el middleware ya validó el token
      const authUser = req.authUser;
      if (!authUser) {
        return res.status(401).json({ error: 'Token inválido' });
      }

      return res.json({
        valid: true,
        usuario: authUser.usuario,
        roles: authUser.roles,
        plantas: authUser.plantas,
        nombreCompleto: authUser.nombreCompleto,
      });
    } catch (error) {
      return res.status(500).json({ error: 'Error verificando sesión' });
    }
  },
};
