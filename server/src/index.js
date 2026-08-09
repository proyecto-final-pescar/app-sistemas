import "dotenv/config";

import express from "express";
import cors from "cors";

import fichaMedicaRoutes from './routes/fichaMedica.routes.js'
import connectDB from "./config/db.js";
import routes from "./routes/index.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import { iniciarJobsTurnos } from "./jobs/turnoJobs.js";
import turnosAdminRoutes from './routes/turnosAdmin.routes.js';

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = new Set([
  ...(process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  "http://localhost:5173",
  "http://127.0.0.1:5173",
]);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Origen no permitido por CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.use(express.json());

app.use('/api/turnos/admin', turnosAdminRoutes);

app.use("/api", routes);
app.use("/api/upload", uploadRoutes);


connectDB();

app.get("/", (req, res) => {
  res.json({ message: "Servidor funcionando" });
});

iniciarJobsTurnos();

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

export default app;