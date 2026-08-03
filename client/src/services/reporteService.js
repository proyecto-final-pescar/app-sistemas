import api from "./api";

const normalizarRespuesta = (response) =>
  response.data?.data || response.data;

export const crearReporte = async (reporte) => {
  const response = await api.post("/reportes", reporte);
  return normalizarRespuesta(response);
};

export default {
  crearReporte,
};