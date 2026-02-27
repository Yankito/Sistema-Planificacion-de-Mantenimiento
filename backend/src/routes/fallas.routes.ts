import { Router } from 'express';
import { FallasController } from '../modules/fallas/controller.js';

const router = Router();

router.get('/', FallasController.listarFallas);

export default router;
