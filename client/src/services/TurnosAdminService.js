const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const TurnosAdminService = {
  async getTurnos({ estado, busqueda, fecha, pagina = 1 } = {}, signal) {
    const params = new URLSearchParams();
    if (estado) params.append('estado', estado);
    if (busqueda) params.append('busqueda', busqueda);
    if (fecha) params.append('fecha', fecha);
    params.append('pagina', pagina);

    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    // Sin token no se manda el header (antes viajaba "Bearer null")
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/turnos/admin?${params.toString()}`, {
      method: 'GET',
      headers,
      signal,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      const falla = new Error(error.message || 'Error al obtener los turnos');
      // Se adjunta el status para que la página distinga el 401
      falla.status = response.status;
      throw falla;
    }

    return response.json();
  },
};

export default TurnosAdminService;