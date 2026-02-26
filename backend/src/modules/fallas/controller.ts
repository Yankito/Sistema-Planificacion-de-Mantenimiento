import type { Request, Response } from 'express';
import { FallasRepository } from './repository.js';
import { processFallasDataFromDB } from './logic/fallasProcessor.js';

export const FallasController = {

    listarFallas: async (req: Request, res: Response) => {
        try {
            const { semana } = req.query;
            let data;
            // The DB no longer stores 'semana', so getFallasBySemana returns everything 
            // and we rely on the logic layer to filter if 'semana' is provided.
            data = await FallasRepository.getFallas();

            // Calculate anio, mes, semana which are not in the database
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
