import api from './api'; 

export const obtenerZonas = async () => {
  const { data } = await api.get('/zonas');
  return data?.data ?? [];
};