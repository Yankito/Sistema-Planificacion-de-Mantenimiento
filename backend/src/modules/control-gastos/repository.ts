
import { withConnection } from '../../db/config.js';

export interface PresupuestoRow {
    activo: string;
    tipoFila: string;
    mes: number;
    anio: number;
    montoBodega?: number;
    montoServExt?: number;
    montoCorrectivo?: number;
    centroCosto?: string; // Calculado al recuperar
}

export interface GastoConsolidadoRow {
    tipo: string;
    planta: string;
    claseContable: string;
    numeroOt: string;
    tipoOt: string;
    nroActivo: string;
    fechaTrx: Date | string;
    fechaOtPro: Date | string;
    descripcionArticulo: string;
    costoTrx: number;
    alertaFecha?: number;
    // Campos calculados
    centroCosto?: string;
    anio?: number;
    mes?: number;
    tipoGasto?: string; // BODEGA, SERV_EXT, CORRECTIVO
    descripcionOt?: string;
    esHito?: boolean;
}

export const ControlGastosRepository = {
    getDescripcionOTs: async (ots: string[]): Promise<Map<string, string>> => {
        if (ots.length === 0) return new Map();

        const uniqueOts = [...new Set(ots)];
        const map = new Map<string, string>();

        await withConnection(async (connection) => {
            // Process in chunks of 1000 to respect Oracle IN clause limit
            for (let i = 0; i < uniqueOts.length; i += 1000) {
                const chunk = uniqueOts.slice(i, i + 1000);
                const binds: any = {};
                chunk.forEach((ot, idx) => binds[`ot${idx}`] = ot);
                const keys = chunk.map((_, idx) => `:ot${idx}`).join(',');

                const sql = `SELECT PEDIDO_TRABAJO, DESCRIPCION FROM PF_EAM_PEDIDOS WHERE PEDIDO_TRABAJO IN (${keys})`;

                // execute returns result with rows
                const result = await connection.execute(sql, binds);

                (result.rows || []).forEach((r: any) => {
                    const ot = r.PEDIDO_TRABAJO || r[0];
                    const desc = r.DESCRIPCION || r[1];
                    if (ot) map.set(String(ot), desc);
                });
            }
        });
        return map;
    },

    saveGastosConsolidados: async (rows: GastoConsolidadoRow[]) => {
        if (rows.length === 0) return;

        await withConnection(async (connection) => {
            const sql = `INSERT INTO PF_EAM_GASTOS_CONSOLIDADOS 
                (TIPO, PLANTA, CLASE_CONTABLE, NUMERO_OT, TIPO_OT, NRO_ACTIVO, FECHA_OT_PRO, FECHA_TRANSACCION, DESCRIP_ARTICULO, COSTO_TRX)
                VALUES (:tipo, :planta, :claseContable, :numeroOt, :tipoOt, :nroActivo,  :fechaOtPro, :fechaTrx, :descripcionArticulo, :costoTrx)`;

            const binds = rows.map(r => ({
                tipo: r.tipo,
                planta: r.planta,
                claseContable: r.claseContable,
                numeroOt: r.numeroOt,
                tipoOt: r.tipoOt,
                nroActivo: r.nroActivo,
                descripcionArticulo: r.descripcionArticulo?.substring(0, 500) || '',
                fechaTrx: r.fechaTrx,
                fechaOtPro: r.fechaOtPro || null,
                costoTrx: r.costoTrx,
            }));

            const batchSize = 1000;
            for (let i = 0; i < binds.length; i += batchSize) {
                const batch = binds.slice(i, i + batchSize);
                await connection.executeMany(sql, batch, { autoCommit: true });
            }

            console.log(`Inserted ${rows.length} rows into PF_EAM_GASTOS_CONSOLIDADOS`);
        });
    },

    savePresupuesto: async (rows: PresupuestoRow[]) => {
        if (rows.length === 0) return;

        await withConnection(async (connection) => {
            const sql = `INSERT INTO PF_GASTOS_PRESUPUESTO 
                (ACTIVO_COD, TIPO_FILA, MES, ANIO, MONTO_BODEGA, MONTO_SERV_EXT, MONTO_CORRECTIVO)
                VALUES (:activo, :tipoFila, :mes, :anio, :montoBodega, :montoServExt, :montoCorrectivo)`;

            const binds = rows.map(r => ({
                activo: r.activo,
                tipoFila: r.tipoFila,
                mes: r.mes,
                anio: r.anio,
                montoBodega: r.montoBodega || 0,
                montoServExt: r.montoServExt || 0,
                montoCorrectivo: r.montoCorrectivo || 0
            }));

            await connection.executeMany(sql, binds, { autoCommit: true });
            console.log(`Inserted ${rows.length} rows into PF_GASTOS_PRESUPUESTO`);
        });
    },

    getGastosConsolidados: async (anio: number, planta?: string): Promise<GastoConsolidadoRow[]> => {
        return await withConnection(async (connection) => {
            const sql = `
                WITH DataCalculada AS (
                    SELECT 
                        g.TIPO, 
                        g.PLANTA as PLANTA_ORIG, 
                        g.CLASE_CONTABLE, 
                        g.NUMERO_OT, 
                        g.TIPO_OT, 
                        g.NRO_ACTIVO, 
                        g.DESCRIP_ARTICULO, 
                        g.FECHA_TRANSACCION, 
                        g.FECHA_OT_PRO, 
                        g.COSTO_TRX, 
                        EXTRACT(YEAR FROM COALESCE(g.FECHA_OT_PRO, g.FECHA_TRANSACCION)) as ANIO_CALC,
                        EXTRACT(MONTH FROM COALESCE(g.FECHA_OT_PRO, g.FECHA_TRANSACCION)) as MES_CALC,
                        COALESCE(
                            CASE 
                                WHEN UPPER(g.PLANTA) = UPPER('Mantenimiento Planta I') THEN 'PF1'
                                WHEN UPPER(g.PLANTA) = UPPER('Mantenimiento Planta II') THEN 'PF2'
                                WHEN UPPER(g.PLANTA) = UPPER('Mantenimiento Centro de Distribucion Santiago') THEN 'MPS'
                                ELSE NULL
                            END,
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
                                END
                                FROM PF_EAM_ACTIVOS a 
                                WHERE TRIM(UPPER(a.nro_de_activo)) = TRIM(UPPER(g.NRO_ACTIVO)) AND ROWNUM = 1
                            ),
                            g.PLANTA,
                            'OTROS'
                        ) as PLANTA_CALC
                    FROM PF_EAM_GASTOS_CONSOLIDADOS g
                    WHERE EXTRACT(YEAR FROM g.FECHA_OT_PRO) = :anio
                )
                SELECT * FROM DataCalculada
                WHERE (:plantaFiltro IS NULL OR PLANTA_CALC = :planta)
            `;

            const result = await connection.execute(sql, { anio, plantaFiltro: planta || null, planta: planta || null }, { outFormat: 4002 });
            const rows = result.rows || [];

            // Obtener descripciones de OT para clasificación
            const otNumbers = rows.map((r: any) => r.NUMERO_OT).filter(Boolean);
            const otDescriptions = await ControlGastosRepository.getDescripcionOTs(otNumbers);

            const results: GastoConsolidadoRow[] = [];

            for (const row of rows) {
                const tipo = String(row.TIPO || '').toUpperCase().trim();
                const tipoOt = String(row.TIPO_OT || '').trim();
                const descPedido = (otDescriptions.get(row.NUMERO_OT) || '').toUpperCase().trim();

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

                // Si no coincide con ninguna categoria, lo salta
                if (!tipoGasto) continue;

                // Alerta de fecha incorrecta
                const dTrx = row.FECHA_TRANSACCION ? new Date(row.FECHA_TRANSACCION) : null;
                const dPro = row.FECHA_OT_PRO ? new Date(row.FECHA_OT_PRO) : null;
                let alertaFecha = 0;

                if (dTrx && dPro) {
                    if (dTrx.getMonth() !== dPro.getMonth() || dTrx.getFullYear() !== dPro.getFullYear()) {
                        alertaFecha = 1;
                    }
                }

                // Calcular centro de costo (ultimos 6 caracteres)
                const centroCosto = row.NRO_ACTIVO ? String(row.NRO_ACTIVO).slice(-6) : '';
                if (row.NRO_ACTIVO == "PF (M) Horno Alkar (0723)") {
                    console.log(row);
                }
                results.push({
                    tipo: row.TIPO,
                    planta: row.PLANTA_CALC,
                    claseContable: row.CLASE_CONTABLE,
                    numeroOt: row.NUMERO_OT,
                    tipoOt: row.TIPO_OT,
                    nroActivo: row.NRO_ACTIVO,
                    descripcionArticulo: row.DESCRIP_ARTICULO,
                    fechaTrx: row.FECHA_TRANSACCION,
                    fechaOtPro: row.FECHA_OT_PRO,
                    costoTrx: row.COSTO_TRX,
                    tipoGasto,
                    centroCosto,
                    anio: row.ANIO_CALC,
                    mes: row.MES_CALC,
                    alertaFecha,
                    descripcionOt: descPedido,
                    esHito: esHitoValue
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

    getPresupuesto: async (anio: number, planta?: string): Promise<PresupuestoRow[]> => {
        return await withConnection(async (connection) => {
            const sql = `
                WITH DataPresupuesto AS (
                    SELECT 
                        ACTIVO_COD as "activo", 
                        TIPO_FILA as "tipoFila", 
                        MES as "mes", 
                        ANIO as "anio", 
                        MONTO_BODEGA as "montoBodega", 
                        MONTO_SERV_EXT as "montoServExt", 
                        MONTO_CORRECTIVO as "montoCorrectivo",
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
                                END
                                FROM PF_EAM_ACTIVOS a 
                                WHERE TRIM(UPPER(a.nro_de_activo)) = TRIM(UPPER(ACTIVO_COD))
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
                        ) as PLANTA_CALC
                    FROM PF_GASTOS_PRESUPUESTO 
                    WHERE ANIO = :anio
                )
                SELECT * FROM DataPresupuesto
                WHERE (:plantaFiltro IS NULL OR PLANTA_CALC = :planta)
                ORDER BY "activo", "mes"
            `;

            const result = await connection.execute(sql, { anio, plantaFiltro: planta || null, planta: planta || null }, { outFormat: 4002 });

            return (result.rows || []).map((row: any) => {
                const activo = row.activo || row.ACTIVO;
                // Intentamos extraer el código entre del final del nombre
                const match = String(activo || '').match(/\(([^)]+)\)$/);
                const centroCosto = match ? match[1] : '';

                return {
                    activo,
                    centroCosto,
                    tipoFila: row.tipoFila || row.TIPOFILA,
                    mes: row.mes || row.MES,
                    anio: row.anio || row.ANIO,
                    montoBodega: row.montoBodega || row.MONTOBODEGA,
                    montoServExt: row.montoServExt || row.MONTOSERVEXT,
                    montoCorrectivo: row.montoCorrectivo || row.MONTOCORRECTIVO
                };
            }) as PresupuestoRow[];
        });
    }
}
