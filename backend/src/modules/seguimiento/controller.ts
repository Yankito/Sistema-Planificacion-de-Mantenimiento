import type { Request, Response } from 'express';
import XLSX from "xlsx-js-style";
import { SeguimientoRepository } from './repository.js';
import { processSeguimientoOTs } from './logic/seguimientoOTsProcessor.js';
import { analyzeBacklogFlow } from './logic/backlogAnalysis.js';
import { analyzeTechnicians } from './logic/technicianAnalysis.js';
import { generarExcelReporte } from './utils/exportUtils.js';
import * as TemplateGenerator from './logic/templateGenerator.js';
import type { OrdenTrabajo } from '../../types.js';

export const SeguimientoController = {

  getSemanas: async (req: Request, res: Response) => {
    try {
      const { tipo } = req.query;
      const semanas = await SeguimientoRepository.getSemanas(tipo as string);
      console.log(semanas);
      res.json(semanas);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ error: message });
    }
  },

  getPedidos: async (req: Request, res: Response) => {
    try {
      const { fechaInicio, fechaFin } = req.query;

      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({ error: "Parámetros fechaInicio y fechaFin son obligatorios (formato YYYY-MM-DD)" });
      }

      // Plantas autorizadas del usuario (desde el JWT, ya validado por authMiddleware)
      const plantasUsuario = req.authUser?.plantas || [];
      console.log(`[Seguimiento] getPedidos: ${fechaInicio} -> ${fechaFin} | plantas: [${plantasUsuario.join(', ')}]`);

      const data = await SeguimientoRepository.getPedidos(
        fechaInicio as string,
        fechaFin as string,
        plantasUsuario
      );
      res.json(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      console.error("Error en /pedidos:", message);
      res.status(500).json({ error: message });
    }
  },

  getDashboardStats: async (req: Request, res: Response) => {
    try {
      const { fechaInicio, fechaFin } = req.query;
      const start = (fechaInicio as string) || "2024-01-01";
      const end = (fechaFin as string) || new Date().toISOString().split('T')[0];

      const plantasUsuario = req.authUser?.plantas || [];

      // Una sola consulta: reutilizamos los mismos datos para actial y anterior
      const data = await SeguimientoRepository.getPedidos(start, end, plantasUsuario);

      const flowStats = analyzeBacklogFlow(data, data);
      const techStats = analyzeTechnicians(data, []);

      res.json({
        flowStats,
        techStats,
        metadata: {
          totalActual: data.length,
          totalAnterior: data.length
        }
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ error: message });
    }
  },

  // Endpoint unificado: retorna pedidos + stats en UNA sola consulta a Oracle
  getDatos: async (req: Request, res: Response) => {
    try {
      const { fechaInicio, fechaFin } = req.query;

      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({ error: "Parámetros fechaInicio y fechaFin son obligatorios" });
      }

      const plantasUsuario = req.authUser?.plantas || [];
      console.log(`[Seguimiento] getDatos: ${fechaInicio} -> ${fechaFin} | plantas: [${plantasUsuario.join(', ')}]`);

      // UNA sola consulta a Oracle para todo
      const pedidos = await SeguimientoRepository.getPedidos(
        fechaInicio as string,
        fechaFin as string,
        plantasUsuario
      );

      // Computamos las estadísticas sobre los datos ya cargados (sin nueva query)
      const flowStats = analyzeBacklogFlow(pedidos, pedidos);
      const techStats = analyzeTechnicians(pedidos, []);

      res.json({
        pedidos,
        flowStats,
        techStats
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      console.error("Error en /datos:", message);
      res.status(500).json({ error: message });
    }
  },

  descargarReporte: async (req: Request, res: Response) => {
    try {
      const { semana, modo, semanaAnt, fechaInicio, fechaFin } = req.query;
      const start = (fechaInicio as string);
      const end = (fechaFin as string);

      const plantasUsuario = req.authUser?.plantas || [];

      const dataActual = await SeguimientoRepository.getPedidos(start, end, plantasUsuario);

      let dataAnterior: OrdenTrabajo[] = [];
      if (semanaAnt) {
        dataAnterior = await SeguimientoRepository.getPedidos(start, end, plantasUsuario);
      }

      const reporte = await generarExcelReporte(
        dataActual,
        dataAnterior,
        modo as "ATRASOS" | "CUMPLIDAS",
        String(semana)
      );

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${reporte.fileName}`);
      res.send(reporte.buffer);

    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      console.error("Error descarga:", message);
      res.status(500).json({ error: message });
    }
  },

  descargarPlantilla: async (req: Request, res: Response) => {
    try {
      const { tipo } = req.params;
      const excelData = TemplateGenerator.generarBufferPlantilla((tipo as string).toUpperCase());

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=Plantilla_${tipo}.xlsx`);
      res.send(excelData);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Error desconocido';
      res.status(500).json({ error: message });
    }
  }
};