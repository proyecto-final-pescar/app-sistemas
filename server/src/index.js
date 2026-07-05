import dotenv from 'dotenv'
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js'
import routes from './routes/index.js'
import uploadRoutes from './routes/uploadRoutes.js'
import rutasTurnos from './routes/rutasTurnos.js';
import { iniciarJobsTurnos } from './jobs/turnoJobs.js';

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api', routes);
app.use('/api/upload', uploadRoutes)
connectDB();
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});

app.get('/', (req, res) => {
    res.json({ message: 'Servidor funcionando' });
});

app.use('/api', rutasTurnos);

iniciarJobsTurnos(); // arranca el cron de liberación automática

/*import verifyToken from './middleware/auth.js';*/

/*Ruta temporal de prueba  middleware
app.get('/test-auth', verifyToken, (req, res) => {
    res.json({
        mensaje: 'Token válido',
        usuario: req.user
    });
});*/
export default app