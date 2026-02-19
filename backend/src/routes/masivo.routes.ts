import { Router } from 'express';
import multer from 'multer';
import { MassiveController } from '../modules/masivo/controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/upload', upload.single('file'), MassiveController.uploadMassive);
// Ruta para descargar plantilla EAM
router.get('/template/eam', MassiveController.descargarPlantillaEAM);
// Ruta para descargar plantilla Horarios
router.get('/template/horarios', MassiveController.descargarPlantillaHorarios);

export default router;
