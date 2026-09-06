// server/src/utils/catalogos.js
import prisma from '../../prisma/client.js';

const capitalizar = (texto) =>
  texto.trim().charAt(0).toUpperCase() + texto.trim().slice(1).toLowerCase();

export const resolverEspecialidadId = async (nombre) => {
  const especialidad = await prisma.especialidad.findFirst({
    where: { nombre: { equals: (nombre || '').trim(), mode: 'insensitive' } },
    select: { especialidad_id: true }
  });
  return especialidad?.especialidad_id ?? null;
};

export const resolverCategoriaServicioId = async (nombre) => {
  const categoria = await prisma.categoria_servicio.findFirst({
    where: { nombre: { equals: (nombre || '').trim(), mode: 'insensitive' } },
    select: { categoria_servicio_id: true }
  });
  return categoria?.categoria_servicio_id ?? null;
};

export const resolverDiaSemanaId = async (nombreDia) => {
  const dia = await prisma.dia_semana.findFirst({
    where: { nombre: { equals: capitalizar(nombreDia), mode: 'insensitive' } },
    select: { dia_semana_id: true }
  });
  return dia?.dia_semana_id ?? null;
};