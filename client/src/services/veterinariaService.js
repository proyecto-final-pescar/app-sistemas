// client/src/services/veterinariaService.js
import api from "./api";

// GET /veterinarias/mia -> la veterinaria del usuario logueado
export const obtenerMiVeterinaria = async () => {
  const { data } = await api.get("/veterinarias/mia");
  return data.data;
};

export const actualizarMiVeterinaria = async (veterinaria) => {
  const { data } = await api.put("/veterinarias/mia", veterinaria);
  return data.data;
};

export const actualizarMisDatosGenerales = async (datos) => {
  const { data } = await api.patch("/veterinarias/mia/datos", datos);
  return data.data;
};

export const actualizarMisServicios = async (servicios) => {
  const { data } = await api.put("/veterinarias/mia/servicios", { servicios });
  return data.data;
};

export const actualizarMisProfesionales = async (profesionales) => {
  const { data } = await api.put("/veterinarias/mia/profesionales", { profesionales });
  return data.data;
};

export const actualizarMisHorarios = async (horarios, urgencias24hs) => {
  const { data } = await api.put("/veterinarias/mia/horarios", {
    horarios,
    urgencias24hs,
  });
  return data.data;
};

export const obtenerMetodoCobro = async () => {
  const { data } = await api.get("/veterinarias/mia/metodo-cobro");
  return data.data;
};

export const iniciarConexionMercadoPago = async () => {
  const { data } = await api.post("/veterinarias/mia/metodo-cobro/mercadopago");
  return data.data;
};

export const desconectarMercadoPago = async () => {
  const { data } = await api.delete("/veterinarias/mia/metodo-cobro/mercadopago");
  return data;
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
