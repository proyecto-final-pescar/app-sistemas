import api from "./api";

export const obtenerTurnosPorVeterinaria = async (veterinariaId, { estado, estadoDistinto } = {}) => {
  const params = { veterinariaId };
  if (estado) params.estado = estado;
  if (estadoDistinto) params.estadoDistinto = estadoDistinto;

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

// turnos que toda no se les registro una consulta 
export const obtenerTurnosPendientesRegistro = async (mascotaId) => {
  const { data } = await api.get(`/historial-clinico/turnos-pendientes/${mascotaId}`);
  return Array.isArray(data?.data) ? data.data : [];
};