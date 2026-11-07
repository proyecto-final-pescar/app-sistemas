import api from "./api";


export const obtenerTurnosPorVeterinaria = async (
  veterinariaId,
  { servicioId, estado, estadoDistinto, estados, fechaDesde, fechaHasta } = {}
) => {
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

export const obtenerTurnosPorUsuario = async () => {
  const { data } = await api.get("/turnos", {
    params: { usuarioId: "me" }
  }); 
  return data.data?.turnos || [];
};

const normalizarPagina = (datos = {}) => ({
  turnos: datos.turnos || [],
  total: datos.total ?? 0,
  pagina: datos.pagina ?? 1,
  totalPaginas: datos.totalPaginas ?? 1,
});

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

export const cancelarTurno = async (turnoId) => {
  const { data } = await api.patch(`/turnos/${turnoId}/cancelar`);
  return {
    turno: data.data?.turnoCancelado,
    reembolso: data.data?.reembolso,
  };
};

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

export const obtenerTurnosPendientesRegistro = async (mascotaId) => {
  const { data } = await api.get(`/historial-clinico/turnos-pendientes/${mascotaId}`);
  return Array.isArray(data?.data) ? data.data : [];
};

export const reservarTurno = async (turnoId, payload) => {
  const { data } = await api.post(`/turnos/${turnoId}/reservar`, payload);
  return data.data?.turno;
};

export const pagarEfectivo = async (payload) => {
  const { data } = await api.post("/pagos/efectivo", payload);
  return data.data?.turno;
};

export const obtenerReglasTurnos = async () => {
  const { data } = await api.get("/constantes/reglas-turnos");
  return data.data; // { anticipacionMinimaHoras, plazoPagoHoras }
};
export const obtenerDisponibilidadGrilla = async (veterinariaId, filtros = {}) => {
  const queryParams = new URLSearchParams();
  queryParams.append("veterinariaId", veterinariaId);
  if (filtros.fechaDesde) queryParams.append("fechaDesde", filtros.fechaDesde);
  if (filtros.fechaHasta) queryParams.append("fechaHasta", filtros.fechaHasta);

  const res = await api.get(`/turnos/disponibles/grilla?${queryParams.toString()}`);
  return res.data.data.turnos;
};