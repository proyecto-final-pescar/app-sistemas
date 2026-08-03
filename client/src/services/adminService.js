import api from "./api";

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
  const response = await api.get(`/turnos/${id}`);
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
 * Banea un usuario (si cuentas con la ruta en el controlador de usuarios/admin)
 */
export const banearUsuario = async (usuarioId) => {
  const { data } = await api.patch(`/admin/usuarios/${usuarioId}/banear`);
  return data;
};
