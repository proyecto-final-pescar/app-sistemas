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

// GET /veterinarias/buscar?lat=&lng=&radio=   veterinarias cercanas
export const buscarVeterinariasCercanas = async ({ lat, lng, radio }) => {
  const { data } = await api.get("/veterinarias/buscar", {
    params: { lat, lng, radio },
  });
  return data.data;
};

// POST /veterinarias/:id/resenas { valor: 1..5 }
// Crea o actualiza  calificación para esa vete
// Devuelve { miCalificacion, rating, cantidadResenias } con el promedio ya recalculado.
export const calificarVeterinaria = async (id, valor) => {
  const { data } = await api.post(`/veterinarias/${id}/resenas`, { valor });
  return data.data;
};

// GET /veterinarias/:id/mi-resena ->  la calificacion del usuario logeado 
export const obtenerMiResena = async (id) => {
  const { data } = await api.get(`/veterinarias/${id}/mi-resena`);
  return data.data;
};