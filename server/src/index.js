import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv'
import connectDB from './config/db.js'
import rutasDelProyecto from './routes/index.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: process.env.CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

app.use(express.json());
app.use(cors(corsOptions));

app.get('/', (req, res) => {
    res.json({ message: 'Servidor funcionando' });
});

app.use('/api', rutasDelProyecto);

connectDB();

app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});

export default app