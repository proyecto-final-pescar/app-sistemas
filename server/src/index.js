import dotenv from 'dotenv'
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js'
import routes from './routes/index.js'
import uploadRoutes from './routes/uploadRoutes.js'

const app = express();
const PORT = process.env.PORT || 3000;
/*
const corsOptions = {
    origin: process.env.CLIENT_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}*/
/*modificacion hecha para que pueda usar el localhost*/
const corsOptions = {
  origin: (origin, callback) => {
    const allowed = (process.env.CLIENT_URL || "").split(",").map(o => o.trim());
    if (!origin || allowed.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};


app.use(express.json());
app.use(cors(corsOptions));

app.use('/api', routes);
connectDB();

app.get('/', (req, res) => {
    res.json({ message: 'Servidor funcionando' });
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});

app.use('/api/upload', uploadRoutes)

/*import verifyToken from './middleware/auth.js';*/

/*Ruta temporal de prueba  middleware
app.get('/test-auth', verifyToken, (req, res) => {
    res.json({
        mensaje: 'Token válido',
        usuario: req.user
    });
});*/
export default app