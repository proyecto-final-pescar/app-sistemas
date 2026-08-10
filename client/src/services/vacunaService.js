import api from "./api";

export const crearVacuna = async (datos) => {
  const { data } = await api.post("/vacunas", datos);
  return data.data;
};

export const actualizarVacuna = async (vacunaId, datos) => {
  const { data } = await api.put(`/vacunas/${vacunaId}`, datos);
  return data.data;
};

export const eliminarVacuna = async (vacunaId) => {
  await api.delete(`/vacunas/${vacunaId}`);
};

