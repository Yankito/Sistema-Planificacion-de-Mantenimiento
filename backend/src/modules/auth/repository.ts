// Repositorio de autenticación.
// Accede a las tablas PF_EAM_USUARIOS, PF_EAM_ROLES y PF_EAM_ACCESO_PLANTAS.
import { query } from '../../db/config.js';

export const AuthRepository = {

  /**
   * Busca un usuario activo por sus credenciales (usuario + contraseña).
   * Retorna la fila del usuario si las credenciales son correctas, o null si no existe.
   */
  async login(usuario: string, contrasena: string) {
    const result = await query(
      `SELECT u.USUARIO, u.PRIMER_NOMBRE, u.SEGUNDO_NOMBRE, 
              u.PRIMER_APELLIDO, u.SEGUNDO_APELLIDO
       FROM PF_EAM_USUARIOS u
       WHERE u.USUARIO = :1 AND u.CONTRASENA = :2 AND u.ACTIVO = 1`,
      [usuario, contrasena]
    );
    return (result?.rows as any[])?.[0] || null;
  },

  /**
   * Obtiene todos los roles asignados a un usuario (ej: 'programador', 'supervisor').
   */
  async getRoles(usuario: string): Promise<string[]> {
    const result = await query(
      `SELECT ROL FROM PF_EAM_ROLES WHERE USUARIO = :1`,
      [usuario]
    );
    return (result?.rows as any[])?.map(r => r.ROL) || [];
  },

  /**
   * Obtiene todas las plantas a las que el usuario tiene acceso autorizado.
   */
  async getPlantas(usuario: string): Promise<string[]> {
    const result = await query(
      `SELECT PLANTA FROM PF_EAM_ACCESO_PLANTAS WHERE USUARIO = :1`,
      [usuario]
    );
    return (result?.rows as any[])?.map(r => r.PLANTA) || [];
  },

  /**
   * Retorna los indicadores clave para el dashboard principal:
   * - Contadores globales (total OTs, técnicos, fallas, activos, plantas)
   * - Últimas 5 fallas registradas
   * - Top 5 estados de OTs
   * - Distribución de técnicos por planta
   */
  async getDashboardIndicadores(plantas: string[] = []) {
    const hasPlantas = plantas.length > 0;

    // Filtros dinámicos basados en el acceso del usuario
    const plantasStr = plantas.map(p => `'${p}'`).join(',');
    const fallaFiltro = hasPlantas ? `WHERE PLANTA IN (${plantasStr})` : '';
    const tecnicoFiltro = hasPlantas ? `AND PLANTA IN (${plantasStr})` : '';
    const activoFiltro = hasPlantas ? `WHERE ORGANIZACION IN (${plantasStr})` : '';

    // Para Pedidos (OTs), si hay filtro de plantas, debemos unir con ACTIVOS para saber la planta
    const pedidoFiltro = hasPlantas
      ? `WHERE numero_activo IN (SELECT nro_de_activo FROM PF_EAM_ACTIVOS WHERE ORGANIZACION IN (${plantasStr}))`
      : '';

    const [totalOTs, totalTecnicos, totalFallas, totalActivos, plantasActivas] = await Promise.all([
      query(`SELECT COUNT(*) AS TOTAL FROM PF_EAM_PEDIDOS ${pedidoFiltro}`),
      query(`SELECT COUNT(*) AS TOTAL FROM PF_SPM_TECNICOS WHERE ACTIVO = 1 ${tecnicoFiltro}`),
      query(`SELECT COUNT(*) AS TOTAL FROM PF_EAM_FALLAS ${fallaFiltro}`),
      query(`SELECT COUNT(*) AS TOTAL FROM PF_EAM_ACTIVOS ${activoFiltro}`),
      query(`SELECT COUNT(DISTINCT ORGANIZACION) AS TOTAL FROM PF_EAM_ACTIVOS ${activoFiltro}`),
    ]);

    // Últimas 5 fallas de las plantas del usuario
    const ultimasFallas = await query(
      `SELECT * FROM (
        SELECT PLANTA, EQUIPO, CAUSA, DURACION_MINUTOS, FECHA 
        FROM PF_EAM_FALLAS 
        ${fallaFiltro}
        ORDER BY FECHA DESC
      ) WHERE ROWNUM <= 5`
    );

    // Últimas 5 OTs (Pedidos) de las plantas del usuario
    const ultimasOTs = await query(
      `SELECT * FROM (
        SELECT p.pedido_trabajo AS ID, p.descripcion AS DESCRIPCION, p.estado AS ESTADO, p.fecha_carga AS FECHA, a.organizacion AS PLANTA
        FROM PF_EAM_PEDIDOS p
        LEFT JOIN PF_EAM_ACTIVOS a ON p.numero_activo = a.nro_de_activo
        ${hasPlantas ? `WHERE a.organizacion IN (${plantasStr})` : ''}
        ORDER BY p.fecha_carga DESC
      ) WHERE ROWNUM <= 5`
    );

    // Top 5 estados de OTs con mayor cantidad de registros
    const otsPorEstado = await query(
      `SELECT ESTADO, COUNT(*) AS CANTIDAD 
       FROM PF_EAM_PEDIDOS 
       ${pedidoFiltro}
       GROUP BY ESTADO 
       ORDER BY COUNT(*) DESC 
       FETCH FIRST 5 ROWS ONLY`
    );

    // Distribución de técnicos activos agrupados por planta
    const tecnicosPorPlanta = await query(
      `SELECT PLANTA, COUNT(*) AS CANTIDAD 
       FROM PF_SPM_TECNICOS 
       WHERE ACTIVO = 1 AND PLANTA IS NOT NULL
       ${tecnicoFiltro}
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
      ultimasOTs: (ultimasOTs?.rows as any[]) || [],
      otsPorEstado: (otsPorEstado?.rows as any[]) || [],
      tecnicosPorPlanta: (tecnicosPorPlanta?.rows as any[]) || [],
    };
  },
};
