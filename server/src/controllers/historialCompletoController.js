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

import mongoose from 'mongoose'

export const obtenerHistorialCompleto = async (req, res) => {
  try {
    const { mascotaId } = req.params

    if (!mascotaId || !mongoose.Types.ObjectId.isValid(mascotaId)) {
      return res.status(400).json({ success: false, message: 'ID no válido' })
    }

    // Leemos páginas y límites independientes por query params
    const limitVacunas = parseInt(req.query.limitVacunas, 10) || 10
    const pageVacunas = parseInt(req.query.pageVacunas, 10) || 1
    const skipVacunas = (pageVacunas - 1) * limitVacunas

    const limitEstudios = parseInt(req.query.limitEstudios, 10) || 10
    const pageEstudios = parseInt(req.query.pageEstudios, 10) || 1
    const skipEstudios = (pageEstudios - 1) * limitEstudios

    const [mascota, fichaMedica, historialClinicoRaw, vacunasRaw, estudiosRaw, totalVacunas, totalEstudios] = await Promise.all([
      Mascota.findById(mascotaId).populate('dueñoId', 'name email telefono'),
      FichaMedica.findOne({ mascotaId }),
      HistorialClinico.find({ mascotaId }).populate('veterinariaId', 'nombre direccion').sort({ fecha: -1 }),

      // Ordenados por fecha descendente (más nuevo primero) + paginación:
      Vacuna.find({ mascotaId }).sort({ fechaAplicada: -1 }).skip(skipVacunas).limit(limitVacunas),
      Estudio.find({ mascotaId }).sort({ fecha: -1 }).skip(skipEstudios).limit(limitEstudios),

      // Conteo total para que el front sepa si hay más o ya llegó al final
      Vacuna.countDocuments({ mascotaId }),
      Estudio.countDocuments({ mascotaId })
    ])

    if (!mascota) {
      return res.status(404).json({ success: false, message: 'Mascota no encontrada' })
    }

    // Cruce de profesionales (lo que ya tenías)
    const idsVeterinarias = [
      ...new Set([
        ...historialClinicoRaw.map(h => (h.veterinariaId?._id || h.veterinariaId)?.toString()).filter(Boolean),
        ...vacunasRaw.map(v => v.veterinariaId?.toString()).filter(Boolean),
        ...estudiosRaw.map(e => e.veterinariaId?.toString()).filter(Boolean)
      ])
    ]

    const veterinarias = await Veterinaria.find({ _id: { $in: idsVeterinarias } }).select('profesionales')
    const veterinariasPorId = new Map(veterinarias.map(v => [v._id.toString(), v]))

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
        estudios,
        pagination: {
          vacunas: {
            page: pageVacunas,
            hasMore: skipVacunas + vacunas.length < totalVacunas,
            total: totalVacunas
          },
          estudios: {
            page: pageEstudios,
            hasMore: skipEstudios + estudios.length < totalEstudios,
            total: totalEstudios
          }
        }
      }
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, message: 'Error interno del servidor' })
  }
}