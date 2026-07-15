import mongoose from 'mongoose';
import HistorialClinico from '../models/HistorialClinico.js';
import Mascota from '../models/Mascota.js';
import Veterinaria from '../models/Veterinaria.js';
import FichaMedica from '../models/FichaMedica.js';

export const obtenerHistorialClinico = async (req, res) => {
  try {
    const mascotaId = req.params.mascotaId || req.params.id;
    const filtro = { mascotaId };

    if (req.historialAccess?.rol === 'veterinaria') {
      filtro.veterinariaId = req.historialAccess.veterinariaId;
    }

    const historial = await HistorialClinico.find(filtro)
      .populate('veterinariaId', 'nombre')
      .populate('profesionalId', 'name')
      .sort({ fecha: -1, hora: -1 });

    return res.status(200).json({ success: true, data: historial })
  } catch (error) {
    console.error('Error en GET /historial/:mascotaId:', error);
    return res.status(500).json({ message: 'Error al obtener el historial clínico' });
  }
};

export const obtenerEntradaHistorialClinico = async (req, res) => {
  try {
    return res.status(200).json({ success: true, data: req.entradaHistorial })
  } catch (error) {
    console.error('Error en GET /historial/entrada/:id:', error);
    return res.status(500).json({ message: 'Error al obtener la entrada del historial clínico' });
  }
};

export const crearHistorialClinico = async (req, res) => {
  try {
    const {
      mascotaId,
      profesionalId,
      turnoId,
      fecha,
      hora,
      categoriaServicio,
      motivoConsulta,
      anotaciones,
      monto,
      urlPdf
    } = req.body;

    const categoriasValidas = ['Vacunación', 'Control', 'Consulta', 'Cirugía'];
    const estadosValidos = ['Completado', 'Con seguimiento', 'Pendiente'];


    if (!mascotaId || !mongoose.Types.ObjectId.isValid(mascotaId)) {
      return res.status(400).json({ message: 'La mascota es inválida' });
    }

    if (!profesionalId || !mongoose.Types.ObjectId.isValid(profesionalId)) {
      return res.status(400).json({ message: 'El profesional es inválido' });
    }

    if (turnoId && !mongoose.Types.ObjectId.isValid(turnoId)) {
      return res.status(400).json({ message: 'El turno es inválido' });
    }

    // Validación de fecha
    if (!fecha) {
      return res.status(400).json({ message: 'La fecha del turno es requerida' });
    }

    const fechaValida = new Date(fecha);

    if (Number.isNaN(fechaValida.getTime())) {
      return res.status(400).json({ message: 'La fecha ingresada no es válida' });
    }

    // Validación de hora: formato HH:MM
    if (!hora || typeof hora !== 'string') {
      return res.status(400).json({ message: 'La hora del turno es requerida' });
    }

    const formatoHoraValido = /^([01]\d|2[0-3]):([0-5]\d)$/;

    if (!formatoHoraValido.test(hora.trim())) {
      return res.status(400).json({
        message: 'La hora debe tener formato HH:MM'
      });
    }

    // Validación de categoría
    if (!categoriaServicio) {
      return res.status(400).json({
        message: 'La categoría del servicio es requerida'
      });
    }

    if (!categoriasValidas.includes(categoriaServicio)) {
      return res.status(400).json({
        message: 'La categoría de servicio no es válida',
        categoriasValidas
      });
    }

    // Validación de textos requeridos
    if (!motivoConsulta || typeof motivoConsulta !== 'string' || !motivoConsulta.trim()) {
      return res.status(400).json({
        message: 'El motivo del turno es requerido'
      });
    }

    if (!anotaciones || typeof anotaciones !== 'string' || !anotaciones.trim()) {
      return res.status(400).json({
        message: 'Las anotaciones médicas son requeridas'
      });
    }

    // Validación de monto
    if (monto !== undefined && monto !== null) {
      if (typeof monto !== 'number' || Number.isNaN(monto) || monto < 0) {
        return res.status(400).json({
          message: 'El monto debe ser un número mayor o igual a 0'
        });
      }
    }

    // Validación de URL del PDF 
    if (urlPdf) {
      try {
        new URL(urlPdf);
      } catch {
        return res.status(400).json({
          message: 'La URL del PDF no es válida'
        });
      }
    }

    const mascota = await Mascota.findById(mascotaId);

    if (!mascota) {
      return res.status(404).json({ message: 'Mascota no encontrada' });
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
      fecha: fechaValida,
      hora: hora.trim(),
      categoriaServicio,
      motivoConsulta: motivoConsulta.trim(),
      anotaciones: anotaciones.trim(),
      monto: monto ?? 0,
      urlPdf: urlPdf?.trim() || null
    });

    await nuevoHistorial.save();

    // Crear FichaMedica automáticamente si no existe
    const fichaExistente = await FichaMedica.findOne({ mascotaId })
    if (!fichaExistente) {
      await FichaMedica.create({
        mascotaId,
        dueñoId: mascota.dueñoId
      })
    }

    return res.status(201).json({
      message: 'Historial clínico creado correctamente',
      historial: nuevoHistorial
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map((e) => e.message);

      return res.status(400).json({
        message: 'Error de validación',
        errores
      });
    }

    console.error('Error al crear historial clínico:', error);

    return res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
};
