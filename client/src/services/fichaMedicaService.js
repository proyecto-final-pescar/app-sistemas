import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Adjunta el token de autenticación en cada request, si existe.
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

/**
 * Actualiza la ficha médica de una mascota puntual.
 * PUT /ficha-medica/:mascotaId
 */
export const actualizarFichaMedica = async (mascotaId, datosFicha) => {
    const { data } = await api.put(`/ficha-medica/${mascotaId}`, datosFicha);
    return data;
};

export default {
  actualizarFichaMedica,
};