// client/src/services/veterinariaService.js
import api from "./api";

// GET /veterinarias/mia -> la veterinaria del usuario logueado
export const obtenerMiVeterinaria = async () => {
  const { data } = await api.get("/veterinarias/mia");
  return data.data;
};

export const getVeterinariaById = async (id) => {
  const { data } = await api.get(`/veterinarias/${id}`);
  return data.data; // ahora devuelve directamente el objeto veterinaria
};

export const getAllVeterinarias = async () => {
  const response = await api.get("/veterinarias");
  return response.data;
};