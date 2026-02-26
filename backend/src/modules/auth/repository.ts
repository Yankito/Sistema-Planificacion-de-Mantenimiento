// Repositorio de Autenticación
// Consultas a las tablas PF_EAM_USUARIOS, PF_EAM_ROLES, PF_EAM_ACCESO_PLANTAS
import { query } from '../../db/config.js';

export const AuthRepository = {

  /**
   * Buscar usuario por credenciales (simula autenticación Oracle)
   * En producción real, la contraseña se validaría contra el servidor Oracle directamente.
   */
  async login(usuario: string, contrasena: string) {
    const result = await query(
      `SELECT u.ID, u.USUARIO, u.PRIMER_NOMBRE, u.SEGUNDO_NOMBRE, 
              u.PRIMER_APELLIDO, u.SEGUNDO_APELLIDO
       FROM PF_EAM_USUARIOS u
       WHERE u.USUARIO = :1 AND u.CONTRASENA = :2 AND u.ACTIVO = 1`,
      [usuario, contrasena]
    );
    return (result?.rows as any[])?.[0] || null;
  },

  /**
   * Obtener los roles asignados a un usuario
   */
  async getRoles(usuario: string): Promise<string[]> {
    const result = await query(
      `SELECT ROL FROM PF_EAM_ROLES WHERE USUARIO = :1`,
      [usuario]
    );
    return (result?.rows as any[])?.map(r => r.ROL) || [];
  },

  /**
   * Obtener las plantas a las que un usuario tiene acceso
   */
  async getPlantas(usuario: string): Promise<string[]> {
    const result = await query(
      `SELECT PLANTA FROM PF_EAM_ACCESO_PLANTAS WHERE USUARIO = :1`,
      [usuario]
    );
    return (result?.rows as any[])?.map(r => r.PLANTA) || [];
  },

  /**
   * Obtener indicadores generales del dashboard (consultas ligeras)
   * - Total OTs cargadas
   * - Total técnicos activos
   * - Total fallas registradas
   * - Total activos registrados
   */
  async getDashboardIndicadores() {
    const [totalOTs, totalTecnicos, totalFallas, totalActivos, plantasActivas] = await Promise.all([
      query(`SELECT COUNT(*) AS TOTAL FROM PF_EAM_PEDIDOS`),
      query(`SELECT COUNT(*) AS TOTAL FROM PF_IM_TECNICOS WHERE ACTIVO = 1`),
      query(`SELECT COUNT(*) AS TOTAL FROM PF_EAM_FALLAS`),
      query(`SELECT COUNT(*) AS TOTAL FROM PF_EAM_ACTIVOS`),
      query(`SELECT COUNT(DISTINCT PLANTA) AS TOTAL FROM PF_EAM_ACTIVOS WHERE PLANTA IS NOT NULL`),
    ]);

    // Últimas 5 fallas registradas
    const ultimasFallas = await query(
      `SELECT * FROM (
        SELECT PLANTA, EQUIPO, CAUSA, DURACION_MINUTOS, FECHA 
        FROM PF_EAM_FALLAS 
        ORDER BY FECHA DESC
      ) WHERE ROWNUM <= 5`
    );

    // OTs por estado (top 5 estados)
    const otsPorEstado = await query(
      `SELECT ESTADO, COUNT(*) AS CANTIDAD 
       FROM PF_EAM_PEDIDOS 
       GROUP BY ESTADO 
       ORDER BY COUNT(*) DESC 
       FETCH FIRST 5 ROWS ONLY`
    );

    // Distribución de técnicos por planta
    const tecnicosPorPlanta = await query(
      `SELECT PLANTA, COUNT(*) AS CANTIDAD 
       FROM PF_IM_TECNICOS 
       WHERE ACTIVO = 1 AND PLANTA IS NOT NULL
       GROUP BY PLANTA 
       ORDER BY PLANTA`
    );

    return {
      contadores: {
        totalOTs: (totalOTs?.rows as any[])?.[0]?.TOTAL || 0,
        totalTecnicos: (totalTecnicos?.rows as any[])?.[0]?.TOTAL || 0,
        totalFallas: (totalFallas?.rows as any[])?.[0]?.TOTAL || 0,
        totalActivos: (totalActivos?.rows as any[])?.[0]?.TOTAL || 0,
        plantasActivas: (plantasActivas?.rows as any[])?.[0]?.TOTAL || 0,
      },
      ultimasFallas: (ultimasFallas?.rows as any[]) || [],
      otsPorEstado: (otsPorEstado?.rows as any[]) || [],
      tecnicosPorPlanta: (tecnicosPorPlanta?.rows as any[]) || [],
    };
  },
};
