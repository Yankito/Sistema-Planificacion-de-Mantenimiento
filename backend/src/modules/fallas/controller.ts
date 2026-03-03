import type { Request, Response } from 'express';
import { FallasRepository } from './repository.js';
import { processFallasDataFromDB } from './logic/fallasProcessor.js';

/**
 * Controlador del módulo de Fallas.
 * Proporciona el endpoint para listar registros de MTBF/MTTR filtrados opcionalmente por semana.
 */
export const FallasController = {

    /**
     * GET /api/fallas
     * Obtiene todos los registros de fallas desde la base de datos y calcula los campos
     * derivados (semana, mes, año) que no se almacenan en Oracle.
     * Opcionalmente filtra por el número de semana ISO si se pasa el query param ?semana=N.
     */
    listarFallas: async (req: Request, res: Response) => {
        try {
            const { semana } = req.query;

            // Obtener todos los registros de fallas (la tabla no almacena la semana, se calcula en runtime)
            const data = await FallasRepository.getFallas();

            // Enriquecer los datos con semana, mes y año calculados desde la fecha
            let processedData = processFallasDataFromDB(data);

            if (semana) {
                processedData = processedData.filter(f => String(f.semana) === String(semana));
            }

            res.json(processedData);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Error desconocido";
            res.status(500).json({ error: message });
        }
    }
};
