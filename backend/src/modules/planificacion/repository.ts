import { query, executeMany } from '../../db/config.js';
import type { OrdenTrabajo, Tecnico } from '../../shared/types/index.js';

/**
 * Repositorio del módulo de Planificación.
 * Centraliza todas las consultas a Oracle relacionadas con OTs, técnicos y horarios.
 */
export const PlanificacionRepository = {

  /**
   * Obtiene las OTs pendientes de planificar para un período y planta dados,
   * junto con el catálogo de técnicos activos.
   *
   * La lógica SQL determina la planta de cada OT usando un COALESCE jerárquico:
   *   1. Clase contable del activo (tabla PF_EAM_ACTIVOS)
   *   2. Departamento de propiedad del pedido (LIKE '%P1%', '%P2%')
   *   3. Dígito de posición del código de activo (fallback por prefijo)
   *
   * Los técnicos asignados se resuelven con prioridad:
   *   1. Tabla de planificación propia (PF_SPM_PLANIFICACION_TECNICOS) si existe plan
   *   2. Tabla de cumplimiento de EAM (PF_EAM_CUMPLIMIENTO) si no hay plan
   *   3. Array vacío si no hay datos
   *
   * Excluye OTs con prefijo OM o OB, y las OTs de infraestructura (INFRA).
   * También excluye OTs que ya tienen registros en cumplimiento (ya ejecutadas).
   */
  getDataParaPlanificar: async (mes: number, anio: number, planta?: string) => {

    const sqlOTs = `
      WITH DataCalculada AS (
        SELECT 
              p.pedido_trabajo as "nroOrden",
              p.numero_activo as "nroActivo",
              p.descripcion as "descripcion",
              p.estado as "estado",
              TO_CHAR(p.fecha_inicial_programada, 'DD/MM/YYYY') as "fecha",
              p.fecha_inicial_programada as "fechaDate",
              CASE 
                WHEN p.pedido_trabajo LIKE 'OB%' 
                     OR UPPER(p.descripcion) LIKE '%(INFRA)%' 
                     OR EXISTS (
                        SELECT 1 FROM PF_EAM_ACTIVOS act 
                        WHERE act.nro_de_activo = p.numero_activo 
                        AND UPPER(act.clase_contable) LIKE '%INFRA%'
                     )
                THEN 1 ELSE 0 
              END as "esOB",              
              -- Determinación de Planta (Jerarquía: Org -> Clase Contable -> Prefijo Activo)
              COALESCE(
                  (
                      SELECT CASE 
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
                      END
                      FROM PF_EAM_ACTIVOS a 
                      WHERE TRIM(UPPER(a.nro_de_activo)) = TRIM(UPPER(p.numero_activo)) AND ROWNUM = 1
                  ),
                  CASE 
                      WHEN p.numero_activo LIKE '%(1%' THEN 'PF1'
                      WHEN p.numero_activo LIKE '%(2%' THEN 'PF2'
                      WHEN p.numero_activo LIKE '%(3%' THEN 'PF3'
                      WHEN p.numero_activo LIKE '%(4%' THEN 'PF4'
                      WHEN p.numero_activo LIKE '%(5%' THEN 'PF5'
                      WHEN p.numero_activo LIKE '%(6%' THEN 'PF6'
                      ELSE 'OTROS'
                  END
              ) as "planta",

              -- Detalles de técnicos: prioriza plan interno, luego cumplimiento EAM
              CASE 
                  WHEN plan.nro_orden IS NOT NULL THEN
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
                              FROM PF_SPM_PLANIFICACION_TECNICOS pt
                              WHERE pt.nro_orden = p.pedido_trabajo 
                                AND pt.anio = :anio 
                                AND pt.mes = :mes
                          ),
                          '[]'
                      )
                  ELSE
                      COALESCE(
                          (
                              SELECT JSON_ARRAYAGG(
                                  JSON_OBJECT(
                                      'nombre' VALUE c.empleado, 
                                      'rol' VALUE COALESCE(t.rol, 'M'),
                                      'planta' VALUE COALESCE(t.planta, 'VARIOS'),
                                      'opFinalizada' VALUE c.op_finalizada
                                  )
                                  RETURNING VARCHAR2(4000)
                              ) 
                              FROM PF_EAM_CUMPLIMIENTO c 
                              LEFT JOIN PF_SPM_TECNICOS t ON TRIM(UPPER(c.empleado)) = TRIM(UPPER(t.nombre))
                              WHERE c.nro_ot = p.pedido_trabajo AND c.empleado IS NOT NULL
                          ),
                          '[]'
                      )
              END as "DETALLES_TECNICOS_RAW"

        FROM PF_EAM_PEDIDOS p
        LEFT JOIN PF_SPM_PLANIFICACION plan ON (p.pedido_trabajo = plan.nro_orden AND plan.anio = :anio AND plan.mes = :mes)
        WHERE EXTRACT(YEAR FROM p.fecha_inicial_programada) = :anio 
          AND EXTRACT(MONTH FROM p.fecha_inicial_programada) = :mes
          AND p.pedido_trabajo NOT LIKE 'OM%'
          AND p.pedido_trabajo NOT LIKE 'OB%'
          AND UPPER(p.descripcion) NOT LIKE '%(INFRA)%'
          AND NOT EXISTS (
              SELECT 1 FROM PF_EAM_CUMPLIMIENTO c 
              WHERE c.nro_ot = p.pedido_trabajo
          )
      )
      SELECT * FROM DataCalculada
      WHERE (:planta IS NULL OR "planta" = :planta)
    `;

    // Maetro de técnicos activos para enriquecer los datos
    const sqlEmps = `SELECT * FROM PF_SPM_TECNICOS WHERE activo = 1`;

    const resOTs = await query(sqlOTs, { anio, mes, planta: planta || null });
    const resEmps = await query(sqlEmps);

    // Parsear el JSON de técnicos que viene como string desde Oracle
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
        esOB: r.esOB,
        detallesTecnicos: tecnicos,
        mes,
        anio
      };
    });

    return {
      ots: rows,
      empleados: resEmps?.rows || []
    };
  },

  /**
   * Obtiene las OTs del período anterior para construir el historial de continuidad.
   * Se usan como referencia para reasignar los mismos técnicos al mes siguiente.
   */
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

  /**
   * Obtiene los registros de cumplimiento (técnicos asignados) del período anterior.
   * Se usa junto con getHistoricoPedidos para identificar quién ejecutó cada OT.
   */
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

  /**
   * Obtiene la planificación ya guardada para el período indicado.
   * Reutiliza la lógica centralizada de getDataParaPlanificar.
   */
  getPlanificacion: async (mes: number, anio: number, planta?: string) => {
    const data = await PlanificacionRepository.getDataParaPlanificar(mes, anio, planta);
    return data.ots;
  },

  /**
   * Retorna los horarios de turnos de los técnicos para un período y planta dados.
   * Si un técnico no tiene horario cargado, se devuelve un array de 31 'L' (libre).
   * Soporta filtro por planta o por CI (complejo industrial: PF3-PF6, CDT).
   */
  getHorarios: async (mes: number, anio: number, planta: string | null) => {
    const sql = `
      SELECT e.nombre as empleado_nombre, e.rol, e.planta, h.turnos
      FROM PF_SPM_TECNICOS e
      LEFT JOIN PF_SPM_HORARIOS h ON TRIM(UPPER(h.empleado_nombre)) = TRIM(UPPER(e.nombre))
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


    return rows.map((r) => {
      let turnosParseados: string[];
      if (!r.TURNOS) {
        turnosParseados = new Array(31).fill('L');
      } else if (typeof r.TURNOS === 'string') {
        turnosParseados = JSON.parse(r.TURNOS);
      } else {
        turnosParseados = r.TURNOS;
      }
      return {
        nombre: r.EMPLEADO_NOMBRE,
        rol: r.ROL || 'M',
        planta: r.PLANTA || planta || 'VARIOS',
        // Si no hay turnos, se asume que el técnico está libre todo el mes
        turnos: turnosParseados
      };
    });
  },

  /**
   * Persiste las asignaciones de técnicos a OTs en Oracle.
   * Usa MERGE para la cabecera (PF_SPM_PLANIFICACION) y reemplaza completamente
   * el detalle de técnicos (PF_SPM_PLANIFICACION_TECNICOS) por el nuevo conjunto.
   */
  guardarPlanificacion: async (asignaciones: { nroOrden: string, tecnicos: Tecnico[], mes: number, anio: number }[]) => {
    for (const asignacion of asignaciones) {

      // UPSERT del registro cabecera de la planificación
      const sqlMergeHeader = `
        MERGE INTO PF_SPM_PLANIFICACION p
        USING DUAL ON (p.anio = :anio AND p.mes = :mes AND p.nro_orden = :nroOrden)
        WHEN MATCHED THEN
          UPDATE SET fecha_asignacion = CURRENT_TIMESTAMP
        WHEN NOT MATCHED THEN
          INSERT (anio, mes, nro_orden, detalles_tecnicos, fecha_asignacion) 
          VALUES (:anio, :mes, :nroOrden, '[]', CURRENT_TIMESTAMP)
      `;
      await query(sqlMergeHeader, { anio: asignacion.anio, mes: asignacion.mes, nroOrden: asignacion.nroOrden });

      // Eliminar técnicos anteriores de esta OT antes de insertar los nuevos
      await query(
        `DELETE FROM PF_SPM_PLANIFICACION_TECNICOS WHERE anio = :anio AND mes = :mes AND nro_orden = :nroOrden`,
        { anio: asignacion.anio, mes: asignacion.mes, nroOrden: asignacion.nroOrden }
      );

      // Insertar el nuevo detalle de técnicos en batch
      if (asignacion.tecnicos && asignacion.tecnicos.length > 0) {
        const sqlInsert = `
          INSERT INTO PF_SPM_PLANIFICACION_TECNICOS (nro_orden, anio, mes, nombre_tecnico, rol, planta, origen)
          VALUES (:nroOrden, :anio, :mes, :nombre, :rol, :planta, 'PLANIFICACION')
        `;

        const binds = asignacion.tecnicos.map((t: Tecnico) => ({
          nroOrden: asignacion.nroOrden,
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

  /**
   * Inserta o actualiza técnicos en la tabla PF_SPM_TECNICOS.
   * Si el técnico ya existe (por nombre), actualiza su planta, rol y lo marca activo.
   */
  upsertEmpleados: async (empleados: { nombre: string, planta: string, rol: string }[]) => {
    if (empleados.length === 0) return;
    const sql = `
      MERGE INTO PF_SPM_TECNICOS emp
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

  /**
   * Retorna un Set con los nombres (en mayúsculas) de todos los técnicos activos.
   * Se usa para filtrar los horarios del Excel a solo los técnicos registrados.
   */
  getAllNombresTecnicos: async () => {
    const sql = `SELECT nombre FROM PF_SPM_TECNICOS WHERE activo = 1`;
    const res = await query(sql);
    if (!res?.rows) return new Set<string>();

    const rows = (res.rows || []) as Record<string, any>[];
    const nombres = rows.map((r) => String(r.NOMBRE || '').trim().toUpperCase());
    return new Set(nombres);
  },

  /**
   * Guarda los horarios de turnos de un conjunto de técnicos para un período dado.
   * Usa MERGE para actualizar si ya existe o insertar si es nuevo.
   * El array de turnos se serializa a JSON antes de guardarse.
   */
  guardarHorarios: async (horarios: { nombre: string, turnos: string[] }[], anio?: number, mes?: number) => {
    if (horarios.length === 0) return;

    if (anio === undefined || mes === undefined) {
      throw new Error("Se requiere periodo (anio, mes)");
    }
    const sql = `
      MERGE INTO PF_SPM_HORARIOS hor
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

  /**
   * Actualiza o crea el horario de un solo técnico para un período dado.
   * Se utiliza desde la edición manual desde el frontend (celda por celda).
   */
  upsertHorarioManual: async (mes: number, anio: number, nombre: string, turnos: string[]) => {
    const sql = `
      MERGE INTO PF_SPM_HORARIOS hor
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
