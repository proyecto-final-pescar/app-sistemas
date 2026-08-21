// client/src/utils/turnos.js
// Funciones puras para la agenda de turnos.

const MESES_ABREV = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
];

export const obtenerFechaHoraCompleta = (turno) => {
 //se arreglo el desfase por el formato que devuelve back y el parseo 
  const fechaStr = turno.fecha.slice(0, 10); // "YYYY-MM-DD"
  const [anio, mes, dia] = fechaStr.split("-").map(Number);
  const [horas, minutos] = turno.hora.split(":").map(Number);

  return new Date(anio, mes - 1, dia, horas, minutos, 0, 0);
};

export const filtrarProximos = (turnos) => {
  const ahora = new Date();
  return turnos
    .filter((t) => t.estado !== "cancelado" && obtenerFechaHoraCompleta(t) >= ahora)
    .sort((a, b) => obtenerFechaHoraCompleta(a) - obtenerFechaHoraCompleta(b));
};

export const filtrarPasados = (turnos) => {
  const ahora = new Date();
  return turnos
    .filter((t) => t.estado === "cancelado" || obtenerFechaHoraCompleta(t) < ahora)
    .sort((a, b) => obtenerFechaHoraCompleta(b) - obtenerFechaHoraCompleta(a));
};

export const obtenerTurnoMasProximo = (turnos) => {
  const proximos = filtrarProximos(turnos);
  return proximos[0] || null;
};

export const formatearDiaMes = (fecha) => {
  const d = new Date(fecha);
  return {
    dia: String(d.getDate()).padStart(2, "0"),
    mes: MESES_ABREV[d.getMonth()],
  };
};

export const formatearFechaLarga = (fecha) => {
  const texto = new Date(fecha).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

export const ESTADO_BADGE = {
  pendiente: { texto: "Pendiente", variante: "pendiente" },
  confirmado: { texto: "Confirmado", variante: "confirmado" },
  cancelado: { texto: "Cancelado", variante: "cancelado" },
  atendido: { texto: "Atendido", variante: "confirmado" },
};