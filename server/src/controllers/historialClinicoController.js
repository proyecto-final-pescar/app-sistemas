import mongoose from 'mongoose';
import HistorialClinico from '../models/HistorialClinico.js';
import Mascota from '../models/Mascota.js';
import Veterinaria from '../models/Veterinaria.js';
import FichaMedica from '../models/FichaMedica.js';
import Turno from '../models/Turno.js';
import { CATEGORIAS_SERVICIO } from '../constants/categoriasServicio.js';


export const obtenerHistorialClinico = async (req, res) => {
  try {
    const mascotaId = req.params.mascotaId || req.params.id;
    const filtro = { mascotaId };

    if (req.historialAccess?.rol === 'veterinaria') {
      filtro.veterinariaId = req.historialAccess.veterinariaId;
    }

    const historial = await HistorialClinico.find(filtro)
      .populate('veterinariaId', 'nombre')
      .sort({ fecha: -1, hora: -1 });

    const veterinariaIds = [...new Set(historial.map((h) => h.veterinariaId?._id?.toString() || h.veterinariaId?.toString()))];
    const veterinarias = await Veterinaria.find({ _id: { $in: veterinariaIds } }).select('profesionales');
    const mapaVeterinarias = new Map(veterinarias.map((v) => [v._id.toString(), v]));

    const data = historial.map((entrada) => {
      const idVet = entrada.veterinariaId?._id?.toString() || entrada.veterinariaId?.toString();
      const vet = mapaVeterinarias.get(idVet);
      const profesional = vet?.profesionales.id(entrada.profesionalId);
      return {
        ...entrada.toObject(),
        profesionalNombre: profesional?.nombre || null
      };
    });

    return res.status(200).json({ success: true, data })
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


// Devuelve los turnos de esta mascota, con ESTA veterinaria (la del usuario
// logueado), que están en condiciones de registrar una consulta:
//   - estado 'confirmado' : un turno tiene que estar
//     confirmado para poder registrar la consulta a partir de él
//   - todavía no tienen un HistorialClinico creado con ese turnoId, evita que se haga mas de un registro de consulta para un mismo turno 

export const obtenerTurnosPendientesRegistro = async (req, res) => {
  try {
    const { mascotaId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(mascotaId)) {
      return res.status(400).json({ message: 'La mascota es inválida' });
    }

    const veterinaria = await Veterinaria.findOne({ usuarioId: req.user.id });

    if (!veterinaria) {
      return res.status(404).json({
        message: 'No se encontró una veterinaria asociada a este usuario'
      });
    }

    const turnos = await Turno.find({
      mascotaId,
      veterinariaId: veterinaria._id,
      estado: 'confirmado'
    }).sort({ fecha: -1, hora: -1 });

    if (turnos.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    const turnoIds = turnos.map((t) => t._id);

    // Turnos que YA tienen un historial clínico cargado -> se excluyen
    const turnoIdsConHistorial = await HistorialClinico.distinct('turnoId', {
      turnoId: { $in: turnoIds }
    });
    const idsConHistorial = new Set(
      turnoIdsConHistorial.map((id) => id.toString())
    );

    const turnosPendientes = turnos.filter(
      (turno) => !idsConHistorial.has(turno._id.toString())
    );

    // profesionalId es un ObjectId de un subdocumento embebido en
    // Veterinaria.profesionales, sin ref -> se resuelve a mano.
    const data = turnosPendientes.map((turno) => {
      const profesional = turno.profesionalId
        ? veterinaria.profesionales.id(turno.profesionalId)
        : null;

      return {
        id: turno._id,
        fecha: turno.fecha,
        hora: turno.hora,
        estado: turno.estado,
        motivo: turno.motivo || null,
        profesional: {
          id: profesional?._id || null,
          nombre: profesional?.nombre || 'Sin asignar'
        }
      };
    });

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error en GET /historial-clinico/turnos-pendientes/:mascotaId:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
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

    if (!mascotaId || !mongoose.Types.ObjectId.isValid(mascotaId)) {
      return res.status(400).json({ message: 'La mascota es inválida' });
    }

    if (!profesionalId || !mongoose.Types.ObjectId.isValid(profesionalId)) {
      return res.status(400).json({ message: 'El profesional es inválido' });
    }

    if (!turnoId || !mongoose.Types.ObjectId.isValid(turnoId)) {
      return res.status(400).json({ message: 'El turno es requerido' });
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

    if (!CATEGORIAS_SERVICIO.includes(categoriaServicio)) {
      return res.status(400).json({
        message: 'La categoría de servicio no es válida',
        categoriasValidas: CATEGORIAS_SERVICIO
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

    // El turno es la fuente de verdad de esta consulta: tiene que existir,
    // ser de ESTA veterinaria, ser de ESTA mascota, y estar 'confirmado'.
    const turno = await Turno.findOne({
      _id: turnoId,
      veterinariaId: veterinaria._id
    });

    if (!turno) {
      return res.status(404).json({
        message: 'El turno no existe o no pertenece a esta veterinaria'
      });
    }

    if (turno.mascotaId?.toString() !== mascotaId) {
      return res.status(400).json({
        message: 'El turno no corresponde a esta mascota'
      });
    }

    if (turno.estado !== 'confirmado') {
      return res.status(400).json({
        message: 'Solo se puede registrar una consulta a partir de un turno confirmado'
      });
    }

    // Validar que el profesional exista dentro del listado de la veterinaria
    const profesional = veterinaria.profesionales.id(profesionalId);

    if (!profesional) {
      return res.status(404).json({
        message: 'El profesional seleccionado no pertenece a esta veterinaria'
      });
    }

    if (turno.profesionalId?.toString() !== profesional._id.toString()) {
      return res.status(400).json({
        message: 'El profesional no coincide con el profesional asignado al turno'
      });
    }

    const nuevoHistorial = new HistorialClinico({
      mascotaId,
      usuarioId: mascota.dueñoId,
      profesionalId: profesional._id,
      veterinariaId: veterinaria._id,
      turnoId,
      fecha: fechaValida,
      hora: hora.trim(),
      categoriaServicio,
      motivoConsulta: motivoConsulta.trim(),
      anotaciones: anotaciones.trim(),
      monto: monto ?? 0,
      urlPdf: urlPdf?.trim() || null
    });

    await nuevoHistorial.save();

    // El turno pasa de confirmado a atendido una vez que la consulta
    // quedó registrada.
    turno.estado = 'atendido';
    await turno.save();

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

    
    if (error.code === 11000 && error.keyPattern?.turnoId) {
      return res.status(409).json({
        message: 'Ya existe una consulta registrada para este turno'
      });
    }

    console.error('Error al crear historial clínico:', error);

    return res.status(500).json({
      message: 'Error interno del servidor'
    });
  }
};

export const actualizarHistorialClinico = async (req, res) => {
  try {
    const historialClinico = await HistorialClinico.findById(req.params.id)

    if (!historialClinico) {
      return res.status(404).json({
        success: false,
        message: 'Consulta no encontrada'
      })
    }

    const veterinaria = await Veterinaria.findOne({ usuarioId: req.user.id })
    
    if (!veterinaria || historialClinico.veterinariaId.toString() !== veterinaria._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Solo podés editar consultas de tu veterinaria'
      })
    }

    // Extraer solo los campos permitidos
    const {
      fecha,
      hora,
      categoriaServicio,
      motivoConsulta,
      anotaciones,
      monto,
      urlPdf
    } = req.body

    // Validar y actualizar solo campos que vienen y no están vacíos
    if (fecha !== undefined) {
      const fechaValida = new Date(fecha)
      if (isNaN(fechaValida.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'La fecha no es válida'
        })
      }
      historialClinico.fecha = fechaValida
    }

    if (hora !== undefined) {
      if (!hora.trim()) {
        return res.status(400).json({
          success: false,
          message: 'La hora no puede estar vacía'
        })
      }
      const formatoHora = /^([01]\d|2[0-3]):([0-5]\d)$/
      if (!formatoHora.test(hora.trim())) {
        return res.status(400).json({
          success: false,
          message: 'La hora debe tener formato HH:MM'
        })
      }
      historialClinico.hora = hora.trim()
    }

    if (categoriaServicio !== undefined) {
      if (!CATEGORIAS_SERVICIO.includes(categoriaServicio)) {
        return res.status(400).json({
          success: false,
          message: 'Categoría de servicio no válida',
          categoriasValidas: CATEGORIAS_SERVICIO
        })
      }
      historialClinico.categoriaServicio = categoriaServicio
    }

    if (motivoConsulta !== undefined) {
      if (!motivoConsulta.trim()) {
        return res.status(400).json({
          success: false,
          message: 'El motivo de consulta no puede estar vacío'
        })
      }
      historialClinico.motivoConsulta = motivoConsulta.trim()
    }

    if (anotaciones !== undefined) {
      if (!anotaciones.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Las anotaciones no pueden estar vacías'
        })
      }
      historialClinico.anotaciones = anotaciones.trim()
    }

    if (monto !== undefined) {
      if (typeof monto !== 'number' || isNaN(monto) || monto < 0) {
        return res.status(400).json({
          success: false,
          message: 'El monto debe ser un número mayor o igual a 0'
        })
      }
      historialClinico.monto = monto
    }

    if (urlPdf !== undefined) {
      if (urlPdf && urlPdf.trim()) {
        try {
          new URL(urlPdf)
        } catch {
          return res.status(400).json({
            success: false,
            message: 'La URL del PDF no es válida'
          })
        }
        historialClinico.urlPdf = urlPdf.trim()
      } else {
        historialClinico.urlPdf = null
      }
    }

    await historialClinico.save()

    return res.status(200).json({
      success: true,
      data: historialClinico
    })

  } catch (error) {
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map(e => e.message)
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errores
      })
    }
    console.error('Error en actualizarConsulta:', error)
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}