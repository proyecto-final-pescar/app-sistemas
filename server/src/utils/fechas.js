// server/src/utils/fechas.js

const ZONA_HORARIA = 'America/Argentina/Buenos_Aires'


export const obtenerFechaHoy = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(new Date())


export const esFechaFutura = (fecha) =>
  fecha.toISOString().slice(0, 10) > obtenerFechaHoy()