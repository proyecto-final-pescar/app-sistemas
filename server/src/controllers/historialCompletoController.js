import Mascota from '../models/Mascota.js'
import FichaMedica from '../models/FichaMedica.js'
import HistorialClinico from '../models/HistorialClinico.js'
import Vacuna from '../models/Vacuna.js'
import Estudio from '../models/Estudio.js'

export const obtenerHistorialCompleto = async (req, res) => {
  try {
    const { mascotaId } = req.params

    // Todas las consultas en paralelo para mayor velocidad
    const [mascota, fichaMedica, historialClinico, vacunas, estudios] = await Promise.all([
      
      Mascota.findById(mascotaId)
        
        .populate('dueñoId', 'name email telefono'),

      FichaMedica.findOne({ mascotaId }),

      HistorialClinico.find({ mascotaId })
        .populate('profesionalId', 'nombre')
        .populate('veterinariaId', 'nombre direccion')
        .sort({ fecha: -1 }),

      Vacuna.find({ mascotaId })
        .populate('profesionalId', 'nombre')
        .sort({ fechaAplicada: -1 }),

      Estudio.find({ mascotaId })
        .populate('profesionalId', 'nombre')
        .sort({ fecha: -1 })
    ])

    if (!mascota) {
      return res.status(404).json({
        success: false,
        message: 'Mascota no encontrada'
      })
    }

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