import { executeMany, query } from "../../db/config.js";

/**
 * Repositorio de sincronización de datos EAM.
 * Carga masiva de tablas PF_EAM_* con datos exportados desde Oracle EAM.
 * Todas las operaciones truncan primero la tabla para garantizar datos frescos y consistentes.
 */
export const EamRepository = {

  /**
   * Trunca todas las tablas EAM en el orden correcto para evitar conflictos de datos.
   * Se ejecuta al inicio de cada carga masiva para empezar desde cero.
   */
  truncateTables: async () => {
    console.log("Truncando tablas de EAM...");
    try { await query("TRUNCATE TABLE PF_EAM_CUMPLIMIENTO"); } catch (e) { console.warn("Tabla cumplimiento no existe o error truncate", e); }
    try { await query("TRUNCATE TABLE PF_EAM_MASIVO"); } catch (e) { console.warn("Tabla masivo no existe o error truncate", e); }
    try { await query("TRUNCATE TABLE PF_EAM_PEDIDOS"); } catch (e) { console.warn("Tabla pedidos no existe o error truncate", e); }
    try { await query("TRUNCATE TABLE PF_EAM_ACTIVOS"); } catch (e) { console.warn("Tabla activos no existe o error truncate", e); }
  },

  /**
   * Inserta en PF_EAM_ACTIVOS el catálogo de activos físicos de las plantas.
   */
  insertarActivos: async (items: Record<string, unknown>[]) => {
    if (items.length === 0) return;
    const sql = `
      INSERT INTO PF_EAM_ACTIVOS (
        grupo_de_activo, desc_grupo_de_activo, nro_de_serie, mantenible, 
        nro_de_activo, desc_nro_de_activo, nro_de_activo_padre, organizacion, 
        clase_contable
      ) VALUES (
        :grupo_de_activo, :desc_grupo_de_activo, :nro_de_serie, :mantenible,
        :nro_de_activo, :desc_nro_de_activo, :nro_de_activo_padre, :organizacion, 
        :clase_contable
      )
    `;
    return await executeMany(sql, items);
  },

  /**
   * Inserta en PF_EAM_PEDIDOS las órdenes de trabajo del período cargado.
   * La clave primaria es pedido_trabajo; se asume que no hay duplicados en el Excel de origen.
   */
  insertarPedidos: async (pedidos: Record<string, unknown>[]) => {
    if (pedidos.length === 0) return;
    const sql = `
      INSERT INTO PF_EAM_PEDIDOS (
        pedido_trabajo, numero_activo, grupo_activos, descripcion, 
        fecha_inicial_programada, duracion_horas, departamento_propiedad, estado
      ) VALUES (
        :pedido_trabajo, :numero_activo, :grupo_activos, :descripcion, 
        :fecha_inicial_programada, :duracion_horas, :departamento_propiedad, :estado
      )
    `;
    return await executeMany(sql, pedidos);
  },

  /**
   * Inserta en PF_EAM_CUMPLIMIENTO los recursos humanos asignados a las OTs
   * (técnicos, operaciones y estado de finalización).
   */
  insertarCumplimiento: async (items: Record<string, unknown>[]) => {
    if (items.length === 0) return;
    const sql = `
      INSERT INTO PF_EAM_CUMPLIMIENTO (
        planta, empleado, nro_ot, tipo, estado_om, 
        fecha_programada_inicio, nro_operacion, nro_seq_recurso, op_finalizada
      ) VALUES (
        :planta, :empleado, :nro_ot, :tipo, :estado_om, 
        :fecha_programada_inicio, :nro_operacion, :nro_seq_recurso, :op_finalizada
      )
    `;
    return await executeMany(sql, items);
  },

  /**
   * Inserta en PF_EAM_MASIVO el detalle de materiales, servicios y horas
   * usados en cada OT (número de solicitud, RMD, RSE, etc.).
   */
  insertarMasivo: async (items: Record<string, unknown>[]) => {
    if (items.length === 0) return;
    const sql = `
      INSERT INTO PF_EAM_MASIVO (
        numero, activo, descripcion, tpt, fecha_progr, 
        anx, art_inv, art_dir, n_sol, serv_ex, horas, rmd, rse
      ) VALUES (
        :numero, :activo, :descripcion, :tpt, :fecha_progr, 
        :anx, :art_inv, :art_dir, :n_sol, :serv_ex, :horas, :rmd, :rse
      )
    `;
    return await executeMany(sql, items);
  },

  /**
   * Inserta en PF_EAM_FALLAS los registros de paros de equipos con sus causas,
   * técnicos, duración, gasto y pérdida de producción.
   */
  insertarFallas: async (items: Record<string, unknown>[]) => {
    const sql = `
        INSERT INTO PF_EAM_FALLAS (fecha, planta, area, linea, equipo, 
                causa, pedido_trabajo, estado_pedido, tipo_pedido, tecnico, duracion_minutos, gasto, 
                perdida_kg, descripcion_operador)
        VALUES (:fecha, :planta, :area, :linea, :equipo, 
                :causa, :pedidoTrabajo, :estadoPedido, :tipoPedido, :tecnico, :duracionMinutos, :gasto, 
                :perdidaKg, :descripcionOperador)
    `;
    await executeMany(sql, items);
  },
};
