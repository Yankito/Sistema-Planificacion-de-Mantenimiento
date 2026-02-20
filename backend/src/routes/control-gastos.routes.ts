
import { Router } from 'express';
import { ControlGastosController } from '../modules/control-gastos/controller.js';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });
const controller = new ControlGastosController();

router.post('/upload-presupuesto', upload.single('file'), (req, res) => controller.uploadPresupuesto(req, res));
router.post('/upload-gastos', upload.single('file'), (req, res) => controller.uploadGastosConsolidados(req, res));
router.get('/presupuesto', (req, res) => controller.getPresupuesto(req, res));
router.get('/gastos-consolidados', (req, res) => controller.getGastosConsolidados(req, res));

export default router;
