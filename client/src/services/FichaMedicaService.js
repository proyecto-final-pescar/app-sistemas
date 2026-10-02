import api from "./api";

/**
 * Obtiene la ficha médica de una mascota.
 * GET /ficha-medica/:mascotaId
 */
export const obtenerFichaMedica = async (mascotaId) => {
  const { data } = await api.get(`/ficha-medica/${mascotaId}`);
  return data.data; // puede ser null si todavía no tiene ficha
};

/**
 * Actualiza (o crea) la ficha médica de una mascota puntual.
 * PUT /ficha-medica/:mascotaId
 */
export const actualizarFichaMedica = async (mascotaId, datosFicha) => {
  const { data } = await api.put(`/ficha-medica/${mascotaId}`, datosFicha);
  return data.data;
};