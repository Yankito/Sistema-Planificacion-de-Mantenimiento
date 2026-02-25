import { Router } from 'express';
import multer from 'multer';
import { SeguimientoController } from '../modules/seguimiento/controller.js';

const router = Router();
const upload = multer();

router.get('/datos', SeguimientoController.getDatos);           // ← unificado: pedidos + stats en 1 query
router.get('/pedidos', SeguimientoController.getPedidos);       // ← conservado para compatibilidad
router.get('/dashboard-stats/:actual/:anterior', SeguimientoController.getDashboardStats);
router.get('/descargar-reporte', SeguimientoController.descargarReporte);
router.get('/plantilla/:tipo', SeguimientoController.descargarPlantilla);

export default router;