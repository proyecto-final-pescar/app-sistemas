// client/src/validators/TurnoValidator.js

class TurnoValidator {

  static validarDuracion(duracion) {
    if (duracion === undefined || duracion === null || typeof duracion !== "number") {
      return "La duración es obligatoria y debe ser un número.";
    }
    if (!Number.isInteger(duracion) || duracion <= 0) {
      return "La duración debe ser un número entero positivo (ej. 15, 30, 60).";
    }
    return null;
  }

  static validarFormatoHora(hora) {
    const regexHora = /^([01]\d|2[0-3]):[0-5]\d$/;
    if (!regexHora.test(hora)) {
      return `El formato de hora "${hora}" es inválido. Debe ser HH:MM.`;
    }
    return null;
  }

  static validarDatosOferta(servicioId, profesionales, slots, duracion) {
    if (!servicioId) return "Seleccioná un servicio.";
    
    if (!profesionales || profesionales.length === 0) {
      return "Seleccioná al menos un profesional.";
    }
    
    if (!slots || slots.length === 0) {
      return "Seleccioná al menos un horario en la grilla.";
    }

    const errorDuracion = this.validarDuracion(duracion);
    if (errorDuracion) return errorDuracion;

    for (const slot of slots) {
      const errorHora = this.validarFormatoHora(slot.hora);
      if (errorHora) return errorHora;
    }

    return null;
  }
}

export default TurnoValidator;