// client/src/services/pagosService.js
import api from "./api";

export const crearPreferenciaPago = async (turnoId) => {
  const { data } = await api.post("/pagos/preferencia", { turnoId });
  return data.data; // { init_point }
};

export const obtenerEstadoPago = async (turnoId) => {
  const { data } = await api.get(`/pagos/estado/${turnoId}`);
  return data.data; // { estado, monto, fechaAprobacion }
};