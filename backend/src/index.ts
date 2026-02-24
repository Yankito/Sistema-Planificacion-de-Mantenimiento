import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './db/init.js';
import { authMiddleware } from './middleware/auth.js';

// Importación de Rutas
import seguimientoRoutes from './routes/seguimiento.routes.js';
import planificacionRoutes from './routes/planificacion.routes.js';
import fallasRoutes from './routes/fallas.routes.js';
import masivoRoutes from './routes/masivo.routes.js';
import controlGastosRoutes from './routes/control-gastos.routes.js';
import authRoutes from './routes/auth.routes.js';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// --- MIDDLEWARES ---
// CORS configurado para permitir la conexión desde el frontend en la red de Talca
app.use(cors());

// Aumentamos el límite de JSON a 50mb porque los resultados de planificación 
// desde Excel pueden generar objetos muy grandes al guardarlos.
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// --- RUTAS PÚBLICAS (sin autenticación) ---
// Autenticación: login no requiere token
app.use('/api/auth', authRoutes);

// Endpoint de salud del sistema (Healthcheck) - público
app.get('/health', (req, res) => {
    res.json({ status: 'OK', factory: 'PF Alimentos - Talca', timestamp: new Date() });
});

// --- RUTAS PROTEGIDAS (requieren token JWT válido) ---
// Todas las rutas de la API requieren autenticación
app.use('/api/seguimiento', authMiddleware, seguimientoRoutes);
app.use('/api/planificacion', authMiddleware, planificacionRoutes);
app.use('/api/fallas', authMiddleware, fallasRoutes);
app.use('/api/masivo', authMiddleware, masivoRoutes);
app.use('/api/control-gastos', authMiddleware, controlGastosRoutes);


// --- INICIO DEL SERVIDOR ---
const startServer = async () => {
    try {
        // Inicializamos la conexión a Oracle antes de escuchar peticiones
        await initDB();

        app.listen(PORT, () => {
            console.log("---------------------------------------------------");
            console.log(`🚀 SERVIDOR PF ALIMENTOS INICIADO`);
            console.log(`📍 URL: http://localhost:${PORT}`);
            console.log(`📅 FECHA: ${new Date().toLocaleString()}`);
            console.log("---------------------------------------------------");
        });
    } catch (error) {
        console.error("ERROR CRÍTICO AL INICIAR EL SERVIDOR:");
        console.error(error);
        process.exit(1); // Cerramos el proceso si no hay DB
    }
};

startServer();
