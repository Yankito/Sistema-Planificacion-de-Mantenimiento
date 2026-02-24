import { query } from '../../db/config.js';
import type { FallaRow } from '../../types.js';

export const FallasRepository = {

    // Save Fallas Data
    guardarFallas: async (semana: string, data: FallaRow[]) => {

        // 2. Insert new data (MERGE)
        const sql = `
          MERGE INTO PF_IM_FALLAS f
          USING DUAL ON (f.ot = :ot AND f.fecha = :fecha)
          WHEN MATCHED THEN
             UPDATE SET 
                duracion_minutos = :duracionMinutos, 
                gasto = :gasto,
                planta = :planta,
                area = :area,
                linea = :linea,
                equipo = :equipo,
                causa = :causa,
                estado_pedido = :estadoPedido,
                tipo_pedido = :tipoPedido,
                tecnico = :tecnico,
                perdida_kg = :perdidaKg,
                descripcion_operador = :descripcionOperador,
                semana = :semana,
                anio = :anio,
                mes = :mes
          WHEN NOT MATCHED THEN
             INSERT (fecha, semana, anio, mes, planta, area, linea, equipo, 
                     causa, estado_pedido, tipo_pedido, tecnico, ot, duracion_minutos, gasto, 
                     perdida_kg, descripcion_operador)
             VALUES (:fecha, :semana, :anio, :mes, :planta, :area, :linea, :equipo, 
                     :causa, :estadoPedido, :tipoPedido, :tecnico, :ot, :duracionMinutos, :gasto, 
                     :perdidaKg, :descripcionOperador)
        `;

        const uniqueData = new Map<string, FallaRow>();
        data.forEach(row => {
            const key = `${row.ot}-${row.fecha}`;
            if (!uniqueData.has(key)) {
                uniqueData.set(key, row);
            }
        });
        const dataLimpia = Array.from(uniqueData.values());

        const binds = dataLimpia.map(row => ({
            fecha: row.fecha,
            semana: row.semana || semana,
            anio: row.anio,
            mes: row.mes,
            planta: row.planta,
            area: row.area,
            linea: row.linea,
            equipo: row.equipo,
            causa: row.causa,
            estadoPedido: row.estadoPedido,
            tipoPedido: row.tipoPedido,
            tecnico: row.tecnico,
            ot: row.ot,
            duracionMinutos: row.duracionMinutos,
            gasto: row.gasto,
            perdidaKg: row.perdidaKg,
            descripcionOperador: row.descripcionOperador
        }));

        const { executeMany } = await import('../../db/config.js');
        await executeMany(sql, binds);
    },


    // Get All Fallas
    getFallas: async () => {
        const res = await query(`
      SELECT f.*
      FROM PF_IM_FALLAS f
      ORDER BY f.fecha DESC
    `);

        if (!res?.rows) return [];

        return res.rows.map((r: any): FallaRow => ({
            id: r.ID,
            fecha: r.FECHA,
            semana: r.SEMANA,
            anio: r.ANIO,
            mes: r.MES,
            planta: r.PLANTA,
            area: r.AREA,
            linea: r.LINEA,
            equipo: r.EQUIPO,
            causa: r.CAUSA,
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
        const res = await query(`
        SELECT f.* 
        FROM PF_IM_FALLAS f
        WHERE f.semana = :semana
      `, { semana });

        if (!res?.rows) return [];

        return res.rows.map((r: any): FallaRow => ({
            id: r.ID,
            fecha: r.FECHA,
            semana: r.SEMANA,
            anio: r.ANIO,
            mes: r.MES,
            planta: r.PLANTA,
            area: r.AREA,
            linea: r.LINEA,
            equipo: r.EQUIPO,
            causa: r.CAUSA,
            estadoPedido: r.ESTADO_PEDIDO,
            tipoPedido: r.TIPO_PEDIDO,
            tecnico: r.TECNICO,
            duracionMinutos: r.DURACION_MINUTOS,
            gasto: r.GASTO,
            perdidaKg: r.PERDIDA_KG,
            descripcionOperador: r.DESCRIPCION_OPERADOR
        }));
    }
};
