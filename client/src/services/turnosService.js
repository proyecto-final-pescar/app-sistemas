import api from "./api";


export const obtenerTurnosPorVeterinaria = async (
  veterinariaId,
  { servicioId, estado, estadoDistinto, estados, fechaDesde, fechaHasta } = {}
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
  if (estados) params.estados = estados;
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

// Normaliza la respuesta paginada del backend a una forma estable.
const normalizarPagina = (datos = {}) => ({
  turnos: datos.turnos || [],
  total: datos.total ?? 0,
  pagina: datos.pagina ?? 1,
  totalPaginas: datos.totalPaginas ?? 1,
});

/**
 * Turnos paginados del usuario autenticado ("Mis turnos").
 * `tab`: "proximos" | "pasados". Filtra y ordena el backend.
 * Devuelve { turnos, total, pagina, totalPaginas }.
 */
export const obtenerTurnosPaginadosPorUsuario = async ({
  tab,
  pagina = 1,
  limite = 10,
} = {}) => {
  const { data } = await api.get("/turnos", {
    params: { usuarioId: "me", tab, pagina, limite },
  });
  return normalizarPagina(data.data);
};

/**
 * Turnos paginados de una veterinaria (agenda).
 * `tab`: "proximos" | "pasados". `busquedaTutor`: texto libre (nombre/apellido).
 * Devuelve { turnos, total, pagina, totalPaginas }.
 */
export const obtenerTurnosPaginadosPorVeterinaria = async (
  veterinariaId,
  { tab, estados, busquedaTutor, pagina = 1, limite = 10 } = {}
) => {
  if (!veterinariaId) {
    console.warn("obtenerTurnosPaginadosPorVeterinaria: 'veterinariaId' no fue proporcionado.");
    return normalizarPagina();
  }

  const params = { veterinariaId, tab, estados, pagina, limite };
  if (busquedaTutor?.trim()) params.busquedaTutor = busquedaTutor.trim();

  const { data } = await api.get("/turnos", { params });
  return normalizarPagina(data.data);
};

/**
 * Cancela un turno por su ID.
 */
export const cancelarTurno = async (turnoId) => {
  const { data } = await api.patch(`/turnos/${turnoId}/cancelar`);
  return {
    turno: data.data?.turnoCancelado,
    reembolso: data.data?.reembolso,
  };
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

/**
 * Reserva un turno ya existente (creado por la veterinaria).
 * Transiciona el turno de DIS a PEN.
 */
export const reservarTurno = async (turnoId, payload) => {
  const { data } = await api.post(`/turnos/${turnoId}/reservar`, payload);
  return data.data?.turno;
};

export const pagarEfectivo = async (payload) => {
  const { data } = await api.post("/pagos/efectivo", payload);
  return data.data?.turno;
};

/**
 * Reglas de negocio de turnos (fuente única en el backend).
 * Si falla, el llamador debe usar valores por defecto locales.
 */
export const obtenerReglasTurnos = async () => {
  const { data } = await api.get("/constantes/reglas-turnos");
  return data.data; // { anticipacionMinimaHoras, plazoPagoHoras }
};
export const obtenerDisponibilidadGrilla = async (veterinariaId, filtros = {}) => {
  const queryParams = new URLSearchParams();
  queryParams.append("veterinariaId", veterinariaId);
  if (filtros.fechaDesde) queryParams.append("fechaDesde", filtros.fechaDesde);
  if (filtros.fechaHasta) queryParams.append("fechaHasta", filtros.fechaHasta);

  // 👈 VOLVEMOS A LA RUTA ORIGINAL DE TURNOS
  const res = await api.get(`/turnos/disponibles/grilla?${queryParams.toString()}`);
  return res.data.data.turnos;
};