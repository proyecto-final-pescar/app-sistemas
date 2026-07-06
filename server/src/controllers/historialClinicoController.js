import mongoose from 'mongoose';
import HistorialClinico from '../models/HistorialClinico.js';
import Mascota from '../models/Mascota.js';
import Veterinaria from '../models/Veterinaria.js';

export const crearHistorialClinico = async (req, res) => {
  try {
    const {
      mascotaId,
      profesionalId,
      turnoId,
      fecha,
      hora,
      categoriaServicio,
      estado,
      motivoConsulta,
      anotaciones,
      monto,
      urlPdf
    } = req.body;

    if (!mongoose.Types.ObjectId.isValid(mascotaId)) {
      return res.status(400).json({ message: 'mascota inválida' });
    }

    if (!profesionalId || !mongoose.Types.ObjectId.isValid(profesionalId)) {
      return res.status(400).json({ message: 'profesional inválido' });
    }

    const mascota = await Mascota.findById(mascotaId);
    if (!mascota) {
      return res.status(404).json({ message: 'Mascota no encontrada' });
    }

    if (turnoId && !mongoose.Types.ObjectId.isValid(turnoId)) {
      return res.status(400).json({ message: 'turno inválido' });
    }

    const veterinaria = await Veterinaria.findOne({ usuarioId: req.user.id });

    if (!veterinaria) {
      return res.status(404).json({
        message: 'No se encontró una veterinaria asociada a este usuario'
      });
    }

    // Validar que el profesional exista dentro del listado de la veterinaria
    const profesional = veterinaria.profesionales.id(profesionalId);

    if (!profesional) {
      return res.status(404).json({
        message: 'El profesional seleccionado no pertenece a esta veterinaria'
      });
    }

    const nuevoHistorial = new HistorialClinico({
      mascotaId,
      usuarioId: mascota.dueñoId,
      profesionalId: profesional._id,
      veterinariaId: veterinaria._id,
      turnoId: turnoId || undefined,
      fecha,
      hora,
      categoriaServicio,
      estado,
      motivoConsulta,
      anotaciones,
      monto,
      urlPdf
    });

    await nuevoHistorial.save();

    return res.status(201).json({
      message: 'Historial clínico creado correctamente',
      historial: nuevoHistorial
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: 'Error de validación', errores });
    }
    console.error('Error al crear historial clínico:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};