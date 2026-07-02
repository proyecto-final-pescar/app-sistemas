import Turno from '../models/Turno.js';

// protege la ruta: solo el usuario dueño del turno (quien lo reservó) puede cancelarlo.

export const ownerTurno = async (req, res, next) => {
  try {
    const { id } = req.params;
    const turno = await Turno.findById(id);

    if (!turno) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }

    if (!req.user || turno.usuarioId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'No tenés permiso para modificar este turno' });
    }

    req.turno = turno;
    next();
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'El id del turno no es válido' });
    }
    console.error('Error en middleware ownerTurno:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }

};