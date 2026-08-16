// services/historialService.js
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Obtiene el historial clínico de las mascotas del tutor autenticado.
 * GET /historial-clinico/tutor
 */
export const obtenerHistorialesTutor = async (pagina = 1) => {
  try {
    // Le sacamos el /historial-clinico del principio
    const { data } = await api.get(`/historial/tutor?pagina=${pagina}`);
    return data.data || data; 
  } catch (error) {
    if (error.response && error.response.status === 404) {
      console.warn("No se encontraron historiales. Devolviendo array vacío.");
      return [];
    }
    throw error;
  }
};