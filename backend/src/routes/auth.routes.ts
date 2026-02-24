// Rutas de Autenticación
import { Router } from 'express';
import { AuthController } from '../modules/auth/controller.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login - Iniciar sesión (PÚBLICA - no requiere token)
router.post('/login', AuthController.login);

// GET /api/auth/verify - Verificar token vigente (PROTEGIDA)
router.get('/verify', authMiddleware, AuthController.verify);

// GET /api/auth/indicadores - Indicadores generales del dashboard (PROTEGIDA)
router.get('/indicadores', authMiddleware, AuthController.getIndicadores);

export default router;
