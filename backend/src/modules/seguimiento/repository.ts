import { query, executeMany } from '../../db/config.js';
import type { OrdenTrabajo, TecnicoEstado } from '../../types.js';
import type { ActivoRow } from './types.js';

export const SeguimientoRepository = {
  // Ya no usamos historial de semanas
  getSemanas: async (tipo: string): Promise<string[]> => {
    return ['ACTUAL'];
  },

  // Obtiene los datos ACTUALES directos de la base
  // Ignora el parámetro 'semana' ya que siempre lee en tiempo real
  getPedidos: async (fechaInicio: string, fechaFin: string): Promise<OrdenTrabajo[]> => {
    if (!fechaInicio || !fechaFin) {
      throw new Error("El rango de fechas (fechaInicio y fechaFin) es obligatorio.");
    }

    const params: Record<string, string> = { fechaInicio, fechaFin };
    const whereClause = `
      WHERE (
          UPPER(p.estado) = 'LIBERADO'
          OR (
            UPPER(p.estado) IN ('FINALIZADO', 'FINALIZAR - SIN CARGOS')
            AND UPPER(p.descripcion) NOT LIKE 'MOB%'
          )
        )
        AND p.fecha_inicial_programada >= TO_DATE(:fechaInicio, 'YYYY-MM-DD')
        AND p.fecha_inicial_programada <= TO_DATE(:fechaFin, 'YYYY-MM-DD')
    `;

    const sql = `
       WITH ActivosUnicos AS (
          SELECT nro_de_activo, clase_contable, organizacion,
                 ROW_NUMBER() OVER (PARTITION BY TRIM(UPPER(nro_de_activo)) ORDER BY nro_de_activo) as rn
          FROM PF_EAM_ACTIVOS
       ),
       TecnicosAgg AS (
          SELECT TRIM(nro_ot) as nro_ot,
                 JSON_ARRAYAGG(
                    JSON_OBJECT(
                        'nombre' VALUE UPPER(c.empleado), 
                        'rol' VALUE COALESCE(t.rol, 'MECANICO'),
                        'planta' VALUE COALESCE(t.planta, 'PF3'),
                        'opFinalizada' VALUE c.op_finalizada
                    )
                    RETURNING CLOB
                 ) as detalles_json,
                 MAX(CASE WHEN c.op_finalizada = 'No' THEN 1 ELSE 0 END) as has_pending_tech,
                 MAX(c.planta) as planta_cump
          FROM PF_EAM_CUMPLIMIENTO c
          LEFT JOIN PF_IM_TECNICOS t ON TRIM(UPPER(c.empleado)) = TRIM(UPPER(t.nombre))
          WHERE c.empleado IS NOT NULL
          GROUP BY TRIM(nro_ot)
       )
       SELECT 
            p.pedido_trabajo as "OT",
            p.numero_activo as "NRO_ACTIVO",
            p.descripcion as "DESCRIPCION",
            p.estado as "ESTADO",
            CASE
                WHEN UPPER(p.estado) IN ('FINALIZADO', 'FINALIZAR - SIN CARGOS') THEN 'CUMPLIDA'
                WHEN ta.has_pending_tech = 1 THEN 'TECNICO / SERVICIO'
                WHEN m.numero IS NULL THEN 'OC / OTRO'
                WHEN m.rmd = 'NO' OR m.rse = 'NO' THEN 'OC / OTRO'
                ELSE 'PROGRAMADOR'
            END as "CLASIFICACION",
            CASE WHEN p.pedido_trabajo LIKE 'OB%' THEN 1 ELSE 0 END as "ES_OB",
            TO_CHAR(p.fecha_inicial_programada, 'MM/YYYY') as "PERIODO",
            TO_CHAR(p.fecha_inicial_programada, 'YYYY-"S"IW') as "SEMANA",
            TO_CHAR(p.fecha_inicial_programada, 'DD/MM/YYYY') as "FECHA",

            -- Determinación de Planta (Lógica Unificada convertida a CASE)
            COALESCE(
                  CASE 
                      WHEN ta.planta_cump = 'Mantenimiento Planta I' THEN 'PF1'
                      WHEN ta.planta_cump = 'Mantenimiento Planta II' THEN 'PF2'
                      WHEN ta.planta_cump = 'Mantenimiento Centro de Distribucion Santiago' THEN 'MPS'
                      ELSE NULL
                  END,
                  CASE a.organizacion
                      WHEN 'MP1' THEN 'PF1'
                      WHEN 'MP2' THEN 'PF2'
                      WHEN 'MPS' THEN 'MPS'
                      ELSE NULL
                  END,
                  CASE a.clase_contable
                      WHEN 'Edif ElabC' THEN 'PF3'
                      WHEN 'Edif Mant' THEN 'PF3'
                      WHEN 'Higiene P3' THEN 'PF3'
                      WHEN 'Infra ElaC' THEN 'PF3'
                      WHEN 'Infra Mant' THEN 'PF3'
                      WHEN 'Mant AMB' THEN 'PF3'
                      WHEN 'Rack ElabC' THEN 'PF3'
                      WHEN 'Edif Jamon' THEN 'PF4'
                      WHEN 'Higiene P4' THEN 'PF4'
                      WHEN 'Infra Jam' THEN 'PF4'
                      WHEN 'Mant Jamon' THEN 'PF4'
                      WHEN 'Rack Jam' THEN 'PF4'
                      WHEN 'Edif Pizza' THEN 'PF5'
                      WHEN 'Higiene P5' THEN 'PF5'
                      WHEN 'Infra Pizz' THEN 'PF5'
                      WHEN 'Mant Pizza' THEN 'PF5'
                      WHEN 'Rack Pizz' THEN 'PF5'
                      WHEN 'Higiene P6' THEN 'PF6'
                      WHEN 'Infra Plat' THEN 'PF6'
                      WHEN 'Mant Plato' THEN 'PF6'
                      WHEN 'Rack Plato' THEN 'PF6'
                      WHEN 'Redes Plat' THEN 'PF6'
                      WHEN 'Edif PR Ad' THEN 'OTROS'
                      WHEN 'Edif PR PF' THEN 'OTROS'
                      WHEN 'Equipo PF' THEN 'OTROS'
                      WHEN 'Gerencia' THEN 'OTROS'
                      WHEN 'Infra Lomb' THEN 'OTROS'
                      WHEN 'Infra Comp' THEN 'OTROS'
                      WHEN 'Edif CDT' THEN 'CDT'
                      WHEN 'Infra CDT' THEN 'CDT'
                      WHEN 'Mant CDT' THEN 'CDT'
                      WHEN 'Rack CDT' THEN 'CDT'
                      WHEN 'Edif DataC' THEN 'DC'
                      WHEN 'Infra DatC' THEN 'DC'
                      WHEN 'Mant DataC' THEN 'DC'
                      WHEN 'Edif Vent' THEN 'VENTAS'
                      WHEN 'Infra Vent' THEN 'VENTAS'
                      WHEN 'Mant Vent' THEN 'VENTAS'
                      WHEN NULL THEN 'OTROS'
                      ELSE NULL
                  END,
                  CASE 
                      WHEN p.departamento_propiedad LIKE '%P1%' THEN 'PF1'
                      WHEN p.departamento_propiedad LIKE '%P2%' THEN 'PF2'
                      WHEN p.departamento_propiedad LIKE 'Mant CDS' THEN 'MPS'
                      WHEN p.departamento_propiedad LIKE 'Mant TDLG' THEN 'MPS'
                      ELSE NULL
                  END,
                  CASE 
                      WHEN SUBSTR(p.numero_activo, -5, 1) IN ('0', '1') THEN 'PF1'
                      WHEN SUBSTR(p.numero_activo, -5, 1) = '2' THEN 'PF2'
                      WHEN SUBSTR(p.numero_activo, -5, 1) = '3' THEN 'PF3'
                      WHEN SUBSTR(p.numero_activo, -5, 1) = '4' THEN 'PF4'
                      WHEN SUBSTR(p.numero_activo, -5, 1) = '5' THEN 'PF5'
                      WHEN SUBSTR(p.numero_activo, -5, 1) = '6' THEN 'PF6'
                      ELSE NULL
                  END
            ) as "PLANTA",

            -- Detalles Técnicos (Solo Cumplimiento)
            ta.detalles_json as "DETALLES_TECNICOS_RAW",

            CASE WHEN m.numero IS NOT NULL THEN m.rmd ELSE 'N/A' END as "RMD",
            CASE WHEN m.numero IS NOT NULL THEN m.rse ELSE 'N/A' END as "RSE"

       FROM PF_EAM_PEDIDOS p
       LEFT JOIN ActivosUnicos a ON TRIM(UPPER(a.nro_de_activo)) = TRIM(UPPER(p.numero_activo)) AND a.rn = 1
       LEFT JOIN TecnicosAgg ta ON ta.nro_ot = TRIM(p.pedido_trabajo)

       LEFT JOIN PF_EAM_MASIVO m ON p.pedido_trabajo = m.numero
       ${whereClause}
    `;

    const res = await query(sql, params);

    const rows = (res.rows || []) as Record<string, any>[];

    return rows.map((r): OrdenTrabajo => {
      let detalles: TecnicoEstado[] = [];
      try {
        if (r.DETALLES_TECNICOS_RAW) {
          const raw = typeof r.DETALLES_TECNICOS_RAW === 'string'
            ? JSON.parse(r.DETALLES_TECNICOS_RAW)
            : r.DETALLES_TECNICOS_RAW;

          if (Array.isArray(raw)) {
            detalles = raw.map((d: Record<string, any>) => ({
              tecnico: {
                nombre: d.nombre,
                rol: d.rol,
                planta: d.planta
              },
              opFinalizada: d.opFinalizada === 'SI' || d.opFinalizada === 'Si' || d.opFinalizada === 'S' || d.opFinalizada === 's'
            }));
          }
        }
      } catch (e) {
        console.error('Error parsing details:', e);
      }
      return {
        id: r.OT,
        planta: r.PLANTA || 'OTROS',
        ot: r.OT,
        nroOrden: r.OT, // Added for consistency with OrdenTrabajo
        nroActivo: r.NRO_ACTIVO,
        equipo: r.NRO_ACTIVO, // Added for consistency with OrdenTrabajo
        descripcion: r.DESCRIPCION,
        estado: r.ESTADO,
        clasificacion: r.CLASIFICACION,
        esOB: r.ES_OB === 1,
        periodo: r.PERIODO,
        semana: r.SEMANA,
        detallesTecnicos: detalles,
        fecha: r.FECHA,
        rmd: r.RMD,
        rse: r.RSE
      };
    });
  },
};