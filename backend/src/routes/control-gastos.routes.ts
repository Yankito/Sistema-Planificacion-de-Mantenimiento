
import { Router } from 'express';
import { ControlGastosController } from '../modules/control-gastos/controller.js';
import multer from 'multer';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 15 * 1024 * 1024,
    files: 1
  }
});

const controller = new ControlGastosController();

router.post('/upload-presupuesto', upload.single('file'), (req, res) => controller.uploadPresupuesto(req, res));
router.post('/upload-gastos', upload.single('file'), (req, res) => controller.uploadGastosConsolidados(req, res));
router.get('/presupuesto', (req, res) => controller.getPresupuesto(req, res));
router.get('/gastos-consolidados', (req, res) => controller.getGastosConsolidados(req, res));
router.get('/search-assets-cc', (req, res) => controller.searchAssetsByCentroCosto(req, res));
router.post('/update-asset-name', (req, res) => controller.updateAssetPresupuesto(req, res));
router.post('/auto-fix-assets', (req, res) => controller.autoFixAssets(req, res));
router.get('/maintainable-assets', (req, res) => controller.getMaintainableAssets(req, res));
router.post('/save-manual-presupuesto', (req, res) => controller.saveManualPresupuesto(req, res));

export default router;
