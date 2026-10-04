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
  ATE: { texto: "Atendido", variante: "atendido" },
};