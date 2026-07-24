import api from "./api";

const normalizarRespuesta = (response) => response.data?.data || response.data || [];

export const obtenerPublicaciones = async ({ zona, estado } = {}) => {
  const params = {};

  if (zona && zona !== "Todas") {
    params.zona = zona;
  }

  if (estado && estado !== "todas") {
    params.estado = estado;
  }

  const response = await api.get("/publicaciones", { params });
  return normalizarRespuesta(response);
};

export const crearPublicacion = async (publicacion) => {
  const response = await api.post("/publicaciones", publicacion);
  return normalizarRespuesta(response);
};

export const cambiarEstadoPublicacion = async (id, estado) => {
  const response = await api.patch(`/publicaciones/${id}/estado`, { estado });
  return normalizarRespuesta(response);
};

export const eliminarPublicacion = async (id) => {
  const response = await api.delete(`/publicaciones/${id}`);
  return response.data;
};

export default {
  obtenerPublicaciones,
  crearPublicacion,
  cambiarEstadoPublicacion,
  eliminarPublicacion,
};