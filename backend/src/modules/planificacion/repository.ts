import { query, executeMany } from '../../db/config.js';
import { getMonthFromWeekId } from './utils/dateHelpers.js';
import type { OrdenTrabajo, Tecnico } from '../../types.js';

export const PlanificacionRepository = {

  getDataParaPlanificar: async (mes: number, anio: number, planta?: string) => {

    // Consulta unificada a tablas EAM y Planificación
    // Prioridad Detalles Técnicos: PF_IM_PLANIFICACION -> PF_EAM_CUMPLIMIENTO -> NULL
    // Filtramos por Mes/Año de la fecha programada
    const sqlOTs = `
      WITH DataCalculada AS (
        SELECT 
              p.pedido_trabajo as "OT", 
              p.pedido_trabajo as "nroOrden",
              p.numero_activo as "NRO_ACTIVO",
              p.descripcion as "DESCRIPCION",
              p.estado as "ESTADO",
              TO_CHAR(p.fecha_inicial_programada, 'DD/MM/YYYY') as "FECHA",
              p.fecha_inicial_programada as "FECHA_DATE",              
              -- Determinación de Planta (Jerarquía: Clase Contable Activo -> Depto -> Prefijo Activo)
              COALESCE(
                  (
                    SELECT CASE a.clase_contable
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
                        ELSE NULL
                    END
                    FROM PF_EAM_ACTIVOS a 
                    WHERE TRIM(UPPER(a.nro_de_activo)) = TRIM(UPPER(p.numero_activo)) AND ROWNUM = 1
                  ),
                  CASE 
                      WHEN p.departamento_propiedad LIKE '%P1%' THEN 'PF1'
                      WHEN p.departamento_propiedad LIKE '%P2%' THEN 'PF2'
                      ELSE NULL
                  END,
                  CASE 
                      WHEN SUBSTR(p.numero_activo, -4, 1) IN ('0', '1') THEN 'PF1'
                      WHEN SUBSTR(p.numero_activo, -4, 1) = '2' THEN 'PF2'
                      ELSE 'PF3'
                  END
              ) as "PLANTA",

              -- Determinación de Técnicos y Operaciones
              -- Determinación de Técnicos
              CASE 
                  WHEN plan.id IS NOT NULL THEN
                      -- Si existe plan (aunque sea vacio), usamos la tabla de detalle
                      COALESCE(
                          (
                              SELECT JSON_ARRAYAGG(
                                  JSON_OBJECT(
                                      'nombre' VALUE pt.nombre_tecnico,
                                      'rol' VALUE pt.rol,
                                      'planta' VALUE pt.planta,
                                      'opFinalizada' VALUE 'N'
                                  )
                                  RETURNING VARCHAR2(4000)
                              )
                              FROM PF_IM_PLANIFICACION_TECNICOS pt
                              WHERE pt.ot = p.pedido_trabajo 
                                AND pt.anio = :anio 
                                AND pt.mes = :mes
                          ),
                          '[]'
                      )
                  ELSE
                      -- Si no hay plan, usamos cumplimiento (real)
                      COALESCE(
                          (
                              SELECT JSON_ARRAYAGG(
                                  JSON_OBJECT(
                                      'nombre' VALUE c.empleado, 
                                      'rol' VALUE COALESCE(t.rol, 'MECANICO'),
                                      'planta' VALUE COALESCE(t.planta, 'PF3'),
                                      'opFinalizada' VALUE c.op_finalizada
                                  )
                                  RETURNING VARCHAR2(4000)
                              ) 
                              FROM PF_EAM_CUMPLIMIENTO c 
                              LEFT JOIN PF_IM_TECNICOS t ON TRIM(UPPER(c.empleado)) = TRIM(UPPER(t.nombre))
                              WHERE c.nro_ot = p.pedido_trabajo AND c.empleado IS NOT NULL
                          ),
                          '[]'
                      )
              END as "DETALLES_TECNICOS_RAW"

        FROM PF_EAM_PEDIDOS p
        LEFT JOIN PF_IM_PLANIFICACION plan ON (p.pedido_trabajo = plan.ot AND plan.anio = :anio AND plan.mes = :mes)
        WHERE EXTRACT(YEAR FROM p.fecha_inicial_programada) = :anio 
          AND EXTRACT(MONTH FROM p.fecha_inicial_programada) = :mes
          AND p.pedido_trabajo NOT LIKE 'OM%'
          AND p.pedido_trabajo NOT LIKE 'OB%'
          AND NOT EXISTS (
              SELECT 1 FROM PF_EAM_CUMPLIMIENTO c 
              WHERE c.nro_ot = p.pedido_trabajo
          )
      )
      SELECT * FROM DataCalculada
      WHERE (:plantaFiltro IS NULL OR "PLANTA" = :planta)
    `;

    // Obtener maestros de empleados
    const sqlEmps = `SELECT * FROM PF_IM_TECNICOS WHERE activo = 1`;

    const resOTs = await query(sqlOTs, { anio, mes, plantaFiltro: planta || null, planta: planta || null });
    const resEmps = await query(sqlEmps);

    // Procesar resultados
    const rows: OrdenTrabajo[] = (resOTs?.rows || []).map((r: any): OrdenTrabajo => {
      let tecnicos: Tecnico[] = [];
      try {
        if (r.DETALLES_TECNICOS_RAW) {
          tecnicos = typeof r.DETALLES_TECNICOS_RAW === 'string'
            ? JSON.parse(r.DETALLES_TECNICOS_RAW)
            : r.DETALLES_TECNICOS_RAW as Tecnico[];
        }
      } catch (e) { console.error("Error parseando tecnicos", e); }

      return {
        ...r,
        DETALLES_TECNICOS: tecnicos,
        mes,
        anio
      };
    });

    return {
      ots: rows,
      empleados: resEmps?.rows || []
    };
  },

  getHistoricoPedidos: async (mes: number, anio: number) => {
    const sql = `
      SELECT 
        numero_activo as "NUMERO DE ACTIVO", 
        descripcion as "DESCRIPCION", 
        pedido_trabajo as "PEDIDO DE TRABAJO", 
        fecha_inicial_programada as "FECHA INICIAL PROGRAMADA"
      FROM PF_EAM_PEDIDOS
      WHERE EXTRACT(YEAR FROM fecha_inicial_programada) = :anio 
        AND EXTRACT(MONTH FROM fecha_inicial_programada) = :mes
    `;
    const res = await query(sql, { anio, mes });
    return res?.rows || [];
  },

  getHistoricoCompliance: async (mes: number, anio: number) => {
    const sql = `
      SELECT nro_ot as "NRO_OT", empleado as "EMPLEADO" 
      FROM PF_EAM_CUMPLIMIENTO
      WHERE nro_ot IN (
        SELECT pedido_trabajo FROM PF_EAM_PEDIDOS 
        WHERE EXTRACT(YEAR FROM fecha_inicial_programada) = :anio 
          AND EXTRACT(MONTH FROM fecha_inicial_programada) = :mes
      )
    `;
    const res = await query(sql, { anio, mes });
    return res?.rows || [];
  },

  getPlanificacion: async (mes: number, anio: number, planta?: string) => {
    // Reutilizamos la misma lógica centralizada (ahora basada en Mes/Anio)
    const data = await PlanificacionRepository.getDataParaPlanificar(mes, anio, planta);
    return data.ots;
  },

  getHorarios: async (mes: number, anio: number, planta: string | null) => {
    const sql = `
      SELECT e.nombre as empleado_nombre, e.rol, e.planta, h.turnos
      FROM PF_IM_TECNICOS e
      LEFT JOIN PF_IM_HORARIOS h ON TRIM(UPPER(h.empleado_nombre)) = TRIM(UPPER(e.nombre))
        AND h.anio = :anio AND h.mes = :mes
      WHERE (
          :plantaFiltro IS NULL 
          OR e.planta LIKE :plantaLike 
          OR (:plantaFiltro IN ('PF3', 'PF4', 'PF5', 'PF6', 'CDT') AND e.planta = 'CI')
      )
    `;
    const plantaLike = planta ? `%${planta}%` : null;
    const res = await query(sql, { anio, mes, plantaFiltro: planta, plantaLike });

    if (!res?.rows) return [];

    const rows = res.rows as Record<string, any>[];

    return rows.map((r) => ({
      nombre: r.EMPLEADO_NOMBRE,
      rol: r.ROL || 'M',
      planta: r.PLANTA || (planta as string) || 'VARIOS',
      turnos: r.TURNOS
        ? (typeof r.TURNOS === 'string' ? JSON.parse(r.TURNOS) : r.TURNOS)
        : Array(31).fill('L')
    }));
  },

  guardarPlanificacion: async (asignaciones: { ot: string, tecnicos: Tecnico[], mes: number, anio: number }[]) => {
    for (const asignacion of asignaciones) {

      // 1. Upsert Header (PF_IM_PLANIFICACION)
      // Mantenemos detalles_tecnicos como [] por compatibilidad con NOT NULL actual
      const sqlMergeHeader = `
        MERGE INTO PF_IM_PLANIFICACION p
        USING DUAL ON (p.anio = :anio AND p.mes = :mes AND p.ot = :ot)
        WHEN MATCHED THEN
          UPDATE SET fecha_asignacion = CURRENT_TIMESTAMP
        WHEN NOT MATCHED THEN
          INSERT (anio, mes, ot, detalles_tecnicos, fecha_asignacion) 
          VALUES (:anio, :mes, :ot, '[]', CURRENT_TIMESTAMP)
      `;
      await query(sqlMergeHeader, { anio: asignacion.anio, mes: asignacion.mes, ot: asignacion.ot });

      // 2. Reemplazar Detalles (PF_IM_PLANIFICACION_TECNICOS)
      // Borrar anteriores
      await query(
        `DELETE FROM PF_IM_PLANIFICACION_TECNICOS WHERE anio = :anio AND mes = :mes AND ot = :ot`,
        { anio: asignacion.anio, mes: asignacion.mes, ot: asignacion.ot }
      );

      // Insertar nuevos
      if (asignacion.tecnicos && asignacion.tecnicos.length > 0) {
        const sqlInsert = `
          INSERT INTO PF_IM_PLANIFICACION_TECNICOS (ot, anio, mes, nombre_tecnico, rol, planta, origen)
          VALUES (:ot, :anio, :mes, :nombre, :rol, :planta, 'PLANIFICACION')
        `;

        const binds = asignacion.tecnicos.map((t: Tecnico) => ({
          ot: asignacion.ot,
          anio: asignacion.anio,
          mes: asignacion.mes,
          nombre: t.nombre,
          rol: t.rol || 'MECANICO',
          planta: t.planta || 'PF3'
        }));

        await executeMany(sqlInsert, binds);
      }
    }
  },

  upsertEmpleados: async (empleados: { nombre: string, planta: string, rol: string }[]) => {
    if (empleados.length === 0) return;
    const sql = `
      MERGE INTO PF_IM_TECNICOS emp
      USING DUAL ON (emp.nombre = :nombre)
      WHEN MATCHED THEN
        UPDATE SET planta = :planta, rol = :rol, activo = 1
      WHEN NOT MATCHED THEN
        INSERT (nombre, planta, rol, activo) VALUES (:nombre, :planta, :rol, 1)
    `;
    const binds = empleados.map(e => ({
      nombre: e.nombre,
      planta: e.planta,
      rol: e.rol
    }));
    return await executeMany(sql, binds);
  },

  getAllNombresTecnicos: async () => {
    // Obtenemos solo los nombres de técnicos activos
    const sql = `SELECT nombre FROM PF_IM_TECNICOS WHERE activo = 1`;
    const res = await query(sql);
    if (!res?.rows) return new Set<string>();

    const rows = (res.rows || []) as Record<string, any>[];
    const nombres = rows.map((r) => String(r.NOMBRE || '').trim().toUpperCase());
    return new Set(nombres);
  },

  guardarHorarios: async (horarios: { nombre: string, turnos: string[] }[], mes?: number, anio?: number) => {
    if (horarios.length === 0) return;

    if (anio === undefined || mes === undefined) {
      throw new Error("Se requiere periodo (anio, mes)");
    }
    const sql = `
      MERGE INTO PF_IM_HORARIOS hor
      USING DUAL ON (hor.anio = :anio AND hor.mes = :mes AND hor.empleado_nombre = :nombre)
      WHEN MATCHED THEN
        UPDATE SET turnos = :turnos
      WHEN NOT MATCHED THEN
        INSERT (anio, mes, empleado_nombre, turnos) VALUES (:anio, :mes, :nombre, :turnos)
    `;
    const binds = horarios.map(h => ({
      anio,
      mes,
      nombre: h.nombre,
      turnos: JSON.stringify(h.turnos)
    }));
    return await executeMany(sql, binds);
  },

  // Borramos guardarPedidos ya que ya no existe la tabla destino ni se usa

  upsertHorarioManual: async (mes: number, anio: number, nombre: string, turnos: string[]) => {
    const sql = `
      MERGE INTO PF_IM_HORARIOS hor
      USING DUAL ON (hor.anio = :anio AND hor.mes = :mes AND hor.empleado_nombre = :nombre)
      WHEN MATCHED THEN
        UPDATE SET turnos = :turnos
      WHEN NOT MATCHED THEN
        INSERT (anio, mes, empleado_nombre, turnos) VALUES (:anio, :mes, :nombre, :turnos)
    `;
    return await query(sql, {
      anio,
      mes,
      nombre,
      turnos: JSON.stringify(turnos)
    });
  }
};
