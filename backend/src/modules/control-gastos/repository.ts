
import { withConnection } from '../../db/config.js';

export interface PresupuestoRow {
  activo: string;
  mes: number;
  anio: number;
  frecuencia: string;
  montoBodega?: number;
  montoServExt?: number;
  montoCorrectivo?: number;
  centroCosto?: string; // Calculado al recuperar
  claseContable?: string;
  mantenible?: string;
}

export interface GastoConsolidadoRow {
  tipo: string;
  numeroOt: string;
  tipoOt: string;
  nroActivo: string;
  fechaTrx: Date | string;
  descripcionArticulo: string;
  costoTrx: number;
  alertaFecha?: number;
  // Campos calculados
  centroCosto?: string;
  anio?: number;
  mes?: number;
  tipoGasto?: string; // BODEGA, SERV_EXT, CORRECTIVO
  fechaOtPro?: Date | string;
  descripcionOt?: string;
  estadoTrabajo?: string;
  esHito?: boolean;
  planta?: string;
  claseContable?: string;
  mantenible?: string;
}

const FRECUENCIAS_PREDEFINIDAS = [
  'semanal', 'quincenal', 'mensual', 'bimensual',
  'trimestral', 'semestral', 'anual', 'hito'
];

const normalizeFrecuencia = (f: string): string => {
  if (!f) return '';
  const low = f.toLowerCase().trim();
  if (low.startsWith('quinc')) return 'quincenal';
  if (low === 'men' || low.startsWith('mensu')) return 'mensual';
  if (low.startsWith('semes')) return 'semestral';
  if (low === 'trime' || low.startsWith('trimes') || low.startsWith('trim')) return 'trimestral';
  if (low.startsWith('hito')) return 'hito';
  return low;
};


export const ControlGastosRepository = {
  getOTDetails: async (ots: string[]): Promise<Map<string, { descripcion: string, fechaProg?: Date, estado?: string }>> => {
    if (ots.length === 0) return new Map();

    const uniqueOts = [...new Set(ots)];
    const map = new Map<string, { descripcion: string, fechaProg?: Date, estado?: string }>();

    await withConnection(async (connection) => {
      for (let i = 0; i < uniqueOts.length; i += 1000) {
        const chunk = uniqueOts.slice(i, i + 1000);
        const binds: any = {};
        chunk.forEach((ot, idx) => binds[`ot${idx}`] = ot);
        const keys = chunk.map((_, idx) => `:ot${idx}`).join(',');

        const sql = `SELECT PEDIDO_TRABAJO, DESCRIPCION, FECHA_INICIAL_PROGRAMADA, ESTADO FROM PF_EAM_PEDIDOS WHERE PEDIDO_TRABAJO IN (${keys})`;

        const result = await connection.execute(sql, binds);

        (result.rows || []).forEach((r: any) => {
          const ot = r.PEDIDO_TRABAJO || r[0];
          const desc = r.DESCRIPCION || r[1];
          const fProg = r.FECHA_INICIAL_PROGRAMADA || r[2];
          const estado = r.ESTADO || r[3];
          if (ot) map.set(String(ot).trim(), {
            descripcion: desc,
            fechaProg: fProg ? new Date(fProg) : undefined,
            estado
          });
        });
      }
    });
    return map;
  },
  saveGastosConsolidados: async (rows: GastoConsolidadoRow[]) => {
    if (rows.length === 0) return;

    await withConnection(async (connection) => {
      const sql = `INSERT INTO PF_EAM_GASTOS_CONSOLIDADOS 
                (TIPO, NUMERO_OT, TIPO_OT, NRO_ACTIVO, FECHA_TRANSACCION, DESCRIP_ARTICULO, COSTO_TRX, MANTENIBLE)
                VALUES (:tipo, :numeroOt, :tipoOt, :nroActivo, :fechaTrx, :descripcionArticulo, :costoTrx, :mantenible)`;

      const binds = rows.map(r => ({
        tipo: r.tipo,
        numeroOt: r.numeroOt,
        tipoOt: r.tipoOt,
        nroActivo: r.nroActivo,
        descripcionArticulo: r.descripcionArticulo?.substring(0, 500) || '',
        fechaTrx: r.fechaTrx,
        costoTrx: r.costoTrx,
        mantenible: r.mantenible
      }));

      const batchSize = 1000;
      for (let i = 0; i < binds.length; i += batchSize) {
        const batch = binds.slice(i, i + batchSize);
        await connection.executeMany(sql, batch, { autoCommit: true });
      }

      console.log(`Insertadas ${rows.length} filas en PF_EAM_GASTOS_CONSOLIDADOS`);
    });
  },

  savePresupuesto: async (rows: PresupuestoRow[]) => {
    if (rows.length === 0) return;

    await withConnection(async (connection) => {
      const sql = `INSERT INTO PF_GASTOS_PRESUPUESTO 
                (ACTIVO_COD, FRECUENCIA, MES, ANIO, MONTO_BODEGA, MONTO_SERV_EXT, MONTO_CORRECTIVO)
                VALUES (:activo, :frecuencia, :mes, :anio, :montoBodega, :montoServExt, :montoCorrectivo)`;

      const binds = rows.map(r => ({
        activo: r.activo,
        frecuencia: normalizeFrecuencia(r.frecuencia || ''),
        mes: r.mes,
        anio: r.anio,
        montoBodega: r.montoBodega || 0,
        montoServExt: r.montoServExt || 0,
        montoCorrectivo: r.montoCorrectivo || 0,
      }));

      await connection.executeMany(sql, binds, { autoCommit: true });
      console.log(`Insertadas ${rows.length} filas en PF_GASTOS_PRESUPUESTO`);
    });
  },

  getGastosConsolidados: async (anio: number, planta?: string, mes?: number): Promise<GastoConsolidadoRow[]> => {
    return await withConnection(async (connection) => {
      const sql = `
                WITH DataCalculada AS (
                    SELECT 
                        g.TIPO, 
                        g.NUMERO_OT, 
                        g.TIPO_OT, 
                        g.NRO_ACTIVO, 
                        g.DESCRIP_ARTICULO, 
                        g.FECHA_TRANSACCION, 
                        p.FECHA_INICIAL_PROGRAMADA as FECHA_PROG,
                        p.DESCRIPCION as DESC_OT,
                        p.ESTADO as ESTADO_OT,
                        g.COSTO_TRX, 
                        EXTRACT(YEAR FROM p.FECHA_INICIAL_PROGRAMADA) as ANIO_CALC,
                        EXTRACT(MONTH FROM p.FECHA_INICIAL_PROGRAMADA) as MES_CALC,
                        a.clase_contable as CLASE_CONTABLE_ACTIVO,
                        a.mantenible as MANTENIBLE_ACTIVO,
                        COALESCE(
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
                            'OTROS'
                        ) as PLANTA_CALC
                    FROM PF_EAM_GASTOS_CONSOLIDADOS g
                    INNER JOIN PF_EAM_PEDIDOS p ON g.NUMERO_OT = p.PEDIDO_TRABAJO
                    LEFT JOIN PF_EAM_ACTIVOS a ON UPPER(g.NRO_ACTIVO) = UPPER(a.nro_de_activo)
                    WHERE p.FECHA_INICIAL_PROGRAMADA >= TO_DATE(:startDate, 'YYYY-MM-DD')
                      AND p.FECHA_INICIAL_PROGRAMADA <= TO_DATE(:endDate, 'YYYY-MM-DD')
                )
                SELECT * FROM DataCalculada
                WHERE (:plantaFiltro IS NULL OR PLANTA_CALC = :planta)
            `;

      // Optimización de fechas: Usamos BETWEEN en lugar de EXTRACT para aprovechar índices
      const startDate = mes ? `${anio}-${String(mes).padStart(2, '0')}-01` : `${anio}-01-01`;
      let endDate;
      if (mes) {
        const lastDay = new Date(anio, mes, 0).getDate();
        endDate = `${anio}-${String(mes).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      } else {
        endDate = `${anio}-12-31`;
      }

      const result = await connection.execute(sql, { startDate, endDate, plantaFiltro: planta || null, planta: planta || null }, { outFormat: 4002 });
      const rows = result.rows || [];

      const results: GastoConsolidadoRow[] = [];

      for (const row of rows) {
        const tipo = String(row.TIPO || '');
        const tipoOt = String(row.TIPO_OT || '').trim();
        const descPedido = (row.DESC_OT || '');
        const fechaProgPedido = row.FECHA_PROG ? new Date(row.FECHA_PROG) : null;
        const estadoPedido = row.ESTADO_OT;
        let tipoGasto = '';
        // Determinamos si es HITO exclusivamente por la descripción
        const esHitoValue = descPedido.startsWith('HITO') || descPedido.startsWith('(HITO)');

        // Logica para clasificar la categoría (Bodega, Serv. Ext o Correctivo)
        if (tipo === 'B' && (tipoOt === 'Preventivo' || tipoOt === 'Procedimientos')) {
          tipoGasto = 'BODEGA';
        } else if (tipo === 'SER' && (tipoOt === 'Preventivo' || tipoOt === 'Procedimientos')) {
          tipoGasto = 'SERV_EXT';
        } else if (tipo === 'B' || tipo === 'SER' || tipo === 'OC') {
          tipoGasto = 'CORRECTIVO';
        }

        // Si no coincide con ninguna categoría, lo salta
        if (!tipoGasto) continue;

        // Priorizamos la fecha programada del Pedido (Base)
        const dTrx = row.FECHA_TRANSACCION ? new Date(row.FECHA_TRANSACCION) : null;
        const dPro = fechaProgPedido;
        let alertaFecha = 0;

        if (dTrx && dPro) {
          if (dTrx.getMonth() !== dPro.getMonth() || dTrx.getFullYear() !== dPro.getFullYear()) {
            alertaFecha = 1;
          }
        }

        // Calcular centro de costo (usamos últimos 6 caracteres)
        const centroCosto = row.NRO_ACTIVO ? String(row.NRO_ACTIVO).slice(-6) : '';

        results.push({
          tipo: row.TIPO,
          planta: row.PLANTA_CALC,
          claseContable: row.CLASE_CONTABLE_ACTIVO,
          numeroOt: row.NUMERO_OT,
          tipoOt: row.TIPO_OT,
          nroActivo: row.NRO_ACTIVO,
          descripcionArticulo: row.DESCRIP_ARTICULO,
          fechaTrx: row.FECHA_TRANSACCION,
          fechaOtPro: dPro, // Usamos la fecha programada de base si existe
          costoTrx: row.COSTO_TRX,
          tipoGasto,
          centroCosto,
          anio: row.ANIO_CALC,
          mes: row.MES_CALC,
          alertaFecha,
          descripcionOt: descPedido,
          estadoTrabajo: estadoPedido,
          esHito: esHitoValue,
          mantenible: row.MANTENIBLE_ACTIVO
        });
      }
      return results;
    });
  },

  clearPresupuesto: async (anio: number) => {
    await withConnection(async (connection) => {
      await connection.execute(
        `DELETE FROM PF_GASTOS_PRESUPUESTO WHERE ANIO = :anio`,
        [anio],
        { autoCommit: true }
      );
    });
  },

  getPresupuesto: async (anio: number, planta?: string, activo?: string, mes?: number): Promise<PresupuestoRow[]> => {
    return await withConnection(async (connection) => {
      const sql = `
                WITH DataPresupuesto AS (
                    SELECT 
                        ACTIVO_COD as "activo", 
                        FRECUENCIA as "frecuencia", 
                        MES as "mes", 
                        ANIO as "anio", 
                        MONTO_BODEGA as "montoBodega", 
                        MONTO_SERV_EXT as "montoServExt", 
                        MONTO_CORRECTIVO as "montoCorrectivo",
                        (
                            SELECT a.clase_contable 
                            FROM PF_EAM_ACTIVOS a 
                            WHERE a.nro_de_activo = ACTIVO_COD
                            AND ROWNUM = 1
                        ) as "claseContable",
                        (
                            SELECT a.mantenible 
                            FROM PF_EAM_ACTIVOS a 
                            WHERE a.nro_de_activo = ACTIVO_COD
                            AND ROWNUM = 1
                        ) as "mantenible",
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
                                WHERE a.nro_de_activo = ACTIVO_COD
                                AND ROWNUM = 1
                            ),
                            CASE 
                                WHEN ACTIVO_COD LIKE '%(1%' THEN 'PF1'
                                WHEN ACTIVO_COD LIKE '%(2%' THEN 'PF2'
                                WHEN ACTIVO_COD LIKE '%(3%' THEN 'PF3'
                                WHEN ACTIVO_COD LIKE '%(4%' THEN 'PF4'
                                WHEN ACTIVO_COD LIKE '%(5%' THEN 'PF5'
                                WHEN ACTIVO_COD LIKE '%(6%' THEN 'PF6'
                                ELSE 'OTROS'
                            END
                        ) as PLANTA_CALC,
                        FRECUENCIA
                    FROM PF_GASTOS_PRESUPUESTO 
                    WHERE ANIO = :anio
                    AND (:activo IS NULL OR ACTIVO_COD = :activo)
                    AND (:mes IS NULL OR MES = :mes)
                )
                SELECT * FROM DataPresupuesto
                WHERE (:plantaFiltro IS NULL OR PLANTA_CALC = :planta)
                ORDER BY "activo", "mes"
            `;

      const result = await connection.execute(sql, {
        anio,
        plantaFiltro: planta || null,
        planta: planta || null,
        activo: activo || null,
        mes: mes || null
      }, { outFormat: 4002 });

      return (result.rows || []).map((row: any) => {
        const activo = row.activo;
        const centroCosto = activo ? String(activo).slice(-6) : '';
        const frecuencia = row.frecuencia;

        return {
          activo,
          centroCosto,
          frecuencia,
          mes: row.mes,
          anio: row.anio,
          montoBodega: row.montoBodega,
          montoServExt: row.montoServExt,
          montoCorrectivo: row.montoCorrectivo,
          claseContable: row.claseContable,
          mantenible: row.mantenible,
        };
      }) as PresupuestoRow[];
    });
  },

  searchAssetsByCentroCosto: async (centroCosto: string): Promise<any[]> => {
    return await withConnection(async (connection) => {
      const sql = `SELECT nro_de_activo, clase_contable, organizacion 
                         FROM PF_EAM_ACTIVOS 
                         WHERE nro_de_activo LIKE :ccPattern and mantenible = 'Si'
                         ORDER BY nro_de_activo`;

      // Buscamos específicamente el código con paréntesis para mayor precisión
      const result = await connection.execute(sql, { ccPattern: `%(${centroCosto})%` });

      return (result.rows || []).map((r: any) => ({
        activo: r.NRO_DE_ACTIVO || r[0],
        claseContable: r.CLASE_CONTABLE || r[1],
        organizacion: r.ORGANIZACION || r[2]
      }));
    });
  },

  updatePresupuestoAssetName: async (oldName: string, newName: string, anio: number): Promise<void> => {
    await withConnection(async (connection) => {
      const sql = `UPDATE PF_GASTOS_PRESUPUESTO 
                         SET ACTIVO_COD = :newName 
                         WHERE ACTIVO_COD = :oldName AND ANIO = :anio`;
      await connection.execute(sql, { oldName, newName, anio }, { autoCommit: true });
    });
  },

  autoFixPresupuestoAssets: async (anio: number): Promise<{ fixed: number, total: number }> => {
    return await withConnection(async (connection) => {
      // 1. Obtener activos del presupuesto que no tienen coincidencia exacta
      const sqlMissing = `
                SELECT DISTINCT ACTIVO_COD 
                FROM PF_GASTOS_PRESUPUESTO 
                WHERE ANIO = :anio 
                AND NOT EXISTS (
                    SELECT 1 FROM PF_EAM_ACTIVOS 
                    WHERE TRIM(UPPER(nro_de_activo)) = TRIM(UPPER(ACTIVO_COD))
                )
            `;
      const resultMissing = await connection.execute(sqlMissing, { anio });
      const missingAssets = (resultMissing.rows || []).map((r: any) => r.ACTIVO_COD || r[0]);

      let fixedCount = 0;

      for (const oldName of missingAssets) {
        const match = String(oldName).match(/\((\d+)\)/);
        if (!match) continue;

        const cc = match[1];

        // 2. Buscar si tiene exactamente una coincidencia mantenible
        const sqlSearch = `
                    SELECT nro_de_activo 
                    FROM PF_EAM_ACTIVOS 
                    WHERE nro_de_activo LIKE :ccPattern AND mantenible = 'Si'
                `;
        const resultSearch = await connection.execute(sqlSearch, { ccPattern: `%(${cc})%` });

        if (resultSearch.rows && resultSearch.rows.length === 1) {
          const newName = resultSearch.rows[0].NRO_DE_ACTIVO || resultSearch.rows[0][0];

          // 3. Actualizar
          const sqlUpdate = `
                        UPDATE PF_GASTOS_PRESUPUESTO 
                        SET ACTIVO_COD = :newName 
                        WHERE ACTIVO_COD = :oldName AND ANIO = :anio
                    `;
          await connection.execute(sqlUpdate, { newName, oldName, anio }, { autoCommit: true });
          fixedCount++;
        }
      }

      return { fixed: fixedCount, total: missingAssets.length };
    });
  },

  saveManualPresupuesto: async (rows: PresupuestoRow[]) => {
    if (rows.length === 0) return;
    const { activo, anio } = rows[0];

    await withConnection(async (connection) => {
      // Borramos lo anterior del mismo activo/año para reemplazo completo desde el modal manual
      await connection.execute(
        `DELETE FROM PF_GASTOS_PRESUPUESTO WHERE ACTIVO_COD = :activo AND ANIO = :anio`,
        { activo, anio }
      );

      const sql = `INSERT INTO PF_GASTOS_PRESUPUESTO 
                (ACTIVO_COD, FRECUENCIA, MES, ANIO, MONTO_BODEGA, MONTO_SERV_EXT, MONTO_CORRECTIVO)
                VALUES (:activo, :frecuencia, :mes, :anio, :montoBodega, :montoServExt, :montoCorrectivo)`;

      const binds = rows.map(r => ({
        activo: r.activo,
        frecuencia: normalizeFrecuencia(r.frecuencia || ''),
        mes: r.mes,
        anio: r.anio,
        montoBodega: r.montoBodega || 0,
        montoServExt: r.montoServExt || 0,
        montoCorrectivo: r.montoCorrectivo || 0,
      }));

      await connection.executeMany(sql, binds, { autoCommit: true });
    });
  },

  getMaintainableAssets: async (search?: string): Promise<any[]> => {
    return await withConnection(async (connection) => {
      let sql = `SELECT nro_de_activo, clase_contable, organizacion 
                       FROM PF_EAM_ACTIVOS 
                       WHERE mantenible = 'Si'`;
      const binds: any = {};
      if (search) {
        sql += ` AND (UPPER(nro_de_activo) LIKE :search OR UPPER(clase_contable) LIKE :search)`;
        binds.search = `%${search.toUpperCase()}%`;
      }
      sql += ` ORDER BY nro_de_activo FETCH FIRST 50 ROWS ONLY`;
      const result = await connection.execute(sql, binds);
      return (result.rows || []).map((r: any) => ({
        activo: r.NRO_DE_ACTIVO || r[0],
        claseContable: r.CLASE_CONTABLE || r[1],
        organizacion: r.ORGANIZACION || r[2]
      }));
    });
  },
}
