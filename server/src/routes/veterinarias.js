import { Router } from "express";
import verifyToken from "../middleware/auth.js";
import verificarRol from "../middleware/roles.js";
import {
  buscarVeterinarias,
  obtenerVeterinarias,
  obtenerMiVeterinaria,
  obtenerVeterinariaPorId,
  crearVeterinaria,
  actualizarVeterinaria,
  actualizarMiVeterinaria,
  obtenerPacientesVeterinaria,
} from "../controllers/veterinariaController.js";
import {
  calificarVeterinaria,
  obtenerMiResena,
} from "../controllers/reseniaController.js";

const router = Router();

// Todas las rutas requieren autenticación
router.get("/buscar", verifyToken, buscarVeterinarias);
router.get("/", verifyToken, obtenerVeterinarias);

router.get("/mia", verifyToken, obtenerMiVeterinaria);
router.put("/mia", verifyToken, verificarRol("veterinaria"), actualizarMiVeterinaria);
router.get("/mia/pacientes", verifyToken, verificarRol("veterinaria"), obtenerPacientesVeterinaria);  

router.get("/:id", verifyToken, obtenerVeterinariaPorId);
router.post("/", verifyToken, verificarRol("veterinaria"), crearVeterinaria);
router.put("/:id", verifyToken, actualizarVeterinaria);

// calificación
router.post("/:id/resenas", verifyToken, calificarVeterinaria);
router.get("/:id/mi-resena", verifyToken, obtenerMiResena);

export default router;
