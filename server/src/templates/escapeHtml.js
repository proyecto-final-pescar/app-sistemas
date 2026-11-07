/**
 * Escapa caracteres especiales de HTML para evitar que datos cargados
 * por el usuario (nombres, motivos, etc.) rompan la estructura del email
 * o inyecten markup no deseado.
 * @param {string} texto
 * @returns {string}
 */
export function escapeHtml(texto = '') {
  return String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}