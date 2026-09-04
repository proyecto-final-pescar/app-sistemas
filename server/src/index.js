import "dotenv/config";

import express from "express";
import cors from "cors";

import connectDB from "./config/db.js";
import routes from "./routes/index.js";
import "./config/mercadopago.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import { iniciarJobsTurnos } from "./jobs/turnoJobs.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Render no conecta a los usuarios directo con nuestro servidor: primero
// pasa por un intermediario (proxy) de Render. Sin esta línea, nuestro
// servidor pensaría que TODOS los usuarios tienen la misma IP (la del
// intermediario), en vez de la IP real de cada uno.
// esto hace que express  en la ip que pasa render,
// para que cosas como el límite de mensajes del bot funcionen por
// persona y no se mezclen entre todos los usuarios.
app.set("trust proxy", 1);

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