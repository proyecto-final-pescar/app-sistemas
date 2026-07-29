
// Un día sin horario cargado (desde/hasta vacíos o undefined) se trata como cerrado.

const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

function obtenerHorarioDeHoy(horarios) {
  if (!horarios) return null;
  const diaKey = DIAS[new Date().getDay()];
  const horario = horarios[diaKey];
  if (!horario?.desde || !horario?.hasta) return null; // día cerrado / sin cargar
  return horario;
}

function horaActualEnMinutos() {
  const ahora = new Date();
  return ahora.getHours() * 60 + ahora.getMinutes();
}

function horaStringAMinutos(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}

/**
 * Devuelve  si una vet esta abierta y la hora de cierre para una veterinaria,
 * segun el horario del día actual 
 */
export function calcularEstadoApertura(vet) {
  const urgencias24 = !!vet?.urgencias24hs;

  if (urgencias24) {
    return { abierta: true, horaCierre: null };
  }

  const horarioHoy = obtenerHorarioDeHoy(vet?.horarios);
  if (!horarioHoy) {
    return { abierta: false, horaCierre: null };
  }

  const ahora = horaActualEnMinutos();
  const desde = horaStringAMinutos(horarioHoy.desde);
  const hasta = horaStringAMinutos(horarioHoy.hasta);

  return {
    abierta: ahora >= desde && ahora < hasta,
    horaCierre: horarioHoy.hasta,
  };
}