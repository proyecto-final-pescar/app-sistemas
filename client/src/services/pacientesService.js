import api from "./api";

export const obtenerPacientesVeterinaria = async () => {
  const response = await api.get("/veterinarias/mia/pacientes");
  return response.data;
};