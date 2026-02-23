
import { executeMany, query } from "../../db/config.js";

export const EamRepository = {

  truncateTables: async () => {
    // Orden importante por FKs si las hubiera, aunque aquí no definimos FK hard.
    console.log("Truncando tablas de EAM...");
    try { await query("TRUNCATE TABLE PF_EAM_CUMPLIMIENTO"); } catch (e) { console.warn("Tabla cumplimiento no existe o error truncate", e); }
    try { await query("TRUNCATE TABLE PF_EAM_MASIVO"); } catch (e) { console.warn("Tabla masivo no existe o error truncate", e); }
    try { await query("TRUNCATE TABLE PF_EAM_PEDIDOS"); } catch (e) { console.warn("Tabla pedidos no existe o error truncate", e); }
    try { await query("TRUNCATE TABLE PF_EAM_ACTIVOS"); } catch (e) { console.warn("Tabla activos no existe o error truncate", e); }
  },

  insertarActivos: async (items: any[]) => {
    if (items.length === 0) return;
    const sql = `
      INSERT INTO PF_EAM_ACTIVOS (
        grupo_de_activo, desc_grupo_de_activo, nro_de_serie, mantenible, cc, 
        nro_de_activo, desc_nro_de_activo, nro_de_activo_padre, organizacion, 
        clase_contable, planta
      ) VALUES (
        :grupo_de_activo, :desc_grupo_de_activo, :nro_de_serie, :mantenible, :cc, 
        :nro_de_activo, :desc_nro_de_activo, :nro_de_activo_padre, :organizacion, 
        :clase_contable, :planta
      )
    `;
    return await executeMany(sql, items);
  },

  insertarPedidos: async (pedidos: any[]) => {
    if (pedidos.length === 0) return;
    const sql = `
      INSERT INTO PF_EAM_PEDIDOS (
        pedido_trabajo, numero_activo, grupo_activos, descripcion, 
        fecha_inicial_programada, duracion_horas, departamento_propiedad, estado
      ) VALUES (
        :pedido_trabajo, :numero_activo, :grupo_activos, :descripcion, 
        TO_DATE(:fecha_inicial_programada, 'DD/MM/YYYY HH24:MI:SS'), :duracion_horas, :departamento_propiedad, :estado
      )
    `;
    // Nota: Asumimos fecha formateada como string DD/MM/YYYY... o Date object si oracledb lo soporta directo.
    // Para seguridad, mejor pasar Date object y dejar que el driver maneje, o string con TO_DATE.
    // Aquí asumiré que recibo strings y uso TO_DATE o manejo fechas JS.
    // Ajustaremos esto en el controlador.
    return await executeMany(sql, pedidos);
  },

  insertarCumplimiento: async (items: any[]) => {
    if (items.length === 0) return;
    const sql = `
      INSERT INTO PF_EAM_CUMPLIMIENTO (
        planta, empleado, nro_ot, tipo, estado_om, 
        fecha_programada_inicio, nro_operacion, nro_seq_recurso, op_finalizada
      ) VALUES (
        :planta, :empleado, :nro_ot, :tipo, :estado_om, 
        TO_DATE(:fecha_programada_inicio, 'DD/MM/YYYY'), :nro_operacion, :nro_seq_recurso, :op_finalizada
      )
    `;
    return await executeMany(sql, items);
  },

  insertarMasivo: async (items: any[]) => {
    if (items.length === 0) return;
    const sql = `
      INSERT INTO PF_EAM_MASIVO (
        numero, activo, descripcion, tpt, fecha_progr, 
        anx, art_inv, art_dir, n_sol, serv_ex, horas, rmd, rse
      ) VALUES (
        :numero, :activo, :descripcion, :tpt, TO_DATE(:fecha_progr, 'DD/MM/YYYY'), 
        :anx, :art_inv, :art_dir, :n_sol, :serv_ex, :horas, :rmd, :rse
      )
    `;
    return await executeMany(sql, items);
  }
};
