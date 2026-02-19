import XLSX from "xlsx-js-style";
import { SeguimientoRepository } from './repository.js';
import { processSeguimientoOTs } from './logic/seguimientoOTsProcessor.js';
import { analyzeBacklogFlow } from './logic/backlogAnalysis.js';
import { analyzeTechnicians } from './logic/technicianAnalysis.js';
import { generarExcelReporte } from './utils/exportUtils.js';
import * as TemplateGenerator from './logic/templateGenerator.js';

export const SeguimientoController = {

  getSemanas: async (req: any, res: any) => {
    try {
      const { tipo } = req.query;
      const semanas = await SeguimientoRepository.getSemanas(tipo as string);
      res.json(semanas);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  getPedidos: async (req: any, res: any) => {
    try {
      const data = await SeguimientoRepository.getPedidos();
      res.json(data);
    } catch (error: any) {
      console.error("Error en /pedidos:", error);
      res.status(500).json({ error: error.message });
    }
  },

  getDashboardStats: async (req: any, res: any) => {
    try {
      const { actual, anterior } = req.params;

      // 1. Recuperamos los datos de PostgreSQL
      // Nota: Actualmente getPedidos devuelve los datos actuales.
      // Si se implementa histórico, se deberían usar los parámetros 'actual' y 'anterior'.
      const [dataActual, dataAnterior] = await Promise.all([
        SeguimientoRepository.getPedidos(),
        SeguimientoRepository.getPedidos() // TODO: Implementar getPedidos histórico si es necesario
      ]);

      // 2. Ejecutamos la lógica de análisis en el servidor
      const flowStats = analyzeBacklogFlow(dataActual, dataAnterior);
      const techStats = analyzeTechnicians(dataActual, []);

      // 3. Enviamos el "paquete" de analítica listo
      res.json({
        flowStats,
        techStats,
        metadata: {
          totalActual: dataActual.length,
          totalAnterior: dataAnterior.length
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  descargarReporte: async (req: any, res: any) => {
    try {
      const { semana, modo, semanaAnt } = req.query;

      // 1. Obtener datos desde Postgres
      const dataActual = await SeguimientoRepository.getPedidos();

      let dataAnterior: any[] = [];
      if (semanaAnt) {
        dataAnterior = await SeguimientoRepository.getPedidos();
      }

      // 2. Generar el Buffer del Excel
      const reporte = await generarExcelReporte(
        dataActual,
        dataAnterior,
        modo as "ATRASOS" | "CUMPLIDAS",
        String(semana)
      );

      // 3. Enviar al cliente
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${reporte.fileName}`);
      res.send(reporte.buffer);

    } catch (error: any) {
      console.error("Error descarga:", error);
      res.status(500).json({ error: error.message });
    }
  },

  descargarPlantilla: async (req: any, res: any) => {
    try {
      const { tipo } = req.params;
      const excelData = TemplateGenerator.generarBufferPlantilla(tipo.toUpperCase());

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Plantilla_${tipo}.xlsx`);
      res.send(excelData);

    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
};