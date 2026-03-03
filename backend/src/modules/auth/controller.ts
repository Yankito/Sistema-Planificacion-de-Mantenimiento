import type { Request, Response } from 'express';
import { AuthRepository } from './repository.js';
import { generateToken } from '../../middleware/auth.js';

/**
 * Controlador de autenticación.
 * Expone los endpoints de login, verificación de sesión e indicadores del dashboard.
 */
export const AuthController = {

  /**
   * POST /api/auth/login
   * Valida las credenciales del usuario contra la base de datos.
   * Si son correctas, genera y retorna un token JWT junto con los datos del perfil,
   * roles y plantas a las que el usuario tiene acceso.
   */
  async login(req: Request, res: Response) {
    try {
      const { usuario, contrasena } = req.body;

      if (!usuario || !contrasena) {
        return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
      }

      const user = await AuthRepository.login(usuario, contrasena);
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      // Obtener roles y plantas autorizadas del usuario en paralelo
      const [roles, plantas] = await Promise.all([
        AuthRepository.getRoles(usuario),
        AuthRepository.getPlantas(usuario),
      ]);

      // Determinar si el usuario tiene acceso completo al Complejo Industrial (CI)
      const plantasCI = ['PF3', 'PF4', 'PF5', 'PF6', 'CDT', 'VENTAS', 'DC', 'OTROS'];
      const tieneCI = plantasCI.every(p => plantas.includes(p));

      const nombreCompleto = [user.PRIMER_NOMBRE, user.SEGUNDO_NOMBRE, user.PRIMER_APELLIDO, user.SEGUNDO_APELLIDO]
        .filter(Boolean)
        .join(' ');
      // Generar token JWT que expira en 8 horas (jornada laboral)
      const token = generateToken({
        usuario: user.USUARIO,
        roles,
        plantas,
        nombreCompleto,
      });

      // Calcular timestamp de expiración para que el frontend pueda renovar la sesión
      const expiresAt = Date.now() + (8 * 60 * 60 * 1000);

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
      console.error('Error en login1:', message);
      return res.status(500).json({ error: 'Ocurrió un error interno en el servidor' });
    }
  },

  /**
   * GET /api/auth/indicadores
   * Retorna contadores e indicadores generales para el dashboard principal.
   * Requiere autenticación JWT válida.
   */
  async getIndicadores(req: Request, res: Response) {
    try {
      const authUser = req.authUser;
      const indicadores = await AuthRepository.getDashboardIndicadores(authUser?.plantas || []);
      return res.json(indicadores);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error obteniendo indicadores";
      console.error('Error obteniendo indicadores:', message);
      return res.status(500).json({ error: 'Ocurrió un error interno en el servidor' });
    }
  },

  /**
   * GET /api/auth/verify
   * Verifica que el token JWT presente en la petición sea válido.
   * Retorna los datos del usuario decodificados desde el token.
   * El middleware authMiddleware ya valida el token antes de llegar aquí.
   */
  async verify(req: Request, res: Response) {
    try {
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
      const message = error instanceof Error ? error.message : "Error interno del servidor";
      console.error('Error en login:', message);
      return res.status(500).json({ error: 'Ocurrió un error interno en el servidor' });
    }
  },
};
