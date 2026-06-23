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
 * Obtiene la lista de mascotas del usuario autenticado.
 * GET /mascotas
 */
export const obtenerMascotas = async () => {
    const { data } = await api.get("/mascotas");
    return data;
};

/**
 * Obtiene la ficha completa de una mascota puntual.
 * GET /mascotas/:id
 */
export const obtenerMascotaPorId = async (id) => {
    const { data } = await api.get(`/mascotas/${id}`);
    return data;
};

/**
 * Actualiza los datos de una mascota.
 * PUT /mascotas/:id
 */
export const actualizarMascota = async (id, data) => {
    const { data: response } = await api.put(`/mascotas/${id}`, data);
    return response;
};

/**
 * Elimina una mascota.
 * DELETE /mascotas/:id
 */
export const eliminarMascota = async (id) => {
    const { data } = await api.delete(`/mascotas/${id}`);
    return data;
};

export default {
    obtenerMascotas,
    obtenerMascotaPorId,
    actualizarMascota,
    eliminarMascota,
};