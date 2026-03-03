import type { Request, Response } from 'express';
import { SeguimientoRepository } from './repository.js';
import { analyzeBacklogFlow } from './logic/backlogAnalysis.js';
import { analyzeTechnicians } from './logic/technicianAnalysis.js';
import { generarExcelReporte } from './utils/exportUtils.js';
import * as TemplateGenerator from './logic/templateGenerator.js';
import type { OrdenTrabajo } from '../../shared/types/index.js';

/**
 * Controlador del módulo de Seguimiento.
 * Expone endpoints para consultar órdenes de trabajo, estadísticas de backlog
 * y descargar reportes Excel con análisis de atrasos o OTs cumplidas.
 */
export const SeguimientoController = {

  /**
   * GET /api/seguimiento/pedidos
   * Retorna las OTs filtradas por rango de fechas y las plantas autorizadas del usuario.
   * Requiere query params: fechaInicio y fechaFin (formato YYYY-MM-DD).
   */
  getPedidos: async (req: Request, res: Response) => {
    try {
      const { fechaInicio, fechaFin } = req.query;

      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({ error: "Parámetros fechaInicio y fechaFin son obligatorios (formato YYYY-MM-DD)" });
      }

      // Las plantas autorizadas del usuario vienen del token JWT (validado por authMiddleware)
      const plantasUsuario = req.authUser?.plantas || [];

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

  /**
   * GET /api/seguimiento/stats
   * Retorna estadísticas de backlog (flujo de OTs) y métricas de técnicos.
   * Usa los mismos datos de getPedidos para calcular ambos análisis sin consultas adicionales.
   */
  getDashboardStats: async (req: Request, res: Response) => {
    try {
      const { fechaInicio, fechaFin } = req.query;
      const start = (fechaInicio as string) || "2024-01-01";
      const end = (fechaFin as string) || new Date().toISOString().split('T')[0];

      const plantasUsuario = req.authUser?.plantas || [];

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

  /**
   * GET /api/seguimiento/datos
   * Endpoint unificado que retorna pedidos + estadísticas en una única consulta a Oracle.
   * Optimizado para reducir round-trips al realizar un solo SELECT y computar el análisis en memoria.
   * Requiere query params: fechaInicio y fechaFin (formato YYYY-MM-DD).
   */
  getDatos: async (req: Request, res: Response) => {
    try {
      const { fechaInicio, fechaFin } = req.query;

      if (!fechaInicio || !fechaFin) {
        return res.status(400).json({ error: "Parámetros fechaInicio y fechaFin son obligatorios" });
      }

      const plantasUsuario = req.authUser?.plantas || [];

      const pedidos = await SeguimientoRepository.getPedidos(
        fechaInicio as string,
        fechaFin as string,
        plantasUsuario
      );

      // Calcular estadísticas sobre los datos ya cargados (sin nueva consulta a Oracle)
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

  /**
   * GET /api/seguimiento/reporte
   * Genera y descarga un archivo Excel con el reporte de atrasos o OTs cumplidas.
   * El modo define qué OTs se incluyen: 'ATRASOS' (no finalizadas) o 'CUMPLIDAS' (finalizadas).
   * Requiere query params: fechaInicio, fechaFin, semana, modo.
   * Opcionalmente acepta semanaAnt para comparar con una semana anterior.
   */
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

  /**
   * GET /api/seguimiento/plantilla/:tipo
   * Descarga un archivo Excel vacío con el formato de carga para el tipo especificado.
   * El tipo se pasa como parámetro de ruta (ej: 'PLAN', 'FALLAS', 'MASIVO_EAM', 'HORARIOS_EAM').
   */
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