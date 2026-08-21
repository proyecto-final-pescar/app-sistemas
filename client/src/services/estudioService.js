import api from "./api";

export const crearEstudio = async (datos) => {
  const { data } = await api.post("/estudios", datos);
  return data.data;
};

export const actualizarEstudio = async (estudioId, datos) => {
  const { data } = await api.put(`/estudios/${estudioId}`, datos);
  return data.data;
};

export const eliminarEstudio = async (estudioId) => {
  await api.delete(`/estudios/${estudioId}`);
};

