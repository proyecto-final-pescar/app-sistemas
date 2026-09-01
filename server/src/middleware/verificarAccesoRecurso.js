import Mascota from '../models/Mascota.js'
import Veterinaria from '../models/Veterinaria.js'

export const verificarAccesoRecurso = (Modelo) => async (req, res, next) => {
  try {
    const recurso = await Modelo.findById(req.params.id)

    if (!recurso) {
      return res.status(404).json({
        success: false,
        message: 'Recurso no encontrado'
      })
    }

    req.recurso = recurso

    if (req.user.rol === 'administrador') return next()

    if (req.user.rol === 'dueno') {
      const mascota = await Mascota.findById(recurso.mascotaId)
      if (!mascota || mascota.dueñoId.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'No tenés permiso para acceder a este recurso'
        })
      }
      return next()
    }

    if (req.user.rol === 'veterinaria') {
      const veterinaria = await Veterinaria.findOne({ usuarioId: req.user.id })
      if (!veterinaria) {
        return res.status(403).json({
          success: false,
          message: 'No tenés permiso para acceder a este recurso'
        })
      }
      return next()
    }

    return res.status(403).json({
      success: false,
      message: 'No tenés permiso para acceder a este recurso'
    })

  } catch (error) {
    console.error('Error en verificarAccesoRecurso:', error)
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}