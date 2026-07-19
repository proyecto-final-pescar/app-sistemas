import api from './api';

const publicacionesService = {
  obtenerPublicaciones: async (estado = null, zona = null) => {
    try {
      const params = new URLSearchParams();
      if (estado) params.append('estado', estado);
      if (zona && zona !== 'Todas') params.append('zona', zona);

      const response = await api.get(`/publicaciones?${params.toString()}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener publicaciones:', error);
      throw error;
    }
  },

  obtenerPublicacion: async (id) => {
    try {
      const response = await api.get(`/publicaciones/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error al obtener publicación:', error);
      throw error;
    }
  },

  crearPublicacion: async (datos) => {
    try {
      const response = await api.post('/publicaciones', datos);
      return response.data;
    } catch (error) {
      console.error('Error al crear publicación:', error);
      throw error;
    }
  },

  marcarEncontrada: async (id) => {
    try {
      const response = await api.patch(`/publicaciones/${id}/encontrada`, {
        estado: 'resuelto',
        fechaResolucion: new Date()
      });
      return response.data;
    } catch (error) {
      console.error('Error al marcar como encontrada:', error);
      throw error;
    }
  },

  obtenerZonas: async () => {
    try {
      const response = await api.get('/publicaciones/zonas');
      return response.data;
    } catch (error) {
      console.error('Error al obtener zonas:', error);
      throw error;
    }
  },

  contactarDueno: async (publicacionId, mensaje) => {
    try {
      const response = await api.post(`/publicaciones/${publicacionId}/contactar`, {
        mensaje
      });
      return response.data;
    } catch (error) {
      console.error('Error al contactar al dueño:', error);
      throw error;
    }
  }
};

export default publicacionesService;