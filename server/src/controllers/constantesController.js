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