import { Router } from 'express';
import multer from 'multer';
import { FallasController } from '../modules/fallas/controller.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', FallasController.listarFallas);

export default router;
