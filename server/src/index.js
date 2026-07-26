import "dotenv/config";

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import routes from "./routes/index.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import rutasTurnos from "./routes/rutasTurnos.js";
import { iniciarJobsTurnos } from "./jobs/turnoJobs.js";

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  "http://localhost:5173",
  ...(process.env.CLIENT_URL || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Origen no permitido por CORS"));
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());

app.use("/api", routes);
app.use("/api/upload", uploadRoutes);

connectDB();

app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

app.get("/", (req, res) => {
  res.json({ message: "Servidor funcionando" });
});

app.use("/api", rutasTurnos);

iniciarJobsTurnos();

export default app;