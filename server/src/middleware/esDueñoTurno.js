import Turno from '../models/Turno.js';

// protege la ruta: solo el usuario dueño del turno (quien lo reservó) puede cancelarlo.

export const esDueñoTurno = async (req, res, next) => {
  try {
    const { id } = req.params;
    const turno = await Turno.findById(id);

    if (!turno) {
      return res.status(404).json({ mensaje: 'Turno no encontrado' });
    }

    // req.user debe venir seteado por tu middleware de autenticación
    if (!req.user || turno.usuarioId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ mensaje: 'No tenés permiso para modificar este turno' });
    }

    req.turno = turno; // ya cargado, evita volver a buscarlo en el controller
    next();
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al validar permisos', error: error.message });
  }
};