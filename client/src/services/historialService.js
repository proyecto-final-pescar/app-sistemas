import api from './api';

export const obtenerHistorialesTutor = async () => {
  try {
    const { data } = await api.get('/historial/tutor');
    return data.data || data;
  } catch (error) {
    if (error.response?.status === 404) {
      console.warn("No se encontraron historiales. Devolviendo array vacío.");
      return { historiales: [] };
    }
    throw error;
  }
};