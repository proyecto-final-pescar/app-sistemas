import dotenv from 'dotenv'
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js'
import routes from './routes/index.js'

const app = express();
const PORT = process.env.PORT || 3000;

const corsOptions = {
  origin: process.env.CLIENT_URL,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}

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

export default app