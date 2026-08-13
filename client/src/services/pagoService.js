import api from "./api";

export const crearPreferenciaPago = async (turnoId) => {
  const response = await api.post("/pagos/preferencia", {
    turnoId,
  });

  return response.data;
};