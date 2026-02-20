
import type { Request, Response } from 'express';
import XLSX from "xlsx-js-style";
import { ControlGastosRepository, type PresupuestoRow, type GastoConsolidadoRow } from './repository.js';

/**
 * Controlador para la gestión de control de gastos.
 * Maneja la carga de presupuestos y gastos consolidados desde archivos Excel,
 * así como la recuperación de estos datos por año y planta.
 */
export class ControlGastosController {

    /**
     * Procesa la carga de un archivo Excel con el presupuesto anual.
     * Identifica activos, centros de costo y montos por mes (Bodega, Serv. Externos, Correctivo).
     */
    async uploadPresupuesto(req: Request, res: Response) {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ningún archivo' });
        }

        try {
            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            // Se asume que la hoja de interés se llama "MAQUINARIA"
            const sheet = workbook.Sheets["MAQUINARIA"];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as any[][];

            // 1. Identificar la fila donde se encuentran los nombres de los meses
            let monthRowIndex = -1;
            let subHeaderRowIndex = -1;

            for (let i = 0; i < Math.min(20, data.length); i++) {
                const row = data[i];
                if (row && row.some((cell: any) => typeof cell === 'string' && cell.toLowerCase().includes('enero'))) {
                    monthRowIndex = i;
                    break;
                }
            }

            if (monthRowIndex === -1) {
                return res.status(400).json({ error: 'No se encontraron las columnas de meses' });
            }
            subHeaderRowIndex = monthRowIndex + 1;

            // 2. Mapear las columnas a meses y tipos específicos (Bodega, Ext, Correctivo)
            const colMap: Record<number, { month: number, type: 'bod' | 'ext' | 'corr' | 'qty' }> = {};
            const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

            let currentMonth = 0;
            const monthRow = data[monthRowIndex];
            const colToMonth: number[] = [];

            // Identificar qué mes corresponde a cada columna
            for (let c = 0; c < monthRow.length; c++) {
                const val = monthRow[c];
                if (typeof val === 'string') {
                    const mName = val.toLowerCase().trim();
                    const mIdx = months.findIndex(m => mName.includes(m));
                    if (mIdx !== -1) {
                        currentMonth = mIdx + 1;
                    }
                }
                if (currentMonth > 0) colToMonth[c] = currentMonth;
            }

            // 3. Escanear la fila de subencabezados para determinar el tipo de costo (Bodega, Serv. Ext, Correctivo)
            const subRow = data[subHeaderRowIndex];

            if (subRow) {
                for (let c = 0; c < subRow.length; c++) {
                    if (!colToMonth[c]) continue; // Solo mapear si está dentro de un bloque de mes

                    const val = String(subRow[c] || '').toLowerCase();
                    const m = colToMonth[c];

                    if (val.includes('bod')) colMap[c] = { month: m, type: 'bod' };
                    else if (val.includes('serv ext')) colMap[c] = { month: m, type: 'ext' };
                    else if (val.includes('correctivo')) colMap[c] = { month: m, type: 'corr' };
                }
            }

            // 4. Iterar sobre las filas de datos para extraer la información
            const rowsToInsert: PresupuestoRow[] = [];
            let currentAsset = '';
            const year = 2026;

            for (let r = subHeaderRowIndex + 1; r < data.length; r++) {
                const row = data[r];
                if (!row) continue;

                const colA = String(row[0] || '').trim();
                const colAUpper = colA.toUpperCase();

                if (!colA) continue;

                // Omitir filas de totales, resúmenes o diferencias al final del Excel
                if (colAUpper.includes('TOTAL') ||
                    colAUpper.includes('DIFERENCIA') ||
                    colAUpper.includes('PRES 202') ||
                    colAUpper.includes('GASTO 20') ||
                    colAUpper.includes('BASADO EN') ||
                    colAUpper.includes('EQUIPO DE MEJORA') ||
                    colAUpper.includes('ADICIONAL') ||
                    colAUpper === 'MANTENIMIENTO CORRECTIVO') {
                    continue;
                }

                // Detección de Activo: 
                // Debe contener un código entre paréntesis (ej: "(1387)" o "(XXXX)")
                // Pero no debe ser solamente el código (ej: "(1387)") ya que esas son filas de contexto o CC
                const hasCode = colA.match(/\([^)]+\)/);
                const isOnlyCode = colA.match(/^\([^)]+\)$/);

                if (hasCode && !isOnlyCode) {
                    currentAsset = colA;
                    continue;
                }

                // Si ya tenemos un activo identificado y no es una fila de "Sólo Código", 
                // asumimos que es una fila de Frecuencia (ej: "Mensu", "2 Año", "4000 HRS")
                if (currentAsset && !isOnlyCode) {
                    const freq = colA;
                    const monthData: Record<number, { bod: number, ext: number, corr: number }> = {};

                    // Extraer los valores numéricos correspondientes según el mapeo de columnas
                    let hasAnyValue = false;
                    Object.keys(colMap).forEach(k => {
                        const c = Number(k);
                        const mapping = colMap[c];
                        const val = row[c];

                        let num = 0;
                        if (typeof val === 'number') num = val;
                        else if (typeof val === 'string') {
                            const clean = val.replace(/\./g, '').replace(/\$/g, '').replace(/,/g, '.').trim();
                            if (clean && !isNaN(parseFloat(clean))) num = parseFloat(clean);
                        }

                        if (num > 0) {
                            if (!monthData[mapping.month]) monthData[mapping.month] = { bod: 0, ext: 0, corr: 0 };
                            if (mapping.type === 'bod') monthData[mapping.month].bod += num;
                            if (mapping.type === 'ext') monthData[mapping.month].ext += num;
                            if (mapping.type === 'corr') monthData[mapping.month].corr += num;
                            hasAnyValue = true;
                        }
                    });

                    // Si la fila de frecuencia tiene valores, la guardamos
                    if (hasAnyValue) {
                        Object.keys(monthData).forEach(mStr => {
                            const m = Number(mStr);
                            const d = monthData[m];
                            rowsToInsert.push({
                                activo: currentAsset,
                                tipoFila: freq,
                                mes: m,
                                anio: year,
                                montoBodega: d.bod,
                                montoServExt: d.ext,
                                montoCorrectivo: d.corr
                            });
                        });
                    }
                }
            }

            // Limpiar presupuesto previo del mismo año y guardar los nuevos datos
            await ControlGastosRepository.clearPresupuesto(year);
            await ControlGastosRepository.savePresupuesto(rowsToInsert);

            res.json({ success: true, count: rowsToInsert.length });

        } catch (e: any) {
            console.error(e);
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * Procesa la carga de un archivo Excel con gastos consolidados (reales).
     * Mapea las columnas de la hoja de cálculo a los campos de la base de datos.
     */
    async uploadGastosConsolidados(req: Request, res: Response) {
        if (!req.file) {
            return res.status(400).json({ error: 'No se subió ningún archivo' });
        }

        try {
            const workbook = XLSX.read(req.file.buffer, { type: 'buffer', cellDates: true });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];

            const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

            if (!rawData || rawData.length === 0) {
                return res.status(400).json({ error: 'El archivo está vacío' });
            }

            // 1. Identificar la fila de encabezados buscando palabras clave como "NUMERO OT"
            let headerRowIndex = -1;
            for (let i = 0; i < Math.min(20, rawData.length); i++) {
                const row = rawData[i];
                if (row && row.some((cell: any) => {
                    const str = String(cell).toUpperCase().replace(/[\s_]/g, '');
                    return str.includes('NUMEROOT') || str.includes('NROOT');
                })) {
                    headerRowIndex = i;
                    break;
                }
            }

            if (headerRowIndex === -1) headerRowIndex = 0;

            // 2. Crear un mapa de columnas para acceso rápido por nombre
            const headerRow = rawData[headerRowIndex];
            const colMap: Record<string, number> = {};
            headerRow.forEach((cell: any, idx: number) => {
                const key = String(cell).toUpperCase().trim();
                colMap[key] = idx;
            });

            const getVal = (row: any[], keys: string[]) => {
                for (const k of keys) {
                    if (colMap[k] !== undefined) return row[colMap[k]];
                }
                return undefined;
            };

            // Utilidad para parsear fechas de diferentes formatos de Excel
            const parseDate = (val: any): Date | null => {
                if (!val) return null;
                if (val instanceof Date) return val;
                if (typeof val === 'number') return new Date((val - (25567 + 1)) * 86400 * 1000);
                if (typeof val === 'string') {
                    const parts = val.split('/');
                    if (parts.length === 3) {
                        const day = parseInt(parts[0], 10);
                        const month = parseInt(parts[1], 10) - 1;
                        const year = parseInt(parts[2], 10);
                        const d = new Date(year, month, day);
                        return isNaN(d.getTime()) ? null : d;
                    }
                    const d = new Date(val);
                    return isNaN(d.getTime()) ? null : d;
                }
                return null;
            };

            // 3. Iterar sobre las filas de datos y mapear a la estructura de GastoConsolidadoRow
            const rowsToInsert: GastoConsolidadoRow[] = [];

            for (let i = headerRowIndex + 1; i < rawData.length; i++) {
                const row = rawData[i];
                if (!row || row.length === 0) continue;

                const tipo = String(getVal(row, ['TIPO']) || '');
                const numeroOt = String(getVal(row, ['NUMERO_OT']) || '');
                const tipoOt = String(getVal(row, ['TIPO_OT']) || '');
                const nroActivo = String(getVal(row, ['NRO_ACTIVO']) || '');
                const descArticulo = String(getVal(row, ['DESCRIP_ARTICULO']) || '');

                if (!numeroOt && !nroActivo && !tipo) continue;

                const fechaTrx = parseDate(getVal(row, ['FECHA_TRANSACCION']));

                const rawCost = getVal(row, ['COSTO_TRX']);
                let costo = rawCost;

                rowsToInsert.push({
                    tipo: tipo,
                    numeroOt: numeroOt,
                    tipoOt: tipoOt,
                    nroActivo: nroActivo,
                    fechaTrx: fechaTrx,
                    descripcionArticulo: descArticulo,
                    costoTrx: costo || 0
                });
            }

            console.log(`Procesando ${rowsToInsert.length} filas de gastos consolidados.`);
            await ControlGastosRepository.saveGastosConsolidados(rowsToInsert);

            res.json({ success: true, count: rowsToInsert.length });

        } catch (e: any) {
            console.error(e);
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * Recupera los datos del presupuesto para un año y planta específicos.
     */
    async getPresupuesto(req: Request, res: Response) {
        try {
            const anio = Number(req.query.anio);
            const planta = req.query.planta as string;
            const data = await ControlGastosRepository.getPresupuesto(anio, planta);
            res.json(data);
        } catch (e: any) {
            console.error(e);
            res.status(500).json({ error: e.message });
        }
    }

    /**
     * Recupera los gastos consolidados filtrados por año y planta.
     */
    async getGastosConsolidados(req: Request, res: Response) {
        try {
            const anio = Number(req.query.anio) || 2026;
            const planta = req.query.planta as string;
            const data = await ControlGastosRepository.getGastosConsolidados(anio, planta);
            res.json(data);
        } catch (e: any) {
            console.error(e);
            res.status(500).json({ error: e.message });
        }
    }
}
