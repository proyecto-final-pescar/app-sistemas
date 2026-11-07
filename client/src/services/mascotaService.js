import api from "./api";

/**
 * Obtiene la lista de mascotas del usuario autenticado.
 * GET /mascotas
 */
export const obtenerMascotas = async () => {
    const { data } = await api.get("/mascotas");
    return data;
};

/**
 * Obtiene la ficha completa de una mascota puntual.
 * GET /mascotas/:id
 */
export const obtenerMascotaPorId = async (id) => {
    const { data } = await api.get(`/mascotas/${id}`);
    return data;
};

/**
 * Actualiza los datos de una mascota.
 * PUT /mascotas/:id
 */
export const actualizarMascota = async (id, data) => {
    const { data: response } = await api.put(`/mascotas/${id}`, data);
    return response;
};

/**
 * Elimina una mascota.
 * DELETE /mascotas/:id
 */
export const eliminarMascota = async (id) => {
    const { data } = await api.delete(`/mascotas/${id}`);
    return data;
};

/**
 * Crea una nueva mascota.
 * POST /mascotas
 */
export const crearMascota = async (data) => {
  const { data: response } = await api.post("/mascotas", data);
  return response;
};

export default {
  obtenerMascotas,
  obtenerMascotaPorId,
  crearMascota,
  actualizarMascota,
  eliminarMascota,
};