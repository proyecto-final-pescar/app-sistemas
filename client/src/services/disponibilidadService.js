import api from "./api";

export async function obtenerDisponibilidadPorFecha(vetId, fecha) {
  const { data } = await api.get(`/disponibilidad/${vetId}?fecha=${fecha}`);
  return data;
}
