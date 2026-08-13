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
export const obtenerHistorialesTutor = async () => {
  try {
    const { data } = await api.get("/historial-clinico/tutor");
    return data.data || data; 
  } catch (error) {
    // Si el backend responde con 404 (No encontrado), asumimos que no hay historiales
    // y devolvemos un array vacío en lugar de romper la aplicación.
    if (error.response && error.response.status === 404) {
      console.warn("No se encontraron historiales. Devolviendo array vacío.");
      return [];
    }
    
    // Si es otro tipo de error (500 del servidor, 401 de sesión, etc.), sí lo lanzamos
    throw error;
  }
};

export default {
  obtenerHistorialesTutor,
};