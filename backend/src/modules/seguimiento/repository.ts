import { query } from '../../db/config.js';
import type { OrdenTrabajo, TecnicoEstado } from '../../shared/types/index.js';

export const SeguimientoRepository = {
  // Obtiene las OTs desde Oracle filtradas por fechas Y por las plantas del usuario
  getPedidos: async (
    fechaInicio: string,
    fechaFin: string,
    plantasUsuario: string[] = []
  ): Promise<OrdenTrabajo[]> => {
    if (!fechaInicio || !fechaFin) {
      throw new Error("El rango de fechas (fechaInicio y fechaFin) es obligatorio.");
    }

    // Si no hay plantas autorizadas, devolvemos vacío por seguridad
    if (plantasUsuario.length === 0) {
      console.warn("[SeguimientoRepository] Sin plantas autorizadas para el usuario.");
      return [];
    }

    // Construimos el IN clause con bind variables individuales de Oracle (:p0, :p1, ...)
    // No usamos interpolación directa para evitar SQL injection
    const plantaBindKeys = plantasUsuario.map((_, i) => `:planta${i}`).join(', ');
    const plantaBindParams: Record<string, string> = {};
    plantasUsuario.forEach((p, i) => { plantaBindParams[`planta${i}`] = p; });

    const params: Record<string, string> = { fechaInicio, fechaFin, ...plantaBindParams };

    const whereClause = `
      WHERE (
          UPPER(p.estado) = 'LIBERADO'
          OR (
            UPPER(p.estado) IN ('FINALIZADO', 'FINALIZAR - SIN CARGOS')
            AND UPPER(p.descripcion) NOT LIKE 'MOB%'
          )
        )
        AND TRUNC(p.fecha_inicial_programada) >= TO_DATE(:fechaInicio, 'YYYY-MM-DD')
        AND TRUNC(p.fecha_inicial_programada) <= TO_DATE(:fechaFin, 'YYYY-MM-DD')
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
          LEFT JOIN PF_SPM_TECNICOS t ON TRIM(UPPER(c.empleado)) = TRIM(UPPER(t.nombre))
          WHERE c.empleado IS NOT NULL
          GROUP BY TRIM(nro_ot)
       )
       SELECT * FROM (
          SELECT 
            p.pedido_trabajo as "OT",
            p.numero_activo as "NRO_ACTIVO",
            p.descripcion as "DESCRIPCION",
            p.estado as "ESTADO",
            CASE
                WHEN UPPER(p.estado) IN ('FINALIZADO', 'FINALIZAR - SIN CARGOS') THEN 'FINALIZADA'
                WHEN ta.has_pending_tech = 1 THEN 'TECNICO / SERVICIO'
                WHEN m.numero IS NULL THEN 'OC / OTRO'
                WHEN m.rmd = 'NO' OR m.rse = 'NO' THEN 'OC / OTRO'
                ELSE 'PROGRAMADOR'
            END as "CLASIFICACION",
            CASE 
                WHEN p.pedido_trabajo LIKE 'OB%' 
                     OR UPPER(p.descripcion) LIKE '%(INFRA)%' 
                     OR UPPER(a.clase_contable) LIKE '%INFRA%' 
                THEN 1 ELSE 0 
            END as "ES_OB",
            TO_CHAR(p.fecha_inicial_programada, 'MM/YYYY') as "PERIODO",
            TO_CHAR(p.fecha_inicial_programada, 'YYYY-"S"IW') as "SEMANA",
            TO_CHAR(p.fecha_inicial_programada, 'DD/MM/YYYY') as "FECHA",

            -- Determinación de Planta (Prioridad: Cumplimiento -> Org -> Clase -> Fallback Activo)
            COALESCE(
                  CASE 
                      WHEN ta.planta_cump = 'Mantenimiento Planta I' THEN 'PF1'
                      WHEN ta.planta_cump = 'Mantenimiento Planta II' THEN 'PF2'
                      WHEN ta.planta_cump = 'Mantenimiento Centro de Distribucion Santiago' THEN 'MPS'
                      ELSE NULL
                  END,
                  CASE 
                      WHEN a.organizacion = 'MP1' THEN 'PF1'
                      WHEN a.organizacion = 'MP2' THEN 'PF2'
                      WHEN a.organizacion = 'MPS' THEN 'MPS'
                      ELSE CASE a.clase_contable
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
                          WHEN 'Equipo PF' THEN 
                              CASE 
                                  WHEN a.nro_de_activo LIKE '%(1%' THEN 'PF1'
                                  WHEN a.nro_de_activo LIKE '%(2%' THEN 'PF2'
                                  ELSE 'OTROS'
                              END
                          ELSE 'OTROS'
                      END
                  END,
                  CASE 
                      WHEN p.numero_activo LIKE '%(1%' THEN 'PF1'
                      WHEN p.numero_activo LIKE '%(2%' THEN 'PF2'
                      WHEN p.numero_activo LIKE '%(3%' THEN 'PF3'
                      WHEN p.numero_activo LIKE '%(4%' THEN 'PF4'
                      WHEN p.numero_activo LIKE '%(5%' THEN 'PF5'
                      WHEN p.numero_activo LIKE '%(6%' THEN 'PF6'
                      ELSE 'OTROS'
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
    ) WHERE "PLANTA" IN (${plantaBindKeys})
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
        planta: r.PLANTA || 'OTROS',
        nroOrden: r.OT,
        nroActivo: r.NRO_ACTIVO,
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