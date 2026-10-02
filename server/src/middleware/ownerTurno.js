import prisma from '../../prisma/client.js';

// Protege la ruta: solo el dueño de la mascota del turno, o la
// veterinaria a la que pertenece el turno, pueden cancelarlo.
export const ownerTurno = async (req, res, next) => {
  try {
    const { id } = req.params;

    const turno = await prisma.turno.findUnique({
      where: { turno_id: id },
      include: { mascota: true, veterinaria: true }
    });

    if (!turno) {
      return res.status(404).json({ message: 'Turno no encontrado' });
    }

    const esDueño = turno.mascota?.dueno_id === req.user?.id;
    const esVeterinaria = turno.veterinaria.usuario_id === req.user?.id;

    if (!req.user || (!esDueño && !esVeterinaria)) {
      return res.status(403).json({ message: 'No tenés permiso para modificar este turno' });
    }

    req.turno = turno;
    next();
  } catch (error) {
    if (error.code === 'P2023') {
      return res.status(400).json({ message: 'El id del turno no es válido' });
    }
    console.error('Error en middleware ownerTurno:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};