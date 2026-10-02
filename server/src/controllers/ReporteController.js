//migrado
import prisma from '../../prisma/client.js'; 

const MOTIVOS_REPORTE = ['INA', 'FAL', 'SPM', 'ENC', 'DUP', 'OTR'];
const ESTADOS_REPORTE = ['PEN', 'REV', 'DES'];
const LIMITE_DESCRIPCION = 300;

const esIdInvalido = (error) =>
  error.code === 'P2023' ||
  (typeof error.message === 'string' && error.message.includes('invalid input syntax for type uuid'));

const SELECT_PUBLICACION = {
  publicacion_id: true,
  nombre: true,
  foto: true,
  estado_publicacion_id: true,
  descripcion: true,
  contacto: true,
  tipo_contacto_id: true,
  zona: { select: { zona_id: true, nombre: true } }
};
const SELECT_USUARIO = { usuario_id: true, nombre: true, apellido: true, email: true };

// GET /reportes/resumen: agrupa los reportes por publicacion (cantidad total y pendientes) — solo admin
export const obtenerResumenReportes = async (req, res) => {
  try {
    const resumen = await prisma.reporte.groupBy({
      by: ['publicacion_id'],
      where: { estado_reporte_id: 'PEN' },
      _count: { reporte_id: true },
      _max: { created_at: true },
      orderBy: [
        { _count: { reporte_id: 'desc' } },
        { _max: { created_at: 'desc' } }
      ]
    });

    const publicacionIds = resumen.map((r) => r.publicacion_id);
    const publicaciones = await prisma.publicacion.findMany({
      where: { publicacion_id: { in: publicacionIds } },
      select: {
        ...SELECT_PUBLICACION,
        created_at: true,
        usuario: { select: SELECT_USUARIO }
      }
    });

    const publicacionesPorId = publicaciones.reduce((acc, pub) => {
      acc[pub.publicacion_id] = pub;
      return acc;
    }, {});

    const data = resumen.map((r) => ({
      publicacion: publicacionesPorId[r.publicacion_id] || null,
      publicacionId: r.publicacion_id,
      cantidadReportes: r._count.reporte_id,
      ultimoReporte: r._max.created_at
    }));

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error en GET /reportes/resumen:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /reportes: devuelve todos los reportes
export const obtenerReportes = async (req, res) => {
  try {
    const { estado, publicacionId } = req.query;

    const filtros = {};
    if (publicacionId) filtros.publicacion_id = publicacionId;

    if (estado) {
      if (!ESTADOS_REPORTE.includes(estado)) {
        return res.status(400).json({ message: 'El parámetro estado debe ser "PEN", "REV" o "DES"' });
      }
      filtros.estado_reporte_id = estado;
    } else if (publicacionId) {
      filtros.estado_reporte_id = 'PEN';
    }

    const reportes = await prisma.reporte.findMany({
      where: filtros,
      include: {
        publicacion: { select: SELECT_PUBLICACION },
        usuario: { select: SELECT_USUARIO }
      },
      orderBy: { created_at: 'desc' }
    });

    res.status(200).json({ success: true, data: reportes });
  } catch (error) {
    if (esIdInvalido(error)) {
      return res.status(400).json({ message: 'El id de la publicación no es válido' });
    }
    console.error('Error en GET /reportes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /reportes/:id: devuelve el detalle de un reporte — solo admin
export const obtenerReportePorId = async (req, res) => {
  try {
    const { id } = req.params;

    const reporte = await prisma.reporte.findUnique({
      where: { reporte_id: id },
      include: {
        publicacion: { select: SELECT_PUBLICACION },
        usuario: { select: SELECT_USUARIO }
      }
    });

    if (!reporte) {
      return res.status(404).json({ message: 'El recurso no existe.' });
    }

    res.status(200).json({ success: true, data: reporte });
  } catch (error) {
    if (esIdInvalido(error)) {
      return res.status(400).json({ message: 'El id del reporte no es válido' });
    }
    console.error('Error en GET /reportes/:id:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /reportes: crea un nuevo reporte sobre una publicacion
export const crearReporte = async (req, res) => {
  try {
   const usuarioId = req.user.id;
    const { publicacionId, motivo } = req.body;
    const descripcion = typeof req.body.descripcion === 'string' ? req.body.descripcion.trim() : '';

    if (!publicacionId || !motivo) {
      return res.status(400).json({
        message: 'Los campos publicacionId y motivo son requeridos'
      });
    }

    if (!MOTIVOS_REPORTE.includes(motivo)) {
      return res.status(400).json({ message: 'El motivo indicado no es válido' });
    }

    if (motivo === 'OTR' && !descripcion) {
      return res.status(400).json({
        message: 'La descripción es requerida cuando el motivo es "otro"'
      });
    }

    if (descripcion.length > LIMITE_DESCRIPCION) {
      return res.status(400).json({
        message: `La descripción no puede superar los ${LIMITE_DESCRIPCION} caracteres`
      });
    }

    const publicacion = await prisma.publicacion.findUnique({ where: { publicacion_id: publicacionId } });

    if (!publicacion) {
      return res.status(404).json({ message: 'La publicación que intentás reportar no existe.' });
    }

    if (publicacion.usuario_id === usuarioId) {
      return res.status(400).json({ message: 'No podés reportar tu propia publicación' });
    }

    const nuevoReporte = await prisma.reporte.create({
      data: {
        publicacion_id: publicacionId,
        motivo_reporte_id: motivo,
        descripcion: descripcion || null,
        usuario_id: usuarioId
        // estado_reporte_id arranca en 'PEN' por defecto
      }
    });

    res.status(201).json({ success: true, data: nuevoReporte });
  } catch (error) {
    if (error.code === 'P2002') {
      return res.status(400).json({ message: 'Ya reportaste esta publicación' });
    }
    if (esIdInvalido(error)) {
      return res.status(400).json({ message: 'El id de la publicación no es válido' });
    }
    console.error('Error en POST /reportes:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PATCH /reportes/:id/estado: cambia el estado del reporte — solo admin
export const cambiarEstadoReporte = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!estado || !ESTADOS_REPORTE.includes(estado)) {
      return res.status(400).json({ message: 'El estado debe ser "PEN", "REV" o "DES"' });
    }

    const reporte = await prisma.reporte.findUnique({ where: { reporte_id: id } });

    if (!reporte) {
      return res.status(404).json({ message: 'El recurso no existe.' });
    }

    const reporteActualizado = await prisma.reporte.update({
      where: { reporte_id: id },
      data: { estado_reporte_id: estado }
    });

    res.status(200).json({ success: true, data: reporteActualizado });
  } catch (error) {
    if (esIdInvalido(error)) {
      return res.status(400).json({ message: 'El id del reporte no es válido' });
    }
    console.error('Error en PATCH /reportes/:id/estado:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PATCH /reportes/publicacion/:publicacionId/descartar: descarta todos los reportes
// pendientes de una publicación sin tocar la publicación — solo admin
export const descartarReportesDePublicacion = async (req, res) => {
  try {
    const { publicacionId } = req.params;

    const publicacion = await prisma.publicacion.findUnique({ where: { publicacion_id: publicacionId } });
    if (!publicacion) {
      return res.status(404).json({ message: 'El recurso no existe.' });
    }

    const resultado = await prisma.reporte.updateMany({
      where: { publicacion_id: publicacionId, estado_reporte_id: 'PEN' },
      data: { estado_reporte_id: 'DES' }
    });

    res.status(200).json({
      success: true,
      message: 'Reportes descartados correctamente',
      modificados: resultado.count
    });
  } catch (error) {
    if (esIdInvalido(error)) {
      return res.status(400).json({ message: 'El id de la publicación no es válido' });
    }
    console.error('Error en PATCH /reportes/publicacion/:publicacionId/descartar:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE /reportes/:id: elimina un reporte — solo admin
export const eliminarReporte = async (req, res) => {
  try {
    const { id } = req.params;

    const reporte = await prisma.reporte.findUnique({ where: { reporte_id: id } });

    if (!reporte) {
      return res.status(404).json({ message: 'El recurso no existe.' });
    }

    await prisma.reporte.delete({ where: { reporte_id: id } });

    res.status(200).json({ success: true, message: 'Reporte eliminado correctamente' });
  } catch (error) {
    if (esIdInvalido(error)) {
      return res.status(400).json({ message: 'El id del reporte no es válido' });
    }
    console.error('Error en DELETE /reportes/:id:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};