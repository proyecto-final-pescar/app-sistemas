export const servicioVacio = () => ({ 
  id: crypto.randomUUID(), 
  categoria: "", 
  nombre: "", 
  precio: "" 
});

export const profesionalVacio = () => ({ 
  id: crypto.randomUUID(), 
  nombre: "", 
  email: "", 
  especialidad: "" 
});

export const DIAS = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export const horasDisponibles = () => {
  const horas = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 30) {
      horas.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  return horas;
};

export const HORAS = horasDisponibles();

export const validarCamposRequeridos = (items, campos, mensajeError) => {
  for (const item of items) {
    for (const campo of campos) {
      if (!item[campo]?.toString().trim()) return mensajeError;
    }
  }
  return "";
};

//Validacion email
export const validarEmail = (email) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

// validacion CUIT/CUIL
export const validarCUIT = (cuit) =>
  /^\d{2}-?\d{8}-?\d{1}$/.test(cuit.trim());

// Validacion telefono
export const validarTelefono = (telefono) =>
  /^[0-9+\s()-]{6,20}$/.test(telefono.trim());

// validacion precio
export const validarPrecio = (precio) => {
  const n = Number(precio);
  return !Number.isNaN(n) && n > 0;
};

// validacion Coordenadas
export const validarCoordenadas = (lat, lng) =>
  typeof lat === "number" && !Number.isNaN(lat) &&
  typeof lng === "number" && !Number.isNaN(lng);

//  validacion Horarios
export const validarHorarios = (diasSeleccionados) => {
  for (const [dia, horario] of Object.entries(diasSeleccionados)) {
    if (!horario.desde || !horario.hasta || horario.desde >= horario.hasta) {
      return `En "${dia}", el horario "Hasta" debe ser mayor a "Desde".`;
    }
  }
  return "";
};

export const construirHorarios = (diasSeleccionados) => {
  const mapaDias = {
    Lunes: "lunes", Martes: "martes", Miércoles: "miercoles",
    Jueves: "jueves", Viernes: "viernes", Sábado: "sabado", Domingo: "domingo",
  };
  const horarios = {};
  Object.values(mapaDias).forEach((clave) => { horarios[clave] = { desde: "", hasta: "" }; });
  Object.entries(diasSeleccionados).forEach(([dia, horario]) => {
    const clave = mapaDias[dia];
    if (clave) horarios[clave] = { desde: horario.desde, hasta: horario.hasta };
  });
  return horarios;
};