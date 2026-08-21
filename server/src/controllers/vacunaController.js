import Vacuna from '../models/Vacuna.js'
import Mascota from '../models/Mascota.js'
import Veterinaria from '../models/Veterinaria.js'

const conNombreProfesional = async (vacunas) => {
  const veterinariaIds = [...new Set(vacunas.map((v) => v.veterinariaId.toString()))]
  const veterinarias = await Veterinaria.find({ _id: { $in: veterinariaIds } }).select('profesionales')
  const mapaVeterinarias = new Map(veterinarias.map((v) => [v._id.toString(), v]))

  return vacunas.map((vacuna) => {
    const vet = mapaVeterinarias.get(vacuna.veterinariaId.toString())
    const profesional = vet?.profesionales.id(vacuna.profesionalId)
    return {
      ...vacuna.toObject(),
      profesionalNombre: profesional?.nombre || null
    }
  })
}

export const crearVacuna = async (req, res) => {
  try {
    const { mascotaId, historialClinicoId, nombre, fechaAplicada, profesionalId } = req.body

    if (!mascotaId || !nombre || !fechaAplicada || !profesionalId) {
      return res.status(400).json({
        success: false,
        message: 'mascotaId, nombre, fechaAplicada y profesionalId son requeridos'
      })
    }

    const fechaValida = new Date(fechaAplicada)
    if (isNaN(fechaValida.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'La fecha de aplicación no es válida'
      })
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

    const vacuna = new Vacuna({
      mascotaId,
      dueñoId: mascota.dueñoId,
      profesionalId: profesional._id,
      veterinariaId: veterinaria._id,
      historialClinicoId: historialClinicoId || null,
      nombre: nombre.trim(),
      fechaAplicada: fechaValida
    })

    await vacuna.save()

    const [data] = await conNombreProfesional([vacuna])

    return res.status(201).json({ success: true, data })

  } catch (error) {
    if (error.name === 'ValidationError') {
      const errores = Object.values(error.errors).map((e) => e.message)
      return res.status(400).json({ success: false, message: 'Error de validación', errores })
    }
    console.error('Error en crearVacuna:', error)
    return res.status(500).json({ success: false, message: 'Error interno del servidor' })
  }
}

export const obtenerVacunasPorMascota = async (req, res) => {
  try {
    const { mascotaId } = req.params
    const vacunas = await Vacuna.find({ mascotaId })
      .populate('historialClinicoId', 'fecha categoriaServicio')
      .sort({ fechaAplicada: -1 })

    const data = await conNombreProfesional(vacunas)

    return res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('Error en obtenerVacunasPorMascota:', error)
    return res.status(500).json({ success: false, message: 'Error interno del servidor' })
  }
}

export const obtenerVacunaPorId = async (req, res) => {
  try {
    const vacuna = await Vacuna.findById(req.params.id)
      .populate('mascotaId', 'nombre especie')
      .populate('historialClinicoId', 'fecha categoriaServicio')

    if (!vacuna) {
      return res.status(404).json({ success: false, message: 'Vacuna no encontrada' })
    }

    const [data] = await conNombreProfesional([vacuna])

    return res.status(200).json({ success: true, data })
  } catch (error) {
    console.error('Error en obtenerVacunaPorId:', error)
    return res.status(500).json({ success: false, message: 'Error interno del servidor' })
  }
}

export const actualizarVacuna = async (req, res) => {
  try {
    const vacuna = await Vacuna.findById(req.params.id)
    if (!vacuna) {
      return res.status(404).json({ success: false, message: 'Vacuna no encontrada' })
    }

    const veterinaria = await Veterinaria.findOne({ usuarioId: req.user.id })
    if (!veterinaria || vacuna.veterinariaId.toString() !== veterinaria._id.toString()) {
      return res.status(403).json({ success: false, message: 'Solo podés editar vacunas de tu veterinaria' })
    }

    const { nombre, fechaAplicada, historialClinicoId, profesionalId } = req.body

    if (nombre !== undefined) {
      if (!nombre.trim()) {
        return res.status(400).json({ success: false, message: 'El nombre no puede estar vacío' })
      }
      vacuna.nombre = nombre.trim()
    }

    if (fechaAplicada !== undefined) {
      const fechaValida = new Date(fechaAplicada)
      if (isNaN(fechaValida.getTime())) {
        return res.status(400).json({ success: false, message: 'La fecha no es válida' })
      }
      vacuna.fechaAplicada = fechaValida
    }

    if (profesionalId !== undefined) {
      const profesional = veterinaria.profesionales.id(profesionalId)
      if (!profesional) {
        return res.status(404).json({ success: false, message: 'El profesional seleccionado no pertenece a esta veterinaria' })
      }
      vacuna.profesionalId = profesional._id
    }

    if (historialClinicoId !== undefined) vacuna.historialClinicoId = historialClinicoId || null

    await vacuna.save()

    const [data] = await conNombreProfesional([vacuna])

    return res.status(200).json({ success: true, data })

  } catch (error) {
    console.error('Error en actualizarVacuna:', error)
    return res.status(500).json({ success: false, message: 'Error interno del servidor' })
  }
}

export const eliminarVacuna = async (req, res) => {
  try {
    const vacuna = await Vacuna.findById(req.params.id)
    if (!vacuna) {
      return res.status(404).json({ success: false, message: 'Vacuna no encontrada' })
    }

    const veterinaria = await Veterinaria.findOne({ usuarioId: req.user.id })
    if (!veterinaria || vacuna.veterinariaId.toString() !== veterinaria._id.toString()) {
      return res.status(403).json({ success: false, message: 'Solo podés eliminar vacunas de tu veterinaria' })
    }

    await vacuna.deleteOne()

    return res.status(200).json({ success: true, message: 'Vacuna eliminada correctamente' })
  } catch (error) {
    console.error('Error en eliminarVacuna:', error)
    return res.status(500).json({ success: false, message: 'Error interno del servidor' })
  }
}