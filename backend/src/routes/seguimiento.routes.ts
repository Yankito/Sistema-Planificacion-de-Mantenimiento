import { Router } from 'express';
import multer from 'multer';
import { SeguimientoController } from '../modules/seguimiento/controller.js';

const router = Router();
const upload = multer();

router.get('/semanas', SeguimientoController.getSemanas);
router.get('/pedidos', SeguimientoController.getPedidos);
router.get('/dashboard-stats/:actual/:anterior', SeguimientoController.getDashboardStats);
router.get('/descargar-reporte', SeguimientoController.descargarReporte);
router.get('/plantilla/:tipo', SeguimientoController.descargarPlantilla);

export default router;