// client/src/services/turnosService.js
import api from "./api";

export const obtenerTurnosPorVeterinaria = async (veterinariaId, estado) => {
  const params = { veterinariaId, tipo: "disponible" };
  if (estado) params.estado = estado;

  const { data } = await api.get("/turnos", { params });
  return data.data.turnos;
};

export const obtenerTurnosPorUsuario = async () => {
  const { data } = await api.get("/turnos", {
    params: { usuarioId: "me" }
  });
  return data.data.turnos;
};

// PATCH /turnos/:id/cancelar
export const cancelarTurno = async (turnoId) => {
  const { data } = await api.patch(`/turnos/${turnoId}/cancelar`);
  return data.data.turno;
};


export const crearOfertaHoraria = async (oferta) => {
  const { data } = await api.post("/turnos/oferta", oferta);
  return data;
};