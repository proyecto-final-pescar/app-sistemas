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
  actualizarMisDatosGenerales,
  actualizarMisServicios,
  actualizarMisProfesionales,
  actualizarMisHorarios,
  obtenerPacientesVeterinaria,
} from "../controllers/veterinariaController.js";
import {
  calificarVeterinaria,
  obtenerMiResena,
} from "../controllers/reseniaController.js";
import {
  obtenerMetodoCobro,
  iniciarConexionMercadoPago,
  finalizarConexionMercadoPago,
  desconectarMercadoPago,
} from "../controllers/mercadoPagoVeterinariaController.js";

const router = Router();

// Todas las rutas requieren autenticación
router.get("/buscar", verifyToken, buscarVeterinarias);
router.get("/", verifyToken, obtenerVeterinarias);

router.get("/mia", verifyToken, verificarRol("veterinaria"), obtenerMiVeterinaria);
router.put("/mia", verifyToken, verificarRol("veterinaria"), actualizarMiVeterinaria);
router.patch("/mia/datos", verifyToken, verificarRol("veterinaria"), actualizarMisDatosGenerales);
router.put("/mia/servicios", verifyToken, verificarRol("veterinaria"), actualizarMisServicios);
router.put("/mia/profesionales", verifyToken, verificarRol("veterinaria"), actualizarMisProfesionales);
router.put("/mia/horarios", verifyToken, verificarRol("veterinaria"), actualizarMisHorarios);
router.get("/mia/metodo-cobro", verifyToken, verificarRol("veterinaria"), obtenerMetodoCobro);
router.post("/mia/metodo-cobro/mercadopago", verifyToken, verificarRol("veterinaria"), iniciarConexionMercadoPago);
router.delete("/mia/metodo-cobro/mercadopago", verifyToken, verificarRol("veterinaria"), desconectarMercadoPago);
router.get("/mia/pacientes", verifyToken, verificarRol("veterinaria"), obtenerPacientesVeterinaria);  

router.get("/mercadopago/callback", finalizarConexionMercadoPago);

router.get("/:id", verifyToken, obtenerVeterinariaPorId);
router.post("/", verifyToken, verificarRol("veterinaria"), crearVeterinaria);
router.put("/:id", verifyToken, actualizarVeterinaria);

// calificación
router.post("/:id/resenas", verifyToken, calificarVeterinaria);
router.get("/:id/mi-resena", verifyToken, obtenerMiResena);

export default router;
