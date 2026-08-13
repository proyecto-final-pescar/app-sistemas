const API_URL = import.meta.env.VITE_API_URL;

const TurnosAdminService = {
  async getTurnos({ estado, busqueda, fecha, pagina = 1 } = {}) {
    const params = new URLSearchParams();
    if (estado) params.append('estado', estado);
    if (busqueda) params.append('busqueda', busqueda);
    if (fecha) params.append('fecha', fecha);
    params.append('pagina', pagina);

    const token = localStorage.getItem('token');

    const response = await fetch(`${API_URL}/turnos/admin?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.message || 'Error al obtener los turnos');
    }

    return response.json();
  },
};

export default TurnosAdminService;