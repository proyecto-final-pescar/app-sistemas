import api from "./api.js";

// Trae la lista de categorias de servicio validas desde el backend
// la unica fuente , asi se evitan arrays duplicados en el front 
export const obtenerCategoriasServicio = async () => {
  const { data } = await api.get("/constantes/categorias-servicio");
  return data.data;
};