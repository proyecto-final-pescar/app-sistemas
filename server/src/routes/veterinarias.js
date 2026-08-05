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
  obtenerPacientesVeterinaria,
} from "../controllers/veterinariaController.js";

const router = Router();

// Todas las rutas requieren autenticación
router.get("/buscar", verifyToken, buscarVeterinarias);
router.get("/", verifyToken, obtenerVeterinarias);

router.get("/mia", verifyToken, obtenerMiVeterinaria);
router.get("/mia/pacientes", verifyToken, verificarRol("veterinaria"), obtenerPacientesVeterinaria);  

router.get("/:id", verifyToken, obtenerVeterinariaPorId);
router.post("/", verifyToken, verificarRol("veterinaria"), crearVeterinaria);
router.put("/:id", verifyToken, actualizarVeterinaria);

export default router;
