import api from "./api";

export const listarUsuarios = async ({
  nombre = "",
  email = "",
  telefono = "",
  estado = "",
  page = 1,
  limit = 4,
  // signal: AbortSignal opcional. Permite que quien llama cancele una
  // petición si ya no le interesa la respuesta  porque el
  // usuario cambio de filtro y se disparo una peticion más nueva
  signal,
} = {}) => {
  const params = {
    page,
    limit,
  };

  if (nombre.trim()) {
    params.nombre = nombre.trim();
  }

  if (email.trim()) {
    params.email = email.trim();
  }

  if (telefono.trim()) {
    params.telefono = telefono.trim();
  }

  if (estado !== "") {
    params.estado = estado;
  }

  const response = await api.get("/usuarios", { params, signal });

  return response.data;
};

export const actualizarEstadoUsuario = async (id, active) => {
  const response = await api.put(`/usuarios/${id}`, {
    active,
  });

  return response.data;
};