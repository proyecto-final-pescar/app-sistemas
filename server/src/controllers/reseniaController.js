
import { Prisma } from '@prisma/client';
import prisma from '../../prisma/client.js'; 

//  validar formato UUID 
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// POST /veterinarias/:id/resenas  { valor: 1..5 }
export const calificarVeterinaria = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;
    const valor = Number(req.body.valor);

    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ message: 'El id de la veterinaria no es válido' });
    }

    if (!Number.isFinite(valor) || valor < 1 || valor > 5) {
      return res.status(400).json({ message: 'valor debe ser un número entre 1 y 5' });
    }

    const veterinaria = await prisma.veterinaria.findFirst({
      where: { veterinaria_id: id, estado_veterinaria_id: 'ACT' },
      select: { veterinaria_id: true },
    });

    if (!veterinaria) {
      return res.status(404).json({ message: 'El recurso no existe.' });
    }

    await prisma.resena.upsert({
      where: {
        veterinaria_id_usuario_id: {
          veterinaria_id: id,
          usuario_id: usuarioId,
        },
      },
      update: { valor },
      create: {
        veterinaria_id: id,
        usuario_id: usuarioId,
        valor,
      },
    });

    const [agregado] = await prisma.$queryRaw`
      SELECT rating, cantidad_resenias
      FROM vw_rating_veterinaria
      WHERE veterinaria_id = ${id}::uuid
    `;

    const rating = agregado ? Number(agregado.rating) : 0;
    const cantidadResenias = agregado ? Number(agregado.cantidad_resenias) : 0;

    return res.status(200).json({
      success: true,
      data: {
        miCalificacion: valor,
        rating,
        cantidadResenias,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === 'P2023' || error.code === 'P2003')
    ) {
      return res.status(400).json({ message: 'El id de la veterinaria no es válido' });
    }
    console.error('Error en POST /veterinarias/:id/resenas:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /veterinarias/:id/mi-resena
export const obtenerMiResena = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;

    if (!UUID_REGEX.test(id)) {
      return res.status(400).json({ message: 'El id de la veterinaria no es válido' });
    }

    const resenia = await prisma.resena.findUnique({
      where: {
        veterinaria_id_usuario_id: {
          veterinaria_id: id,
          usuario_id: usuarioId,
        },
      },
      select: { valor: true },
    });

    return res.status(200).json({
      success: true,
      data: resenia ? resenia.valor : null,
    });
  } catch (error) {
    console.error('Error en GET /veterinarias/:id/mi-resena:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};