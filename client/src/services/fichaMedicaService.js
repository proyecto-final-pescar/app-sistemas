import api from "./api";

export const actualizarFichaMedica = async (mascotaId, datos) => {
  const { data } = await api.put(`/ficha-medica/${mascotaId}`, datos);
  return data.data;
};

