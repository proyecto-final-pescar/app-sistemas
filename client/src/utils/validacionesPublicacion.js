
export const MIN_DESCRIPCION = 12; 
export const MAX_DESCRIPCION = 5000;
export const FECHA_MINIMA = '2000-01-01';

const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


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
  const texto = (valor ?? '').trim();
  if (texto.length < MIN_DESCRIPCION) return 'Sumá una descripción un poco más completa';
  if (texto.length > MAX_DESCRIPCION) return `La descripción no puede superar los ${MAX_DESCRIPCION} caracteres`;
  return '';
};


export const analizarContacto = (valor) => {
  const texto = (valor ?? '').trim();
  if (!texto) return { tipo: null, error: 'Agregá un contacto' };
  if (REGEX_EMAIL.test(texto)) return { tipo: 'EML', error: '' };
  if (texto.includes('@') && !/\s/.test(texto)) return { tipo: null, error: 'Ingresá un email válido' };
  if (normalizarTelefonoAR(texto)) return { tipo: 'TEL', error: '' };
  return {
    tipo: null,
    error: 'Ingresá un email o un teléfono argentino válido, con código de área (ej: 11 5555-1234)'
  };
};