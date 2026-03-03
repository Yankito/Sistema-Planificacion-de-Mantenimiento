import { query } from '../../db/config.js';
import type { FallaRow } from './types.js';

/**
 * Repositorio del módulo de Fallas.
 * Accede a la tabla PF_EAM_FALLAS con los registros de paros de equipos.
 */
export const FallasRepository = {

    /**
     * Obtiene todos los registros de fallas ordenados por fecha descendente.
     * Mapea las columnas de Oracle a los campos del tipo FallaRow.
     */
    getFallas: async () => {
        const res = await query(`
      SELECT f.*
      FROM PF_EAM_FALLAS f
      ORDER BY f.fecha DESC
    `);

        if (!res?.rows) return [];

        return res.rows.map((r: any): Partial<FallaRow> => ({
            id: r.ID,
            fecha: r.FECHA,
            planta: r.PLANTA,
            area: r.AREA,
            linea: r.LINEA,
            equipo: r.EQUIPO,
            causa: r.CAUSA,
            pedidoTrabajo: r.PEDIDO_TRABAJO,
            estadoPedido: r.ESTADO_PEDIDO,
            tipoPedido: r.TIPO_PEDIDO,
            tecnico: r.TECNICO,
            duracionMinutos: r.DURACION_MINUTOS,
            gasto: r.GASTO,
            perdidaKg: r.PERDIDA_KG,
            descripcionOperador: r.DESCRIPCION_OPERADOR
        }));
    },

    /**
     * Alias de getFallas para mantener retrocompatibilidad.
     * La tabla no almacena la semana como columna; el filtrado se realiza en la capa de lógica.
     */
    getFallasBySemana: async (_semana: string) => {
        return FallasRepository.getFallas();
    }
};
