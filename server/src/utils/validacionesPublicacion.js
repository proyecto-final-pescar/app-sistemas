
// Validaciones de descripción, fecha y contacto de las publicaciones del foro


const ZONA_HORARIA_AR = 'America/Argentina/Buenos_Aires';

export const TIPOS_CONTACTO = ['TEL', 'EML'];

export const MIN_DESCRIPCION = 12;
export const MAX_DESCRIPCION = 5000;

const FECHA_MINIMA = '2000-01-01';
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const formateadorFechaAR = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_HORARIA_AR,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

const hoyEnArgentina = () => formateadorFechaAR.format(new Date());


export const normalizarTelefonoAR = (valor) => {
  if (typeof valor !== 'string') return null;
  const texto = valor.trim();
  if (!/^[\d\s+\-().]+$/.test(texto)) return null;

  let d = texto.replace(/\D/g, '');
  if (d.startsWith('00')) d = d.slice(2); 
  if (d.startsWith('54')) d = d.slice(2); 
  if (d.startsWith('0')) d = d.slice(1); 
  if (d.startsWith('9') && d.length === 11) d = d.slice(1); 

  if (d.length === 12) {
   
    const posiciones = d.startsWith('11') ? [2] : [3, 4];
    const pos = posiciones.find((i) => d.slice(i, i + 2) === '15');
    if (pos === undefined) return null;
    d = d.slice(0, pos) + d.slice(pos + 2);
  }


  if (!/^(11[2-9]\d{7}|[23]\d{9})$/.test(d)) return null;
  return `+54${d}`;
};

export const validarDescripcion = (valor) => {
  if (typeof valor !== 'string' || !valor.trim()) return { error: 'La descripción es requerida' };
  const descripcion = valor.trim();
  if (descripcion.length < MIN_DESCRIPCION) {
    return { error: `La descripción debe tener al menos ${MIN_DESCRIPCION} caracteres` };
  }
  if (descripcion.length > MAX_DESCRIPCION) {
    return { error: `La descripción no puede superar los ${MAX_DESCRIPCION} caracteres` };
  }
  return { valor: descripcion };
};

export const validarFecha = (valor) => {
  if (valor === undefined || valor === null || valor === '') return { error: 'La fecha es requerida' };
  if (typeof valor !== 'string') return { error: 'La fecha ingresada no es válida' };

  let ymd;
  if (/^\d{4}-\d{2}-\d{2}$/.test(valor.trim())) {
    ymd = valor.trim();
  } else {
    const instante = new Date(valor);
    if (Number.isNaN(instante.getTime())) return { error: 'La fecha ingresada no es válida' };
    ymd = formateadorFechaAR.format(instante);
  }

  const fecha = new Date(`${ymd}T00:00:00.000Z`);
  if (Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== ymd || ymd < FECHA_MINIMA) {
    return { error: 'La fecha ingresada no es válida' };
  }
  if (ymd > hoyEnArgentina()) return { error: 'La fecha no puede ser futura' };

  return { valor: fecha };
};

export const validarContacto = (valor, tipo) => {
  if (typeof valor !== 'string' || !valor.trim()) return { error: 'El contacto es requerido' };
  const contacto = valor.trim();

  if (tipo === 'EML') {
    if (!REGEX_EMAIL.test(contacto)) return { error: 'El email de contacto no es válido' };
    return { valor: contacto.toLowerCase() };
  }

  const telefono = normalizarTelefonoAR(contacto);
  if (!telefono) {
    return { error: 'El teléfono debe ser un número argentino válido, con código de área' };
  }
  return { valor: telefono };
};