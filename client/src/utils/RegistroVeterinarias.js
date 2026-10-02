export const servicioVacio = () => ({
  id: crypto.randomUUID(),
  categoria: "",
  nombre: "",
  precio: "",
});

export const profesionalVacio = () => ({
  id: crypto.randomUUID(),
  nombre: "",
  apellido: "",
  email: "",
  especialidad: "",
  serviciosIds: []
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

// ── CUIT/CUIL ──

export const soloDigitosCUIT = (cuit) => (cuit || "").replace(/\D/g, "");

// Prefijos válidos de CUIT/CUIL: personas (20, 23, 24, 27) y empresas (30, 33, 34).
const PREFIJOS_CUIT_VALIDOS = ["20", "23", "24", "27", "30", "33", "34"];

// Valida largo, prefijo y dígito verificador (módulo 11).
export const validarCUIT = (cuit) => {
  const d = soloDigitosCUIT(cuit);
  if (d.length !== 11) return false;
  if (!PREFIJOS_CUIT_VALIDOS.includes(d.slice(0, 2))) return false;
  const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  const suma = pesos.reduce((acc, peso, i) => acc + peso * Number(d[i]), 0);
  let verificador = 11 - (suma % 11);
  if (verificador === 11) verificador = 0;
  if (verificador === 10) return false;
  return verificador === Number(d[10]);
};


export const normalizarCUIT = (cuit) => {
  const digitos = soloDigitosCUIT(cuit);
  if (digitos.length !== 11) return cuit;
  return `${digitos.slice(0, 2)}-${digitos.slice(2, 10)}-${digitos.slice(10)}`;
};


export const normalizarTelefonoAR = (telefono) => {
  let d = String(telefono || "").replace(/\D/g, "");
  if (d.startsWith("54")) {
    d = d.slice(2);
    if (d.startsWith("9")) d = d.slice(1);
  }
  if (d.startsWith("0")) d = d.slice(1);
  if (d.startsWith("1115") && d.length === 12) d = "11" + d.slice(4);
  return d;
};

export const validarTelefono = (telefono) =>
  /^11[2-9]\d{7}$/.test(normalizarTelefonoAR(telefono));

// ── Sitio web (opcional) ──
export const normalizarSitioWeb = (sitio) => {
  const s = (sitio || "").trim();
  if (!s) return "";
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
};

export const validarSitioWeb = (sitio) => {
  const s = normalizarSitioWeb(sitio);
  if (!s) return true;
  if (/\s/.test(s)) return false;
  try {
    const url = new URL(s);
    return ["http:", "https:"].includes(url.protocol) && url.hostname.includes(".");
  } catch {
    return false;
  }
};

// ── Nombres de personas ──
export const validarNombrePersona = (texto) =>
  /^[a-zA-ZÀ-ÖØ-öø-ÿ\u00f1\u00d1\s'.-]+$/.test((texto || "").trim());

// validacion precio: mayor a 0 y como mucho 2 decimales.
export const validarPrecio = (precio) => {
  if (precio === "" || precio === null || precio === undefined) return false;
  const n = Number(precio);
  return (
    Number.isFinite(n) &&
    n > 0 &&
    /^\d+(\.\d{1,2})?$/.test(String(precio).trim())
  );
};

// validacion Coordenadas
export const validarCoordenadas = (lat, lng) =>
  typeof lat === "number" && !Number.isNaN(lat) &&
  typeof lng === "number" && !Number.isNaN(lng);


export const direccionEsPuntual = (addressComponents = []) => {
  const tipos = new Set(addressComponents.flatMap((c) => c.types || []));
  return tipos.has("route") && tipos.has("street_number");
};


export const CABA_LAT_MIN = -34.7051;
export const CABA_LAT_MAX = -34.5265;
export const CABA_LNG_MIN = -58.5314;
export const CABA_LNG_MAX = -58.3357;

export const validarEnCABA = (lat, lng) =>
  validarCoordenadas(lat, lng) &&
  lat >= CABA_LAT_MIN && lat <= CABA_LAT_MAX &&
  lng >= CABA_LNG_MIN && lng <= CABA_LNG_MAX;


export const direccionEnCABAPorComponentes = (addressComponents = []) => {
  const provincia = addressComponents.find((c) =>
    (c.types || []).includes("administrative_area_level_1"),
  );
  if (!provincia) return false;
  return [provincia.long_name, provincia.short_name]
    .map((n) => (n || "").toLowerCase())
    .some((n) => n.includes("ciudad autónoma de buenos aires") || n.includes("ciudad autonoma de buenos aires") || n === "caba");
};

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
  Object.entries(diasSeleccionados).forEach(([dia, horario]) => {
    const clave = mapaDias[dia];
    if (clave && horario?.desde && horario?.hasta) {
      horarios[clave] = { desde: horario.desde, hasta: horario.hasta };
    }
  });
  return horarios;
};