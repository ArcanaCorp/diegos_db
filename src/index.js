import express from 'express';
import http from 'http';
import cors from 'cors';
import { PORT } from './config.js';
import routes from './routes/index.routes.js';
import socketLoader from "./sockets/index.js";

// ========================================
// 🔧 Configuración base del servidor
// ========================================
const app = express();
const server = http.createServer(app);

// ========================================
// 🌐 Configuración de CORS
// ========================================
const allowedOrigins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://192.168.18.12:3000",
    "https://andaleya.pe",
    "https://merchants.andaleya.pe",
    "https://andale.ttutis.com"
];

app.use(cors({
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 200,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const io = socketLoader(server, allowedOrigins);

// ========================================
// 🧩 Registro dinámico de rutas
// ========================================
app.use('/api/v1', routes);

// ========================================
// ⚠️ Manejo global de errores
// ========================================
app.use((err, req, res, next) => {
    console.error('❌ Error no controlado:', err);
    res.status(500).json({
        ok: false,
        message: 'Error interno del servidor',
        error: err.message
    });
});


// ========================================
// 🚀 Inicio del servidor
// ========================================
server.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en: http://localhost:${PORT}`);
});

export { io };
export default app;