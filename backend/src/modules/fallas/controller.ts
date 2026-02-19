import XLSX from "xlsx-js-style";
import { processFallasData } from './logic/fallasProcessor.js';
import { FallasRepository } from './repository.js';

export const FallasController = {

    uploadFallas: async (req: any, res: any) => {
        try {
            if (!req.file) return res.status(400).json({ error: "Archivo Excel requerido" });

            const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
            const data = processFallasData(workbook.Sheets);

            if (data.length === 0) {
                return res.status(400).json({ error: "No se encontraron datos válidos o la hoja 'Detalle MTBF MTTR' no existe." });
            }

            // Asumimos que la semana se puede derivar del primer registro o se pasa por body
            // Para consistencia, usaremos la semana del primer registro si no se envía
            let semanaStr = req.body.semana;
            if (!semanaStr && data.length > 0) {
                // Construir string de semana, ej: "2024-W10"
                // Pero el sistema usa snapshots con semana.
                // En planificacion/repository usa semana como string.
                // En fallasProcessor: semana es number.
                // Asumiremos que el usuario debe enviar la semana o la calculamos.
                // Por simplicidad, usemos el año y semana del primer registro.
                const first = data[0];
                const weekPad = String(first.semana).padStart(2, '0');
                semanaStr = `${first.anio}-S${weekPad}`;
            }


            if (!semanaStr) {
                return res.status(400).json({ error: "No se pudo determinar la semana. Envíela en el body." });
            }

            await FallasRepository.guardarFallas(semanaStr, data);

            res.json({
                message: "Datos de fallas cargados exitosamente",
                count: data.length,
                semana: semanaStr
            });

        } catch (error: any) {
            console.error("Error cargando fallas:", error);
            res.status(500).json({ error: error.message });
        }
    },

    listarFallas: async (req: any, res: any) => {
        try {
            const { semana } = req.query;
            let data;
            if (semana) {
                data = await FallasRepository.getFallasBySemana(String(semana));
            } else {
                data = await FallasRepository.getFallas();
            }
            res.json(data);
        } catch (error: any) {
            res.status(500).json({ error: error.message });
        }
    }
};
