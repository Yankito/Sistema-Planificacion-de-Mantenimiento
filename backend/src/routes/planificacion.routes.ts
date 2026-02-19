import { Router } from 'express';
import multer from 'multer';
import { PlanificacionController } from '../modules/planificacion/controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/ejecutar', PlanificacionController.ejecutarPlanificacion);

router.post('/guardar', PlanificacionController.guardarPlanificacion);
router.post('/procesar', upload.single('file'), PlanificacionController.procesarExcel);
router.get('/resultados', PlanificacionController.obtenerPlanificacion);
router.get('/horarios', PlanificacionController.listarHorarios);
router.put('/horarios', PlanificacionController.actualizarTurno);
router.post('/upload-horarios', upload.single('file'), PlanificacionController.uploadHorarios);

export default router;
