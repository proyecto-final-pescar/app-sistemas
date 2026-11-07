// Helpers para fechas SIN hora.
// El backend las serializa como medianoche UTC 
// Si se las pasa por getDate()/getMonth() en hora local (Argentina, UTC-3)
// se muestran un día antes. 

// Devuelve "YYYY-MM-DD" o null. Sirve para comparar con <input type="date">.
export const fechaISO = (fecha) => {
  const coincidencia = /^(\d{4}-\d{2}-\d{2})/.exec(String(fecha || ""));
  return coincidencia ? coincidencia[1] : null;
};

// Devuelve la fecha formateada para mostrar (ej: "30/9/2026") o "".
export const formatearFechaSinHora = (fecha, opciones) => {
  const iso = fechaISO(fecha);
  if (!iso) return "";

  const [anio, mes, dia] = iso.split("-").map(Number);

  return new Intl.DateTimeFormat("es-AR", { ...opciones, timeZone: "UTC" }).format(
    new Date(Date.UTC(anio, mes - 1, dia))
  );
};