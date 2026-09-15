// client/src/utils/turnos.js
// Funciones puras para la agenda de turnos.

const MESES_ABREV = [
  "ENE", "FEB", "MAR", "ABR", "MAY", "JUN",
  "JUL", "AGO", "SEP", "OCT", "NOV", "DIC",
];

const crearFechaLocal = (textoFecha) => {
  if (!textoFecha) return new Date();
  const soloFecha = String(textoFecha).split("T")[0];
  const [anio, mes, dia] = soloFecha.split("-").map(Number);
  return new Date(anio, mes - 1, dia);
};

export const obtenerFechaHoraCompleta = (turno) => {
  const fecha = crearFechaLocal(turno.fecha);
  const [horas, minutos] = (turno.hora_inicio || "00:00").split(":").map(Number);
  fecha.setHours(horas, minutos, 0, 0);
  return fecha;
};


export const filtrarProximos = (turnos) => {
  const ahora = new Date();
  return turnos
    .filter(
      (t) => t.estado_turno_id === "CON" && obtenerFechaHoraCompleta(t) >= ahora,
    )
    .sort((a, b) => obtenerFechaHoraCompleta(a) - obtenerFechaHoraCompleta(b));
};


export const filtrarPasados = (turnos) => {
  const ahora = new Date();
  return turnos
    .filter(
      (t) =>
        t.estado_turno_id === "CAN" ||
        t.estado_turno_id === "ATE" ||
        obtenerFechaHoraCompleta(t) < ahora,
    )
    .sort((a, b) => obtenerFechaHoraCompleta(b) - obtenerFechaHoraCompleta(a));
};

export const obtenerTurnoMasProximo = (turnos) => {
  const proximos = filtrarProximos(turnos);
  return proximos[0] || null;
};

export const formatearDiaMes = (fecha) => {
  if (!fecha) return { dia: "--", mes: "---" };
  const d = crearFechaLocal(fecha);
  return {
    dia: String(d.getDate()).padStart(2, "0"),
    mes: MESES_ABREV[d.getMonth()],
  };
};

export const formatearFechaLarga = (fecha) => {
  if (!fecha) return "Sin fecha";
  const d = crearFechaLocal(fecha);
  const texto = d.toLocaleDateString("es-AR", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

export const ESTADO_BADGE = {
  PEN: { texto: "Pendiente", variante: "pendiente" },
  CON: { texto: "Confirmado", variante: "confirmado" },
  CAN: { texto: "Cancelado", variante: "cancelado" },
  ATE: { texto: "Atendido", variante: "confirmado" },
};