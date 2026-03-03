import type { Request, Response } from 'express';
import XLSX from "xlsx-js-style";
import { ControlGastosRepository } from './repository.js';
import type { PresupuestoRow, GastoConsolidadoRow } from '../../shared/types/index.js';

/**
 * Controlador para la gestión de control de gastos.
 * Maneja la carga de presupuestos y gastos consolidados desde archivos Excel,
 * así como la recuperación de estos datos por año y planta.
 */
export class ControlGastosController {

  /**
   * Busca el índice de la fila que contiene los nombres de los meses (ej: 'enero', 'febrero').
   * Escanea solo las primeras 20 filas para acotar la búsqueda.
   * Retorna -1 si no se encuentra.
   */
  private findMonthRowIndex(data: unknown[][]): number {
    for (let i = 0; i < Math.min(20, data.length); i++) {
      const row = data[i];
      if (row?.some((cell) => typeof cell === 'string' && cell.toLowerCase().includes('enero'))) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Construye un array de mapeo columna -> número de mes (1-12) a partir de la fila de meses.
   * Permite saber a qué mes pertenece cada columna del Excel de presupuesto.
   */
  private getColToMonthMapping(monthRow: unknown[]): number[] {
    const colToMonth: number[] = [];
    let currentMonth = 0;
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

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
    return colToMonth;
  }

  /**
   * Mapea cada columna a su tipo de gasto específico (Bodega, Serv. Externo, Correctivo)
   * a partir de la fila de subencabezados ubicada justo bajo la fila de meses.
   */
  private getSubHeaderColMap(subRow: unknown[] | undefined, colToMonth: number[]) {
    const colMap: Record<number, { month: number, type: 'bod' | 'ext' | 'corr' | 'qty' }> = {};
    if (!subRow) return colMap;

    for (let c = 0; c < subRow.length; c++) {
      if (!colToMonth[c]) continue; // Solo mapear si está dentro de un bloque de mes

      const val = String(subRow[c] || '').toLowerCase();
      const m = colToMonth[c];

      if (val.includes('bod')) colMap[c] = { month: m, type: 'bod' };
      else if (val.includes('serv ext')) colMap[c] = { month: m, type: 'ext' };
      else if (val.includes('correctivo')) colMap[c] = { month: m, type: 'corr' };
    }
    return colMap;
  }

  /**
   * Determina si una fila debe ser ignorada durante la extracción del presupuesto.
   * Excluye filas de totales, diferencias, encabezados de sección y subtotales.
   */
  private isIgnoredRow(colA: string): boolean {
    const colAUpper = colA.toUpperCase();
    return colAUpper.includes('DIFERENCIA') ||
      colAUpper.includes('PRES 202') ||
      colAUpper.includes('GASTO 20') ||
      colAUpper.includes('BASADO EN') ||
      colAUpper.includes('EQUIPO DE MEJORA') ||
      colAUpper.includes('ADICIONAL') ||
      colAUpper === 'MANTENIMIENTO CORRECTIVO';
  }

  /**
   * Convierte un valor de celda del Excel a número, tolerando formatos con separadores
   * de miles (puntos), signo $ y comas decimales. Retorna 0 si no puede parsear.
   */
  private parseNumericValue(val: unknown): number {
    if (typeof val === 'number') return val;
    if (typeof val === 'string') {
      const clean = val.replace(/\./g, '').replace(/\$/g, '').replace(/,/g, '.').trim();
      if (clean && !Number.isNaN(Number.parseFloat(clean))) {
        return Number.parseFloat(clean);
      }
    }
    return 0;
  }

  /**
   * Extrae los montos por mes y tipo de gasto de una fila de datos del presupuesto.
   * Retorna el mapa de meses con sus cifras y un flag indicando si hay al menos un valor > 0.
   */
  private extractRowValues(row: unknown[], colMap: Record<number, { month: number, type: 'bod' | 'ext' | 'corr' | 'qty' }>) {
    const monthData: Record<number, { bod: number, ext: number, corr: number }> = {};
    let hasAnyValue = false;

    Object.keys(colMap).forEach(k => {
      const c = Number(k);
      const mapping = colMap[c];
      const val = row[c];
      const num = this.parseNumericValue(val);

      if (num > 0) {
        if (!monthData[mapping.month]) monthData[mapping.month] = { bod: 0, ext: 0, corr: 0 };
        if (mapping.type === 'bod') monthData[mapping.month].bod += num;
        if (mapping.type === 'ext') monthData[mapping.month].ext += num;
        if (mapping.type === 'corr') monthData[mapping.month].corr += num;
        hasAnyValue = true;
      }
    });

    return { monthData, hasAnyValue };
  }

  /**
   * Itera sobre las filas de datos del presupuesto a partir del índice dado
   * y construye el array de PresupuestoRow para insertar en la base de datos.
   * Detecta activos por patrón de código entre paréntesis y luego sus frecuencias.
   */
  private processPresupuestoData(
    data: unknown[][],
    startIndex: number,
    colMap: Record<number, { month: number, type: 'bod' | 'ext' | 'corr' | 'qty' }>,
    year: number
  ): PresupuestoRow[] {
    const rowsToInsert: PresupuestoRow[] = [];
    let currentAsset = '';

    for (let r = startIndex; r < data.length; r++) {
      const row = data[r];
      if (!row) continue;

      const colA = String(row[0] || '').trim();
      const colAUpper = colA.toUpperCase();

      // Terminar la lectura si encontramos una celda con "TOTAL"
      if (colAUpper.includes('TOTAL')) break;

      if (!colA || this.isIgnoredRow(colA)) continue;

      // Detección de Activo: 
      const hasCode = /\([A-Z0-9-]{3,10}\)/i.test(colA);
      const isOnlyCode = /^\([^)]+\)$/.test(colA);

      if (hasCode && !isOnlyCode) {
        currentAsset = colA;
        continue;
      }

      // Si ya tenemos un activo identificado y no es una fila de "Sólo Código", 
      // asumimos que es una fila de Frecuencia (ej: "Mensu", "2 Año", "4000 HRS")
      if (currentAsset && !isOnlyCode) {
        const { monthData, hasAnyValue } = this.extractRowValues(row, colMap);

        // Si la fila de frecuencia tiene valores, la guardamos
        if (hasAnyValue) {
          Object.keys(monthData).forEach(mStr => {
            const m = Number(mStr);
            const d = monthData[m];
            rowsToInsert.push({
              activo: currentAsset,
              frecuencia: colA, // colA is freq
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
    return rowsToInsert;
  }

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
      const year = 2026;
      const allRowsToInsert: PresupuestoRow[] = [];

      for (const sheetName of workbook.SheetNames) {
        const upperSheetName = sheetName.toUpperCase();
        if (!upperSheetName.includes('MAQUINARIA') && !upperSheetName.includes('REDES')) {
          continue;
        }

        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as unknown[][];

        // 1. Identificar la fila donde se encuentran los nombres de los meses
        const monthRowIndex = this.findMonthRowIndex(data);
        if (monthRowIndex === -1) {
          console.warn(`No se encontraron las columnas de meses en la hoja: ${sheetName}`);
          continue;
        }

        const subHeaderRowIndex = monthRowIndex + 1;

        // 2. Mapear las columnas a meses y tipos específicos (Bodega, Ext, Correctivo)
        const colToMonth = this.getColToMonthMapping(data[monthRowIndex]);

        // 3. Escanear la fila de subencabezados para determinar el tipo de costo
        const colMap = this.getSubHeaderColMap(data[subHeaderRowIndex], colToMonth);

        // 4. Iterar sobre las filas de datos para extraer la información
        const rowsToInsert = this.processPresupuestoData(data, subHeaderRowIndex + 1, colMap, year);
        allRowsToInsert.push(...rowsToInsert);
      }

      if (allRowsToInsert.length === 0) {
        return res.status(400).json({ error: 'No se encontraron datos de presupuesto válidos en las hojas especificadas' });
      }

      await ControlGastosRepository.savePresupuesto(allRowsToInsert);

      res.json({ success: true, count: allRowsToInsert.length });

    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      res.status(500).json({ error: message });
    }
  }

  /**
   * Convierte un valor de fecha proveniente del Excel de gastos a un objeto Date.
   * Soporta instancias Date, números seriales de Excel y strings DD/MM/YYYY.
   */
  private parseGastosDate(val: unknown): Date | null {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === 'number') return new Date((val - (25567 + 1)) * 86400 * 1000);
    if (typeof val === 'string') {
      const parts = val.split('/');
      if (parts.length === 3) {
        const day = Number.parseInt(parts[0], 10);
        const month = Number.parseInt(parts[1], 10) - 1;
        const year = Number.parseInt(parts[2], 10);
        const d = new Date(year, month, day);
        return Number.isNaN(d.getTime()) ? null : d;
      }
      const d = new Date(val);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
  }

  /**
   * Obtiene el valor de una columna del Excel de gastos usando un conjunto de posibles
   * nombres de cabecera (tolerante a variaciones en el nombre de la columna).
   */
  private getGastosVal(row: unknown[], keys: string[], colMap: Record<string, number>): unknown {
    for (const k of keys) {
      if (colMap[k] !== undefined) return row[colMap[k]];
    }
    return undefined;
  }

  /**
   * Procesa las filas del Excel de gastos consolidados a partir del índice de cabecera.
   * Construye el array de GastoConsolidadoRow para insertar en Oracle.
   * Omite filas sin número de OT, activo ni tipo.
   */
  private processGastosData(rawData: unknown[][]): GastoConsolidadoRow[] {
    const headerRow = rawData[0];
    const colMap: Record<string, number> = {};
    if (headerRow) {
      headerRow.forEach((cell, idx: number) => {
        const key = String(cell).toUpperCase().trim();
        colMap[key] = idx;
      });
    }

    const rowsToInsert: GastoConsolidadoRow[] = [];

    for (let i = 1; i < rawData.length; i++) {
      const row = rawData[i];
      if (!row || row.length === 0) continue;

      const tipo = String(this.getGastosVal(row, ['TIPO'], colMap) || '');
      const numeroOt = String(this.getGastosVal(row, ['NUMERO_OT'], colMap) || '');
      const tipoOt = String(this.getGastosVal(row, ['TIPO_OT'], colMap) || '');
      const nroActivo = String(this.getGastosVal(row, ['NRO_ACTIVO'], colMap) || '');
      const descArticulo = String(this.getGastosVal(row, ['DESCRIP_ARTICULO'], colMap) || '');

      if (!numeroOt && !nroActivo && !tipo) continue;

      const fechaTrx = this.parseGastosDate(this.getGastosVal(row, ['FECHA_TRANSACCION'], colMap));

      const rawCost = this.getGastosVal(row, ['COSTO_TRX'], colMap);
      let costo = rawCost;

      rowsToInsert.push({
        tipo: tipo,
        numeroOt: numeroOt,
        tipoOt: tipoOt,
        nroActivo: nroActivo,
        fechaTrx: fechaTrx,
        descripcionArticulo: descArticulo,
        costoTrx: (costo as number) || 0
      });
    }

    return rowsToInsert;
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

      const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

      if (!rawData || rawData.length === 0) {
        return res.status(400).json({ error: 'El archivo está vacío' });
      }

      const rowsToInsert = this.processGastosData(rawData);

      await ControlGastosRepository.saveGastosConsolidados(rowsToInsert);

      res.json({ success: true, count: rowsToInsert.length });

    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      res.status(500).json({ error: message });
    }
  }

  /**
   * Recupera los datos del presupuesto para un año y planta específicos.
   */
  async getPresupuesto(req: Request, res: Response) {
    try {
      const anio = Number(req.query.anio);
      const planta = req.query.planta as string;
      const activo = req.query.activo as string;
      const mes = req.query.mes ? Number(req.query.mes) : undefined;
      const data = await ControlGastosRepository.getPresupuesto(anio, planta, activo, mes);
      res.json(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      res.status(500).json({ error: message });
    }
  }

  /**
   * Recupera los gastos consolidados filtrados por año y planta.
   */
  async getGastosConsolidados(req: Request, res: Response) {
    try {
      const anio = Number(req.query.anio);
      const planta = req.query.planta as string;
      const mes = req.query.mes ? Number(req.query.mes) : undefined;
      const data = await ControlGastosRepository.getGastosConsolidados(anio, planta, mes);
      res.json(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      res.status(500).json({ error: message });
    }
  }

  /**
   * GET /api/control-gastos/activos?cc=XXXXXX
   * Busca activos mantenibles cuyo código contiene el centro de costo indicado.
   */
  async searchAssetsByCentroCosto(req: Request, res: Response) {
    try {
      const cc = req.query.cc as string;
      if (!cc) return res.status(400).json({ error: 'Centro de costo es requerido' });
      const data = await ControlGastosRepository.searchAssetsByCentroCosto(cc);
      res.json(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      res.status(500).json({ error: message });
    }
  }

  /**
   * PUT /api/control-gastos/activos/rename
   * Renombra el código de activo en el presupuesto de un año (ej: corregir un nombre mal copiado del Excel).
   */
  async updateAssetPresupuesto(req: Request, res: Response) {
    try {
      const { oldName, newName, anio } = req.body;
      if (!oldName || !newName || !anio) return res.status(400).json({ error: 'Faltan parámetros' });
      await ControlGastosRepository.updatePresupuestoAssetName(oldName, newName, anio);
      res.json({ success: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      res.status(500).json({ error: message });
    }
  }

  /**
   * POST /api/control-gastos/activos/auto-fix
   * Intenta corregir automáticamente los códigos de activo del presupuesto que no coinciden
   * exactamente con ningún activo en PF_EAM_ACTIVOS, buscando por centro de costo.
   */
  async autoFixAssets(req: Request, res: Response) {
    try {
      const anio = Number(req.body.anio);
      if (!anio) return res.status(400).json({ error: 'Año es requerido' });
      const result = await ControlGastosRepository.autoFixPresupuestoAssets(anio);
      res.json(result);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      res.status(500).json({ error: message });
    }
  }

  /**
   * GET /api/control-gastos/activos/mantenibles
   * Retorna los activos marcados como mantenibles en EAM, con filtro opcional por nombre o clase.
   */
  async getMaintainableAssets(req: Request, res: Response) {
    try {
      const search = req.query.search as string;
      const data = await ControlGastosRepository.getMaintainableAssets(search);
      res.json(data);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      res.status(500).json({ error: message });
    }
  }

  /**
   * POST /api/control-gastos/presupuesto/manual
   * Guarda o reemplaza el presupuesto ingresado manualmente desde el modal de edición.
   * Elimina el presupuesto previo del mismo activo/año antes de insertar el nuevo.
   */
  async saveManualPresupuesto(req: Request, res: Response) {
    try {
      const { rows } = req.body;
      if (!rows || !Array.isArray(rows) || rows.length === 0) {
        return res.status(400).json({ error: 'Datos de presupuesto requeridos' });
      }
      await ControlGastosRepository.saveManualPresupuesto(rows);
      res.json({ success: true });
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Error desconocido';
      res.status(500).json({ error: message });
    }
  }

}
