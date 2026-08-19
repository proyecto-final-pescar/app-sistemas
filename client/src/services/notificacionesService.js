const API_URL = import.meta.env.VITE_API_URL;

const obtenerToken = () => localStorage.getItem("token");

const headersAuth = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${obtenerToken()}`,
});

export const obtenerNotificaciones = async () => {
  const response = await fetch(`${API_URL}/notificaciones`, {
    headers: headersAuth(),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "No se pudieron cargar las notificaciones.");
  }

  return data.data;
};

export const obtenerCantidadNoLeidas = async () => {
  const response = await fetch(
    `${API_URL}/notificaciones/no-leidas/count`,
    {
      headers: headersAuth(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "No se pudo obtener el conteo de notificaciones."
    );
  }

  return data.data.cantidad;
};

export const marcarNotificacionComoLeida = async (id) => {
  const response = await fetch(
    `${API_URL}/notificaciones/${id}/leida`,
    {
      method: "PUT",
      headers: headersAuth(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "No se pudo marcar la notificación como leída."
    );
  }

  return data.data;
};

export const marcarTodasComoLeidas = async () => {
  const response = await fetch(
    `${API_URL}/notificaciones/leida/todas`,
    {
      method: "PUT",
      headers: headersAuth(),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "No se pudieron marcar las notificaciones como leídas."
    );
  }

  return data.data;
};