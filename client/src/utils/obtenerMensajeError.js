
// para no duplicar en el login y el registro

export function obtenerMensajeError(data) {
  if (typeof data === "string") {
    return data;
  }

  return (
    data?.message ||
    data?.mensaje ||
    data?.error ||
    "Ocurrió un error inesperado."
  );
}