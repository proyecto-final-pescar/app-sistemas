import api from "./api";

export const obtenerPacientesVeterinaria = async (page = 1, limit = 12, busqueda = "") => {
  const response = await api.get("/veterinarias/mia/pacientes", {
    params: { page, limit, busqueda: busqueda || undefined },
  });
  return response.data;
};