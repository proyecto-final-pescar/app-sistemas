//migradooo
import prisma from '../../prisma/client.js';
import { enviarEmail } from '../utils/mailer.js';
import { armarEmailPublicacionDadaDeBaja } from '../templates/emailPublicacionDadaDeBaja.js';

const ESTADOS_PUBLICACION = ['ACT', 'CER'];
const TIPOS_CONTACTO = ['TEL', 'EML'];
const LIMITES = { nombre: 100, descripcion: 5000, contacto: 150 };
const UMBRAL_OCULTAMIENTO_REPORTES = 2;


const esIdInvalido = (error) =>
  error.code === 'P2023' ||
  (typeof error.message === 'string' && error.message.includes('invalid input syntax for type uuid'));

const validarLongitudes = (campos) => {
  for (const [campo, valor] of Object.entries(campos)) {
    if (typeof valor === 'string' && valor.length > LIMITES[campo]) {
      return `El campo ${campo} no puede superar los ${LIMITES[campo]} caracteres`;
    }
  }
  return null;
};
// Devuelve los ids de publicaciones con >= UMBRAL_OCULTAMIENTO_REPORTES reportes pendientes
const obtenerIdsOcultosPorReportes = async () => {
  const grupos = await prisma.reporte.groupBy({
    by: ['publicacion_id'],
    where: { estado_reporte_id: 'PEN' },
    _count: { reporte_id: true },
    having: {
      reporte_id: { _count: { gte: UMBRAL_OCULTAMIENTO_REPORTES } }
    }
  });

  return grupos.map((g) => g.publicacion_id);
};

const INCLUDE_PUBLICACION = {
  usuario: { select: { usuario_id: true, nombre: true, apellido: true, email: true } },
  zona: { select: { zona_id: true, nombre: true } }
};

// GET /publicaciones: devuelve todas las publicaciones 

export const obtenerPublicaciones = async (req, res) => {
  try {
    const { zonaId, estado } = req.query;
    const usuarioId = req.user.id;
    const esAdmin = req.user.rol === 'administrador';

    const filtros = {};

    if (zonaId) {
      const zonaIdNum = parseInt(zonaId, 10);
      if (Number.isNaN(zonaIdNum)) {
        return res.status(400).json({ message: 'El parámetro zonaId no es válido' });
      }
      filtros.zona_id = zonaIdNum;
    }

    if (estado) {
      if (!ESTADOS_PUBLICACION.includes(estado)) {
        return res.status(400).json({ message: 'El parámetro estado debe ser "ACT" o "CER"' });
      }
      filtros.estado_publicacion_id = estado;
    }

    // Oculta del listado las publicaciones con demasiados reportes pendientes (+2)
    //el dueño sigue viendo las suyas aunque esten ocultas
    // para el resto de los usuarios.
    let idsOcultos = [];

    if (!esAdmin) {
      idsOcultos = await obtenerIdsOcultosPorReportes();

      if (idsOcultos.length > 0) {
        filtros.OR = [
          { publicacion_id: { notIn: idsOcultos } },
          { usuario_id: usuarioId, publicacion_id: { in: idsOcultos } }
        ];
      }
    }

    const publicacionesDb = await prisma.publicacion.findMany({
      where: filtros,
      include: INCLUDE_PUBLICACION,
      orderBy: { created_at: 'desc' }
    });

    const publicaciones = publicacionesDb.map((pub) => ({
      ...pub,
      en_revision: idsOcultos.includes(pub.publicacion_id)
    }));

    res.status(200).json({ success: true, data: publicaciones });
  } catch (error) {
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
// GET /publicaciones/:id: devuelve el detalle de una publicación
export const obtenerPublicacionPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const publicacion = await prisma.publicacion.findUnique({
      where: { publicacion_id: id },
      include: INCLUDE_PUBLICACION
    });

    if (!publicacion) {
      return res.status(404).json({ message: 'El recurso no existe.' });
    }

    res.status(200).json({ success: true, data: publicacion });
  } catch (error) {
    if (esIdInvalido(error)) {
      return res.status(400).json({ message: 'El id de la publicación no es válido' });
    }
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /publicaciones: crea una nueva publicación
export const crearPublicacion = async (req, res) => {
  try {
  
    const usuarioId = req.user.id; 
    const { foto, nombre, zona, descripcion, fecha, contacto, tipoContacto } = req.body;
        
    if (!foto || !zona || !descripcion || !fecha || !contacto || !tipoContacto) {
      return res.status(400).json({
        message: 'Los campos foto, zona, descripción, fecha, contacto y tipoContacto son requeridos'
      });
    }

    if (!TIPOS_CONTACTO.includes(tipoContacto)) {
      return res.status(400).json({ message: 'El tipo de contacto no es válido' });
    }

    const zonaId = parseInt(zona, 10);
    if (Number.isNaN(zonaId)) {
      return res.status(400).json({ message: 'La zona ingresada no es válida' });
    }

    const fechaParseada = new Date(fecha);
    if (Number.isNaN(fechaParseada.getTime())) {
      return res.status(400).json({ message: 'La fecha ingresada no es válida' });
    }

    const errorLongitud = validarLongitudes({ nombre, descripcion, contacto });
    if (errorLongitud) {
      return res.status(400).json({ message: errorLongitud });
    }

    const nuevaPublicacion = await prisma.publicacion.create({
      data: {
        foto,
        nombre,
        zona_id: zonaId,
        descripcion,
        fecha: fechaParseada,
        contacto,
        tipo_contacto_id: tipoContacto,
        usuario_id: usuarioId
        // estado_publicacion_id arranca en 'ACT' por defecto
      },
      include: INCLUDE_PUBLICACION
    });

    res.status(201).json({ success: true, data: nuevaPublicacion });
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'La zona indicada no existe' });
    }
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PUT /publicaciones/:id: actualiza una publicación (solo el dueño o admin)
export const actualizarPublicacion = async (req, res) => {
  try {
    const { id } = req.params;
   const usuarioId = req.user.id;
    const esAdmin = req.user.rol === 'administrador';

    const publicacion = await prisma.publicacion.findUnique({ where: { publicacion_id: id } });

    if (!publicacion) {
      return res.status(404).json({ message: 'El recurso no existe.' });
    }

    if (publicacion.usuario_id !== usuarioId && !esAdmin) {
      return res.status(403).json({ message: 'No tenés permiso para editar esta publicación' });
    }

    const { foto, nombre, zona, descripcion, fecha, contacto, tipoContacto, estado } = req.body;

    const errorLongitud = validarLongitudes({ nombre, descripcion, contacto });
    if (errorLongitud) {
      return res.status(400).json({ message: errorLongitud });
    }

    const data = {};

    if (foto !== undefined) data.foto = foto;
    if (nombre !== undefined) data.nombre = nombre;
    if (descripcion !== undefined) data.descripcion = descripcion;
    if (contacto !== undefined) data.contacto = contacto;

    if (zona !== undefined) {
      const zonaId = parseInt(zona, 10);
      if (Number.isNaN(zonaId)) {
        return res.status(400).json({ message: 'La zona ingresada no es válida' });
      }
      data.zona_id = zonaId;
    }

    if (fecha !== undefined) {
      const fechaParseada = new Date(fecha);
      if (Number.isNaN(fechaParseada.getTime())) {
        return res.status(400).json({ message: 'La fecha ingresada no es válida' });
      }
      data.fecha = fechaParseada;
    }

    if (tipoContacto !== undefined) {
      if (!TIPOS_CONTACTO.includes(tipoContacto)) {
        return res.status(400).json({ message: 'El tipo de contacto no es válido' });
      }
      data.tipo_contacto_id = tipoContacto;
    }

    if (estado !== undefined) {
      if (!ESTADOS_PUBLICACION.includes(estado)) {
        return res.status(400).json({ message: 'El estado debe ser "ACT" o "CER"' });
      }
      data.estado_publicacion_id = estado;
    }

    const publicacionActualizada = await prisma.publicacion.update({
      where: { publicacion_id: id },
      data,
      include: INCLUDE_PUBLICACION
    });

    res.status(200).json({ success: true, data: publicacionActualizada });
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'La zona indicada no existe' });
    }
    if (esIdInvalido(error)) {
      return res.status(400).json({ message: 'El id de la publicación no es válido' });
    }
    
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PATCH /publicaciones/:id/estado: cambia el estado a "ACT" (activa) o "CER" (cerrada / encontrada)
export const cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
   const usuarioId = req.user.id;
    const esAdmin = req.user.rol === 'administrador';
    const { estado } = req.body;

    if (!estado || !ESTADOS_PUBLICACION.includes(estado)) {
      return res.status(400).json({ message: 'El estado debe ser "ACT" (activa) o "CER" (cerrada)' });
    }

    const publicacion = await prisma.publicacion.findUnique({ where: { publicacion_id: id } });

    if (!publicacion) {
      return res.status(404).json({ message: 'El recurso no existe.' });
    }

    if (publicacion.usuario_id !== usuarioId && !esAdmin) {
      return res.status(403).json({ message: 'No tenés permiso para cambiar el estado de esta publicación' });
    }

    const publicacionActualizada = await prisma.publicacion.update({
      where: { publicacion_id: id },
      data: { estado_publicacion_id: estado },
      include: INCLUDE_PUBLICACION
    });

    res.status(200).json({ success: true, data: publicacionActualizada });
  } catch (error) {
    if (esIdInvalido(error)) {
      return res.status(400).json({ message: 'El id de la publicación no es válido' });
    }
   
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE /publicaciones/:id: elimina una publicación (solo el dueño o admin)
export const eliminarPublicacion = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;
    const esAdmin = req.user.rol === 'administrador';

    const publicacion = await prisma.publicacion.findUnique({
      where: { publicacion_id: id },
      include: { usuario: { select: { usuario_id: true, nombre: true, apellido: true, email: true } } }
    });

    if (!publicacion) {
      return res.status(404).json({ message: 'El recurso no existe.' });
    }

    const esPropietario = publicacion.usuario_id === usuarioId;

    if (!esPropietario && !esAdmin) {
      return res.status(403).json({ message: 'No tenés permiso para eliminar esta publicación' });
    }

    const esBajaPorModeracion = esAdmin && !esPropietario;

  
    // No se puede borrar la publicacion si tiene reportes relacionados (fk), asi que se
    // eliminan junto con la publicación dentro de una transaccion
    const reportesPendientes = esBajaPorModeracion
      ? await prisma.reporte.findMany({
          where: { publicacion_id: id, estado_reporte_id: 'PEN' },
          include: { motivo_reporte: { select: { nombre: true } } }
        })
      : [];

    await prisma.$transaction([
      prisma.reporte.deleteMany({ where: { publicacion_id: id } }),
      prisma.publicacion.delete({ where: { publicacion_id: id } })
    ]);

    if (esBajaPorModeracion && publicacion.usuario?.email) {
      try {
        const motivo = reportesPendientes[0]?.motivo_reporte?.nombre;
        const nombreCompleto = `${publicacion.usuario.nombre} ${publicacion.usuario.apellido}`;
        const { subject, html } = armarEmailPublicacionDadaDeBaja(nombreCompleto, motivo);
        await enviarEmail({ to: publicacion.usuario.email, subject, html });
      } catch (emailError) {
        console.error('Error al enviar email de publicación dada de baja:', emailError);
      }
    }

    res.status(200).json({ success: true, message: 'Publicación eliminada correctamente' });
  } catch (error) {
    if (esIdInvalido(error)) {
      return res.status(400).json({ message: 'El id de la publicación no es válido' });
    }
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};