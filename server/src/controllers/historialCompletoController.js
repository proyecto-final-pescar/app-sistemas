import Mascota from '../models/Mascota.js'
import FichaMedica from '../models/FichaMedica.js'
import HistorialClinico from '../models/HistorialClinico.js'
import Vacuna from '../models/Vacuna.js'
import Estudio from '../models/Estudio.js'
import Veterinaria from '../models/Veterinaria.js'

const resolverNombresProfesionales = (items, veterinariasPorId) => {
  return items.map((item) => {
    const obj = item.toObject ? item.toObject() : item
    const veterinaria = veterinariasPorId.get((obj.veterinariaId?._id || obj.veterinariaId)?.toString())
    const profesional = veterinaria && obj.profesionalId
      ? veterinaria.profesionales.id(obj.profesionalId)
      : null

    return {
      ...obj,
      profesionalId: profesional
        ? { _id: profesional._id, nombre: profesional.nombre }
        : null
    }
  })
}

const resolverProfesionalHistorial = (items, veterinariasPorId) => {
  return items.map((item) => {
    const obj = item.toObject ? item.toObject() : item
    const idVeterinaria = obj.veterinariaId?._id?.toString() || obj.veterinariaId?.toString()
    const veterinaria = veterinariasPorId.get(idVeterinaria)
    const profesional = veterinaria && obj.profesionalId
      ? veterinaria.profesionales.id(obj.profesionalId)
      : null

    return {
      ...obj,
      profesionalNombre: profesional?.nombre || null
    }
  })
}

export const obtenerHistorialCompleto = async (req, res) => {
  try {
    const { mascotaId } = req.params

    const [mascota, fichaMedica, historialClinicoRaw, vacunasRaw, estudiosRaw] = await Promise.all([

      Mascota.findById(mascotaId)
        .populate('dueñoId', 'name email telefono'),

      FichaMedica.findOne({ mascotaId }),

      HistorialClinico.find({ mascotaId })
        .populate('veterinariaId', 'nombre direccion')
        .sort({ fecha: -1 }),

      Vacuna.find({ mascotaId })
        .sort({ fechaAplicada: -1 }),

      Estudio.find({ mascotaId })
        .sort({ fecha: -1 })
    ])

    if (!mascota) {
      return res.status(404).json({
        success: false,
        message: 'Mascota no encontrada'
      })
    }

  
    const idsVeterinarias = [
      ...new Set([
        ...historialClinicoRaw.map(h => (h.veterinariaId?._id || h.veterinariaId)?.toString()).filter(Boolean),
        ...vacunasRaw.map(v => v.veterinariaId?.toString()).filter(Boolean),
        ...estudiosRaw.map(e => e.veterinariaId?.toString()).filter(Boolean)
      ])
    ]

    const veterinarias = await Veterinaria.find({ _id: { $in: idsVeterinarias } })
      .select('profesionales')

    const veterinariasPorId = new Map(
      veterinarias.map(v => [v._id.toString(), v])
    )

    const historialClinico = resolverProfesionalHistorial(historialClinicoRaw, veterinariasPorId)
    const vacunas = resolverNombresProfesionales(vacunasRaw, veterinariasPorId)
    const estudios = resolverNombresProfesionales(estudiosRaw, veterinariasPorId)

    return res.status(200).json({
      success: true,
      data: {
        mascota,
        fichaMedica,
        historialClinico,
        vacunas,
        estudios
      }
    })

  } catch (error) {
    console.error('Error en obtenerHistorialCompleto:', error)
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}