import sanitizeHtml from 'sanitize-html';

const decodificarEntidades = (texto) =>
  texto
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&'); // &amp; siempre al final

export const sanitizeText = (value) => {
  if (typeof value !== 'string') return value;

  const limpio = sanitizeHtml(value, { allowedTags: [], allowedAttributes: {} });
  return decodificarEntidades(limpio).trim();
};