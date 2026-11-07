import api from "./api.js";

export const obtenerNotificaciones = async () => {
  const { data } = await api.get("/notificaciones");
  return data.data;
};

export const contarNotificacionesNoLeidas = async () => {
  const { data } = await api.get("/notificaciones/no-leidas/count");
  return data.data.cantidad;
};

export const marcarNotificacionComoLeida = async (id) => {
  const { data } = await api.put(`/notificaciones/${id}/leida`);
  return data.data;
};

export const marcarTodasLasNotificacionesComoLeidas = async () => {
  const { data } = await api.put("/notificaciones/leida/todas");
  return data.data;
};