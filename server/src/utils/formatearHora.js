// utils/formatearHora.js
export const formatearHora = (horaDate) => {
  if (!horaDate) return null
  return horaDate.toISOString().slice(11, 16) // "1970-01-01T09:00:00.000Z" → "09:00"
}