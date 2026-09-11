import FichaMedica from '../models/FichaMedica.js'
import Mascota from '../models/Mascota.js'

export const obtenerFichaMedica = async (req, res) => {
  try {
    const { mascotaId } = req.params

    const fichaMedica = await FichaMedica.findOne({ mascotaId })
      .populate('dueñoId', 'nombre email')

    // Si no existe todavía no es un error
    // significa que la mascota no tuvo consultas aún
    if (!fichaMedica) {
      return res.status(200).json({
        success: true,
        data: null,
        message: 'Esta mascota todavía no tiene ficha médica'
      })
    }

    return res.status(200).json({
      success: true,
      data: fichaMedica
    })

  } catch (error) {
    console.error('Error en obtenerFichaMedica:', error)
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}

export const actualizarFichaMedica = async (req, res) => {
  try {
    const { mascotaId } = req.params
    const {
      colorPelaje,
      microchip,
      enfermedadesCronicas,
      cirugiasPrevias,
      medicamentosHabituales
    } = req.body

    // Buscar si existe la ficha
    let fichaMedica = await FichaMedica.findOne({ mascotaId })

    if (!fichaMedica) {
      // Si no existe la creamos en este momento
      const mascota = await Mascota.findById(mascotaId)
      if (!mascota) {
        return res.status(404).json({
          success: false,
          message: 'Mascota no encontrada'
        })
      }

      fichaMedica = new FichaMedica({
        mascotaId,
        dueñoId: mascota.dueñoId
      })
    }

    // Actualizar solo los campos que vienen en el body
    if (colorPelaje !== undefined) fichaMedica.colorPelaje = colorPelaje.trim()
    if (microchip !== undefined) fichaMedica.microchip = microchip.trim()
    if (enfermedadesCronicas !== undefined) fichaMedica.enfermedadesCronicas = enfermedadesCronicas.trim()
    if (cirugiasPrevias !== undefined) fichaMedica.cirugiasPrevias = cirugiasPrevias.trim()
    if (medicamentosHabituales !== undefined) fichaMedica.medicamentosHabituales = medicamentosHabituales.trim()

    await fichaMedica.save()

    return res.status(200).json({
      success: true,
      data: fichaMedica
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
    console.error('Error en actualizarFichaMedica:', error)
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    })
  }
}