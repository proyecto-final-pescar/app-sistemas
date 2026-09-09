import prisma from '../../prisma/client.js';

// Devuelve la lista de categorías de servicio válidas, leyendo directo de la tabla.
export const obtenerCategoriasServicio = async (req, res) => {
  try {
    const categorias = await prisma.categoria_servicio.findMany({
      select: { nombre: true },
      orderBy: { nombre: 'asc' }
    });

    return res.status(200).json({
      success: true,
      data: categorias.map((c) => c.nombre)
    });
  } catch (error) {
    console.error('Error en GET /constantes/categorias-servicio:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// Devuelve la lista de especialidades válidas, leyendo directo de la tabla.
export const obtenerEspecialidades = async (req, res) => {
  try {
    const especialidades = await prisma.especialidad.findMany({
      select: { nombre: true },
      orderBy: { nombre: 'asc' }
    });

    return res.status(200).json({
      success: true,
      data: especialidades.map((e) => e.nombre)
    });
  } catch (error) {
    console.error('Error en GET /constantes/especialidades:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const obtenerEspecies = async (req, res) => {
  try {
    const especies = await prisma.especie.findMany({
      select: { nombre: true },
      orderBy: { nombre: 'asc' }
    });
    return res.status(200).json({ success: true, data: especies.map((e) => e.nombre) });
  } catch (error) {
    console.error('Error en GET /constantes/especies:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const obtenerRazas = async (req, res) => {
  try {
    const { especie } = req.query;
    const razas = await prisma.raza.findMany({
      where: especie
        ? { especie: { nombre: { equals: especie, mode: 'insensitive' } } }
        : undefined,
      select: { nombre: true },
      orderBy: { nombre: 'asc' }
    });
    return res.status(200).json({ success: true, data: razas.map((r) => r.nombre) });
  } catch (error) {
    console.error('Error en GET /constantes/razas:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const obtenerSexosMascota = async (req, res) => {
  try {
    const sexos = await prisma.sexo_mascota.findMany({
      select: { nombre: true },
      orderBy: { nombre: 'asc' }
    });
    return res.status(200).json({ success: true, data: sexos.map((s) => s.nombre) });
  } catch (error) {
    console.error('Error en GET /constantes/sexos-mascota:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};