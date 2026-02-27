import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { initDB } from './db/init.js';
import { authMiddleware, plantaMiddleware } from './middleware/auth.js';

// Importación de Rutas
import seguimientoRoutes from './routes/seguimiento.routes.js';
import planificacionRoutes from './routes/planificacion.routes.js';
import fallasRoutes from './routes/fallas.routes.js';
import masivoRoutes from './routes/masivo.routes.js';
import controlGastosRoutes from './routes/control-gastos.routes.js';
import authRoutes from './routes/auth.routes.js';


dotenv.config();

const app = express();
app.disable('x-powered-by');

const PORT = process.env.PORT || 3001;

// --- MIDDLEWARES ---
// CORS configurado para permitir la conexión desde el frontend en la red de Talca
// Definimos los orígenes permitidos (Whitelist)
const whitelist = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : [];

const corsOptions: cors.CorsOptions = {
    origin: (origin, callback) => {
        if (whitelist.includes(origin)) {
            callback(null, true);
        } else {
            console.warn(`[CORS Blocked]: Petición desde origen no autorizado: ${origin}`);
            callback(new Error('No permitido por CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

// Aplicamos el middleware con opciones
app.use(cors(corsOptions));

// --- SEGURIDAD OWASP ---
// 1. Protección de Cabeceras HTTP (Mitigación XSS, Clickjacking, MIME sniffing)
app.use(helmet());

// 2. Límite de peticiones Globales (Prevención DDoS)
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Demasiadas peticiones desde esta IP, por favor intente más tarde.',
    standardHeaders: true,
    legacyHeaders: false,
});
app.use('/api', globalLimiter);

// 3. Límite estricto para inicio de sesión (Anti-Fuerza Bruta)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10, // Máximo 10 intentos de login cada 15 min
    message: 'Demasiados intentos de inicio de sesión. Cuenta bloqueada temporalmente.'
});
app.use('/api/auth/login', authLimiter);

// --- MIDDLEWARES DE CARGA ---
// Se mantiene un límite alto (50mb) debido al volumen de datos en planificaciones masivas (arrays JSON gigantes). 
// OWASP Alert: Puede ser susceptible a DoS si un payload maligno satura la memoria.
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
app.use('/api/planificacion', authMiddleware, plantaMiddleware, planificacionRoutes);
app.use('/api/fallas', authMiddleware, fallasRoutes);
app.use('/api/masivo', authMiddleware, masivoRoutes);
app.use('/api/control-gastos', authMiddleware, plantaMiddleware, controlGastosRoutes);


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
