import Estudio from '../models/Estudio.js'
import Mascota from '../models/Mascota.js'
import Veterinaria from '../models/Veterinaria.js'

// Resuelve el nombre del profesional para una lista de estudios,
// agrupando por veterinaria para no repetir consultas.
const conNombreProfesional = async (estudios) => {
  const veterinariaIds = [...new Set(estudios.map((e) => e.veterinariaId.toString()))]
  const veterinarias = await Veterinaria.find({ _id: { $in: veterinariaIds } }).select('profesionales')
  const mapaVeterinarias = new Map(veterinarias.map((v) => [v._id.toString(), v]))

  return estudios.map((estudio) => {
    const vet = mapaVeterinarias.get(estudio.veterinariaId.toString())
    const profesional = vet?.profesionales.id(estudio.profesionalId)
    return {
      ...estudio.toObject(),
      profesionalNombre: profesional?.nombre || null
    }
  })
}

export const crearEstudio = async (req, res) => {
  try {
    const { mascotaId, historialClinicoId, nombre, fecha, urlArchivo, profesionalId } = req.body

    if (!mascotaId || !nombre || !fecha || !profesionalId) {
      return res.status(400).json({
        success: false,
        message: 'mascotaId, nombre, fecha y profesionalId son requeridos'
      })
    }

    const fechaValida = new Date(fecha)
    if (isNaN(fechaValida.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'La fecha no es válida'
      })
    }

    if (urlArchivo) {
      try {
        new URL(urlArchivo)
      } catch {
        return res.status(400).json({
          success: false,
          message: 'La URL del archivo no es válida'
        })
      }
    }

    const mascota = await Mascota.findById(mascotaId)
    if (!mascota) {
      return res.status(404).json({
        success: false,
        message: 'Mascota no encontrada'
      })
    }

    const veterinaria = await Veterinaria.findOne({ usuarioId: req.user.id })
    if (!veterinaria) {
      return res.status(404).json({
        success: false,
        message: 'No se encontró una veterinaria asociada a este usuario'
      })
    }

    const profesional = veterinaria.profesionales.id(profesionalId)
    if (!profesional) {
      return res.status(404).json({
        success: false,
        message: 'El profesional seleccionado no pertenece a esta veterinaria'
      })
    }

    const estudio = new Estudio({
      mascotaId,
      dueñoId: mascota.dueñoId,
      profesionalId: profesional._id,
      veterinariaId: veterinaria._id,
      historialClinicoId: historialClinicoId || null,
      nombre: nombre.trim(),
      fecha: fechaValida,
      urlArchivo: urlArchivo?.trim() || null
    })

    await estudio.save()

    const [data] = await conNombreProfesional([estudio])

    return res.status(201).json({ success: true, data })

  } catch (error) {
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map((e) => e.message)
      return res.status(400).json({ success: false, message: 'Error de validación', errores })
    }
    console.error('Error en crearEstudio:', error)
    return res.status(500).json({ success: false, message: 'Error interno del servidor' })
  }
}

export const obtenerEstudiosPorMascota = async (req, res) => {
  try {
    const { mascotaId } = req.params
    const estudios = await Estudio.find({ mascotaId })
      .populate('historialClinicoId', 'fecha categoriaServicio')
      .sort({ fecha: -1 })

    const data = await conNombreProfesional(estudios)

    return res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('Error en obtenerEstudiosPorMascota:', error)
    return res.status(500).json({ success: false, message: 'Error interno del servidor' })
  }
}

export const obtenerEstudioPorId = async (req, res) => {
  try {
    const estudio = await Estudio.findById(req.params.id)
      .populate('mascotaId', 'nombre especie')
      .populate('historialClinicoId', 'fecha categoriaServicio')

    if (!estudio) {
      return res.status(404).json({ success: false, message: 'Estudio no encontrado' })
    }

    const [data] = await conNombreProfesional([estudio])

    return res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('Error en obtenerEstudioPorId:', error)
    return res.status(500).json({ success: false, message: 'Error interno del servidor' })
  }
}

export const eliminarEstudio = async (req, res) => {
  try {
    const estudio = await Estudio.findById(req.params.id)
    if (!estudio) {
      return res.status(404).json({ success: false, message: 'Estudio no encontrado' })
    }

    const veterinaria = await Veterinaria.findOne({ usuarioId: req.user.id })
    if (!veterinaria || estudio.veterinariaId.toString() !== veterinaria._id.toString()) {
      return res.status(403).json({ success: false, message: 'Solo podés eliminar estudios de tu veterinaria' })
    }

    await estudio.deleteOne()

    return res.status(200).json({ success: true, message: 'Estudio eliminado correctamente' })
  } catch (error) {
    console.error('Error en eliminarEstudio:', error)
    return res.status(500).json({ success: false, message: 'Error interno del servidor' })
  }
}

export const actualizarEstudio = async (req, res) => {
  try {
    const estudio = await Estudio.findById(req.params.id)
    if (!estudio) {
      return res.status(404).json({ success: false, message: 'Estudio no encontrado' })
    }

    const veterinaria = await Veterinaria.findOne({ usuarioId: req.user.id })
    if (!veterinaria || estudio.veterinariaId.toString() !== veterinaria._id.toString()) {
      return res.status(403).json({ success: false, message: 'Solo podés editar estudios de tu veterinaria' })
    }

    const { nombre, fecha, urlArchivo, historialClinicoId, profesionalId } = req.body

    if (nombre !== undefined) {
      if (!nombre.trim()) {
        return res.status(400).json({ success: false, message: 'El nombre no puede estar vacío' })
      }
      estudio.nombre = nombre.trim()
    }

    if (fecha !== undefined) {
      const fechaValida = new Date(fecha)
      if (isNaN(fechaValida.getTime())) {
        return res.status(400).json({ success: false, message: 'La fecha no es válida' })
      }
      estudio.fecha = fechaValida
    }

    if (profesionalId !== undefined) {
      const profesional = veterinaria.profesionales.id(profesionalId)
      if (!profesional) {
        return res.status(404).json({ success: false, message: 'El profesional seleccionado no pertenece a esta veterinaria' })
      }
      estudio.profesionalId = profesional._id
    }

    if (urlArchivo !== undefined) {
      if (urlArchivo && urlArchivo.trim()) {
        try {
          new URL(urlArchivo)
        } catch {
          return res.status(400).json({ success: false, message: 'La URL del archivo no es válida' })
        }
        estudio.urlArchivo = urlArchivo.trim()
      } else {
        estudio.urlArchivo = null
      }
    }

    if (historialClinicoId !== undefined) estudio.historialClinicoId = historialClinicoId || null

    await estudio.save()

    const [data] = await conNombreProfesional([estudio])

    return res.status(200).json({ success: true, data })

  } catch (error) {
    console.error('Error en actualizarEstudio:', error)
    return res.status(500).json({ success: false, message: 'Error interno del servidor' })
  }
}