import "dotenv/config";

import express from "express";
import compression from "compression";
import cors from "cors";

import prisma, { connectDB, disconnectDB } from "./prisma/client.js";
import routes from "./routes/index.js";
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
  credentials: true,
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Origen no permitido por CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],

  maxAge: 7200,
};

app.use(cors(corsOptions));
// Comprime las respuestas de texto/JSON con gzip (las imágenes de
// Cloudinary ya viajan optimizadas y no se tocan por defecto).
app.use(compression());
app.use(express.json());

app.use("/api", routes);
app.use("/api/upload", uploadRoutes);

app.get("/", (req, res) => {
  res.json({ message: "Servidor funcionando" });
});

// Health check: sirve para el health check de Render y para un monitor
// externo (UptimeRobot, cron-job.org) que evite el spin-down en plan free
app.get("/health", async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ok: true });
  } catch {
    res.status(503).json({ ok: false });
  }
});

async function start() {
  // Abrimos la conexión a Postgres antes de recibir tráfico, así la primera
  // request de un usuario no paga el handshake TLS
  try {
    await connectDB();
  } catch (err) {
    console.error("[db] no se pudo conectar al arrancar:", err);
    process.exit(1); // Render reinicia el servicio en vez de dejarlo "vivo pero roto"
  }

  const server = app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });

  // Los crons arrancan recién cuando la DB ya está lista
  iniciarJobsTurnos();

  
  const shutdown = (signal) => {
    console.log(`[server] ${signal} recibido, cerrando...`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

start();

export default app;