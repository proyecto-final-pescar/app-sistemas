import Publicacion from '../models/Publicacion.js';

// GET /publicaciones: devuelve todas las publicaciones (con filtros opcionales)
export const obtenerPublicaciones = async (req, res) => {
  try {
    const { zona, estado } = req.query;

    const filtros = {};
    if (zona) filtros.zona = zona;
    if (estado) filtros.estado = estado;

    const publicaciones = await Publicacion.find(filtros)
      .populate('usuarioId', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, data: publicaciones });
  } catch (error) {
    console.error('Error en GET /publicaciones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /publicaciones/:id: devuelve el detalle de una publicación
export const obtenerPublicacionPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const publicacion = await Publicacion.findById(id)
      .populate('usuarioId', 'name email');

    if (!publicacion) {
      return res.status(404).json({ message: 'El recurso no existe.' });
    }

    res.status(200).json({ success: true, data: publicacion });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'El id de la publicación no es válido' });
    }
    console.error('Error en GET /publicaciones/:id:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /publicaciones: crea una nueva publicación
export const crearPublicacion = async (req, res) => {
  try {
    const usuarioId = req.user.id;

    const { foto, nombre, zona, descripcion, fecha, contacto } = req.body;

    if (!foto || !zona || !descripcion || !fecha || !contacto) {
      return res.status(400).json({
        message: 'Los campos foto, zona, descripción, fecha y contacto son requeridos'
      });
    }

    const nuevaPublicacion = new Publicacion({
      foto,
      nombre,
      zona,
      descripcion,
      fecha,
      contacto,
      usuarioId
      // estado arranca en 'activa' por defecto
    });

    const publicacionGuardada = await nuevaPublicacion.save();

    res.status(201).json({ success: true, data: publicacionGuardada });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Datos inválidos', error: error.message });
    }
    console.error('Error en POST /publicaciones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PUT /publicaciones/:id: actualiza una publicación (solo el dueño o admin)
export const actualizarPublicacion = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;
    const esAdmin = req.user.role === 'administrador';

    const publicacion = await Publicacion.findById(id);

    if (!publicacion) {
      return res.status(404).json({ message: 'El recurso no existe.' });
    }

    if (publicacion.usuarioId.toString() !== usuarioId && !esAdmin) {
      return res.status(403).json({ message: 'No tenés permiso para editar esta publicación' });
    }

    const camposPermitidos = ['foto', 'nombre', 'zona', 'descripcion', 'fecha', 'contacto', 'estado'];

    camposPermitidos.forEach((campo) => {
      if (req.body[campo] !== undefined) {
        publicacion[campo] = req.body[campo];
      }
    });

    const publicacionActualizada = await publicacion.save();

    res.status(200).json({ success: true, data: publicacionActualizada });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'Datos inválidos', error: error.message });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'El id de la publicación no es válido' });
    }
    console.error('Error en PUT /publicaciones/:id:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PATCH /publicaciones/:id/estado: cambia el estado a "activa" o "cerrada"
export const cambiarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;
    const esAdmin = req.user.role === 'administrador';
    const { estado } = req.body;

    if (!estado || !['activa', 'cerrada'].includes(estado)) {
      return res.status(400).json({ message: 'El estado debe ser "activa" o "cerrada"' });
    }

    const publicacion = await Publicacion.findById(id);

    if (!publicacion) {
      return res.status(404).json({ message: 'El recurso no existe.' });
    }

    if (publicacion.usuarioId.toString() !== usuarioId && !esAdmin) {
      return res.status(403).json({ message: 'No tenés permiso para cambiar el estado de esta publicación' });
    }

    publicacion.estado = estado;
    const publicacionActualizada = await publicacion.save();

    res.status(200).json({ success: true, data: publicacionActualizada });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'El id de la publicación no es válido' });
    }
    console.error('Error en PATCH /publicaciones/:id/estado:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE /publicaciones/:id: elimina una publicación (solo el dueño o admin)
export const eliminarPublicacion = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;
    const esAdmin = req.user.role === 'administrador';

    const publicacion = await Publicacion.findById(id);

    if (!publicacion) {
      return res.status(404).json({ message: 'El recurso no existe.' });
    }

    if (publicacion.usuarioId.toString() !== usuarioId && !esAdmin) {
      return res.status(403).json({ message: 'No tenés permiso para eliminar esta publicación' });
    }

    await publicacion.deleteOne();

    res.status(200).json({ success: true, message: 'Publicación eliminada correctamente' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'El id de la publicación no es válido' });
    }
    console.error('Error en DELETE /publicaciones/:id:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};