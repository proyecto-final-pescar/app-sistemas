// client/src/services/veterinariaService.js
import api from "./api";

// GET /veterinarias/mia -> la veterinaria del usuario logueado
export const obtenerMiVeterinaria = async () => {
  const { data } = await api.get("/veterinarias/mia");
  return data.data;
};