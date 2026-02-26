import { query } from '../../db/config.js';
import type { FallaRow } from './types.js';

export const FallasRepository = {
    // Get All Fallas
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

    // Get Fallas by Week (Optional)
    getFallasBySemana: async (semana: string) => {
        // As the DB no longer has the 'semana' column, we fetch all and let the logic layer handle filtering or we just use getFallas directly.
        // For backwards compatibility returning all if this is ever called before being refactored out.
        return FallasRepository.getFallas();
    }
};
