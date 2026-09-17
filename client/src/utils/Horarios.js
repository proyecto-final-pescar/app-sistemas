// Un día sin horario cargado (sin franja en horario_veterinaria) se trata como cerrado.

const DIAS = ["domingo", "lunes", "martes", "miercoles", "jueves", "viernes", "sabado"];

function obtenerHorarioDeHoy(horarioVeterinaria) {
  if (!horarioVeterinaria || horarioVeterinaria.length === 0) return null;
  const diaKey = DIAS[new Date().getDay()];
  const horario = horarioVeterinaria.find((h) => h.dia_semana?.nombre === diaKey);
  if (!horario?.hora_desde || !horario?.hora_hasta) return null; // día cerrado / sin cargar
  return { desde: horario.hora_desde, hasta: horario.hora_hasta };
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
  const urgencias24 = !!vet?.urgencias;

  if (urgencias24) {
    return { abierta: true, horaCierre: null };
  }

  const horarioHoy = obtenerHorarioDeHoy(vet?.horario_veterinaria);
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