import api from "./api";

/**
 * Obtiene los turnos filtrados de una veterinaria.
 * Envía los parámetros en camelCase para alinearse con req.query del backend Prisma.
 */
export const obtenerTurnosPorVeterinaria = async (
  veterinariaId,
  { servicioId, estado, estadoDistinto, fechaDesde, fechaHasta } = {}
) => {
  // Validación en cliente para evitar peticiones con IDs inválidos o vacíos
  if (!veterinariaId) {
    console.warn("obtenerTurnosPorVeterinaria: 'veterinariaId' no fue proporcionado.");
    return [];
  }

  const params = { veterinariaId };
  if (servicioId) params.servicioId = servicioId;
  if (estado) params.estado = estado;
  if (estadoDistinto) params.estadoDistinto = estadoDistinto;
  if (fechaDesde) params.fechaDesde = fechaDesde;
  if (fechaHasta) params.fechaHasta = fechaHasta;

  const { data } = await api.get("/turnos", { params });
  return data.data?.turnos || [];
};

/**
 * Obtiene los turnos asignados al usuario autenticado.
 */
export const obtenerTurnosPorUsuario = async () => {
  const { data } = await api.get("/turnos", {
    params: { usuarioId: "me" }
  });
  return data.data?.turnos || [];
};

/**
 * Cancela un turno por su ID.
 */
export const cancelarTurno = async (turnoId) => {
  const { data } = await api.patch(`/turnos/${turnoId}/cancelar`);
  return data.data?.turno || data.data;
};

/**
 * Envía la oferta horaria masiva al backend PostgreSQL.
 */
export const crearOfertaHoraria = async (oferta) => {
  const payload = {
    servicioId: oferta.servicioId,
    profesionales: oferta.profesionales,
    duracion: oferta.duracion,
    slots: oferta.slots,
  };

  const { data } = await api.post("/turnos/oferta", payload);
  return data.data || data;
};

/**
 * Obtiene turnos pendientes de registro clínico para una mascota.
 */
export const obtenerTurnosPendientesRegistro = async (mascotaId) => {
  const { data } = await api.get(`/historial-clinico/turnos-pendientes/${mascotaId}`);
  return Array.isArray(data?.data) ? data.data : [];
};