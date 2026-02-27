import { Router } from 'express';
import multer from 'multer';
import { MassiveController } from '../modules/masivo/controller.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 1
  }
});

router.post('/upload', upload.single('file'), MassiveController.uploadMassive);
// Ruta para descargar plantilla EAM
router.get('/template/eam', MassiveController.descargarPlantillaEAM);
// Ruta para descargar plantilla Horarios
router.get('/template/horarios', MassiveController.descargarPlantillaHorarios);

export default router;
