import api from "./api";

/* ----------------------- DASHBOARD -------------------------- */
export const getDashboardMetrics = async () => {
  const { data } = await api.get("/admin/dashboard/metrics");
  return data.data;
};

export const getTurnosDelDia = async ({ fecha, estado } = {}) => {
  const { data } = await api.get("/admin/dashboard/turnos-del-dia", {
    params: { fecha, estado },
  });
  return data.data;
};



/* ----------------------- VETERINARIAS -------------------------- */
/**
 * Obtiene el detalle de una veterinaria por su ID
 */
export const getVeterinariaAdminById = async (id) => {
  const { data } = await api.get(`/admin/veterinarias/${id}`);
  return data.data;
};

/**
 * Rechaza la solicitud/registro de una veterinaria
 */
export const rechazarVeterinariaAdmin = async (id, motivo) => {
  const { data } = await api.patch(`/admin/veterinarias/${id}/rechazar`, {
    motivo,
  });
  return data;
};

/**
 * Aprueba la solicitud/registro de una veterinaria pendiente
 */
export const aprobarVeterinariaAdmin = async (id) => {
  const { data } = await api.patch(`/admin/veterinarias/${id}/aprobar`);
  return data;
};

/**
 * Cambia el estado de una veterinaria  activar/suspender
 */
export const actualizarEstadoVeterinariaAdmin = async (id, estado) => {
  const { data } = await api.put(`/admin/veterinarias/${id}`, { estado });
  return data;
};

/**
 * Obtiene todas las veterinarias
 */
export const getVeterinariasAdmin = async (params = {}) => {
  const { data } = await api.get("/admin/veterinarias", { params });
  return data;
};

/* ----------------------- DUEÑOS -------------------------- */
/**
 * Obtiene el perfil completo de un usuario por su ID (incluyendo sus mascotas)
 */
export const obtenerUsuarioPorId = async (id) => {
  const response = await api.get(`/usuarios/${id}`);
  return response.data;
};

/* ----------------------- TURNOS -------------------------- */
/**
 * Obtiene el detalle completo de un turno por su ID.
 */

export const getTurnoAdminById = async (id) => {
  const response = await api.get(`/turnos/admin/${id}`); // antes: /turnos/${id}
  return response.data;
};
/* ----------------------- FORO Y MODERACIÓN -------------------------- */
/**
 * Elimina una publicación reportada
 */
export const eliminarPublicacion = async (id) => {
  const { data } = await api.delete(`/publicaciones/${id}`);
  return data;
};

/**
 * Descarta los reportes pendientes de una publicación sin eliminarla.
 */
export const descartarReportesPublicacion = async (publicacionId) => {
  const { data } = await api.patch(`/reportes/publicacion/${publicacionId}/descartar`);
  return data;
};

/**
 * Da de baja (soft delete) a un usuario — pone active: false
 */
export const banearUsuario = async (usuarioId) => {
  const { data } = await api.delete(`/usuarios/${usuarioId}`);
  return data;
};

/**
 * Obtiene los reportes individuales de una publicación (motivo, descripción, autor).
 * Por defecto el backend filtra estado "pendiente" cuando se pasa publicacionId sin estado.
 */
export const obtenerReportesPorPublicacion = async (publicacionId, estado) => {
  const params = { publicacionId };
  if (estado) params.estado = estado;

  const { data } = await api.get("/reportes", { params });
  return data.data || [];
};